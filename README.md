# MySIHAT-JUPEM — Sistem Pengisytiharan Kesihatan Staf

Aplikasi web statik (HTML, CSS, dan JavaScript) yang dihubungkan ke **Supabase** untuk pengurusan pengisytiharan kesihatan staf dalam dwibahasa (**Bahasa Melayu baku mengikut Dewan Bahasa dan Pustaka** serta **Bahasa Inggeris**).

## Ciri-ciri Utama

- **Dwibahasa (BM / EN) serta Animasi Halus:** Penukar bahasa `BM | EN` disediakan pada skrin log masuk dan bar navigasi atas, berserta animasi peralihan paparan, kad KPI, kiraan automatik Kad Pengenalan, modal, dan pemberitahuan.
- **Log Masuk Staf dan Pentadbir (Tiada Pendaftaran Sendiri):** Hanya Pentadbir dibenarkan mencipta akaun staf (ID Pengguna dan Kata Laluan).
- **Kiraan Automatik Nombor Kad Pengenalan Malaysia:** Apabila staf memasukkan Nombor Kad Pengenalan (`YYMMDD-PB-###G`), sistem terus mengesahkan dan mengira **Umur**, **Tarikh Lahir**, **Jantina**, dan **Negeri Kelahiran**.
- **Privasi Terjamin (Row Level Security):** Staf hanya dapat melihat, mengisi, dan mengemas kini pengisytiharan kesihatan **milik sendiri sahaja**. Hanya **Pentadbir** boleh melihat rekod semua staf.
- **Maklumat Kesihatan Lengkap:** Status kesihatan (`Sihat`, `Dalam Pemantauan atau Rawatan`, `Mempunyai Masalah Kesihatan`), senarai penyakit lazim, penyakit lain, ubat-ubatan yang sedang diambil, maklumat waris kecemasan, dan catatan tambahan.
- **Panel Pentadbir:**
  - Kad ringkasan statistik staf (jumlah akaun, sudah atau belum mengisi, status sihat, dan masalah kesihatan).
  - Jadual semua staf dengan carian serta penapis mengikut status kesihatan atau penyakit.
  - Eksport laporan ke **CSV (UTF-8)**, **Excel (`.xls`)**, atau **Cetak**.
  - Pengurusan akaun staf: tambah akaun, jana kata laluan rawak, set semula kata laluan, aktif atau nyahaktifkan akaun, dan padam akaun.

---

## 1. Uji Segera di Komputer (Mod Simulasi Tempatan)

Selagi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dalam [js/config.js](js/config.js) dibiarkan kosong (`""`), aplikasi akan berjalan secara **Mod Simulasi Tempatan** (`localStorage`).

Anda boleh membuka folder ini menggunakan pelayan web ringkas:

```powershell
cd D:\Naga\DeklarasiKesihatan
python -m http.server 8080
```

Kemudian buka pelayar web dan layari `http://localhost:8080`.

Akaun ujian sedia ada:
- **Pentadbir:** `admin` / `Admin@1234`
- **Staf (Sudah mengisi):** `aminah` / `Staf@1234`
- **Staf (Belum mengisi):** `farid` / `Staf@1234`

---

## 2. Sambungan ke Supabase Sebenar (Pengeluaran)

### Langkah 1: Cipta Projek Supabase
1. Daftar atau log masuk ke [Supabase](https://supabase.com) dan cipta projek baharu.

### Langkah 2: Jalankan Skrip Pangkalan Data dan RLS
1. Buka **SQL Editor** > **New Query** dalam Supabase Dashboard.
2. Salin keseluruhan kandungan fail [supabase/schema.sql](supabase/schema.sql), tampal dan tekan **Run**.

### Langkah 3: Matikan Pendaftaran Sendiri (Wajib)
1. Pergi ke **Authentication** > **Providers** > **Email**.
2. Pastikan tetapan **Allow new users to sign up** dimatikan (**OFF**), supaya orang luar tidak dapat mendaftar sendiri.
3. Simpan perubahan tersebut.

### Langkah 4: Cipta Akaun Pentadbir Pertama
1. Pergi ke **Authentication** > **Users** > **Add user** > **Create new user**.
2. Masukkan butiran berikut:
   - **Email:** `admin@staff.local` (gunakan domain yang sama dengan `AUTH_EMAIL_DOMAIN` dalam [js/config.js](js/config.js), atau alamat e-mel sebenar anda)
   - **Password:** kata laluan pilihan anda
   - Tandakan **Auto Confirm User** = **ON**
3. Buka semula **SQL Editor** dan jalankan arahan ini untuk menetapkan peranan kepada `admin`:
   ```sql
   update public.profiles
   set role = 'admin', full_name = 'Pentadbir Utama'
   where username = 'admin';
   ```

### Langkah 5: Pasang Edge Function `admin-users`
Fungsi [supabase/functions/admin-users/index.ts](supabase/functions/admin-users/index.ts) membolehkan Pentadbir menambah staf, menetapkan semula kata laluan, menyahaktifkan, dan memadamkan akaun secara terus melalui Panel Pentadbir.

**Cara A — Melalui Supabase CLI:**
```powershell
npm install -g supabase
supabase login
supabase link --project-ref <PROJECT_REF_ANDA>
supabase functions deploy admin-users --no-verify-jwt
```

**Cara B — Melalui Supabase Web Dashboard:**
1. Pergi ke **Edge Functions** > **Deploy a new function** > **Via Editor**.
2. Namakan fungsi tersebut sebagai `admin-users`.
3. Tampal kandungan fail [supabase/functions/admin-users/index.ts](supabase/functions/admin-users/index.ts) dan tekan **Deploy**.

### Langkah 6: Masukkan Kunci API ke `js/config.js`
1. Dalam Supabase Dashboard, pergi ke **Project Settings** > **API**.
2. Buka [js/config.js](js/config.js) dan isi `SUPABASE_URL` serta `SUPABASE_ANON_KEY`.
   *(Jangan sesekali meletakkan `service_role` key dalam fail `js/config.js`.)*

---

## 3. Pengehosan Statik Percuma (Vercel / Netlify / GitHub Pages)

- **Vercel:** Import folder `DeklarasiKesihatan` (`vercel.json` sudah tersedia).
- **Netlify:** Muat naik folder `DeklarasiKesihatan` ke Netlify (`netlify.toml` sudah tersedia).
- **GitHub Pages:** Muat naik semua fail ke repositori GitHub dan aktifkan **Settings > Pages**.

---

## 4. Menjalankan Ujian Automatik

```powershell
cd D:\Naga\DeklarasiKesihatan
node --test tests/core.test.cjs
```
