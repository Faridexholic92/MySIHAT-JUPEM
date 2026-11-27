(function (root) {
  'use strict';

  var APP_CONFIG = {
    APP_NAME: 'Sistem Pengisytiharan Kesihatan Kakitangan',
    ORG_NAME: 'JUPEM SABAH',
    SUPABASE_URL: 'https://xnkydlqrypfgczgehhyr.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_uaDsWxeuTuBt7o0lFykshA_7ptuSNSI',

    AUTH_EMAIL_DOMAIN: 'jupem.gov.my',

    ADMIN_EDGE_FUNCTION: 'admin-users'
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
  } else {
    root.APP_CONFIG = APP_CONFIG;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
