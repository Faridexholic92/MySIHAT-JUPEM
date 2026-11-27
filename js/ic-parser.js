(function (root) {
  'use strict';

  var STATE_CODES = {
    '01': 'Johor', '21': 'Johor', '22': 'Johor', '23': 'Johor', '24': 'Johor',
    '02': 'Kedah', '25': 'Kedah', '26': 'Kedah', '27': 'Kedah',
    '03': 'Kelantan', '28': 'Kelantan', '29': 'Kelantan',
    '04': 'Melaka', '30': 'Melaka',
    '05': 'Negeri Sembilan', '31': 'Negeri Sembilan', '59': 'Negeri Sembilan',
    '06': 'Pahang', '32': 'Pahang', '33': 'Pahang',
    '07': 'Pulau Pinang', '34': 'Pulau Pinang', '35': 'Pulau Pinang',
    '08': 'Perak', '36': 'Perak', '37': 'Perak', '38': 'Perak', '39': 'Perak',
    '09': 'Perlis', '40': 'Perlis',
    '10': 'Selangor', '41': 'Selangor', '42': 'Selangor', '43': 'Selangor', '44': 'Selangor',
    '11': 'Terengganu', '45': 'Terengganu', '46': 'Terengganu',
    '12': 'Sabah', '47': 'Sabah', '48': 'Sabah', '49': 'Sabah',
    '13': 'Sarawak', '50': 'Sarawak', '51': 'Sarawak', '52': 'Sarawak', '53': 'Sarawak',
    '14': 'W.P. Kuala Lumpur', '54': 'W.P. Kuala Lumpur', '55': 'W.P. Kuala Lumpur', '56': 'W.P. Kuala Lumpur', '57': 'W.P. Kuala Lumpur',
    '15': 'W.P. Labuan', '58': 'W.P. Labuan',
    '16': 'W.P. Putrajaya'
  };

  var MALAY_MONTHS = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function normalizeICInput(rawValue) {
    if (typeof rawValue !== 'string') return '';
    return rawValue.replace(/[\s-]/g, '').trim();
  }

  function formatIC(rawValue) {
    var digits = normalizeICInput(rawValue);
    if (!/^\d{12}$/.test(digits)) {
      return rawValue || '';
    }
    return digits.slice(0, 6) + '-' + digits.slice(6, 8) + '-' + digits.slice(8, 12);
  }

  function calculateAgeFromYMD(year, month, day, refDate) {
    var now = refDate instanceof Date ? refDate : new Date();
    var refYear = now.getFullYear();
    var refMonth = now.getMonth() + 1;
    var refDay = now.getDate();

    var age = refYear - year;
    if (refMonth < month || (refMonth === month && refDay < day)) {
      age -= 1;
    }
    return age;
  }

  function calculateAgeFromISODate(isoDate, refDate) {
    if (!isoDate || typeof isoDate !== 'string') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
    if (!m) return null;
    return calculateAgeFromYMD(Number(m[1]), Number(m[2]), Number(m[3]), refDate);
  }

  function parseMalaysianIC(rawValue, refDate) {
    var now = refDate instanceof Date ? refDate : new Date();
    var digits = normalizeICInput(rawValue);

    if (!digits) {
      return {
        valid: false,
        empty: true,
        digits: '',
        errorCode: 'EMPTY',
        error: 'Sila masukkan Nombor Kad Pengenalan.'
      };
    }

    if (!/^\d+$/.test(digits)) {
      return {
        valid: false,
        empty: false,
        digits: digits,
        errorCode: 'NON_DIGIT',
        error: 'Nombor Kad Pengenalan hanya boleh mengandungi angka dan tanda sempang (-).'
      };
    }

    if (digits.length !== 12) {
      return {
        valid: false,
        empty: false,
        digits: digits,
        errorCode: 'LENGTH',
        error: 'Nombor Kad Pengenalan mestilah mengandungi tepat 12 digit (contoh: 900512-12-5431).'
      };
    }

    var yy = Number(digits.slice(0, 2));
    var mm = Number(digits.slice(2, 4));
    var dd = Number(digits.slice(4, 6));
    var pb = digits.slice(6, 8);
    var lastDigit = Number(digits.slice(11, 12));

    if (mm < 1 || mm > 12) {
      return {
        valid: false,
        empty: false,
        digits: digits,
        errorCode: 'INVALID_MONTH',
        error: 'Kod bulan pada Nombor Kad Pengenalan tidak sah (01 hingga 12).'
      };
    }

    var refYear = now.getFullYear();
    var refYY = refYear % 100;
    var year = (yy > refYY ? 1900 : 2000) + yy;

    var checkDate = new Date(Date.UTC(year, mm - 1, dd));
    if (
      checkDate.getUTCFullYear() !== year ||
      checkDate.getUTCMonth() !== mm - 1 ||
      checkDate.getUTCDate() !== dd
    ) {
      return {
        valid: false,
        empty: false,
        digits: digits,
        errorCode: 'INVALID_DATE',
        error: 'Tarikh lahir pada 6 digit pertama Nombor Kad Pengenalan tidak wujud dalam kalendar.'
      };
    }

    var refMonth = now.getMonth() + 1;
    var refDay = now.getDate();
    var isFuture =
      year > refYear ||
      (year === refYear && (mm > refMonth || (mm === refMonth && dd > refDay)));

    if (isFuture) {
      return {
        valid: false,
        empty: false,
        digits: digits,
        errorCode: 'FUTURE_DATE',
        error: 'Tarikh lahir pada Nombor Kad Pengenalan melebihi tarikh hari ini.'
      };
    }

    var age = calculateAgeFromYMD(year, mm, dd, now);
    var birthDateISO = year + '-' + pad2(mm) + '-' + pad2(dd);
    var birthDateDisplay = dd + ' ' + MALAY_MONTHS[mm - 1] + ' ' + year;
    var gender = lastDigit % 2 === 1 ? 'Lelaki' : 'Perempuan';
    var birthState = STATE_CODES[pb] || 'Luar Negara / Kod Khas';

    return {
      valid: true,
      empty: false,
      digits: digits,
      formatted: formatIC(digits),
      birthDateISO: birthDateISO,
      birthDateDisplay: birthDateDisplay,
      year: year,
      month: mm,
      day: dd,
      age: age,
      gender: gender,
      stateCode: pb,
      birthState: birthState,
      warning: age < 15 ? 'Semak semula Nombor IC: umur dikira kurang daripada 15 tahun.' : null
    };
  }

  var api = {
    normalizeICInput: normalizeICInput,
    formatIC: formatIC,
    calculateAgeFromYMD: calculateAgeFromYMD,
    calculateAgeFromISODate: calculateAgeFromISODate,
    parseMalaysianIC: parseMalaysianIC,
    STATE_CODES: STATE_CODES
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.ICParser = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
