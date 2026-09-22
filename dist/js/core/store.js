"use strict";

/* core/store.js — every localStorage read and write in the app goes through
 * here. Exposes window.Store.
 *
 * Two reasons this exists rather than calling localStorage directly:
 *   • On webOS, localStorage throws rather than returning null in a handful of
 *     situations (quota exceeded, storage disabled by the platform, private
 *     contexts). An unguarded getItem is enough to kill a whole page, which is
 *     how Settings used to break on webOS 3. Everything here is try/catch'd and
 *     falls back to a caller-supplied default.
 *   • Half the keys hold JSON and half hold bare strings, and mixing the two up
 *     is a real bug we have hit: player.js reads `iptv_default_player` with a
 *     raw getItem, so settings.js writing it via JSON.stringify silently stored
 *     `"native"` (with quotes) and no engine ever matched. get/set are for JSON,
 *     getRaw/setRaw are for bare strings, and the distinction is now explicit at
 *     every call site.
 *
 * ES5 — Babel target is Chrome 38.                                            */
window.Store = function () {
  'use strict';

  /* ── Bare strings ─────────────────────────────────────────────────────── */
  function getRaw(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null || v === undefined ? fallback || '' : v;
    } catch (e) {
      return fallback || '';
    }
  }
  function setRaw(key, value) {
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ── JSON values ──────────────────────────────────────────────────────── */
  function get(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v !== null && v !== undefined ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }
  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
  function removeAll(keys) {
    for (var i = 0; i < keys.length; i++) remove(keys[i]);
  }

  /* ── Time-bounded cache ───────────────────────────────────────────────────
     A cache entry is { ts, data }. Reading an expired entry deletes it, so a
     stale blob can never sit in a nearly-full store keeping a fresh write
     out. TTLs are per-call because they differ wildly: channel lists are good
     for hours, EPG for half an hour. */
  var DEFAULT_TTL = 5 * 60 * 60 * 1000; // 5h

  function cacheGet(key, ttl) {
    var entry = get(key, null);
    if (!entry || typeof entry.ts !== 'number') return null;
    if (Date.now() - entry.ts > (ttl || DEFAULT_TTL)) {
      remove(key);
      return null;
    }
    return entry.data;
  }
  function cacheSet(key, data) {
    return set(key, {
      ts: Date.now(),
      data: data
    });
  }
  /* Age of a cache entry in ms, or -1 when there isn't one. Used by the
     diagnostics panel, which wants to report staleness without evicting. */
  function cacheAge(key) {
    var entry = get(key, null);
    return entry && typeof entry.ts === 'number' ? Date.now() - entry.ts : -1;
  }

  /* ── Housekeeping ─────────────────────────────────────────────────────── */
  function keys() {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) out.push(localStorage.key(i));
    } catch (e) {}
    return out;
  }

  /* Approximate bytes used. Reported in Settings → Diagnostics: when a TV
     starts dropping caches it is almost always because this is near the
     platform's ~5 MB ceiling. */
  function bytesUsed() {
    var total = 0,
      all = keys();
    for (var i = 0; i < all.length; i++) {
      total += all[i].length + getRaw(all[i], '').length;
    }
    return total;
  }

  /* Drop every key matching a prefix — used when switching profiles, where
     leaving another server's channel and VOD caches behind shows one
     account's content under another's credentials. */
  function removeByPrefix(prefix) {
    var all = keys(),
      n = 0;
    for (var i = 0; i < all.length; i++) {
      if (all[i] && all[i].indexOf(prefix) === 0) {
        remove(all[i]);
        n++;
      }
    }
    return n;
  }

  /* ── Cache epoch ──────────────────────────────────────────────────────────
     Bump when a fix changes what cached provider data SHOULD contain. Cached
     lists are only refetched when they expire (hours), and the live-TV list
     only repaints when its length changes — so without this, channel names
     cached while text decoding was broken stayed garbled after the update.
     Epoch 1: charset-aware decoding (core/charset.js). */
  var CACHE_EPOCH = 1;
  var CACHE_PREFIXES = ['iptv_ch_', 'iptv_cat_', 'iptv_m3u_', 'iptv_epg_', 'vod_cats_', 'vod_content_', 'cu_channels_', 'cu_cats_'];
  if (getRaw('iptv_cache_epoch') !== String(CACHE_EPOCH)) {
    for (var p = 0; p < CACHE_PREFIXES.length; p++) removeByPrefix(CACHE_PREFIXES[p]);
    setRaw('iptv_cache_epoch', CACHE_EPOCH);
  }
  return {
    get: get,
    set: set,
    remove: remove,
    removeAll: removeAll,
    getRaw: getRaw,
    setRaw: setRaw,
    cacheGet: cacheGet,
    cacheSet: cacheSet,
    cacheAge: cacheAge,
    DEFAULT_TTL: DEFAULT_TTL,
    keys: keys,
    bytesUsed: bytesUsed,
    removeByPrefix: removeByPrefix
  };
}();