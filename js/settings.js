/* settings.js — IPTV Settings (WebOS-compatible) */

(function () {
    'use strict';

    /* ─────────────────────────────────────────────────────────────────────────
       Storage helpers
       ───────────────────────────────────────────────────────────────────────── */
    function load(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    }
    function save(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }

    /* ─────────────────────────────────────────────────────────────────────────
       Status helper
       ───────────────────────────────────────────────────────────────────────── */
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

    /* ─────────────────────────────────────────────────────────────────────────
       Profile data model
       ─────────────────────────────────────────────────────────────────────────
       Stored as:
         iptv_profiles      → Array<Profile>
         iptv_active_profile → string (profile id)

       Profile shape:
         { id, name, username, password, server_urls: string[],
           epg_url, epg_match, playlist_url (M3U) }
       ───────────────────────────────────────────────────────────────────────── */
    function makeId() {
        return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function loadProfiles() {
        var profiles = load('iptv_profiles', null);

        /* ── Migrate from old single-profile config ────────────────────────── */
        if (!profiles) {
            profiles = [];
            var old = load('iptv_custom_config', null) || (typeof IPTV_CONFIG !== 'undefined' ? IPTV_CONFIG : null);
            if (old && old.server_url) {
                profiles.push({
                    id:           makeId(),
                    name:         'Default',
                    username:     old.username     || '',
                    password:     old.password     || '',
                    server_urls:  [old.server_url],
                    epg_url:      load('iptv_custom_epg_url',   ''),
                    epg_match:    load('iptv_custom_epg_match', 'tvg-id'),
                    playlist_url: '',
                });
            }
            save('iptv_profiles', profiles);
        }
        return profiles;
    }

    function saveProfiles(profiles) {
        save('iptv_profiles', profiles);
    }

    function getActiveId() {
        return load('iptv_active_profile', null);
    }
    function setActiveId(id) {
        save('iptv_active_profile', id);
    }

    /* ─────────────────────────────────────────────────────────────────────────
       State
       ───────────────────────────────────────────────────────────────────────── */
    var profiles   = loadProfiles();
    var activeId   = getActiveId();
    var selectedId = null; /* profile currently open in editor */

    /* Auto-select: open the last-active profile if it exists */
    (function autoSelect() {
        if (activeId && profiles.some(function (p) { return p.id === activeId; })) {
            selectedId = activeId;
        } else if (profiles.length > 0) {
            selectedId = profiles[0].id;
        }
    }());

    /* ─────────────────────────────────────────────────────────────────────────
       Tab switching
       ───────────────────────────────────────────────────────────────────────── */
    var tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
    var panels  = Array.from(document.querySelectorAll('.settings-panel'));

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
        /* When switching away from profiles, the flat-panel handler takes over */
        if (value !== 'profiles') _inProfileContent = false;
        rebuildFocusables();
    }

    tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () { activateTab(btn.dataset.value); });
    });

    /* ─────────────────────────────────────────────────────────────────────────
       Profile list rendering
       ───────────────────────────────────────────────────────────────────────── */
    function renderProfileList() {
        var list = document.getElementById('profiles-list');
        list.innerHTML = '';

        profiles.forEach(function (profile) {
            var btn = document.createElement('button');
            btn.className = 'profile-item';
            btn.setAttribute('role', 'option');
            btn.dataset.profileId = profile.id;
            if (profile.id === selectedId)  btn.classList.add('selected');
            if (profile.id === activeId)    btn.classList.add('is-active');

            btn.innerHTML =
                '<span class="profile-tick">' +
                    '<svg width="12" height="10" viewBox="0 0 12 10" fill="none">' +
                        '<path d="M1 5l3.5 3.5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
                    '</svg>' +
                '</span>' +
                '<span class="profile-item-name">' + escHtml(profile.name || 'Unnamed') + '</span>';

            btn.addEventListener('click', function () {
                selectedId = profile.id;
                renderProfileList();
                renderEditor();
                rebuildFocusables();
            });

            list.appendChild(btn);
        });
    }

    /* ─────────────────────────────────────────────────────────────────────────
       Editor rendering
       ───────────────────────────────────────────────────────────────────────── */
    function renderEditor() {
        var emptyEl = document.getElementById('editor-empty');
        var formEl  = document.getElementById('editor-form');
        var profile = profiles.find(function (p) { return p.id === selectedId; });

        if (!profile) {
            emptyEl.style.display = '';
            formEl.hidden = true;
            return;
        }

        emptyEl.style.display = 'none';
        formEl.hidden = false;

        document.getElementById('prof-name').value      = profile.name        || '';
        document.getElementById('prof-username').value  = profile.username    || '';
        document.getElementById('prof-password').value  = profile.password    || '';
        document.getElementById('prof-epg-url').value   = profile.epg_url     || '';
        document.getElementById('prof-epg-match').value = profile.epg_match   || 'tvg-id';

        renderUrlList(profile.server_urls || []);
    }

    function renderUrlList(urls) {
        var list = document.getElementById('url-list');
        list.innerHTML = '';

        /* Always show at least one empty row */
        var rows = urls.length > 0 ? urls.slice() : [''];

        rows.forEach(function (url, i) {
            var row = document.createElement('div');
            row.className = 'url-row';

            var idx = document.createElement('span');
            idx.className = 'url-index';
            idx.textContent = (i + 1) + '.';

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
        return Array.from(document.querySelectorAll('#url-list .url-row input'))
            .map(function (el) { return el.value.trim().replace(/\/+$/, ''); })
            .filter(function (v) { return v !== ''; });
    }

    function removeUrlRow(index) {
        var profile = profiles.find(function (p) { return p.id === selectedId; });
        if (!profile) return;
        var urls = getUrlsFromList(); /* read current UI state first */
        urls.splice(index, 1);
        renderUrlList(urls);
        rebuildFocusables();
    }

    document.getElementById('add-url-btn').addEventListener('click', function () {
        var currentUrls = getUrlsFromList();
        currentUrls.push('');
        renderUrlList(currentUrls);
        /* Focus the new input */
        var inputs = document.querySelectorAll('#url-list .url-row input');
        var last = inputs[inputs.length - 1];
        if (last) {
            rebuildFocusables();
            var idx = focusables.indexOf(last);
            if (idx !== -1) applyFocus(idx);
        }
    });

    /* ─────────────────────────────────────────────────────────────────────────
       Add profile
       ───────────────────────────────────────────────────────────────────────── */
    document.getElementById('add-profile-btn').addEventListener('click', function () {
        var profile = {
            id:          makeId(),
            name:        'New Profile',
            username:    '',
            password:    '',
            server_urls: [''],
            epg_url:     '',
            epg_match:   'tvg-id',
            playlist_url: '',
        };
        profiles.push(profile);
        saveProfiles(profiles);
        selectedId = profile.id;
        renderProfileList();
        renderEditor();
        rebuildFocusables();
        /* Focus the name field */
        var nameEl = document.getElementById('prof-name');
        var ni = focusables.indexOf(nameEl);
        if (ni !== -1) applyFocus(ni);
    });

    /* ─────────────────────────────────────────────────────────────────────────
       Delete profile
       ───────────────────────────────────────────────────────────────────────── */
    document.getElementById('delete-profile-btn').addEventListener('click', function () {
        var profile = profiles.find(function (p) { return p.id === selectedId; });
        if (!profile) return;

        /* Simple confirm — no native confirm on webOS, so we repurpose the
           status line as a two-step: first press warns, second press deletes */
        var statusEl = document.getElementById('profile-status');
        if (statusEl.dataset.pendingDelete === '1') {
            /* Confirmed — delete */
            profiles = profiles.filter(function (p) { return p.id !== selectedId; });
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
            /* First press — ask for confirmation */
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

    /* ─────────────────────────────────────────────────────────────────────────
       Save & Connect
       ───────────────────────────────────────────────────────────────────────── */
    document.getElementById('save-profile-btn').addEventListener('click', function () {
        var profile = profiles.find(function (p) { return p.id === selectedId; });
        if (!profile) return;

        /* Read form */
        var name     = document.getElementById('prof-name').value.trim();
        var username = document.getElementById('prof-username').value.trim();
        var password = document.getElementById('prof-password').value.trim();
        var urls     = getUrlsFromList();
        var epgUrl   = document.getElementById('prof-epg-url').value.trim();
        var epgMatch = document.getElementById('prof-epg-match').value;

        if (!name) {
            setStatus('profile-status', 'Please enter a profile name.', 'err'); return;
        }
        if (!username || !password) {
            setStatus('profile-status', 'Username and password are required.', 'err'); return;
        }
        if (urls.length === 0) {
            setStatus('profile-status', 'Add at least one server URL.', 'err'); return;
        }

        /* Persist the updated fields */
        profile.name        = name;
        profile.username    = username;
        profile.password    = password;
        profile.server_urls = urls;
        profile.epg_url     = epgUrl;
        profile.epg_match   = epgMatch;
        saveProfiles(profiles);
        renderProfileList(); /* update name display in sidebar */

        /* Verify xtreamLogin is actually available */
        if (typeof xtreamLogin !== 'function') {
            setStatus('profile-status', 'Error: xtream.js not loaded.', 'err');
            return;
        }

        setStatus('profile-status', 'Connecting (0/' + urls.length + ')…', '');

        /* Try each URL in order — inline so we can update status per attempt */
        (function tryUrls(index) {
            if (index >= urls.length) {
                setStatus('profile-status', 'Could not connect to any server URL.', 'err');
                return;
            }
            var url = urls[index];
            setStatus('profile-status', 'Trying ' + (index + 1) + '/' + urls.length + '…', '');

            var loginUrl = url + '/player_api.php?username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password);
            var ctrl = new AbortController();
            var tid  = setTimeout(function () { ctrl.abort(); }, 8000);

            fetch(loginUrl, { signal: ctrl.signal })
                .then(function (r) {
                    clearTimeout(tid);
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(function (data) {
                    if (!data) throw new Error('Empty response');

                    /* Success — store resolved config */
                    activeId = profile.id;
                    setActiveId(activeId);
                    save('iptv_active_resolved_url', url);
                    if (typeof IPTV_CONFIG !== 'undefined') {
                        IPTV_CONFIG.server_url = url;
                        IPTV_CONFIG.username   = username;
                        IPTV_CONFIG.password   = password;
                    }
                    try {
                        localStorage.removeItem('iptv_ch_v2');
                        localStorage.removeItem('iptv_cat_v2');
                    } catch (e) {}

                    renderProfileList();
                    setStatus('profile-status', 'Connected — returning…', 'ok');
                    setTimeout(function () { tvGoBack('../index.html'); }, 900);
                })
                .catch(function (err) {
                    clearTimeout(tid);
                    /* Try next URL */
                    tryUrls(index + 1);
                });
        }(0));
    });

    /* ─────────────────────────────────────────────────────────────────────────
       M3U panel
       ───────────────────────────────────────────────────────────────────────── */
    (function populateM3U() {
        var m3u = load('iptv_m3u_config', null) || (typeof IPTV_M3U_CONFIG !== 'undefined' ? IPTV_M3U_CONFIG : {});
        document.getElementById('cfg-m3u-url').value = m3u.playlist_url || '';
    }());

    document.getElementById('cfg-m3u-save-btn').addEventListener('click', function () {
        var url = document.getElementById('cfg-m3u-url').value.trim();
        if (!url) { setStatus('cfg-m3u-status', 'Please enter a playlist URL.', 'err'); return; }
        save('iptv_m3u_config', { playlist_url: url });
        save('iptv_source_type', 'm3u');
        try { localStorage.removeItem('iptv_m3u_cache'); } catch (e) {}
        if (typeof IPTV_M3U_CONFIG !== 'undefined') IPTV_M3U_CONFIG = { playlist_url: url };
        setStatus('cfg-m3u-status', 'Saved — returning to Live TV…', 'ok');
        setTimeout(function () { tvGoBack('../index.html'); }, 900);
    });

    /* ─────────────────────────────────────────────────────────────────────────
       EPG panel (global fallback)
       ───────────────────────────────────────────────────────────────────────── */
    (function populateEPG() {
        document.getElementById('cfg-epg-url').value   = load('iptv_custom_epg_url',   '');
        document.getElementById('cfg-epg-match').value = load('iptv_custom_epg_match', 'tvg-id');
    }());

    document.getElementById('cfg-epg-load-btn').addEventListener('click', function () {
        var url   = document.getElementById('cfg-epg-url').value.trim();
        var match = document.getElementById('cfg-epg-match').value;
        if (!url) { setStatus('epg-load-status', 'Enter an XMLTV URL first.', 'err'); return; }
        save('iptv_custom_epg_url', url);
        save('iptv_custom_epg_match', match);
        setStatus('epg-load-status', 'EPG settings saved.', 'ok', 3000);
    });

    /* ─────────────────────────────────────────────────────────────────────────
       Cache panel
       ───────────────────────────────────────────────────────────────────────── */
    document.getElementById('cfg-clear-cache-btn').addEventListener('click', function () {
        try { localStorage.removeItem('iptv_ch_v2'); localStorage.removeItem('iptv_cat_v2'); } catch (e) {}
        setStatus('cfg-clear-ch-status', 'Channel cache cleared.', 'ok', 3000);
    });

    document.getElementById('cfg-clear-epg-btn').addEventListener('click', function () {
        try { localStorage.removeItem('iptv_epg_v2'); localStorage.removeItem('iptv_xmltv_cache'); } catch (e) {}
        setStatus('cfg-clear-epg-status', 'EPG cache cleared.', 'ok', 3000);
    });

    /* ─────────────────────────────────────────────────────────────────────────
       Back / navigation helper
       tvGoBack is defined in dpad.js on the main page; define it here as a
       fallback so the settings page works even without dpad.js loaded.
       ───────────────────────────────────────────────────────────────────────── */
    if (typeof tvGoBack !== 'function') {
        window.tvGoBack = function (backUrl) {
            if (backUrl) { window.location.href = backUrl; }
            else if (typeof webOS !== 'undefined') { webOS.platformBack(); }
        };
    }
    document.getElementById('back-btn').addEventListener('click', function () { tvGoBack('../index.html'); });

    /* ─────────────────────────────────────────────────────────────────────────
       D-pad navigation
       ─────────────────────────────────────────────────────────────────────────
       Layout model:
         Row 0  : back-btn
         Row 1  : tab strip (LEFT/RIGHT navigates between tabs)
         Row 2+ : panel content

       Profiles panel is two-column:
         Left column  — profile-items + add-profile-btn  (sidebar)
         Right column — editor fields + buttons

       LEFT/RIGHT on the profiles panel crosses between columns.
       UP from the top of either column jumps to the tab strip.

       Keyboard / Back timing:
         - ENTER on an INPUT opens the on-screen keyboard (calls el.focus()).
         - isInputFocused() is checked on every keydown to detect this state.
         - All d-pad/Back keys while an input is focused close the keyboard first.
         - Character keys pass through to the input as normal.
       ───────────────────────────────────────────────────────────────────────── */
    var KEY = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, BACK: 461 };

    /* ── Focus state ──────────────────────────────────────────────────────── */
    var focusables  = [];   /* flat list used for non-profile panels          */
    var focusIndex  = 0;
    var tabList     = [];

    /* Profiles panel state */
    var _col          = 'sidebar'; /* 'sidebar' | 'editor' */
    var _sidebarIdx   = 0;
    var _editorRowIdx = 0;   /* which visual row in the editor */
    var _editorColIdx = 0;   /* which item within that row (for .field-row) */
    /* When true, dpad focus is inside the profiles panel content.
       When false, focus has floated up to the tab strip / back-btn zone. */
    var _inProfileContent = false;

    /* No keyboard-open flag needed — we check document.activeElement directly.
       This avoids all timing races with the webOS on-screen keyboard. */

    /* ── Focusable lists ──────────────────────────────────────────────────── */
    function getSidebarItems() {
        return Array.from(document.querySelectorAll('#profiles-list .profile-item'))
            .concat([document.getElementById('add-profile-btn')]);
    }

    // Returns the editor as an array of rows, where each row is an array of
    // one or more focusable elements that sit side-by-side visually.
    // Up/Down moves between rows; Left/Right moves within a row.
    //
    // Special grouping rules (in addition to .field-row):
    //   #editor-header  → [prof-name input,  delete-profile-btn]  (name ←→ Delete)
    //   .url-row        → [url input,         url-remove-btn]      (url  ←→ ×)
    function getEditorRows() {
        var formEl = document.getElementById('editor-form');
        if (!formEl || formEl.hidden) return [];
        var rows = [];
        var seen = [];
        function visible(el) { return !el.disabled && el.offsetParent !== null; }
        var all = Array.from(formEl.querySelectorAll('input, select, button')).filter(visible);
        all.forEach(function (el) {
            if (seen.indexOf(el) !== -1) return;

            // #editor-header: prof-name + delete-profile-btn are side-by-side
            var editorHeader = el.closest('#editor-header');
            if (editorHeader) {
                var siblings = Array.from(editorHeader.querySelectorAll('input, select, button')).filter(visible);
                siblings.forEach(function (s) { seen.push(s); });
                rows.push(siblings);
                return;
            }

            // .url-row: url input + × remove button are side-by-side
            var urlRow = el.closest('.url-row');
            if (urlRow) {
                var siblings = Array.from(urlRow.querySelectorAll('input, select, button')).filter(visible);
                siblings.forEach(function (s) { seen.push(s); });
                rows.push(siblings);
                return;
            }

            // .field-row: e.g. username / password pair
            var fieldRow = el.closest('.field-row');
            if (fieldRow) {
                var siblings = Array.from(fieldRow.querySelectorAll('input, select, button')).filter(visible);
                siblings.forEach(function (s) { seen.push(s); });
                rows.push(siblings);
                return;
            }

            seen.push(el);
            rows.push([el]);
        });
        return rows;
    }

    // Flat list for any code that still needs it.
    function getEditorItems() {
        return getEditorRows().reduce(function (a, r) { return a.concat(r); }, []);
    }

    function getFlatPanelItems() {
        /* For non-profile panels: all interactive elements in the active panel */
        var activePanel = document.querySelector('.settings-panel.active');
        if (!activePanel) return [];
        return Array.from(activePanel.querySelectorAll('input, select, button'))
            .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    }

    function isProfilesPanel() {
        var p = document.querySelector('.settings-panel.active');
        return p && p.id === 'panel-profiles';
    }

    function rebuildFocusables() {
        tabList = Array.from(document.querySelectorAll('#tab-strip .tab-btn'));
        var backBtn = document.getElementById('back-btn');

        if (isProfilesPanel()) {
            /* Profiles panel: focusables covers back-btn + tabs only.
               Panel content is handled separately via _col/_sidebarIdx/_editorRowIdx. */
            focusables = [backBtn].concat(tabList);
        } else {
            focusables = [backBtn].concat(tabList).concat(getFlatPanelItems());
        }
        focusIndex = Math.max(0, Math.min(focusables.length - 1, focusIndex));
    }

    /* ── Focus ring helpers ───────────────────────────────────────────────── */
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
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* Apply focus within the profiles panel columns */
    function applyProfileFocus() {
        clearFocusRing();
        var el;
        if (_col === 'sidebar') {
            var items = getSidebarItems();
            if (!items.length) { _col = 'editor'; applyProfileFocus(); return; }
            _sidebarIdx = Math.max(0, Math.min(items.length - 1, _sidebarIdx));
            el = items[_sidebarIdx];
        } else {
            var rows = getEditorRows();
            if (!rows.length) { _col = 'sidebar'; applyProfileFocus(); return; }
            _editorRowIdx = Math.max(0, Math.min(rows.length - 1, _editorRowIdx));
            var row = rows[_editorRowIdx];
            _editorColIdx = Math.max(0, Math.min(row.length - 1, _editorColIdx));
            el = row[_editorColIdx];
        }
        if (!el) return;
        el.classList.add('tv-focus-visible');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* ── Keyboard open/close ─────────────────────────────────────────────── */
    // openKeyboard: give real browser focus to an input → triggers webOS on-screen keyboard.
    function openKeyboard(el) {
        el.focus();
    }

    // closeKeyboard: blur whatever input is focused → dismisses on-screen keyboard.
    // Wrapped in requestAnimationFrame so webOS has time to process the dismiss
    // before we re-apply the d-pad focus ring.
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

    // isInputFocused: true when a text input has real browser focus.
    function isInputFocused() {
        var a = document.activeElement;
        return !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'));
    }

    /* ── Tab navigation helpers ───────────────────────────────────────────── */
    function jumpToActiveTab() {
        _inProfileContent = false;
        clearFocusRing();
        var activeTab = tabList.find(function (b) { return b.classList.contains('active'); })
                     || tabList[0];
        if (activeTab) {
            var idx = focusables.indexOf(activeTab);
            if (idx === -1) { rebuildFocusables(); idx = focusables.indexOf(activeTab); }
            focusIndex = idx;
            activeTab.classList.add('tv-focus-visible');
            activeTab.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    function jumpIntoPanel() {
        if (isProfilesPanel()) {
            _inProfileContent = true;
            _col = 'sidebar';
            _sidebarIdx = 0;
            applyProfileFocus();
        } else {
            /* First panel item is at index tabList.length + 1 (after back-btn) */
            var firstItem = tabList.length + 1;
            if (firstItem < focusables.length) applyFocus(firstItem);
        }
    }

    /* ── Navigation handler ──────────────────────────────────────────────── */
    /* Called directly from keydown, and also from setTimeout after closeKeyboard
       so blur has time to complete before we move the focus ring. */
    function handleNavKey(kc) {

        /* Back — go back to homepage */
        if (kc === KEY.BACK) {
            tvGoBack('../index.html');
            return;
        }

        /* ── Profiles panel ─────────────────────────────────────────────── */
        if (isProfilesPanel() && _inProfileContent) {

            if (kc === KEY.UP) {
                if (_col === 'sidebar') {
                    if (_sidebarIdx === 0) { jumpToActiveTab(); }
                    else { _sidebarIdx--; applyProfileFocus(); }
                } else {
                    if (_editorRowIdx === 0) { jumpToActiveTab(); }
                    else {
                        _editorRowIdx--;
                        // Preserve column position (input vs × button) across rows.
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
                    if (_sidebarIdx < sItems.length - 1) { _sidebarIdx++; applyProfileFocus(); }
                } else {
                    var eRows = getEditorRows();
                    if (_editorRowIdx < eRows.length - 1) {
                        _editorRowIdx++;
                        // Clamp col index to the new row's width — preserves which
                        // column (input vs × button) the user was in.
                        _editorColIdx = Math.min(_editorColIdx, eRows[_editorRowIdx].length - 1);
                        applyProfileFocus();
                    }
                }
                return;
            }

            if (kc === KEY.LEFT) {
                if (_col === 'editor') {
                    if (_editorColIdx > 0) {
                        /* Move left within a side-by-side row (e.g. username → password) */
                        _editorColIdx--;
                        applyProfileFocus();
                    } else {
                        /* At leftmost item — cross to sidebar */
                        _col = 'sidebar';
                        applyProfileFocus();
                    }
                }
                return;
            }

            if (kc === KEY.RIGHT) {
                if (_col === 'sidebar') {
                    if (getEditorRows().length > 0) { _col = 'editor'; _editorColIdx = 0; applyProfileFocus(); }
                } else {
                    var curRow = getEditorRows()[_editorRowIdx] || [];
                    if (_editorColIdx < curRow.length - 1) {
                        /* Move right within a side-by-side row (e.g. username → password) */
                        _editorColIdx++;
                        applyProfileFocus();
                    }
                }
                return;
            }

            if (kc === KEY.ENTER) {
                var el;
                if (_col === 'sidebar') {
                    el = getSidebarItems()[_sidebarIdx];
                } else {
                    var row = (getEditorRows()[_editorRowIdx] || []);
                    el = row[_editorColIdx];
                }
                if (!el) return;
                if (el.tagName === 'INPUT') { openKeyboard(el); }
                else { el.click(); }
                return;
            }

            return;
        }

        /* ── Tab strip / flat panel navigation ──────────────────────────── */
        var el = focusables[focusIndex];

        if (kc === KEY.UP) {
            if (tabList.indexOf(el) !== -1) {
                applyFocus(0);
            } else if (el === document.getElementById('back-btn')) {
                /* already at top */
            } else {
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

            if (tabList.indexOf(el) !== -1) {
                var ci   = tabList.indexOf(el);
                var next = ci + dir;
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
                    var fsiblings = Array.from(frow.querySelectorAll('input, select, button'))
                        .filter(function (n) { return focusables.indexOf(n) !== -1; });
                    var fsi  = fsiblings.indexOf(el);
                    var fsn  = fsi + dir;
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
            } else {
                el.click();
            }
            return;
        }
    }

    /* ── keydown ─────────────────────────────────────────────────────────── */
    window.addEventListener('keydown', function (e) {
        var kc = e.keyCode || e.which;

        /* If a text input has real browser focus (on-screen keyboard is open),
           any d-pad or back key should close the keyboard first.
           Character keys pass through so the user can keep typing. */
        if (isInputFocused()) {
            var isNavKey = kc === KEY.UP || kc === KEY.DOWN ||
                           kc === KEY.LEFT || kc === KEY.RIGHT ||
                           kc === KEY.BACK || kc === KEY.ENTER;
            if (isNavKey) {
                e.preventDefault();
                e.stopImmediatePropagation();
                closeKeyboard();
                /* Back just closes the keyboard — don't navigate away */
                if (kc !== KEY.BACK) {
                    /* Wait for blur to settle before running navigation */
                    var _kc = kc;
                    setTimeout(function () { handleNavKey(_kc); }, 50);
                }
            }
            /* All other keys (letters, numbers) pass through to the input */
            return;
        }

        /* Normal d-pad navigation */
        e.preventDefault();
        handleNavKey(kc);

    }, true); /* capture=true — runs before any other listeners */

    /* ─────────────────────────────────────────────────────────────────────────
       Utility
       ───────────────────────────────────────────────────────────────────────── */
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ─────────────────────────────────────────────────────────────────────────
       Boot
       ───────────────────────────────────────────────────────────────────────── */
    renderProfileList();
    renderEditor();
    var bootTab = load('iptv_last_tab', 'profiles');
    _inProfileContent = (bootTab === 'profiles');
    activateTab(bootTab);
    rebuildFocusables();
    if (_inProfileContent) { applyProfileFocus(); } else { applyFocus(0); }

}());
