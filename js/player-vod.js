/* player-vod.js — boot + OSD controller for the VOD player page
   Requires: player.js (IPTVPlayer class) to be loaded first.
   ─────────────────────────────────────────────────────────────── */
(function () {
    'use strict';

    /* ── 1. Resolve URL & title from query string / localStorage ──── */
    var params = new URLSearchParams(window.location.search);
    var url    = params.get('url')   || localStorage.getItem('iptv_play_url')   || '';
    var title  = params.get('title') || localStorage.getItem('iptv_play_title') || '';

    var elTitle   = document.getElementById('player-title');
    var elOsd     = document.getElementById('osd');
    var elVideo   = document.getElementById('player');
    var elSeekFill  = document.getElementById('osd-seek-fill');
    var elSeekBuf   = document.getElementById('osd-seek-buf');
    var elSeekThumb = document.getElementById('osd-seek-thumb');
    var elSeekTrack = document.getElementById('osd-seek-track');
    var elTimeCur   = document.getElementById('osd-time-cur');
    var elTimeDur   = document.getElementById('osd-time-dur');
    var elIconPlay  = document.querySelector('.icon-play');
    var elIconPause = document.querySelector('.icon-pause');
    var elIconVol   = document.querySelector('.icon-vol');
    var elIconMute  = document.querySelector('.icon-mute');
    var elIconFsEnter = document.querySelector('.icon-fs-enter');
    var elIconFsExit  = document.querySelector('.icon-fs-exit');

    /* ── 2. Show title ───────────────────────────────────────────── */
    if (elTitle && title) elTitle.textContent = decodeURIComponent(title);

    /* ── 3. Start playback ───────────────────────────────────────── */
    if (url) {
        player.play(decodeURIComponent(url));
        showOsd(); // show OSD briefly at start
    } else {
        var msg = document.getElementById('player-msg');
        if (msg) { msg.textContent = 'No stream URL found.'; msg.style.display = 'flex'; }
    }

    /* ── 4. OSD auto-hide ────────────────────────────────────────── */
    var _osdTimer = null;
    var _osdVisible = false;
    var _seeking = false;

    function showOsd(durationMs) {
        _osdVisible = true;
        elOsd.classList.remove('osd-hidden');
        clearTimeout(_osdTimer);
        _osdTimer = setTimeout(hideOsd, durationMs || 4000);
    }

    function hideOsd() {
        if (_seeking) return;
        _osdVisible = false;
        elOsd.classList.add('osd-hidden');
    }

    function toggleOsd() {
        if (_osdVisible) hideOsd();
        else showOsd();
    }

    /* ── 5. Time formatting ──────────────────────────────────────── */
    function fmtTime(secs) {
        if (!isFinite(secs) || secs < 0) return '--:--';
        var s = Math.floor(secs);
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var sec = s % 60;
        var mm = String(m).padStart(2, '0');
        var ss = String(sec).padStart(2, '0');
        return h > 0 ? h + ':' + mm + ':' + ss : m + ':' + ss;
    }

    /* ── 6. Scrubber / progress updates ──────────────────────────── */
    function updateProgress() {
        var cur = elVideo.currentTime || 0;
        var dur = elVideo.duration    || 0;
        var pct = dur > 0 ? (cur / dur) * 100 : 0;

        elSeekFill.style.width  = pct + '%';
        elSeekThumb.style.left  = pct + '%';
        elTimeCur.textContent   = fmtTime(cur);
        elTimeDur.textContent   = dur > 0 ? fmtTime(dur) : '--:--';

        /* Buffered */
        if (elVideo.buffered.length > 0) {
            var bufEnd = elVideo.buffered.end(elVideo.buffered.length - 1);
            elSeekBuf.style.width = dur > 0 ? (bufEnd / dur * 100) + '%' : '0%';
        }
    }

    elVideo.addEventListener('timeupdate', updateProgress);
    elVideo.addEventListener('durationchange', updateProgress);
    elVideo.addEventListener('progress', updateProgress);

    /* ── 7. Play / pause icon sync ───────────────────────────────── */
    function syncPlayIcon() {
        var paused = elVideo.paused;
        elIconPlay.style.display  = paused  ? '' : 'none';
        elIconPause.style.display = !paused ? '' : 'none';
    }
    elVideo.addEventListener('play',  syncPlayIcon);
    elVideo.addEventListener('pause', syncPlayIcon);
    elVideo.addEventListener('ended', syncPlayIcon);

    /* ── 8. Mute icon sync ───────────────────────────────────────── */
    function syncMuteIcon() {
        var muted = elVideo.muted || elVideo.volume === 0;
        elIconVol.style.display  = muted ? 'none' : '';
        elIconMute.style.display = muted ? '' : 'none';
    }
    elVideo.addEventListener('volumechange', syncMuteIcon);

    /* ── 9. Fullscreen icon sync ─────────────────────────────────── */
    function syncFsIcon() {
        var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        elIconFsEnter.style.display = isFs ? 'none' : '';
        elIconFsExit.style.display  = isFs ? '' : 'none';
    }
    document.addEventListener('fullscreenchange', syncFsIcon);
    document.addEventListener('webkitfullscreenchange', syncFsIcon);

    /* ── 10. Seek bar — mouse / touch ────────────────────────────── */
    function seekToEvent(e) {
        var rect = elSeekTrack.getBoundingClientRect();
        var x    = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        var pct  = Math.max(0, Math.min(1, x / rect.width));
        if (isFinite(elVideo.duration)) elVideo.currentTime = pct * elVideo.duration;
    }

    elSeekTrack.addEventListener('mousedown', function (e) {
        _seeking = true;
        seekToEvent(e);
        showOsd(8000);
    });
    window.addEventListener('mousemove', function (e) {
        if (_seeking) seekToEvent(e);
    });
    window.addEventListener('mouseup', function () {
        if (_seeking) { _seeking = false; showOsd(3000); }
    });

    /* ── 11. Button click handlers ───────────────────────────────── */
    document.getElementById('player-back-btn').addEventListener('click', function () {
        player.destroyHls();
        elVideo.pause();
        history.back();
    });

    document.getElementById('ctrl-play').addEventListener('click', function () {
        if (elVideo.paused) elVideo.play().catch(function () {});
        else                elVideo.pause();
        showOsd(3000);
    });

    document.getElementById('ctrl-rewind').addEventListener('click', function () {
        elVideo.currentTime = Math.max(0, elVideo.currentTime - 10);
        showOsd(3000);
    });

    document.getElementById('ctrl-forward').addEventListener('click', function () {
        elVideo.currentTime = Math.min(elVideo.duration || Infinity, elVideo.currentTime + 30);
        showOsd(3000);
    });

    document.getElementById('ctrl-mute').addEventListener('click', function () {
        elVideo.muted = !elVideo.muted;
        showOsd(3000);
    });

    document.getElementById('ctrl-fullscreen').addEventListener('click', toggleFullscreen);

    function toggleFullscreen() {
        var el = document.documentElement;
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
            (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        }
    }

    /* Click on video itself = toggle OSD */
    elVideo.addEventListener('click', toggleOsd);

    /* ── 12. D-pad / keyboard navigation ────────────────────────── */
    var KEY = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, BACK: 461 };

    /* Which OSD button is focused (index into osdButtons array) */
    var _focusIdx = 1; /* default to play/pause */
    var _osdButtons = ['player-back-btn', 'ctrl-rewind', 'ctrl-play', 'ctrl-forward', 'ctrl-mute', 'ctrl-fullscreen'];

    function applyOsdFocus(idx) {
        _focusIdx = Math.max(0, Math.min(_osdButtons.length - 1, idx));
        document.querySelectorAll('.osd-btn').forEach(function (b) {
            b.classList.remove('tv-focus-visible');
        });
        var el = document.getElementById(_osdButtons[_focusIdx]);
        if (el) el.classList.add('tv-focus-visible');
    }

    window.addEventListener('keydown', function (e) {
        var kc = e.keyCode || e.which;

        if (kc === KEY.BACK) {
            e.preventDefault();
            if (_osdVisible) { hideOsd(); return; }
            player.destroyHls();
            elVideo.pause();
            history.back();
            return;
        }

        /* Any directional / enter key: show OSD first */
        if (!_osdVisible) {
            showOsd();
            applyOsdFocus(_focusIdx);
            e.preventDefault();
            return;
        }

        /* Reset hide timer on any activity */
        showOsd(4000);

        if (kc === KEY.ENTER) {
            e.preventDefault();
            var btn = document.getElementById(_osdButtons[_focusIdx]);
            if (btn) btn.click();
            return;
        }

        if (kc === KEY.LEFT) {
            e.preventDefault();
            /* If on a ctrl button, LEFT seeks back */
            if (_focusIdx === 0) return; /* already on back btn */
            applyOsdFocus(_focusIdx - 1);
            return;
        }

        if (kc === KEY.RIGHT) {
            e.preventDefault();
            applyOsdFocus(_focusIdx + 1);
            return;
        }

        if (kc === KEY.UP) {
            e.preventDefault();
            /* UP from controls = focus back button */
            applyOsdFocus(0);
            return;
        }

        if (kc === KEY.DOWN) {
            e.preventDefault();
            /* DOWN from back btn = return to controls */
            if (_focusIdx === 0) applyOsdFocus(2);
            return;
        }
    });

    /* Mouse move anywhere = show OSD */
    document.addEventListener('mousemove', function () { showOsd(); });

}());
