/**
 * Konfigurasi Aplikasi Deklarasi Kesihatan Staf
 *
 * ARAHAN PENTADBIR:
 * 1. Untuk mod sebenar (Supabase), isi SUPABASE_URL dan SUPABASE_ANON_KEY
 *    daripada Supabase Dashboard > Project Settings > API.
 * 2. Apabila kedua-dua nilai di bawah masih kosong (""), aplikasi akan berjalan
 *    dalam Mod Demo Tempatan (localStorage) supaya anda boleh menguji UI dahulu.
 */
(function (root) {
  'use strict';

  var APP_CONFIG = {
    APP_NAME: 'Sistem Pengisytiharan Kesihatan Kakitangan',
    ORG_NAME: 'JUPEM SABAH',
    SUPABASE_URL: 'https://xnkydlqrypfgczgehhyr.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_uaDsWxeuTuBt7o0lFykshA_7ptuSNSI',
    // Domain e-mel lalai apabila staf log masuk menggunakan ID Pengguna tanpa @
    AUTH_EMAIL_DOMAIN: 'jupem.gov.my',
    // Nama Supabase Edge Function untuk pengurusan akaun staf oleh Pentadbir
    ADMIN_EDGE_FUNCTION: 'admin-users'
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
  } else {
    root.APP_CONFIG = APP_CONFIG;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
