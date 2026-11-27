(function (root) {
  'use strict';

  var DEMO_STORAGE_KEY = 'deklarasi_kesihatan_demo_v1';
  var DEMO_SESSION_KEY = 'deklarasi_kesihatan_demo_session_v1';
  var MIN_PASSWORD_LENGTH = 8;
  var DEFAULT_INITIAL_PASSWORD = 'user@123';

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
    var domain = (cfg.AUTH_EMAIL_DOMAIN || 'jupem.gov.my').trim().toLowerCase();
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
    if (clean.indexOf('@') !== -1) {
      clean = clean.split('@')[0];
    }
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
      position: String(payload.position || '').trim() || null,
      grade: String(payload.grade || '').trim() || null,
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

  function createSeedDemoData() {
    var now = new Date().toISOString();
    var adminId = 'demo-admin-001';
    var staff1Id = 'demo-staff-001';
    var staff2Id = 'demo-staff-002';
    var staff3Id = 'demo-staff-003';

    var parser = getICParser();
    var icAminah = parser.parseMalaysianIC('920418-12-5122');
    var icHakim = parser.parseMalaysianIC('851103-10-5317');

    var demoDecls = [
      {
        id: 'decl-001',
        user_id: staff1Id,
        cycle_code: '2026',
        full_name: 'Siti Aminah binti Rahman',
        ic_number: icAminah.digits,
        birth_date: icAminah.birthDateISO,
        age: icAminah.age,
        gender: icAminah.gender,
        department: 'Unit Kewangan',
        position: 'Pembantu Tadbir Kewangan',
        grade: 'W1',
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
        cycle_code: '2026',
        full_name: 'Muhammad Hakim bin Rosli',
        ic_number: icHakim.digits,
        birth_date: icHakim.birthDateISO,
        age: icHakim.age,
        gender: icHakim.gender,
        department: 'Unit Operasi Teknikal',
        position: 'Ketua Unit Operasi',
        grade: 'J9',
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
    ];

    return {
      users: [
        {
          id: adminId,
          username: 'admin',
          password: 'Admin@1234',
          full_name: 'Pentadbir Sistem (Admin)',
          department: 'Pentadbiran & Sumber Manusia',
          position: 'Penolong Pegawai Tadbir',
          grade: 'N5',
          role: 'admin',
          is_active: true,
          must_change_password: false,
          created_at: now,
          updated_at: now
        },
        {
          id: staff1Id,
          username: 'aminah',
          password: 'Staf@1234',
          full_name: 'Siti Aminah binti Rahman',
          department: 'Unit Kewangan',
          position: 'Pembantu Tadbir Kewangan',
          grade: 'W1',
          role: 'staff',
          is_active: true,
          must_change_password: false,
          created_at: now,
          updated_at: now
        },
        {
          id: staff2Id,
          username: 'hakim',
          password: 'Staf@1234',
          full_name: 'Muhammad Hakim bin Rosli',
          department: 'Unit Operasi Teknikal',
          position: 'Ketua Unit Operasi',
          grade: 'J9',
          role: 'staff',
          is_active: true,
          must_change_password: false,
          created_at: now,
          updated_at: now
        },
        {
          id: staff3Id,
          username: 'farid',
          password: 'Staf@1234',
          full_name: 'Farid bin Tasim',
          department: 'Seksyen Penawanan Data',
          position: 'Penolong Juruukur',
          grade: 'JA5',
          role: 'staff',
          is_active: true,
          must_change_password: false,
          created_at: now,
          updated_at: now
        }
      ],
      cycles: [
        {
          id: 'cycle-2026',
          cycle_code: '2026',
          title: 'Kitaran Pengisytiharan 2026',
          is_active: true,
          started_at: now
        }
      ],
      declarations: demoDecls,
      declaration_history: demoDecls.map(function (d) {
        return Object.assign({}, d, {
          id: 'hist-' + d.id,
          declaration_id: d.id,
          recorded_at: d.updated_at || d.submitted_at
        });
      }),
      announcements: [
        {
          id: 'ann-001',
          title: 'Makluman Pengisian Rekod Kesihatan',
          message: 'Semua kakitangan Bahagian Pemetaan Topografi Sabah dimohon menyemak maklumat jawatan dan melengkapkan pengisytiharan kesihatan terkini serta menukar kata laluan pada log masuk pertama.',
          level: 'info',
          is_active: true,
          expires_at: null,
          created_at: now,
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
      var db = JSON.parse(raw);
      var defaults = createSeedDemoData();
      if (!Array.isArray(db.announcements)) {
        db.announcements = defaults.announcements;
      }
      if (!Array.isArray(db.cycles) || db.cycles.length === 0) {
        db.cycles = defaults.cycles;
      }
      if (!Array.isArray(db.declaration_history)) {
        db.declaration_history = (db.declarations || []).map(function (d) {
          return Object.assign({}, d, {
            id: 'hist-' + d.id,
            declaration_id: d.id,
            cycle_code: d.cycle_code || '2026',
            recorded_at: d.updated_at || d.submitted_at
          });
        });
      }
      if (Array.isArray(db.users)) {
        db.users.forEach(function (u) {
          if (u.position === undefined) u.position = '';
          if (u.grade === undefined) u.grade = '';
          if (u.must_change_password === undefined) u.must_change_password = false;
        });
      }
      if (Array.isArray(db.declarations)) {
        db.declarations.forEach(function (d) {
          if (!d.cycle_code) d.cycle_code = '2026';
          if (d.grade === undefined) d.grade = null;
        });
      }
      return db;
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
      email: user.email || resolveAuthEmail(user.username),
      full_name: user.full_name,
      department: user.department || '',
      position: user.position || '',
      grade: user.grade || '',
      role: user.role,
      is_active: user.is_active,
      must_change_password: Boolean(user.must_change_password),
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
      .select('*')
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
      var cleanInput = String(identifier || '').trim().toLowerCase();
      if (!cleanInput) throw makeError('AUTH_EMPTY_ID', 'Sila masukkan ID Pengguna atau alamat e-mel.');
      var cfg = getConfig();
      var domainSuffix = '@' + (cfg.AUTH_EMAIL_DOMAIN || 'jupem.gov.my').toLowerCase();
      var cleanId = cleanInput.endsWith(domainSuffix)
        ? cleanInput.slice(0, -domainSuffix.length)
        : cleanInput;

      var db = loadDemoDB();
      var user = db.users.find(function (u) {
        var uEmail = (u.email || resolveAuthEmail(u.username)).toLowerCase();
        return u.username.toLowerCase() === cleanId || uEmail === cleanInput;
      });
      if (!user || user.password !== cleanPass) {
        throw makeError('AUTH_INVALID', 'ID Pengguna atau kata laluan tidak tepat.');
      }
      if (!user.is_active) {
        throw makeError('AUTH_INACTIVE', 'Akaun anda telah dinyahaktifkan. Sila hubungi Pentadbir.');
      }
      root.localStorage.setItem(DEMO_SESSION_KEY, user.id);
      return {
        user: { id: user.id, email: user.email || resolveAuthEmail(user.username) },
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
      .select('*')
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
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      throw makeError('PASSWORD_TOO_SHORT', 'Kata laluan baharu mestilah sekurang-kurangnya 8 aksara.');
    }
    if (String(newPassword) === DEFAULT_INITIAL_PASSWORD) {
      throw makeError('PASSWORD_CANNOT_BE_DEFAULT', 'Sila pilih kata laluan baharu yang berbeza daripada kata laluan awal.');
    }
    if (!isSupabaseConfigured()) {
      var userId = root.localStorage.getItem(DEMO_SESSION_KEY);
      var db = loadDemoDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) throw new Error('Sesi tidak sah.');
      user.password = newPassword;
      user.must_change_password = false;
      user.updated_at = new Date().toISOString();
      saveDemoDB(db);
      return true;
    }

    var client = getSupabaseClient();
    var res = await client.auth.updateUser({ password: newPassword });
    if (res.error) throw new Error(res.error.message || 'Gagal mengemas kini kata laluan.');
    var rpcRes = await client.rpc('complete_first_password_change');
    if (rpcRes && rpcRes.error && rpcRes.error.code !== 'PGRST202' && !/function .* does not exist/i.test(rpcRes.error.message || '')) {
      throw new Error(rpcRes.error.message || 'Gagal mengemaskini status kata laluan.');
    }
    return true;
  }

  function isMissingRelationOrColumn(err, keyword) {
    if (!err) return false;
    var msg = String(err.message || '');
    var code = String(err.code || '');
    return code === 'PGRST205' || code === 'PGRST204' || code === '42P01' || code === '42703' ||
      (keyword ? new RegExp(keyword, 'i').test(msg) : /does not exist|not found|schema cache/i.test(msg));
  }

  async function getDeclarationCycles() {
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      return (db.cycles || []).slice().sort(function (a, b) {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        return String(b.started_at || '').localeCompare(String(a.started_at || ''));
      });
    }

    var client = getSupabaseClient();
    var res = await client
      .from('declaration_cycles')
      .select('*')
      .order('started_at', { ascending: false });

    if (res.error) {
      if (isMissingRelationOrColumn(res.error, 'declaration_cycles')) {
        return [{ id: 'fallback-2026', cycle_code: '2026', title: 'Kitaran Pengisytiharan 2026', is_active: true }];
      }
      throw new Error(res.error.message || 'Gagal memuatkan senarai kitaran.');
    }
    var list = res.data || [];
    if (list.length === 0) {
      return [{ id: 'fallback-2026', cycle_code: '2026', title: 'Kitaran Pengisytiharan 2026', is_active: true }];
    }
    return list;
  }

  async function adminStartNewCycle(cycleCode, title) {
    var code = String(cycleCode || '').trim();
    var cleanTitle = String(title || '').trim() || ('Kitaran Pengisytiharan ' + code);
    if (!code || code.length > 32) {
      throw makeError('INVALID_CYCLE_CODE', 'Sila masukkan kod kitaran yang sah (cth: 2027).');
    }

    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var now = new Date().toISOString();
      if (!Array.isArray(db.cycles)) db.cycles = [];
      db.cycles.forEach(function (c) { c.is_active = false; });
      var existing = db.cycles.find(function (c) { return c.cycle_code === code; });
      if (existing) {
        existing.title = cleanTitle;
        existing.is_active = true;
        existing.started_at = now;
        saveDemoDB(db);
        return existing;
      }
      var created = {
        id: generateUUID(),
        cycle_code: code,
        title: cleanTitle,
        is_active: true,
        started_at: now
      };
      db.cycles.unshift(created);
      saveDemoDB(db);
      return created;
    }

    var client = getSupabaseClient();
    var res = await client.rpc('start_new_declaration_cycle', {
      p_cycle_code: code,
      p_title: cleanTitle
    });
    if (res.error) throw new Error(res.error.message || 'Gagal memulakan kitaran baharu.');
    return res.data;
  }

  async function getMyDeclaration(userId, cycleCode) {
    var targetCycle = String(cycleCode || '').trim();
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var matches = db.declarations.filter(function (d) {
        if (d.user_id !== userId) return false;
        if (!targetCycle) return true;
        return (d.cycle_code || '2026') === targetCycle;
      });
      return matches[0] || null;
    }

    var client = getSupabaseClient();
    var query = client
      .from('health_declarations')
      .select('*')
      .eq('user_id', userId);
    if (targetCycle) {
      query = query.eq('cycle_code', targetCycle);
    }
    var res = await query.maybeSingle();

    if (res.error && targetCycle && /cycle_code/i.test(res.error.message || '')) {
      res = await client
        .from('health_declarations')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    }

    if (res.error) throw new Error(res.error.message || 'Gagal mendapatkan rekod deklarasi.');
    return res.data || null;
  }

  async function getMyLatestDeclaration(userId) {
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var list = db.declarations
        .filter(function (d) { return d.user_id === userId; })
        .sort(function (a, b) {
          return String(b.updated_at || b.submitted_at || '').localeCompare(String(a.updated_at || a.submitted_at || ''));
        });
      return list[0] || null;
    }

    var client = getSupabaseClient();
    var res = await client
      .from('health_declarations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (res.error) return null;
    return res.data && res.data[0] ? res.data[0] : null;
  }

  async function getUserDeclarationHistory(userId) {
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      return (db.declaration_history || [])
        .filter(function (h) { return h.user_id === userId; })
        .slice()
        .sort(function (a, b) {
          return String(b.recorded_at || b.updated_at || '').localeCompare(String(a.recorded_at || a.updated_at || ''));
        });
    }

    var client = getSupabaseClient();
    var res = await client
      .from('health_declaration_history')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false });

    if (res.error) {
      if (isMissingRelationOrColumn(res.error, 'health_declaration_history')) {
        return [];
      }
      throw new Error(res.error.message || 'Gagal memuatkan sejarah pengisytiharan.');
    }
    return res.data || [];
  }

  async function upsertMyDeclaration(userId, payload, cycleCode) {
    var validated = buildValidatedDeclaration(payload);
    var targetCycle = String(cycleCode || '2026').trim() || '2026';

    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var now = new Date().toISOString();
      var idx = db.declarations.findIndex(function (d) {
        return d.user_id === userId && (d.cycle_code || '2026') === targetCycle;
      });
      var saved;
      if (idx >= 0) {
        saved = Object.assign({}, db.declarations[idx], validated, { cycle_code: targetCycle, updated_at: now });
        db.declarations[idx] = saved;
      } else {
        saved = Object.assign(
          { id: generateUUID(), user_id: userId, cycle_code: targetCycle, submitted_at: now, updated_at: now },
          validated
        );
        db.declarations.push(saved);
      }
      if (!Array.isArray(db.declaration_history)) db.declaration_history = [];
      db.declaration_history.unshift(Object.assign({}, saved, {
        id: generateUUID(),
        declaration_id: saved.id,
        recorded_at: now
      }));
      saveDemoDB(db);
      return saved;
    }

    var client = getSupabaseClient();
    var row = Object.assign({ user_id: userId, cycle_code: targetCycle }, validated);
    var conflictTarget = 'user_id,cycle_code';
    var res = await client
      .from('health_declarations')
      .upsert(row, { onConflict: conflictTarget })
      .select()
      .single();

    for (var attempt = 0; attempt < 3 && res.error; attempt += 1) {
      var msg = String(res.error.message || '');
      var retryRow = Object.assign({}, row);
      var changed = false;
      if (/grade/i.test(msg) && 'grade' in retryRow) {
        delete retryRow.grade;
        changed = true;
      }
      if (/position/i.test(msg) && 'position' in retryRow) {
        delete retryRow.position;
        changed = true;
      }
      if ((/cycle_code|no unique or exclusion constraint matching the ON CONFLICT/i.test(msg)) && 'cycle_code' in retryRow) {
        delete retryRow.cycle_code;
        conflictTarget = 'user_id';
        changed = true;
      }
      if (!changed) break;
      row = retryRow;
      res = await client
        .from('health_declarations')
        .upsert(row, { onConflict: conflictTarget })
        .select()
        .single();
    }

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
      position: (declaration && declaration.position) || profile.position || '-',
      grade: (declaration && declaration.grade) || profile.grade || '-',
      formatted_ic: formattedIC,
      live_age: liveAge,
      birth_date: birthDate,
      gender: gender,
      birth_state: birthState,
      health_status: declaration ? declaration.health_status : 'Belum Mengisi',
      conditions: declaration && Array.isArray(declaration.conditions) ? declaration.conditions : []
    };
  }

  async function getAdminDashboardData(cycleCode) {
    var targetCycle = String(cycleCode || '').trim();
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var declMap = {};
      db.declarations.forEach(function (d) {
        if (!targetCycle || (d.cycle_code || '2026') === targetCycle) {
          declMap[d.user_id] = d;
        }
      });
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
      .select('*')
      .order('created_at', { ascending: false });

    if (pRes.error) throw new Error(pRes.error.message || 'Gagal memuatkan senarai pengguna.');

    var declQuery = client
      .from('health_declarations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (targetCycle) {
      declQuery = declQuery.eq('cycle_code', targetCycle);
    }
    var dRes = await declQuery;

    if (dRes.error && targetCycle && /cycle_code/i.test(dRes.error.message || '')) {
      dRes = await client
        .from('health_declarations')
        .select('*')
        .order('updated_at', { ascending: false });
    }

    if (dRes.error) throw new Error(dRes.error.message || 'Gagal memuatkan senarai deklarasi kesihatan.');

    var map = {};
    (dRes.data || []).forEach(function (d) { map[d.user_id] = d; });

    return (pRes.data || []).map(function (profile) {
      return computeLiveDeclarationView(profile, map[profile.id] || null);
    });
  }

  async function adminCreateUser(input) {
    var rawUsernameInput = String(input.username || '').trim().toLowerCase();
    var username = validateUsername(rawUsernameInput);
    var password = String(input.password || '');
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw makeError('PASSWORD_TOO_SHORT', 'Kata laluan awal mestilah sekurang-kurangnya 8 aksara.');
    }
    var fullName = String(input.full_name || '').trim();
    if (!fullName) {
      throw makeError('INVALID_FULLNAME', 'Sila masukkan Nama Penuh kakitangan.');
    }
    var cfg = getConfig();
    var rawEmail = String(input.email || '').trim().toLowerCase();
    if (!rawEmail && rawUsernameInput.indexOf('@') !== -1) {
      rawEmail = rawUsernameInput;
    }
    var email = rawEmail || resolveAuthEmail(username);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw makeError('INVALID_EMAIL', 'Format alamat e-mel tidak sah.');
    }
    var role = input.role === 'admin' ? 'admin' : 'staff';
    var department = String(input.department || '').trim() || null;
    var position = String(input.position || '').trim() || null;
    var grade = String(input.grade || '').trim() || null;

    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var exists = db.users.some(function (u) {
        var uEmail = (u.email || resolveAuthEmail(u.username)).toLowerCase();
        return u.username.toLowerCase() === username || uEmail === email;
      });
      if (exists) {
        throw makeError('DUPLICATE_USERNAME', 'ID Pengguna atau e-mel "' + username + '" sudah digunakan.', { username: username });
      }
      var now = new Date().toISOString();
      var newUser = {
        id: generateUUID(),
        username: username,
        email: email,
        password: password,
        full_name: fullName,
        department: department || '',
        position: position || '',
        grade: grade || '',
        role: role,
        is_active: true,
        must_change_password: true,
        created_at: now,
        updated_at: now
      };
      db.users.unshift(newUser);
      saveDemoDB(db);
      return sanitizeProfile(newUser);
    }

    var client = getSupabaseClient();
    var fnName = cfg.ADMIN_EDGE_FUNCTION || 'admin-users';
    var res = await client.functions.invoke(fnName, {
      body: {
        action: 'create_user',
        username: username,
        email: email,
        password: password,
        full_name: fullName,
        department: department,
        position: position,
        grade: grade,
        role: role,
        email_domain: cfg.AUTH_EMAIL_DOMAIN || 'jupem.gov.my'
      }
    });

    if (res.error) {
      throw await extractEdgeFunctionError(res.error, 'Gagal mencipta akaun kakitangan.');
    }
    return res.data && res.data.user ? res.data.user : res.data;
  }

  async function adminUpdateUser(input, currentAdminId) {
    var userId = String(input.user_id || '').trim();
    var fullName = String(input.full_name || '').trim();
    if (!fullName) {
      throw makeError('INVALID_FULLNAME', 'Sila masukkan Nama Penuh kakitangan.');
    }
    var role = input.role === 'admin' ? 'admin' : 'staff';
    if (userId === currentAdminId && role !== 'admin') {
      throw makeError('CANNOT_DEMOTE_SELF', 'Anda tidak boleh menurunkan peranan akaun anda sendiri.');
    }
    var department = String(input.department || '').trim() || null;
    var position = String(input.position || '').trim() || null;
    var grade = String(input.grade || '').trim() || null;

    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) throw new Error('Pengguna tidak ditemui.');
      var now = new Date().toISOString();
      user.full_name = fullName;
      user.department = department || '';
      user.position = position || '';
      user.grade = grade || '';
      user.role = role;
      user.updated_at = now;
      var activeCycle = (db.cycles || []).find(function (c) { return c.is_active; });
      var activeCode = activeCycle ? activeCycle.cycle_code : '2026';
      db.declarations.forEach(function (d) {
        if (d.user_id === userId && (d.cycle_code || '2026') === activeCode) {
          d.full_name = fullName;
          d.department = department;
          d.position = position;
          d.grade = grade;
          d.updated_at = now;
        }
      });
      saveDemoDB(db);
      return sanitizeProfile(user);
    }

    var cfg = getConfig();
    var client = getSupabaseClient();
    var res = await client.functions.invoke(cfg.ADMIN_EDGE_FUNCTION || 'admin-users', {
      body: {
        action: 'update_user',
        user_id: userId,
        full_name: fullName,
        department: department,
        position: position,
        grade: grade,
        role: role
      }
    });

    if (res.error) {
      throw await extractEdgeFunctionError(res.error, 'Gagal mengemas kini maklumat kakitangan.');
    }
    return res.data && res.data.user ? res.data.user : res.data;
  }

  async function adminResetPassword(userId, newPassword) {
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      throw makeError('PASSWORD_TOO_SHORT', 'Kata laluan baharu mestilah sekurang-kurangnya 8 aksara.');
    }
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) throw new Error('Pengguna tidak ditemui.');
      user.password = newPassword;
      user.must_change_password = true;
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
      throw await extractEdgeFunctionError(res.error, 'Gagal memadam akaun kakitangan.');
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

  function isMissingAnnouncementsTable(err) {
    if (!err) return false;
    var msg = String(err.message || '');
    return err.code === 'PGRST205' || err.code === '42P01' || /announcements/i.test(msg) && /not found|does not exist/i.test(msg);
  }

  function isAnnouncementActiveAndValid(a, nowMs) {
    if (!a || !a.is_active) return false;
    if (!a.expires_at) return true;
    var expMs = Date.parse(a.expires_at);
    return Number.isNaN(expMs) || expMs > nowMs;
  }

  async function getPublicAnnouncements() {
    var nowMs = Date.now();
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      return (db.announcements || [])
        .filter(function (a) { return isAnnouncementActiveAndValid(a, nowMs); })
        .slice()
        .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
    }

    var client = getSupabaseClient();
    var res = await client
      .from('announcements')
      .select('id, title, message, level, is_active, expires_at, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (res.error && /expires_at/i.test(res.error.message || '')) {
      res = await client
        .from('announcements')
        .select('id, title, message, level, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    }

    if (res.error) {
      if (isMissingAnnouncementsTable(res.error)) return [];
      throw new Error(res.error.message || 'Gagal memuatkan pengumuman.');
    }
    return (res.data || []).filter(function (a) { return isAnnouncementActiveAndValid(a, nowMs); });
  }

  async function getAllAnnouncements() {
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      return (db.announcements || [])
        .slice()
        .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
    }

    var client = getSupabaseClient();
    var res = await client
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (res.error) {
      if (isMissingAnnouncementsTable(res.error)) return [];
      throw new Error(res.error.message || 'Gagal memuatkan senarai pengumuman.');
    }
    return res.data || [];
  }

  async function adminCreateAnnouncement(input, createdBy) {
    var message = String((input && input.message) || '').trim();
    if (!message) {
      throw makeError('ANN_EMPTY_MESSAGE', 'Sila masukkan teks pengumuman.');
    }
    var title = String((input && input.title) || '').trim() || null;
    var allowedLevels = ['info', 'warning', 'urgent'];
    var level = allowedLevels.indexOf(input && input.level) !== -1 ? input.level : 'info';
    var isActive = input && input.is_active !== undefined ? Boolean(input.is_active) : true;
    var rawExpires = String((input && input.expires_at) || '').trim();
    var expiresAt = null;
    if (rawExpires) {
      var parsedExp = new Date(rawExpires);
      if (Number.isNaN(parsedExp.getTime())) {
        throw makeError('ANN_INVALID_EXPIRY', 'Format tarikh tamat pengumuman tidak sah.');
      }
      expiresAt = parsedExp.toISOString();
    }

    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      if (!Array.isArray(db.announcements)) db.announcements = [];
      var now = new Date().toISOString();
      var item = {
        id: generateUUID(),
        title: title,
        message: message,
        level: level,
        is_active: isActive,
        expires_at: expiresAt,
        created_by: createdBy || null,
        created_at: now,
        updated_at: now
      };
      db.announcements.unshift(item);
      saveDemoDB(db);
      return item;
    }

    var client = getSupabaseClient();
    var payload = {
      title: title,
      message: message,
      level: level,
      is_active: isActive,
      expires_at: expiresAt,
      created_by: createdBy || null
    };
    var res = await client
      .from('announcements')
      .insert(payload)
      .select()
      .single();

    if (res.error && /expires_at/i.test(res.error.message || '')) {
      var fallbackPayload = Object.assign({}, payload);
      delete fallbackPayload.expires_at;
      res = await client
        .from('announcements')
        .insert(fallbackPayload)
        .select()
        .single();
    }

    if (res.error) throw new Error(res.error.message || 'Gagal menerbitkan pengumuman.');
    return res.data;
  }

  async function adminToggleAnnouncement(id, isActive) {
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      var item = (db.announcements || []).find(function (a) { return a.id === id; });
      if (!item) throw new Error('Pengumuman tidak ditemui.');
      item.is_active = Boolean(isActive);
      item.updated_at = new Date().toISOString();
      saveDemoDB(db);
      return item;
    }

    var client = getSupabaseClient();
    var res = await client
      .from('announcements')
      .update({ is_active: Boolean(isActive) })
      .eq('id', id)
      .select()
      .single();

    if (res.error) throw new Error(res.error.message || 'Gagal mengemas kini status pengumuman.');
    return res.data;
  }

  async function adminDeleteAnnouncement(id) {
    if (!isSupabaseConfigured()) {
      var db = loadDemoDB();
      db.announcements = (db.announcements || []).filter(function (a) { return a.id !== id; });
      saveDemoDB(db);
      return true;
    }

    var client = getSupabaseClient();
    var res = await client
      .from('announcements')
      .delete()
      .eq('id', id);

    if (res.error) throw new Error(res.error.message || 'Gagal memadamkan pengumuman.');
    return true;
  }

  var api = {
    MIN_PASSWORD_LENGTH: MIN_PASSWORD_LENGTH,
    isSupabaseConfigured: isSupabaseConfigured,
    resolveAuthEmail: resolveAuthEmail,
    validateUsername: validateUsername,
    buildValidatedDeclaration: buildValidatedDeclaration,
    getCurrentSession: getCurrentSession,
    signIn: signIn,
    signOut: signOut,
    changeOwnPassword: changeOwnPassword,
    getDeclarationCycles: getDeclarationCycles,
    adminStartNewCycle: adminStartNewCycle,
    getMyDeclaration: getMyDeclaration,
    getMyLatestDeclaration: getMyLatestDeclaration,
    getUserDeclarationHistory: getUserDeclarationHistory,
    upsertMyDeclaration: upsertMyDeclaration,
    getAdminDashboardData: getAdminDashboardData,
    adminCreateUser: adminCreateUser,
    adminUpdateUser: adminUpdateUser,
    adminResetPassword: adminResetPassword,
    adminToggleActive: adminToggleActive,
    adminDeleteUser: adminDeleteUser,
    adminDeleteDeclaration: adminDeleteDeclaration,
    getPublicAnnouncements: getPublicAnnouncements,
    getAllAnnouncements: getAllAnnouncements,
    adminCreateAnnouncement: adminCreateAnnouncement,
    adminToggleAnnouncement: adminToggleAnnouncement,
    adminDeleteAnnouncement: adminDeleteAnnouncement,
    resetDemoData: resetDemoData
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.AppStore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
