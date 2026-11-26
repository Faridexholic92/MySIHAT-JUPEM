'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const ICParser = require('../js/ic-parser.js');
const CSVExport = require('../js/csv-export.js');
const AppStore = require('../js/store.js');
const AppConfig = require('../js/config.js');
const AppI18n = require('../js/i18n.js');

test('ICParser mengira umur, tarikh lahir, jantina & negeri dengan tepat (1990-an)', () => {
  const refDate = new Date(2026, 10, 26); // 26 Nov 2026
  const res = ICParser.parseMalaysianIC('900512-12-5431', refDate);

  assert.equal(res.valid, true);
  assert.equal(res.digits, '900512125431');
  assert.equal(res.formatted, '900512-12-5431');
  assert.equal(res.birthDateISO, '1990-05-12');
  assert.equal(res.age, 36);
  assert.equal(res.gender, 'Lelaki');
  assert.equal(res.birthState, 'Sabah');
});

test('ICParser mengira umur tepat sebelum dan selepas hari lahir dalam tahun yang sama', () => {
  const refDate = new Date(2026, 10, 26); // 26 Nov 2026

  // Hari lahir 27 Nov 1995 (esok) -> masih 30 tahun
  const beforeBirthday = ICParser.parseMalaysianIC('951127105122', refDate);
  assert.equal(beforeBirthday.valid, true);
  assert.equal(beforeBirthday.age, 30);
  assert.equal(beforeBirthday.gender, 'Perempuan');
  assert.equal(beforeBirthday.birthState, 'Selangor');

  // Hari lahir 26 Nov 1995 (hari ini) -> genap 31 tahun
  const onBirthday = ICParser.parseMalaysianIC('951126105122', refDate);
  assert.equal(onBirthday.valid, true);
  assert.equal(onBirthday.age, 31);
});

test('ICParser menyokong abad ke-2000 termasuk tahun lompat 2000-02-29', () => {
  const refDate = new Date(2026, 10, 26);
  const leap2000 = ICParser.parseMalaysianIC('000229-14-1234', refDate);

  assert.equal(leap2000.valid, true);
  assert.equal(leap2000.birthDateISO, '2000-02-29');
  assert.equal(leap2000.age, 26);
  assert.equal(leap2000.gender, 'Perempuan');
  assert.equal(leap2000.birthState, 'W.P. Kuala Lumpur');
});

test('ICParser menolak tarikh tidak sah, aksara bukan digit, panjang salah, dan tarikh masa hadapan', () => {
  const refDate = new Date(2026, 10, 26);

  assert.equal(ICParser.parseMalaysianIC('', refDate).valid, false);
  assert.equal(ICParser.parseMalaysianIC('990229121234', refDate).valid, false); // 1999 bukan tahun lompat
  assert.equal(ICParser.parseMalaysianIC('901312121234', refDate).valid, false); // bulan 13
  assert.equal(ICParser.parseMalaysianIC('90051212123', refDate).valid, false);  // 11 digit
  assert.equal(ICParser.parseMalaysianIC('90051212ABCD', refDate).valid, false); // huruf
  assert.equal(ICParser.parseMalaysianIC('261231121234', refDate).valid, false); // masa hadapan (31 Dis 2026)
});

test('CSVExport mengekalkan UTF-8 BOM, escape koma/petikan, dan melindungi formula injection', () => {
  const headers = ['Nama', 'IC', 'Catatan'];
  const rows = [
    ['Ali, Ahmad', '900512-12-5431', '=SUM(A1:A2)'],
    ['Siti "Aminah"', '920418-12-5122', '+cmd|calc']
  ];
  const csv = CSVExport.buildCSV(headers, rows);

  assert.ok(csv.startsWith('\uFEFFNama,IC,Catatan\r\n'));
  assert.ok(csv.includes('"Ali, Ahmad",900512-12-5431,\'=SUM(A1:A2)'));
  assert.ok(csv.includes('"Siti ""Aminah""",920418-12-5122,\'+cmd|calc'));

  const xls = CSVExport.buildExcelXML('Kesihatan', headers, [['Ali', '900512-12-5431', 36]]);
  assert.ok(xls.includes('<Data ss:Type="String">900512-12-5431</Data>'));
  assert.ok(xls.includes('<Data ss:Type="Number">36</Data>'));
});

test('AppStore mengesahkan username, resolusi e-mel log masuk, dan deklarasi kesihatan', () => {
  assert.equal(AppStore.resolveAuthEmail('aminah'), 'aminah@jupem.gov.my');
  assert.equal(AppStore.resolveAuthEmail('farid@jupem.gov.my'), 'farid@jupem.gov.my');
  assert.equal(AppStore.resolveAuthEmail('ADMIN@Example.com'), 'admin@example.com');
  assert.equal(AppStore.validateUsername('Ali.Ahmad_01'), 'ali.ahmad_01');
  assert.equal(AppStore.validateUsername('farid.tasim@jupem.gov.my'), 'farid.tasim');
  assert.throws(() => AppStore.validateUsername('a'), /3-32/);

  const valid = AppStore.buildValidatedDeclaration({
    full_name: 'Siti Aminah',
    ic_number: '920418-12-5122',
    health_status: 'Sihat',
    conditions: ['Alahan (Ubat / Makanan / Persekitaran)'],
    confirmed_accurate: true
  });
  assert.equal(valid.ic_number, '920418125122');
  assert.equal(valid.birth_date, '1992-04-18');
  assert.equal(valid.gender, 'Perempuan');

  assert.throws(() => {
    AppStore.buildValidatedDeclaration({
      full_name: 'Siti Aminah',
      ic_number: '920418-12-5122',
      health_status: 'Sihat',
      confirmed_accurate: false
    });
  }, /perakuan/);
});

