-- ============================================================================
-- Skema Pangkalan Data & Polisi Keselamatan (RLS) Supabase
-- Sistem Deklarasi Kesihatan Staf
--
-- ARAHAN:
-- 1. Buka Supabase Dashboard > SQL Editor > New Query
-- 2. Tampal keseluruhan skrip ini dan klik RUN.
-- 3. Matikan "Allow new users to sign up" di Authentication > Providers > Email
--    supaya tiada pendaftaran sendiri oleh orang luar.
-- 4. Cipta akaun Pentadbir pertama di Authentication > Users > Add user
--    (contoh: nama@jupem.gov.my, Auto Confirm User = ON), kemudian jalankan:
--      update public.profiles p
--      set role = 'admin', full_name = 'Pentadbir Utama'
--      from auth.users u
--      where p.id = u.id and lower(u.email) = 'nama@jupem.gov.my';
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Jadual Profil Pengguna (dipautkan ke auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text,
  full_name text,
  department text,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);

-- 2. Jadual Deklarasi Kesihatan Staf (satu rekod terkini bagi setiap staf)
create table if not exists public.health_declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  full_name text not null,
  ic_number text not null check (ic_number ~ '^\d{12}$'),
  birth_date date not null,
  age integer not null check (age >= 0 and age <= 120),
  gender text not null check (gender in ('Lelaki', 'Perempuan')),
  department text,
  phone text,
  health_status text not null check (
    health_status in ('Sihat', 'Mempunyai Masalah Kesihatan', 'Dalam Pemantauan / Rawatan')
  ),
  conditions text[] not null default '{}',
  other_conditions text,
  medications text,
  emergency_contact text,
  notes text,
  confirmed_accurate boolean not null default true,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_health_user_id on public.health_declarations(user_id);
create index if not exists idx_health_status on public.health_declarations(health_status);

-- 3. Fungsi pembantu updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_health_updated_at on public.health_declarations;
create trigger trg_health_updated_at
  before update on public.health_declarations
  for each row execute function public.set_updated_at();

-- 4. Fungsi semakan peranan (SECURITY DEFINER supaya tiada rekursi RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  );
$$;

-- 5. Trigger automatik cipta profil apabila pengguna ditambah dalam auth.users
--    Nota keselamatan: role sentiasa dibaca daripada raw_app_meta_data (hanya server/dashboard boleh tulis)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_full_name text;
  v_department text;
  v_role text;
begin
  v_username := lower(coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(coalesce(new.email, new.id::text), '@', 1)
  ));
  v_full_name := nullif(trim(new.raw_user_meta_data->>'full_name'), '');
  v_department := nullif(trim(new.raw_user_meta_data->>'department'), '');
  v_role := case
    when new.raw_app_meta_data->>'role' = 'admin' then 'admin'
    else 'staff'
  end;

  insert into public.profiles (id, username, email, full_name, department, role, is_active)
  values (new.id, v_username, lower(new.email), v_full_name, v_department, v_role, true)
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Aktifkan Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.health_declarations enable row level security;

-- Polisi Jadual PROFILES:
-- Staf hanya boleh melihat profil sendiri; Admin boleh melihat dan mengemas kini semua profil.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_admin_only" on public.profiles;
create policy "profiles_update_admin_only"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Polisi Jadual HEALTH_DECLARATIONS:
-- Staf hanya boleh lihat, isi dan kemaskini deklarasi MILIK SENDIRI sahaja.
-- Admin boleh lihat semua deklarasi dan padam jika perlu.
drop policy if exists "health_select_own_or_admin" on public.health_declarations;
create policy "health_select_own_or_admin"
  on public.health_declarations
  for select
  to authenticated
  using ((auth.uid() = user_id and public.is_active_user()) or public.is_admin());

drop policy if exists "health_insert_own" on public.health_declarations;
create policy "health_insert_own"
  on public.health_declarations
  for insert
  to authenticated
  with check (auth.uid() = user_id and public.is_active_user());

drop policy if exists "health_update_own" on public.health_declarations;
create policy "health_update_own"
  on public.health_declarations
  for update
  to authenticated
  using (auth.uid() = user_id and public.is_active_user())
  with check (auth.uid() = user_id and public.is_active_user());

drop policy if exists "health_delete_admin_only" on public.health_declarations;
create policy "health_delete_admin_only"
  on public.health_declarations
  for delete
  to authenticated
  using (public.is_admin());
