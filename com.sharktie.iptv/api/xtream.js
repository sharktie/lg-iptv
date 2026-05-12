const _inFlight = {};

function _fetchJSON(url, timeoutMs = 8000) {
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
                if (attempt === 0 && err.name !== "AbortError" && !String(err).startsWith("Error: HTTP")) continue;
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
    } catch (e) { console.error("Login error:", e); return null; }
}

async function xtreamGetLiveChannels(cfg) {
    try {
        const data = await _fetchJSON(
            `${cfg.server_url}/player_api.php?username=${cfg.username}&password=${cfg.password}&action=get_live_streams`,
            15000
        );
        return Array.isArray(data) ? data : (data?.data || []);
    } catch (e) { console.error("Channel load error:", e); return []; }
}

async function xtreamGetCategories(cfg) {
    try {
        const data = await _fetchJSON(`${cfg.server_url}/player_api.php?username=${cfg.username}&password=${cfg.password}&action=get_live_categories`);
        return Array.isArray(data) ? data : [];
    } catch (e) { console.error("Category load error:", e); return []; }
}

async function xtreamGetEPG(cfg, streamId) {
    try {
        const data = await _fetchJSON(`${cfg.server_url}/player_api.php?username=${cfg.username}&password=${cfg.password}&action=get_short_epg&stream_id=${streamId}&limit=10`);
        return data?.epg_listings || [];
    } catch (e) { console.error("EPG load error:", e); return []; }
}

function xtreamDecodeEPG(str) {
    if (!str) return "";
    try { return atob(str); } catch { return str; }
}

function xtreamBuildLiveURL(cfg, streamId) {
    return `${cfg.server_url}/live/${cfg.username}/${cfg.password}/${streamId}.m3u8`;
}