test('Aliran penuh Mod Demo: log masuk admin & staf, cipta akaun, kemaskini deklarasi, dan sekatan akaun nyahaktif', async () => {
  assert.equal(AppStore.isSupabaseConfigured(), true);

  const origUrl = AppConfig.SUPABASE_URL;
  const origKey = AppConfig.SUPABASE_ANON_KEY;
  AppConfig.SUPABASE_URL = '';
  AppConfig.SUPABASE_ANON_KEY = '';
  assert.equal(AppStore.isSupabaseConfigured(), false);

  // Sediakan mock localStorage dalam globalThis sebelum menguji aliran stor
  const storeMap = new Map();
  globalThis.localStorage = {
    getItem: (k) => (storeMap.has(k) ? storeMap.get(k) : null),
    setItem: (k, v) => storeMap.set(k, String(v)),
    removeItem: (k) => storeMap.delete(k)
  };

  try {
    AppStore.resetDemoData();

    // 1. Staf belum isi ('farid') log masuk dan isi deklarasi kesihatan
    const faridSession = await AppStore.signIn('farid', 'Staf@1234');
    assert.equal(faridSession.profile.role, 'staff');
    assert.equal(await AppStore.getMyDeclaration(faridSession.profile.id), null);

    const savedDecl = await AppStore.upsertMyDeclaration(faridSession.profile.id, {
      full_name: 'Farid bin Tasim',
      ic_number: '940815-12-5311',
      department: 'Unit ICT',
      phone: '011-1234567',
      health_status: 'Mempunyai Masalah Kesihatan',
      conditions: ['Asma / Lelah'],
      other_conditions: 'Sensitif habuk',
      medications: 'Inhaler bila perlu',
      confirmed_accurate: true
    });
    assert.equal(savedDecl.ic_number, '940815125311');
    assert.equal(savedDecl.gender, 'Lelaki');

    await AppStore.signOut();
    assert.equal(await AppStore.getCurrentSession(), null);

    // 2. Admin log masuk, lihat semua rekod, cipta staf baharu, reset password & nyahaktifkan akaun
    const adminSession = await AppStore.signIn('admin', 'Admin@1234');
    assert.equal(adminSession.profile.role, 'admin');

    const allRecords = await AppStore.getAdminDashboardData();
    assert.equal(allRecords.length, 4);
    const faridView = allRecords.find((r) => r.profile.username === 'farid');
    assert.equal(faridView.has_declared, true);
    assert.equal(faridView.health_status, 'Mempunyai Masalah Kesihatan');

    const newStaff = await AppStore.adminCreateUser({
      username: 'nadia.ali',
      email: 'nadia.rasmi@jupem.gov.my',
      password: 'Password123',
      full_name: 'Nadia binti Ali',
      department: 'Unit Kewangan',
      role: 'staff'
    });
    assert.equal(newStaff.username, 'nadia.ali');
    assert.equal(newStaff.email, 'nadia.rasmi@jupem.gov.my');

    await AppStore.adminResetPassword(newStaff.id, 'Baharu999');
    await AppStore.signOut();

    // Staf baharu boleh log masuk menggunakan e-mel penuh @jupem.gov.my
    const nadiaSession = await AppStore.signIn('nadia.rasmi@jupem.gov.my', 'Baharu999');
    assert.equal(nadiaSession.profile.role, 'staff');
    await AppStore.signOut();

    // Admin nyahaktifkan staf baharu -> staf disekat daripada log masuk
    await AppStore.signIn('admin', 'Admin@1234');
    await AppStore.adminToggleActive(newStaff.id, false, adminSession.profile.id);
    await AppStore.signOut();

    await assert.rejects(() => AppStore.signIn('nadia.ali', 'Baharu999'), /dinyahaktifkan/);
  } finally {
    AppConfig.SUPABASE_URL = origUrl;
    AppConfig.SUPABASE_ANON_KEY = origKey;
    delete globalThis.localStorage;
  }
});

test('AppI18n menyokong Bahasa Melayu baku (DBP) dan Bahasa Inggeris untuk label, status, penyakit, dan ralat', () => {
  AppI18n.setLanguage('ms');
  assert.equal(AppI18n.t('appTitle'), 'Sistem Pengisytiharan Kesihatan Staf');
  assert.equal(AppI18n.t('btnResetPw'), 'Set Semula Kata Laluan');
  assert.equal(AppI18n.translateCondition('Gastric / GERD'), 'Gastrik / GERD');
  assert.equal(AppI18n.translateStatus('Sihat'), 'Sihat');
  assert.equal(AppI18n.translateGender('Lelaki'), 'Lelaki');
  assert.equal(AppI18n.formatBirthDate(1992, 8, 15), '15 Ogos 1992');

  AppI18n.setLanguage('en');
  assert.equal(AppI18n.t('appTitle'), 'Staff Health Declaration System');
  assert.equal(AppI18n.t('btnResetPw'), 'Reset Password');
  assert.equal(AppI18n.translateCondition('Gastric / GERD'), 'Gastritis / GERD');
  assert.equal(AppI18n.translateStatus('Sihat'), 'Healthy');
  assert.equal(AppI18n.translateGender('Lelaki'), 'Male');
  assert.equal(AppI18n.formatBirthDate(1992, 8, 15), '15 August 1992');

  const invalidIC = ICParser.parseMalaysianIC('990229121234', new Date(2026, 10, 26));
  assert.match(AppI18n.translateICError(invalidIC, 'ms'), /Nombor Kad Pengenalan/);
  assert.match(AppI18n.translateICError(invalidIC, 'en'), /NRIC digits/);

  AppI18n.setLanguage('ms');
});


