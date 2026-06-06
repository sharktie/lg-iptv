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
                    setTimeout(function () { history.back(); }, 900);
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
        setTimeout(function () { history.back(); }, 900);
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
       Back button
       ───────────────────────────────────────────────────────────────────────── */
    document.getElementById('back-btn').addEventListener('click', function () { history.back(); });

    /* ─────────────────────────────────────────────────────────────────────────
       D-pad navigation
       ─────────────────────────────────────────────────────────────────────────
       Same architecture as before:
       - All navigation on keydown (fast)
       - Back handled on keyup (webOS keyboard dismiss timing)
       - Track _inputEl to distinguish "close keyboard" from "go back"
       ───────────────────────────────────────────────────────────────────────── */
    var KEY = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, BACK: 461 };

    var focusables = [];
    var focusIndex = 0;
    var tabList    = [];

    function rebuildFocusables() {
        var backBtn     = document.getElementById('back-btn');
        var activePanel = document.querySelector('.settings-panel.active');

        tabList = Array.from(document.querySelectorAll('#tab-strip .tab-btn'));

        var panelItems = [];
        if (activePanel) {
            /* For the profiles panel, collect in visual order:
               sidebar items → add-profile-btn → editor fields */
            if (activePanel.id === 'panel-profiles') {
                var sidebarItems = Array.from(document.querySelectorAll('#profiles-list .profile-item'));
                var addProfBtn   = document.getElementById('add-profile-btn');
                var formEl       = document.getElementById('editor-form');
                var editorItems  = formEl && !formEl.hidden
                    ? Array.from(formEl.querySelectorAll('input, select, button'))
                          .filter(function (el) { return !el.disabled; })
                    : [];
                panelItems = sidebarItems.concat([addProfBtn]).concat(editorItems);
            } else {
                panelItems = Array.from(activePanel.querySelectorAll('input, select, button'))
                    .filter(function (el) { return !el.disabled; });
            }
        }

        focusables = [backBtn].concat(tabList).concat(panelItems);
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
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* ── Back / keyboard tracking ──────────────────────────────────────────── */
    var _inputEl = null;

    function openKeyboard(el) {
        _inputEl = el;
        el.focus();
    }

    document.addEventListener('focusout', function (e) {
        var tag = e.target ? e.target.tagName : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            setTimeout(function () { _inputEl = null; }, 50);
        }
    });

    window.addEventListener('keydown', function (e) {
        var kc = e.keyCode || e.which;

        if (_inputEl) {
            if (kc !== KEY.BACK) return;
            e.preventDefault();
            return;
        }

        if (kc === KEY.BACK) { e.preventDefault(); return; }

        var el = focusables[focusIndex];

        if (kc === KEY.UP) {
            e.preventDefault();
            /* If we're at the top of the panel items, jump to the tab strip */
            var firstPanelItem = focusables[tabList.length + 1]; /* +1 for back-btn */
            if (el === firstPanelItem) {
                /* Find the active tab */
                var activeTab = tabList.find(function (b) { return b.classList.contains('active'); });
                var ati = focusables.indexOf(activeTab);
                if (ati !== -1) { applyFocus(ati); return; }
            }
            applyFocus(focusIndex - 1);
            return;
        }

        if (kc === KEY.DOWN) {
            e.preventDefault();
            /* If on a tab, jump into panel */
            if (tabList.indexOf(el) !== -1) {
                var firstPanel = focusables[tabList.length + 1];
                if (firstPanel) { applyFocus(focusables.indexOf(firstPanel)); return; }
            }
            applyFocus(focusIndex + 1);
            return;
        }

        if (kc === KEY.LEFT || kc === KEY.RIGHT) {
            e.preventDefault();
            var dir = kc === KEY.RIGHT ? 1 : -1;

            /* Navigate between tabs */
            if (tabList.indexOf(el) !== -1) {
                var ci   = tabList.indexOf(el);
                var next = ci + dir;
                if (next >= 0 && next < tabList.length) {
                    tabList[next].click();
                    rebuildFocusables();
                    applyFocus(focusables.indexOf(tabList[next]));
                }
                return;
            }

            /* Navigate within a field-row (username/password side-by-side) */
            if (el) {
                var row = el.closest('.field-row');
                if (row) {
                    var siblings = Array.from(row.querySelectorAll('input, select, button'))
                        .filter(function (n) { return focusables.indexOf(n) !== -1; });
                    var sc = siblings.indexOf(el);
                    var sn = sc + dir;
                    if (sn >= 0 && sn < siblings.length) {
                        applyFocus(focusables.indexOf(siblings[sn]));
                    }
                }
            }
            return;
        }

        if (kc === KEY.ENTER) {
            e.preventDefault();
            if (!el) return;
            if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
                openKeyboard(el);
            } else {
                el.click();
            }
            return;
        }
    });

    window.addEventListener('keyup', function (e) {
        var kc = e.keyCode || e.which;
        if (kc !== KEY.BACK) return;
        e.preventDefault();
        if (_inputEl) {
            _inputEl = null;
            applyFocus(focusIndex);
        } else {
            history.back();
        }
    });

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
    activateTab(load('iptv_last_tab', 'profiles'));
    rebuildFocusables();
    applyFocus(0);

}());
