// Supabase Edge Function: admin-users
// Mengurus penciptaan akaun staf, reset kata laluan, aktif/nyahaktif, dan padam akaun.
// Hanya pengguna dengan peranan 'admin' (disahkan melalui JWT + jadual profiles) dibenarkan.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Kaedah permintaan tidak dibenarkan.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Konfigurasi pelayan Supabase tidak lengkap.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!jwt) {
      return jsonResponse({ error: 'Token pengesahan tiada.' }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 1. Sahkan identiti pemanggil daripada JWT
    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(jwt);
    if (callerErr || !callerData?.user) {
      return jsonResponse({ error: 'Sesi tidak sah atau telah tamat tempoh.' }, 401);
    }

    // 2. Pastikan pemanggil ialah Admin yang aktif dalam jadual profiles
    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', callerData.user.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
      return jsonResponse({ error: 'Akses ditolak: Hanya Admin dibenarkan.' }, 403);
    }

    const body = await req.json();
    const action = body?.action;

    if (action === 'create_user') {
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      const fullName = String(body.full_name || '').trim();
      const department = String(body.department || '').trim() || null;
      const role = body.role === 'admin' ? 'admin' : 'staff';
      const emailDomain = String(body.email_domain || 'jupem.gov.my').trim().toLowerCase();
      const rawEmail = String(body.email || '').trim().toLowerCase();

      if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
        return jsonResponse({
          error: 'ID Pengguna mestilah 3-32 aksara (huruf kecil, nombor, titik, _ atau - sahaja).'
        }, 400);
      }
      if (password.length < 6) {
        return jsonResponse({ error: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.' }, 400);
      }
      if (!fullName) {
        return jsonResponse({ error: 'Nama Penuh diperlukan.' }, 400);
      }

      const email = rawEmail || `${username}@${emailDomain}`;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({ error: 'Format alamat e-mel tidak sah.' }, 400);
      }

      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        return jsonResponse({ error: `ID Pengguna "${username}" sudah digunakan.` }, 409);
      }

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role },
        user_metadata: { username, full_name: fullName, department }
      });

      if (createErr || !created?.user) {
        return jsonResponse({
          error: createErr?.message || 'Gagal mencipta pengguna dalam Supabase Auth.'
        }, 400);
      }

      const { data: savedProfile, error: upsertErr } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: created.user.id,
          username,
          email,
          full_name: fullName,
          department,
          role,
          is_active: true
        })
        .select()
        .single();

      if (upsertErr) {
        return jsonResponse({ error: upsertErr.message }, 400);
      }

      return jsonResponse({ user: savedProfile }, 200);
    }

    if (action === 'reset_password') {
      const userId = String(body.user_id || '').trim();
      const newPassword = String(body.new_password || '');
      if (!userId || newPassword.length < 6) {
        return jsonResponse({ error: 'ID pengguna dan kata laluan (>= 6 aksara) diperlukan.' }, 400);
      }

      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });
      if (updErr) {
        return jsonResponse({ error: updErr.message }, 400);
      }
      return jsonResponse({ success: true }, 200);
    }

    if (action === 'toggle_active') {
      const userId = String(body.user_id || '').trim();
      const isActive = Boolean(body.is_active);
      if (!userId) {
        return jsonResponse({ error: 'ID pengguna diperlukan.' }, 400);
      }
      if (userId === callerProfile.id && !isActive) {
        return jsonResponse({ error: 'Anda tidak boleh menyahaktifkan akaun anda sendiri.' }, 400);
      }

      const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: isActive ? 'none' : '876000h'
      });
      if (banErr) {
        return jsonResponse({ error: banErr.message }, 400);
      }

      const { error: profErr } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);
      if (profErr) {
        return jsonResponse({ error: profErr.message }, 400);
      }

      return jsonResponse({ success: true }, 200);
    }

    if (action === 'delete_user') {
      const userId = String(body.user_id || '').trim();
      if (!userId) {
        return jsonResponse({ error: 'ID pengguna diperlukan.' }, 400);
      }
      if (userId === callerProfile.id) {
        return jsonResponse({ error: 'Anda tidak boleh memadam akaun anda sendiri.' }, 400);
      }

      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (delErr) {
        return jsonResponse({ error: delErr.message }, 400);
      }
      return jsonResponse({ success: true }, 200);
    }

    return jsonResponse({ error: 'Tindakan tidak dikenali.' }, 400);
  } catch (err) {
    return jsonResponse({
      error: err instanceof Error ? err.message : 'Ralat pelayan dalaman.'
    }, 500);
  }
});
