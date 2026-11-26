/**
 * Pengawal Utama Antaramuka Pengguna (UI Controller)
 * MySIHAT-JUPEM — Bento UI, Borang 3 Langkah, Analitik Seksyen & Dwibahasa (BM DBP / EN)
 */
(function (root) {
  'use strict';

  var COMMON_CONDITIONS = [
    'Asma / Lelah',
    'Darah Tinggi (Hipertensi)',
    'Kencing Manis (Diabetes)',
    'Penyakit Jantung',
    'Alahan (Ubat / Makanan / Persekitaran)',
    'Kolesterol Tinggi',
    'Migrain / Sakit Kepala Kronik',
    'Gastric / GERD',
    'Masalah Buah Pinggang',
    'Masalah Tulang Belakang / Sendi',
    'Masalah Penglihatan / Pendengaran'
  ];

  var RING_CIRCUMFERENCE = 113.1; // 2 * pi * 18
  var DONUT_CIRCUMFERENCE = 276.46; // 2 * pi * 44

  var state = {
    session: null,
    activeView: 'login', // 'login' | 'staff-form' | 'admin'
    activeAdminTab: 'declarations', // 'declarations' | 'users'
    currentFormStep: 1, // 1 | 2 | 3
    myDeclaration: null,
    adminRecords: [],
    lastCreatedCredentials: '',
    lastValidICDigits: '',
    detailModalUserId: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function t(key, params) {
    return root.AppI18n.t(key, params);
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function replayAnimation(el, className) {
    if (!el) return;
    var cls = className || 'view-animate';
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function formatDateTime(isoStr) {
    return root.AppI18n.formatDateTime(isoStr);
  }

  function formatISODate(isoDate) {
    if (!isoDate) return '-';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate));
    if (!m) return isoDate;
    return m[3] + '/' + m[2] + '/' + m[1];
  }

  function getInitials(name) {
    var clean = String(name || '')
      .replace(/\b(Sr|Dr|bin|binti|bte|a\/l|a\/p|anak)\b\.?/gi, ' ')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim();
    if (!clean) return 'JK';
    var parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getAvatarColorClass(seedText) {
    var sum = 0;
    var str = String(seedText || '');
    for (var i = 0; i < str.length; i += 1) {
      sum += str.charCodeAt(i);
    }
    return 'av-' + (sum % 4);
  }

  function shortSectionLabel(sectionName) {
    var s = String(sectionName || '').trim();
    if (!s || s === '-') return '-';
    return s
      .replace(/^Cawangan\s+/i, '')
      .replace(/^Seksyen\s+/i, '');
  }

  function showToast(message, type) {
    var container = $('toast-container');
    if (!container) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () {
      el.classList.add('toast-leaving');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 240);
    }, 3500);
  }

  function setAlert(elId, message) {
    var el = $(elId);
    if (!el) return;
    if (!message) {
      el.textContent = '';
      el.classList.add('hidden');
    } else {
      el.textContent = message;
      el.classList.remove('hidden');
    }
  }

  function statusBadgeHTML(canonicalStatus) {
    var label = escapeHtml(root.AppI18n.translateStatus(canonicalStatus));
    if (canonicalStatus === 'Sihat') {
      return '<span class="badge badge-emerald">' + label + '</span>';
    }
    if (canonicalStatus === 'Dalam Pemantauan / Rawatan') {
      return '<span class="badge badge-amber">' + label + '</span>';
    }
    if (canonicalStatus === 'Mempunyai Masalah Kesihatan') {
      return '<span class="badge badge-rose">' + label + '</span>';
    }
    return '<span class="badge badge-slate">' + label + '</span>';
  }

  function openModal(modalId) {
    var el = $(modalId);
    if (el) el.classList.remove('hidden');
  }

  function closeModal(modalId) {
    var el = $(modalId);
    if (el) el.classList.add('hidden');
    if (modalId === 'modal-detail') {
      state.detailModalUserId = null;
    }
  }

  function suggestUsernameFromName(fullName) {
    var cleaned = String(fullName || '')
      .toLowerCase()
      .replace(/\b(bin|binti|bte|a\/l|a\/p|anak)\b/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (cleaned.length === 0) return '';
    if (cleaned.length === 1) return cleaned[0].slice(0, 24);
    return (cleaned[0] + '.' + cleaned[1]).slice(0, 28);
  }

  function generateRandomPassword(length) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    var out = '';
    var arr = new Uint32Array(length || 10);
    if (root.crypto && root.crypto.getRandomValues) {
      root.crypto.getRandomValues(arr);
      for (var i = 0; i < arr.length; i += 1) {
        out += chars[arr[i] % chars.length];
      }
    } else {
      for (var j = 0; j < (length || 10); j += 1) {
        out += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return out;
  }

  // ==================== PENYETEMPATAN BAHASA (BM DBP / EN) ====================

  function renderConditionsGrid(preserveChecked) {
    var checkedSet = {};
    if (preserveChecked) {
      document.querySelectorAll('#conditions-grid input[name="conditions"]:checked').forEach(function (cb) {
        checkedSet[cb.value] = true;
      });
    }

    var grid = $('conditions-grid');
    grid.innerHTML = COMMON_CONDITIONS.map(function (cond) {
      var safeVal = escapeHtml(cond);
      var label = escapeHtml(root.AppI18n.translateCondition(cond));
      var isChecked = Boolean(checkedSet[cond]);
      return (
        '<label class="condition-chip' + (isChecked ? ' checked' : '') + '">' +
        '<input type="checkbox" name="conditions" value="' + safeVal + '"' + (isChecked ? ' checked' : '') + ' />' +
        '<span class="switch-pill" aria-hidden="true"></span>' +
        '<span>' + label + '</span>' +
        '</label>'
      );
    }).join('');
  }

  function renderSelectOptions() {
    var statusSelect = $('admin-filter-status');
    var currentStatus = statusSelect.value || 'ALL';
    var statusOptions = [
      { value: 'ALL', label: t('filterAllStatus') },
      { value: 'Sihat', label: root.AppI18n.translateStatus('Sihat') },
      { value: 'Dalam Pemantauan / Rawatan', label: root.AppI18n.translateStatus('Dalam Pemantauan / Rawatan') },
      { value: 'Mempunyai Masalah Kesihatan', label: root.AppI18n.translateStatus('Mempunyai Masalah Kesihatan') },
      { value: 'Belum Mengisi', label: root.AppI18n.translateStatus('Belum Mengisi') }
    ];
    statusSelect.innerHTML = statusOptions
      .map(function (o) {
        return '<option value="' + escapeHtml(o.value) + '">' + escapeHtml(o.label) + '</option>';
      })
      .join('');
    statusSelect.value = currentStatus;

    var condSelect = $('admin-filter-condition');
    var currentCond = condSelect.value || 'ALL';
    condSelect.innerHTML =
      '<option value="ALL">' + escapeHtml(t('filterAllConditions')) + '</option>' +
      COMMON_CONDITIONS.map(function (c) {
        return '<option value="' + escapeHtml(c) + '">' + escapeHtml(root.AppI18n.translateCondition(c)) + '</option>';
      }).join('');
    condSelect.value = currentCond;

    var roleSelect = $('cu-role');
    var currentRole = roleSelect.value || 'staff';
    roleSelect.innerHTML =
      '<option value="staff">' + escapeHtml(t('cuRoleStaff')) + '</option>' +
      '<option value="admin">' + escapeHtml(t('cuRoleAdmin')) + '</option>';
    roleSelect.value = currentRole;
  }

  function updatePasswordToggleLabels() {
    document.querySelectorAll('.toggle-pw-btn').forEach(function (btn) {
      var input = $(btn.dataset.target);
      var isHidden = !input || input.type === 'password';
      btn.textContent = isHidden ? t('showPw') : t('hidePw');
    });
  }

  function updateStaffStatusBanner() {
    if (!state.session) return;
    var banner = $('staff-status-banner');
    var badgeEl = $('staff-submission-badge');
    var saveBtn = $('btn-save-declaration');
    var decl = state.myDeclaration;

    if (decl) {
      badgeEl.innerHTML = statusBadgeHTML(decl.health_status);
      banner.className = 'alert alert-success';
      banner.textContent = t('staffBannerRecorded', {
        time: formatDateTime(decl.updated_at || decl.submitted_at)
      });
      banner.classList.remove('hidden');
      saveBtn.textContent = t('updateDeclBtn');
    } else {
      badgeEl.innerHTML = statusBadgeHTML('Belum Mengisi');
      banner.className = 'alert alert-info';
      banner.textContent = t('staffBannerPending');
      banner.classList.remove('hidden');
      saveBtn.textContent = t('submitDeclBtn');
    }
  }

  function applyLanguage() {
    var lang = root.AppI18n.getLanguage();
    document.documentElement.lang = lang;

    var cfg = root.APP_CONFIG || {};
    var titleText = lang === 'ms' && cfg.APP_NAME ? cfg.APP_NAME : t('appTitle');
    document.title = 'MySIHAT-JUPEM — ' + titleText;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.dataset.i18n;
      if (key === 'loginHeading') {
        el.textContent = titleText;
      } else if (key === 'appSubtitle' && lang === 'ms' && cfg.ORG_NAME) {
        el.textContent = cfg.ORG_NAME;
      } else {
        el.textContent = t(key);
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    document.querySelectorAll('.lang-btn[data-lang]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    updatePasswordToggleLabels();
    renderConditionsGrid(true);
    renderSelectOptions();

    if (state.session) {
      renderTopbar();
      if (state.activeView === 'staff-form') {
        updateStaffStatusBanner();
        updateICPreview($('hf-ic').value, false);
        if (state.currentFormStep === 3) {
          renderStep3Summary();
        }
      } else if (state.activeView === 'admin') {
        renderAdminAllSections();
        if (state.detailModalUserId && !$('modal-detail').classList.contains('hidden')) {
          showDeclarationDetailModal(state.detailModalUserId);
        }
      }
    }
  }

  function initStaticUI() {
    var isDemo = !root.AppStore.isSupabaseConfigured();
    if (isDemo) {
      $('demo-banner').classList.remove('hidden');
      $('demo-quick-login').classList.remove('hidden');
    } else {
      $('demo-banner').classList.add('hidden');
      $('demo-quick-login').classList.add('hidden');
    }

    renderConditionsGrid(false);
    renderSelectOptions();
    applyLanguage();
  }

  // ==================== KAWALAN PAPARAN & NAVIGASI ====================

  function renderTopbar() {
    var profile = state.session ? state.session.profile : null;
    if (!profile) {
      $('topbar').classList.add('hidden');
      return;
    }
    $('topbar').classList.remove('hidden');
    $('user-display-name').textContent = profile.full_name || profile.username;
    $('sidebar-user-name').textContent = profile.full_name || profile.username;

    var roleBadge = $('user-role-badge');
    if (profile.role === 'admin') {
      roleBadge.textContent = t('roleAdmin');
      roleBadge.className = 'badge badge-teal';
    } else {
      roleBadge.textContent = t('roleStaff');
      roleBadge.className = 'badge badge-slate';
    }

    var nav = $('topbar-nav');
    if (profile.role === 'admin') {
      nav.innerHTML =
        '<button type="button" class="nav-tab ' +
        (state.activeView === 'admin' ? 'active' : '') +
        '" data-nav="admin">' + escapeHtml(t('navAdmin')) + '</button>' +
        '<button type="button" class="nav-tab ' +
        (state.activeView === 'staff-form' ? 'active' : '') +
        '" data-nav="staff-form">' + escapeHtml(t('navMyDeclAdmin')) + '</button>';
    } else {
      nav.innerHTML =
        '<button type="button" class="nav-tab active" data-nav="staff-form">' +
        escapeHtml(t('navMyDeclStaff')) +
        '</button>';
    }
  }

  async function switchView(viewName) {
    var profile = state.session ? state.session.profile : null;
    if (!profile) {
      state.activeView = 'login';
    } else if (viewName === 'admin' && profile.role !== 'admin') {
      state.activeView = 'staff-form';
    } else {
      state.activeView = viewName;
    }

    document.body.classList.toggle('in-admin-view', state.activeView === 'admin');

    var loginEl = $('view-login');
    var staffEl = $('view-staff-form');
    var adminEl = $('view-admin');

    loginEl.classList.toggle('hidden', state.activeView !== 'login');
    staffEl.classList.toggle('hidden', state.activeView !== 'staff-form');
    adminEl.classList.toggle('hidden', state.activeView !== 'admin');

    renderTopbar();

    if (state.activeView === 'login') {
      replayAnimation(loginEl.querySelector('.login-card'), 'view-animate');
    } else if (state.activeView === 'staff-form') {
      replayAnimation(staffEl, 'view-animate');
      await loadStaffForm();
    } else if (state.activeView === 'admin') {
      replayAnimation(adminEl.querySelector('.admin-main'), 'view-animate');
      await loadAdminView();
    }
  }

  // ==================== BORANG KAKITANGAN 3 LANGKAH (MOCKUP 1) ====================

  function validateStep1() {
    setAlert('hf-step1-error', '');
    var fullName = ($('hf-full-name').value || '').trim();
    var parsedIC = updateICPreview($('hf-ic').value, true);
    if (!fullName || fullName.length < 2 || !parsedIC.valid) {
      setAlert('hf-step1-error', t('errStep1Incomplete'));
      return false;
    }
    return true;
  }

  function validateStep2() {
    setAlert('hf-step2-error', '');
    var form = $('health-form');
    var statusRadio = form.querySelector('input[name="health_status"]:checked');
    if (!statusRadio) {
      setAlert('hf-step2-error', t('errStep2Incomplete'));
      return false;
    }
    var selectedConditions = form.querySelectorAll('input[name="conditions"]:checked');
    var otherConditions = ($('hf-other-conditions').value || '').trim();
    if (
      (statusRadio.value === 'Mempunyai Masalah Kesihatan' ||
        statusRadio.value === 'Dalam Pemantauan / Rawatan') &&
      selectedConditions.length === 0 &&
      !otherConditions
    ) {
      setAlert('hf-step2-error', t('errNeedConditionDetails'));
      return false;
    }
    return true;
  }

  function renderStep3Summary() {
    var form = $('health-form');
    var parsed = root.ICParser.parseMalaysianIC($('hf-ic').value);
    var statusRadio = form.querySelector('input[name="health_status"]:checked');
    var statusVal = statusRadio ? statusRadio.value : '';
    var selectedConditions = Array.prototype.slice
      .call(form.querySelectorAll('input[name="conditions"]:checked'))
      .map(function (cb) { return root.AppI18n.translateCondition(cb.value); });
    var otherCond = ($('hf-other-conditions').value || '').trim();

    var ageGenderText = parsed.valid
      ? t('ageUnit', { age: parsed.age }) + ' • ' + root.AppI18n.translateGender(parsed.gender)
      : '-';

    var condSummary = selectedConditions.length > 0
      ? selectedConditions.join(', ') + (otherCond ? ' (' + otherCond + ')' : '')
      : (otherCond || t('noConditionsReported'));

    $('hf-summary-grid').innerHTML =
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('summaryName')) + '</div><div class="detail-value">' + escapeHtml($('hf-full-name').value.trim() || '-') + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('summaryIC')) + '</div><div class="detail-value mono">' + escapeHtml(parsed.valid ? parsed.formatted : '-') + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('summaryAgeGender')) + '</div><div class="detail-value">' + escapeHtml(ageGenderText) + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('summaryDept')) + '</div><div class="detail-value">' + escapeHtml($('hf-department').value.trim() || '-') + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('summaryStatus')) + '</div><div class="detail-value">' + (statusVal ? statusBadgeHTML(statusVal) : '-') + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('summaryConditions')) + '</div><div class="detail-value">' + escapeHtml(condSummary) + '</div></div>';
  }

  function setFormStep(stepNum) {
    state.currentFormStep = stepNum;
    [1, 2, 3].forEach(function (n) {
      var panel = $('form-step-' + n);
      panel.classList.toggle('hidden', n !== stepNum);
      if (n === stepNum) replayAnimation(panel, 'view-animate');
    });

    document.querySelectorAll('#staff-stepper .stepper-btn').forEach(function (btn) {
      var s = Number(btn.dataset.step);
      btn.classList.toggle('active', s === stepNum);
      btn.classList.toggle('completed', s < stepNum);
      btn.setAttribute('aria-selected', s === stepNum ? 'true' : 'false');
    });

    var fill = $('stepper-track-fill');
    if (fill) {
      fill.setAttribute('width', String(stepNum * 100));
    }

    if (stepNum === 3) {
      renderStep3Summary();
    }
  }

  function updateICPreview(rawValue, showInvalidError) {
    var parsed = root.ICParser.parseMalaysianIC(rawValue);
    var card = $('ic-preview-card');
    var hint = $('hf-ic-hint');
    var warn = $('ic-warning');

    if (parsed.valid) {
      var justValidated = state.lastValidICDigits !== parsed.digits;
      state.lastValidICDigits = parsed.digits;

      card.classList.add('valid');
      $('ic-out-age').textContent = t('ageUnit', { age: parsed.age });
      $('ic-out-dob').textContent = root.AppI18n.formatBirthDate(parsed.year, parsed.month, parsed.day);
      $('ic-out-gender').textContent = root.AppI18n.translateGender(parsed.gender);
      $('ic-out-state').textContent = root.AppI18n.translateBirthState(parsed.birthState);

      if (justValidated) {
        ['ic-out-age', 'ic-out-dob', 'ic-out-gender', 'ic-out-state'].forEach(function (id) {
          replayAnimation($(id), 'pop-value');
        });
      }

      hint.textContent = t('icHintValid', { formatted: parsed.formatted });
      hint.className = 'field-hint success-text';

      if (parsed.warning) {
        warn.textContent =
          root.AppI18n.getLanguage() === 'en'
            ? 'Please double-check NRIC: calculated age is under 15 years.'
            : parsed.warning;
        warn.classList.remove('hidden');
      } else {
        warn.classList.add('hidden');
      }
      return parsed;
    }

    state.lastValidICDigits = '';
    card.classList.remove('valid');
    $('ic-out-age').textContent = '-';
    $('ic-out-dob').textContent = '-';
    $('ic-out-gender').textContent = '-';
    $('ic-out-state').textContent = '-';
    warn.classList.add('hidden');

    var hasNonDigit = parsed.digits && !/^\d+$/.test(parsed.digits);
    var tooLong = parsed.digits && parsed.digits.length > 12;
    if (showInvalidError || hasNonDigit || tooLong || (parsed.digits && parsed.digits.length === 12)) {
      hint.textContent = root.AppI18n.translateICError(parsed);
      hint.className = 'field-hint error-text';
    } else {
      hint.textContent = t('icHintDefault');
      hint.className = 'field-hint';
    }
    return parsed;
  }

  function syncStatusRadioVisuals() {
    document.querySelectorAll('.status-card').forEach(function (card) {
      var radio = card.querySelector('input[type="radio"]');
      card.classList.toggle('selected', Boolean(radio && radio.checked));
    });
  }

  function syncConditionChipsVisuals() {
    document.querySelectorAll('#conditions-grid .condition-chip').forEach(function (chip) {
      var cb = chip.querySelector('input[type="checkbox"]');
      chip.classList.toggle('checked', Boolean(cb && cb.checked));
    });
  }

  function populateStaffForm(profile, declaration) {
    var form = $('health-form');
    form.reset();
    state.lastValidICDigits = '';
    setAlert('hf-error', '');
    setAlert('hf-step1-error', '');
    setAlert('hf-step2-error', '');

    if (declaration) {
      $('hf-full-name').value = declaration.full_name || profile.full_name || '';
      $('hf-ic').value = root.ICParser.formatIC(declaration.ic_number || '');
      $('hf-department').value = declaration.department || profile.department || '';
      $('hf-phone').value = declaration.phone || '';
      $('hf-other-conditions').value = declaration.other_conditions || '';
      $('hf-medications').value = declaration.medications || '';
      $('hf-emergency').value = declaration.emergency_contact || '';
      $('hf-notes').value = declaration.notes || '';
      $('hf-confirm').checked = Boolean(declaration.confirmed_accurate);

      form.querySelectorAll('input[name="health_status"]').forEach(function (r) {
        r.checked = r.value === declaration.health_status;
      });

      var selectedConds = Array.isArray(declaration.conditions) ? declaration.conditions : [];
      form.querySelectorAll('input[name="conditions"]').forEach(function (cb) {
        cb.checked = selectedConds.indexOf(cb.value) !== -1;
      });
    } else {
      $('hf-full-name').value = profile.full_name || '';
      $('hf-department').value = profile.department || '';
    }

    updateStaffStatusBanner();
    syncStatusRadioVisuals();
    syncConditionChipsVisuals();
    updateICPreview($('hf-ic').value, false);
    setFormStep(1);
  }

  async function loadStaffForm() {
    var profile = state.session.profile;
    try {
      var declaration = await root.AppStore.getMyDeclaration(profile.id);
      state.myDeclaration = declaration;
      populateStaffForm(profile, declaration);
    } catch (err) {
      setAlert('hf-error', root.AppI18n.translateStoreError(err));
    }
  }

  // ==================== ANALITIK & PENAPIS PENTADBIR (MOCKUPS 2 & 3) ====================

  function computeSectionBreakdown(records) {
    var map = {};
    records.forEach(function (r) {
      var sec = (r.department && r.department !== '-' ? r.department : '').trim() || '-';
      if (!map[sec]) {
        map[sec] = { name: sec, total: 0, declared: 0, pending: 0 };
      }
      map[sec].total += 1;
      if (r.has_declared) {
        map[sec].declared += 1;
      } else {
        map[sec].pending += 1;
      }
    });

    return Object.keys(map)
      .map(function (k) {
        var item = map[k];
        item.pct = item.total > 0 ? Math.round((item.declared / item.total) * 100) : 0;
        return item;
      })
      .sort(function (a, b) {
        if (a.name === '-') return 1;
        if (b.name === '-') return -1;
        return b.total - a.total;
      });
  }

  function renderSectionFilterControls(sections) {
    var secSelect = $('admin-filter-section');
    var currentVal = secSelect.value || 'ALL';

    secSelect.innerHTML =
      '<option value="ALL">' + escapeHtml(t('filterAllSections')) + '</option>' +
      sections
        .filter(function (s) { return s.name !== '-'; })
        .map(function (s) {
          return '<option value="' + escapeHtml(s.name) + '">' + escapeHtml(s.name) + ' (' + s.declared + '/' + s.total + ')</option>';
        })
        .join('');

    var exists = currentVal === 'ALL' || sections.some(function (s) { return s.name === currentVal; });
    secSelect.value = exists ? currentVal : 'ALL';

    var activeSection = secSelect.value;
    var pillBar = $('section-pill-bar');
    var pillsHtml =
      '<button type="button" class="sec-pill' + (activeSection === 'ALL' ? ' active' : '') + '" data-section-pill="ALL">' +
      escapeHtml(t('filterAllSections')) +
      '</button>';

    sections
      .filter(function (s) { return s.name !== '-'; })
      .slice(0, 6)
      .forEach(function (s) {
        pillsHtml +=
          '<button type="button" class="sec-pill' + (activeSection === s.name ? ' active' : '') + '" data-section-pill="' + escapeHtml(s.name) + '">' +
          escapeHtml(shortSectionLabel(s.name)) +
          '</button>';
      });
    pillBar.innerHTML = pillsHtml;
  }

  function renderAdminAnalytics(sections) {
    var total = state.adminRecords.length;
    var activeCount = state.adminRecords.filter(function (r) { return r.profile.is_active; }).length;
    var declared = state.adminRecords.filter(function (r) { return r.has_declared; }).length;
    var undeclared = total - declared;
    var healthy = state.adminRecords.filter(function (r) { return r.health_status === 'Sihat'; }).length;
    var attention = state.adminRecords.filter(function (r) {
      return (
        r.health_status === 'Mempunyai Masalah Kesihatan' ||
        r.health_status === 'Dalam Pemantauan / Rawatan'
      );
    }).length;

    var declaredPct = total > 0 ? Math.round((declared / total) * 100) : 0;
    var healthyPct = total > 0 ? healthy / total : 0;
    var attentionPct = total > 0 ? attention / total : 0;

    $('kpi-total-staff').textContent = String(total);
    $('kpi-active-sub').textContent = t('kpiActiveSub', { count: activeCount });
    $('kpi-total-ring').setAttribute('stroke-dashoffset', String(total > 0 ? 0 : RING_CIRCUMFERENCE));

    $('kpi-declared').textContent = declared + ' / ' + total;
    $('kpi-declared-sub').textContent = t('kpiDeclaredSub', { pct: declaredPct });
    $('kpi-declared-pct').textContent = declaredPct + '%';
    $('kpi-declared-ring').setAttribute(
      'stroke-dashoffset',
      (RING_CIRCUMFERENCE * (1 - (total > 0 ? declared / total : 0))).toFixed(2)
    );

    $('kpi-healthy').textContent = String(healthy);
    $('kpi-healthy-ring').setAttribute(
      'stroke-dashoffset',
      (RING_CIRCUMFERENCE * (1 - healthyPct)).toFixed(2)
    );

    $('kpi-attention').textContent = String(attention);
    $('kpi-undeclared-sub').textContent = t('kpiUndeclaredSub', { count: undeclared });
    $('kpi-attention-ring').setAttribute(
      'stroke-dashoffset',
      (RING_CIRCUMFERENCE * (1 - attentionPct)).toFixed(2)
    );

    // Carta Bar Pematuhan Mengikut Seksyen (Interaktif)
    var activeSec = $('admin-filter-section').value || 'ALL';
    var barsList = $('section-compliance-list');
    var visibleSections = sections.filter(function (s) { return s.name !== '-'; });
    if (visibleSections.length === 0) {
      visibleSections = sections;
    }

    barsList.innerHTML = visibleSections
      .map(function (sec) {
        var isSelected = activeSec === sec.name;
        var barWidth = Math.max(0, Math.min(200, Math.round(sec.pct * 2)));
        return (
          '<button type="button" class="section-bar-btn' +
          (isSelected ? ' active' : '') +
          (sec.pct >= 70 ? ' has-good' : '') +
          '" data-section-bar="' + escapeHtml(sec.name) + '" title="' + escapeHtml(sec.name) + '">' +
          '<span class="section-bar-name">' + escapeHtml(shortSectionLabel(sec.name)) + '</span>' +
          '<svg class="bar-svg" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">' +
          '<rect class="bar-track" x="0" y="0" width="200" height="10" rx="5" />' +
          '<rect class="bar-fill" x="0" y="0" width="' + barWidth + '" height="10" rx="5" />' +
          '</svg>' +
          '<span class="section-bar-stat">' + sec.pct + '% (' + sec.declared + '/' + sec.total + ')</span>' +
          '</button>'
        );
      })
      .join('');

    // Carta Donat Taburan Status
    $('donut-total-center').textContent = String(total);
    if (total > 0) {
      var lenHealthy = (healthy / total) * DONUT_CIRCUMFERENCE;
      var lenAttention = (attention / total) * DONUT_CIRCUMFERENCE;
      var lenPending = (undeclared / total) * DONUT_CIRCUMFERENCE;

      $('donut-seg-healthy').setAttribute('stroke-dasharray', lenHealthy.toFixed(2) + ' ' + DONUT_CIRCUMFERENCE);
      $('donut-seg-healthy').setAttribute('stroke-dashoffset', '0');

      $('donut-seg-attention').setAttribute('stroke-dasharray', lenAttention.toFixed(2) + ' ' + DONUT_CIRCUMFERENCE);
      $('donut-seg-attention').setAttribute('stroke-dashoffset', (-lenHealthy).toFixed(2));

      $('donut-seg-pending').setAttribute('stroke-dasharray', lenPending.toFixed(2) + ' ' + DONUT_CIRCUMFERENCE);
      $('donut-seg-pending').setAttribute('stroke-dashoffset', (-(lenHealthy + lenAttention)).toFixed(2));
    } else {
      ['donut-seg-healthy', 'donut-seg-attention', 'donut-seg-pending'].forEach(function (id) {
        $(id).setAttribute('stroke-dasharray', '0 ' + DONUT_CIRCUMFERENCE);
      });
    }

    $('donut-legend').innerHTML =
      '<div class="legend-item"><span class="legend-left"><span class="legend-dot dot-emerald"></span>' + escapeHtml(t('chartLegendHealthy')) + '</span><strong>' + healthy + '</strong></div>' +
      '<div class="legend-item"><span class="legend-left"><span class="legend-dot dot-amber"></span>' + escapeHtml(t('chartLegendAttention')) + '</span><strong>' + attention + '</strong></div>' +
      '<div class="legend-item"><span class="legend-left"><span class="legend-dot dot-rose"></span>' + escapeHtml(t('chartLegendPending')) + '</span><strong>' + undeclared + '</strong></div>';
  }

  function getFilteredDeclarations() {
    var search = ($('admin-search').value || '').trim().toLowerCase();
    var sectionFilter = $('admin-filter-section').value || 'ALL';
    var statusFilter = $('admin-filter-status').value || 'ALL';
    var condFilter = $('admin-filter-condition').value || 'ALL';

    return state.adminRecords.filter(function (row) {
      if (sectionFilter !== 'ALL' && row.department !== sectionFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && row.health_status !== statusFilter) {
        return false;
      }
      if (condFilter !== 'ALL') {
        if (row.conditions.indexOf(condFilter) === -1) return false;
      }
      if (search) {
        var decl = row.declaration;
        var translatedConds = row.conditions.map(function (c) {
          return root.AppI18n.translateCondition(c, 'ms') + ' ' + root.AppI18n.translateCondition(c, 'en');
        }).join(' ');
        var haystack = [
          row.display_name,
          row.profile.username,
          row.profile.email || '',
          row.department,
          row.formatted_ic,
          decl ? decl.ic_number : '',
          row.health_status,
          root.AppI18n.translateStatus(row.health_status),
          row.conditions.join(' '),
          translatedConds,
          decl && decl.other_conditions ? decl.other_conditions : '',
          decl && decl.medications ? decl.medications : ''
        ]
          .join(' ')
          .toLowerCase();
        if (haystack.indexOf(search) === -1) return false;
      }
      return true;
    });
  }

  function renderAdminDeclarationsTable() {
    var rows = getFilteredDeclarations();
    var tbody = $('admin-declarations-tbody');
    var empty = $('admin-declarations-empty');
    var statusFilter = $('admin-filter-status').value || 'ALL';

    var badgeEl = $('admin-result-badge');
    if (statusFilter === 'Belum Mengisi') {
      badgeEl.className = 'badge badge-rose';
      badgeEl.textContent = t('badgeUndeclaredCount', { count: rows.length });
    } else {
      var pendingInView = rows.filter(function (r) { return !r.has_declared; }).length;
      if (pendingInView > 0 && $('admin-filter-section').value !== 'ALL') {
        badgeEl.className = 'badge badge-amber';
        badgeEl.textContent =
          t('badgeMatchedCount', { count: rows.length }) + ' • ' + t('badgeUndeclaredCount', { count: pendingInView });
      } else {
        badgeEl.className = 'badge badge-slate';
        badgeEl.textContent = t('badgeMatchedCount', { count: rows.length });
      }
    }

    if (rows.length === 0) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    tbody.innerHTML = rows
      .map(function (row) {
        var decl = row.declaration;
        var condHTML = '-';
        if (decl) {
          var chips = row.conditions.map(function (c) {
            return '<span class="mini-chip">' + escapeHtml(root.AppI18n.translateCondition(c)) + '</span>';
          });
          var extraParts = [];
          if (decl.other_conditions) {
            extraParts.push(
              '<div class="cell-sub"><strong>' + escapeHtml(t('otherShort')) + '</strong> ' + escapeHtml(decl.other_conditions) + '</div>'
            );
          }
          if (decl.medications) {
            extraParts.push(
              '<div class="cell-sub"><strong>' + escapeHtml(t('medsShort')) + '</strong> ' + escapeHtml(decl.medications) + '</div>'
            );
          }
          if (chips.length > 0 || extraParts.length > 0) {
            condHTML =
              (chips.length ? '<div class="chip-list">' + chips.join('') + '</div>' : '') +
              extraParts.join('');
          } else {
            condHTML = '<span class="muted-sm">' + escapeHtml(t('noConditionsReported')) + '</span>';
          }
        }

        var ageHTML = decl
          ? '<span class="badge badge-slate">' + escapeHtml(t('ageShort', { age: row.live_age })) + '</span>'
          : '<span class="muted-sm">-</span>';

        var actionsHTML = decl
          ? '<div class="action-group">' +
            '<button type="button" class="btn btn-xs btn-outline" data-action="view-detail" data-userid="' + escapeHtml(row.profile.id) + '">' + escapeHtml(t('btnDetails')) + '</button>' +
            '<button type="button" class="btn btn-xs btn-danger-outline" data-action="delete-declaration" data-declid="' + escapeHtml(decl.id) + '" data-name="' + escapeHtml(row.display_name) + '">' + escapeHtml(t('btnDelete')) + '</button>' +
            '</div>'
          : '<span class="muted-sm">' + escapeHtml(t('waitingSubmission')) + '</span>';

        var initials = getInitials(row.display_name);
        var avClass = getAvatarColorClass(row.profile.username);

        return (
          '<tr>' +
          '<td>' +
          '<div class="staff-cell-wrap">' +
          '<span class="avatar-circle ' + avClass + '">' + escapeHtml(initials) + '</span>' +
          '<div>' +
          '<div class="cell-main">' + escapeHtml(row.display_name) + '</div>' +
          '<div class="cell-sub mono">' + escapeHtml(row.profile.email || '@' + row.profile.username) + '</div>' +
          '</div>' +
          '</div>' +
          '</td>' +
          '<td>' + escapeHtml(row.department) + '</td>' +
          '<td class="mono">' + escapeHtml(row.formatted_ic) + '</td>' +
          '<td>' + ageHTML + '</td>' +
          '<td>' + statusBadgeHTML(row.health_status) + '</td>' +
          '<td>' + condHTML + '</td>' +
          '<td>' + (decl ? escapeHtml(formatDateTime(decl.updated_at || decl.submitted_at)) : '<span class="muted-sm">-</span>') + '</td>' +
          '<td class="no-print">' + actionsHTML + '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function renderAdminUsersTable() {
    var search = ($('admin-user-search').value || '').trim().toLowerCase();
    var currentId = state.session.profile.id;

    var users = state.adminRecords.filter(function (row) {
      if (!search) return true;
      var text = [
        row.profile.full_name,
        row.profile.username,
        row.profile.email || '',
        row.profile.department,
        row.profile.role
      ]
        .join(' ')
        .toLowerCase();
      return text.indexOf(search) !== -1;
    });

    var tbody = $('admin-users-tbody');
    var empty = $('admin-users-empty');

    if (users.length === 0) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    tbody.innerHTML = users
      .map(function (row) {
        var p = row.profile;
        var isSelf = p.id === currentId;
        var roleBadge =
          p.role === 'admin'
            ? '<span class="badge badge-teal">' + escapeHtml(t('roleAdmin')) + '</span>'
            : '<span class="badge badge-slate">' + escapeHtml(t('roleStaff')) + '</span>';
        var activeBadge = p.is_active
          ? '<span class="badge badge-emerald">' + escapeHtml(t('badgeActive')) + '</span>'
          : '<span class="badge badge-rose">' + escapeHtml(t('badgeInactive')) + '</span>';
        var declBadge = row.has_declared
          ? '<span class="badge badge-emerald">' + escapeHtml(t('badgeDeclared')) + '</span>'
          : '<span class="badge badge-amber">' + escapeHtml(t('badgeNotDeclared')) + '</span>';

        var toggleLabel = p.is_active ? t('btnDeactivate') : t('btnActivate');
        var initials = getInitials(p.full_name || p.username);
        var avClass = getAvatarColorClass(p.username);

        return (
          '<tr>' +
          '<td>' +
          '<div class="staff-cell-wrap">' +
          '<span class="avatar-circle ' + avClass + '">' + escapeHtml(initials) + '</span>' +
          '<div>' +
          '<div class="cell-main">' + escapeHtml(p.full_name || p.username) + (isSelf ? ' <span class="muted-sm">' + escapeHtml(t('youTag')) + '</span>' : '') + '</div>' +
          '<div class="cell-sub mono">@' + escapeHtml(p.username) + (p.email ? ' &bull; ' + escapeHtml(p.email) : '') + '</div>' +
          '</div>' +
          '</div>' +
          '</td>' +
          '<td>' + escapeHtml(p.department || '-') + '</td>' +
          '<td>' + roleBadge + '</td>' +
          '<td>' + activeBadge + '</td>' +
          '<td>' + declBadge + '</td>' +
          '<td class="no-print">' +
          '<div class="action-group">' +
          '<button type="button" class="btn btn-xs btn-outline" data-action="reset-password" data-userid="' + escapeHtml(p.id) + '" data-label="' + escapeHtml(p.full_name || p.username) + '">' + escapeHtml(t('btnResetPw')) + '</button>' +
          (isSelf
            ? ''
            : '<button type="button" class="btn btn-xs btn-outline" data-action="toggle-active" data-userid="' + escapeHtml(p.id) + '" data-nextactive="' + (!p.is_active) + '">' + escapeHtml(toggleLabel) + '</button>' +
              '<button type="button" class="btn btn-xs btn-danger-outline" data-action="delete-user" data-userid="' + escapeHtml(p.id) + '" data-label="' + escapeHtml(p.full_name || p.username) + '">' + escapeHtml(t('btnDelete')) + '</button>') +
          '</div>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function renderAdminAllSections() {
    var sections = computeSectionBreakdown(state.adminRecords);
    renderSectionFilterControls(sections);
    renderAdminAnalytics(sections);
    renderAdminDeclarationsTable();
    renderAdminUsersTable();
  }

  async function loadAdminView() {
    try {
      state.adminRecords = await root.AppStore.getAdminDashboardData();
      renderAdminAllSections();
    } catch (err) {
      showToast(root.AppI18n.translateStoreError(err), 'error');
    }
  }

  function switchAdminTab(tabName) {
    state.activeAdminTab = tabName;
    document.querySelectorAll('.subtab[data-admin-tab], .sidebar-link[data-admin-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.adminTab === tabName);
    });
    var declTab = $('admin-tab-declarations');
    var usersTab = $('admin-tab-users');
    declTab.classList.toggle('hidden', tabName !== 'declarations');
    usersTab.classList.toggle('hidden', tabName !== 'users');
    replayAnimation(tabName === 'declarations' ? declTab : usersTab, 'view-animate');
  }

  function selectAdminSectionFilter(sectionName) {
    var secSelect = $('admin-filter-section');
    secSelect.value = sectionName;
    var sections = computeSectionBreakdown(state.adminRecords);
    renderSectionFilterControls(sections);
    renderAdminAnalytics(sections);
    renderAdminDeclarationsTable();
  }

  function showDeclarationDetailModal(userId) {
    var row = state.adminRecords.find(function (r) { return r.profile.id === userId; });
    if (!row || !row.declaration) return;
    var decl = row.declaration;
    state.detailModalUserId = userId;

    var condHtml =
      row.conditions.length > 0
        ? '<div class="chip-list">' +
          row.conditions
            .map(function (c) {
              return '<span class="mini-chip">' + escapeHtml(root.AppI18n.translateCondition(c)) + '</span>';
            })
            .join('') +
          '</div>'
        : escapeHtml(t('detailNoConditions'));

    $('modal-detail-title').textContent = t('modalDetailTitle', { name: row.display_name });
    $('modal-detail-body').innerHTML =
      '<div class="detail-grid">' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('detailFullName')) + '</div><div class="detail-value">' + escapeHtml(row.display_name) + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('detailUserDept')) + '</div><div class="detail-value">' + escapeHtml(row.profile.email || '@' + row.profile.username) + ' &bull; ' + escapeHtml(row.department) + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('detailIC')) + '</div><div class="detail-value mono">' + escapeHtml(row.formatted_ic) + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('detailAgeGenderDob')) + '</div><div class="detail-value"><strong>' + escapeHtml(t('ageUnit', { age: row.live_age })) + '</strong> &bull; ' + escapeHtml(root.AppI18n.translateGender(row.gender)) + ' &bull; ' + escapeHtml(formatISODate(row.birth_date)) + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('detailBirthState')) + '</div><div class="detail-value">' + escapeHtml(root.AppI18n.translateBirthState(row.birth_state)) + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('detailPhone')) + '</div><div class="detail-value">' + escapeHtml(decl.phone || '-') + '</div></div>' +
      '<div class="detail-item full"><div class="detail-label">' + escapeHtml(t('detailStatus')) + '</div><div class="detail-value">' + statusBadgeHTML(row.health_status) + '</div></div>' +
      '<div class="detail-item full"><div class="detail-label">' + escapeHtml(t('detailConditions')) + '</div><div class="detail-value">' + condHtml + '</div></div>' +
      '<div class="detail-item full"><div class="detail-label">' + escapeHtml(t('detailOtherConditions')) + '</div><div class="detail-value">' + escapeHtml(decl.other_conditions || '-') + '</div></div>' +
      '<div class="detail-item full"><div class="detail-label">' + escapeHtml(t('detailMedications')) + '</div><div class="detail-value">' + escapeHtml(decl.medications || '-') + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('detailEmergency')) + '</div><div class="detail-value">' + escapeHtml(decl.emergency_contact || '-') + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('detailUpdated')) + '</div><div class="detail-value">' + escapeHtml(formatDateTime(decl.updated_at || decl.submitted_at)) + '</div></div>' +
      '<div class="detail-item full"><div class="detail-label">' + escapeHtml(t('detailNotes')) + '</div><div class="detail-value">' + escapeHtml(decl.notes || '-') + '</div></div>' +
      '</div>';

    openModal('modal-detail');
  }

  function buildExportDataset() {
    var rows = getFilteredDeclarations();
    var headers = t('exportHeaders');

    var dataRows = rows.map(function (r, idx) {
      var d = r.declaration;
      var translatedConds = r.conditions.map(function (c) {
        return root.AppI18n.translateCondition(c);
      });
      return [
        idx + 1,
        r.display_name,
        r.profile.username,
        r.profile.email || '-',
        r.department,
        d ? r.formatted_ic : '-',
        d ? formatISODate(r.birth_date) : '-',
        d && r.live_age !== null ? Number(r.live_age) : '-',
        d ? root.AppI18n.translateGender(r.gender) : '-',
        d ? root.AppI18n.translateBirthState(r.birth_state) : '-',
        d && d.phone ? d.phone : '-',
        root.AppI18n.translateStatus(r.health_status),
        translatedConds.length > 0 ? translatedConds.join('; ') : '-',
        d && d.other_conditions ? d.other_conditions : '-',
        d && d.medications ? d.medications : '-',
        d && d.emergency_contact ? d.emergency_contact : '-',
        d && d.notes ? d.notes : '-',
        d ? formatDateTime(d.updated_at || d.submitted_at) : '-'
      ];
    });

    return { headers: headers, rows: dataRows };
  }

  // ==================== PENGIKATAN PERISTIWA (EVENTS) ====================

  function bindEvents() {
    document.querySelectorAll('.lang-btn[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var nextLang = btn.dataset.lang;
        if (nextLang === root.AppI18n.getLanguage()) return;
        root.AppI18n.setLanguage(nextLang);
        applyLanguage();
      });
    });

    document.querySelectorAll('.toggle-pw-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = $(btn.dataset.target);
        if (!input) return;
        var isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.textContent = isPass ? t('hidePw') : t('showPw');
      });
    });

    document.querySelectorAll('.demo-fill-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $('login-username').value = btn.dataset.user || '';
        $('login-password').value = btn.dataset.pass || '';
        setAlert('login-error', '');
      });
    });

    $('btn-reset-demo').addEventListener('click', function () {
      if (!root.confirm(t('confirmResetDemo'))) return;
      root.AppStore.resetDemoData();
      state.session = null;
      state.myDeclaration = null;
      state.adminRecords = [];
      showToast(t('demoResetToast'), 'success');
      switchView('login');
    });

    $('login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      setAlert('login-error', '');
      var btn = $('btn-login-submit');
      btn.disabled = true;
      btn.classList.add('is-loading');
      btn.textContent = t('loginSubmittingBtn');

      try {
        var session = await root.AppStore.signIn(
          $('login-username').value,
          $('login-password').value
        );
        state.session = session;
        $('login-password').value = '';
        showToast(
          t('welcomeToast', { name: session.profile.full_name || session.profile.username }),
          'success'
        );
        await switchView(session.profile.role === 'admin' ? 'admin' : 'staff-form');
      } catch (err) {
        setAlert('login-error', root.AppI18n.translateStoreError(err));
      } finally {
        btn.disabled = false;
        btn.classList.remove('is-loading');
        btn.textContent = t('loginSubmitBtn');
      }
    });

    async function handleLogout() {
      await root.AppStore.signOut();
      state.session = null;
      state.myDeclaration = null;
      state.adminRecords = [];
      showToast(t('loggedOutToast'));
      await switchView('login');
    }

    $('btn-logout').addEventListener('click', handleLogout);
    $('btn-sidebar-logout').addEventListener('click', handleLogout);

    function openOwnPasswordModal() {
      $('form-change-own-pw').reset();
      setAlert('op-error', '');
      openModal('modal-change-own-pw');
    }

    $('btn-open-change-pw').addEventListener('click', openOwnPasswordModal);
    $('btn-sidebar-change-pw').addEventListener('click', openOwnPasswordModal);

    $('topbar-nav').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-nav]');
      if (!btn) return;
      switchView(btn.dataset.nav);
    });

    $('form-change-own-pw').addEventListener('submit', async function (e) {
      e.preventDefault();
      setAlert('op-error', '');
      var pw1 = $('op-new-password').value;
      var pw2 = $('op-confirm-password').value;
      if (pw1 !== pw2) {
        setAlert('op-error', t('opMismatchErr'));
        return;
      }
      var btn = $('btn-submit-own-pw');
      btn.disabled = true;
      btn.classList.add('is-loading');
      try {
        await root.AppStore.changeOwnPassword(pw1);
        closeModal('modal-change-own-pw');
        showToast(t('opUpdatedToast'), 'success');
      } catch (err) {
        setAlert('op-error', root.AppI18n.translateStoreError(err));
      } finally {
        btn.disabled = false;
        btn.classList.remove('is-loading');
      }
    });

    // Stepper & Borang Kakitangan 3 Langkah
    $('btn-step1-next').addEventListener('click', function () {
      if (validateStep1()) setFormStep(2);
    });
    $('btn-step2-prev').addEventListener('click', function () {
      setFormStep(1);
    });
    $('btn-step2-next').addEventListener('click', function () {
      if (validateStep2()) setFormStep(3);
    });
    $('btn-step3-prev').addEventListener('click', function () {
      setFormStep(2);
    });

    document.querySelectorAll('#staff-stepper .stepper-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetStep = Number(btn.dataset.step);
        if (targetStep === state.currentFormStep) return;
        if (targetStep === 1) {
          setFormStep(1);
        } else if (targetStep === 2) {
          if (validateStep1()) setFormStep(2);
        } else if (targetStep === 3) {
          if (validateStep1() && validateStep2()) setFormStep(3);
        }
      });
    });

    $('hf-ic').addEventListener('input', function (e) {
      updateICPreview(e.target.value, false);
    });

    $('hf-ic').addEventListener('blur', function (e) {
      var parsed = updateICPreview(e.target.value, Boolean(e.target.value.trim()));
      if (parsed.valid) {
        e.target.value = parsed.formatted;
      }
    });

    $('health-form').addEventListener('change', function (e) {
      if (e.target.name === 'health_status') {
        syncStatusRadioVisuals();
      } else if (e.target.name === 'conditions') {
        syncConditionChipsVisuals();
      }
    });

    $('btn-clear-conditions').addEventListener('click', function () {
      document.querySelectorAll('#conditions-grid input[name="conditions"]').forEach(function (cb) {
        cb.checked = false;
      });
      syncConditionChipsVisuals();
    });

    $('health-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      setAlert('hf-error', '');

      if (!validateStep1()) {
        setFormStep(1);
        return;
      }
      if (!validateStep2()) {
        setFormStep(2);
        return;
      }

      var form = e.target;
      var statusRadio = form.querySelector('input[name="health_status"]:checked');
      var healthStatus = statusRadio ? statusRadio.value : '';
      var selectedConditions = Array.prototype.slice
        .call(form.querySelectorAll('input[name="conditions"]:checked'))
        .map(function (cb) { return cb.value; });
      var otherConditions = $('hf-other-conditions').value.trim();

      var btn = $('btn-save-declaration');
      btn.disabled = true;
      btn.classList.add('is-loading');
      btn.textContent = t('savingDeclBtn');

      try {
        var saved = await root.AppStore.upsertMyDeclaration(state.session.profile.id, {
          full_name: $('hf-full-name').value,
          ic_number: $('hf-ic').value,
          department: $('hf-department').value,
          phone: $('hf-phone').value,
          health_status: healthStatus,
          conditions: selectedConditions,
          other_conditions: otherConditions,
          medications: $('hf-medications').value,
          emergency_contact: $('hf-emergency').value,
          notes: $('hf-notes').value,
          confirmed_accurate: $('hf-confirm').checked
        });
        state.myDeclaration = saved;
        populateStaffForm(state.session.profile, saved);
        showToast(t('declSavedToast'), 'success');
      } catch (err) {
        setAlert('hf-error', root.AppI18n.translateStoreError(err));
      } finally {
        btn.disabled = false;
        btn.classList.remove('is-loading');
        btn.textContent = state.myDeclaration ? t('updateDeclBtn') : t('submitDeclBtn');
      }
    });

    // ==================== PERISTIWA PENTADBIR ====================

    document.querySelectorAll('.subtab[data-admin-tab], .sidebar-link[data-admin-tab]').forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        switchAdminTab(tabBtn.dataset.adminTab);
      });
    });

    document.querySelectorAll('.sidebar-link[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchView(btn.dataset.nav);
      });
    });

    $('btn-refresh-admin').addEventListener('click', async function () {
      await loadAdminView();
      showToast(t('refreshDoneToast'));
    });

    $('admin-search').addEventListener('input', renderAdminDeclarationsTable);
    $('admin-filter-status').addEventListener('change', renderAdminDeclarationsTable);
    $('admin-filter-condition').addEventListener('change', renderAdminDeclarationsTable);
    $('admin-filter-section').addEventListener('change', function (e) {
      selectAdminSectionFilter(e.target.value);
    });
    $('admin-user-search').addEventListener('input', renderAdminUsersTable);

    // Klik bar carta seksyen atau cip pantas seksyen
    $('section-compliance-list').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-section-bar]');
      if (!btn) return;
      var clicked = btn.dataset.sectionBar;
      var current = $('admin-filter-section').value;
      selectAdminSectionFilter(current === clicked ? 'ALL' : clicked);
      switchAdminTab('declarations');
    });

    $('section-pill-bar').addEventListener('click', function (e) {
      var pill = e.target.closest('[data-section-pill]');
      if (!pill) return;
      selectAdminSectionFilter(pill.dataset.sectionPill);
    });

    $('btn-export-csv').addEventListener('click', function () {
      var ds = buildExportDataset();
      if (ds.rows.length === 0) {
        showToast(t('noExportRowsToast'), 'error');
        return;
      }
      var csv = root.CSVExport.buildCSV(ds.headers, ds.rows);
      var dateStamp = new Date().toISOString().slice(0, 10);
      root.CSVExport.triggerDownload(
        'pengisytiharan-kesihatan-kakitangan-' + dateStamp + '.csv',
        csv,
        'text/csv;charset=utf-8;'
      );
      showToast(t('csvDownloadedToast'), 'success');
    });

    $('btn-export-excel').addEventListener('click', function () {
      var ds = buildExportDataset();
      if (ds.rows.length === 0) {
        showToast(t('noExportRowsToast'), 'error');
        return;
      }
      var xml = root.CSVExport.buildExcelXML(t('exportSheetName'), ds.headers, ds.rows);
      var dateStamp = new Date().toISOString().slice(0, 10);
      root.CSVExport.triggerDownload(
        'pengisytiharan-kesihatan-kakitangan-' + dateStamp + '.xls',
        xml,
        'application/vnd.ms-excel;charset=utf-8;'
      );
      showToast(t('excelDownloadedToast'), 'success');
    });

    $('btn-print-report').addEventListener('click', function () {
      root.print();
    });

    function syncAutoEmailFromUsername() {
      var emailInput = $('cu-email');
      if (!emailInput || emailInput.dataset.manual === 'true') return;
      var uname = ($('cu-username').value || '').trim().toLowerCase();
      if (!uname) {
        emailInput.value = '';
        return;
      }
      if (uname.indexOf('@') !== -1) {
        emailInput.value = uname;
      } else {
        var domain = ((root.APP_CONFIG && root.APP_CONFIG.AUTH_EMAIL_DOMAIN) || 'jupem.gov.my').trim().toLowerCase();
        emailInput.value = uname + '@' + domain;
      }
    }

    function openCreateUserModal() {
      $('form-create-user').reset();
      $('cu-username').dataset.manual = 'false';
      $('cu-email').dataset.manual = 'false';
      $('cu-password').value = generateRandomPassword(10);
      setAlert('cu-error', '');
      $('cu-success-box').classList.add('hidden');
      state.lastCreatedCredentials = '';
      openModal('modal-create-user');
    }

    $('btn-open-create-user').addEventListener('click', openCreateUserModal);
    $('btn-open-create-user-2').addEventListener('click', openCreateUserModal);

    $('cu-fullname').addEventListener('input', function (e) {
      var usernameInput = $('cu-username');
      if (usernameInput.dataset.manual !== 'true') {
        usernameInput.value = suggestUsernameFromName(e.target.value);
        syncAutoEmailFromUsername();
      }
    });

    $('cu-username').addEventListener('input', function (e) {
      e.target.dataset.manual = e.target.value.trim() ? 'true' : 'false';
      syncAutoEmailFromUsername();
    });

    $('cu-email').addEventListener('input', function (e) {
      e.target.dataset.manual = e.target.value.trim() ? 'true' : 'false';
    });

    $('btn-gen-password').addEventListener('click', function () {
      $('cu-password').value = generateRandomPassword(10);
    });

    $('btn-copy-credentials').addEventListener('click', async function () {
      if (!state.lastCreatedCredentials) return;
      try {
        await navigator.clipboard.writeText(state.lastCreatedCredentials);
        showToast(t('copiedToast'), 'success');
      } catch (e) {
        showToast(t('copyFallbackToast'), 'error');
      }
    });

    $('form-create-user').addEventListener('submit', async function (e) {
      e.preventDefault();
      setAlert('cu-error', '');
      $('cu-success-box').classList.add('hidden');

      var btn = $('btn-submit-create-user');
      btn.disabled = true;
      btn.classList.add('is-loading');
      btn.textContent = t('cuSubmittingBtn');

      var rawUsername = $('cu-username').value.trim().toLowerCase();
      var username = rawUsername.indexOf('@') !== -1 ? rawUsername.split('@')[0] : rawUsername;
      var email = $('cu-email').value.trim().toLowerCase();
      var password = $('cu-password').value;
      var fullName = $('cu-fullname').value.trim();

      try {
        var created = await root.AppStore.adminCreateUser({
          full_name: fullName,
          username: rawUsername,
          email: email,
          department: $('cu-department').value,
          role: $('cu-role').value,
          password: password
        });

        var finalEmail = (created && created.email) || email || root.AppStore.resolveAuthEmail(username);
        state.lastCreatedCredentials =
          t('detailFullName') + ': ' + fullName +
          '\nID: ' + username + ' (' + finalEmail + ')' +
          '\n' + t('loginPasswordLabel') + ': ' + password;
        $('cu-credentials-text').textContent = finalEmail + '  |  ' + t('loginPasswordLabel') + ': ' + password;
        $('cu-success-box').classList.remove('hidden');

        $('cu-fullname').value = '';
        $('cu-username').value = '';
        $('cu-username').dataset.manual = 'false';
        $('cu-email').value = '';
        $('cu-email').dataset.manual = 'false';
        $('cu-department').value = '';
        $('cu-password').value = generateRandomPassword(10);

        await loadAdminView();
        showToast(t('cuCreatedToast', { username: username }), 'success');
      } catch (err) {
        setAlert('cu-error', root.AppI18n.translateStoreError(err));
      } finally {
        btn.disabled = false;
        btn.classList.remove('is-loading');
        btn.textContent = t('cuSubmitBtn');
      }
    });

    $('admin-declarations-tbody').addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;

      if (action === 'view-detail') {
        showDeclarationDetailModal(btn.dataset.userid);
      } else if (action === 'delete-declaration') {
        var name = btn.dataset.name || '-';
        if (!root.confirm(t('confirmDeleteDecl', { name: name }))) return;
        try {
          await root.AppStore.adminDeleteDeclaration(btn.dataset.declid);
          await loadAdminView();
          showToast(t('declDeletedToast'), 'success');
        } catch (err) {
          showToast(root.AppI18n.translateStoreError(err), 'error');
        }
      }
    });

    $('admin-users-tbody').addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var userId = btn.dataset.userid;

      if (action === 'reset-password') {
        $('rp-user-id').value = userId;
        $('rp-user-label').textContent = btn.dataset.label || '-';
        $('rp-new-password').value = generateRandomPassword(10);
        setAlert('rp-error', '');
        openModal('modal-reset-pw');
      } else if (action === 'toggle-active') {
        var nextActive = btn.dataset.nextactive === 'true';
        var confirmMsg = nextActive ? t('confirmActivateUser') : t('confirmDeactivateUser');
        if (!root.confirm(confirmMsg)) return;
        try {
          await root.AppStore.adminToggleActive(userId, nextActive, state.session.profile.id);
          await loadAdminView();
          showToast(nextActive ? t('userActivatedToast') : t('userDeactivatedToast'), 'success');
        } catch (err) {
          showToast(root.AppI18n.translateStoreError(err), 'error');
        }
      } else if (action === 'delete-user') {
        var label = btn.dataset.label || '-';
        if (!root.confirm(t('confirmDeleteUser', { label: label }))) return;
        try {
          await root.AppStore.adminDeleteUser(userId, state.session.profile.id);
          await loadAdminView();
          showToast(t('userDeletedToast'), 'success');
        } catch (err) {
          showToast(root.AppI18n.translateStoreError(err), 'error');
        }
      }
    });

    $('form-reset-pw').addEventListener('submit', async function (e) {
      e.preventDefault();
      setAlert('rp-error', '');
      var btn = $('btn-submit-reset-pw');
      btn.disabled = true;
      btn.classList.add('is-loading');
      try {
        await root.AppStore.adminResetPassword($('rp-user-id').value, $('rp-new-password').value);
        closeModal('modal-reset-pw');
        showToast(t('rpSavedToast'), 'success');
      } catch (err) {
        setAlert('rp-error', root.AppI18n.translateStoreError(err));
      } finally {
        btn.disabled = false;
        btn.classList.remove('is-loading');
      }
    });

    document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal(btn.dataset.closeModal);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) {
          backdrop.classList.add('hidden');
          if (backdrop.id === 'modal-detail') {
            state.detailModalUserId = null;
          }
        }
      });
    });
  }

  async function bootstrap() {
    initStaticUI();
    bindEvents();

    try {
      var session = await root.AppStore.getCurrentSession();
      state.session = session;
      if (session) {
        await switchView(session.profile.role === 'admin' ? 'admin' : 'staff-form');
      } else {
        await switchView('login');
      }
    } catch (err) {
      showToast(root.AppI18n.translateStoreError(err), 'error');
      await switchView('login');
    }
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})(typeof globalThis !== 'undefined' ? globalThis : window);
