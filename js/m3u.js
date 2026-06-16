// ── M3U / M3U8 playlist support ───────────────────────────────────────────────
//
// Parses a remote M3U8 playlist URL and returns channels + categories in the
// same shape as xtreamGetLiveChannels / xtreamGetCategories so the rest of the
// app works without changes.
//
// #EXTINF attributes understood:
//   tvg-id, tvg-name, tvg-logo, tvg-chno, group-title

const M3U_CACHE_KEY = "iptv_m3u_v1";
const M3U_TTL_MS    = 4 * 60 * 60 * 1000;   // 4 hours

function m3uLoadConfig() {
    const stored = (() => { try { return JSON.parse(localStorage.getItem("iptv_m3u_config")); } catch { return null; } })();
    if (stored?.playlist_url) return Promise.resolve(stored);
    if (window.IPTV_M3U_CONFIG?.playlist_url) return Promise.resolve(window.IPTV_M3U_CONFIG);
    return Promise.reject(new Error("No M3U playlist URL configured"));
}

// ── Disk cache ────────────────────────────────────────────────────────────────

function m3uLoadCache() {
    try {
        const raw = localStorage.getItem(M3U_CACHE_KEY);
        if (!raw) return null;
        const { ts, channels, categories } = JSON.parse(raw);
        if (Date.now() - ts > M3U_TTL_MS) return null;
        return { channels, categories };
    } catch { return null; }
}

function m3uSaveCache(channels, categories) {
    try {
        localStorage.setItem(M3U_CACHE_KEY, JSON.stringify({ ts: Date.now(), channels, categories }));
    } catch {}
}

function m3uClearCache() {
    try { localStorage.removeItem(M3U_CACHE_KEY); } catch {}
}

// ── Parser ────────────────────────────────────────────────────────────────────

const _attrReCache = {};
function _parseAttr(extinf, attr) {
    let re = _attrReCache[attr];
    if (!re) re = _attrReCache[attr] = new RegExp(attr + '=["\']([^"\']*)["\']');
    const m = extinf.match(re);
    return m ? m[1].trim() : "";
}

function m3uParse(text) {
    const lines      = text.split(/\r?\n/);
    const channels   = [];
    const catSet     = new Map();   // category_name → category_id
    let   extinf     = null;
    let   streamId   = 1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith("#EXTINF")) {
            extinf = line;
            continue;
        }

        // Skip other directives
        if (line.startsWith("#")) continue;

        // This line is a URL — pair with the preceding #EXTINF
        if (extinf) {
            const name     = extinf.replace(/^#EXTINF[^,]*,/, "").trim();
            const tvgId    = _parseAttr(extinf, "tvg-id")    || _parseAttr(extinf, "tvg-name") || name;
            const logo     = _parseAttr(extinf, "tvg-logo");
            const group    = _parseAttr(extinf, "group-title") || "Uncategorised";

            if (!catSet.has(group)) catSet.set(group, String(catSet.size + 1));
            const categoryId = catSet.get(group);

            channels.push({
                stream_id:      streamId++,
                name,
                stream_icon:    logo,
                epg_channel_id: tvgId,
                category_id:    categoryId,
                // M3U channels carry their URL directly — stored here so
                // xtreamBuildLiveURL can be skipped
                stream_url:     line,
                _source:        "m3u",
            });

            extinf = null;
        }
    }

    const categories = Array.from(catSet.entries()).map(([name, id]) => ({
        category_id:   id,
        category_name: name,
    }));

    return { channels, categories };
}

// ── Fetch + parse ─────────────────────────────────────────────────────────────

async function m3uFetchPlaylist(url) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 30000);   // large playlists need time
    try {
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const text = await res.text();
        if (!text.includes("#EXTM3U")) throw new Error("Not a valid M3U playlist");
        return m3uParse(text);
    } catch (err) {
        clearTimeout(tid);
        throw err;
    }
}

// ── Public API (mirrors xtream shape) ─────────────────────────────────────────

async function m3uGetChannelsAndCategories(m3uCfg) {
    return m3uFetchPlaylist(m3uCfg.playlist_url);
}

// M3U channels have no server-side EPG API — return empty so the app
// falls back to XMLTV if the user has configured one.
function m3uGetEPG(/*streamId*/) {
    return Promise.resolve([]);
}

// Build the playback URL for an M3U channel — it's stored directly on the
// channel object, so just return it.
function m3uBuildLiveURL(channel) {
    return channel.stream_url || "";
}
