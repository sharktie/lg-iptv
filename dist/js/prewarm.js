"use strict";

// prewarm.js — silently refreshes the channel cache while the user is on the
// homepage so Live TV opens instantly without a loading spinner.
// Only runs for Xtream sources (M3U playlists can be large and are best
// fetched on demand).

(function () {
  var CHANNEL_CACHE_KEY = "iptv_ch_v2";
  var CAT_CACHE_KEY = "iptv_cat_v2";
  var CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours — matches app.js

  function load(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v != null ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }
  function cacheIsValid() {
    try {
      var raw = localStorage.getItem(CHANNEL_CACHE_KEY);
      if (!raw) return false;
      return Date.now() - JSON.parse(raw).ts < CACHE_TTL_MS;
    } catch (e) {
      return false;
    }
  }
  function getCfg() {
    var profiles = load("iptv_profiles", null);
    if (profiles && profiles.length) {
      var activeId = load("iptv_active_profile", null);
      var profile = activeId && profiles.find(function (p) {
        return p.id === activeId;
      }) || profiles[0];
      if (profile && profile.type !== "m3u") {
        var resolvedUrl = load("iptv_active_resolved_url", null);
        return {
          server_url: resolvedUrl || profile.server_urls && profile.server_urls[0] || "",
          username: profile.username || "",
          password: profile.password || ""
        };
      }
    }
    return null;
  }
  function fetchJSON(url) {
    var ctrl = new AbortController();
    var tid = setTimeout(function () {
      ctrl.abort();
    }, 20000);
    return fetch(url, {
      signal: ctrl.signal
    }).then(function (r) {
      clearTimeout(tid);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).catch(function (e) {
      clearTimeout(tid);
      throw e;
    });
  }
  function run() {
    if (load("iptv_source_type", "xtream") !== "xtream") return;
    if (cacheIsValid()) return;
    var cfg = getCfg();
    if (!cfg || !cfg.server_url) return;
    var base = cfg.server_url.replace(/\/+$/, "");
    var auth = "username=" + encodeURIComponent(cfg.username) + "&password=" + encodeURIComponent(cfg.password);
    Promise.all([fetchJSON(base + "/player_api.php?" + auth + "&action=get_live_streams"), fetchJSON(base + "/player_api.php?" + auth + "&action=get_live_categories")]).then(function (results) {
      var channels = results[0];
      var categories = results[1];
      if (!Array.isArray(channels) || !channels.length) return;
      if (!Array.isArray(categories)) categories = [];

      // Slim channels to match what app.js stores (keeps localStorage small)
      var slim = channels.map(function (ch) {
        return {
          stream_id: ch.stream_id,
          name: ch.name,
          category_id: ch.category_id,
          stream_icon: ch.stream_icon || "",
          epg_channel_id: ch.epg_channel_id || ""
        };
      });
      save(CHANNEL_CACHE_KEY, {
        ts: Date.now(),
        data: slim
      });
      save(CAT_CACHE_KEY, {
        ts: Date.now(),
        data: categories
      });
    }).catch(function () {});
  }

  // Delay 4 s — lets the page render and the update check finish first
  setTimeout(run, 4000);
})();