/**
 * Pengawal Utama Antaramuka Pengguna (UI Controller)
 * Sistem Pengisytiharan Kesihatan Staf (Dwibahasa BM DBP / EN + Animasi Halus)
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

  var state = {
    session: null,
    activeView: 'login', // 'login' | 'staff-form' | 'admin'
    activeAdminTab: 'declarations', // 'declarations' | 'users'
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
        '<span>' + label + '</span>' +
        '</label>'
      );
    }).join('');
  }

  function renderSelectOptions() {
    // Penapis status di Admin
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

    // Penapis penyakit di Admin
    var condSelect = $('admin-filter-condition');
    var currentCond = condSelect.value || 'ALL';
    condSelect.innerHTML =
      '<option value="ALL">' + escapeHtml(t('filterAllConditions')) + '</option>' +
      COMMON_CONDITIONS.map(function (c) {
        return '<option value="' + escapeHtml(c) + '">' + escapeHtml(root.AppI18n.translateCondition(c)) + '</option>';
      }).join('');
    condSelect.value = currentCond;

    // Pilihan peranan dalam modal cipta akaun
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
    document.title = titleText;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.dataset.i18n;
      if (key === 'appTitle' || key === 'loginHeading') {
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
      } else if (state.activeView === 'admin') {
        renderAdminKPIs();
        renderAdminDeclarationsTable();
        renderAdminUsersTable();
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
      replayAnimation(adminEl, 'view-animate');
      await loadAdminView();
    }
  }

  // ==================== PAPARAN BORANG STAF ====================

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

  // ==================== PAPARAN PENTADBIR ====================

  function getFilteredDeclarations() {
    var search = ($('admin-search').value || '').trim().toLowerCase();
    var statusFilter = $('admin-filter-status').value;
    var condFilter = $('admin-filter-condition').value;

    return state.adminRecords.filter(function (row) {
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

  function renderAdminKPIs() {
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

    var pct = total > 0 ? Math.round((declared / total) * 100) : 0;

    $('kpi-total-staff').textContent = String(total);
    $('kpi-active-sub').textContent = t('kpiActiveSub', { count: activeCount });
    $('kpi-declared').textContent = declared + ' / ' + total;
    $('kpi-declared-sub').textContent = t('kpiDeclaredSub', { pct: pct });
    $('kpi-healthy').textContent = String(healthy);
    $('kpi-attention').textContent = String(attention);
    $('kpi-undeclared-sub').textContent = t('kpiUndeclaredSub', { count: undeclared });
  }

  function renderAdminDeclarationsTable() {
    var rows = getFilteredDeclarations();
    var tbody = $('admin-declarations-tbody');
    var empty = $('admin-declarations-empty');

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

        var ageGenderHTML = decl
          ? '<div><strong>' + escapeHtml(t('ageUnit', { age: row.live_age })) + '</strong></div>' +
            '<div class="cell-sub">' + escapeHtml(root.AppI18n.translateGender(row.gender)) + ' &bull; ' + escapeHtml(formatISODate(row.birth_date)) + '</div>'
          : '<span class="muted-sm">-</span>';

        var actionsHTML = decl
          ? '<div class="action-group">' +
            '<button type="button" class="btn btn-xs btn-outline" data-action="view-detail" data-userid="' + escapeHtml(row.profile.id) + '">' + escapeHtml(t('btnDetails')) + '</button>' +
            '<button type="button" class="btn btn-xs btn-danger-outline" data-action="delete-declaration" data-declid="' + escapeHtml(decl.id) + '" data-name="' + escapeHtml(row.display_name) + '">' + escapeHtml(t('btnDelete')) + '</button>' +
            '</div>'
          : '<span class="muted-sm">' + escapeHtml(t('waitingSubmission')) + '</span>';

        return (
          '<tr>' +
          '<td>' +
          '<div class="cell-main">' + escapeHtml(row.display_name) + '</div>' +
          '<div class="cell-sub">@' + escapeHtml(row.profile.username) + ' &bull; ' + escapeHtml(row.department) + '</div>' +
          '</td>' +
          '<td class="mono">' + escapeHtml(row.formatted_ic) + '</td>' +
          '<td>' + ageGenderHTML + '</td>' +
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

        return (
          '<tr>' +
          '<td>' +
          '<div class="cell-main">' + escapeHtml(p.full_name || p.username) + (isSelf ? ' <span class="muted-sm">' + escapeHtml(t('youTag')) + '</span>' : '') + '</div>' +
          '<div class="cell-sub mono">@' + escapeHtml(p.username) + '</div>' +
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

  async function loadAdminView() {
    try {
      state.adminRecords = await root.AppStore.getAdminDashboardData();
      renderAdminKPIs();
      renderAdminDeclarationsTable();
      renderAdminUsersTable();
    } catch (err) {
      showToast(root.AppI18n.translateStoreError(err), 'error');
    }
  }

  function switchAdminTab(tabName) {
    state.activeAdminTab = tabName;
    document.querySelectorAll('.subtab').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.adminTab === tabName);
    });
    var declTab = $('admin-tab-declarations');
    var usersTab = $('admin-tab-users');
    declTab.classList.toggle('hidden', tabName !== 'declarations');
    usersTab.classList.toggle('hidden', tabName !== 'users');
    replayAnimation(tabName === 'declarations' ? declTab : usersTab, 'view-animate');
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
      '<div class="detail-item"><div class="detail-label">' + escapeHtml(t('detailUserDept')) + '</div><div class="detail-value">@' + escapeHtml(row.profile.username) + ' &bull; ' + escapeHtml(row.department) + '</div></div>' +
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
    // Penukar bahasa BM / EN (diselaraskan pada kedua-dua paparan)
    document.querySelectorAll('.lang-btn[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var nextLang = btn.dataset.lang;
        if (nextLang === root.AppI18n.getLanguage()) return;
        root.AppI18n.setLanguage(nextLang);
        applyLanguage();
      });
    });

    // Papar / sembunyi kata laluan
    document.querySelectorAll('.toggle-pw-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = $(btn.dataset.target);
        if (!input) return;
        var isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.textContent = isPass ? t('hidePw') : t('showPw');
      });
    });

    // Butang isi pantas akaun simulasi
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

    // Log Masuk
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

    // Log Keluar
    $('btn-logout').addEventListener('click', async function () {
      await root.AppStore.signOut();
      state.session = null;
      state.myDeclaration = null;
      state.adminRecords = [];
      showToast(t('loggedOutToast'));
      await switchView('login');
    });

    // Navigasi Bar Atas
    $('topbar-nav').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-nav]');
      if (!btn) return;
      switchView(btn.dataset.nav);
    });

    // Tukar kata laluan sendiri
    $('btn-open-change-pw').addEventListener('click', function () {
      $('form-change-own-pw').reset();
      setAlert('op-error', '');
      openModal('modal-change-own-pw');
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

    // Pengiraan automatik Kad Pengenalan secara masa nyata
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

    // Hantar / Kemas Kini Borang Kesihatan Staf
    $('health-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      setAlert('hf-error', '');

      var form = e.target;
      var statusRadio = form.querySelector('input[name="health_status"]:checked');
      var healthStatus = statusRadio ? statusRadio.value : '';
      var selectedConditions = Array.prototype.slice
        .call(form.querySelectorAll('input[name="conditions"]:checked'))
        .map(function (cb) { return cb.value; });

      var otherConditions = $('hf-other-conditions').value.trim();

      if (
        (healthStatus === 'Mempunyai Masalah Kesihatan' || healthStatus === 'Dalam Pemantauan / Rawatan') &&
        selectedConditions.length === 0 &&
        !otherConditions
      ) {
        setAlert('hf-error', t('errNeedConditionDetails'));
        return;
      }

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

    document.querySelectorAll('.subtab[data-admin-tab]').forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        switchAdminTab(tabBtn.dataset.adminTab);
      });
    });

    $('btn-refresh-admin').addEventListener('click', async function () {
      await loadAdminView();
      showToast(t('refreshDoneToast'));
    });

    $('admin-search').addEventListener('input', renderAdminDeclarationsTable);
    $('admin-filter-status').addEventListener('change', renderAdminDeclarationsTable);
    $('admin-filter-condition').addEventListener('change', renderAdminDeclarationsTable);
    $('admin-user-search').addEventListener('input', renderAdminUsersTable);

    $('btn-export-csv').addEventListener('click', function () {
      var ds = buildExportDataset();
      if (ds.rows.length === 0) {
        showToast(t('noExportRowsToast'), 'error');
        return;
      }
      var csv = root.CSVExport.buildCSV(ds.headers, ds.rows);
      var dateStamp = new Date().toISOString().slice(0, 10);
      root.CSVExport.triggerDownload(
        'pengisytiharan-kesihatan-staf-' + dateStamp + '.csv',
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
        'pengisytiharan-kesihatan-staf-' + dateStamp + '.xls',
        xml,
        'application/vnd.ms-excel;charset=utf-8;'
      );
      showToast(t('excelDownloadedToast'), 'success');
    });

    $('btn-print-report').addEventListener('click', function () {
      root.print();
    });

    function openCreateUserModal() {
      $('form-create-user').reset();
      $('cu-username').dataset.manual = 'false';
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
      }
    });

    $('cu-username').addEventListener('input', function (e) {
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

      var username = $('cu-username').value.trim().toLowerCase();
      var password = $('cu-password').value;
      var fullName = $('cu-fullname').value.trim();

      try {
        await root.AppStore.adminCreateUser({
          full_name: fullName,
          username: username,
          department: $('cu-department').value,
          role: $('cu-role').value,
          password: password
        });

        state.lastCreatedCredentials =
          t('detailFullName') + ': ' + fullName +
          '\n' + t('loginUsernameLabel') + ': ' + username +
          '\n' + t('loginPasswordLabel') + ': ' + password;
        $('cu-credentials-text').textContent = 'ID: ' + username + '  |  ' + t('loginPasswordLabel') + ': ' + password;
        $('cu-success-box').classList.remove('hidden');

        $('cu-fullname').value = '';
        $('cu-username').value = '';
        $('cu-username').dataset.manual = 'false';
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
