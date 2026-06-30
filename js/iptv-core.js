/* iptv-core.js — shared helpers used across pages (live TV, VOD, settings).
 * Centralises config resolution, Xtream URL building, caching and fetch so the
 * logic doesn't drift between app.js and vod.js. Loaded after polyfills, before
 * the page scripts. Exposes window.IPTVCore. ES5-friendly.                      */
window.IPTVCore = (function () {
    'use strict';

    function load(key, fallback) {
        try { var v = localStorage.getItem(key); return v != null ? JSON.parse(v) : fallback; }
        catch (e) { return fallback; }
    }

    /* Resolve the active profile into a config object.
       Returns: { type:'xtream', server_url, server_urls, username, password }
             or { type:'m3u', playlist_url }
             or null when nothing is configured. */
    function resolveConfig() {
        try {
            var profiles = load('iptv_profiles', null);
            if (profiles && profiles.length) {
                var activeId = load('iptv_active_profile', null);
                var profile = (activeId && profiles.find(function (p) { return p.id === activeId; })) || profiles[0];
                if (profile) {
                    if (profile.type === 'm3u') {
                        return { type: 'm3u', playlist_url: profile.playlist_url || '' };
                    }
                    var resolved = load('iptv_active_resolved_url', null);
                    return {
                        type: 'xtream',
                        server_url:  resolved || (profile.server_urls && profile.server_urls[0]) || '',
                        server_urls: profile.server_urls || [],
                        username:    profile.username || '',
                        password:    profile.password || ''
                    };
                }
            }
        } catch (e) {}
        var legacy = load('iptv_custom_config', null);
        if (legacy && legacy.server_url) {
            legacy.type = legacy.type || 'xtream';
            return legacy;
        }
        if (typeof IPTV_CONFIG !== 'undefined' && IPTV_CONFIG && IPTV_CONFIG.server_url) return IPTV_CONFIG;
        return null;
    }

    function base(cfg) { return ((cfg && cfg.server_url) || '').replace(/\/+$/, ''); }

    function apiUrl(cfg, params) {
        return base(cfg) + '/player_api.php?username=' + encodeURIComponent(cfg.username) +
               '&password=' + encodeURIComponent(cfg.password) + '&' + params;
    }
    function liveUrl(cfg, id) {
        return base(cfg) + '/live/' + encodeURIComponent(cfg.username) + '/' +
               encodeURIComponent(cfg.password) + '/' + encodeURIComponent(id) + '.m3u8';
    }
    function movieUrl(cfg, id, ext) {
        return base(cfg) + '/movie/' + encodeURIComponent(cfg.username) + '/' +
               encodeURIComponent(cfg.password) + '/' + encodeURIComponent(id) + '.' + (ext || 'mp4');
    }
    function episodeUrl(cfg, id, ext) {
        return base(cfg) + '/series/' + encodeURIComponent(cfg.username) + '/' +
               encodeURIComponent(cfg.password) + '/' + encodeURIComponent(id) + '.' + (ext || 'mp4');
    }

    /* ── Generic time-bounded cache ─────────────────────────────────────── */
    var DEFAULT_TTL = 5 * 60 * 60 * 1000;   // 5h
    function cacheGet(key, ttl) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return null;
            var obj = JSON.parse(raw);
            if (Date.now() - obj.ts > (ttl || DEFAULT_TTL)) { localStorage.removeItem(key); return null; }
            return obj.data;
        } catch (e) { return null; }
    }
    function cacheSet(key, data) {
        try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data })); } catch (e) {}
    }

    function fetchJSON(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }
    function fetchCached(key, url, ttl) {
        var c = cacheGet(key, ttl);
        if (c) return Promise.resolve(c);
        return fetchJSON(url).then(function (d) { cacheSet(key, d); return d; });
    }

    return {
        load: load,
        resolveConfig: resolveConfig,
        base: base, apiUrl: apiUrl, liveUrl: liveUrl, movieUrl: movieUrl, episodeUrl: episodeUrl,
        cacheGet: cacheGet, cacheSet: cacheSet, fetchJSON: fetchJSON, fetchCached: fetchCached
    };
}());
