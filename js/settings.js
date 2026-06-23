/* settings.js — IPTV Settings */

(function () {
    'use strict';

    /* ── Storage helpers ───────────────────────────────────────────────────── */
    function load(key, fallback) {
        try {
            var v = localStorage.getItem(key);
            return v !== null ? JSON.parse(v) : fallback;
        } catch (e) { return fallback; }
    }
    function save(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
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
                    id: makeId(), name: 'Default', type: 'xtream',
                    username: old.username || '', password: old.password || '',
                    server_urls: [old.server_url], playlist_url: '',
                    epg_url: load('iptv_custom_epg_url', ''),
                    epg_match: load('iptv_custom_epg_match', 'tvg-id')
                });
            }
            var oldM3u = load('iptv_m3u_config', null);
            if (oldM3u && oldM3u.playlist_url) {
                profiles.push({
                    id: makeId(), name: 'M3U Playlist', type: 'm3u',
                    username: '', password: '', server_urls: [],
                    playlist_url: oldM3u.playlist_url, epg_url: '', epg_match: 'tvg-id'
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

    function saveProfiles(arr) { save('iptv_profiles', arr); }
    function getActiveId()     { return load('iptv_active_profile', null); }
    function setActiveId(id)   { save('iptv_active_profile', id); }

    /* ── State ─────────────────────────────────────────────────────────────── */
    var profiles   = loadProfiles();
    var activeId   = getActiveId();
    var selectedId = null;

    (function autoSelect() {
        if (activeId && profiles.some(function (p) { return p.id === activeId; })) {
            selectedId = activeId;
        } else if (profiles.length > 0) {
            selectedId = profiles[0].id;
        }
    }());

    /* ── Tab switching ─────────────────────────────────────────────────────── */
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
        if (value !== 'profiles') _inProfileContent = false;
        if (value === 'livetv')  renderLiveTvCats();
        if (value === 'vod')     renderVodCats();
        rebuildFocusables();
    }

    tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () { activateTab(btn.dataset.value); });
    });

    /* ── Profile type toggle ───────────────────────────────────────────────── */
    function getCurrentEditorType() {
        var xtreamBtn = document.getElementById('type-xtream-btn');
        return (xtreamBtn && xtreamBtn.classList.contains('type-active')) ? 'xtream' : 'm3u';
    }

    function setEditorType(type) {
        var xtreamBtn  = document.getElementById('type-xtream-btn');
        var m3uBtn     = document.getElementById('type-m3u-btn');
        var xtreamSect = document.getElementById('xtream-fields');
        var m3uSect    = document.getElementById('m3u-fields');
        if (!xtreamBtn) return;
        xtreamBtn.classList.toggle('type-active', type === 'xtream');
        m3uBtn.classList.toggle('type-active',    type === 'm3u');
        xtreamSect.style.display = type === 'xtream' ? '' : 'none';
        m3uSect.style.display    = type === 'm3u'    ? '' : 'none';
        rebuildFocusables();
    }

    document.getElementById('type-xtream-btn').addEventListener('click', function () { setEditorType('xtream'); });
    document.getElementById('type-m3u-btn').addEventListener('click',    function () { setEditorType('m3u'); });

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
            if (profile.id === activeId)   btn.classList.add('is-active');
            var typeLabel = profile.type === 'm3u' ? 'M3U' : 'Xtream';
            btn.innerHTML =
                '<span class="profile-tick">' +
                    '<svg width="12" height="10" viewBox="0 0 12 10" fill="none">' +
                        '<path d="M1 5l3.5 3.5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
                    '</svg>' +
                '</span>' +
                '<span class="profile-item-name">' + escHtml(profile.name || 'Unnamed') + '</span>' +
                '<span class="profile-type-badge">' + typeLabel + '</span>' +
                (profile.id === activeId ? '<span class="profile-active-dot"></span>' : '');
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
        var emptyEl    = document.getElementById('editor-empty');
        var formEl     = document.getElementById('editor-form');
        var sidebarAdd = document.getElementById('add-profile-btn');
        /* With no profiles, the centered CTA in the empty state is the only
           "+ New Profile" button — hide the sidebar one to avoid duplication. */
        if (sidebarAdd) sidebarAdd.style.display = profiles.length === 0 ? 'none' : '';
        var profile = profiles.find(function (p) { return p.id === selectedId; });
        if (!profile) {
            emptyEl.style.display = '';
            formEl.hidden = true;
            startRemoteSession();   /* still offer remote setup with no profiles */
            return;
        }
        emptyEl.style.display = 'none';
        formEl.hidden = false;
        document.getElementById('prof-name').value      = profile.name        || '';
        document.getElementById('prof-username').value  = profile.username    || '';
        document.getElementById('prof-password').value  = profile.password    || '';
        document.getElementById('prof-m3u-url').value   = profile.playlist_url || '';
        document.getElementById('prof-epg-url').value   = profile.epg_url     || '';
        document.getElementById('prof-epg-match').value = profile.epg_match   || 'tvg-id';
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
            removeBtn.addEventListener('click', function () { removeUrlRow(i); });
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
            id: makeId(), name: 'New Profile', type: 'xtream',
            username: '', password: '', server_urls: [], playlist_url: '',
            epg_url: '', epg_match: 'tvg-id'
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
        var profile = profiles.find(function (p) { return p.id === selectedId; });
        if (!profile) return;
        var statusEl = document.getElementById('profile-status');
        if (statusEl.dataset.pendingDelete === '1') {
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
        var profile = profiles.find(function (p) { return p.id === selectedId; });
        if (!profile) return;
        var name     = document.getElementById('prof-name').value.trim();
        var type     = getCurrentEditorType();
        var epgUrl   = document.getElementById('prof-epg-url').value.trim();
        var epgMatch = document.getElementById('prof-epg-match').value;
        if (!name) { setStatus('profile-status', 'Please enter a profile name.', 'err'); return; }

        if (type === 'm3u') {
            var playlistUrl = document.getElementById('prof-m3u-url').value.trim();
            if (!playlistUrl) { setStatus('profile-status', 'Please enter a playlist URL.', 'err'); return; }
            profile.name = name; profile.type = 'm3u'; profile.playlist_url = playlistUrl;
            profile.epg_url = epgUrl; profile.epg_match = epgMatch;
            saveProfiles(profiles);
            activeId = profile.id; setActiveId(activeId);
            save('iptv_source_type', 'm3u');
            save('iptv_m3u_config', { playlist_url: playlistUrl });
            try { localStorage.removeItem('iptv_m3u_v1'); } catch (e) {}
            renderProfileList();
            setStatus('profile-status', 'Saved — returning…', 'ok');
            setTimeout(function () { tvGoBack('../index.html'); }, 900);
            return;
        }

        var username = document.getElementById('prof-username').value.trim();
        var password = document.getElementById('prof-password').value.trim();
        var urls     = getUrlsFromList();
        if (!username || !password) { setStatus('profile-status', 'Username and password are required.', 'err'); return; }
        if (urls.length === 0) { setStatus('profile-status', 'Add at least one server URL.', 'err'); return; }
        profile.name = name; profile.type = 'xtream'; profile.username = username;
        profile.password = password; profile.server_urls = urls;
        profile.epg_url = epgUrl; profile.epg_match = epgMatch;
        saveProfiles(profiles);
        renderProfileList();
        setStatus('profile-status', 'Connecting…', '');

        /* Outcome tracking so we can tell a dead URL apart from bad credentials.
           Xtream returns HTTP 200 + { user_info: { auth: 0 } } for a wrong
           login (server is fine), versus a network/HTTP error for a bad URL. */
        var reachedButAuthFailed = false;   // got a valid auth:0 from some server
        var accountIssue         = null;    // auth ok but Expired/Banned/Disabled

        function connectSuccess(url) {
            activeId = profile.id; setActiveId(activeId);
            save('iptv_source_type', 'xtream');
            save('iptv_active_resolved_url', url);
            try { localStorage.removeItem('iptv_ch_v2'); } catch (e) {}
            try { localStorage.removeItem('iptv_cat_v2'); } catch (e) {}
            renderProfileList();
            setStatus('profile-status', 'Connected — returning…', 'ok');
            setTimeout(function () { tvGoBack('../index.html'); }, 900);
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

        (function tryUrls(index) {
            if (index >= urls.length) { reportFailure(); return; }
            var url = urls[index];
            setStatus('profile-status', 'Trying ' + (index + 1) + '/' + urls.length + '…', '');
            var loginUrl = url + '/player_api.php?username=' +
                encodeURIComponent(username) + '&password=' + encodeURIComponent(password);
            var ctrl = new AbortController();
            var tid  = setTimeout(function () { ctrl.abort(); }, 8000);
            fetch(loginUrl, { signal: ctrl.signal })
                .then(function (r) { clearTimeout(tid); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(function (data) {
                    var ui = data && data.user_info;
                    if (ui && Number(ui.auth) === 1) {
                        var status = String(ui.status || 'Active');
                        if (/expired|banned|disabled/i.test(status)) {
                            accountIssue = status;     // creds fine, account not usable
                            reportFailure();
                            return;
                        }
                        connectSuccess(url);
                        return;
                    }
                    // Server responded with an explicit failed login → creds wrong
                    if (ui && Number(ui.auth) === 0) reachedButAuthFailed = true;
                    // Otherwise the response wasn't a valid Xtream login → treat as
                    // an unreachable/invalid URL and move on.
                    tryUrls(index + 1);
                })
                .catch(function () { clearTimeout(tid); tryUrls(index + 1); });
        }(0));
    });

    /* ── EPG panel ─────────────────────────────────────────────────────────── */
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

    /* ── Live TV category hide panel ───────────────────────────────────────── */
    function renderLiveTvCats() {
        var wrap  = document.getElementById('livetv-cats-wrap');
        var empty = document.getElementById('livetv-cats-empty');
        var cached = load('iptv_cat_v2', null);
        var cats = cached && Array.isArray(cached.data) ? cached.data : [];
        if (!cats.length) { wrap.innerHTML = ''; wrap.style.display = 'none'; empty.style.display = ''; return; }
        empty.style.display = 'none'; wrap.style.display = '';
        var hidden = new Set((load('iptv_hidden_cats_live', []) || []).map(String));
        wrap.innerHTML = '';
        cats.forEach(function (cat) {
            var id   = String(cat.category_id);
            var name = cat.category_name || 'Unnamed';
            wrap.appendChild(makeCatToggle(id, name, hidden.has(id), function (catId, on) {
                var h = load('iptv_hidden_cats_live', []) || [];
                if (on) { if (h.indexOf(catId) === -1) h.push(catId); }
                else    { h = h.filter(function (x) { return x !== catId; }); }
                save('iptv_hidden_cats_live', h);
            }));
        });
        rebuildFocusables();
    }

    /* ── VOD category hide panel ───────────────────────────────────────────── */
    function renderVodCats() {
        var empty   = document.getElementById('vod-cats-empty');
        var movieW  = document.getElementById('vod-movie-cats-wrap');
        var seriesW = document.getElementById('vod-series-cats-wrap');
        movieW.innerHTML = ''; seriesW.innerHTML = '';

        var resolvedUrl  = load('iptv_active_resolved_url', '') || '';
        var movieCats  = [];
        var seriesCats = [];
        if (resolvedUrl) {
            var mc = load('vod_cats_movie_'  + resolvedUrl, null);
            var sc = load('vod_cats_series_' + resolvedUrl, null);
            if (mc && mc.data) movieCats  = mc.data;
            else if (Array.isArray(mc)) movieCats = mc;
            if (sc && sc.data) seriesCats  = sc.data;
            else if (Array.isArray(sc)) seriesCats = sc;
        }

        var hasAny = movieCats.length || seriesCats.length;
        empty.style.display = hasAny ? 'none' : '';
        document.getElementById('vod-movies-wrap').style.display  = movieCats.length  ? '' : 'none';
        document.getElementById('vod-series-wrap').style.display  = seriesCats.length ? '' : 'none';

        var hiddenM = new Set((load('iptv_hidden_cats_vod_m', []) || []).map(String));
        var hiddenS = new Set((load('iptv_hidden_cats_vod_s', []) || []).map(String));

        movieCats.forEach(function (cat) {
            var id = String(cat.category_id);
            movieW.appendChild(makeCatToggle(id, cat.category_name || 'Unnamed', hiddenM.has(id), function (catId, on) {
                var h = load('iptv_hidden_cats_vod_m', []) || [];
                if (on) { if (h.indexOf(catId) === -1) h.push(catId); }
                else    { h = h.filter(function (x) { return x !== catId; }); }
                save('iptv_hidden_cats_vod_m', h);
            }));
        });
        seriesCats.forEach(function (cat) {
            var id = String(cat.category_id);
            seriesW.appendChild(makeCatToggle(id, cat.category_name || 'Unnamed', hiddenS.has(id), function (catId, on) {
                var h = load('iptv_hidden_cats_vod_s', []) || [];
                if (on) { if (h.indexOf(catId) === -1) h.push(catId); }
                else    { h = h.filter(function (x) { return x !== catId; }); }
                save('iptv_hidden_cats_vod_s', h);
            }));
        });
        rebuildFocusables();
    }

    function makeCatToggle(id, name, isHidden, onChange) {
        var row = document.createElement('div');
        row.className = 'cat-toggle-row' + (isHidden ? ' hidden-cat' : '');
        row.innerHTML =
            '<span class="cat-toggle-name">' + escHtml(name) + '</span>' +
            '<button class="cat-toggle-btn" aria-pressed="' + (isHidden ? 'true' : 'false') + '">' +
                '<span class="cat-toggle-knob"></span>' +
            '</button>';
        var btn = row.querySelector('.cat-toggle-btn');
        btn.addEventListener('click', function () {
            var nowHidden = btn.getAttribute('aria-pressed') !== 'true';
            btn.setAttribute('aria-pressed', nowHidden ? 'true' : 'false');
            row.classList.toggle('hidden-cat', nowHidden);
            onChange(id, nowHidden);
        });
        return row;
    }

    /* ── Remote QR setup — always-visible right panel ──────────────────────── */
    var REMOTE_BASE_URL   = 'https://lgiptv-remote.vercel.app';
    var REMOTE_POLL_MS     = 3000;        // gap between cfg polls
    var REMOTE_POLL_MAX_MS = 4 * 60 * 1000; // stop polling after 4 min idle
    var _remoteToken      = null;
    var _remotePollTimer  = null;

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
        var liveCats   = (cachedCats && Array.isArray(cachedCats.data))
            ? cachedCats.data.map(function (c) { return { id: String(c.category_id), name: c.category_name || '' }; })
            : [];

        var resolvedUrl = load('iptv_active_resolved_url', '') || '';
        var rawM = resolvedUrl ? load('vod_cats_movie_'  + resolvedUrl, null) : null;
        var rawS = resolvedUrl ? load('vod_cats_series_' + resolvedUrl, null) : null;
        var mArr = Array.isArray(rawM) ? rawM : (rawM && rawM.data ? rawM.data : []);
        var sArr = Array.isArray(rawS) ? rawS : (rawS && rawS.data ? rawS.data : []);
        var vodCatsM = mArr.map(function (c) { return { id: String(c.category_id), name: c.category_name || '' }; });
        var vodCatsS = sArr.map(function (c) { return { id: String(c.category_id), name: c.category_name || '' }; });

        /* Send all profiles so phone can pick one */
        var ctx = {
            active_profile_id: activeId || selectedId || '',
            profiles: profiles.map(function (p) {
                return {
                    id:           p.id,
                    name:         p.name         || '',
                    type:         p.type         || 'xtream',
                    server_urls:  p.server_urls  || [],
                    username:     p.username     || '',
                    password:     p.password     || '',
                    playlist_url: p.playlist_url || '',
                    epg_url:      p.epg_url      || '',
                    epg_match:    p.epg_match    || 'tvg-id',
                };
            }),
            hidden_live:  load('iptv_hidden_cats_live',  []) || [],
            hidden_vod_m: load('iptv_hidden_cats_vod_m', []) || [],
            hidden_vod_s: load('iptv_hidden_cats_vod_s', []) || [],
            cats_live:    liveCats,
            cats_vod_m:   vodCatsM,
            cats_vod_s:   vodCatsS,
        };

        /* Show QR immediately so user can scan while ctx uploads. Generated
           on-device (qrcode.js) so the session token never leaves the TV and
           the user's phone — no third-party QR service involved. */
        var setupUrl = REMOTE_BASE_URL + '/?s=' + _remoteToken;
        var img   = document.getElementById('remote-qr-img');
        var urlEl = document.getElementById('remote-qr-url');
        if (img) {
            try {
                var qr = qrcode(0, 'M');           // type 0 = auto-size, ECC level M
                qr.addData(setupUrl);
                qr.make();
                img.src = qr.createDataURL(5, 12); // ~190px native, minimal scaling
            } catch (e) {
                img.removeAttribute('src');        // URL text below is the fallback
            }
        }
        if (urlEl) urlEl.textContent = setupUrl;
        setStatus('remote-qr-status', 'Uploading…', '');

        /* Push context — capture token so closure is stable across restarts */
        var token = _remoteToken;
        fetch(REMOTE_BASE_URL + '/api/session?s=' + token + '&t=ctx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ctx)
        })
        .then(function (r) {
            if (token !== _remoteToken) return;   /* session restarted — ignore */
            if (!r.ok) throw new Error('HTTP ' + r.status);
            setStatus('remote-qr-status', 'Waiting for phone…', '');
        })
        .catch(function (err) {
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
            fetch(REMOTE_BASE_URL + '/api/session?s=' + _remoteToken + '&t=cfg')
                .then(function (r) {
                    if (r.status === 404) return null;
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(function (data) {
                    if (!data) return;
                    var usedToken = _remoteToken;
                    stopRemoteSession();
                    applyRemoteConfig(data, usedToken);
                })
                .catch(function () {});
        }, REMOTE_POLL_MS);
    }

    function stopRemoteSession() {
        if (_remotePollTimer) { clearInterval(_remotePollTimer); _remotePollTimer = null; }
        _remoteToken = null;
    }

    /* Wipe both relay keys from the store as soon as we're done with them. */
    function deleteRemoteSession(token) {
        if (!token) return;
        fetch(REMOTE_BASE_URL + '/api/session?s=' + token, { method: 'DELETE' }).catch(function () {});
    }

    function applyRemoteConfig(cfg, usedToken) {
        /* Credentials are no longer needed in the store — wipe them now. */
        deleteRemoteSession(usedToken);
        /* Phone sends back the profile id it edited — find or create */
        var profile = (cfg.profile_id && profiles.find(function (p) { return p.id === cfg.profile_id; }))
            || profiles.find(function (p) { return p.id === selectedId; });
        if (!profile) {
            profile = { id: makeId(), name: 'Remote Profile', type: 'xtream', username: '', password: '', server_urls: [], playlist_url: '', epg_url: '', epg_match: 'tvg-id' };
            profiles.push(profile);
            selectedId = profile.id;
        }

        profile.name        = cfg.name         || profile.name;
        profile.type        = cfg.profile_type === 'm3u' ? 'm3u' : 'xtream';
        profile.server_urls = Array.isArray(cfg.server_urls) ? cfg.server_urls : profile.server_urls;
        profile.username    = cfg.username     !== undefined ? cfg.username    : profile.username;
        profile.password    = cfg.password     !== undefined ? cfg.password    : profile.password;
        profile.playlist_url = cfg.playlist_url || profile.playlist_url;
        profile.epg_url     = cfg.epg_url      !== undefined ? cfg.epg_url    : profile.epg_url;
        profile.epg_match   = cfg.epg_match    || profile.epg_match;
        saveProfiles(profiles);

        /* Apply hidden categories */
        if (Array.isArray(cfg.hidden_live))  save('iptv_hidden_cats_live',  cfg.hidden_live);
        if (Array.isArray(cfg.hidden_vod_m)) save('iptv_hidden_cats_vod_m', cfg.hidden_vod_m);
        if (Array.isArray(cfg.hidden_vod_s)) save('iptv_hidden_cats_vod_s', cfg.hidden_vod_s);

        /* Set as active if it's an Xtream profile with URLs */
        activeId = profile.id;
        setActiveId(activeId);
        save('iptv_source_type', profile.type);
        if (profile.type === 'xtream' && profile.server_urls.length) {
            save('iptv_active_resolved_url', profile.server_urls[0]);
        } else if (profile.type === 'm3u' && profile.playlist_url) {
            save('iptv_m3u_config', { playlist_url: profile.playlist_url });
        }
        try { localStorage.removeItem('iptv_ch_v2');  } catch (e) {}
        try { localStorage.removeItem('iptv_cat_v2'); } catch (e) {}

        stopRemoteSession();
        setStatus('profile-status', 'Remote config applied — returning…', 'ok');
        setTimeout(function () { tvGoBack('../index.html'); }, 1500);
    }

    /* ── Cache panel ───────────────────────────────────────────────────────── */
    document.getElementById('cfg-clear-cache-btn').addEventListener('click', function () {
        try { localStorage.removeItem('iptv_ch_v2'); localStorage.removeItem('iptv_cat_v2'); } catch (e) {}
        setStatus('cfg-clear-ch-status', 'Channel cache cleared.', 'ok', 3000);
    });

    document.getElementById('cfg-clear-epg-btn').addEventListener('click', function () {
        try { localStorage.removeItem('iptv_epg_v2'); localStorage.removeItem('iptv_xmltv_cache'); } catch (e) {}
        setStatus('cfg-clear-epg-status', 'EPG cache cleared.', 'ok', 3000);
    });

    /* ── Back navigation ───────────────────────────────────────────────────── */
    if (typeof tvGoBack !== 'function') {
        window.tvGoBack = function (backUrl) {
            if (backUrl) { window.location.href = backUrl; }
            else if (typeof webOS !== 'undefined') { webOS.platformBack(); }
        };
    }
    document.getElementById('back-btn').addEventListener('click', function () {
        stopRemoteSession();
        tvGoBack('../index.html');
    });

    /* ── D-pad navigation ──────────────────────────────────────────────────── */
    var KEY = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, BACK: 461 };

    var focusables        = [];
    var focusIndex        = 0;
    var tabList           = [];
    var _col              = 'sidebar';
    var _sidebarIdx       = 0;
    var _editorRowIdx     = 0;
    var _editorColIdx     = 0;
    var _inProfileContent = false;

    function getSidebarItems() {
        var items = Array.from(document.querySelectorAll('#profiles-list .profile-item'));
        // Whichever "+ New Profile" button is currently visible.
        var sidebarAdd = document.getElementById('add-profile-btn');
        var emptyAdd   = document.getElementById('empty-add-profile-btn');
        if (sidebarAdd && sidebarAdd.offsetParent !== null) items.push(sidebarAdd);
        if (emptyAdd   && emptyAdd.offsetParent   !== null) items.push(emptyAdd);
        return items;
    }

    function getEditorRows() {
        var formEl = document.getElementById('editor-form');
        if (!formEl || formEl.hidden) return [];
        var rows = [];
        var seen = [];
        function visible(el) { return !el.disabled && el.offsetParent !== null; }
        var all = Array.from(formEl.querySelectorAll('input, select, button')).filter(visible);

        all.forEach(function (el) {
            if (seen.indexOf(el) !== -1) return;
            var editorHeader = el.closest('#editor-header');
            if (editorHeader) {
                var siblings = Array.from(editorHeader.querySelectorAll('input, select, button')).filter(visible);
                siblings.forEach(function (s) { seen.push(s); });
                rows.push(siblings); return;
            }
            var typeToggle = el.closest('#type-toggle');
            if (typeToggle) {
                var siblings = Array.from(typeToggle.querySelectorAll('button')).filter(visible);
                siblings.forEach(function (s) { seen.push(s); });
                rows.push(siblings); return;
            }
            var urlRow = el.closest('.url-row');
            if (urlRow) {
                var siblings = Array.from(urlRow.querySelectorAll('input, select, button')).filter(visible);
                siblings.forEach(function (s) { seen.push(s); });
                rows.push(siblings); return;
            }
            var fieldRow = el.closest('.field-row');
            if (fieldRow) {
                var siblings = Array.from(fieldRow.querySelectorAll('input, select, button')).filter(visible);
                siblings.forEach(function (s) { seen.push(s); });
                rows.push(siblings); return;
            }
            seen.push(el);
            rows.push([el]);
        });
        return rows;
    }

    function getFlatPanelItems() {
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
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

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

    function openKeyboard(el) { el.focus(); }

    function closeKeyboard() {
        var prev = document.activeElement;
        if (prev) prev.blur();
        requestAnimationFrame(function () {
            if (isProfilesPanel()) { applyProfileFocus(); }
            else { applyFocus(focusIndex); }
        });
    }

    function isInputFocused() {
        var a = document.activeElement;
        return !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'));
    }

    function jumpToActiveTab() {
        _inProfileContent = false;
        clearFocusRing();
        var activeTab = tabList.find(function (b) { return b.classList.contains('active'); }) || tabList[0];
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
            _col = 'sidebar'; _sidebarIdx = 0;
            applyProfileFocus();
        } else {
            var firstItem = tabList.length + 1;
            if (firstItem < focusables.length) applyFocus(firstItem);
        }
    }

    function handleNavKey(kc) {
        if (kc === KEY.BACK) { stopRemoteSession(); tvGoBack('../index.html'); return; }

        if (isProfilesPanel() && _inProfileContent) {
            if (kc === KEY.UP) {
                if (_col === 'sidebar') {
                    if (_sidebarIdx === 0) { jumpToActiveTab(); }
                    else { _sidebarIdx--; applyProfileFocus(); }
                } else {
                    if (_editorRowIdx === 0) { jumpToActiveTab(); }
                    else {
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
                    if (_sidebarIdx < sItems.length - 1) { _sidebarIdx++; applyProfileFocus(); }
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
            if (kc === KEY.LEFT) {
                if (_col === 'editor') {
                    if (_editorColIdx > 0) { _editorColIdx--; applyProfileFocus(); }
                    else { _col = 'sidebar'; applyProfileFocus(); }
                }
                return;
            }
            if (kc === KEY.RIGHT) {
                if (_col === 'sidebar') {
                    if (getEditorRows().length > 0) { _col = 'editor'; _editorColIdx = 0; applyProfileFocus(); }
                } else {
                    var curRow = getEditorRows()[_editorRowIdx] || [];
                    if (_editorColIdx < curRow.length - 1) { _editorColIdx++; applyProfileFocus(); }
                }
                return;
            }
            if (kc === KEY.ENTER) {
                var el;
                if (_col === 'sidebar') { el = getSidebarItems()[_sidebarIdx]; }
                else {
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

        var el = focusables[focusIndex];
        if (kc === KEY.UP) {
            if (tabList.indexOf(el) !== -1) { applyFocus(0); }
            else if (el === document.getElementById('back-btn')) { /* top */ }
            else {
                var firstPanelIdx = tabList.length + 1;
                if (focusIndex === firstPanelIdx) { jumpToActiveTab(); }
                else { applyFocus(focusIndex - 1); }
            }
            return;
        }
        if (kc === KEY.DOWN) {
            if (el === document.getElementById('back-btn')) { jumpToActiveTab(); }
            else if (tabList.indexOf(el) !== -1) { jumpIntoPanel(); }
            else { applyFocus(focusIndex + 1); }
            return;
        }
        if (kc === KEY.LEFT || kc === KEY.RIGHT) {
            var dir = kc === KEY.RIGHT ? 1 : -1;
            if (tabList.indexOf(el) !== -1) {
                var ci = tabList.indexOf(el), next = ci + dir;
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
                    var fsi = fsiblings.indexOf(el), fsn = fsi + dir;
                    if (fsn >= 0 && fsn < fsiblings.length) {
                        applyFocus(focusables.indexOf(fsiblings[fsn]));
                    }
                }
            }
            return;
        }
        if (kc === KEY.ENTER) {
            if (!el) return;
            if (el.tagName === 'INPUT') { openKeyboard(el); }
            else { el.click(); }
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
                setTimeout(function () { handleNavKey(_kc); }, 50);
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
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ── Boot ──────────────────────────────────────────────────────────────── */
    renderProfileList();
    renderEditor();   /* calls startRemoteSession() internally */
    var bootTab = load('iptv_last_tab', 'profiles');
    if (bootTab === 'm3u' || bootTab === 'remote') bootTab = 'profiles';
    _inProfileContent = (bootTab === 'profiles');
    activateTab(bootTab);
    rebuildFocusables();
    if (_inProfileContent) { applyProfileFocus(); } else { applyFocus(0); }

}());
