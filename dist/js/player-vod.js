"use strict";

/* player-vod.js — VOD player glue: reads ?url=, starts playback, drives the
 * OSD and the D-pad. Pairs with player.js (the IPTVPlayer instance `player`).
 * Previously missing, which left pages/player.html unable to play anything. */
(function () {
  'use strict';

  var KEY = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ENTER: 13,
    BACK: 461,
    ESC: 27,
    PLAY: 415,
    PAUSE: 19,
    PLAYPAUSE: 463,
    STOP: 413,
    FF: 417,
    RW: 412
  };
  var video = document.getElementById('player');
  var osd = document.getElementById('osd');

  /* ── Params ──────────────────────────────────────────────────────────── */
  function param(name) {
    var m = window.location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }
  function lsGet(key) {
    try {
      return localStorage.getItem(key) || '';
    } catch (e) {
      return '';
    }
  }
  var url = param('url') || lsGet('iptv_play_url');
  var title = param('title') || lsGet('iptv_play_title');
  var titleEl = document.getElementById('player-title');
  if (titleEl) titleEl.textContent = title || '';

  /* ── Start playback ──────────────────────────────────────────────────── */
  if (url && window.player && typeof player.play === 'function') {
    player.play(url);
  } else {
    var msg = document.getElementById('player-msg');
    if (msg) {
      msg.textContent = 'Nothing to play.';
      msg.style.display = 'flex';
    }
  }

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
  function osdVisible() {
    return osd && !osd.classList.contains('osd-hidden');
  }

  /* ── Controls ────────────────────────────────────────────────────────── */
  var controls = ['ctrl-rewind', 'ctrl-play', 'ctrl-forward', 'ctrl-mute', 'ctrl-fullscreen'].map(function (id) {
    return document.getElementById(id);
  }).filter(Boolean);
  var backBtn = document.getElementById('player-back-btn');
  var focusRow = backBtn ? [backBtn].concat(controls) : controls.slice();
  var focusIdx = focusRow.indexOf(document.getElementById('ctrl-play'));
  if (focusIdx < 0) focusIdx = 0;
  function paintFocus() {
    focusRow.forEach(function (el, i) {
      el.classList.toggle('tv-focus-visible', i === focusIdx);
    });
  }
  function togglePlay() {
    if (video.paused) video.play().catch(function () {});else video.pause();
  }
  function seek(delta) {
    if (!isFinite(video.duration)) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
  }
  function toggleMute() {
    video.muted = !video.muted;
    updateMuteIcon();
  }
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
      case 'player-back-btn':
        goBack();
        break;
      case 'ctrl-rewind':
        seek(-10);
        break;
      case 'ctrl-play':
        togglePlay();
        break;
      case 'ctrl-forward':
        seek(30);
        break;
      case 'ctrl-mute':
        toggleMute();
        break;
      case 'ctrl-fullscreen':
        toggleFullscreen();
        break;
    }
  }
  function goBack() {
    try {
      player.destroyHls();
    } catch (e) {}
    try {
      video.pause();
    } catch (e) {}
    if (window.history.length > 1) window.history.back();else window.location.href = '../pages/vod.html';
  }

  /* ── Icon state ──────────────────────────────────────────────────────── */
  function updatePlayIcon() {
    var btn = document.getElementById('ctrl-play');
    if (!btn) return;
    var pl = btn.querySelector('.icon-play'),
      pa = btn.querySelector('.icon-pause');
    if (pl && pa) {
      pl.style.display = video.paused ? '' : 'none';
      pa.style.display = video.paused ? 'none' : '';
    }
  }
  function updateMuteIcon() {
    var btn = document.getElementById('ctrl-mute');
    if (!btn) return;
    var v = btn.querySelector('.icon-vol'),
      m = btn.querySelector('.icon-mute');
    if (v && m) {
      v.style.display = video.muted ? 'none' : '';
      m.style.display = video.muted ? '' : 'none';
    }
  }

  /* ── Scrubber ────────────────────────────────────────────────────────── */
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var s = Math.floor(t % 60),
      m = Math.floor(t / 60) % 60,
      h = Math.floor(t / 3600);
    var mm = (h && m < 10 ? '0' : '') + m,
      ss = (s < 10 ? '0' : '') + s;
    return (h ? h + ':' : '') + mm + ':' + ss;
  }
  var fill = document.getElementById('osd-seek-fill');
  var buf = document.getElementById('osd-seek-buf');
  var thumb = document.getElementById('osd-seek-thumb');
  var curEl = document.getElementById('osd-time-cur');
  var durEl = document.getElementById('osd-time-dur');
  function updateProgress() {
    var d = video.duration;
    if (!isFinite(d) || d <= 0) return;
    var pct = video.currentTime / d * 100;
    if (fill) fill.style.width = pct + '%';
    if (thumb) thumb.style.left = pct + '%';
    if (curEl) curEl.textContent = fmt(video.currentTime);
    if (durEl) durEl.textContent = fmt(d);
    if (buf && video.buffered && video.buffered.length) {
      buf.style.width = video.buffered.end(video.buffered.length - 1) / d * 100 + '%';
    }
  }
  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('durationchange', updateProgress);
  video.addEventListener('play', function () {
    updatePlayIcon();
    showOsd();
  });
  video.addEventListener('pause', function () {
    updatePlayIcon();
    showOsd();
  });
  video.addEventListener('ended', function () {
    showOsd();
    osd && osd.classList.remove('osd-hidden');
  });

  /* ── Click support (touch / pointer TVs) ─────────────────────────────── */
  focusRow.forEach(function (el, i) {
    el.addEventListener('click', function () {
      focusIdx = i;
      paintFocus();
      activate(el);
      showOsd();
    });
  });

  /* ── D-pad ───────────────────────────────────────────────────────────── */
  window.addEventListener('keydown', function (e) {
    var kc = e.keyCode || e.which;
    if (kc === KEY.BACK || kc === KEY.ESC) {
      e.preventDefault();
      goBack();
      return;
    }

    // Dedicated media keys work regardless of OSD state
    if (kc === KEY.PLAY || kc === KEY.PAUSE || kc === KEY.PLAYPAUSE) {
      e.preventDefault();
      togglePlay();
      showOsd();
      return;
    }
    if (kc === KEY.FF) {
      e.preventDefault();
      seek(30);
      showOsd();
      return;
    }
    if (kc === KEY.RW) {
      e.preventDefault();
      seek(-10);
      showOsd();
      return;
    }
    if (kc === KEY.STOP) {
      e.preventDefault();
      goBack();
      return;
    }
    var isNav = kc === KEY.LEFT || kc === KEY.RIGHT || kc === KEY.UP || kc === KEY.DOWN || kc === KEY.ENTER;
    if (!isNav) return;
    e.preventDefault();

    // First press while hidden just reveals the OSD
    if (!osdVisible()) {
      showOsd();
      paintFocus();
      return;
    }
    showOsd();
    if (kc === KEY.LEFT) {
      if (focusIdx > 0) {
        focusIdx--;
        paintFocus();
      }
    } else if (kc === KEY.RIGHT) {
      if (focusIdx < focusRow.length - 1) {
        focusIdx++;
        paintFocus();
      }
    } else if (kc === KEY.UP) {
      if (backBtn) {
        focusIdx = 0;
        paintFocus();
      }
    } else if (kc === KEY.DOWN) {
      var playI = focusRow.indexOf(document.getElementById('ctrl-play'));
      if (playI >= 0) {
        focusIdx = playI;
        paintFocus();
      }
    } else if (kc === KEY.ENTER) {
      activate(focusRow[focusIdx]);
    }
  }, true);

  /* ── Init ────────────────────────────────────────────────────────────── */
  updatePlayIcon();
  updateMuteIcon();
  paintFocus();
  showOsd();
})();