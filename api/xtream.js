async function _fetchJSON(url, timeoutMs) {
    if (timeoutMs === undefined) timeoutMs = 10000;
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const r = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!r.ok) throw new Error("HTTP " + r.status);
        return await r.json();
    } catch (err) {
        clearTimeout(tid);
        throw err;
    }
}

function _auth(cfg) {
    return "username=" + encodeURIComponent(cfg.username) +
           "&password=" + encodeURIComponent(cfg.password);
}

function _base(cfg) {
    return (cfg.server_url || "").replace(/\/+$/, "");
}

function xtreamLoadConfig() {
    if (window.IPTV_CONFIG) return Promise.resolve(window.IPTV_CONFIG);
    return Promise.reject(new Error("window.IPTV_CONFIG not set"));
}

// Try each server URL in order until one responds. Returns { cfg, data } with
// cfg.server_url set to the working URL, or null if all fail.
async function xtreamLogin(cfg) {
    const entered = cfg.server_urls && cfg.server_urls.length
        ? cfg.server_urls
        : [cfg.server_url].filter(Boolean);

    // Try each URL, plus an http fallback for https entries — some servers use a
    // cert/TLS the TV browser rejects, and http on the same host/port still works.
    const urls = [];
    entered.forEach(u => {
        urls.push(u);
        if (/^https:/i.test(u)) {
            const alt = u.replace(/^https:/i, "http:");
            if (urls.indexOf(alt) === -1) urls.push(alt);
        }
    });

    for (const url of urls) {
        try {
            const base   = url.replace(/\/+$/, "");
            const result = await _fetchJSON(
                `${base}/player_api.php?${_auth({ ...cfg, server_url: url })}`,
                12000
            );
            if (result) return { cfg: { ...cfg, server_url: url }, data: result };
        } catch (_) {}
    }
    return null;
}

async function xtreamGetLiveChannels(cfg) {
    try {
        const data = await _fetchJSON(
            `${_base(cfg)}/player_api.php?${_auth(cfg)}&action=get_live_streams`,
            15000
        );
        return Array.isArray(data) ? data : (data?.data || []);
    } catch (_) { return []; }
}

async function xtreamGetCategories(cfg) {
    try {
        const data = await _fetchJSON(
            `${_base(cfg)}/player_api.php?${_auth(cfg)}&action=get_live_categories`
        );
        return Array.isArray(data) ? data : [];
    } catch (_) { return []; }
}

async function xtreamGetEPG(cfg, streamId) {
    try {
        const data = await _fetchJSON(
            `${_base(cfg)}/player_api.php?${_auth(cfg)}&action=get_short_epg&stream_id=${encodeURIComponent(streamId)}&limit=10`
        );
        return data?.epg_listings || [];
    } catch (err) {
        // Rethrow HTTP errors (e.g. 403) so callers can detect and back off
        if (err && err.message && /^HTTP \d/.test(err.message)) throw err;
        return [];
    }
}

function xtreamDecodeEPG(str) {
    if (!str) return "";
    try { return atob(str); } catch { return str; }
}

// Full programme guide for one channel, including past programmes. Unlike
// get_short_epg this returns the whole stored archive window, and each listing
// carries `has_archive` (1 = a catch-up recording exists). Titles/descriptions
// are base64 like the short EPG. Used by the Catch-up page.
async function xtreamGetSimpleDataTable(cfg, streamId) {
    try {
        const data = await _fetchJSON(
            `${_base(cfg)}/player_api.php?${_auth(cfg)}&action=get_simple_data_table&stream_id=${encodeURIComponent(streamId)}`
        );
        return (data && data.epg_listings) || [];
    } catch (err) {
        if (err && err.message && /^HTTP \d/.test(err.message)) throw err;
        return [];
    }
}

// Two-digit pad helper for the timeshift start string.
function _ts2(n) { return (n < 10 ? "0" : "") + n; }

// Format a Date as the `Y-m-d:H-i` string Xtream timeshift endpoints expect,
// in the device's local timezone (matches the wall-clock time shown in the
// programme list — correct when the TV and IPTV server share a timezone, which
// is the common case for same-country providers).
function xtreamFormatTimeshiftStart(date) {
    return date.getFullYear() + "-" + _ts2(date.getMonth() + 1) + "-" + _ts2(date.getDate()) +
           ":" + _ts2(date.getHours()) + "-" + _ts2(date.getMinutes());
}

// Build candidate catch-up (timeshift) playback URLs for a past programme.
// Returns them in priority order so IPTVPlayer can walk the list until one
// plays — different panels expose different endpoints:
//   1. path style   /timeshift/{u}/{p}/{duration}/{start}/{id}.m3u8
//   2. query style   /streaming/timeshift.php?...&stream=&start=&duration=
// `start` is a Date (programme start); `durationMin` is the length in minutes.
function xtreamBuildTimeshiftURLs(cfg, streamId, start, durationMin) {
    const baseUrl  = _base(cfg);
    const u        = encodeURIComponent(cfg.username);
    const p        = encodeURIComponent(cfg.password);
    const id       = encodeURIComponent(streamId);
    const dur      = Math.max(1, Math.round(durationMin));
    const startStr = xtreamFormatTimeshiftStart(start);
    return [
        // Path style — colon kept literal (a valid path char; panels that don't
        // url-decode path segments reject %3A).
        `${baseUrl}/timeshift/${u}/${p}/${dur}/${startStr}/${id}.m3u8`,
        // Query style — colon encoded, which is correct for a query value.
        `${baseUrl}/streaming/timeshift.php?username=${u}&password=${p}` +
            `&stream=${id}&start=${encodeURIComponent(startStr)}&duration=${dur}`
    ];
}

function xtreamBaseUrl(cfg) {
    return _base(cfg);
}

function xtreamBuildLiveURL(cfg, streamId) {
    const baseUrl = xtreamBaseUrl(cfg);
    return `${baseUrl}/live/${encodeURIComponent(cfg.username)}/${encodeURIComponent(cfg.password)}/${encodeURIComponent(streamId)}.m3u8`;
}
