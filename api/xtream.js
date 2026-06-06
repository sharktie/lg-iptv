function _fetchJSON(url, timeoutMs = 10000) {
    return (async () => {
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
    })();
}

function xtreamLoadConfig() {
    if (window.IPTV_CONFIG) return Promise.resolve(window.IPTV_CONFIG);
    return Promise.reject(new Error("window.IPTV_CONFIG not set"));
}

/**
 * Try each server URL in cfg.server_urls (or fall back to cfg.server_url for
 * backwards-compatibility) until one responds successfully.
 *
 * Returns { cfg, data } where cfg.server_url is the working URL, or null if
 * all URLs fail. Uses a short per-URL timeout so failures are fast.
 */
async function xtreamLogin(cfg) {
    const urls = cfg.server_urls && cfg.server_urls.length
        ? cfg.server_urls
        : [cfg.server_url].filter(Boolean);

    for (const url of urls) {
        try {
            const result = await _fetchJSON(
                `${url}/player_api.php?username=${cfg.username}&password=${cfg.password}`,
                8000  /* 8s per URL — fast enough to try several without hanging */
            );
            if (result) {
                return { cfg: { ...cfg, server_url: url }, data: result };
            }
        } catch (_) {
            /* This URL failed — try the next one */
        }
    }
    return null;
}

async function xtreamGetLiveChannels(cfg) {
    try {
        const data = await _fetchJSON(
            `${cfg.server_url}/player_api.php?username=${cfg.username}&password=${cfg.password}&action=get_live_streams`,
            15000
        );
        return Array.isArray(data) ? data : (data?.data || []);
    } catch (_) { return []; }
}

async function xtreamGetCategories(cfg) {
    try {
        const data = await _fetchJSON(`${cfg.server_url}/player_api.php?username=${cfg.username}&password=${cfg.password}&action=get_live_categories`);
        return Array.isArray(data) ? data : [];
    } catch (_) { return []; }
}

async function xtreamGetEPG(cfg, streamId) {
    try {
        const data = await _fetchJSON(`${cfg.server_url}/player_api.php?username=${cfg.username}&password=${cfg.password}&action=get_short_epg&stream_id=${streamId}&limit=10`);
        return data?.epg_listings || [];
    } catch (_) { return []; }
}

function xtreamDecodeEPG(str) {
    if (!str) return "";
    try { return atob(str); } catch { return str; }
}

function xtreamBaseUrl(cfg) {
    return (cfg.server_url || "").replace(/\/+$/, "");
}

function xtreamBuildLiveURL(cfg, streamId) {
    const baseUrl = xtreamBaseUrl(cfg);
    return `${baseUrl}/live/${encodeURIComponent(cfg.username)}/${encodeURIComponent(cfg.password)}/${encodeURIComponent(streamId)}.m3u8`;
}
