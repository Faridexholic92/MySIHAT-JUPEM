/**
 * Modul Penyetempatan Bahasa (i18n):
 * - 'ms': Bahasa Melayu Baku (mengikut pedoman Dewan Bahasa dan Pustaka)
 * - 'en': English
 */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'deklarasi_kesihatan_lang_v1';

  var MALAY_MONTHS = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  var ENGLISH_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var CONDITION_MAP = {
    'Asma / Lelah': {
      ms: 'Asma (Lelah)',
      en: 'Asthma'
    },
    'Darah Tinggi (Hipertensi)': {
      ms: 'Tekanan Darah Tinggi (Hipertensi)',
      en: 'Hypertension (High Blood Pressure)'
    },
    'Kencing Manis (Diabetes)': {
      ms: 'Diabetes (Kencing Manis)',
      en: 'Diabetes Mellitus'
    },
    'Penyakit Jantung': {
      ms: 'Penyakit Jantung',
      en: 'Heart Disease'
    },
    'Alahan (Ubat / Makanan / Persekitaran)': {
      ms: 'Alahan (Ubat, Makanan atau Persekitaran)',
      en: 'Allergies (Medication, Food, or Environment)'
    },
    'Kolesterol Tinggi': {
      ms: 'Kolesterol Tinggi',
      en: 'High Cholesterol'
    },
    'Migrain / Sakit Kepala Kronik': {
      ms: 'Migrain atau Sakit Kepala Kronik',
      en: 'Migraine / Chronic Headache'
    },
    'Gastric / GERD': {
      ms: 'Gastrik / GERD',
      en: 'Gastritis / GERD'
    },
    'Masalah Buah Pinggang': {
      ms: 'Masalah Buah Pinggang',
      en: 'Kidney Disease'
    },
    'Masalah Tulang Belakang / Sendi': {
      ms: 'Masalah Tulang Belakang atau Sendi',
      en: 'Spine / Joint Problems'
    },
    'Masalah Penglihatan / Pendengaran': {
      ms: 'Masalah Penglihatan atau Pendengaran',
      en: 'Vision / Hearing Impairment'
    }
  };

  var STATUS_MAP = {
    'Sihat': { ms: 'Sihat', en: 'Healthy' },
    'Dalam Pemantauan / Rawatan': { ms: 'Dalam Pemantauan atau Rawatan', en: 'Under Observation / Treatment' },
    'Mempunyai Masalah Kesihatan': { ms: 'Mempunyai Masalah Kesihatan', en: 'Has Health Condition' },
    'Belum Mengisi': { ms: 'Belum Mengisi', en: 'Not Submitted' }
  };

  var GENDER_MAP = {
    'Lelaki': { ms: 'Lelaki', en: 'Male' },
    'Perempuan': { ms: 'Perempuan', en: 'Female' }
  };

  var DICT = {
    ms: {
      appTitle: 'Sistem Pengisytiharan Kesihatan Kakitangan',
      appShortTitle: 'MySIHAT-JUPEM',
      appSubtitle: 'JUPEM SABAH',
      demoBannerPrefix: 'Mod Simulasi Tempatan:',
      demoBannerText: 'Data disimpan dalam pelayar web ini sahaja. Lengkapkan fail',
      demoBannerSuffix: 'untuk pautan ke Supabase sebenar.',
      resetDemoBtn: 'Set Semula Data Simulasi',
      confirmResetDemo: 'Adakah anda pasti mahu menetapkan semula semua data simulasi kepada keadaan asal?',
      demoResetToast: 'Data simulasi berjaya ditetapkan semula.',

      roleAdmin: 'Pentadbir',
      roleStaff: 'Kakitangan',
      navOverview: 'Ringkasan & Rekod',
      navAccounts: 'Akaun Kakitangan',
      navAdmin: 'Paparan Pentadbir (Semua Kakitangan)',
      navMyDeclAdmin: 'Pengisytiharan Saya',
      navMyDeclStaff: 'Pengisytiharan Kesihatan Saya',
      changeOwnPwBtn: 'Tukar Kata Laluan',
      logoutBtn: 'Log Keluar',
      loggedOutToast: 'Anda telah berjaya log keluar.',

      // Log Masuk
      loginHeroTitle: 'MySIHAT-JUPEM SABAH',
      loginHeading: 'Sistem Pengisytiharan Kesihatan Kakitangan',
      loginFormHeading: 'Log Masuk Portal Kakitangan',
      loginSubheading: 'Sila log masuk untuk mengisi atau mengemas kini maklumat kesihatan anda.',
      loginChip1: 'Pengisian Pantas 3 Langkah',
      loginChip2: 'Pantauan Mengikut Seksyen',
      loginChip3: 'Rekod Sulit & Terlindung',
      loginUsernameLabel: 'E-mel Rasmi (@jupem.gov.my) atau ID Pengguna',
      loginUsernamePlaceholder: 'Contoh: nama@jupem.gov.my atau nama',
      loginPasswordLabel: 'Kata Laluan',
      loginPasswordPlaceholder: 'Masukkan kata laluan anda',
      showPw: 'Papar',
      hidePw: 'Sembunyi',
      loginSubmitBtn: 'Log Masuk',
      loginSubmittingBtn: 'Sedang mengesahkan...',
      loginNotice: 'Akses terhad kepada kakitangan berdaftar sahaja. Akaun dan kata laluan hanya disediakan oleh Pentadbir.',
      demoBoxTitle: 'Akaun Ujian (Mod Simulasi Tempatan)',
      demoBoxDesc: 'Klik mana-mana akaun di bawah untuk mengisi ruangan log masuk secara automatik:',
      demoBtnAdmin: 'Pentadbir (admin)',
      demoBtnStaffDone: 'Kakitangan Sudah Mengisi (aminah)',
      demoBtnStaffPending: 'Kakitangan Belum Mengisi (farid)',
      welcomeToast: 'Selamat datang, {name}!',

      // Borang Kakitangan (3 Langkah)
      staffPageTitle: 'Pengisytiharan Kesihatan Kakitangan',
      staffPageDesc: 'Maklumat anda adalah sulit dan hanya dapat dilihat oleh anda sendiri serta Pentadbir yang diberi kuasa.',
      staffBannerRecorded: 'Pengisytiharan kesihatan anda telah direkodkan. Kemas kini terakhir: {time}. Anda boleh mengemas kini borang ini pada bila-bila masa.',
      staffBannerPending: 'Anda belum menghantar borang pengisytiharan kesihatan. Sila lengkapkan ketiga-tiga langkah di bawah.',

      step1Short: 'Maklumat Diri & KP',
      step2Short: 'Status & Penyakit',
      step3Short: 'Semak & Hantar',
      btnNextStep: 'Seterusnya',
      btnPrevStep: 'Kembali',

      sec1Title: 'Maklumat Peribadi dan Pengesahan Kad Pengenalan',
      sec1Desc: 'Umur, tarikh lahir, dan jantina akan dikira secara automatik daripada Nombor Kad Pengenalan.',
      fullNameLabel: 'Nama Penuh',
      fullNamePlaceholder: 'Seperti dalam Kad Pengenalan',
      icLabel: 'Nombor Kad Pengenalan',
      icPlaceholder: 'Contoh: 900512-12-5431',
      icHintDefault: 'Masukkan 12 digit Nombor Kad Pengenalan (dengan atau tanpa tanda sempang).',
      icHintValid: 'Format sah: {formatted}',
      icOutAgeLabel: 'Umur (Kiraan Automatik)',
      icOutDobLabel: 'Tarikh Lahir',
      icOutGenderLabel: 'Jantina',
      icOutStateLabel: 'Negeri Kelahiran',
      ageUnit: '{age} tahun',
      ageShort: '{age} thn',
      overseasState: 'Luar Negara / Kod Khas',
      deptLabel: 'Cawangan / Seksyen / Unit',
      deptPlaceholder: 'Contoh: Seksyen Penawanan Data',
      phoneLabel: 'Nombor Telefon Bimbit',
      phonePlaceholder: 'Contoh: 012-3456789',

      sec2Title: 'Status Kesihatan dan Rekod Penyakit',
      sec2Desc: 'Pilih status kesihatan semasa anda serta nyatakan penyakit atau ubat-ubatan jika ada.',
      healthStatusLabel: 'Status Kesihatan Semasa',
      statusHealthyTitle: 'Sihat',
      statusHealthyDesc: 'Cergas dan tiada masalah kesihatan semasa.',
      statusMonitorTitle: 'Dalam Pemantauan atau Rawatan',
      statusMonitorDesc: 'Sedang menerima rawatan berkala atau pemantauan pegawai perubatan.',
      statusIssueTitle: 'Mempunyai Masalah Kesihatan',
      statusIssueDesc: 'Menghidap penyakit kronik, alahan serius atau keadaan kesihatan tertentu.',
      conditionsListLabel: 'Senarai Penyakit atau Keadaan Kesihatan (Jika Berkaitan)',
      clearConditionsBtn: 'Kosongkan pilihan penyakit',
      otherConditionsLabel: 'Penyakit Lain atau Perincian Kesihatan',
      otherConditionsPlaceholder: 'Nyatakan penyakit lain, sejarah pembedahan, atau alahan makanan dan ubat secara terperinci (jika ada).',
      medicationsLabel: 'Ubat-ubatan yang Sedang Diambil',
      medicationsPlaceholder: 'Contoh: Metformin 500mg, Penyedut Salbutamol, atau biarkan kosong jika tiada.',
      emergencyLabel: 'Maklumat Waris Kecemasan (Nama dan No. Telefon)',
      emergencyPlaceholder: 'Contoh: Ahmad (Suami) - 019-1234567',
      notesLabel: 'Catatan Tambahan',
      notesPlaceholder: 'Sebarang makluman tambahan untuk rujukan pihak pentadbiran',

      sec3Title: 'Semakan Akhir dan Perakuan',
      sec3Desc: 'Sila semak ringkasan maklumat anda sebelum menghantar pengisytiharan ini.',
      summaryName: 'Nama Penuh',
      summaryIC: 'No. Kad Pengenalan',
      summaryAgeGender: 'Umur & Jantina',
      summaryDept: 'Cawangan / Seksyen',
      summaryStatus: 'Status Kesihatan',
      summaryConditions: 'Penyakit / Kondisi',
      ackText: 'Saya mengaku bahawa semua maklumat yang dinyatakan dalam borang pengisytiharan kesihatan ini adalah benar dan tepat.',
      submitDeclBtn: 'Hantar Pengisytiharan Kesihatan',
      updateDeclBtn: 'Kemas Kini Pengisytiharan Kesihatan',
      savingDeclBtn: 'Sedang menyimpan...',
      declSavedToast: 'Pengisytiharan kesihatan berjaya disimpan.',
      errNeedConditionDetails: 'Sila pilih sekurang-kurangnya satu penyakit daripada senarai atau nyatakan butiran pada ruangan "Penyakit Lain atau Perincian Kesihatan".',
      errStep1Incomplete: 'Sila lengkapkan Nama Penuh dan 12 digit Nombor Kad Pengenalan yang sah sebelum meneruskan.',
      errStep2Incomplete: 'Sila pilih Status Kesihatan Semasa anda sebelum meneruskan.',

      // Paparan Pentadbir
      adminPageTitle: 'Panel Pentadbir — Rekod Kesihatan Kakitangan',
      adminPageDesc: 'Pemantauan menyeluruh rekod kesihatan kakitangan mengikut seksyen, tapisan belum mengisi, eksport Excel atau CSV, dan pengurusan akaun.',
      refreshBtn: 'Muat Semula',
      refreshDoneToast: 'Data terkini telah dimuat semula.',
      addStaffBtn: '+ Tambah Kakitangan',
      addStaffBtnLong: '+ Cipta Akaun Kakitangan Baharu',

      kpiTotalStaff: 'Jumlah Kakitangan',
      kpiActiveSub: '{count} akaun aktif',
      kpiDeclared: 'Sudah Mengisi',
      kpiDeclaredSub: '{pct}% selesai diisi',
      kpiHealthy: 'Status Sihat',
      kpiHealthySub: 'Tiada masalah kesihatan',
      kpiAttention: 'Perlu Perhatian',
      kpiUndeclaredSub: '{count} kakitangan belum mengisi',

      chartSectionTitle: 'Pematuhan Mengikut Seksyen / Cawangan',
      chartSectionHint: 'Klik mana-mana seksyen untuk menapis senarai di bawah',
      chartStatusTitle: 'Taburan Status',
      chartLegendHealthy: 'Sihat',
      chartLegendAttention: 'Pemantauan / Masalah',
      chartLegendPending: 'Belum Mengisi',

      tabDeclarations: 'Senarai Pengisytiharan Kakitangan',
      tabUsers: 'Pengurusan Akaun Kakitangan',
      searchDeclPlaceholder: 'Cari nama, e-mel, No. KP, seksyen, penyakit atau ubat...',
      filterAllSections: 'Semua Seksyen',
      filterAllStatus: 'Semua Status',
      filterAllConditions: 'Semua Penyakit',
      filterLabelSection: 'Seksyen',
      filterLabelStatus: 'Status',
      badgeUndeclaredCount: '{count} kakitangan belum mengisi',
      badgeMatchedCount: '{count} kakitangan dipaparkan',
      exportCsvBtn: 'CSV',
      exportExcelBtn: 'Eksport Excel',
      printBtn: 'Cetak',
      noExportRowsToast: 'Tiada rekod untuk dieksport.',
      csvDownloadedToast: 'Fail CSV berjaya dimuat turun.',
      excelDownloadedToast: 'Fail Excel (.xls) berjaya dieksport.',

      thStaff: 'Kakitangan',
      thSection: 'Cawangan / Seksyen',
      thIC: 'No. Kad Pengenalan',
      thAgeGender: 'Umur',
      thHealthStatus: 'Status Kesihatan',
      thConditionsMeds: 'Penyakit & Ubat',
      thUpdatedAt: 'Kemas Kini',
      thActions: 'Tindakan',
      noConditionsReported: 'Tiada penyakit dilaporkan',
      otherShort: 'Lain:',
      medsShort: 'Ubat:',
      btnDetails: 'Butiran',
      btnDelete: 'Padam',
      waitingSubmission: 'Belum mengisi',
      emptyDeclarations: 'Tiada rekod kakitangan yang sepadan dengan carian atau penapis anda.',

      searchUserPlaceholder: 'Cari nama penuh, ID pengguna, e-mel atau seksyen...',
      thNameUser: 'Nama & E-mel Kakitangan',
      thDept: 'Cawangan / Seksyen',
      thRole: 'Peranan',
      thAccountStatus: 'Status Akaun',
      thDeclStatus: 'Status Pengisytiharan',
      badgeActive: 'Aktif',
      badgeInactive: 'Dinyahaktifkan',
      badgeDeclared: 'Sudah Mengisi',
      badgeNotDeclared: 'Belum Mengisi',
      youTag: '(Anda)',
      btnResetPw: 'Set Semula Kata Laluan',
      btnDeactivate: 'Nyahaktifkan',
      btnActivate: 'Aktifkan',
      emptyUsers: 'Tiada akaun kakitangan ditemui.',

      // Modal Butiran
      modalDetailTitle: 'Butiran Kesihatan: {name}',
      modalCloseBtn: 'Tutup',
      detailFullName: 'Nama Penuh',
      detailUserDept: 'E-mel / Seksyen',
      detailIC: 'Nombor Kad Pengenalan',
      detailAgeGenderDob: 'Umur / Jantina / Tarikh Lahir',
      detailBirthState: 'Negeri Kelahiran (Kod KP)',
      detailPhone: 'Nombor Telefon',
      detailStatus: 'Status Kesihatan',
      detailConditions: 'Senarai Penyakit Dipilih',
      detailNoConditions: 'Tiada penyakit dalam senarai dipilih.',
      detailOtherConditions: 'Penyakit Lain atau Perincian Kesihatan',
      detailMedications: 'Ubat-ubatan yang Diambil',
      detailEmergency: 'Maklumat Waris Kecemasan',
      detailUpdated: 'Kemas Kini Terakhir',
      detailNotes: 'Catatan Tambahan',

      // Modal Cipta Akaun Kakitangan
      modalCreateTitle: 'Tambah Akaun Kakitangan Baharu',
      cuFullNameLabel: 'Nama Penuh Kakitangan',
      cuFullNamePlaceholder: 'Contoh: Nurul Izzah binti Ali',
      cuUsernameLabel: 'ID Pengguna',
      cuUsernamePlaceholder: 'Contoh: nurul.izzah',
      cuUsernameHint: 'Huruf kecil, nombor, titik (.), garis bawah (_) atau tanda sempang (-) sahaja.',
      cuEmailLabel: 'Alamat E-mel Rasmi (@jupem.gov.my)',
      cuEmailPlaceholder: 'Contoh: nurul.izzah@jupem.gov.my',
      cuEmailHint: 'Diisi automatik dengan @jupem.gov.my atau boleh diubah kepada alamat e-mel penuh kakitangan.',
      cuDeptLabel: 'Cawangan / Seksyen',
      cuDeptPlaceholder: 'Contoh: Seksyen Penawanan Data',
      cuRoleLabel: 'Peranan Akaun',
      cuRoleStaff: 'Kakitangan (Isi borang sahaja)',
      cuRoleAdmin: 'Pentadbir (Lihat semua dan urus kakitangan)',
      cuPasswordLabel: 'Kata Laluan Awal',
      cuGenPasswordBtn: 'Jana Kata Laluan Rawak',
      cuPasswordPlaceholder: 'Minimum 6 aksara',
      cuSuccessTitle: 'Akaun berjaya dicipta!',
      cuCopyBtn: 'Salin ID dan Kata Laluan',
      cuSubmitBtn: 'Cipta Akaun',
      cuSubmittingBtn: 'Sedang mencipta...',
      cuCreatedToast: 'Akaun "{username}" berjaya dicipta.',
      copiedToast: 'Maklumat log masuk berjaya disalin.',
      copyFallbackToast: 'Sila salin teks tersebut secara manual.',

      // Modal Set Semula & Tukar Kata Laluan
      modalResetPwTitle: 'Set Semula Kata Laluan Kakitangan',
      rpDescPrefix: 'Tetapkan kata laluan baharu untuk',
      rpNewPwLabel: 'Kata Laluan Baharu',
      rpCancelBtn: 'Batal',
      rpSaveBtn: 'Simpan Kata Laluan',
      rpSavedToast: 'Kata laluan baharu berjaya disimpan.',

      modalOwnPwTitle: 'Tukar Kata Laluan Saya',
      opNewPwLabel: 'Kata Laluan Baharu',
      opConfirmPwLabel: 'Sahkan Kata Laluan Baharu',
      opConfirmPlaceholder: 'Ulang kata laluan baharu',
      opMismatchErr: 'Pengesahan kata laluan tidak sepadan.',
      opUpdateBtn: 'Kemas Kini',
      opUpdatedToast: 'Kata laluan anda berjaya dikemas kini.',

      confirmDeleteDecl: 'Adakah anda pasti mahu memadam rekod pengisytiharan kesihatan milik {name}?',
      declDeletedToast: 'Rekod pengisytiharan telah dipadamkan.',
      confirmDeactivateUser: 'Nyahaktifkan akaun ini? Kakitangan tersebut tidak akan dapat log masuk.',
      confirmActivateUser: 'Aktifkan semula akaun ini?',
      userActivatedToast: 'Akaun telah diaktifkan.',
      userDeactivatedToast: 'Akaun telah dinyahaktifkan.',
      confirmDeleteUser: 'AMARAN: Padam akaun "{label}" berserta rekod kesihatannya secara kekal?',
      userDeletedToast: 'Akaun berjaya dipadamkan.',

      exportSheetName: 'Pengisytiharan Kesihatan',
      exportHeaders: [
        'Bil.',
        'Nama Penuh',
        'ID Pengguna',
        'E-mel',
        'Cawangan / Seksyen',
        'No. Kad Pengenalan',
        'Tarikh Lahir',
        'Umur (Tahun)',
        'Jantina',
        'Negeri Kelahiran',
        'No. Telefon',
        'Status Kesihatan',
        'Senarai Penyakit',
        'Penyakit Lain / Perincian',
        'Ubat-ubatan',
        'Waris Kecemasan',
        'Catatan',
        'Kemas Kini Terakhir'
      ]
    },

    en: {
      appTitle: 'Staff Health Declaration System',
      appShortTitle: 'MySIHAT-JUPEM',
      appSubtitle: 'JUPEM SABAH',
      demoBannerPrefix: 'Local Simulation Mode:',
      demoBannerText: 'Data is stored in this browser only. Fill in',
      demoBannerSuffix: 'to connect to live Supabase.',
      resetDemoBtn: 'Reset Demo Data',
      confirmResetDemo: 'Are you sure you want to reset all demo data to its initial state?',
      demoResetToast: 'Demo data has been reset.',

      roleAdmin: 'Admin',
      roleStaff: 'Staff',
      navOverview: 'Overview & Records',
      navAccounts: 'Staff Accounts',
      navAdmin: 'Admin Dashboard (All Staff)',
      navMyDeclAdmin: 'My Declaration',
      navMyDeclStaff: 'My Health Declaration',
      changeOwnPwBtn: 'Change Password',
      logoutBtn: 'Sign Out',
      loggedOutToast: 'You have signed out.',

      // Login
      loginHeroTitle: 'MySIHAT-JUPEM SABAH',
      loginHeading: 'Staff Health Declaration System',
      loginFormHeading: 'Staff Portal Sign In',
      loginSubheading: 'Sign in to submit or update your health declaration.',
      loginChip1: 'Quick 3-Step Submission',
      loginChip2: 'Section-Level Tracking',
      loginChip3: 'Confidential & Protected Records',
      loginUsernameLabel: 'Official Email (@jupem.gov.my) or User ID',
      loginUsernamePlaceholder: 'e.g. name@jupem.gov.my or name',
      loginPasswordLabel: 'Password',
      loginPasswordPlaceholder: 'Enter your password',
      showPw: 'Show',
      hidePw: 'Hide',
      loginSubmitBtn: 'Sign In',
      loginSubmittingBtn: 'Verifying...',
      loginNotice: 'Access is restricted to registered staff only. Accounts and passwords are created exclusively by the Administrator.',
      demoBoxTitle: 'Test Accounts (Local Demo Mode)',
      demoBoxDesc: 'Click any account below to auto-fill the sign-in form:',
      demoBtnAdmin: 'Admin (admin)',
      demoBtnStaffDone: 'Submitted Staff (aminah)',
      demoBtnStaffPending: 'Pending Staff (farid)',
      welcomeToast: 'Welcome, {name}!',

      // Staff Form
      staffPageTitle: 'Staff Health Declaration',
      staffPageDesc: 'Your information is confidential and visible only to yourself and authorised Administrators.',
      staffBannerRecorded: 'Your health declaration has been recorded. Last updated: {time}. You may update this form at any time.',
      staffBannerPending: 'You have not submitted a health declaration yet. Please complete all 3 steps below.',

      step1Short: 'Personal & NRIC',
      step2Short: 'Health & Conditions',
      step3Short: 'Review & Submit',
      btnNextStep: 'Next Step',
      btnPrevStep: 'Back',

      sec1Title: 'Personal Information & NRIC Verification',
      sec1Desc: 'Age, date of birth, and gender are calculated automatically from your Malaysian NRIC number.',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'As stated on your Identity Card',
      icLabel: 'NRIC / Identity Card Number',
      icPlaceholder: 'e.g. 900512-12-5431',
      icHintDefault: 'Enter your 12-digit NRIC number (with or without hyphens).',
      icHintValid: 'Valid format: {formatted}',
      icOutAgeLabel: 'Age (Auto-Calculated)',
      icOutDobLabel: 'Date of Birth',
      icOutGenderLabel: 'Gender',
      icOutStateLabel: 'Birth State',
      ageUnit: '{age} years',
      ageShort: '{age} yrs',
      overseasState: 'Overseas / Special Code',
      deptLabel: 'Branch / Section / Unit',
      deptPlaceholder: 'e.g. Data Acquisition Section',
      phoneLabel: 'Mobile Phone Number',
      phonePlaceholder: 'e.g. 012-3456789',

      sec2Title: 'Health Status & Medical Conditions',
      sec2Desc: 'Select your current health status and list any medical conditions or medications if applicable.',
      healthStatusLabel: 'Current Health Status',
      statusHealthyTitle: 'Healthy',
      statusHealthyDesc: 'Fit and no current health issues.',
      statusMonitorTitle: 'Under Observation / Treatment',
      statusMonitorDesc: 'Currently receiving regular treatment or medical monitoring.',
      statusIssueTitle: 'Has Health Condition',
      statusIssueDesc: 'Has chronic illness, severe allergies, or specific health conditions.',
      conditionsListLabel: 'Common Medical Conditions (If Applicable)',
      clearConditionsBtn: 'Clear selected conditions',
      otherConditionsLabel: 'Other Conditions / Health Details',
      otherConditionsPlaceholder: 'Specify any other illnesses, surgical history, or food/drug allergies in detail (if any).',
      medicationsLabel: 'Current Medications',
      medicationsPlaceholder: 'e.g. Metformin 500mg, Salbutamol Inhaler, or leave blank if none.',
      emergencyLabel: 'Emergency Contact (Name & Phone)',
      emergencyPlaceholder: 'e.g. Ahmad (Spouse) - 019-1234567',
      notesLabel: 'Additional Notes',
      notesPlaceholder: 'Any additional remarks for administrative reference',

      sec3Title: 'Final Review & Declaration',
      sec3Desc: 'Please verify your summary below before submitting.',
      summaryName: 'Full Name',
      summaryIC: 'NRIC Number',
      summaryAgeGender: 'Age & Gender',
      summaryDept: 'Section / Unit',
      summaryStatus: 'Health Status',
      summaryConditions: 'Medical Conditions',
      ackText: 'I hereby declare that all information provided in this health declaration form is true and accurate.',
      submitDeclBtn: 'Submit Health Declaration',
      updateDeclBtn: 'Update Health Declaration',
      savingDeclBtn: 'Saving...',
      declSavedToast: 'Health declaration saved successfully.',
      errNeedConditionDetails: 'Please select at least one condition from the list or provide details under "Other Conditions / Health Details".',
      errStep1Incomplete: 'Please enter your Full Name and a valid 12-digit NRIC number to continue.',
      errStep2Incomplete: 'Please select your Current Health Status to continue.',

      // Admin Dashboard
      adminPageTitle: 'Admin Dashboard — Staff Health Records',
      adminPageDesc: 'Full overview by section, pending submission tracking, Excel/CSV export, and staff account management.',
      refreshBtn: 'Refresh',
      refreshDoneToast: 'Latest data refreshed.',
      addStaffBtn: '+ Add Staff',
      addStaffBtnLong: '+ Create New Staff Account',

      kpiTotalStaff: 'Total Staff',
      kpiActiveSub: '{count} active accounts',
      kpiDeclared: 'Submitted',
      kpiDeclaredSub: '{pct}% completed',
      kpiHealthy: 'Healthy Status',
      kpiHealthySub: 'No reported health issues',
      kpiAttention: 'Needs Attention',
      kpiUndeclaredSub: '{count} staff not submitted',

      chartSectionTitle: 'Compliance by Section / Branch',
      chartSectionHint: 'Click any section bar to filter the table below',
      chartStatusTitle: 'Status Distribution',
      chartLegendHealthy: 'Healthy',
      chartLegendAttention: 'Monitoring / Condition',
      chartLegendPending: 'Not Submitted',

      tabDeclarations: 'Health Declarations List',
      tabUsers: 'Staff Account Management',
      searchDeclPlaceholder: 'Search name, email, NRIC, section, condition or medication...',
      filterAllSections: 'All Sections',
      filterAllStatus: 'All Statuses',
      filterAllConditions: 'All Conditions',
      filterLabelSection: 'Section',
      filterLabelStatus: 'Status',
      badgeUndeclaredCount: '{count} not submitted',
      badgeMatchedCount: '{count} staff shown',
      exportCsvBtn: 'CSV',
      exportExcelBtn: 'Export Excel',
      printBtn: 'Print',
      noExportRowsToast: 'No records available to export.',
      csvDownloadedToast: 'CSV file downloaded successfully.',
      excelDownloadedToast: 'Excel (.xls) file exported successfully.',

      thStaff: 'Staff',
      thSection: 'Section / Branch',
      thIC: 'NRIC Number',
      thAgeGender: 'Age',
      thHealthStatus: 'Health Status',
      thConditionsMeds: 'Conditions & Meds',
      thUpdatedAt: 'Updated',
      thActions: 'Actions',
      noConditionsReported: 'No conditions reported',
      otherShort: 'Other:',
      medsShort: 'Meds:',
      btnDetails: 'Details',
      btnDelete: 'Delete',
      waitingSubmission: 'Pending',
      emptyDeclarations: 'No staff records match your search or filters.',

      searchUserPlaceholder: 'Search full name, username, email or section...',
      thNameUser: 'Name & Email',
      thDept: 'Section / Branch',
      thRole: 'Role',
      thAccountStatus: 'Account Status',
      thDeclStatus: 'Declaration Status',
      badgeActive: 'Active',
      badgeInactive: 'Deactivated',
      badgeDeclared: 'Submitted',
      badgeNotDeclared: 'Not Submitted',
      youTag: '(You)',
      btnResetPw: 'Reset Password',
      btnDeactivate: 'Deactivate',
      btnActivate: 'Activate',
      emptyUsers: 'No user accounts found.',

      modalDetailTitle: 'Health Details: {name}',
      modalCloseBtn: 'Close',
      detailFullName: 'Full Name',
      detailUserDept: 'Email / Section',
      detailIC: 'NRIC Number',
      detailAgeGenderDob: 'Age / Gender / Date of Birth',
      detailBirthState: 'Birth State (NRIC Code)',
      detailPhone: 'Phone Number',
      detailStatus: 'Health Status',
      detailConditions: 'Selected Conditions',
      detailNoConditions: 'No listed conditions selected.',
      detailOtherConditions: 'Other Conditions / Health Details',
      detailMedications: 'Current Medications',
      detailEmergency: 'Emergency Contact',
      detailUpdated: 'Last Updated',
      detailNotes: 'Additional Notes',

      modalCreateTitle: 'Create New Staff Account',
      cuFullNameLabel: 'Staff Full Name',
      cuFullNamePlaceholder: 'e.g. Nurul Izzah binti Ali',
      cuUsernameLabel: 'User ID (Username)',
      cuUsernamePlaceholder: 'e.g. nurul.izzah',
      cuUsernameHint: 'Lowercase letters, numbers, dots (.), underscores (_) or hyphens (-) only.',
      cuEmailLabel: 'Official Email Address (@jupem.gov.my)',
      cuEmailPlaceholder: 'e.g. nurul.izzah@jupem.gov.my',
      cuEmailHint: 'Auto-filled with @jupem.gov.my or can be customised to the staff member\'s full email.',
      cuDeptLabel: 'Branch / Section',
      cuDeptPlaceholder: 'e.g. Data Acquisition Section',
      cuRoleLabel: 'Account Role',
      cuRoleStaff: 'Staff (Form submission only)',
      cuRoleAdmin: 'Admin (View all & manage staff)',
      cuPasswordLabel: 'Initial Password',
      cuGenPasswordBtn: 'Generate Random Password',
      cuPasswordPlaceholder: 'Minimum 6 characters',
      cuSuccessTitle: 'Account created successfully!',
      cuCopyBtn: 'Copy ID & Password',
      cuSubmitBtn: 'Create Account',
      cuSubmittingBtn: 'Creating...',
      cuCreatedToast: 'Account "{username}" created successfully.',
      copiedToast: 'Login credentials copied to clipboard.',
      copyFallbackToast: 'Please copy the credentials manually.',

      modalResetPwTitle: 'Reset Staff Password',
      rpDescPrefix: 'Set a new password for',
      rpNewPwLabel: 'New Password',
      rpCancelBtn: 'Cancel',
      rpSaveBtn: 'Save Password',
      rpSavedToast: 'New password saved successfully.',

      modalOwnPwTitle: 'Change My Password',
      opNewPwLabel: 'New Password',
      opConfirmPwLabel: 'Confirm New Password',
      opConfirmPlaceholder: 'Repeat new password',
      opMismatchErr: 'Password confirmation does not match.',
      opUpdateBtn: 'Update',
      opUpdatedToast: 'Your password has been updated.',

      confirmDeleteDecl: 'Are you sure you want to delete the health declaration for {name}?',
      declDeletedToast: 'Health declaration deleted.',
      confirmDeactivateUser: 'Deactivate this account? The staff member will no longer be able to sign in.',
      confirmActivateUser: 'Reactivate this account?',
      userActivatedToast: 'Account reactivated.',
      userDeactivatedToast: 'Account deactivated.',
      confirmDeleteUser: 'WARNING: Permanently delete account "{label}" and its health records?',
      userDeletedToast: 'Account permanently deleted.',

      exportSheetName: 'Health Declarations',
      exportHeaders: [
        'No.',
        'Full Name',
        'Username',
        'Email',
        'Section / Unit',
        'NRIC Number',
        'Date of Birth',
        'Age (Years)',
        'Gender',
        'Birth State',
        'Phone Number',
        'Health Status',
        'Conditions',
        'Other Conditions / Details',
        'Medications',
        'Emergency Contact',
        'Notes',
        'Last Updated'
      ]
    }
  };

  var IC_ERRORS = {
    EMPTY: {
      ms: 'Sila masukkan Nombor Kad Pengenalan.',
      en: 'Please enter your NRIC number.'
    },
    NON_DIGIT: {
      ms: 'Nombor Kad Pengenalan hanya boleh mengandungi angka dan tanda sempang (-).',
      en: 'NRIC number may only contain digits and hyphens (-).'
    },
    LENGTH: {
      ms: 'Nombor Kad Pengenalan mestilah mengandungi tepat 12 digit (contoh: 900512-12-5431).',
      en: 'NRIC number must be exactly 12 digits (e.g. 900512-12-5431).'
    },
    INVALID_MONTH: {
      ms: 'Kod bulan pada Nombor Kad Pengenalan tidak sah (01 hingga 12).',
      en: 'Invalid birth month in NRIC number (must be 01 to 12).'
    },
    INVALID_DATE: {
      ms: 'Tarikh lahir pada 6 digit pertama Nombor Kad Pengenalan tidak wujud dalam kalendar.',
      en: 'The birth date in the first 6 NRIC digits does not exist on the calendar.'
    },
    FUTURE_DATE: {
      ms: 'Tarikh lahir pada Nombor Kad Pengenalan melebihi tarikh hari ini.',
      en: 'Birth date in the NRIC number cannot be in the future.'
    }
  };

  var STORE_ERRORS = {
    AUTH_EMPTY_ID: {
      ms: 'Sila masukkan ID Pengguna atau alamat e-mel.',
      en: 'Please enter your User ID or email address.'
    },
    AUTH_EMPTY_PASS: {
      ms: 'Sila masukkan kata laluan.',
      en: 'Please enter your password.'
    },
    AUTH_INVALID: {
      ms: 'ID Pengguna atau kata laluan tidak tepat.',
      en: 'Invalid User ID or password.'
    },
    AUTH_INACTIVE: {
      ms: 'Akaun anda telah dinyahaktifkan. Sila hubungi Pentadbir.',
      en: 'Your account has been deactivated. Please contact the Administrator.'
    },
    AUTH_NO_PROFILE: {
      ms: 'Profil akaun tidak ditemui. Sila hubungi Pentadbir.',
      en: 'Account profile not found. Please contact the Administrator.'
    },
    INVALID_USERNAME: {
      ms: 'ID Pengguna mestilah 3-32 aksara (huruf kecil, nombor, titik, garis bawah _ atau sempang - sahaja).',
      en: 'Username must be 3-32 characters (lowercase letters, numbers, dot, underscore or hyphen only).'
    },
    INVALID_EMAIL: {
      ms: 'Format alamat e-mel tidak sah.',
      en: 'Invalid email address format.'
    },
    PASSWORD_TOO_SHORT: {
      ms: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.',
      en: 'Password must be at least 6 characters long.'
    },
    INVALID_FULLNAME: {
      ms: 'Sila masukkan Nama Penuh yang sah.',
      en: 'Please enter a valid Full Name.'
    },
    INVALID_HEALTH_STATUS: {
      ms: 'Sila pilih status kesihatan semasa anda.',
      en: 'Please select your current health status.'
    },
    CONFIRM_REQUIRED: {
      ms: 'Sila tandakan perakuan bahawa maklumat yang diisi adalah benar dan tepat.',
      en: 'Please tick the declaration confirmation box.'
    },
    DUPLICATE_USERNAME: {
      ms: 'ID Pengguna "{username}" sudah digunakan.',
      en: 'Username "{username}" is already in use.'
    },
    CANNOT_DEACTIVATE_SELF: {
      ms: 'Anda tidak boleh menyahaktifkan akaun anda sendiri.',
      en: 'You cannot deactivate your own account.'
    },
    CANNOT_DELETE_SELF: {
      ms: 'Anda tidak boleh memadamkan akaun anda sendiri.',
      en: 'You cannot delete your own account.'
    },
    EDGE_FUNCTION_UNAVAILABLE: {
      ms: 'Fungsi pelayan "admin-users" belum dipasang atau tidak dapat dihubungi. Sila pasang fungsi tersebut di Supabase, atau tambah pengguna secara terus di Supabase Dashboard > Authentication > Users.',
      en: 'The "admin-users" Edge Function is not deployed or unreachable. Deploy it in Supabase, or add users directly in Supabase Dashboard > Authentication > Users.'
    }
  };

  var currentLang = 'ms';

  function loadInitialLanguage() {
    try {
      if (root.localStorage) {
        var saved = root.localStorage.getItem(STORAGE_KEY);
        if (saved === 'ms' || saved === 'en') {
          currentLang = saved;
        }
      }
    } catch (e) {
      // Abaikan jika localStorage tidak tersedia
    }
    return currentLang;
  }

  function getLanguage() {
    return currentLang;
  }

  function setLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'ms';
    try {
      if (root.localStorage) {
        root.localStorage.setItem(STORAGE_KEY, currentLang);
      }
    } catch (e) {
      // Abaikan
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = currentLang;
    }
    return currentLang;
  }

  function formatTemplate(template, params) {
    if (!params) return template;
    return String(template).replace(/\{(\w+)\}/g, function (_, k) {
      return params[k] !== undefined && params[k] !== null ? String(params[k]) : '';
    });
  }

  function t(key, params, langOverride) {
    var lang = langOverride || currentLang;
    var table = DICT[lang] || DICT.ms;
    var val = table[key] !== undefined ? table[key] : DICT.ms[key];
    if (val === undefined) return key;
    if (Array.isArray(val)) return val.slice();
    return formatTemplate(val, params);
  }

  function translateCondition(canonicalCondition, langOverride) {
    var lang = langOverride || currentLang;
    var entry = CONDITION_MAP[canonicalCondition];
    if (!entry) return canonicalCondition;
    return entry[lang] || entry.ms;
  }

  function translateStatus(canonicalStatus, langOverride) {
    var lang = langOverride || currentLang;
    var entry = STATUS_MAP[canonicalStatus];
    if (!entry) return canonicalStatus;
    return entry[lang] || entry.ms;
  }

  function translateGender(canonicalGender, langOverride) {
    var lang = langOverride || currentLang;
    var entry = GENDER_MAP[canonicalGender];
    if (!entry) return canonicalGender;
    return entry[lang] || entry.ms;
  }

  function translateBirthState(stateLabel, langOverride) {
    var lang = langOverride || currentLang;
    if (stateLabel === 'Luar Negara / Kod Khas') {
      return t('overseasState', null, lang);
    }
    return stateLabel;
  }

  function translateICError(parsed, langOverride) {
    var lang = langOverride || currentLang;
    if (!parsed || parsed.valid) return '';
    if (parsed.errorCode && IC_ERRORS[parsed.errorCode]) {
      return IC_ERRORS[parsed.errorCode][lang] || IC_ERRORS[parsed.errorCode].ms;
    }
    return parsed.error || '';
  }

  function translateStoreError(err, fallbackKey, langOverride) {
    var lang = langOverride || currentLang;
    if (err && err.code && STORE_ERRORS[err.code]) {
      return formatTemplate(STORE_ERRORS[err.code][lang] || STORE_ERRORS[err.code].ms, err.params);
    }
    if (err && err.message) return err.message;
    return fallbackKey ? t(fallbackKey, null, lang) : '';
  }

  function formatBirthDate(year, month, day, langOverride) {
    var lang = langOverride || currentLang;
    var months = lang === 'en' ? ENGLISH_MONTHS : MALAY_MONTHS;
    return day + ' ' + months[month - 1] + ' ' + year;
  }

  function formatDateTime(isoStr, langOverride) {
    if (!isoStr) return '-';
    var d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return '-';
    var lang = langOverride || currentLang;
    try {
      return d.toLocaleString(lang === 'en' ? 'en-MY' : 'ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return d.toISOString().slice(0, 16).replace('T', ' ');
    }
  }

  loadInitialLanguage();

  var api = {
    getLanguage: getLanguage,
    setLanguage: setLanguage,
    t: t,
    translateCondition: translateCondition,
    translateStatus: translateStatus,
    translateGender: translateGender,
    translateBirthState: translateBirthState,
    translateICError: translateICError,
    translateStoreError: translateStoreError,
    formatBirthDate: formatBirthDate,
    formatDateTime: formatDateTime,
    CONDITION_MAP: CONDITION_MAP
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.AppI18n = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
