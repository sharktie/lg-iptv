"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/* series.js — Season/episode picker for a TV series. Reached from vod.js when
 * the user plays a series; plays each episode through pages/player.html.
 * Previously vod.js navigated to a non-existent series.html (a 404 dead-end). */
(function () {
  'use strict';

  var KEY = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ENTER: 13,
    BACK: 461,
    ESC: 27
  };

  /* ── Config (mirrors vod.js) ─────────────────────────────────────────── */
  function getCfg() {
    try {
      var profiles = JSON.parse(localStorage.getItem('iptv_profiles'));
      if (profiles && profiles.length) {
        var activeId;
        try {
          activeId = JSON.parse(localStorage.getItem('iptv_active_profile'));
        } catch (e) {}
        var profile = activeId && profiles.find(function (p) {
          return p.id === activeId;
        }) || profiles[0];
        if (profile && profile.type !== 'm3u') {
          var resolvedUrl;
          try {
            resolvedUrl = JSON.parse(localStorage.getItem('iptv_active_resolved_url'));
          } catch (e) {}
          return {
            server_url: resolvedUrl || profile.server_urls && profile.server_urls[0] || '',
            username: profile.username || '',
            password: profile.password || ''
          };
        }
      }
    } catch (e) {}
    try {
      var s = JSON.parse(localStorage.getItem('iptv_custom_config'));
      if (s && s.server_url) return s;
    } catch (e) {}
    if (typeof IPTV_CONFIG !== 'undefined' && IPTV_CONFIG && IPTV_CONFIG.server_url) return IPTV_CONFIG;
    return null;
  }
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
  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var cfg = getCfg();
  var seriesId = param('id') || lsGet('iptv_series_id');
  var title = param('title') || lsGet('iptv_play_title');
  var elTitle = document.getElementById('series-title');
  var elList = document.getElementById('episode-list');
  var elMsg = document.getElementById('series-msg');
  if (elTitle) elTitle.textContent = title || 'Series';
  function apiUrl(params) {
    var base = (cfg.server_url || '').replace(/\/+$/, '');
    return base + '/player_api.php?username=' + encodeURIComponent(cfg.username) + '&password=' + encodeURIComponent(cfg.password) + '&' + params;
  }
  function buildEpisodeUrl(episodeId, ext) {
    var base = (cfg.server_url || '').replace(/\/+$/, '');
    return base + '/series/' + encodeURIComponent(cfg.username) + '/' + encodeURIComponent(cfg.password) + '/' + encodeURIComponent(episodeId) + '.' + (ext || 'mp4');
  }

  /* ── Focus model: flat list of episode rows ──────────────────────────── */
  var rows = []; // DOM nodes that are focusable (back btn + episodes)
  var focusIdx = 0;
  function paintFocus() {
    rows.forEach(function (el, i) {
      el.classList.toggle('tv-focus-visible', i === focusIdx);
    });
    var el = rows[focusIdx];
    if (el) el.scrollIntoView({
      block: 'nearest'
    });
  }
  function goBack() {
    if (window.history.length > 1) window.history.back();else window.location.href = '../pages/vod.html';
  }
  function playEpisode(el) {
    var epId = el.getAttribute('data-ep');
    var ext = el.getAttribute('data-ext') || 'mp4';
    var epTitle = el.getAttribute('data-title') || title;
    if (!epId) return;
    var url = buildEpisodeUrl(epId, ext);
    try {
      localStorage.setItem('iptv_play_url', url);
    } catch (e) {}
    try {
      localStorage.setItem('iptv_play_title', epTitle);
    } catch (e) {}
    window.location.href = '../pages/player.html?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(epTitle);
  }
  function activate(el) {
    if (!el) return;
    if (el.id === 'series-back-btn') goBack();else playEpisode(el);
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  function render(info) {
    var episodes = info && info.episodes;
    if (!episodes || _typeof(episodes) !== 'object') {
      if (elMsg) {
        elMsg.textContent = 'No episodes found.';
        elMsg.style.display = 'flex';
      }
      return;
    }
    if (elMsg) elMsg.style.display = 'none';

    // Season keys sorted numerically
    var seasons = Object.keys(episodes).sort(function (a, b) {
      return +a - +b;
    });
    var html = '';
    seasons.forEach(function (sn) {
      var eps = episodes[sn];
      if (!Array.isArray(eps) || !eps.length) return;
      html += '<div class="season-label">Season ' + escHtml(sn) + '</div>';
      eps.forEach(function (ep) {
        var num = ep.episode_num != null ? ep.episode_num : '';
        var name = ep.title || 'Episode ' + num;
        var ext = ep.container_extension || ep.info && ep.info.container_extension || 'mp4';
        var label = (num !== '' ? num + '. ' : '') + name;
        html += '<button class="episode-row" data-ep="' + escHtml(ep.id) + '"' + ' data-ext="' + escHtml(ext) + '" data-title="' + escHtml(name) + '">' + '<span class="episode-name">' + escHtml(label) + '</span></button>';
      });
    });
    elList.innerHTML = html;
    rows = [document.getElementById('series-back-btn')].concat(Array.prototype.slice.call(elList.querySelectorAll('.episode-row')));
    rows.forEach(function (el, i) {
      el.addEventListener('click', function () {
        focusIdx = i;
        paintFocus();
        activate(el);
      });
    });
    focusIdx = rows.length > 1 ? 1 : 0;
    paintFocus();
  }

  /* ── D-pad ───────────────────────────────────────────────────────────── */
  window.addEventListener('keydown', function (e) {
    var kc = e.keyCode || e.which;
    if (kc === KEY.BACK || kc === KEY.ESC) {
      e.preventDefault();
      goBack();
      return;
    }
    if (kc === KEY.UP) {
      e.preventDefault();
      if (focusIdx > 0) {
        focusIdx--;
        paintFocus();
      }
      return;
    }
    if (kc === KEY.DOWN) {
      e.preventDefault();
      if (focusIdx < rows.length - 1) {
        focusIdx++;
        paintFocus();
      }
      return;
    }
    if (kc === KEY.ENTER) {
      e.preventDefault();
      activate(rows[focusIdx]);
      return;
    }
  }, true);
  var backBtn = document.getElementById('series-back-btn');
  if (backBtn) backBtn.addEventListener('click', goBack);

  /* ── Boot ────────────────────────────────────────────────────────────── */
  if (!cfg || !cfg.server_url) {
    if (elMsg) {
      elMsg.textContent = 'No server configured.';
      elMsg.style.display = 'flex';
    }
    return;
  }
  if (!seriesId) {
    if (elMsg) {
      elMsg.textContent = 'No series selected.';
      elMsg.style.display = 'flex';
    }
    return;
  }
  if (elMsg) {
    elMsg.textContent = 'Loading episodes…';
    elMsg.style.display = 'flex';
  }
  fetch(apiUrl('action=get_series_info&series_id=' + encodeURIComponent(seriesId))).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (data) {
    render(data);
  }).catch(function () {
    if (elMsg) {
      elMsg.textContent = 'Could not load episodes.';
      elMsg.style.display = 'flex';
    }
  });
})();