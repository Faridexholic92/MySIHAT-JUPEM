// Supabase Edge Function: admin-users
// Mengurus penciptaan akaun kakitangan, tetap semula kata laluan, aktif/nyahaktif, dan padam akaun.
// Hanya pengguna dengan peranan 'admin' (disahkan melalui JWT + jadual profiles) dibenarkan.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set([
  'https://mysihatjupem.dpdns.org',
  'https://mysihat-jupem.pages.dev'
]);

function isAllowedOrigin(origin: string) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin) || /^https:\/\/[a-z0-9-]+\.mysihat-jupem\.pages\.dev$/i.test(origin);
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowOrigin = isAllowedOrigin(origin)
    ? origin
    : 'https://mysihatjupem.dpdns.org';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

function jsonResponse(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  const requestOrigin = req.headers.get('Origin') || '';
  if (requestOrigin && !isAllowedOrigin(requestOrigin)) {
    return jsonResponse(req, { error: 'Origin permintaan tidak dibenarkan.' }, 403);
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Kaedah permintaan tidak dibenarkan.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(req, { error: 'Konfigurasi pelayan Supabase tidak lengkap.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!jwt) {
      return jsonResponse(req, { error: 'Token pengesahan tiada.' }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 1. Sahkan identiti pemanggil daripada JWT
    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(jwt);
    if (callerErr || !callerData?.user) {
      return jsonResponse(req, { error: 'Sesi tidak sah atau telah tamat tempoh.' }, 401);
    }

    // 2. Pastikan pemanggil ialah Admin yang aktif dalam jadual profiles
    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', callerData.user.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
      return jsonResponse(req, { error: 'Akses ditolak: Hanya Admin dibenarkan.' }, 403);
    }

    const body = await req.json();
    const action = body?.action;

    if (action === 'create_user') {
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      const fullName = String(body.full_name || '').trim();
      const department = String(body.department || '').trim() || null;
      const position = String(body.position || '').trim() || null;
      const grade = String(body.grade || '').trim() || null;
      const role = body.role === 'admin' ? 'admin' : 'staff';
      const emailDomain = String(body.email_domain || 'jupem.gov.my').trim().toLowerCase();
      const rawEmail = String(body.email || '').trim().toLowerCase();

      if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
        return jsonResponse(req, {
          error: 'ID Pengguna mestilah 3-32 aksara (huruf kecil, nombor, titik, _ atau - sahaja).'
        }, 400);
      }
      if (password.length < 8) {
        return jsonResponse(req, { error: 'Kata laluan mestilah sekurang-kurangnya 8 aksara.' }, 400);
      }
      if (!fullName) {
        return jsonResponse(req, { error: 'Nama Penuh diperlukan.' }, 400);
      }

      const email = rawEmail || `${username}@${emailDomain}`;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse(req, { error: 'Format alamat e-mel tidak sah.' }, 400);
      }

      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        return jsonResponse(req, { error: `ID Pengguna "${username}" sudah digunakan.` }, 409);
      }

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role, must_change_password: true },
        user_metadata: { username, full_name: fullName, department, position, grade }
      });

      if (createErr || !created?.user) {
        return jsonResponse(req, {
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
          position,
          grade,
          role,
          is_active: true,
          must_change_password: true
        })
        .select()
        .single();

      if (upsertErr) {
        return jsonResponse(req, { error: upsertErr.message }, 400);
      }

      return jsonResponse(req, { user: savedProfile }, 200);
    }

    if (action === 'reset_password') {
      const userId = String(body.user_id || '').trim();
      const newPassword = String(body.new_password || '');
      if (!userId || newPassword.length < 8) {
        return jsonResponse(req, { error: 'ID pengguna dan kata laluan (>= 8 aksara) diperlukan.' }, 400);
      }

      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });
      if (updErr) {
        return jsonResponse(req, { error: updErr.message }, 400);
      }

      const { error: flagErr } = await supabaseAdmin
        .from('profiles')
        .update({ must_change_password: true })
        .eq('id', userId);
      if (flagErr) {
        return jsonResponse(req, { error: flagErr.message }, 400);
      }
      return jsonResponse(req, { success: true }, 200);
    }

    if (action === 'toggle_active') {
      const userId = String(body.user_id || '').trim();
      const isActive = Boolean(body.is_active);
      if (!userId) {
        return jsonResponse(req, { error: 'ID pengguna diperlukan.' }, 400);
      }
      if (userId === callerProfile.id && !isActive) {
        return jsonResponse(req, { error: 'Anda tidak boleh menyahaktifkan akaun anda sendiri.' }, 400);
      }

      const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: isActive ? 'none' : '876000h'
      });
      if (banErr) {
        return jsonResponse(req, { error: banErr.message }, 400);
      }

      const { error: profErr } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);
      if (profErr) {
        return jsonResponse(req, { error: profErr.message }, 400);
      }

      return jsonResponse(req, { success: true }, 200);
    }

    if (action === 'delete_user') {
      const userId = String(body.user_id || '').trim();
      if (!userId) {
        return jsonResponse(req, { error: 'ID pengguna diperlukan.' }, 400);
      }
      if (userId === callerProfile.id) {
        return jsonResponse(req, { error: 'Anda tidak boleh memadam akaun anda sendiri.' }, 400);
      }

      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (delErr) {
        return jsonResponse(req, { error: delErr.message }, 400);
      }
      return jsonResponse(req, { success: true }, 200);
    }

    if (action === 'update_user') {
      const userId = String(body.user_id || '').trim();
      const fullName = String(body.full_name || '').trim();
      const department = String(body.department || '').trim() || null;
      const position = String(body.position || '').trim() || null;
      const grade = String(body.grade || '').trim() || null;
      const role = body.role === 'admin' ? 'admin' : 'staff';

      if (!userId) {
        return jsonResponse(req, { error: 'ID pengguna diperlukan.' }, 400);
      }
      if (!fullName) {
        return jsonResponse(req, { error: 'Nama Penuh diperlukan.' }, 400);
      }
      if (userId === callerProfile.id && role !== 'admin') {
        return jsonResponse(req, { error: 'Anda tidak boleh menurunkan peranan akaun anda sendiri.' }, 400);
      }

      const { data: targetUserRes } = await supabaseAdmin.auth.admin.getUserById(userId);
      const existingAppMeta = targetUserRes?.user?.app_metadata || {};
      const existingUserMeta = targetUserRes?.user?.user_metadata || {};

      const { error: authUpdErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { ...existingAppMeta, role },
        user_metadata: {
          ...existingUserMeta,
          full_name: fullName,
          department,
          position,
          grade
        }
      });
      if (authUpdErr) {
        return jsonResponse(req, { error: authUpdErr.message }, 400);
      }

      const { data: updatedProfile, error: profUpdErr } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName,
          department,
          position,
          grade,
          role
        })
        .eq('id', userId)
        .select()
        .single();

      if (profUpdErr) {
        return jsonResponse(req, { error: profUpdErr.message }, 400);
      }

      const { data: activeCycle } = await supabaseAdmin
        .from('declaration_cycles')
        .select('cycle_code')
        .eq('is_active', true)
        .maybeSingle();

      const declUpdateQuery = supabaseAdmin
        .from('health_declarations')
        .update({
          full_name: fullName,
          department,
          position,
          grade
        })
        .eq('user_id', userId);

      if (activeCycle?.cycle_code) {
        await declUpdateQuery.eq('cycle_code', activeCycle.cycle_code);
      } else {
        await declUpdateQuery;
      }

      return jsonResponse(req, { user: updatedProfile }, 200);
    }

    return jsonResponse(req, { error: 'Tindakan tidak dikenali.' }, 400);
  } catch (err) {
    return jsonResponse(req, {
      error: err instanceof Error ? err.message : 'Ralat pelayan dalaman.'
    }, 500);
  }
});
