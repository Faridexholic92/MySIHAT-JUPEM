/**
 * Lapisan Data & Pengesahan (Supabase + Mod Demo Tempatan apabila config kosong)
 */
(function (root) {
  'use strict';

  var DEMO_STORAGE_KEY = 'deklarasi_kesihatan_demo_v1';
  var DEMO_SESSION_KEY = 'deklarasi_kesihatan_demo_session_v1';

  function getConfig() {
    if (typeof module !== 'undefined' && module.exports) {
      return require('./config.js');
    }
    return root.APP_CONFIG || {};
  }

  function getICParser() {
    if (typeof module !== 'undefined' && module.exports) {
      return require('./ic-parser.js');
    }
    return root.ICParser;
  }

  function isSupabaseConfigured() {
    var cfg = getConfig();
    var url = (cfg.SUPABASE_URL || '').trim();
    var key = (cfg.SUPABASE_ANON_KEY || '').trim();
    return Boolean(
      url &&
      key &&
      /^https?:\/\//i.test(url) &&
      url.indexOf('YOUR_') === -1 &&
      key.indexOf('YOUR_') === -1
    );
  }

  var supabaseClientInstance = null;

  function getSupabaseClient() {
    if (!isSupabaseConfigured()) return null;
    if (supabaseClientInstance) return supabaseClientInstance;
    if (!root.supabase || typeof root.supabase.createClient !== 'function') {
      throw new Error('Pustaka Supabase gagal dimuatkan. Sila semak sambungan internet anda.');
    }
    var cfg = getConfig();
    supabaseClientInstance = root.supabase.createClient(cfg.SUPABASE_URL.trim(), cfg.SUPABASE_ANON_KEY.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return supabaseClientInstance;
  }

  function makeError(code, message, params) {
    var err = new Error(message);
    if (code) err.code = code;
    if (params) err.params = params;
    return err;
  }

  function resolveAuthEmail(identifier) {
    var cfg = getConfig();
    var domain = (cfg.AUTH_EMAIL_DOMAIN || 'staff.local').trim().toLowerCase();
    var clean = String(identifier || '').trim().toLowerCase();
    if (!clean) {
      throw makeError('AUTH_EMPTY_ID', 'Sila masukkan ID Pengguna atau alamat e-mel.');
    }
    if (clean.indexOf('@') !== -1) {
      return clean;
    }
    return clean + '@' + domain;
  }

  function validateUsername(username) {
    var clean = String(username || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(clean)) {
      throw makeError(
        'INVALID_USERNAME',
        'ID Pengguna mestilah 3-32 aksara (huruf kecil, nombor, titik, garis bawah _ atau sempang - sahaja).'
      );
    }
    return clean;
  }

  function buildValidatedDeclaration(payload) {
    var parser = getICParser();
    var fullName = String(payload.full_name || '').trim();
    if (!fullName || fullName.length < 2) {
      throw makeError('INVALID_FULLNAME', 'Sila masukkan Nama Penuh yang sah.');
    }

    var parsedIC = parser.parseMalaysianIC(payload.ic_number);
    if (!parsedIC.valid) {
      throw makeError(parsedIC.errorCode || 'INVALID_IC', parsedIC.error || 'Nombor Kad Pengenalan tidak sah.');
    }

    var allowedStatuses = [
      'Sihat',
      'Mempunyai Masalah Kesihatan',
      'Dalam Pemantauan / Rawatan'
    ];
    if (allowedStatuses.indexOf(payload.health_status) === -1) {
      throw makeError('INVALID_HEALTH_STATUS', 'Sila pilih status kesihatan semasa anda.');
    }

    if (!payload.confirmed_accurate) {
      throw makeError(
        'CONFIRM_REQUIRED',
        'Sila tandakan perakuan bahawa maklumat yang diisi adalah benar dan tepat.'
      );
    }

    var conditions = Array.isArray(payload.conditions)
      ? payload.conditions
          .map(function (c) { return String(c).trim(); })
          .filter(Boolean)
      : [];

    return {
      full_name: fullName,
      ic_number: parsedIC.digits,
      birth_date: parsedIC.birthDateISO,
      age: parsedIC.age,
      gender: parsedIC.gender,
      department: String(payload.department || '').trim() || null,
      phone: String(payload.phone || '').trim() || null,
      health_status: payload.health_status,
      conditions: conditions,
      other_conditions: String(payload.other_conditions || '').trim() || null,
      medications: String(payload.medications || '').trim() || null,
      emergency_contact: String(payload.emergency_contact || '').trim() || null,
      notes: String(payload.notes || '').trim() || null,
      confirmed_accurate: true
    };
  }

  // ==================== MOD DEMO TEMPATAN (LOCALSTORAGE) ====================

  function createSeedDemoData() {
    var now = new Date().toISOString();
    var adminId = 'demo-admin-001';
    var staff1Id = 'demo-staff-001';
    var staff2Id = 'demo-staff-002';
    var staff3Id = 'demo-staff-003';

    var parser = getICParser();
    var icAminah = parser.parseMalaysianIC('920418-12-5122');
    var icHakim = parser.parseMalaysianIC('851103-10-5317');

    return {
      users: [
        {
          id: adminId,
          username: 'admin',
          password: 'Admin@1234',
          full_name: 'Pentadbir Sistem (Admin)',
          department: 'Pentadbiran & Sumber Manusia',
          role: 'admin',
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          id: staff1Id,
          username: 'aminah',
          password: 'Staf@1234',
          full_name: 'Siti Aminah binti Rahman',
          department: 'Unit Kewangan',
          role: 'staff',
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          id: staff2Id,
          username: 'hakim',
          password: 'Staf@1234',
          full_name: 'Muhammad Hakim bin Rosli',
          department: 'Unit Operasi Teknikal',
          role: 'staff',
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          id: staff3Id,
          username: 'farid',
          password: 'Staf@1234',
          full_name: 'Farid bin Tasim',
          department: 'Unit ICT',
          role: 'staff',
          is_active: true,
          created_at: now,
          updated_at: now
        }
      ],
      declarations: [
        {
          id: 'decl-001',
          user_id: staff1Id,
          full_name: 'Siti Aminah binti Rahman',
          ic_number: icAminah.digits,
          birth_date: icAminah.birthDateISO,
          age: icAminah.age,
          gender: icAminah.gender,
          department: 'Unit Kewangan',
          phone: '013-8824109',
          health_status: 'Sihat',
          conditions: [],
          other_conditions: null,
          medications: null,
          emergency_contact: 'Rahman (Bapa) - 019-8812345',
          notes: 'Tiada alahan ubat atau makanan.',
          confirmed_accurate: true,
          submitted_at: now,
          updated_at: now
        },
        {
          id: 'decl-002',
          user_id: staff2Id,
          full_name: 'Muhammad Hakim bin Rosli',
          ic_number: icHakim.digits,
          birth_date: icHakim.birthDateISO,
          age: icHakim.age,
          gender: icHakim.gender,
          department: 'Unit Operasi Teknikal',
          phone: '012-7745120',
          health_status: 'Dalam Pemantauan / Rawatan',
          conditions: ['Asma / Lelah', 'Alahan (Ubat / Makanan / Persekitaran)'],
          other_conditions: 'Alahan kepada makanan laut (udang/ketam).',
          medications: 'Inhaler Salbutamol (bila perlu)',
          emergency_contact: 'Nurul (Isteri) - 017-5548901',
          notes: 'Sentiasa membawa inhaler bersama semasa aktiviti luar.',
          confirmed_accurate: true,
          submitted_at: now,
          updated_at: now
        }
      ]
    };
  }

  function loadDemoDB() {
    var raw = root.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      var seed = createSeedDemoData();
      root.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      var reset = createSeedDemoData();
      root.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(reset));
      return reset;
    }
  }

  function saveDemoDB(db) {
    root.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db));
  }

  function sanitizeProfile(user) {
    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      department: user.department || '',
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  function generateUUID() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') {
      return root.crypto.randomUUID();
    }
    return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2, 10);
  }

  // ==================== OPERASI ANTARAMUKA BERSATU ====================

  async function extractEdgeFunctionError(error, fallbackMsg) {
    if (!error) return fallbackMsg;
    var name = error.name || '';
    if (name === 'FunctionsFetchError' || name === 'FunctionsRelayError') {
      var err = new Error(
        'Edge Function "admin-users" belum dipasang atau tidak dapat dihubungi. Sila pasang fungsi tersebut di Supabase, atau tambah pengguna terus di Supabase Dashboard > Authentication > Users.'
      );
      err.code = 'EDGE_FUNCTION_UNAVAILABLE';
      return err;
    }
    if (error.context && typeof error.context.json === 'function') {
      try {
        var body = await error.context.json();
        if (body && body.error) {
          return new Error(body.error);
        }
      } catch (e) {
        // abaikan jika bukan JSON
      }
      if (error.context.status === 404) {
        var notFoundErr = new Error(
          'Edge Function "admin-users" belum diaktifkan di projek Supabase anda (404).'
        );
        notFoundErr.code = 'EDGE_FUNCTION_UNAVAILABLE';
        return notFoundErr;
      }
    }
    return new Error(error.message || fallbackMsg);
  }

  async function getCurrentSession() {
    if (!isSupabaseConfigured()) {
      var userId = root.localStorage.getItem(DEMO_SESSION_KEY);
      if (!userId) return null;
      var db = loadDemoDB();
      var found = db.users.find(function (u) { return u.id === userId; });
      if (!found || !found.is_active) {
        root.localStorage.removeItem(DEMO_SESSION_KEY);
        return null;
      }
      return { user: { id: found.id, email: resolveAuthEmail(found.username) }, profile: sanitizeProfile(found) };
    }

    var client = getSupabaseClient();
    var res = await client.auth.getSession();
    if (res.error || !res.data || !res.data.session) return null;

    var authUser = res.data.session.user;
    var profileRes = await client
      .from('profiles')
      .select('id, username, full_name, department, role, is_active, created_at, updated_at')
      .eq('id', authUser.id)
      .single();

    if (profileRes.error || !profileRes.data) {
      await client.auth.signOut();
      return null;
    }

    if (!profileRes.data.is_active) {
      await client.auth.signOut();
      return null;
    }

    return { user: authUser, profile: profileRes.data };
  }

  async function signIn(identifier, password) {
    var cleanPass = String(password || '');
    if (!cleanPass) {
      throw makeError('AUTH_EMPTY_PASS', 'Sila masukkan kata laluan.');
    }

    if (!isSupabaseConfigured()) {
      var cleanId = String(identifier || '').trim().toLowerCase();
      if (!cleanId) throw makeError('AUTH_EMPTY_ID', 'Sila masukkan ID Pengguna atau alamat e-mel.');
      var cfg = getConfig();
      var domainSuffix = '@' + (cfg.AUTH_EMAIL_DOMAIN || 'staff.local').toLowerCase();
      if (cleanId.endsWith(domainSuffix)) {
        cleanId = cleanId.slice(0, -domainSuffix.length);
      }

      var db = loadDemoDB();
      var user = db.users.find(function (u) {
        return u.username.toLowerCase() === cleanId;
      });
      if (!user || user.password !== cleanPass) {
        throw makeError('AUTH_INVALID', 'ID Pengguna atau kata laluan tidak tepat.');
      }
      if (!user.is_active) {
        throw makeError('AUTH_INACTIVE', 'Akaun anda telah dinyahaktifkan. Sila hubungi Pentadbir.');
      }
      root.localStorage.setItem(DEMO_SESSION_KEY, user.id);
      return {
        user: { id: user.id, email: resolveAuthEmail(user.username) },
        profile: sanitizeProfile(user)
      };
    }

    var client = getSupabaseClient();
    var email = resolveAuthEmail(identifier);
    var authRes = await client.auth.signInWithPassword({ email: email, password: cleanPass });
    if (authRes.error) {
      if (/invalid login credentials/i.test(authRes.error.message)) {
        throw makeError('AUTH_INVALID', 'ID Pengguna atau kata laluan tidak tepat.');
      }
      throw new Error(authRes.error.message || 'Log masuk gagal.');
    }

    var authUser = authRes.data.user;
    var profileRes = await client
      .from('profiles')
      .select('id, username, full_name, department, role, is_active, created_at, updated_at')
      .eq('id', authUser.id)
      .single();

    if (profileRes.error || !profileRes.data) {
      await client.auth.signOut();
      throw makeError('AUTH_NO_PROFILE', 'Profil akaun tidak ditemui. Sila hubungi Pentadbir.');
    }

    if (!profileRes.data.is_active) {
      await client.auth.signOut();
      throw makeError('AUTH_INACTIVE', 'Akaun anda telah dinyahaktifkan oleh Pentadbir.');
    }

    return { user: authUser, profile: profileRes.data };
  }

  async function signOut() {
    if (!isSupabaseConfigured()) {
      root.localStorage.removeItem(DEMO_SESSION_KEY);
      return;
    }
    var client = getSupabaseClient();
    await client.auth.signOut();
  }

  async function changeOwnPassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw makeError('PASSWORD_TOO_SHORT', 'Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
    }
    if (!isSupabaseConfigured()) {
      var userId = root.localStorage.getItem(DEMO_SESSION_KEY);
      var db = loadDemoDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) throw new Error('Sesi tidak sah.');
      user.password = newPassword;
      user.updated_at = new Date().toISOString();
      saveDemoDB(db);
      return true;
    }

    var client = getSupabaseClient();
    var res = await client.auth.updateUser({ password: newPassword });
    if (res.error) throw new Error(res.error.message || 'Gagal mengemas kini kata laluan.');
    return true;
  }

  async function getMyDeclaration(userId) {
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      return db.declarations.find(function (d) { return d.user_id === userId; }) || null;
    }

    var client = getSupabaseClient();
    var res = await client
      .from('health_declarations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (res.error) throw new Error(res.error.message || 'Gagal mendapatkan rekod deklarasi.');
    return res.data || null;
  }

  async function upsertMyDeclaration(userId, payload) {
    var validated = buildValidatedDeclaration(payload);

    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var now = new Date().toISOString();
      var idx = db.declarations.findIndex(function (d) { return d.user_id === userId; });
      var saved;
      if (idx >= 0) {
        saved = Object.assign({}, db.declarations[idx], validated, { updated_at: now });
        db.declarations[idx] = saved;
      } else {
        saved = Object.assign(
          { id: generateUUID(), user_id: userId, submitted_at: now, updated_at: now },
          validated
        );
        db.declarations.push(saved);
      }
      saveDemoDB(db);
      return saved;
    }

    var client = getSupabaseClient();
    var row = Object.assign({ user_id: userId }, validated);
    var res = await client
      .from('health_declarations')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single();

    if (res.error) throw new Error(res.error.message || 'Gagal menyimpan deklarasi kesihatan.');
    return res.data;
  }

  function computeLiveDeclarationView(profile, declaration) {
    var parser = getICParser();
    var liveAge = null;
    var formattedIC = '-';
    var birthDate = null;
    var gender = '-';
    var birthState = '-';

    if (declaration) {
      formattedIC = parser.formatIC(declaration.ic_number);
      birthDate = declaration.birth_date;
      liveAge = parser.calculateAgeFromISODate(declaration.birth_date);
      if (liveAge === null && declaration.ic_number) {
        var parsed = parser.parseMalaysianIC(declaration.ic_number);
        if (parsed.valid) {
          liveAge = parsed.age;
          birthDate = parsed.birthDateISO;
          birthState = parsed.birthState;
        }
      } else if (declaration.ic_number) {
        var parsed2 = parser.parseMalaysianIC(declaration.ic_number);
        if (parsed2.valid) birthState = parsed2.birthState;
      }
      if (liveAge === null) liveAge = declaration.age;
      gender = declaration.gender || '-';
    }

    return {
      profile: profile,
      declaration: declaration || null,
      has_declared: Boolean(declaration),
      display_name: (declaration && declaration.full_name) || profile.full_name || profile.username,
      department: (declaration && declaration.department) || profile.department || '-',
      formatted_ic: formattedIC,
      live_age: liveAge,
      birth_date: birthDate,
      gender: gender,
      birth_state: birthState,
      health_status: declaration ? declaration.health_status : 'Belum Mengisi',
      conditions: declaration && Array.isArray(declaration.conditions) ? declaration.conditions : []
    };
  }

  async function getAdminDashboardData() {
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var declMap = {};
      db.declarations.forEach(function (d) { declMap[d.user_id] = d; });
      return db.users
        .slice()
        .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); })
        .map(function (u) {
          return computeLiveDeclarationView(sanitizeProfile(u), declMap[u.id] || null);
        });
    }

    var client = getSupabaseClient();
    var pRes = await client
      .from('profiles')
      .select('id, username, full_name, department, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (pRes.error) throw new Error(pRes.error.message || 'Gagal memuatkan senarai pengguna.');

    var dRes = await client
      .from('health_declarations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (dRes.error) throw new Error(dRes.error.message || 'Gagal memuatkan senarai deklarasi kesihatan.');

    var map = {};
    (dRes.data || []).forEach(function (d) { map[d.user_id] = d; });

    return (pRes.data || []).map(function (profile) {
      return computeLiveDeclarationView(profile, map[profile.id] || null);
    });
  }

  async function adminCreateUser(input) {
    var username = validateUsername(input.username);
    var password = String(input.password || '');
    if (password.length < 6) {
      throw makeError('PASSWORD_TOO_SHORT', 'Kata laluan awal mestilah sekurang-kurangnya 6 aksara.');
    }
    var fullName = String(input.full_name || '').trim();
    if (!fullName) {
      throw makeError('INVALID_FULLNAME', 'Sila masukkan Nama Penuh staf.');
    }
    var role = input.role === 'admin' ? 'admin' : 'staff';
    var department = String(input.department || '').trim() || null;

    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var exists = db.users.some(function (u) { return u.username.toLowerCase() === username; });
      if (exists) {
        throw makeError('DUPLICATE_USERNAME', 'ID Pengguna "' + username + '" sudah digunakan.', { username: username });
      }
      var now = new Date().toISOString();
      var newUser = {
        id: generateUUID(),
        username: username,
        password: password,
        full_name: fullName,
        department: department || '',
        role: role,
        is_active: true,
        created_at: now,
        updated_at: now
      };
      db.users.unshift(newUser);
      saveDemoDB(db);
      return sanitizeProfile(newUser);
    }

    var cfg = getConfig();
    var client = getSupabaseClient();
    var fnName = cfg.ADMIN_EDGE_FUNCTION || 'admin-users';
    var res = await client.functions.invoke(fnName, {
      body: {
        action: 'create_user',
        username: username,
        password: password,
        full_name: fullName,
        department: department,
        role: role,
        email_domain: cfg.AUTH_EMAIL_DOMAIN || 'staff.local'
      }
    });

    if (res.error) {
      throw await extractEdgeFunctionError(res.error, 'Gagal mencipta akaun staf.');
    }
    return res.data && res.data.user ? res.data.user : res.data;
  }

  async function adminResetPassword(userId, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw makeError('PASSWORD_TOO_SHORT', 'Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
    }
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) throw new Error('Pengguna tidak ditemui.');
      user.password = newPassword;
      user.updated_at = new Date().toISOString();
      saveDemoDB(db);
      return true;
    }

    var cfg = getConfig();
    var client = getSupabaseClient();
    var res = await client.functions.invoke(cfg.ADMIN_EDGE_FUNCTION || 'admin-users', {
      body: {
        action: 'reset_password',
        user_id: userId,
        new_password: newPassword
      }
    });

    if (res.error) {
      throw await extractEdgeFunctionError(res.error, 'Gagal menetapkan semula kata laluan.');
    }
    return true;
  }

  async function adminToggleActive(userId, isActive, currentAdminId) {
    if (userId === currentAdminId && !isActive) {
      throw makeError('CANNOT_DEACTIVATE_SELF', 'Anda tidak boleh menyahaktifkan akaun anda sendiri.');
    }
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) throw new Error('Pengguna tidak ditemui.');
      user.is_active = Boolean(isActive);
      user.updated_at = new Date().toISOString();
      saveDemoDB(db);
      return true;
    }

    var cfg = getConfig();
    var client = getSupabaseClient();
    var res = await client.functions.invoke(cfg.ADMIN_EDGE_FUNCTION || 'admin-users', {
      body: {
        action: 'toggle_active',
        user_id: userId,
        is_active: Boolean(isActive)
      }
    });

    if (res.error) {
      throw await extractEdgeFunctionError(res.error, 'Gagal mengemas kini status akaun.');
    }
    return true;
  }

  async function adminDeleteUser(userId, currentAdminId) {
    if (userId === currentAdminId) {
      throw makeError('CANNOT_DELETE_SELF', 'Anda tidak boleh memadamkan akaun anda sendiri.');
    }
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      db.users = db.users.filter(function (u) { return u.id !== userId; });
      db.declarations = db.declarations.filter(function (d) { return d.user_id !== userId; });
      saveDemoDB(db);
      return true;
    }

    var cfg = getConfig();
    var client = getSupabaseClient();
    var res = await client.functions.invoke(cfg.ADMIN_EDGE_FUNCTION || 'admin-users', {
      body: {
        action: 'delete_user',
        user_id: userId
      }
    });

    if (res.error) {
      throw await extractEdgeFunctionError(res.error, 'Gagal memadam akaun staf.');
    }
    return true;
  }

  async function adminDeleteDeclaration(declarationId) {
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      db.declarations = db.declarations.filter(function (d) { return d.id !== declarationId; });
      saveDemoDB(db);
      return true;
    }

    var client = getSupabaseClient();
    var res = await client
      .from('health_declarations')
      .delete()
      .eq('id', declarationId);

    if (res.error) throw new Error(res.error.message || 'Gagal memadam rekod deklarasi.');
    return true;
  }

  function resetDemoData() {
    if (isSupabaseConfigured()) return;
    var seed = createSeedDemoData();
    root.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));
    root.localStorage.removeItem(DEMO_SESSION_KEY);
  }

  var api = {
    isSupabaseConfigured: isSupabaseConfigured,
    resolveAuthEmail: resolveAuthEmail,
    validateUsername: validateUsername,
    buildValidatedDeclaration: buildValidatedDeclaration,
    getCurrentSession: getCurrentSession,
    signIn: signIn,
    signOut: signOut,
    changeOwnPassword: changeOwnPassword,
    getMyDeclaration: getMyDeclaration,
    upsertMyDeclaration: upsertMyDeclaration,
    getAdminDashboardData: getAdminDashboardData,
    adminCreateUser: adminCreateUser,
    adminResetPassword: adminResetPassword,
    adminToggleActive: adminToggleActive,
    adminDeleteUser: adminDeleteUser,
    adminDeleteDeclaration: adminDeleteDeclaration,
    resetDemoData: resetDemoData
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.AppStore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
