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
    const urls = cfg.server_urls && cfg.server_urls.length
        ? cfg.server_urls
        : [cfg.server_url].filter(Boolean);

    for (const url of urls) {
        try {
            const base   = url.replace(/\/+$/, "");
            const result = await _fetchJSON(
                `${base}/player_api.php?${_auth({ ...cfg, server_url: url })}`,
                8000
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

function xtreamBaseUrl(cfg) {
    return _base(cfg);
}

function xtreamBuildLiveURL(cfg, streamId) {
    const baseUrl = xtreamBaseUrl(cfg);
    return `${baseUrl}/live/${encodeURIComponent(cfg.username)}/${encodeURIComponent(cfg.password)}/${encodeURIComponent(streamId)}.m3u8`;
}
