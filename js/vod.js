/* vod.js — VOD / Series browser, Netflix/Disney+-style rails (WebOS)
   ─────────────────────────────────────────────────────────────────────
   - Horizontal category rails, lazy-loaded as they scroll into view
   - Continue Watching rail (resume positions written by player-vod.js)
   - Global search across the whole library
   - Inline season/episode picker for series
   ES5-friendly (Babel target Chrome 38); no flex `gap` / `inset`.            */
(function () {
    'use strict';

    /* ── Config + helpers (shared via iptv-core.js) ──────────────────── */
    var cfg = IPTVCore.resolveConfig();

    function base()                  { return IPTVCore.base(cfg); }
    function apiUrl(params)          { return IPTVCore.apiUrl(cfg, params); }
    function buildMovieUrl(id, ext)  { return IPTVCore.movieUrl(cfg, id, ext); }
    function buildEpisodeUrl(id, ext){ return IPTVCore.episodeUrl(cfg, id, ext); }
    function cacheGet(key)           { return IPTVCore.cacheGet(key); }
    function cacheSet(key, data)     { return IPTVCore.cacheSet(key, data); }
    function fetchJSON(url)          { return IPTVCore.fetchJSON(url); }
    function fetchCached(key, url)   { return IPTVCore.fetchCached(key, url); }

    function escHtml(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ── Resume / Continue Watching ──────────────────────────────────── */
    var PROGRESS_KEY = 'vod_progress';
    function loadProgress() {
        try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch (e) { return {}; }
    }
    function continueWatching() {
        var p = loadProgress(), out = [];
        for (var k in p) {
            if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
            var e = p[k];
            if (!e || !e.dur || e.pos < 30) continue;            // ignore barely-started
            if (e.pos / e.dur > 0.95) continue;                  // ignore finished
            out.push(e);
        }
        out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
        return out.slice(0, 20);
    }

    /* ── My List (watchlist) ─────────────────────────────────────────── */
    var WATCHLIST_KEY = 'vod_watchlist';
    function loadWatchlist() { try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []; } catch (e) { return []; } }
    function saveWatchlist(w) { try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(w)); } catch (e) {} }
    function wlKey(item) {
        var t = item.__type || (item.series_id ? 'series' : 'movie');
        return t + ':' + (t === 'series' ? item.series_id : item.stream_id);
    }
    function inWatchlist(item) {
        var k = wlKey(item), w = loadWatchlist();
        for (var i = 0; i < w.length; i++) if (w[i].key === k) return true;
        return false;
    }
    function toggleWatchlist(item) {
        var k = wlKey(item), w = loadWatchlist(), idx = -1;
        for (var i = 0; i < w.length; i++) if (w[i].key === k) { idx = i; break; }
        if (idx >= 0) { w.splice(idx, 1); }
        else {
            var t = item.__type || (item.series_id ? 'series' : 'movie');
            var entry = { key: k, __type: t, name: titleOf(item), ts: Date.now() };
            if (t === 'series') { entry.series_id = item.series_id; entry.cover = posterOf(item); }
            else { entry.stream_id = item.stream_id; entry.stream_icon = posterOf(item); }
            w.unshift(entry);
        }
        saveWatchlist(w);
        return idx < 0;   // true if it was just added
    }

    /* ── State ───────────────────────────────────────────────────────── */
    var activeType = 'movie';
    var hidden = {
        movie:  new Set((function () { try { return JSON.parse(localStorage.getItem('iptv_hidden_cats_vod_m') || '[]'); } catch (e) { return []; } }()).map(String)),
        series: new Set((function () { try { return JSON.parse(localStorage.getItem('iptv_hidden_cats_vod_s') || '[]'); } catch (e) { return []; } }()).map(String))
    };
    var cats = { movie: null, series: null };     // category arrays per type
    var RAIL_CAP = 20;                            // max cards rendered per rail

    /* ── DOM refs ────────────────────────────────────────────────────── */
    var elRails    = document.getElementById('vod-rails');
    var elStatus   = document.getElementById('vod-status');
    var elStatusTx = document.getElementById('vod-status-text');
    var elDetail   = document.getElementById('vod-detail');
    var elSearch   = document.getElementById('vod-search-overlay');
    var elSearchIn = document.getElementById('vod-search-input');
    var elSearchGrid = document.getElementById('vod-search-grid');

    /* ── Lazy image loader ───────────────────────────────────────────── */
    var imgObserver = ('IntersectionObserver' in window)
        ? new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    var img = en.target;
                    if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
                    imgObserver.unobserve(img);
                }
            });
        }, { rootMargin: '300px' })
        : null;

    function lazyImg(img, src) {
        if (!src) return;
        if (imgObserver) { img.dataset.src = src; imgObserver.observe(img); }
        else { img.src = src; }
    }

    /* ── Card factory ────────────────────────────────────────────────── */
    function posterOf(m) { return m.stream_icon || m.cover || m.cover_big || m.icon || m.backdrop_path || ''; }
    function titleOf(m)  { return m.name || m.title || 'Untitled'; }
    function yearOf(m)   { return String(m.year || m.releaseDate || m.releasedate || '').slice(0, 4); }
    function ratingOf(m) { return parseFloat(m.rating || m.rating_5based || 0) || 0; }

    function makeCard(item, kind) {
        var card = document.createElement('div');
        card.className = 'vod-card';
        card.tabIndex = -1;

        var poster = document.createElement('div');
        poster.className = 'vod-card-poster';
        var icon = posterOf(item);
        if (icon) {
            var img = document.createElement('img');
            img.alt = ''; img.decoding = 'async';
            img.onerror = function () { poster.classList.add('no-img'); poster.setAttribute('data-letter', titleOf(item).charAt(0)); if (img.parentNode) img.parentNode.removeChild(img); };
            lazyImg(img, icon);
            poster.appendChild(img);
        } else {
            poster.classList.add('no-img');
            poster.setAttribute('data-letter', titleOf(item).charAt(0));
        }

        // progress bar for continue-watching cards
        if (kind === 'progress' && item.dur) {
            var pb = document.createElement('div'); pb.className = 'vod-card-progress';
            var pf = document.createElement('div'); pf.className = 'vod-card-progress-fill';
            pf.style.width = Math.max(2, Math.min(100, (item.pos / item.dur) * 100)) + '%';
            pb.appendChild(pf); poster.appendChild(pb);
        }
        card.appendChild(poster);

        var label = document.createElement('div');
        label.className = 'vod-card-label';
        label.textContent = titleOf(item);
        card.appendChild(label);

        card.addEventListener('click', function () {
            if (kind === 'progress') resumePlay(item);
            else openDetail(item);
        });
        return card;
    }

    /* ── Rails ───────────────────────────────────────────────────────── */
    /* Recycling observer: loads rails near the viewport and UNLOADS rails that
       scroll far away (clears their cards + images but keeps the row height) so
       the DOM/memory stay bounded no matter how many categories exist. */
    var railObserver = ('IntersectionObserver' in window)
        ? new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) ensureRailLoaded(en.target);
                else                   unloadRail(en.target);
            });
        }, { root: elRails, rootMargin: '900px 0px' })
        : null;

    function unloadRail(rail) {
        if (!rail || rail.dataset.loaded !== '1' || rail.dataset.keep === '1') return;
        var rails = railEls();
        if (rails[railIndex] === rail) return;          // never unload the focused rail
        var track = rail.querySelector('.vod-rail-track');
        if (track) {
            if (imgObserver) track.querySelectorAll('img[data-src]').forEach(function (img) { imgObserver.unobserve(img); });
            track.innerHTML = '';
        }
        rail.dataset.loaded = '0';
    }

    function makeRail(titleText, type, catId) {
        var rail = document.createElement('section');
        rail.className = 'vod-rail';
        rail.dataset.type = type || '';
        rail.dataset.catId = catId == null ? '' : catId;
        rail.dataset.loaded = '0';

        var h = document.createElement('h2');
        h.className = 'vod-rail-title';
        h.textContent = titleText;
        rail.appendChild(h);

        var track = document.createElement('div');
        track.className = 'vod-rail-track';
        rail.appendChild(track);
        return rail;
    }

    function fillRail(rail) {
        if (rail.dataset.loaded !== '0') return;
        rail.dataset.loaded = '1';
        var type = rail.dataset.type, catId = rail.dataset.catId;
        var track = rail.querySelector('.vod-rail-track');
        var action = type === 'series' ? 'get_series' : 'get_vod_streams';
        var ck = 'vod_content_' + base() + '_' + type + '_' + catId;
        var url = apiUrl('action=' + action + '&category_id=' + encodeURIComponent(catId));

        // skeleton shimmer while loading
        for (var s = 0; s < 6; s++) { var sk = document.createElement('div'); sk.className = 'vod-card vod-skeleton'; track.appendChild(sk); }

        fetchCached(ck, url).then(function (data) {
            track.innerHTML = '';
            var items = Array.isArray(data) ? data : [];
            if (!items.length) { rail.parentNode && rail.parentNode.removeChild(rail); return; }
            var n = Math.min(items.length, RAIL_CAP);
            var frag = document.createDocumentFragment();
            for (var i = 0; i < n; i++) frag.appendChild(makeCard(items[i], type));
            track.appendChild(frag);
            /* If the user is already sitting on this rail, paint focus now that
               cards exist (lazy load may finish after they navigated here). */
            if (zone === 'rails' && railEls()[railIndex] === rail) paintRailFocus();
        }).catch(function () {
            rail.parentNode && rail.parentNode.removeChild(rail);
        });
    }

    function renderRails() {
        elRails.innerHTML = '';
        railIndex = 0; cardIndex = 0;

        // Continue Watching first (never recycled)
        var cw = continueWatching();
        if (cw.length) {
            var cwRail = makeRail('Continue Watching', '', '');
            cwRail.dataset.loaded = '1';
            cwRail.dataset.keep = '1';
            var track = cwRail.querySelector('.vod-rail-track');
            cw.forEach(function (e) { track.appendChild(makeCard(e, 'progress')); });
            elRails.appendChild(cwRail);
        }

        // My List (saved titles, both types)
        var wl = loadWatchlist();
        if (wl.length) {
            var wlRail = makeRail('My List', '', '');
            wlRail.dataset.loaded = '1';
            wlRail.dataset.keep = '1';
            var wtrack = wlRail.querySelector('.vod-rail-track');
            wl.forEach(function (e) { wtrack.appendChild(makeCard(e, e.__type)); });
            elRails.appendChild(wlRail);
        }

        var list = (cats[activeType] || []).filter(function (c) {
            return !hidden[activeType].has(String(c.category_id));
        });
        list.forEach(function (c, i) {
            var rail = makeRail(c.category_name || 'Unnamed', activeType, c.category_id);
            elRails.appendChild(rail);
            if (railObserver) {
                railObserver.observe(rail);            // observer handles load + unload
                if (i < 2) fillRail(rail);             // eager top rails for instant paint
            } else {
                fillRail(rail);                        // no IO (old WebOS) → load all
            }
        });

        if (!list.length && !cw.length) showStatus('Nothing here yet.', false);
        else hideStatus();
        renderSidebarCats();    /* keep the sidebar category list in sync */
        /* After a (re)render from boot or a section switch, drop focus into the
           rails. Otherwise leave focus where it is (e.g. sidebar open). */
        if (_focusRailsAfterRender) {
            _focusRailsAfterRender = false;
            focusZone('rails');
            paintRailFocus();
        }
    }

    /* ── Category load + section switch ──────────────────────────────── */
    function loadType(type) {
        activeType = type;
        document.querySelectorAll('.vod-nav-item').forEach(function (t) {
            if (t.dataset.action === 'movie' || t.dataset.action === 'series')
                t.classList.toggle('active', t.dataset.action === type);
        });
        if (cats[type]) { renderRails(); return; }
        showStatus('Loading…', true);
        var action = type === 'series' ? 'get_series_categories' : 'get_vod_categories';
        var ck = (type === 'series' ? 'vod_cats_series_' : 'vod_cats_movie_') + base();
        fetchCached(ck, apiUrl('action=' + action)).then(function (data) {
            cats[type] = Array.isArray(data) ? data : [];
            renderRails();
        }).catch(function () {
            cats[type] = [];
            showStatus('Could not load categories.', false);
        });
    }

    /* ── Detail overlay ──────────────────────────────────────────────── */
    var detailItem = null, detailIsSeries = false, seasonsData = null, activeSeason = null;

    function setText(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt || ''; }

    function openDetail(item) {
        detailItem = item;
        detailIsSeries = item.__type ? (item.__type === 'series') : (activeType === 'series' || !!item.series_id);
        prevZone = zone;

        var icon = posterOf(item);
        document.getElementById('vod-detail-poster').src = icon || '';
        var bd = document.getElementById('vod-detail-backdrop');
        bd.style.backgroundImage = icon ? 'url("' + icon + '")' : 'none';

        setText('vod-detail-title', titleOf(item));
        setText('vod-detail-plot', item.plot || item.description || '');
        setText('vod-detail-cast', item.cast || '');
        setText('vod-detail-director', item.director || '');
        document.getElementById('vod-detail-cast-row').style.display = item.cast ? '' : 'none';
        document.getElementById('vod-detail-director-row').style.display = item.director ? '' : 'none';

        var meta = [];
        if (yearOf(item))   meta.push('<span class="vod-meta-badge">' + escHtml(yearOf(item)) + '</span>');
        if (ratingOf(item)) meta.push('<span class="vod-meta-badge gold">★ ' + ratingOf(item).toFixed(1) + '</span>');
        if (item.genre)     meta.push('<span class="vod-meta-badge">' + escHtml(item.genre) + '</span>');
        if (item.duration)  meta.push('<span class="vod-meta-badge">' + escHtml(item.duration) + '</span>');
        document.getElementById('vod-detail-meta').innerHTML = meta.join('');

        var seasonsBox = document.getElementById('vod-seasons');
        var playBtn = document.getElementById('vod-play-btn');

        updateListBtn();              // My List / In My List label

        elDetail.hidden = false;
        detailFocus = 0;

        if (detailIsSeries) {
            playBtn.style.display = 'none';
            seasonsBox.hidden = false;
            loadSeries(item);
        } else {
            playBtn.style.display = '';
            seasonsBox.hidden = true;
            // resume label
            var prog = loadProgress()['m:' + item.stream_id];
            setText('vod-play-label', (prog && prog.pos > 30) ? 'Resume' : 'Play');
            lazyFetchVodInfo(item);
        }
        focusZone('detail');
        paintDetailFocus();
    }

    function updateListBtn() {
        if (!detailItem) return;
        var saved = inWatchlist(detailItem);
        setText('vod-list-label', saved ? 'In My List' : 'My List');
        var icon = document.getElementById('vod-list-icon');
        if (icon) icon.innerHTML = saved
            ? '<path d="M3.5 9.5L7 13l7.5-8" />'          // check
            : '<path d="M9 3v12M3 9h12" />';              // plus
    }

    function closeDetail() {
        elDetail.hidden = true;
        document.getElementById('vod-detail-backdrop').style.backgroundImage = 'none';
        detailItem = null; seasonsData = null;
        focusZone(prevZone === 'search' ? 'search' : 'rails');
        if (zone === 'rails') paintRailFocus(); else paintSearchFocus();
    }

    /* Normalise whatever shape the panel uses for subtitle files. */
    function extractSubs(info) {
        var raw = info && (info.subtitles || info.subtitle);
        if (!Array.isArray(raw)) return [];
        return raw.map(function (s) {
            if (typeof s === 'string') return { url: s };
            return { url: s.url || s.file || s.src || '', lang: s.lang || s.language || s.name || '' };
        }).filter(function (s) { return s.url; });
    }

    /* Lazy-fetch richer movie info (plot/cast) + subtitle files, once per item. */
    function lazyFetchVodInfo(item) {
        if (item._infoFetched || !item.stream_id) return;
        item._infoFetched = true;
        fetchJSON(apiUrl('action=get_vod_info&vod_id=' + encodeURIComponent(item.stream_id)))
            .then(function (data) {
                var info = data && (data.info || data.movie_data || data);
                if (!info) return;
                item._subs = extractSubs(info);
                item.container_extension = item.container_extension || info.container_extension;
                if (detailItem !== item) return;
                if (info.plot || info.description) setText('vod-detail-plot', info.plot || info.description);
                if (info.cast)     { setText('vod-detail-cast', info.cast); document.getElementById('vod-detail-cast-row').style.display = ''; }
                if (info.director) { setText('vod-detail-director', info.director); document.getElementById('vod-detail-director-row').style.display = ''; }
            }).catch(function () {});
    }

    /* ── Series: seasons + episodes ──────────────────────────────────── */
    function loadSeries(item) {
        var tabs = document.getElementById('vod-season-tabs');
        var list = document.getElementById('vod-episode-list');
        tabs.innerHTML = ''; list.innerHTML = '<div class="vod-ep-loading">Loading episodes…</div>';
        seasonsData = null;
        fetchJSON(apiUrl('action=get_series_info&series_id=' + encodeURIComponent(item.series_id)))
            .then(function (data) {
                if (detailItem !== item) return;
                var eps = data && data.episodes;
                if (!eps) { list.innerHTML = '<div class="vod-ep-loading">No episodes found.</div>'; return; }
                seasonsData = eps;
                var seasons = Object.keys(eps).sort(function (a, b) { return (+a) - (+b); });
                tabs.innerHTML = '';
                seasons.forEach(function (sn, i) {
                    var t = document.createElement('button');
                    t.className = 'vod-season-tab' + (i === 0 ? ' active' : '');
                    t.textContent = 'S' + sn;
                    t.dataset.season = sn;
                    t.addEventListener('click', function () { selectSeason(sn); });
                    tabs.appendChild(t);
                });
                if (seasons.length) selectSeason(seasons[0]);
            }).catch(function () {
                list.innerHTML = '<div class="vod-ep-loading">Could not load episodes.</div>';
            });
    }

    function selectSeason(sn) {
        activeSeason = sn;
        document.querySelectorAll('#vod-season-tabs .vod-season-tab').forEach(function (t) {
            t.classList.toggle('active', t.dataset.season === String(sn));
        });
        var list = document.getElementById('vod-episode-list');
        list.innerHTML = '';
        var eps = (seasonsData && seasonsData[sn]) || [];
        eps.forEach(function (ep) {
            var ext = ep.container_extension || (ep.info && ep.info.container_extension) || 'mp4';
            var num = ep.episode_num != null ? ep.episode_num : '';
            var row = document.createElement('button');
            row.className = 'vod-ep-row';
            row.innerHTML =
                '<span class="vod-ep-num">' + escHtml(num) + '</span>' +
                '<span class="vod-ep-name">' + escHtml(ep.title || ('Episode ' + num)) + '</span>' +
                '<span class="vod-ep-play">▶</span>';
            row.addEventListener('click', function () {
                playItem({
                    type: 'episode', id: ep.id, ext: ext,
                    name: (detailItem ? titleOf(detailItem) + ' · ' : '') + (ep.title || ('Episode ' + num)),
                    icon: posterOf(detailItem || {}),
                    series_id: detailItem && detailItem.series_id, season: sn, episode: num
                });
            });
            list.appendChild(row);
        });
        paintDetailFocus();
    }

    /* ── Playback navigation ─────────────────────────────────────────── */
    function playItem(meta) {
        var url = meta.type === 'episode' ? buildEpisodeUrl(meta.id, meta.ext) : buildMovieUrl(meta.id, meta.ext);
        var key = (meta.type === 'episode' ? 'e:' : 'm:') + meta.id;
        try {
            localStorage.setItem('iptv_play_url', url);
            localStorage.setItem('iptv_play_title', meta.name || '');
            localStorage.setItem('iptv_play_meta', JSON.stringify({
                url: url, key: key, type: meta.type, id: meta.id, ext: meta.ext,
                name: meta.name || '', icon: meta.icon || '',
                series_id: meta.series_id || '', season: meta.season || '', episode: meta.episode || '',
                resume: meta.resume || 0, subs: meta.subs || []
            }));
        } catch (e) {}
        window.location.href = '../pages/player.html?url=' + encodeURIComponent(url) +
                               '&title=' + encodeURIComponent(meta.name || '');
    }

    function playCurrentMovie() {
        if (!detailItem) return;
        var ext = detailItem.container_extension || 'mp4';
        var prog = loadProgress()['m:' + detailItem.stream_id];
        playItem({
            type: 'movie', id: detailItem.stream_id, ext: ext,
            name: titleOf(detailItem), icon: posterOf(detailItem),
            resume: (prog && prog.pos > 30) ? prog.pos : 0,
            subs: detailItem._subs || []
        });
    }

    function resumePlay(entry) {
        playItem({
            type: entry.type === 'episode' ? 'episode' : 'movie',
            id: entry.id, ext: entry.ext,
            name: entry.name, icon: entry.icon,
            series_id: entry.series_id, season: entry.season, episode: entry.episode,
            resume: entry.pos || 0
        });
    }

    document.getElementById('vod-play-btn').addEventListener('click', playCurrentMovie);
    document.getElementById('vod-list-btn').addEventListener('click', function () {
        if (!detailItem) return;
        toggleWatchlist(detailItem);
        updateListBtn();
    });

    /* ── Global search (Web Worker, main-thread fallback) ─────────────────
       The whole movie + series catalog can be tens of thousands of titles, so
       fetching + indexing + filtering it on the main thread freezes the app. We
       offload all of that to a worker; if Workers aren't usable on a given TV we
       fall back to a slim in-memory index with early-exit filtering. Either way
       the data is a pre-lower-cased index, not the full objects.                */
    var SEARCH_LIMIT = 40, SEARCH_MIN = 2;
    var searchTimer = null, searchReqId = 0;
    var searchWorker = null, searchReady = false, searchUseWorker = false;
    var searchIndex = null;        // main-thread fallback index

    function openSearch() {
        prevZone = zone;
        elSearch.hidden = false;
        elSearchGrid.innerHTML = '';
        elSearchIn.value = '';
        var hint = document.getElementById('vod-search-hint');
        hint.style.display = ''; hint.textContent = 'Type to search your whole library.';
        focusZone('search');
        setTimeout(function () { elSearchIn.focus(); }, 30);
        initSearchEngine();
    }
    function closeSearch() {
        elSearch.hidden = true;
        elSearchIn.blur();
        focusZone('rails');
        paintRailFocus();
    }

    function initSearchEngine() {
        if (searchWorker || searchIndex) return;     // already initialised
        var movieUrl  = apiUrl('action=get_vod_streams');
        var seriesUrl = apiUrl('action=get_series');
        try {
            if (typeof Worker === 'undefined') throw new Error('no worker');
            searchWorker = new Worker('../dist/js/vod-search-worker.js');
            searchUseWorker = true;
            searchWorker.onmessage = function (ev) {
                var d = ev.data || {};
                if (d.cmd === 'ready') { searchReady = true; if (!elSearch.hidden) runSearch(); }
                else if (d.cmd === 'results') {
                    if (d.reqId !== searchReqId) return;   // a newer query superseded this
                    renderSearchResults(d.items, d.q, d.ready);
                }
            };
            searchWorker.onerror = function () { searchWorker = null; searchUseWorker = false; initFallbackSearch(movieUrl, seriesUrl); };
            searchWorker.postMessage({ cmd: 'load', movieUrl: movieUrl, seriesUrl: seriesUrl });
        } catch (e) {
            initFallbackSearch(movieUrl, seriesUrl);
        }
    }

    function buildIndexInto(idx, arr, type) {
        if (!Array.isArray(arr)) return;
        for (var i = 0; i < arr.length; i++) {
            var m = arr[i], id = type === 'series' ? m.series_id : m.stream_id;
            if (id === undefined || id === null) continue;
            var nm = m.name || m.title || '';
            idx.push({ id: id, type: type, name: nm, lc: nm.toLowerCase(),
                       icon: m.stream_icon || m.cover || m.cover_big || m.icon || '' });
        }
    }
    function initFallbackSearch(movieUrl, seriesUrl) {
        if (searchIndex) return;
        searchIndex = [];
        var pending = 2;
        function done() { pending--; if (pending === 0) { searchReady = true; if (!elSearch.hidden) runSearch(); } }
        fetchJSON(movieUrl).then(function (d) { buildIndexInto(searchIndex, d, 'movie'); done(); }).catch(done);
        fetchJSON(seriesUrl).then(function (d) { buildIndexInto(searchIndex, d, 'series'); done(); }).catch(done);
    }
    function mainThreadSearch(q) {
        q = q.toLowerCase();
        var out = [];
        for (var i = 0; i < searchIndex.length && out.length < SEARCH_LIMIT; i++) {
            var it = searchIndex[i];
            if (it.lc.indexOf(q) === -1) continue;
            if (it.type === 'series') out.push({ series_id: it.id, name: it.name, cover: it.icon, __type: 'series' });
            else                      out.push({ stream_id: it.id, name: it.name, stream_icon: it.icon, __type: 'movie' });
        }
        return out;
    }

    function runSearch() {
        var q = elSearchIn.value.trim();
        var hint = document.getElementById('vod-search-hint');
        if (q.length < SEARCH_MIN) {
            elSearchGrid.innerHTML = '';
            hint.style.display = ''; hint.textContent = 'Type at least ' + SEARCH_MIN + ' characters to search.';
            return;
        }
        searchReqId++;
        if (searchUseWorker && searchWorker) {
            searchWorker.postMessage({ cmd: 'search', q: q, limit: SEARCH_LIMIT, reqId: searchReqId });
        } else if (searchIndex) {
            renderSearchResults(mainThreadSearch(q), q.toLowerCase(), searchReady);
        } else {
            hint.style.display = ''; hint.textContent = 'Preparing search…';
        }
    }

    function renderSearchResults(items, q, ready) {
        var hint = document.getElementById('vod-search-hint');
        elSearchGrid.innerHTML = '';
        if (!items || !items.length) {
            hint.style.display = '';
            hint.textContent = ready ? ('No results for "' + q + '".') : 'Preparing search…';
            return;
        }
        hint.style.display = 'none';
        var frag = document.createDocumentFragment();
        items.forEach(function (m) { frag.appendChild(makeCard(m, m.__type)); });
        elSearchGrid.appendChild(frag);
        searchFocus = 0;
    }

    elSearchIn.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(runSearch, 300);
    });

    /* ── Status helpers ──────────────────────────────────────────────── */
    function showStatus(text, spinner) {
        elStatus.style.display = 'flex';
        elStatusTx.textContent = text;
        elStatus.querySelector('.vod-spinner').style.display = spinner ? '' : 'none';
        elRails.style.display = 'none';
    }
    function hideStatus() { elStatus.style.display = 'none'; elRails.style.display = ''; }

    /* ── D-pad navigation ────────────────────────────────────────────── */
    var KEY = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, BACK: 461 };
    var zone = 'rails', prevZone = 'rails';
    var sidebarIndex = 1;                // 0 search, 1 movies, 2 series, 3 settings
    var railIndex = 0, cardIndex = 0;
    var detailFocus = 0;
    var searchFocus = 0;
    var _focusRailsAfterRender = false;

    function focusZone(z) { zone = z; clearRings(); }
    function clearRings() {
        document.querySelectorAll('.tv-focus-visible').forEach(function (el) { el.classList.remove('tv-focus-visible'); });
    }

    /* ── Sidebar (collapsible left nav + categories) ─────────────────── */
    function sidebarEl() { return document.getElementById('vod-sidebar'); }
    function navItems()  { return Array.prototype.slice.call(document.querySelectorAll('#vod-sidebar .vod-nav-item')); }
    /* Focusable sidebar items = top sections + (when expanded) categories. */
    function sidebarItems() {
        return Array.prototype.slice.call(document.querySelectorAll('#vod-sidebar .vod-nav-item, #vod-sidebar .vod-cat-item'))
            .filter(function (el) { return el.offsetParent !== null; });
    }

    /* Build the category list for the active section. */
    function renderSidebarCats() {
        var wrap = document.getElementById('vod-nav-cats');
        wrap.innerHTML = '';
        var list = (cats[activeType] || []).filter(function (c) {
            return !hidden[activeType].has(String(c.category_id));
        });
        if (!list.length) return;
        var head = document.createElement('div');
        head.className = 'vod-cat-header';
        head.textContent = 'Categories';
        wrap.appendChild(head);
        list.forEach(function (c) {
            var b = document.createElement('button');
            b.className = 'vod-cat-item';
            b.dataset.catId = c.category_id;
            b.textContent = c.category_name || 'Unnamed';
            b.addEventListener('click', function () { jumpToCategory(c.category_id); });
            wrap.appendChild(b);
        });
    }

    /* Jump the rails to a given category and focus it. */
    function jumpToCategory(catId) {
        collapseSidebar();
        focusZone('rails');
        var rails = railEls(), target = null, idx = 0;
        for (var i = 0; i < rails.length; i++) {
            if (rails[i].dataset.catId === String(catId)) { target = rails[i]; idx = i; break; }
        }
        if (target) {
            railIndex = idx; cardIndex = 0;
            ensureRailLoaded(target);
        }
        paintRailFocus();
        if (target) { try { target.scrollIntoView({ block: 'start' }); } catch (e) {} }
    }

    function openSidebar() {
        focusZone('sidebar');
        sidebarEl().classList.add('expanded');
        sidebarIndex = (activeType === 'series') ? 2 : 1;   // land on current section
        paintSidebarFocus();
    }
    function collapseSidebar() { sidebarEl().classList.remove('expanded'); }
    function paintSidebarFocus() {
        clearRings();
        var items = sidebarItems();
        if (!items.length) return;
        sidebarIndex = Math.max(0, Math.min(items.length - 1, sidebarIndex));
        var el = items[sidebarIndex];
        el.classList.add('tv-focus-visible');
        el.scrollIntoView({ block: 'nearest' });
    }
    function activateNav(item) {
        if (!item) return;
        var action = item.dataset.action;
        if (action === 'search') { collapseSidebar(); openSearch(); }
        else if (action === 'settings') { window.location.href = '../pages/settings.html'; }
        else {
            collapseSidebar();
            if (action !== activeType) { _focusRailsAfterRender = true; focusZone('rails'); loadType(action); }
            else { focusZone('rails'); paintRailFocus(); }
        }
    }

    function railEls() { return Array.prototype.slice.call(elRails.querySelectorAll('.vod-rail')); }
    function railCards(rail) { return rail ? Array.prototype.slice.call(rail.querySelectorAll('.vod-card:not(.vod-skeleton)')) : []; }
    function paintRailFocus() {
        clearRings();
        var rails = railEls();
        if (!rails.length) { openSidebar(); return; }
        railIndex = Math.max(0, Math.min(rails.length - 1, railIndex));
        ensureRailLoaded(rails[railIndex]);     // focused rail may have been recycled
        var cards = railCards(rails[railIndex]);
        if (!cards.length) return;              // cards arrive async → fillRail repaints
        cardIndex = Math.max(0, Math.min(cards.length - 1, cardIndex));
        var card = cards[cardIndex];
        card.classList.add('tv-focus-visible');
        card.scrollIntoView({ block: 'nearest', inline: 'center' });
        rails[railIndex].scrollIntoView({ block: 'nearest' });
    }

    function detailItems() {
        var arr = [];
        var playBtn = document.getElementById('vod-play-btn');
        var listBtn = document.getElementById('vod-list-btn');
        if (playBtn.style.display !== 'none') arr.push(playBtn);
        if (listBtn) arr.push(listBtn);
        arr = arr.concat(Array.prototype.slice.call(document.querySelectorAll('#vod-season-tabs .vod-season-tab')));
        arr = arr.concat(Array.prototype.slice.call(document.querySelectorAll('#vod-episode-list .vod-ep-row')));
        return arr;
    }
    function paintDetailFocus() {
        clearRings();
        var items = detailItems();
        if (!items.length) return;
        detailFocus = Math.max(0, Math.min(items.length - 1, detailFocus));
        items[detailFocus].classList.add('tv-focus-visible');
        items[detailFocus].scrollIntoView({ block: 'nearest' });
    }

    function searchCards() { return Array.prototype.slice.call(elSearchGrid.querySelectorAll('.vod-card')); }
    function searchCols() {
        var cards = searchCards();
        if (cards.length < 2) return 1;
        var top = Math.round(cards[0].getBoundingClientRect().top), n = 0;
        for (var i = 0; i < cards.length; i++) { if (Math.round(cards[i].getBoundingClientRect().top) !== top) break; n++; }
        return n || 1;
    }
    function paintSearchFocus() {
        clearRings();
        var cards = searchCards();
        if (!cards.length) { elSearchIn.classList.add('tv-focus-visible'); return; }
        searchFocus = Math.max(0, Math.min(cards.length - 1, searchFocus));
        cards[searchFocus].classList.add('tv-focus-visible');
        cards[searchFocus].scrollIntoView({ block: 'nearest' });
    }

    window.addEventListener('keydown', function (e) {
        var kc = e.keyCode || e.which;

        /* When typing in the search box */
        if (document.activeElement === elSearchIn) {
            if (kc === KEY.DOWN) { e.preventDefault(); elSearchIn.blur(); paintSearchFocus(); }
            else if (kc === KEY.BACK) { e.preventDefault(); elSearchIn.blur(); closeSearch(); }
            return;
        }

        e.preventDefault();

        /* Detail overlay */
        if (!elDetail.hidden) {
            if (kc === KEY.BACK) { closeDetail(); return; }
            var di = detailItems();
            if (kc === KEY.DOWN) { detailFocus = Math.min(di.length - 1, detailFocus + 1); paintDetailFocus(); }
            else if (kc === KEY.UP) { if (detailFocus === 0) { closeDetail(); } else { detailFocus--; paintDetailFocus(); } }
            else if (kc === KEY.LEFT || kc === KEY.RIGHT) {
                // move between season tabs if focused on one
                var cur = di[detailFocus];
                if (cur && cur.classList.contains('vod-season-tab')) {
                    var tabs = Array.prototype.slice.call(document.querySelectorAll('#vod-season-tabs .vod-season-tab'));
                    var ti = tabs.indexOf(cur) + (kc === KEY.RIGHT ? 1 : -1);
                    if (ti >= 0 && ti < tabs.length) { detailFocus = di.indexOf(tabs[ti]); paintDetailFocus(); }
                }
            } else if (kc === KEY.ENTER) { if (di[detailFocus]) di[detailFocus].click(); }
            return;
        }

        /* Search overlay */
        if (!elSearch.hidden) {
            if (kc === KEY.BACK) { closeSearch(); return; }
            var cards = searchCards(), cols = searchCols();
            if (kc === KEY.UP) {
                if (searchFocus < cols) { elSearchIn.classList.remove('tv-focus-visible'); elSearchIn.focus(); }
                else { searchFocus -= cols; paintSearchFocus(); }
            } else if (kc === KEY.DOWN) { searchFocus = Math.min(cards.length - 1, searchFocus + cols); paintSearchFocus(); }
            else if (kc === KEY.LEFT)  { if (searchFocus % cols !== 0) { searchFocus--; paintSearchFocus(); } }
            else if (kc === KEY.RIGHT) { searchFocus = Math.min(cards.length - 1, searchFocus + 1); paintSearchFocus(); }
            else if (kc === KEY.ENTER) { if (cards[searchFocus]) cards[searchFocus].click(); }
            return;
        }

        /* Sidebar */
        if (zone === 'sidebar') {
            if (kc === KEY.BACK)  { collapseSidebar(); history.back(); return; }
            var si = sidebarItems();
            if (kc === KEY.UP)        { sidebarIndex = Math.max(0, sidebarIndex - 1); paintSidebarFocus(); }
            else if (kc === KEY.DOWN) { sidebarIndex = Math.min(si.length - 1, sidebarIndex + 1); paintSidebarFocus(); }
            else if (kc === KEY.RIGHT){ collapseSidebar(); focusZone('rails'); paintRailFocus(); }
            else if (kc === KEY.ENTER){
                var it = si[sidebarIndex];
                if (it && it.className.indexOf('vod-cat-item') !== -1) jumpToCategory(it.dataset.catId);
                else activateNav(it);
            }
            return;
        }

        /* Rails */
        if (zone === 'rails') {
            if (kc === KEY.BACK) { openSidebar(); return; }
            var rails = railEls();
            if (kc === KEY.UP) {
                if (railIndex > 0) { railIndex--; ensureRailLoaded(rails[railIndex]); paintRailFocus(); }
            } else if (kc === KEY.DOWN) {
                if (railIndex < rails.length - 1) { railIndex++; ensureRailLoaded(rails[railIndex]); paintRailFocus(); }
            } else if (kc === KEY.LEFT) {
                if (cardIndex > 0) { cardIndex--; paintRailFocus(); }
                else { openSidebar(); }                 // LEFT at the first card opens the sidebar
            } else if (kc === KEY.RIGHT) { cardIndex++; paintRailFocus(); }
            else if (kc === KEY.ENTER) {
                var cards2 = railCards(rails[railIndex]);
                if (cards2[cardIndex]) cards2[cardIndex].click();
            }
            return;
        }
    });

    function ensureRailLoaded(rail) {
        if (rail && rail.dataset.loaded === '0') fillRail(rail);
    }

    /* ── Wire sidebar + overlays ─────────────────────────────────────── */
    navItems().forEach(function (it) {
        it.addEventListener('click', function () {
            // a click also implies focus on that item
            sidebarIndex = navItems().indexOf(it);
            activateNav(it);
        });
    });
    document.getElementById('vod-detail-close').addEventListener('click', closeDetail);
    document.getElementById('vod-search-close').addEventListener('click', closeSearch);

    /* ── Boot ────────────────────────────────────────────────────────── */
    if (!cfg) { showStatus('No server configured — open Settings first.', false); return; }
    if (cfg.type === 'm3u') { showStatus('VOD isn’t available for M3U playlists. Switch to an Xtream profile in Settings to browse movies & series.', false); return; }
    if (!cfg.server_url) { showStatus('No server configured — open Settings first.', false); return; }
    cardIndex = 0; railIndex = 0;
    zone = 'rails';
    _focusRailsAfterRender = true;   // land in the rails once content first renders
    loadType('movie');
}());
