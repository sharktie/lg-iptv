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

  /* Resume / progress metadata written by vod.js. Ignore it unless it matches
     this exact URL, so a stale entry from a previous play can't apply here. */
  var meta = null;
  try {
    meta = JSON.parse(lsGet('iptv_play_meta') || 'null');
  } catch (e) {
    meta = null;
  }
  if (meta && meta.url !== url) meta = null;
  var resumeAt = meta && meta.resume > 0 ? meta.resume : 0;
  var _resumed = false;
  if (window.player) {
    if (typeof player.setPlaybackContext === 'function') {
      player.setPlaybackContext(meta || {
        title: title || '',
        name: title || '',
        searchTitle: title || '',
        year: meta && meta.year ? meta.year : ''
      });
    } else if (typeof player.setPlaybackContextFromMeta === 'function') {
      player.setPlaybackContextFromMeta(meta || {
        title: title || '',
        name: title || ''
      });
    }
  }
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

  /* ── Resume position + save progress (Continue Watching) ─────────────── */
  function seekToResume() {
    if (_resumed || resumeAt <= 0) return;
    if (!isFinite(video.duration) || video.duration <= 0) return;
    if (resumeAt < video.duration - 5) {
      try {
        video.currentTime = resumeAt;
      } catch (e) {}
    }
    _resumed = true;
  }
  video.addEventListener('loadedmetadata', seekToResume);
  video.addEventListener('canplay', seekToResume);
  var _lastSave = 0;
  function saveProgress(finished) {
    if (!meta || !meta.key) return;
    var dur = video.duration,
      pos = video.currentTime;
    if (!isFinite(dur) || dur <= 0) return;
    try {
      var all = JSON.parse(localStorage.getItem('vod_progress') || '{}');
      if (finished || pos / dur > 0.95) {
        delete all[meta.key]; // drop finished titles
      } else if (pos > 30) {
        all[meta.key] = {
          key: meta.key,
          type: meta.type,
          id: meta.id,
          ext: meta.ext,
          name: meta.name,
          icon: meta.icon,
          series_id: meta.series_id,
          season: meta.season,
          episode: meta.episode,
          pos: pos,
          dur: dur,
          ts: Date.now()
        };
      }
      localStorage.setItem('vod_progress', JSON.stringify(all));
    } catch (e) {}
  }
  video.addEventListener('timeupdate', function () {
    var now = Date.now();
    if (now - _lastSave > 5000) {
      _lastSave = now;
      saveProgress(false);
    }
  });
  video.addEventListener('ended', function () {
    saveProgress(true);
  });
  window.addEventListener('pagehide', function () {
    saveProgress(false);
  });

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
  var controls = ['ctrl-rewind', 'ctrl-play', 'ctrl-forward', 'ctrl-mute', 'ctrl-subs', 'ctrl-fullscreen'].map(function (id) {
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
      case 'ctrl-subs':
        openSubs();
        break;
      case 'ctrl-fullscreen':
        toggleFullscreen();
        break;
    }
  }

  /* ── Subtitles ───────────────────────────────────────────────────────── */
  var subsMenu = document.getElementById('subs-menu');
  var subsList = document.getElementById('subs-menu-list');
  var subsMenuTitle = document.getElementById('subs-menu-title');
  var subsOpen = false;
  var subsIdx = 0;
  var subsItems = [];
  var subsState = null;
  var activeSubLabel = 'off';
  var SUBS_PREF_KEY = 'vod_subs_pref';
  function isSelectableSubItem(item) {
    return item && (item.kind === 'off' || item.kind === 'lang' || item.kind === 'track' || item.kind === 'result' || item.kind === 'back');
  }
  function syncSubsState(state) {
    subsState = state || null;
    subsItems = state && state.items ? state.items.slice() : [];
    if (subsMenuTitle) subsMenuTitle.textContent = state && state.title || 'Subtitles';
  }
  function getSelectableSubItems() {
    var out = [];
    for (var i = 0; i < subsItems.length; i++) if (isSelectableSubItem(subsItems[i])) out.push(subsItems[i]);
    return out;
  }
  function renderSubsMenu(state) {
    syncSubsState(state || (window.player && player.getSubtitleMenuState ? player.getSubtitleMenuState() : null));
    subsList.innerHTML = '';
    var firstSelectable = -1;
    for (var i = 0; i < subsItems.length; i++) {
      var item = subsItems[i];
      if (item && item.kind === 'heading') {
        var heading = document.createElement('div');
        heading.className = 'subs-heading';
        heading.textContent = item.label || '';
        subsList.appendChild(heading);
        continue;
      }
      if (item && (item.kind === 'loading' || item.kind === 'empty' || item.kind === 'error')) {
        var note = document.createElement('div');
        note.className = 'subs-note';
        note.textContent = item.label || '';
        subsList.appendChild(note);
        continue;
      }
      if (!isSelectableSubItem(item)) continue;
      var b = document.createElement('button');
      b.className = 'subs-opt';
      b.textContent = item.label || 'Subtitles';
      b.dataset.subIndex = String(i);
      if (item.kind === 'lang' && String(item.value || '').toLowerCase() === activeSubLabel || item.kind === 'track' && String(item.label || '').toLowerCase() === activeSubLabel) {
        b.classList.add('current');
      }
      b.addEventListener('click', function (idx) {
        return function () {
          chooseSubtitleItem(idx);
        };
      }(i));
      subsList.appendChild(b);
      if (firstSelectable === -1) firstSelectable = i;
    }
    if (subsIdx < 0 || subsIdx >= subsItems.length || !isSelectableSubItem(subsItems[subsIdx])) subsIdx = firstSelectable >= 0 ? firstSelectable : 0;
    paintSubs();
  }
  function openSubs() {
    if (osd) osd.classList.remove('osd-hidden');
    subsMenu.hidden = false;
    subsOpen = true;
    clearTimeout(osdTimer);
    if (window.player && player.openSubtitleBrowser) {
      player.openSubtitleBrowser().then(function (state) {
        renderSubsMenu(state);
      });
    } else if (window.player && player.getSubtitleMenuState) {
      renderSubsMenu(player.getSubtitleMenuState());
    } else {
      renderSubsMenu({
        title: 'Subtitles',
        items: [{
          kind: 'off',
          label: 'Off'
        }]
      });
    }
  }
  function closeSubs() {
    subsMenu.hidden = true;
    subsOpen = false;
    paintFocus();
    showOsd();
  }
  function paintSubs() {
    var opts = subsList.querySelectorAll('.subs-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].classList.toggle('tv-focus-visible', String(opts[i].dataset.subIndex) === String(subsIdx));
    }
  }
  function chooseSubtitleItem(idx) {
    var item = subsItems[idx];
    if (!item) return;
    if (item.kind === 'result') {
      activeSubLabel = String(item.label || '').toLowerCase();
      try {
        localStorage.setItem(SUBS_PREF_KEY, activeSubLabel);
      } catch (e) {}
    }
    if (window.player && player.selectSubtitleMenuItem) {
      var out = player.selectSubtitleMenuItem(item);
      if (out && typeof out.then === 'function') {
        out.then(function (state) {
          if (item.kind === 'lang' || item.kind === 'back') {
            renderSubsMenu(state);
          } else if (item.kind === 'result' || item.kind === 'track' || item.kind === 'off') {
            closeSubs();
          } else if (state && state.items) {
            renderSubsMenu(state);
          } else {
            closeSubs();
          }
        }).catch(function () {
          closeSubs();
        });
      } else {
        closeSubs();
      }
    }
  }
  function moveSubFocus(dir) {
    var selectable = getSelectableSubItems();
    if (!selectable.length) return;
    var current = subsItems[subsIdx];
    var pos = -1;
    for (var i = 0; i < selectable.length; i++) {
      if (selectable[i] === current) {
        pos = i;
        break;
      }
    }
    if (pos < 0) pos = 0;
    pos += dir;
    if (pos < 0) pos = 0;
    if (pos >= selectable.length) pos = selectable.length - 1;
    var target = selectable[pos];
    for (var j = 0; j < subsItems.length; j++) {
      if (subsItems[j] === target) {
        subsIdx = j;
        break;
      }
    }
    paintSubs();
  }
  function isRootSubtitleState() {
    return !subsState || subsState.mode === 'root';
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

    // Subtitle menu captures input while open
    if (subsOpen) {
      e.preventDefault();
      if (kc === KEY.UP) {
        moveSubFocus(-1);
      } else if (kc === KEY.DOWN) {
        moveSubFocus(1);
      } else if (kc === KEY.ENTER) {
        chooseSubtitleItem(subsIdx);
      } else if (kc === KEY.LEFT || kc === KEY.BACK || kc === KEY.ESC) {
        if (!isRootSubtitleState() && window.player && player.closeSubtitleBrowser) {
          player.closeSubtitleBrowser().then(function (state) {
            renderSubsMenu(state);
          });
        } else {
          closeSubs();
        }
      } else {
        closeSubs();
      }
      return;
    }
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

  /* External subtitle files passed from vod.js (best-effort) */
  if (meta && meta.subs && meta.subs.length && window.player && player.addExternalSubs) {
    player.addExternalSubs(meta.subs);
  }
  /* Re-apply the user's last subtitle choice once tracks have loaded */
  try {
    activeSubLabel = localStorage.getItem(SUBS_PREF_KEY) || 'off';
  } catch (e) {}
  if (activeSubLabel && activeSubLabel !== 'off') {
    setTimeout(function () {
      if (window.player && player.listSubtitles) {
        var tracks = player.listSubtitles();
        for (var i = 0; i < tracks.length; i++) {
          if ((tracks[i].label || '').toLowerCase() === activeSubLabel && player.setSubtitle) {
            player.setSubtitle(tracks[i]);
            break;
          }
        }
      }
    }, 2500);
  }
})();