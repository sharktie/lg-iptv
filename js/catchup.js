/* catchup.js — Catch-up / timeshift browser (webOS, Xtream only)
   ─────────────────────────────────────────────────────────────────────
   Sidebar  · Continue Watching shortcut (pinned shows)
            · ★ Favourites section (catch-up-only favourites)
            · One collapsible section per live category — channels stay
              grouped exactly as the provider lists them, so there's no
              1000-channel scroll. Search shows a flat filtered list.
   Main     · Continue Watching — pinned time slots, each resolved to the
              most recent programme that aired near that slot on that channel
              (auto-surfaces the new one every day).
            · Channel archive — day tabs + past programmes; pin/play here.
   Catch-up is an Xtream feature; M3U playlists have no server-side archive.
   ES5-friendly (Babel target Chrome 38); no template literals / arrow fns. */
(function () {
    'use strict';

    var cfg = IPTVCore.resolveConfig();

    /* ── DOM refs ────────────────────────────────────────────────────── */
    var elStatus    = document.getElementById('cu-status');
    var elSearch    = document.getElementById('cu-search');
    var elNav       = document.getElementById('cu-nav');
    var elMainTitle = document.getElementById('cu-main-title');
    var elMainSub   = document.getElementById('cu-main-sub');
    var elCw        = document.getElementById('cu-cw');
    var elArchive   = document.getElementById('cu-archive');
    var elDayTabs   = document.getElementById('cu-day-tabs');
    var elProgList  = document.getElementById('cu-programme-list');
    var elPlaceholder = document.getElementById('cu-placeholder');

    function setStatus(msg) { if (elStatus) elStatus.textContent = msg; }
    function escHtml(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function load(key, fb) { try { var v = localStorage.getItem(key); return v != null ? JSON.parse(v) : fb; } catch (e) { return fb; } }
    function save(key, v)  { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
    function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

    /* ── EPG helpers ─────────────────────────────────────────────────── */
    function epgStart(e) { return Number(e.start_timestamp || 0) * 1000; }
    function epgEnd(e)   { return Number(e.stop_timestamp || e.end_timestamp || 0) * 1000; }
    function decode(s)   { return (typeof xtreamDecodeEPG === 'function') ? xtreamDecodeEPG(s) : (s || ''); }
    function fmtTime(ms) { return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    function dayKey(ms)  { var d = new Date(ms); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
    function dayLabel(ms) {
        var k = dayKey(ms), now = Date.now();
        if (k === dayKey(now))             return 'Today';
        if (k === dayKey(now - 86400000))  return 'Yesterday';
        return new Date(ms).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
    }
    function whenLabel(e) { return dayLabel(epgStart(e)) + ' · ' + fmtTime(epgStart(e)); }
    function archiveDays(ch) { return parseInt(ch.tv_archive_duration, 10) || 0; }

    /* ── Catch-up favourites (separate from Live TV) ─────────────────── */
    var favs = load('catchup_favs', []) || [];
    var favSet = {}; favs.forEach(function (id) { favSet[String(id)] = true; });
    function isFav(id) { return !!favSet[String(id)]; }
    function toggleFav(id) {
        id = String(id);
        if (favSet[id]) { delete favSet[id]; favs = favs.filter(function (x) { return String(x) !== id; }); }
        else { favSet[id] = true; favs.push(id); }
        save('catchup_favs', favs);
    }

    /* ── Pinned slots (Continue Watching) ────────────────────────────────
       A pin follows a TIME SLOT on a channel (e.g. 20:00). Each day it
       surfaces whatever aired closest to that slot — simpler than title
       matching and immune to per-episode title changes. */
    var pins = load('catchup_pins', []) || [];
    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function slotKey(hour, minute) { return pad2(hour) + ':' + pad2(minute); }
    function pinId(streamId, hour, minute) { return String(streamId) + '@' + slotKey(hour, minute); }
    function isPinnedSlot(streamId, hour, minute) {
        var id = pinId(streamId, hour, minute);
        for (var i = 0; i < pins.length; i++) if (pins[i].id === id) return true;
        return false;
    }
    function addPin(p)     { for (var i = 0; i < pins.length; i++) if (pins[i].id === p.id) return; pins.push(p); save('catchup_pins', pins); }
    function removePin(id) { pins = pins.filter(function (p) { return p.id !== id; }); save('catchup_pins', pins); }
    function slotLabel(p)  { var d = new Date(); d.setHours(p.hour, p.minute, 0, 0); return fmtTime(d.getTime()); }

    /* ── Data table cache (per channel, short TTL) ───────────────────── */
    var dtCache = {};
    function getDataTable(streamId) {
        var c = dtCache[streamId];
        if (c && Date.now() - c.ts < 600000) return Promise.resolve(c.listings);
        return xtreamGetSimpleDataTable(cfg, streamId).then(function (listings) {
            dtCache[streamId] = { ts: Date.now(), listings: listings || [] };
            return dtCache[streamId].listings;
        });
    }

    /* ── Channel + category data ─────────────────────────────────────── */
    var allChannels = [];   // [{stream_id,name,stream_icon,tv_archive_duration,category_id}]
    var catName = {};       // category_id -> name
    var byCat = {};         // category_id -> [channels]
    var catOrder = [];      // ordered category_ids that have archive channels
    var openSecs = { favs: true };  // which sidebar sections are expanded

    function buildCatMaps(catsOrdered) {
        byCat = {}; catOrder = [];
        allChannels.forEach(function (ch) {
            var c = ch.category_id || '';
            if (!byCat[c]) byCat[c] = [];
            byCat[c].push(ch);
        });
        var seen = {};
        (catsOrdered || []).forEach(function (c) {
            var id = String(c.category_id);
            if (byCat[id] && !seen[id]) { catOrder.push(id); seen[id] = true; }
        });
        // Any channels whose category wasn't in the categories list.
        Object.keys(byCat).forEach(function (id) {
            if (!seen[id]) { catOrder.push(id); seen[id] = true; if (!catName[id]) catName[id] = 'Other'; }
        });
    }

    function loadChannels() {
        var chKey = 'cu_channels_' + IPTVCore.base(cfg);
        var catKey = 'cu_cats_' + IPTVCore.base(cfg);
        var cachedCh = IPTVCore.cacheGet(chKey), cachedCat = IPTVCore.cacheGet(catKey);
        if (cachedCh && cachedCh.length) {
            allChannels = cachedCh;
            catName = {}; (cachedCat || []).forEach(function (c) { catName[String(c.category_id)] = c.category_name || 'Unnamed'; });
            buildCatMaps(cachedCat || []);
            setStatus(allChannels.length + ' channels');
            renderSidebar();
        } else {
            setStatus('Loading channels…');
        }
        Promise.all([
            xtreamGetCategories(cfg).catch(function () { return []; }),
            xtreamGetLiveChannels(cfg)
        ]).then(function (res) {
            var cats = res[0] || [], list = res[1] || [];
            var arch = [];
            for (var i = 0; i < list.length; i++) {
                var ch = list[i];
                if (Number(ch.tv_archive) === 1) {
                    arch.push({
                        stream_id: ch.stream_id,
                        name: ch.name || 'Unknown',
                        stream_icon: ch.stream_icon || '',
                        tv_archive_duration: ch.tv_archive_duration || 0,
                        category_id: String(ch.category_id == null ? '' : ch.category_id)
                    });
                }
            }
            // A failed/empty refresh must not clobber a good cached list (the
            // fetch helpers return [] on network errors, not just empty data).
            if (!arch.length) {
                if (!allChannels.length) {
                    setStatus('No catch-up channels');
                    if (mainMode === 'cw' && !pins.length) showPlaceholder('Your provider doesn’t offer catch-up on any channel.');
                }
                return;
            }
            if (cats.length) { catName = {}; cats.forEach(function (c) { catName[String(c.category_id)] = c.category_name || 'Unnamed'; }); }
            allChannels = arch;
            IPTVCore.cacheSet(chKey, arch);
            if (cats.length) IPTVCore.cacheSet(catKey, cats);
            buildCatMaps(cats.length ? cats : (cachedCat || []));
            setStatus(arch.length + ' channels');
            renderSidebar();
        }).catch(function () {
            if (!allChannels.length) {
                setStatus('Couldn’t load channels');
                if (mainMode === 'cw' && !pins.length) showPlaceholder('Couldn’t reach the server. Check your connection and try again.');
            }
        });
    }

    /* ── Sidebar: channel row + section factories ────────────────────── */
    function makeChRow(ch) {
        var row = document.createElement('div');
        row.className = 'cu-ch-row'; row.tabIndex = -1; row.dataset.sid = String(ch.stream_id);

        var logo = document.createElement('div');
        logo.className = 'cu-ch-logo';
        var initial = (ch.name || '?').charAt(0).toUpperCase();
        if (ch.stream_icon) {
            var img = new Image();
            img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
            img.onerror = function () {
                var fb = document.createElement('div');
                fb.className = 'cu-ch-logo-fallback'; fb.textContent = initial;
                if (this.parentNode) this.parentNode.replaceChild(fb, this);
            };
            img.src = ch.stream_icon;
            logo.appendChild(img);
        } else {
            var fb = document.createElement('div');
            fb.className = 'cu-ch-logo-fallback'; fb.textContent = initial;
            logo.appendChild(fb);
        }

        var name = document.createElement('div');
        name.className = 'cu-ch-name'; name.textContent = ch.name || 'Unknown';

        var fav = document.createElement('button');
        fav.className = 'cu-fav-btn' + (isFav(ch.stream_id) ? ' active' : '');
        fav.textContent = '★'; fav.tabIndex = -1; fav.title = 'Favourite';
        fav.addEventListener('click', function (e) { e.stopPropagation(); doToggleFav(ch.stream_id); });

        row.appendChild(logo);
        row.appendChild(name);
        var days = archiveDays(ch);
        if (days) {
            var badge = document.createElement('div');
            badge.className = 'cu-ch-badge'; badge.textContent = days + 'd';
            row.appendChild(badge);
        }
        row.appendChild(fav);

        row.addEventListener('click', function () { pendingMainFocus = true; selectChannel(ch); });
        row._ch = ch; row._fav = fav;
        return row;
    }

    function makeSection(id, label, channels) {
        var sec = document.createElement('div');
        sec.className = 'cu-section'; sec.dataset.secId = id;
        var hdr = document.createElement('button');
        hdr.className = 'cu-section-hdr';
        hdr.innerHTML = '<span class="cu-sec-chev">▾</span><span class="cu-sec-label">' + escHtml(label) +
            '</span><span class="cu-sec-count">' + channels.length + '</span>';
        var list = document.createElement('div');
        list.className = 'cu-section-list';
        sec.appendChild(hdr); sec.appendChild(list);
        sec._channels = channels; sec._built = false;
        function build() {
            if (sec._built) return;
            var frag = document.createDocumentFragment();
            channels.forEach(function (ch) { frag.appendChild(makeChRow(ch)); });
            list.appendChild(frag); sec._built = true;
        }
        if (openSecs[id]) { sec.classList.add('open'); build(); }
        hdr.addEventListener('click', function () {
            var willOpen = !sec.classList.contains('open');
            sec.classList.toggle('open', willOpen);
            openSecs[id] = willOpen;
            if (willOpen) build();
            if (zone === 'sidebar') paintSidebar();
        });
        return sec;
    }

    function renderSidebar() {
        var q = (elSearch.value || '').toLowerCase();
        elNav.innerHTML = '';

        if (q) {
            var matches = allChannels.filter(function (c) { return (c.name || '').toLowerCase().indexOf(q) !== -1; });
            var list = document.createElement('div');
            list.className = 'cu-section-list cu-search-list';
            if (!matches.length) {
                var empty = document.createElement('div');
                empty.className = 'cu-ch-empty'; empty.textContent = 'No channels match your search.';
                list.appendChild(empty);
            } else {
                matches.forEach(function (ch) { list.appendChild(makeChRow(ch)); });
            }
            elNav.appendChild(list);
            if (zone === 'sidebar') paintSidebar();
            return;
        }

        if (pins.length) {
            var cw = document.createElement('button');
            cw.className = 'cu-cw-nav' + (mainMode === 'cw' ? ' active' : '');
            cw.innerHTML = '<span class="cu-cw-ico">▶</span><span class="cu-sec-label">Continue Watching</span>' +
                '<span class="cu-sec-count">' + pins.length + '</span>';
            cw.addEventListener('click', function () { openHome(); focusMain(); });
            elNav.appendChild(cw);
        }

        var favChannels = allChannels.filter(function (ch) { return isFav(ch.stream_id); });
        if (favChannels.length) elNav.appendChild(makeSection('favs', '★ Favourites', favChannels));

        catOrder.forEach(function (cid) {
            var chs = byCat[cid] || [];
            if (chs.length) elNav.appendChild(makeSection('cat_' + cid, catName[cid] || 'Unnamed', chs));
        });

        if (zone === 'sidebar') paintSidebar();
    }

    // Lightweight refresh of the Continue Watching shortcut after a pin change.
    // Avoids rebuilding the whole sidebar (and any large expanded category) when
    // only the shortcut's count changed — full re-render only when it has to
    // appear or disappear (pins went 0↔1+).
    function refreshCwNav(prevLen) {
        if ((prevLen === 0) !== (pins.length === 0)) { renderSidebar(); return; }
        var count = elNav.querySelector('.cu-cw-nav .cu-sec-count');
        if (count) count.textContent = pins.length;
    }

    function doToggleFav(sid) {
        toggleFav(sid);
        renderSidebar();
        // Keep the ring on the same channel if it's still visible.
        if (zone === 'sidebar') {
            var items = sideItems(), idx = -1;
            for (var i = 0; i < items.length; i++) {
                if (items[i].kind === 'channel' && String(items[i].ch.stream_id) === String(sid)) { idx = i; break; }
            }
            if (idx >= 0) { sideIndex = idx; }
            sideSub = 'star';
            paintSidebar();
        }
    }

    /* ── Main: Continue Watching view ────────────────────────────────── */
    function showPlaceholder(text) {
        if (text) document.getElementById('cu-placeholder-text').textContent = text;
        elPlaceholder.style.display = '';
    }
    function hidePlaceholder() { elPlaceholder.style.display = 'none'; }

    function openHome() {
        mainMode = 'cw';
        currentCh = null;
        elArchive.hidden = true; elCw.hidden = false;
        elMainTitle.textContent = 'Continue Watching';
        document.querySelectorAll('#cu-nav .cu-ch-row.selected').forEach(function (r) { r.classList.remove('selected'); });
        document.querySelectorAll('#cu-nav .cu-cw-nav').forEach(function (n) { n.classList.add('active'); });
        if (!pins.length) {
            elCw.innerHTML = '';
            elMainSub.textContent = 'Your pinned slots appear here';
            showPlaceholder('Pin a programme from any channel’s archive and it shows up here — the latest airing in that time slot, every day. Open a channel, focus a programme, press RIGHT then OK on the ★.');
            return;
        }
        hidePlaceholder();
        elMainSub.textContent = pins.length + ' pinned slot' + (pins.length === 1 ? '' : 's');
        elCw.innerHTML = '';
        pins.forEach(function (p) {
            var card = document.createElement('div');
            card.className = 'cu-cw-card'; card.tabIndex = -1; card.dataset.pinId = p.id;

            var logo = document.createElement('div');
            logo.className = 'cu-cw-logo';
            if (p.channel_icon) {
                var img = new Image(); img.alt = ''; img.decoding = 'async'; img.src = p.channel_icon;
                img.onerror = function () { if (this.parentNode) this.parentNode.removeChild(this); };
                logo.appendChild(img);
            }
            var body = document.createElement('div');
            body.className = 'cu-cw-body';
            body.innerHTML = '<div class="cu-cw-title">' + escHtml(p.label || 'Programme') + '</div>' +
                '<div class="cu-cw-channel">' + escHtml((p.channel_name || '') + ' · ' + slotLabel(p)) + '</div>' +
                '<div class="cu-cw-when">Loading…</div>';
            var play = document.createElement('div');
            play.className = 'cu-cw-play'; play.textContent = '▶';
            var unpin = document.createElement('button');
            unpin.className = 'cu-cw-unpin'; unpin.textContent = '★'; unpin.tabIndex = -1; unpin.title = 'Unpin';
            unpin.addEventListener('click', function (e) { e.stopPropagation(); doUnpin(p.id); });

            card.appendChild(logo); card.appendChild(body); card.appendChild(play); card.appendChild(unpin);
            card.addEventListener('click', function () { if (card._airing) playListing(p.stream_id, p.channel_name, p.channel_icon, card._airing); });
            elCw.appendChild(card);

            getDataTable(p.stream_id).then(function (listings) {
                var airing = resolvePin(p, listings);
                card._airing = airing;
                var when = card.querySelector('.cu-cw-when');
                if (airing) {
                    var t = card.querySelector('.cu-cw-title');
                    if (t) t.textContent = decode(airing.title) || p.label;
                    when.textContent = whenLabel(airing); card.classList.remove('cu-cw-empty');
                } else { when.textContent = 'No recent airing'; card.classList.add('cu-cw-empty'); }
            }).catch(function () {
                card.querySelector('.cu-cw-when').textContent = 'Unavailable';
                card.classList.add('cu-cw-empty');
            });
        });
    }

    // Most recent finished airing within the archive window whose start time-of-
    // day sits near the pinned slot (±45 min absorbs small schedule drift).
    function resolvePin(p, listings) {
        var now = Date.now(), winStart = now - 14 * 86400000, slot = p.hour * 60 + p.minute, TOL = 45;
        var best = null, bestStart = 0;
        for (var i = 0; i < listings.length; i++) {
            var e = listings[i], s = epgStart(e), en = epgEnd(e);
            if (!s || en > now || s < winStart) continue;
            var d = new Date(s), mins = d.getHours() * 60 + d.getMinutes();
            var delta = Math.abs(mins - slot);
            if (delta > 720) delta = 1440 - delta;   // wrap around midnight
            if (delta > TOL) continue;
            if (best === null || s > bestStart) { best = e; bestStart = s; }
        }
        return best;
    }

    function doUnpin(id) {
        removePin(id);
        renderSidebar();
        openHome();
        if (zone === 'main') { cwIndex = 0; cwSub = 'play'; if (pins.length) paintCw(); else focusSidebar(); }
    }

    /* ── Main: channel archive view ──────────────────────────────────── */
    var daysData = [], activeDayIdx = 0, epgReqKey = 0;

    function selectChannel(ch) {
        currentCh = ch; mainMode = 'archive';
        elCw.hidden = true; elArchive.hidden = false;
        document.querySelectorAll('#cu-nav .cu-cw-nav').forEach(function (n) { n.classList.remove('active'); });
        document.querySelectorAll('#cu-nav .cu-ch-row').forEach(function (r) {
            r.classList.toggle('selected', r.dataset.sid === String(ch.stream_id));
        });
        elMainTitle.textContent = ch.name || 'Catch-up';
        var days = archiveDays(ch);
        elMainSub.textContent = days ? (days + ' day' + (days === 1 ? '' : 's') + ' available') : 'Loading recordings…';
        daysData = []; activeDayIdx = 0;
        elDayTabs.innerHTML = ''; elProgList.innerHTML = '';
        showPlaceholder('Loading recordings…');

        var myKey = ++epgReqKey;
        getDataTable(ch.stream_id).then(function (listings) {
            if (myKey !== epgReqKey) return;
            buildDays(listings, days);
            if (!daysData.length) { showPlaceholder('No catch-up recordings available for this channel.'); return; }
            hidePlaceholder();
            renderDayTabs(); renderProgrammes();
            if (pendingMainFocus) { pendingMainFocus = false; focusMain(); }
            else if (zone === 'main' && mainMode === 'archive') paintArchive();
        }).catch(function () {
            if (myKey !== epgReqKey) return;
            pendingMainFocus = false;
            showPlaceholder('Couldn’t load recordings for this channel.');
        });
    }

    function buildDays(listings, days) {
        var now = Date.now(), winStart = days ? (now - days * 86400000) : 0, groups = {};
        for (var i = 0; i < listings.length; i++) {
            var e = listings[i], s = epgStart(e), en = epgEnd(e);
            if (!s || en > now) continue;
            if (winStart && s < winStart) continue;
            var k = dayKey(s);
            if (!groups[k]) groups[k] = { key: k, ms: s, items: [] };
            groups[k].items.push(e);
        }
        daysData = [];
        for (var key in groups) {
            if (!Object.prototype.hasOwnProperty.call(groups, key)) continue;
            var g = groups[key];
            g.items.sort(function (a, b) { return epgStart(a) - epgStart(b); });
            g.label = dayLabel(g.ms);
            daysData.push(g);
        }
        daysData.sort(function (a, b) { return b.ms - a.ms; });
    }

    function renderDayTabs() {
        elDayTabs.innerHTML = '';
        daysData.forEach(function (d, i) {
            var t = document.createElement('button');
            t.className = 'cu-day-tab' + (i === activeDayIdx ? ' active' : '');
            t.textContent = d.label; t.dataset.idx = i;
            t.addEventListener('click', function () { activeDayIdx = i; renderDayTabs(); renderProgrammes(); if (zone === 'main') { archSub = 'days'; dayIndex = i; paintArchive(); } });
            elDayTabs.appendChild(t);
        });
    }

    function renderProgrammes() {
        elProgList.innerHTML = '';
        var day = daysData[activeDayIdx];
        if (!day) return;
        var frag = document.createDocumentFragment();
        day.items.forEach(function (e) {
            var s = epgStart(e), en = epgEnd(e);
            var dt0 = new Date(epgStart(e));
            var pinned = currentCh && isPinnedSlot(currentCh.stream_id, dt0.getHours(), dt0.getMinutes());
            var row = document.createElement('div');
            row.className = 'cu-prog-row'; row.tabIndex = -1;
            row.innerHTML =
                '<span class="cu-prog-time">' + escHtml(fmtTime(s) + ' – ' + fmtTime(en)) + '</span>' +
                '<span class="cu-prog-title">' + escHtml(decode(e.title) || 'Unknown programme') + '</span>' +
                '<button class="cu-prog-pin' + (pinned ? ' active' : '') + '" tabindex="-1" title="Pin to Continue Watching">★</button>' +
                '<span class="cu-prog-play">▶</span>';
            row._listing = e;
            row.querySelector('.cu-prog-pin').addEventListener('click', function (ev) { ev.stopPropagation(); doTogglePin(e, row); });
            row.addEventListener('click', function () { playListing(currentCh.stream_id, currentCh.name, currentCh.stream_icon, e); });
            frag.appendChild(row);
        });
        elProgList.appendChild(frag);
        progIndex = 0;
    }

    function doTogglePin(e, row) {
        if (!currentCh) return;
        var dt = new Date(epgStart(e)), h = dt.getHours(), m = dt.getMinutes();
        var id = pinId(currentCh.stream_id, h, m), prevLen = pins.length;
        if (isPinnedSlot(currentCh.stream_id, h, m)) removePin(id);
        else addPin({
            id: id, stream_id: currentCh.stream_id,
            channel_name: currentCh.name, channel_icon: currentCh.stream_icon,
            hour: h, minute: m, label: decode(e.title)
        });
        row.querySelector('.cu-prog-pin').classList.toggle('active', isPinnedSlot(currentCh.stream_id, h, m));
        refreshCwNav(prevLen);   // update only the sidebar shortcut, not the whole tree
    }

    /* ── Playback ────────────────────────────────────────────────────── */
    function playListing(streamId, chName, chIcon, e) {
        var s = epgStart(e), en = epgEnd(e);
        var durMin = Math.max(1, Math.round((en - s) / 60000));
        var urls = xtreamBuildTimeshiftURLs(cfg, streamId, new Date(s), durMin);
        var title = (chName || '') + ' · ' + (decode(e.title) || '');
        try {
            localStorage.setItem('iptv_play_url', urls[0]);
            localStorage.setItem('iptv_play_title', title);
            localStorage.setItem('iptv_play_meta', JSON.stringify({
                url: urls[0], urls: urls, type: 'catchup', name: title, icon: chIcon || ''
            }));
        } catch (err) {}
        window.location.href = '../pages/player.html?url=' + encodeURIComponent(urls[0]) +
                               '&title=' + encodeURIComponent(title);
    }

    /* ── D-pad navigation ────────────────────────────────────────────── */
    var KEY = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, BACK: 461 };
    var zone = 'sidebar';        // 'search' | 'sidebar' | 'main'
    var mainMode = 'cw';         // 'cw' | 'archive'
    var currentCh = null;
    var sideIndex = 0, sideSub = 'row';        // sideSub: 'row' | 'star'
    var cwIndex = 0, cwSub = 'play';           // cwSub: 'play' | 'unpin'
    var archSub = 'days';                       // 'days' | 'progs'
    var dayIndex = 0, progIndex = 0, progSub = 'play';   // progSub: 'play' | 'pin'
    var pendingMainFocus = false;   // jump into the archive once it finishes loading

    function clearRings() {
        document.querySelectorAll('.tv-focus-visible').forEach(function (el) { el.classList.remove('tv-focus-visible'); });
        document.querySelectorAll('.cu-row-active').forEach(function (el) { el.classList.remove('cu-row-active'); });
    }
    function visible(el) { return el.offsetParent !== null; }

    function sideItems() {
        var els = Array.prototype.slice.call(elNav.querySelectorAll('.cu-cw-nav, .cu-section-hdr, .cu-ch-row')).filter(visible);
        return els.map(function (el) {
            if (el.classList.contains('cu-cw-nav'))      return { kind: 'cw', el: el };
            if (el.classList.contains('cu-section-hdr'))  return { kind: 'header', el: el };
            return { kind: 'channel', el: el, ch: el._ch, favBtn: el._fav };
        });
    }
    function cwCards()  { return Array.prototype.slice.call(elCw.querySelectorAll('.cu-cw-card')); }
    function dayTabs()  { return Array.prototype.slice.call(elDayTabs.querySelectorAll('.cu-day-tab')); }
    function progRows() { return Array.prototype.slice.call(elProgList.querySelectorAll('.cu-prog-row')); }

    function paintSidebar() {
        clearRings();
        var items = sideItems();
        if (!items.length) { elSearch.classList.add('tv-focus-visible'); return; }
        sideIndex = clamp(sideIndex, 0, items.length - 1);
        var it = items[sideIndex];
        if (it.kind === 'channel' && sideSub === 'star') { it.favBtn.classList.add('tv-focus-visible'); it.el.classList.add('cu-row-active'); }
        else it.el.classList.add('tv-focus-visible');
        it.el.scrollIntoView({ block: 'nearest' });
    }
    function paintCw() {
        clearRings();
        var cards = cwCards();
        if (!cards.length) return;
        cwIndex = clamp(cwIndex, 0, cards.length - 1);
        var c = cards[cwIndex];
        if (cwSub === 'unpin') { c.querySelector('.cu-cw-unpin').classList.add('tv-focus-visible'); c.classList.add('cu-row-active'); }
        else c.classList.add('tv-focus-visible');
        c.scrollIntoView({ block: 'nearest' });
    }
    function paintArchive() {
        clearRings();
        if (archSub === 'days') {
            var tabs = dayTabs();
            if (tabs.length) {
                dayIndex = clamp(dayIndex, 0, tabs.length - 1);
                tabs[dayIndex].classList.add('tv-focus-visible');
                tabs[dayIndex].scrollIntoView({ block: 'nearest', inline: 'center' });
                return;
            }
            archSub = 'progs';
        }
        var rows = progRows();
        if (!rows.length) return;
        progIndex = clamp(progIndex, 0, rows.length - 1);
        var r = rows[progIndex];
        if (progSub === 'pin') { r.querySelector('.cu-prog-pin').classList.add('tv-focus-visible'); r.classList.add('cu-row-active'); }
        else r.classList.add('tv-focus-visible');
        r.scrollIntoView({ block: 'nearest' });
    }
    function focusSidebar() { zone = 'sidebar'; paintSidebar(); }
    function focusSearch()  { zone = 'search'; clearRings(); elSearch.classList.add('tv-focus-visible'); elSearch.focus(); }
    // Move focus into the main pane, but only if it has something to land on
    // (empty Continue Watching / still-loading archive → stay put, return false).
    function focusMain() {
        if (mainMode === 'cw') {
            if (!cwCards().length) return false;
            zone = 'main'; cwIndex = clamp(cwIndex, 0, cwCards().length - 1); cwSub = 'play'; paintCw();
            return true;
        }
        if (!dayTabs().length && !progRows().length) return false;
        zone = 'main'; archSub = dayTabs().length ? 'days' : 'progs'; progSub = 'play'; paintArchive();
        return true;
    }

    function onSidebarKey(kc) {
        var items = sideItems();
        var it = items[sideIndex];
        if (kc === KEY.UP) {
            sideSub = 'row';
            if (sideIndex === 0) { focusSearch(); } else { sideIndex--; paintSidebar(); }
        } else if (kc === KEY.DOWN) {
            sideSub = 'row';
            if (sideIndex < items.length - 1) { sideIndex++; paintSidebar(); }
        } else if (kc === KEY.RIGHT) {
            if (it && it.kind === 'channel' && sideSub === 'row') { sideSub = 'star'; paintSidebar(); }
            else { focusMain(); }
        } else if (kc === KEY.LEFT) {
            if (it && it.kind === 'channel' && sideSub === 'star') { sideSub = 'row'; paintSidebar(); }
        } else if (kc === KEY.ENTER) {
            if (!it) return;
            if (it.kind === 'cw') { openHome(); focusMain(); }
            else if (it.kind === 'header') { it.el.click(); paintSidebar(); }
            else if (it.kind === 'channel') {
                if (sideSub === 'star') { doToggleFav(it.ch.stream_id); }
                else { pendingMainFocus = true; selectChannel(it.ch); }
            }
        }
    }

    function onMainCwKey(kc) {
        var cards = cwCards();
        if (kc === KEY.UP) { if (cwIndex > 0) { cwIndex--; paintCw(); } }
        else if (kc === KEY.DOWN) { if (cwIndex < cards.length - 1) { cwIndex++; paintCw(); } }
        else if (kc === KEY.LEFT) { if (cwSub === 'unpin') { cwSub = 'play'; paintCw(); } else focusSidebar(); }
        else if (kc === KEY.RIGHT) { if (cwSub === 'play') { cwSub = 'unpin'; paintCw(); } }
        else if (kc === KEY.ENTER) {
            var c = cards[cwIndex]; if (!c) return;
            if (cwSub === 'unpin') doUnpin(c.dataset.pinId);
            else c.click();
        }
    }

    function onMainArchiveKey(kc) {
        if (archSub === 'days') {
            var tabs = dayTabs();
            if (kc === KEY.LEFT) { if (dayIndex === 0) focusSidebar(); else { dayIndex--; paintArchive(); } }
            else if (kc === KEY.RIGHT) { if (dayIndex < tabs.length - 1) { dayIndex++; paintArchive(); } }
            else if (kc === KEY.DOWN) { if (progRows().length) { archSub = 'progs'; progIndex = 0; progSub = 'play'; paintArchive(); } }
            else if (kc === KEY.ENTER) { activeDayIdx = dayIndex; renderDayTabs(); renderProgrammes(); paintArchive(); }
            return;
        }
        // archSub === 'progs'
        var rows = progRows();
        if (kc === KEY.UP) { if (progIndex === 0) { archSub = 'days'; paintArchive(); } else { progIndex--; paintArchive(); } }
        else if (kc === KEY.DOWN) { if (progIndex < rows.length - 1) { progIndex++; paintArchive(); } }
        else if (kc === KEY.LEFT) { if (progSub === 'pin') { progSub = 'play'; paintArchive(); } else focusSidebar(); }
        else if (kc === KEY.RIGHT) { if (progSub === 'play') { progSub = 'pin'; paintArchive(); } }
        else if (kc === KEY.ENTER) {
            var r = rows[progIndex]; if (!r) return;
            if (progSub === 'pin') doTogglePin(r._listing, r);
            else r.click();
        }
    }

    window.addEventListener('keydown', function (e) {
        var kc = e.keyCode || e.which;

        if (document.activeElement === elSearch) {
            if (kc === KEY.DOWN) { e.preventDefault(); elSearch.blur(); sideIndex = 0; sideSub = 'row'; focusSidebar(); }
            else if (kc === KEY.BACK) { e.preventDefault(); elSearch.blur(); focusSidebar(); }
            return;
        }

        e.preventDefault();

        if (kc === KEY.BACK) {
            if (zone === 'main') { focusSidebar(); return; }
            tvGoBack('../index.html');
            return;
        }

        if (zone === 'sidebar') { onSidebarKey(kc); return; }
        if (zone === 'main') {
            if (mainMode === 'cw') onMainCwKey(kc);
            else onMainArchiveKey(kc);
            return;
        }
    }, true);

    /* ── Header + search wiring ──────────────────────────────────────── */
    document.getElementById('cu-home-btn').addEventListener('click', function () { tvGoBack('../index.html'); });
    document.getElementById('cu-settings-btn').addEventListener('click', function () { window.location.href = '../pages/settings.html'; });
    var _searchTimer = null;
    elSearch.addEventListener('input', function () {
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(function () { sideIndex = 0; sideSub = 'row'; renderSidebar(); }, 200);
    });

    if (typeof window.tvGoBack !== 'function') {
        window.tvGoBack = function (backUrl) {
            if (backUrl) { window.location.href = backUrl; }
            else if (typeof webOS !== 'undefined' && webOS.platformBack) { webOS.platformBack(); }
        };
    }

    /* ── Boot ────────────────────────────────────────────────────────── */
    if (typeof webOSSystem !== 'undefined' && typeof webOSSystem.notifyAppLoaded === 'function') {
        webOSSystem.notifyAppLoaded();
    }
    if (!cfg) { setStatus('No server'); showPlaceholder('No server configured — open Settings first.'); return; }
    if (cfg.type === 'm3u') {
        setStatus('Xtream only');
        showPlaceholder('Catch-up isn’t available for M3U playlists. Switch to an Xtream profile in Settings to watch missed shows.');
        return;
    }
    if (!cfg.server_url) { setStatus('No server'); showPlaceholder('No server configured — open Settings first.'); return; }

    openHome();         // Continue Watching is the default landing view
    focusSidebar();
    loadChannels();
}());
