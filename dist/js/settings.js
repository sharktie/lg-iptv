"use strict";

/* settings.js — IPTV Settings */

(function () {
  'use strict';

  /* ── Storage helpers ───────────────────────────────────────────────────── */
  function load(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  /* ── Status helper ─────────────────────────────────────────────────────── */
  var _statusTimers = {};
  function setStatus(id, msg, cls, autoClearMs) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = 'settings-status' + (cls ? ' ' + cls : '');
    clearTimeout(_statusTimers[id]);
    if (autoClearMs) {
      _statusTimers[id] = setTimeout(function () {
        el.textContent = '';
        el.className = 'settings-status';
      }, autoClearMs);
    }
  }

  /* ── Profile model ─────────────────────────────────────────────────────── */
  function makeId() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function loadProfiles() {
    var profiles = load('iptv_profiles', null);
    if (!profiles) {
      profiles = [];
      var old = load('iptv_custom_config', null);
      if (old && old.server_url) {
        profiles.push({
          id: makeId(),
          name: 'Default',
          type: 'xtream',
          username: old.username || '',
          password: old.password || '',
          server_urls: [old.server_url],
          playlist_url: '',
          epg_url: load('iptv_custom_epg_url', ''),
          epg_match: load('iptv_custom_epg_match', 'tvg-id')
        });
      }
      var oldM3u = load('iptv_m3u_config', null);
      if (oldM3u && oldM3u.playlist_url) {
        profiles.push({
          id: makeId(),
          name: 'M3U Playlist',
          type: 'm3u',
          username: '',
          password: '',
          server_urls: [],
          playlist_url: oldM3u.playlist_url,
          epg_url: '',
          epg_match: 'tvg-id'
        });
      }
      save('iptv_profiles', profiles);
    }
    profiles.forEach(function (p) {
      if (!p.type) p.type = p.playlist_url ? 'm3u' : 'xtream';
      if (!p.server_urls) p.server_urls = [];
      if (!p.playlist_url) p.playlist_url = '';
    });
    return profiles;
  }
  function saveProfiles(arr) {
    save('iptv_profiles', arr);
  }
  function getActiveId() {
    return load('iptv_active_profile', null);
  }

  /* Changing the active profile invalidates the Live TV channel cache, which
     is stored under GLOBAL keys rather than per-profile ones — so whatever is
     in there belongs to the profile that just stopped being active.
      Done here rather than at each call site because there are three ways the
     active profile changes (saving/connecting a profile, applying a remote
     config, and deleting the active one so the next takes over) and only the
     first two cleared it. Deleting a profile left the previous account's
     channel list on screen under the new account's credentials until the
     background refresh landed.
      The EPG and VOD caches need no clearing any more: they are keyed by
     Config.scope(), so another profile's entries simply aren't found. */
  function setActiveId(id) {
    var changed = String(getActiveId() || '') !== String(id || '');
    save('iptv_active_profile', id);
    if (!changed) return;
    try {
      localStorage.removeItem('iptv_ch_v2');
      localStorage.removeItem('iptv_cat_v2');
      localStorage.removeItem('iptv_m3u_v1');
    } catch (e) {}
  }

  /* ── State ─────────────────────────────────────────────────────────────── */
  var profiles = loadProfiles();
  var activeId = getActiveId();
  var selectedId = null;
  (function autoSelect() {
    if (activeId && profiles.some(function (p) {
      return p.id === activeId;
    })) {
      selectedId = activeId;
    } else if (profiles.length > 0) {
      selectedId = profiles[0].id;
    }
  })();

  /* ── Tab switching ─────────────────────────────────────────────────────── */
  var tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
  var panels = Array.from(document.querySelectorAll('.settings-panel'));
  function activateTab(value) {
    tabBtns.forEach(function (btn) {
      var on = btn.dataset.value === value;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach(function (panel) {
      panel.classList.toggle('active', panel.id === 'panel-' + value);
    });
    save('iptv_last_tab', value);
    if (value !== 'profiles') _inProfileContent = false;
    if (value === 'livetv') renderLiveTvCats();
    if (value === 'vod') renderVodCats();
    if (value === 'diag') renderDiagnostics();
    rebuildFocusables();
  }
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activateTab(btn.dataset.value);
    });
  });

  /* ── Profile type toggle ───────────────────────────────────────────────── */
  function getCurrentEditorType() {
    var xtreamBtn = document.getElementById('type-xtream-btn');
    return xtreamBtn && xtreamBtn.classList.contains('type-active') ? 'xtream' : 'm3u';
  }
  function setEditorType(type) {
    var xtreamBtn = document.getElementById('type-xtream-btn');
    var m3uBtn = document.getElementById('type-m3u-btn');
    var xtreamSect = document.getElementById('xtream-fields');
    var m3uSect = document.getElementById('m3u-fields');
    if (!xtreamBtn) return;
    xtreamBtn.classList.toggle('type-active', type === 'xtream');
    m3uBtn.classList.toggle('type-active', type === 'm3u');
    xtreamSect.style.display = type === 'xtream' ? '' : 'none';
    m3uSect.style.display = type === 'm3u' ? '' : 'none';
    rebuildFocusables();
  }
  document.getElementById('type-xtream-btn').addEventListener('click', function () {
    setEditorType('xtream');
  });
  document.getElementById('type-m3u-btn').addEventListener('click', function () {
    setEditorType('m3u');
  });

  /* ── Profile list rendering ────────────────────────────────────────────── */
  function renderProfileList() {
    var list = document.getElementById('profiles-list');
    list.innerHTML = '';
    profiles.forEach(function (profile) {
      var btn = document.createElement('button');
      btn.className = 'profile-item';
      btn.setAttribute('role', 'option');
      btn.dataset.profileId = profile.id;
      if (profile.id === selectedId) btn.classList.add('selected');
      if (profile.id === activeId) btn.classList.add('is-active');
      var typeLabel = profile.type === 'm3u' ? 'M3U' : 'Xtream';
      btn.innerHTML = '<span class="profile-tick">' + '<svg width="12" height="10" viewBox="0 0 12 10" fill="none">' + '<path d="M1 5l3.5 3.5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' + '</svg>' + '</span>' + '<span class="profile-item-name">' + escHtml(profile.name || 'Unnamed') + '</span>' + '<span class="profile-type-badge">' + typeLabel + '</span>' + (profile.id === activeId ? '<span class="profile-active-dot"></span>' : '');
      btn.addEventListener('click', function () {
        selectedId = profile.id;
        renderProfileList();
        renderEditor();
        rebuildFocusables();
        /* Re-render destroyed the focused node — restore the ring. */
        if (isProfilesPanel() && _inProfileContent && _col === 'sidebar') {
          applyProfileFocus();
        }
      });
      list.appendChild(btn);
    });
  }

  /* ── Editor rendering ──────────────────────────────────────────────────── */
  function renderEditor() {
    var emptyEl = document.getElementById('editor-empty');
    var formEl = document.getElementById('editor-form');
    var sidebarAdd = document.getElementById('add-profile-btn');
    /* With no profiles, the centered CTA in the empty state is the only
       "+ New Profile" button — hide the sidebar one to avoid duplication. */
    if (sidebarAdd) sidebarAdd.style.display = profiles.length === 0 ? 'none' : '';
    var profile = profiles.find(function (p) {
      return p.id === selectedId;
    });
    if (!profile) {
      emptyEl.style.display = '';
      formEl.hidden = true;
      startRemoteSession(); /* still offer remote setup with no profiles */
      return;
    }
    emptyEl.style.display = 'none';
    formEl.hidden = false;
    document.getElementById('prof-name').value = profile.name || '';
    document.getElementById('prof-username').value = profile.username || '';
    document.getElementById('prof-password').value = profile.password || '';
    document.getElementById('prof-m3u-url').value = profile.playlist_url || '';
    document.getElementById('prof-epg-url').value = profile.epg_url || '';
    document.getElementById('prof-epg-match').value = profile.epg_match || 'tvg-id';
    setEditorType(profile.type || 'xtream');
    renderUrlList(profile.server_urls || []);
    startRemoteSession();
  }
  function renderUrlList(urls) {
    var list = document.getElementById('url-list');
    list.innerHTML = '';
    var rows = urls.length > 0 ? urls.slice() : [''];
    rows.forEach(function (url, i) {
      var row = document.createElement('div');
      row.className = 'url-row';
      var idx = document.createElement('span');
      idx.className = 'url-index';
      idx.textContent = i + 1 + '.';
      var input = document.createElement('input');
      input.className = 'settings-input';
      input.type = 'text';
      input.value = url;
      input.placeholder = 'http://your-server.com';
      input.spellcheck = false;
      input.dataset.urlIndex = i;
      var removeBtn = document.createElement('button');
      removeBtn.className = 'url-remove-btn';
      removeBtn.title = 'Remove URL';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', function () {
        removeUrlRow(i);
      });
      row.appendChild(idx);
      row.appendChild(input);
      row.appendChild(removeBtn);
      list.appendChild(row);
    });
  }
  function getUrlsFromList() {
    return Array.from(document.querySelectorAll('#url-list .url-row input')).map(function (el) {
      return el.value.trim().replace(/\/+$/, '');
    }).filter(function (v) {
      return v !== '';
    });
  }
  function removeUrlRow(index) {
    var urls = getUrlsFromList();
    urls.splice(index, 1);
    renderUrlList(urls);
    rebuildFocusables();
  }
  document.getElementById('add-url-btn').addEventListener('click', function () {
    var currentUrls = getUrlsFromList();
    currentUrls.push('');
    renderUrlList(currentUrls);
    var inputs = document.querySelectorAll('#url-list .url-row input');
    var last = inputs[inputs.length - 1];
    if (last) {
      rebuildFocusables();
      var idx = focusables.indexOf(last);
      if (idx !== -1) applyFocus(idx);
    }
  });

  /* ── Add profile ───────────────────────────────────────────────────────── */
  function addProfile() {
    var profile = {
      id: makeId(),
      name: 'New Profile',
      type: 'xtream',
      username: '',
      password: '',
      server_urls: [],
      playlist_url: '',
      epg_url: '',
      epg_match: 'tvg-id'
    };
    profiles.push(profile);
    saveProfiles(profiles);
    selectedId = profile.id;
    renderProfileList();
    renderEditor();
    rebuildFocusables();
    /* Move focus straight into the editor's name field so the new profile
       can be filled in immediately (profiles panel uses its own 2-column
       focus model, not the flat `focusables` list). */
    _inProfileContent = true;
    _col = 'editor';
    _editorRowIdx = 0;
    _editorColIdx = 0;
    applyProfileFocus();
  }
  document.getElementById('add-profile-btn').addEventListener('click', addProfile);
  document.getElementById('empty-add-profile-btn').addEventListener('click', addProfile);

  /* ── Delete profile ────────────────────────────────────────────────────── */
  document.getElementById('delete-profile-btn').addEventListener('click', function () {
    var profile = profiles.find(function (p) {
      return p.id === selectedId;
    });
    if (!profile) return;
    var statusEl = document.getElementById('profile-status');
    if (statusEl.dataset.pendingDelete === '1') {
      profiles = profiles.filter(function (p) {
        return p.id !== selectedId;
      });
      saveProfiles(profiles);
      if (activeId === selectedId) {
        activeId = profiles.length > 0 ? profiles[0].id : null;
        setActiveId(activeId);
      }
      selectedId = profiles.length > 0 ? profiles[0].id : null;
      statusEl.dataset.pendingDelete = '';
      renderProfileList();
      renderEditor();
      rebuildFocusables();
    } else {
      statusEl.dataset.pendingDelete = '1';
      setStatus('profile-status', 'Press Delete again to confirm.', 'err');
      clearTimeout(_statusTimers['delete-confirm']);
      _statusTimers['delete-confirm'] = setTimeout(function () {
        statusEl.dataset.pendingDelete = '';
        if (statusEl.textContent === 'Press Delete again to confirm.') {
          setStatus('profile-status', '', '');
        }
      }, 3000);
    }
  });

  /* ── Save & Connect ────────────────────────────────────────────────────── */
  document.getElementById('save-profile-btn').addEventListener('click', function () {
    var profile = profiles.find(function (p) {
      return p.id === selectedId;
    });
    if (!profile) return;
    var name = document.getElementById('prof-name').value.trim();
    var type = getCurrentEditorType();
    var epgUrl = document.getElementById('prof-epg-url').value.trim();
    var epgMatch = document.getElementById('prof-epg-match').value;
    if (!name) {
      setStatus('profile-status', 'Please enter a profile name.', 'err');
      return;
    }
    if (type === 'm3u') {
      var playlistUrl = document.getElementById('prof-m3u-url').value.trim();
      if (!playlistUrl) {
        setStatus('profile-status', 'Please enter a playlist URL.', 'err');
        return;
      }
      profile.name = name;
      profile.type = 'm3u';
      profile.playlist_url = playlistUrl;
      profile.epg_url = epgUrl;
      profile.epg_match = epgMatch;
      saveProfiles(profiles);
      activeId = profile.id;
      setActiveId(activeId);
      save('iptv_source_type', 'm3u');
      save('iptv_m3u_config', {
        playlist_url: playlistUrl
      });
      try {
        localStorage.removeItem('iptv_m3u_v1');
      } catch (e) {}
      renderProfileList();
      setStatus('profile-status', 'Saved — returning…', 'ok');
      setTimeout(function () {
        tvGoBack('../index.html');
      }, 900);
      return;
    }
    var username = document.getElementById('prof-username').value.trim();
    var password = document.getElementById('prof-password').value.trim();
    var urls = getUrlsFromList();
    if (!username || !password) {
      setStatus('profile-status', 'Username and password are required.', 'err');
      return;
    }
    if (urls.length === 0) {
      setStatus('profile-status', 'Add at least one server URL.', 'err');
      return;
    }
    profile.name = name;
    profile.type = 'xtream';
    profile.username = username;
    profile.password = password;
    profile.server_urls = urls;
    profile.epg_url = epgUrl;
    profile.epg_match = epgMatch;
    saveProfiles(profiles);
    renderProfileList();
    setStatus('profile-status', 'Connecting…', '');

    /* Outcome tracking so we can tell a dead URL apart from bad credentials.
       Xtream returns HTTP 200 + { user_info: { auth: 0 } } for a wrong
       login (server is fine), versus a network/HTTP error for a bad URL. */
    var reachedButAuthFailed = false; // got a valid auth:0 from some server
    var accountIssue = null; // auth ok but Expired/Banned/Disabled

    function connectSuccess(url) {
      activeId = profile.id;
      setActiveId(activeId);
      save('iptv_source_type', 'xtream');
      save('iptv_active_resolved_url', url);
      try {
        localStorage.removeItem('iptv_ch_v2');
      } catch (e) {}
      try {
        localStorage.removeItem('iptv_cat_v2');
      } catch (e) {}
      renderProfileList();
      setStatus('profile-status', 'Connected — returning…', 'ok');
      setTimeout(function () {
        tvGoBack('../index.html');
      }, 900);
    }
    function reportFailure() {
      if (accountIssue) {
        setStatus('profile-status', 'Login worked, but the account is ' + accountIssue + '.', 'err');
      } else if (reachedButAuthFailed) {
        setStatus('profile-status', 'Server reached — username or password is incorrect.', 'err');
      } else {
        setStatus('profile-status', 'Could not reach any server URL. Check the address.', 'err');
      }
    }

    /* For each https URL, also try http on the same host/port. Some servers
       use a cert/TLS version the TV's browser rejects (even though a native
       app accepts it) — http sidesteps that. https is always tried first. */
    var tryList = [];
    urls.forEach(function (u) {
      tryList.push(u);
      if (/^https:/i.test(u)) {
        var alt = u.replace(/^https:/i, 'http:');
        if (tryList.indexOf(alt) === -1) tryList.push(alt);
      }
    });
    (function tryUrls(index) {
      if (index >= tryList.length) {
        reportFailure();
        return;
      }
      var url = tryList[index];
      setStatus('profile-status', 'Trying ' + (index + 1) + '/' + tryList.length + '…', '');
      var loginUrl = url + '/player_api.php?username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password);
      var ctrl = new AbortController();
      var tid = setTimeout(function () {
        ctrl.abort();
      }, 12000);
      fetch(loginUrl, {
        signal: ctrl.signal
      }).then(function (r) {
        clearTimeout(tid);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (data) {
        var ui = data && data.user_info;
        // Explicit failed login → server is fine, credentials are wrong.
        if (ui && Number(ui.auth) === 0) {
          reachedButAuthFailed = true;
          tryUrls(index + 1);
          return;
        }
        // Explicit success with an unusable account state.
        if (ui && Number(ui.auth) === 1) {
          var status = String(ui.status || 'Active');
          if (/expired|banned|disabled/i.test(status)) {
            accountIssue = status;
            reportFailure();
            return;
          }
          connectSuccess(url);
          return;
        }
        // Any other parseable response counts as reachable + valid: some
        // panels omit `auth` or use a different shape. Staying lenient here
        // avoids falsely rejecting a working server (only an explicit
        // auth:0 above is treated as bad credentials).
        if (data) {
          connectSuccess(url);
          return;
        }
        tryUrls(index + 1);
      }).catch(function () {
        clearTimeout(tid);
        tryUrls(index + 1);
      });
    })(0);
  });

  /* ── Display panel: interface size ─────────────────────────────────────────
     Applied live on change so the user sees the new size while choosing,
     instead of having to save and navigate back. assets/boot.js owns the storage
     key and the root font-size; this is only the picker. */
  (function populateDisplay() {
    var sel = document.getElementById('cfg-ui-scale');
    if (!sel || typeof UIScale === 'undefined') return;
    var current = UIScale.get();
    UIScale.SCALES.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = String(s.v);
      opt.textContent = s.label + ' — ' + s.note;
      /* Float compare: the stored value round-trips through a string, so
         match on a small epsilon rather than ===. */
      if (Math.abs(s.v - current) < 0.001) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () {
      var applied = UIScale.set(sel.value);
      setStatus('ui-scale-status', 'Interface size set to ' + Math.round(applied * 100) + '%.', 'ok', 4000);
      /* The panel just resized under the focus ring — put it back where
         the user left it so the D-pad doesn't lose its place. */
      requestAnimationFrame(function () {
        if (!isProfilesPanel()) applyFocus(focusIndex);
      });
    });
  })();

  /* ── Player panel: playback engine ─────────────────────────────────────── */
  var PLAYER_PREF_KEY = 'iptv_default_player';
  var PLAYER_LAST_KEY = 'iptv_last_player';
  var PLAYER_LABELS = {
    native: 'Native',
    hls: 'HLS.js',
    ts: 'Native TS'
  };

  /* The player reads its preference keys with a plain getItem, not JSON.parse,
     so they must be written as bare strings — save() would JSON-quote them and
     nothing would ever match. */
  function loadRaw(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }
  function saveRaw(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }
  function refreshLastUsedHint() {
    var hint = document.getElementById('player-last-hint');
    var sel = document.getElementById('cfg-default-player');
    if (!hint || !sel) return;
    if (sel.value !== 'last') {
      hint.style.display = 'none';
      return;
    }
    var last = loadRaw(PLAYER_LAST_KEY, '');
    hint.style.display = '';
    hint.textContent = PLAYER_LABELS[last] ? 'Currently remembering: ' + PLAYER_LABELS[last] + '.' : 'Nothing remembered yet — press RED during playback to choose a player.';
  }
  (function populatePlayer() {
    var sel = document.getElementById('cfg-default-player');
    if (sel) {
      sel.value = loadRaw(PLAYER_PREF_KEY, 'auto');
      if (!sel.value) sel.value = 'auto'; // unknown stored value
      refreshLastUsedHint();
      sel.addEventListener('change', function () {
        saveRaw(PLAYER_PREF_KEY, sel.value);
        refreshLastUsedHint();
        setStatus('player-pref-status', 'Saved — applies to the next stream you start.', 'ok', 4000);
      });
    }
  })();

  /* ── Subtitles panel: appearance ──────────────────────────────────────────
     These three are the settings that make sense to choose ahead of time and
     leave alone. Position and delay deliberately live in the player's own
     subtitle menu instead — both are judged against what is on screen, and a
     delay picked blind in Settings is a guess. player/engine.js reads all of
     them when it starts, so a change here applies to the next stream.
      Written raw, not JSON: the player reads them with a plain getItem, and
     JSON-quoting would make every stored value fail its comparison. */
  (function populateSubtitleAppearance() {
    var pairs = [['cfg-subs-size', 'vod_subs_size', 'md', 'Text size'], ['cfg-subs-style', 'vod_sub_style', 'shadow', 'Style'], ['cfg-subs-colour', 'vod_sub_colour', 'white', 'Colour']];
    pairs.forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (!el) return;
      el.value = loadRaw(p[1], p[2]) || p[2];
      el.addEventListener('change', function () {
        saveRaw(p[1], el.value);
        setStatus('subs-appearance-status', p[3] + ' saved — applies to the next stream you start.', 'ok', 4000);
      });
    });
  })();

  /* ── Video output: PiP rendering mode ─────────────────────────────────────
     Written as a bare string and read by assets/boot.js before first paint,
     so it only takes effect on the next page load — say so rather than
     letting the user wonder why nothing changed on this screen (there is no
     PiP on the Settings page to change). */
  (function populatePipMode() {
    var sel = document.getElementById('cfg-pip-mode');
    var hint = document.getElementById('pip-mode-hint');
    if (!sel) return;
    var KEY = typeof Platform !== 'undefined' && Platform.PIP_MODE_KEY || 'iptv_pip_mode';
    function describeCurrent() {
      if (!hint || typeof Platform === 'undefined') return;
      var detected = Platform.videoPlaneOnly ? 'This TV was detected as needing compatibility mode' : 'This TV was detected as not needing compatibility mode';
      var inEffect = Platform.pipCompatActive ? 'compatibility mode is in effect' : 'standard rendering is in effect';
      hint.textContent = detected + ' (' + Platform.describe() + '). Right now ' + inEffect + '.';
    }
    sel.value = loadRaw(KEY, 'auto');
    if (!sel.value) sel.value = 'auto';
    describeCurrent();
    sel.addEventListener('change', function () {
      saveRaw(KEY, sel.value);
      setStatus('pip-mode-status', 'Saved — takes effect the next time Live TV opens.', 'ok', 5000);
    });
  })();

  /* ── Video output: Multiview tile count ───────────────────────────────── */
  (function populateMultiview() {
    var sel = document.getElementById('cfg-mv-tiles');
    if (!sel) return;
    /* Multiview itself isn't loaded on this page, so the key is named here
       rather than read off the module. It is the one place besides
       livetv/multiview.js that knows it. */
    var KEY = 'iptv_multiview_tiles';
    sel.value = loadRaw(KEY, '0') || '0';
    sel.addEventListener('change', function () {
      saveRaw(KEY, sel.value);
      var n = parseInt(sel.value, 10);
      setStatus('pip-mode-status', n ? 'Multiview will use ' + n + ' tiles.' : 'Multiview will choose its own tile count.', 'ok', 5000);
    });
  })();

  /* ── OpenSubtitles ─────────────────────────────────────────────────────────
     Fields persist on every keystroke/change rather than behind a Save button:
     there's nothing to validate locally, and "Test connection" is the honest
     way to confirm the key works. */
  var OS_LANGS = [['en', 'English'], ['nl', 'Dutch'], ['fr', 'French'], ['de', 'German'], ['es', 'Spanish'], ['it', 'Italian'], ['pt', 'Portuguese'], ['pt-br', 'Portuguese (Brazil)'], ['pl', 'Polish'], ['ru', 'Russian'], ['tr', 'Turkish'], ['ar', 'Arabic'], ['hi', 'Hindi'], ['zh-cn', 'Chinese'], ['ja', 'Japanese'], ['ko', 'Korean'], ['sv', 'Swedish'], ['no', 'Norwegian'], ['da', 'Danish'], ['fi', 'Finnish'], ['el', 'Greek'], ['he', 'Hebrew'], ['ro', 'Romanian'], ['cs', 'Czech'], ['hu', 'Hungarian'], ['bg', 'Bulgarian'], ['uk', 'Ukrainian']];
  (function populateOpenSubtitles() {
    var keyEl = document.getElementById('cfg-os-key');
    var langEl = document.getElementById('cfg-os-lang');
    var userEl = document.getElementById('cfg-os-user');
    var passEl = document.getElementById('cfg-os-pass');
    var testEl = document.getElementById('cfg-os-test-btn');
    if (!keyEl || !langEl) return;
    var currentLang = loadRaw('os_language', 'en') || 'en';
    OS_LANGS.forEach(function (pair) {
      var opt = document.createElement('option');
      opt.value = pair[0];
      opt.textContent = pair[1];
      if (pair[0] === currentLang) opt.selected = true;
      langEl.appendChild(opt);
    });
    keyEl.value = loadRaw('os_api_key', '');
    userEl.value = loadRaw('os_username', '');
    passEl.value = loadRaw('os_password', '');

    /* Changing the key or account invalidates any cached login token. */
    function dropToken() {
      try {
        localStorage.removeItem('os_token');
        localStorage.removeItem('os_token_ts');
      } catch (e) {}
    }
    function bindText(el, key, onChange) {
      function commit() {
        saveRaw(key, el.value.trim());
        if (onChange) onChange();
      }
      el.addEventListener('change', commit);
      el.addEventListener('blur', commit);
    }
    bindText(keyEl, 'os_api_key', dropToken);
    bindText(userEl, 'os_username', dropToken);
    bindText(passEl, 'os_password', dropToken);
    langEl.addEventListener('change', function () {
      saveRaw('os_language', langEl.value);
      setStatus('os-status', 'Subtitle language set to ' + langEl.options[langEl.selectedIndex].textContent + '.', 'ok', 4000);
    });
    if (testEl) {
      testEl.addEventListener('click', function () {
        /* Commit any in-progress edits first — the user may press Test
           straight from the key field without it having blurred. */
        saveRaw('os_api_key', keyEl.value.trim());
        saveRaw('os_username', userEl.value.trim());
        saveRaw('os_password', passEl.value.trim());
        dropToken();
        if (!keyEl.value.trim()) {
          setStatus('os-status', 'Enter an API key first.', 'err');
          return;
        }
        if (typeof OpenSubtitles === 'undefined') {
          setStatus('os-status', 'OpenSubtitles module failed to load.', 'err');
          return;
        }
        setStatus('os-status', 'Contacting OpenSubtitles…', '');
        OpenSubtitles.search({
          title: 'Inception',
          year: 2010
        }).then(function (results) {
          /* The login isn't exercised here — it's only used at
             download time — so don't claim to be signed in. */
          var who = loadRaw('os_username', '') ? ' Account "' + loadRaw('os_username', '') + '" will be used for downloads.' : '';
          var found = results.length ? '' : ' (The test search found nothing, but the key itself is valid.)';
          setStatus('os-status', 'Connected — API key works.' + found + who, 'ok');
        }).catch(function (err) {
          setStatus('os-status', err && err.message ? err.message : 'Connection failed.', 'err');
        });
      });
    }
  })();

  /* ── EPG panel ─────────────────────────────────────────────────────────── */
  (function populateEPG() {
    document.getElementById('cfg-epg-url').value = load('iptv_custom_epg_url', '');
    document.getElementById('cfg-epg-match').value = load('iptv_custom_epg_match', 'tvg-id');
  })();
  document.getElementById('cfg-epg-load-btn').addEventListener('click', function () {
    var url = document.getElementById('cfg-epg-url').value.trim();
    var match = document.getElementById('cfg-epg-match').value;
    if (!url) {
      setStatus('epg-load-status', 'Enter an XMLTV URL first.', 'err');
      return;
    }
    save('iptv_custom_epg_url', url);
    save('iptv_custom_epg_match', match);
    setStatus('epg-load-status', 'EPG settings saved.', 'ok', 3000);
  });

  /* ── Category hide panels (Live TV + VOD) ──────────────────────────────── */
  /* One onChange handler per storage key — adds/removes the id in the list. */
  function hiddenCatToggler(storageKey) {
    return function (catId, on) {
      var h = load(storageKey, []) || [];
      if (on) {
        if (h.indexOf(catId) === -1) h.push(catId);
      } else {
        h = h.filter(function (x) {
          return x !== catId;
        });
      }
      save(storageKey, h);
    };
  }
  function renderCatToggles(wrap, cats, storageKey) {
    var hidden = new Set((load(storageKey, []) || []).map(String));
    var onToggle = hiddenCatToggler(storageKey);
    cats.forEach(function (cat) {
      var id = String(cat.category_id);
      wrap.appendChild(makeCatToggle(id, cat.category_name || 'Unnamed', hidden.has(id), onToggle));
    });
  }
  function renderLiveTvCats() {
    var wrap = document.getElementById('livetv-cats-wrap');
    var empty = document.getElementById('livetv-cats-empty');
    var cached = load('iptv_cat_v2', null);
    var cats = cached && Array.isArray(cached.data) ? cached.data : [];
    if (!cats.length) {
      wrap.innerHTML = '';
      wrap.style.display = 'none';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';
    wrap.style.display = '';
    wrap.innerHTML = '';
    renderCatToggles(wrap, cats, 'iptv_hidden_cats_live');
    rebuildFocusables();
  }
  function renderVodCats() {
    var empty = document.getElementById('vod-cats-empty');
    var movieW = document.getElementById('vod-movie-cats-wrap');
    var seriesW = document.getElementById('vod-series-cats-wrap');
    movieW.innerHTML = '';
    seriesW.innerHTML = '';
    function cachedCats(key) {
      var c = load(key, null);
      if (c && c.data) return c.data;
      return Array.isArray(c) ? c : [];
    }
    /* Scoped by account, not by server URL — see core/config.js. */
    var vodScope = Config.scope();
    var movieCats = cachedCats('vod_cats_movie_' + vodScope);
    var seriesCats = cachedCats('vod_cats_series_' + vodScope);
    var hasAny = movieCats.length || seriesCats.length;
    empty.style.display = hasAny ? 'none' : '';
    document.getElementById('vod-movies-wrap').style.display = movieCats.length ? '' : 'none';
    document.getElementById('vod-series-wrap').style.display = seriesCats.length ? '' : 'none';
    renderCatToggles(movieW, movieCats, 'iptv_hidden_cats_vod_m');
    renderCatToggles(seriesW, seriesCats, 'iptv_hidden_cats_vod_s');
    rebuildFocusables();
  }
  function makeCatToggle(id, name, isHidden, onChange) {
    var row = document.createElement('div');
    row.className = 'cat-toggle-row' + (isHidden ? ' hidden-cat' : '');
    row.innerHTML = '<span class="cat-toggle-name">' + escHtml(name) + '</span>' + '<button class="cat-toggle-btn" aria-pressed="' + (isHidden ? 'true' : 'false') + '">' + '<span class="cat-toggle-knob"></span>' + '</button>';
    var btn = row.querySelector('.cat-toggle-btn');
    btn.addEventListener('click', function () {
      var nowHidden = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', nowHidden ? 'true' : 'false');
      row.classList.toggle('hidden-cat', nowHidden);
      onChange(id, nowHidden);
    });
    return row;
  }

  /* ── Diagnostics panel ─────────────────────────────────────────────────────
     A retail TV has no developer console, so anything we'd otherwise ask the
     user to evaluate by hand has to be visible in the app itself. Everything
     here is read-only and gathered live on the device. */
  /* A diagnostic whose value is a paragraph rather than a number. diagRow's
     value column is right-aligned and capped at 55% — correct for "3 streams",
     unreadable for a JSON reply — so this one stacks and takes the full row. */
  function diagBlock(label, text, note) {
    var row = document.createElement('div');
    row.className = 'cache-row diag-block';
    var info = document.createElement('div');
    info.className = 'cache-info';
    var l = document.createElement('span');
    l.className = 'cache-label';
    l.textContent = label;
    info.appendChild(l);
    if (note) {
      var d = document.createElement('span');
      d.className = 'cache-desc';
      d.textContent = note;
      info.appendChild(d);
    }
    var body = document.createElement('div');
    body.className = 'diag-raw';
    body.textContent = text;
    row.appendChild(info);
    row.appendChild(body);
    return row;
  }
  function diagRow(label, value, note) {
    var row = document.createElement('div');
    row.className = 'cache-row';
    var info = document.createElement('div');
    info.className = 'cache-info';
    var l = document.createElement('span');
    l.className = 'cache-label';
    l.textContent = label;
    var d = document.createElement('span');
    d.className = 'cache-desc';
    d.textContent = note || '';
    info.appendChild(l);
    if (note) info.appendChild(d);
    var v = document.createElement('span');
    v.className = 'diag-value';
    v.textContent = value;
    row.appendChild(info);
    row.appendChild(v);
    return row;
  }
  function deviceInfo() {
    try {
      if (typeof webOSSystem !== 'undefined' && webOSSystem.deviceInfo) {
        return JSON.parse(webOSSystem.deviceInfo) || {};
      }
    } catch (e) {}
    return {};
  }
  function storageBytes() {
    if (typeof Store !== 'undefined') return Store.bytesUsed();
    var total = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        total += k.length + (localStorage.getItem(k) || '').length;
      }
    } catch (e) {}
    return total;
  }
  function renderDiagnostics() {
    var list = document.getElementById('diag-list');
    if (!list) return;
    list.innerHTML = '';
    var ua = navigator.userAgent || '';
    var dev = deviceInfo();
    var P = typeof Platform !== 'undefined' ? Platform : null;
    list.appendChild(diagRow('App version', _localVer ? 'v' + _localVer : '—'));
    list.appendChild(diagRow('Platform', P ? P.describe() : 'unknown', P && P.isWebOS ? 'Running on webOS' : 'Not a webOS browser'));
    if (dev.modelName || dev.firmwareVersion) {
      list.appendChild(diagRow('Device', (dev.modelName || '?') + (dev.firmwareVersion ? '  ·  ' + dev.firmwareVersion : '')));
    }
    list.appendChild(diagRow('Screen', window.innerWidth + '×' + window.innerHeight, 'Interface size ' + Math.round((typeof UIScale !== 'undefined' ? UIScale.get() : 1) * 100) + '%'));

    /* ── Video pipeline ───────────────────────────────────────────────────
       The single most useful thing on this screen. A black Live TV preview
       with working audio means the decoder is running but its hardware
       layer isn't being shown — which these two rows identify directly. */
    if (P) {
      list.appendChild(diagRow('Video pipeline', P.videoPlaneOnly ? 'Hardware overlay plane' : 'Composited', P.videoPlaneOnly ? 'Video cannot be rounded or clipped on this TV' : 'Video composites like any other element'));
      list.appendChild(diagRow('Live TV preview', P.pipCompatActive ? 'Compatibility (square)' : 'Standard (rounded)', P.pipMode === 'auto' ? 'Chosen automatically — override in Player' : 'Forced to "' + P.pipMode + '" in Player'));
      list.appendChild(diagRow('Simultaneous streams', String(P.maxDecoders), 'Multiview grid size this TV can decode at once'));
    }

    /* Remote buttons that reached Live TV and did nothing. Empty is the
       normal, healthy state; a code listed here is a button the app isn't
       wired to, which is what a "this button does nothing" report needs. */
    var unhandled = load('iptv_unhandled_keys', null);
    if (unhandled && unhandled.length) {
      list.appendChild(diagRow('Unrecognised remote keys', unhandled.join(', '), 'Key codes seen on Live TV that nothing responds to'));
    }

    /* Whether the track APIs exist at all on this build. Existence is not
       the same as working — a track list that stays empty during playback
       means the platform isn't exposing them for that container. */
    var probe = document.createElement('video');
    list.appendChild(diagRow('Audio track API', typeof probe.audioTracks !== 'undefined' ? 'Available' : 'Not available', 'Needed to switch audio language'));
    list.appendChild(diagRow('Text track API', typeof probe.textTracks !== 'undefined' ? 'Available' : 'Not available', 'Needed for embedded subtitles'));

    /* ── Last subtitle attempt ────────────────────────────────────────────
       Written by the VOD player every time it resolves subtitles for a
       title. This is what turns "there are no subtitles" into an answerable
       question: it says what the panel returned, what was downloadable, and
       what the decoder ended up exposing. */
    var sd = load('iptv_subs_diag', null);
    if (sd) {
      list.appendChild(diagRow('Subtitles · title', sd.title || '—', sd.ts ? new Date(sd.ts).toLocaleString() : ''));
      list.appendChild(diagRow('Subtitles · panel reported', String(sd.reported || 0) + ' stream' + (sd.reported === 1 ? '' : 's'), sd.languages ? 'Languages: ' + sd.languages : 'get_vod_info / get_series_info'));
      list.appendChild(diagRow('Subtitles · downloadable files', String(sd.files || 0), sd.embedded ? sd.embedded + ' embedded in the video, no file to fetch' : ''));
      list.appendChild(diagRow('Subtitles · loaded into player', String(sd.loaded || 0), sd.failed ? sd.failed + ' failed to download' : ''));

      /* What the panel actually sent. Only written when the player had to
         ask for itself — i.e. exactly when subtitles came up empty and
         the reason matters. A key name nobody expected is the likeliest
         answer, so the reply is shown rather than summarised. */
      if (sd.panelShape) {
        list.appendChild(diagBlock('Subtitles · reply shape', sd.panelShape, 'Which subtitle-bearing keys the panel returned, if any'));
      }
      if (sd.panelRaw) {
        list.appendChild(diagBlock('Subtitles · raw reply', sd.panelRaw, (sd.source || 'panel reply') + ' — long text elided'));
      }
    }

    /* Per-page load times, recorded by assets/boot.js on every page. This is
       the number that decides whether a single-page rewrite is worthwhile. */
    var timings = load(UIScale && UIScale.TIMING_KEY ? UIScale.TIMING_KEY : 'iptv_page_timings', null);
    if (!timings) {
      try {
        timings = JSON.parse(localStorage.getItem('iptv_page_timings') || 'null');
      } catch (e) {}
    }
    if (timings) {
      var names = Object.keys(timings),
        slowest = 0;
      names.forEach(function (n) {
        var t = timings[n];
        if (t && t.ready > slowest) slowest = t.ready;
        list.appendChild(diagRow('Load · ' + n, t && t.ready ? t.ready + ' ms' : '—', t && t.full ? 'fully loaded ' + t.full + ' ms' : ''));
      });
      list.appendChild(diagRow('Navigation cost', slowest ? slowest + ' ms' : '—', slowest > 800 ? 'Slow — a single-page rewrite would help' : slowest ? 'Acceptable — a rewrite would not pay off' : ''));
    } else {
      list.appendChild(diagRow('Page load times', 'none recorded yet', 'Visit Live TV and VOD, then come back'));
    }
    var chCache = load('iptv_ch_v2', null);
    list.appendChild(diagRow('Cached channels', chCache && chCache.data && chCache.data.length ? String(chCache.data.length) : '0'));
    list.appendChild(diagRow('Storage used', Math.round(storageBytes() / 1024) + ' KB'));
    rebuildFocusables();
  }
  (function wireDiagnostics() {
    var btn = document.getElementById('diag-refresh-btn');
    if (btn) btn.addEventListener('click', function () {
      renderDiagnostics();
      setStatus('diag-status', 'Refreshed.', 'ok', 2500);
    });
  })();

  /* ── Remote QR setup — always-visible right panel ──────────────────────── */
  var REMOTE_BASE_URL = 'https://lgiptv-remote.vercel.app';
  var REMOTE_POLL_MS = 3000; // gap between cfg polls
  var REMOTE_POLL_MAX_MS = 4 * 60 * 1000; // stop polling after 4 min idle
  var _remoteToken = null;
  var _remotePollTimer = null;
  function _genToken() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var t = '';
    for (var i = 0; i < 8; i++) t += chars.charAt(Math.floor(Math.random() * chars.length));
    return t;
  }
  document.getElementById('remote-new-code-btn').addEventListener('click', function () {
    startRemoteSession();
  });
  function startRemoteSession() {
    stopRemoteSession();
    _remoteToken = _genToken();

    /* Gather category data */
    var cachedCats = load('iptv_cat_v2', null);
    var liveCats = cachedCats && Array.isArray(cachedCats.data) ? cachedCats.data.map(function (c) {
      return {
        id: String(c.category_id),
        name: c.category_name || ''
      };
    }) : [];
    var vodScope = Config.scope();
    var rawM = load('vod_cats_movie_' + vodScope, null);
    var rawS = load('vod_cats_series_' + vodScope, null);
    var mArr = Array.isArray(rawM) ? rawM : rawM && rawM.data ? rawM.data : [];
    var sArr = Array.isArray(rawS) ? rawS : rawS && rawS.data ? rawS.data : [];
    var vodCatsM = mArr.map(function (c) {
      return {
        id: String(c.category_id),
        name: c.category_name || ''
      };
    });
    var vodCatsS = sArr.map(function (c) {
      return {
        id: String(c.category_id),
        name: c.category_name || ''
      };
    });

    /* Send all profiles so phone can pick one */
    var ctx = {
      active_profile_id: activeId || selectedId || '',
      profiles: profiles.map(function (p) {
        return {
          id: p.id,
          name: p.name || '',
          type: p.type || 'xtream',
          server_urls: p.server_urls || [],
          username: p.username || '',
          password: p.password || '',
          playlist_url: p.playlist_url || '',
          epg_url: p.epg_url || '',
          epg_match: p.epg_match || 'tvg-id'
        };
      }),
      hidden_live: load('iptv_hidden_cats_live', []) || [],
      hidden_vod_m: load('iptv_hidden_cats_vod_m', []) || [],
      hidden_vod_s: load('iptv_hidden_cats_vod_s', []) || [],
      cats_live: liveCats,
      cats_vod_m: vodCatsM,
      cats_vod_s: vodCatsS
    };

    /* Show QR immediately so user can scan while ctx uploads. Generated
       on-device (qrcode.js) so the session token never leaves the TV and
       the user's phone — no third-party QR service involved. */
    var setupUrl = REMOTE_BASE_URL + '/?s=' + _remoteToken;
    var img = document.getElementById('remote-qr-img');
    var urlEl = document.getElementById('remote-qr-url');
    if (img) {
      try {
        var qr = qrcode(0, 'M'); // type 0 = auto-size, ECC level M
        qr.addData(setupUrl);
        qr.make();
        img.src = qr.createDataURL(5, 12); // ~190px native, minimal scaling
      } catch (e) {
        img.removeAttribute('src'); // URL text below is the fallback
      }
    }
    if (urlEl) urlEl.textContent = setupUrl;
    setStatus('remote-qr-status', 'Uploading…', '');

    /* Push context — capture token so closure is stable across restarts */
    var token = _remoteToken;
    fetch(REMOTE_BASE_URL + '/api/session?s=' + token + '&t=ctx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ctx)
    }).then(function (r) {
      if (token !== _remoteToken) return; /* session restarted — ignore */
      if (!r.ok) throw new Error('HTTP ' + r.status);
      setStatus('remote-qr-status', 'Waiting for phone…', '');
    }).catch(function (err) {
      if (token !== _remoteToken) return;
      setStatus('remote-qr-status', 'Upload failed: ' + (err && err.message ? err.message : 'network error'), 'err');
    });

    /* Poll for incoming config. 3s interval keeps the request count low on
       the free KV tier; auto-stop after a few minutes so an abandoned
       Settings screen doesn't poll forever and burn the daily quota. */
    var pollStart = Date.now();
    _remotePollTimer = setInterval(function () {
      if (!_remoteToken) return;
      if (Date.now() - pollStart > REMOTE_POLL_MAX_MS) {
        stopRemoteSession();
        setStatus('remote-qr-status', 'Code expired — tap New Code.', '');
        return;
      }
      fetch(REMOTE_BASE_URL + '/api/session?s=' + _remoteToken + '&t=cfg').then(function (r) {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (data) {
        if (!data) return;
        var usedToken = _remoteToken;
        stopRemoteSession();
        applyRemoteConfig(data, usedToken);
      }).catch(function () {});
    }, REMOTE_POLL_MS);
  }
  function stopRemoteSession() {
    if (_remotePollTimer) {
      clearInterval(_remotePollTimer);
      _remotePollTimer = null;
    }
    _remoteToken = null;
  }

  /* Wipe both relay keys from the store as soon as we're done with them. */
  function deleteRemoteSession(token) {
    if (!token) return;
    fetch(REMOTE_BASE_URL + '/api/session?s=' + token, {
      method: 'DELETE'
    }).catch(function () {});
  }
  function applyRemoteConfig(cfg, usedToken) {
    /* Credentials are no longer needed in the store — wipe them now. */
    deleteRemoteSession(usedToken);
    /* Phone sends back the profile id it edited — find or create */
    var profile = cfg.profile_id && profiles.find(function (p) {
      return p.id === cfg.profile_id;
    }) || profiles.find(function (p) {
      return p.id === selectedId;
    });
    if (!profile) {
      profile = {
        id: makeId(),
        name: 'Remote Profile',
        type: 'xtream',
        username: '',
        password: '',
        server_urls: [],
        playlist_url: '',
        epg_url: '',
        epg_match: 'tvg-id'
      };
      profiles.push(profile);
      selectedId = profile.id;
    }
    profile.name = cfg.name || profile.name;
    profile.type = cfg.profile_type === 'm3u' ? 'm3u' : 'xtream';
    profile.server_urls = Array.isArray(cfg.server_urls) ? cfg.server_urls : profile.server_urls;
    profile.username = cfg.username !== undefined ? cfg.username : profile.username;
    profile.password = cfg.password !== undefined ? cfg.password : profile.password;
    profile.playlist_url = cfg.playlist_url || profile.playlist_url;
    profile.epg_url = cfg.epg_url !== undefined ? cfg.epg_url : profile.epg_url;
    profile.epg_match = cfg.epg_match || profile.epg_match;
    saveProfiles(profiles);

    /* Apply hidden categories */
    if (Array.isArray(cfg.hidden_live)) save('iptv_hidden_cats_live', cfg.hidden_live);
    if (Array.isArray(cfg.hidden_vod_m)) save('iptv_hidden_cats_vod_m', cfg.hidden_vod_m);
    if (Array.isArray(cfg.hidden_vod_s)) save('iptv_hidden_cats_vod_s', cfg.hidden_vod_s);

    /* Set as active if it's an Xtream profile with URLs */
    activeId = profile.id;
    setActiveId(activeId);
    save('iptv_source_type', profile.type);
    if (profile.type === 'xtream' && profile.server_urls.length) {
      save('iptv_active_resolved_url', profile.server_urls[0]);
    } else if (profile.type === 'm3u' && profile.playlist_url) {
      save('iptv_m3u_config', {
        playlist_url: profile.playlist_url
      });
    }
    try {
      localStorage.removeItem('iptv_ch_v2');
    } catch (e) {}
    try {
      localStorage.removeItem('iptv_cat_v2');
    } catch (e) {}
    stopRemoteSession();
    setStatus('profile-status', 'Remote config applied — returning…', 'ok');
    setTimeout(function () {
      tvGoBack('../index.html');
    }, 1500);
  }

  /* ── Cache panel ───────────────────────────────────────────────────────── */
  document.getElementById('cfg-clear-cache-btn').addEventListener('click', function () {
    try {
      localStorage.removeItem('iptv_ch_v2');
      localStorage.removeItem('iptv_cat_v2');
    } catch (e) {}
    setStatus('cfg-clear-ch-status', 'Channel cache cleared.', 'ok', 3000);
  });
  document.getElementById('cfg-clear-epg-btn').addEventListener('click', function () {
    try {
      localStorage.removeItem('iptv_epg_v2');
      localStorage.removeItem('iptv_xmltv_cache');
    } catch (e) {}
    setStatus('cfg-clear-epg-status', 'EPG cache cleared.', 'ok', 3000);
  });

  /* ── Updates panel (replaces the old auto-updater modal) ───────────────── */
  var UPD_MANIFEST = 'https://github.com/sharktie/lg-iptv/releases/latest/download/manifest.json';
  var UPD_FALLBACK = 'https://raw.githubusercontent.com/sharktie/lg-iptv/main/manifest.json';
  var UPD_APP_ID = 'com.sharktie.iptv';
  var _localVer = null,
    _pendingIpk = null;
  function updFetch(url) {
    var ctrl = new AbortController();
    var tid = setTimeout(function () {
      ctrl.abort();
    }, 12000);
    return fetch(url, {
      signal: ctrl.signal,
      cache: 'no-store'
    }).then(function (r) {
      clearTimeout(tid);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).catch(function (e) {
      clearTimeout(tid);
      throw e;
    });
  }
  function updLocalVersion() {
    return updFetch('../appinfo.json').then(function (d) {
      return d.version;
    });
  }
  function updRemoteManifest() {
    return updFetch(UPD_MANIFEST + '?t=' + Date.now()).catch(function () {
      return updFetch(UPD_FALLBACK + '?t=' + Date.now());
    });
  }
  function updCmp(a, b) {
    var x = String(a).split('.'),
      y = String(b).split('.');
    for (var i = 0; i < Math.max(x.length, y.length); i++) {
      var d = (parseInt(x[i], 10) || 0) - (parseInt(y[i], 10) || 0);
      if (d !== 0) return d > 0 ? 1 : -1;
    }
    return 0;
  }
  function updSetCurrent(v) {
    _localVer = v;
    var el = document.getElementById('upd-current');
    if (el) el.textContent = 'v' + v;
  }
  updLocalVersion().then(updSetCurrent).catch(function () {
    var el = document.getElementById('upd-current');
    if (el) el.textContent = 'unknown';
  });
  document.getElementById('upd-check-btn').addEventListener('click', function () {
    setStatus('upd-status', 'Checking for updates…', '');
    document.getElementById('upd-available').style.display = 'none';
    var localP = _localVer ? Promise.resolve(_localVer) : updLocalVersion();
    Promise.all([localP, updRemoteManifest()]).then(function (res) {
      var local = res[0],
        manifest = res[1];
      updSetCurrent(local);
      if (!manifest || !manifest.version) {
        setStatus('upd-status', 'Could not read the latest version.', 'err');
        return;
      }
      if (updCmp(manifest.version, local) > 0) {
        _pendingIpk = manifest.ipkUrl || manifest.ipk_url || '';
        document.getElementById('upd-new-version').textContent = 'v' + local + '  →  v' + manifest.version;
        document.getElementById('upd-available').style.display = '';
        setStatus('upd-status', '', '');
        rebuildFocusables();
      } else {
        setStatus('upd-status', 'You’re on the latest version (v' + local + ').', 'ok');
      }
    }).catch(function () {
      setStatus('upd-status', 'Update check failed — check your connection.', 'err');
    });
  });
  document.getElementById('upd-install-btn').addEventListener('click', function () {
    if (!_pendingIpk) return;
    if (typeof webOS === 'undefined' || !webOS.service) {
      setStatus('upd-progress', 'Install service isn’t available on this device.', 'err');
      return;
    }
    setStatus('upd-progress', 'Installing… the app will restart when done.', '');
    webOS.service.request('luna://com.webos.appInstallService/dev/install', {
      method: 'install',
      parameters: {
        id: UPD_APP_ID,
        ipkUrl: _pendingIpk
      },
      onSuccess: function onSuccess() {
        setStatus('upd-progress', 'Installed — restarting…', 'ok');
        setTimeout(function () {
          try {
            webOS.platformBack();
          } catch (e) {}
          try {
            window.close();
          } catch (e) {}
        }, 2000);
      },
      onFailure: function onFailure(err) {
        var msg = err && (err.errorText || err.errorCode);
        setStatus('upd-progress', 'Install failed: ' + (msg ? msg : 'unknown error'), 'err');
      }
    });
  });

  /* ── Back navigation ───────────────────────────────────────────────────── */
  if (typeof tvGoBack !== 'function') {
    window.tvGoBack = function (backUrl) {
      if (backUrl) {
        window.location.href = backUrl;
      } else if (typeof webOS !== 'undefined') {
        webOS.platformBack();
      }
    };
  }
  document.getElementById('back-btn').addEventListener('click', function () {
    stopRemoteSession();
    tvGoBack('../index.html');
  });

  /* ── D-pad navigation ──────────────────────────────────────────────────── */
  var KEY = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    ENTER: 13,
    BACK: 461
  };
  var focusables = [];
  var focusIndex = 0;
  var tabList = [];
  var _col = 'sidebar';
  var _sidebarIdx = 0;
  var _editorRowIdx = 0;
  var _editorColIdx = 0;
  var _inProfileContent = false;
  function getSidebarItems() {
    var items = Array.from(document.querySelectorAll('#profiles-list .profile-item'));
    // Whichever "+ New Profile" button is currently visible.
    var sidebarAdd = document.getElementById('add-profile-btn');
    var emptyAdd = document.getElementById('empty-add-profile-btn');
    if (sidebarAdd && sidebarAdd.offsetParent !== null) items.push(sidebarAdd);
    if (emptyAdd && emptyAdd.offsetParent !== null) items.push(emptyAdd);
    return items;
  }

  /* Containers whose controls form one horizontal D-pad row in the editor. */
  var EDITOR_ROW_GROUPS = ['#editor-header', '#type-toggle', '.url-row', '.field-row'];
  function getEditorRows() {
    var formEl = document.getElementById('editor-form');
    if (!formEl || formEl.hidden) return [];
    var rows = [];
    var seen = [];
    function visible(el) {
      return !el.disabled && el.offsetParent !== null;
    }
    var all = Array.from(formEl.querySelectorAll('input, select, button')).filter(visible);
    all.forEach(function (el) {
      if (seen.indexOf(el) !== -1) return;
      for (var i = 0; i < EDITOR_ROW_GROUPS.length; i++) {
        var group = el.closest(EDITOR_ROW_GROUPS[i]);
        if (group) {
          var siblings = Array.from(group.querySelectorAll('input, select, button')).filter(visible);
          siblings.forEach(function (s) {
            seen.push(s);
          });
          rows.push(siblings);
          return;
        }
      }
      seen.push(el);
      rows.push([el]);
    });
    return rows;
  }
  function getFlatPanelItems() {
    var activePanel = document.querySelector('.settings-panel.active');
    if (!activePanel) return [];
    return Array.from(activePanel.querySelectorAll('input, select, button')).filter(function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
  }
  function isProfilesPanel() {
    var p = document.querySelector('.settings-panel.active');
    return p && p.id === 'panel-profiles';
  }
  function rebuildFocusables() {
    tabList = Array.from(document.querySelectorAll('#tab-strip .tab-btn'));
    var backBtn = document.getElementById('back-btn');
    if (isProfilesPanel()) {
      focusables = [backBtn].concat(tabList);
    } else {
      focusables = [backBtn].concat(tabList).concat(getFlatPanelItems());
    }
    focusIndex = Math.max(0, Math.min(focusables.length - 1, focusIndex));
  }
  function clearFocusRing() {
    document.querySelectorAll('.tv-focus-visible').forEach(function (el) {
      el.classList.remove('tv-focus-visible');
    });
  }
  function applyFocus(idx) {
    clearFocusRing();
    focusIndex = Math.max(0, Math.min(focusables.length - 1, idx));
    var el = focusables[focusIndex];
    if (!el) return;
    el.classList.add('tv-focus-visible');
    el.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  }
  function applyProfileFocus() {
    clearFocusRing();
    var el;
    if (_col === 'sidebar') {
      var items = getSidebarItems();
      if (!items.length) {
        _col = 'editor';
        applyProfileFocus();
        return;
      }
      _sidebarIdx = Math.max(0, Math.min(items.length - 1, _sidebarIdx));
      el = items[_sidebarIdx];
    } else {
      var rows = getEditorRows();
      if (!rows.length) {
        _col = 'sidebar';
        applyProfileFocus();
        return;
      }
      _editorRowIdx = Math.max(0, Math.min(rows.length - 1, _editorRowIdx));
      var row = rows[_editorRowIdx];
      _editorColIdx = Math.max(0, Math.min(row.length - 1, _editorColIdx));
      el = row[_editorColIdx];
    }
    if (!el) return;
    el.classList.add('tv-focus-visible');
    el.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  }
  function openKeyboard(el) {
    el.focus();
  }

  /* ── Dropdowns on a D-pad ──────────────────────────────────────────────────
     A <select> is unusable with a remote here: arrow keys never reach it (the
     global handler preventDefaults them and routes to handleNavKey, which only
     exempts INPUT/TEXTAREA), and a programmatic .click() can't open the native
     popup anyway. Rather than fight that, the value is changed IN PLACE:
     LEFT/RIGHT step through the options and ENTER cycles. The popup is never
     opened, so this behaves identically on every webOS version.
     `wrap` is true for ENTER — with no other affordance it has to be able to
     get back to the first option — and false for arrows, where clamping at the
     ends is what you'd expect. */
  function stepSelect(el, dir, wrap) {
    var n = el.options.length;
    if (!n) return;
    var i = el.selectedIndex + dir;
    if (wrap) i = (i + n) % n;else i = Math.max(0, Math.min(n - 1, i));
    if (i === el.selectedIndex) return;
    el.selectedIndex = i;
    el.dispatchEvent(new Event('change'));
  }
  function isSelect(el) {
    return !!(el && el.tagName === 'SELECT');
  }
  function closeKeyboard() {
    var prev = document.activeElement;
    if (prev) prev.blur();
    requestAnimationFrame(function () {
      if (isProfilesPanel()) {
        applyProfileFocus();
      } else {
        applyFocus(focusIndex);
      }
    });
  }
  function isInputFocused() {
    var a = document.activeElement;
    return !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'));
  }
  function jumpToActiveTab() {
    _inProfileContent = false;
    clearFocusRing();
    var activeTab = tabList.find(function (b) {
      return b.classList.contains('active');
    }) || tabList[0];
    if (activeTab) {
      var idx = focusables.indexOf(activeTab);
      if (idx === -1) {
        rebuildFocusables();
        idx = focusables.indexOf(activeTab);
      }
      focusIndex = idx;
      activeTab.classList.add('tv-focus-visible');
      activeTab.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }
  function jumpIntoPanel() {
    if (isProfilesPanel()) {
      _inProfileContent = true;
      _col = 'sidebar';
      _sidebarIdx = 0;
      applyProfileFocus();
    } else {
      var firstItem = tabList.length + 1;
      if (firstItem < focusables.length) applyFocus(firstItem);
    }
  }
  function handleNavKey(kc) {
    if (kc === KEY.BACK) {
      stopRemoteSession();
      tvGoBack('../index.html');
      return;
    }
    if (isProfilesPanel() && _inProfileContent) {
      if (kc === KEY.UP) {
        if (_col === 'sidebar') {
          if (_sidebarIdx === 0) {
            jumpToActiveTab();
          } else {
            _sidebarIdx--;
            applyProfileFocus();
          }
        } else {
          if (_editorRowIdx === 0) {
            jumpToActiveTab();
          } else {
            _editorRowIdx--;
            var eRows = getEditorRows();
            _editorColIdx = Math.min(_editorColIdx, eRows[_editorRowIdx].length - 1);
            applyProfileFocus();
          }
        }
        return;
      }
      if (kc === KEY.DOWN) {
        if (_col === 'sidebar') {
          var sItems = getSidebarItems();
          if (_sidebarIdx < sItems.length - 1) {
            _sidebarIdx++;
            applyProfileFocus();
          }
        } else {
          var eRows = getEditorRows();
          if (_editorRowIdx < eRows.length - 1) {
            _editorRowIdx++;
            _editorColIdx = Math.min(_editorColIdx, eRows[_editorRowIdx].length - 1);
            applyProfileFocus();
          }
        }
        return;
      }
      if (kc === KEY.LEFT || kc === KEY.RIGHT) {
        var dir = kc === KEY.RIGHT ? 1 : -1;
        /* A focused dropdown consumes LEFT/RIGHT to change its value.
           UP/DOWN is still the way off the row, so nothing is trapped. */
        var focusedEl = _col === 'editor' ? (getEditorRows()[_editorRowIdx] || [])[_editorColIdx] : null;
        if (isSelect(focusedEl)) {
          stepSelect(focusedEl, dir, false);
          return;
        }
        if (kc === KEY.LEFT) {
          if (_col === 'editor') {
            if (_editorColIdx > 0) {
              _editorColIdx--;
              applyProfileFocus();
            } else {
              _col = 'sidebar';
              applyProfileFocus();
            }
          }
        } else {
          if (_col === 'sidebar') {
            if (getEditorRows().length > 0) {
              _col = 'editor';
              _editorColIdx = 0;
              applyProfileFocus();
            }
          } else {
            var curRow = getEditorRows()[_editorRowIdx] || [];
            if (_editorColIdx < curRow.length - 1) {
              _editorColIdx++;
              applyProfileFocus();
            }
          }
        }
        return;
      }
      if (kc === KEY.ENTER) {
        var el;
        if (_col === 'sidebar') {
          el = getSidebarItems()[_sidebarIdx];
        } else {
          var row = getEditorRows()[_editorRowIdx] || [];
          el = row[_editorColIdx];
        }
        if (!el) return;
        if (el.tagName === 'INPUT') {
          openKeyboard(el);
        } else if (isSelect(el)) {
          stepSelect(el, 1, true);
        } else {
          el.click();
        }
        return;
      }
      return;
    }
    var el = focusables[focusIndex];
    if (kc === KEY.UP) {
      if (tabList.indexOf(el) !== -1) {
        applyFocus(0);
      } else if (el === document.getElementById('back-btn')) {/* top */} else {
        var firstPanelIdx = tabList.length + 1;
        if (focusIndex === firstPanelIdx) {
          jumpToActiveTab();
        } else {
          applyFocus(focusIndex - 1);
        }
      }
      return;
    }
    if (kc === KEY.DOWN) {
      if (el === document.getElementById('back-btn')) {
        jumpToActiveTab();
      } else if (tabList.indexOf(el) !== -1) {
        jumpIntoPanel();
      } else {
        applyFocus(focusIndex + 1);
      }
      return;
    }
    if (kc === KEY.LEFT || kc === KEY.RIGHT) {
      var dir = kc === KEY.RIGHT ? 1 : -1;
      /* Dropdowns change value in place — see stepSelect(). */
      if (isSelect(el)) {
        stepSelect(el, dir, false);
        return;
      }
      if (tabList.indexOf(el) !== -1) {
        var ci = tabList.indexOf(el),
          next = ci + dir;
        if (next >= 0 && next < tabList.length) {
          tabList[next].click();
          rebuildFocusables();
          clearFocusRing();
          tabList[next].classList.add('tv-focus-visible');
          focusIndex = focusables.indexOf(tabList[next]);
        }
      } else if (el) {
        var frow = el.closest('.field-row');
        if (frow) {
          var fsiblings = Array.from(frow.querySelectorAll('input, select, button')).filter(function (n) {
            return focusables.indexOf(n) !== -1;
          });
          var fsi = fsiblings.indexOf(el),
            fsn = fsi + dir;
          if (fsn >= 0 && fsn < fsiblings.length) {
            applyFocus(focusables.indexOf(fsiblings[fsn]));
          }
        }
      }
      return;
    }
    if (kc === KEY.ENTER) {
      if (!el) return;
      if (el.tagName === 'INPUT') {
        openKeyboard(el);
      } else if (isSelect(el)) {
        stepSelect(el, 1, true);
      } else {
        el.click();
      }
      return;
    }
  }
  window.addEventListener('keydown', function (e) {
    var kc = e.keyCode || e.which;
    if (isInputFocused()) {
      var isArrow = kc === KEY.UP || kc === KEY.DOWN || kc === KEY.LEFT || kc === KEY.RIGHT;
      if (isArrow) {
        // Close the on-screen keyboard, then move to the adjacent field.
        e.preventDefault();
        e.stopImmediatePropagation();
        closeKeyboard();
        var _kc = kc;
        setTimeout(function () {
          handleNavKey(_kc);
        }, 50);
      } else if (kc === KEY.ENTER || kc === KEY.BACK) {
        // ENTER / BACK just dismiss the keyboard and keep focus on the
        // field (the ring is restored by closeKeyboard). Do NOT re-run
        // handleNavKey — that would immediately re-open the keyboard.
        e.preventDefault();
        e.stopImmediatePropagation();
        closeKeyboard();
      }
      return;
    }
    e.preventDefault();
    handleNavKey(kc);
  }, true);

  /* ── Utility ───────────────────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Boot ──────────────────────────────────────────────────────────────── */
  renderProfileList();
  renderEditor(); /* calls startRemoteSession() internally */
  var bootTab = load('iptv_last_tab', 'profiles');
  if (bootTab === 'm3u' || bootTab === 'remote') bootTab = 'profiles';
  _inProfileContent = bootTab === 'profiles';
  activateTab(bootTab);
  rebuildFocusables();
  if (_inProfileContent) {
    applyProfileFocus();
  } else {
    applyFocus(0);
  }
})();