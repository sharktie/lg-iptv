/* player-vod.js — VOD player glue: reads ?url=, starts playback, drives the
 * OSD and the D-pad. Pairs with player.js (the IPTVPlayer instance `player`).
 * Previously missing, which left pages/player.html unable to play anything. */
(function () {
    'use strict';

    var KEY = {
        LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13,
        BACK: 461, ESC: 27,
        PLAY: 415, PAUSE: 19, PLAYPAUSE: 463, STOP: 413,
        FF: 417, RW: 412
    };

    var video = document.getElementById('player');
    var osd    = document.getElementById('osd');

    /* ── Params ──────────────────────────────────────────────────────────── */
    function param(name) {
        var m = window.location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
        return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    }
    function lsGet(key) { try { return localStorage.getItem(key) || ''; } catch (e) { return ''; } }

    var url   = param('url')   || lsGet('iptv_play_url');
    var title = param('title') || lsGet('iptv_play_title');

    /* Resume / progress metadata written by vod.js. Ignore it unless it matches
       this exact URL, so a stale entry from a previous play can't apply here. */
    var meta = null;
    try { meta = JSON.parse(lsGet('iptv_play_meta') || 'null'); } catch (e) { meta = null; }
    if (meta && meta.url !== url) meta = null;
    var resumeAt = (meta && meta.resume > 0) ? meta.resume : 0;
    var _resumed = false;

    var titleEl = document.getElementById('player-title');
    if (titleEl) titleEl.textContent = title || '';

    /* ── Start playback ──────────────────────────────────────────────────── */
    if (url && window.player && typeof player.play === 'function') {
        player.play(url);
    } else {
        var msg = document.getElementById('player-msg');
        if (msg) { msg.textContent = 'Nothing to play.'; msg.style.display = 'flex'; }
    }

    /* ── Resume position + save progress (Continue Watching) ─────────────── */
    function seekToResume() {
        if (_resumed || resumeAt <= 0) return;
        if (!isFinite(video.duration) || video.duration <= 0) return;
        if (resumeAt < video.duration - 5) {
            try { video.currentTime = resumeAt; } catch (e) {}
        }
        _resumed = true;
    }
    video.addEventListener('loadedmetadata', seekToResume);
    video.addEventListener('canplay', seekToResume);

    var _lastSave = 0;
    function saveProgress(finished) {
        if (!meta || !meta.key) return;
        var dur = video.duration, pos = video.currentTime;
        if (!isFinite(dur) || dur <= 0) return;
        try {
            var all = JSON.parse(localStorage.getItem('vod_progress') || '{}');
            if (finished || pos / dur > 0.95) {
                delete all[meta.key];                 // drop finished titles
            } else if (pos > 30) {
                all[meta.key] = {
                    key: meta.key, type: meta.type, id: meta.id, ext: meta.ext,
                    name: meta.name, icon: meta.icon,
                    series_id: meta.series_id, season: meta.season, episode: meta.episode,
                    pos: pos, dur: dur, ts: Date.now()
                };
            }
            localStorage.setItem('vod_progress', JSON.stringify(all));
        } catch (e) {}
    }
    video.addEventListener('timeupdate', function () {
        var now = Date.now();
        if (now - _lastSave > 5000) { _lastSave = now; saveProgress(false); }
    });
    video.addEventListener('ended', function () { saveProgress(true); });
    window.addEventListener('pagehide', function () { saveProgress(false); });

    /* ── OSD show / auto-hide ────────────────────────────────────────────── */
    var osdTimer = null;
    function showOsd() {
        if (!osd) return;
        osd.classList.remove('osd-hidden');
        clearTimeout(osdTimer);
        osdTimer = setTimeout(hideOsd, 4000);
    }
    function hideOsd() {
        if (osd && !video.paused) osd.classList.add('osd-hidden');
    }
    function osdVisible() { return osd && !osd.classList.contains('osd-hidden'); }

    /* ── Controls ────────────────────────────────────────────────────────── */
    var controls = ['ctrl-rewind', 'ctrl-play', 'ctrl-forward', 'ctrl-mute', 'ctrl-subs', 'ctrl-fullscreen']
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);
    var backBtn  = document.getElementById('player-back-btn');
    var focusRow = backBtn ? [backBtn].concat(controls) : controls.slice();
    var focusIdx = focusRow.indexOf(document.getElementById('ctrl-play'));
    if (focusIdx < 0) focusIdx = 0;

    function paintFocus() {
        focusRow.forEach(function (el, i) {
            el.classList.toggle('tv-focus-visible', i === focusIdx);
        });
    }

    function togglePlay() {
        if (video.paused) video.play().catch(function () {}); else video.pause();
    }
    function seek(delta) {
        if (!isFinite(video.duration)) return;
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
    }
    function toggleMute() { video.muted = !video.muted; updateMuteIcon(); }

    function toggleFullscreen() {
        var el = document.documentElement;
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
        } else {
            (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
        }
    }

    function activate(el) {
        if (!el) return;
        switch (el.id) {
            case 'player-back-btn':  goBack();          break;
            case 'ctrl-rewind':      seek(-10);         break;
            case 'ctrl-play':        togglePlay();      break;
            case 'ctrl-forward':     seek(30);          break;
            case 'ctrl-mute':        toggleMute();      break;
            case 'ctrl-subs':        openSubs();        break;
            case 'ctrl-fullscreen':  toggleFullscreen();break;
        }
    }

    /* ── Subtitles ───────────────────────────────────────────────────────── */
    var subsMenu = document.getElementById('subs-menu');
    var subsList = document.getElementById('subs-menu-list');
    var subsOpen = false, subsIdx = 0, subsOptions = [];
    var activeSubLabel = 'off';
    var SUBS_PREF_KEY = 'vod_subs_pref';

    function buildSubsOptions() {
        var tracks = (window.player && player.listSubtitles) ? player.listSubtitles() : [];
        subsOptions = [{ label: 'Off', track: 'off' }];
        tracks.forEach(function (t) { subsOptions.push({ label: t.label, track: t }); });
    }
    function openSubs() {
        buildSubsOptions();
        subsList.innerHTML = '';
        subsOptions.forEach(function (opt, i) {
            var b = document.createElement('button');
            b.className = 'subs-opt' + (opt.label.toLowerCase() === activeSubLabel ? ' current' : '');
            b.textContent = opt.label;
            b.addEventListener('click', function () { subsIdx = i; applySubs(); });
            subsList.appendChild(b);
        });
        subsIdx = 0;
        for (var i = 0; i < subsOptions.length; i++) {
            if (subsOptions[i].label.toLowerCase() === activeSubLabel) { subsIdx = i; break; }
        }
        if (osd) osd.classList.remove('osd-hidden');   // keep OSD visible behind the menu
        subsMenu.hidden = false; subsOpen = true; paintSubs();
        clearTimeout(osdTimer);   // keep OSD up while choosing
    }
    function closeSubs() { subsMenu.hidden = true; subsOpen = false; paintFocus(); showOsd(); }
    function paintSubs() {
        var opts = subsList.querySelectorAll('.subs-opt');
        for (var i = 0; i < opts.length; i++) opts[i].classList.toggle('tv-focus-visible', i === subsIdx);
    }
    function applySubs() {
        var opt = subsOptions[subsIdx];
        if (!opt) { closeSubs(); return; }
        if (window.player && player.setSubtitle) player.setSubtitle(opt.track);
        activeSubLabel = (opt.label || 'off').toLowerCase();
        try { localStorage.setItem(SUBS_PREF_KEY, activeSubLabel); } catch (e) {}
        closeSubs();
    }

    function goBack() {
        try { player.destroyHls(); } catch (e) {}
        try { video.pause(); } catch (e) {}
        if (window.history.length > 1) window.history.back();
        else window.location.href = '../pages/vod.html';
    }

    /* ── Icon state ──────────────────────────────────────────────────────── */
    function updatePlayIcon() {
        var btn = document.getElementById('ctrl-play');
        if (!btn) return;
        var pl = btn.querySelector('.icon-play'), pa = btn.querySelector('.icon-pause');
        if (pl && pa) { pl.style.display = video.paused ? '' : 'none'; pa.style.display = video.paused ? 'none' : ''; }
    }
    function updateMuteIcon() {
        var btn = document.getElementById('ctrl-mute');
        if (!btn) return;
        var v = btn.querySelector('.icon-vol'), m = btn.querySelector('.icon-mute');
        if (v && m) { v.style.display = video.muted ? 'none' : ''; m.style.display = video.muted ? '' : 'none'; }
    }

    /* ── Scrubber ────────────────────────────────────────────────────────── */
    function fmt(t) {
        if (!isFinite(t) || t < 0) t = 0;
        var s = Math.floor(t % 60), m = Math.floor(t / 60) % 60, h = Math.floor(t / 3600);
        var mm = (h && m < 10 ? '0' : '') + m, ss = (s < 10 ? '0' : '') + s;
        return (h ? h + ':' : '') + mm + ':' + ss;
    }
    var fill = document.getElementById('osd-seek-fill');
    var buf  = document.getElementById('osd-seek-buf');
    var thumb = document.getElementById('osd-seek-thumb');
    var curEl = document.getElementById('osd-time-cur');
    var durEl = document.getElementById('osd-time-dur');

    function updateProgress() {
        var d = video.duration;
        if (!isFinite(d) || d <= 0) return;
        var pct = (video.currentTime / d) * 100;
        if (fill)  fill.style.width = pct + '%';
        if (thumb) thumb.style.left = pct + '%';
        if (curEl) curEl.textContent = fmt(video.currentTime);
        if (durEl) durEl.textContent = fmt(d);
        if (buf && video.buffered && video.buffered.length) {
            buf.style.width = ((video.buffered.end(video.buffered.length - 1) / d) * 100) + '%';
        }
    }

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('durationchange', updateProgress);
    video.addEventListener('play',  function () { updatePlayIcon(); showOsd(); });
    video.addEventListener('pause', function () { updatePlayIcon(); showOsd(); });
    video.addEventListener('ended', function () { showOsd(); osd && osd.classList.remove('osd-hidden'); });

    /* ── Click support (touch / pointer TVs) ─────────────────────────────── */
    focusRow.forEach(function (el, i) {
        el.addEventListener('click', function () { focusIdx = i; paintFocus(); activate(el); showOsd(); });
    });

    /* ── D-pad ───────────────────────────────────────────────────────────── */
    window.addEventListener('keydown', function (e) {
        var kc = e.keyCode || e.which;

        // Subtitle menu captures input while open
        if (subsOpen) {
            e.preventDefault();
            if (kc === KEY.UP)        { if (subsIdx > 0) { subsIdx--; paintSubs(); } }
            else if (kc === KEY.DOWN) { if (subsIdx < subsOptions.length - 1) { subsIdx++; paintSubs(); } }
            else if (kc === KEY.ENTER){ applySubs(); }
            else                      { closeSubs(); }   // BACK / LEFT / RIGHT / etc.
            return;
        }

        if (kc === KEY.BACK || kc === KEY.ESC) { e.preventDefault(); goBack(); return; }

        // Dedicated media keys work regardless of OSD state
        if (kc === KEY.PLAY || kc === KEY.PAUSE || kc === KEY.PLAYPAUSE) { e.preventDefault(); togglePlay(); showOsd(); return; }
        if (kc === KEY.FF) { e.preventDefault(); seek(30);  showOsd(); return; }
        if (kc === KEY.RW) { e.preventDefault(); seek(-10); showOsd(); return; }
        if (kc === KEY.STOP) { e.preventDefault(); goBack(); return; }

        var isNav = kc === KEY.LEFT || kc === KEY.RIGHT || kc === KEY.UP || kc === KEY.DOWN || kc === KEY.ENTER;
        if (!isNav) return;
        e.preventDefault();

        // First press while hidden just reveals the OSD
        if (!osdVisible()) { showOsd(); paintFocus(); return; }
        showOsd();

        if (kc === KEY.LEFT) {
            if (focusIdx > 0) { focusIdx--; paintFocus(); }
        } else if (kc === KEY.RIGHT) {
            if (focusIdx < focusRow.length - 1) { focusIdx++; paintFocus(); }
        } else if (kc === KEY.UP) {
            if (backBtn) { focusIdx = 0; paintFocus(); }
        } else if (kc === KEY.DOWN) {
            var playI = focusRow.indexOf(document.getElementById('ctrl-play'));
            if (playI >= 0) { focusIdx = playI; paintFocus(); }
        } else if (kc === KEY.ENTER) {
            activate(focusRow[focusIdx]);
        }
    }, true);

    /* ── Init ────────────────────────────────────────────────────────────── */
    updatePlayIcon();
    updateMuteIcon();
    paintFocus();
    showOsd();

    /* External subtitle files passed from vod.js (best-effort) */
    if (meta && meta.subs && meta.subs.length && window.player && player.addExternalSubs) {
        player.addExternalSubs(meta.subs);
    }
    /* Re-apply the user's last subtitle choice once tracks have loaded */
    try { activeSubLabel = localStorage.getItem(SUBS_PREF_KEY) || 'off'; } catch (e) {}
    if (activeSubLabel && activeSubLabel !== 'off') {
        setTimeout(function () {
            buildSubsOptions();
            for (var i = 0; i < subsOptions.length; i++) {
                if (subsOptions[i].label.toLowerCase() === activeSubLabel) {
                    if (window.player && player.setSubtitle) player.setSubtitle(subsOptions[i].track);
                    break;
                }
            }
        }, 2500);
    }
}());
