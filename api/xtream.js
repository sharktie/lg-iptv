const _inFlight = {};

function _fetchJSON(url, timeoutMs = 10000) {
    if (_inFlight[url]) return _inFlight[url];
    const p = (async () => {
        for (let attempt = 0; attempt < 2; attempt++) {
            const ctrl = new AbortController();
            const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
            try {
                const r = await fetch(url, { signal: ctrl.signal });
                clearTimeout(tid);
                if (!r.ok) throw new Error("HTTP " + r.status);
                return await r.json();
            } catch (err) {
                clearTimeout(tid);
                // Only retry on AbortError (timeout) — not on HTTP errors or JSON parse failures
                if (attempt === 0 && err.name === "AbortError") continue;
                throw err;
            }
        }
    })().finally(() => { delete _inFlight[url]; });
    _inFlight[url] = p;
    return p;
}

function xtreamLoadConfig() {
    if (window.IPTV_CONFIG) return Promise.resolve(window.IPTV_CONFIG);
    return Promise.reject(new Error("window.IPTV_CONFIG not set"));
}

async function xtreamLogin(cfg) {
    try {
        return await _fetchJSON(`${cfg.server_url}/player_api.php?username=${cfg.username}&password=${cfg.password}`);
    } catch (_) { return null; }
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
