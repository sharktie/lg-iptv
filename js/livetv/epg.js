/* livetv/epg.js — the programme guide: fetching, caching, the timeline window,
 * and the coloured strips drawn on each channel row.
 *
 * Three sources feed one cache, keyed by stream id:
 *   • Xtream get_short_epg   — per channel, batched, and abandoned entirely on
 *                              the first 403 (the panel has EPG switched off
 *                              for this account, so every further request is a
 *                              wasted round trip)
 *   • M3U                    — no server-side guide at all; returns empty
 *   • XMLTV                  — a user-supplied file, merged over the top
 *
 * Times are the fiddly part: Xtream returns BOTH Unix timestamps and localised
 * strings, and only the timestamps are unambiguous. epgStart/epgEnd prefer
 * them and fall back to parsing the strings as UTC.
 *
 * Requires: livetv/state.js.
 */

// ── EPG disk cache ────────────────────────────────────────────────────────────

/* Namespaced per profile. The cache is keyed internally by stream_id, and
   Xtream stream ids are small integers starting near 1 — so two providers
   collide on almost every id. With one global key, switching profiles left the
   previous provider's guide in place and drew its programme titles and times
   against the new provider's channels for the whole 30-minute TTL. */
const EPG_CACHE_BASE   = "iptv_epg_v2";
const EPG_CACHE_LEGACY = EPG_CACHE_BASE;      // the old unscoped key
const EPG_TTL_MS       = 30 * 60 * 1000;

function epgCacheKey() {
    var scope = "none";
    try { scope = Config.scope(); } catch (e) {}
    return EPG_CACHE_BASE + ":" + scope;
}

function loadEpgDiskCache() {
    /* The unscoped key can only hold another profile's data now, and it is one
       of the largest things in a store with a ~5 MB ceiling. Drop it once. */
    Store.remove(EPG_CACHE_LEGACY);
    return Store.cacheGet(epgCacheKey(), EPG_TTL_MS) || {};
}

// Writing is debounced because the guide arrives in batches of four channels
// and each batch would otherwise serialise the entire cache again — on a large
// category that is hundreds of full re-serialisations during one scroll.
let _epgSaveTimer = null;
function scheduleEpgSave() {
    clearTimeout(_epgSaveTimer);
    _epgSaveTimer = setTimeout(() => {
        // `null` marks "request in flight" and must not be persisted — on the
        // next launch it would read as "already fetched, nothing found" and
        // that channel would show no guide until the cache expired.
        const toSave = {};
        for (const [k, v] of Object.entries(epgCache)) {
            if (Array.isArray(v)) toSave[k] = v;
        }
        Store.cacheSet(epgCacheKey(), toSave);
    }, 2000);
}


// ── EPG loading ───────────────────────────────────────────────────────────────

/* `null` in epgCache means "request in flight". Every path out of the loader
   below has to hand those entries back, because the retry filter only picks up
   `undefined` — an entry left at `null` is never fetched again for the rest of
   the session, and buildEpgStrip draws it as a permanent "Loading…". Switching
   category mid-load is the ordinary way that happened. */
function releaseInFlightEpg(list) {
    for (let i = 0; i < list.length; i++) {
        const id = list[i].stream_id;
        if (epgCache[id] === null) delete epgCache[id];
    }
}

async function loadEPGForCurrentCategory() {
    if (epgBlocked) return;
    const myKey  = ++epgLoadAbortKey;
    const needed = getFilteredChannels().filter(ch => epgCache[ch.stream_id] === undefined);
    if (!needed.length) return;
    needed.forEach(ch => { epgCache[ch.stream_id] = null; });

    try {
        const BATCH = 4;
        for (let i = 0; i < needed.length; i += BATCH) {
            if (epgLoadAbortKey !== myKey || epgBlocked) return;
            await Promise.all(needed.slice(i, i + BATCH).map(async ch => {
                if (epgBlocked) return;
                try {
                    epgCache[ch.stream_id] = ch._source === "m3u"
                        ? await m3uGetEPG(ch.stream_id)
                        : await xtreamGetEPG(cfg, ch.stream_id);
                } catch (err) {
                    /* A 403 means this account has EPG switched off at the panel —
                       every remaining request would get the same answer, so stop
                       asking entirely rather than firing one per channel. Matched
                       on the status Net attaches, not on the digits "403" appearing
                       somewhere in a message. */
                    if (Net.isHttpError(err, 403) || Net.isHttpError(err, 401)) {
                        epgBlocked = true;
                    } else {
                        epgCache[ch.stream_id] = [];
                    }
                }
            }));
            if (epgLoadAbortKey !== myKey || epgBlocked) return;
            needed.slice(i, i + BATCH).forEach(ch => patchEpgStrip(ch.stream_id));
        }
        scheduleEpgSave();
    } finally {
        /* Covers every exit: the two aborts above, an epgBlocked bail inside a
           batch, a throw, and the normal finish (where nothing is left null). */
        releaseInFlightEpg(needed);
    }
}


// ── Timeline ──────────────────────────────────────────────────────────────────

function getTimelineStart() {
    const now     = new Date();
    const rounded = Math.floor((now.getHours() * 60 + now.getMinutes()) / 30) * 30;
    const d       = new Date(now);
    d.setHours(0, rounded + timelineOffset, 0, 0);
    return d;
}
function getTimelineEnd() { return new Date(getTimelineStart().getTime() + TIMELINE_HOURS * 3600000); }

function setupTimelineNav() {
    document.getElementById("tl-prev").addEventListener("click", () => { timelineOffset -= 60; refreshTimeline(); });
    document.getElementById("tl-next").addEventListener("click", () => { timelineOffset += 60; refreshTimeline(); });
    document.getElementById("tl-now").addEventListener("click",  () => { timelineOffset  = 0;  refreshTimeline(); });
}
function refreshTimeline() { renderTimelineHeader(); getFilteredChannels().forEach(ch => patchEpgStrip(ch.stream_id)); }

function renderTimelineHeader() {
    const header = document.getElementById("tl-time-header");
    const start  = getTimelineStart();
    const frag   = document.createDocumentFragment();
    for (let i = 0; i < TIMELINE_HOURS * 2; i++) {
        const t = new Date(start.getTime() + i * 30 * 60000);
        const d = document.createElement("div");
        d.className = "tl-header-slot";
        d.textContent = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        frag.appendChild(d);
    }
    header.innerHTML = ""; header.appendChild(frag);
    const tlS = getTimelineStart().getTime(), tlE = getTimelineEnd().getTime();
    const pct = ((Date.now() - tlS) / (tlE - tlS)) * 100;
    const line = document.getElementById("tl-now-line");
    if (pct >= 0 && pct <= 100) { line.style.left = pct + "%"; line.style.display = "block"; }
    else line.style.display = "none";
}


// ── EPG strip rendering ───────────────────────────────────────────────────────

function patchEpgStrip(streamId) {
    const entry = rowCache.get(String(streamId));
    if (entry) buildEpgStrip(entry.epgStrip, String(streamId));
}

function buildEpgStrip(strip, sid) {
    const listings = epgCache[sid];
    const tlStart  = getTimelineStart().getTime();
    const tlEnd    = getTimelineEnd().getTime();
    const tlDur    = tlEnd - tlStart;

    if (listings === undefined || listings === null) {
        if (strip.dataset.state === "loading") return;
        strip.innerHTML = ""; strip.dataset.state = "loading";
        const ph = document.createElement("div");
        ph.className = "tl-epg-block tl-loading"; ph.style.cssText = "left:0%;width:calc(100% - 2px)"; ph.textContent = "Loading…";
        strip.appendChild(ph); return;
    }
    if (!listings.length) {
        if (strip.dataset.state === "empty") return;
        strip.innerHTML = ""; strip.dataset.state = "empty";
        const ph = document.createElement("div");
        ph.className = "tl-epg-block tl-no-epg"; ph.style.cssText = "left:0%;width:calc(100% - 2px)"; ph.textContent = "No EPG";
        strip.appendChild(ph); return;
    }

    // Skip re-render if already built for this timeline window
    if (strip.dataset.state === "filled" && strip.dataset.tlStart === String(tlStart)) return;

    strip.dataset.state = "filled"; strip.dataset.tlStart = String(tlStart); strip.innerHTML = "";
    const now  = Date.now();
    const frag = document.createDocumentFragment();

    listings.forEach(e => {
        const eStart = epgStart(e), eEnd = epgEnd(e);
        if (eEnd <= tlStart || eStart >= tlEnd) return;
        const cs    = Math.max(eStart, tlStart), ce = Math.min(eEnd, tlEnd);
        const left  = ((cs - tlStart) / tlDur) * 100;
        const width = ((ce - cs)      / tlDur) * 100;
        const isNow  = now >= eStart && now < eEnd;
        const isPast = eEnd < now;

        const block = document.createElement("div");
        block.className = "tl-epg-block" + (isNow ? " tl-now" : "") + (isPast ? " tl-past" : "");
        block.style.left  = left + "%";
        block.style.width = `calc(${width}% - 2px)`;

        const timeSpan  = document.createElement("span"); timeSpan.className = "tl-block-time";  timeSpan.textContent = `${fmtTime(eStart)}–${fmtTime(eEnd)}`;
        const titleSpan = document.createElement("span"); titleSpan.className = "tl-block-title"; titleSpan.textContent = xtreamDecodeEPG(e.title);
        block.appendChild(timeSpan); block.appendChild(titleSpan);

        if (isNow) {
            const fill = document.createElement("div"); fill.className = "tl-progress-fill";
            fill.style.width = ((now - eStart) / (eEnd - eStart) * 100) + "%";
            block.appendChild(fill);
        }
        block.addEventListener("click", ev => {
            ev.stopPropagation();
            const cached = rowCache.get(sid);
            if (cached) { const ch = allChannels.find(c => String(c.stream_id) === sid); if (ch) selectChannel(ch); }
        });
        frag.appendChild(block);
    });
    strip.appendChild(frag);
}


// ── EPG time helpers ──────────────────────────────────────────────────────────

/* Memoised because a full guide re-parses the same handful of strings per
   channel — but bounded, because the key is provider text: a 20 000-channel
   panel that returns no `start_timestamp` (the only case that reaches here)
   would otherwise leave a couple of hundred thousand entries in it for the
   session. Cleared wholesale rather than evicted one at a time; the parse is
   cheap and this only has to stop being unbounded. */
const EPG_TIME_CACHE_MAX = 20000;
let _epgTimeCache = Object.create(null);
let _epgTimeCacheN = 0;

function parseEpgTime(s) {
    if (!s) return 0;
    if (_epgTimeCache[s] !== undefined) return _epgTimeCache[s];
    if (++_epgTimeCacheN > EPG_TIME_CACHE_MAX) {
        _epgTimeCache = Object.create(null);
        _epgTimeCacheN = 1;
    }
    // The `start`/`end` strings are in the provider's timezone (unknown), so we
    // can't parse them reliably — used only as a fallback. Treated as UTC.
    return (_epgTimeCache[s] = new Date(s.replace(" ", "T") + "Z").getTime());
}
// Prefer the Unix-epoch timestamps: they're absolute UTC and unambiguous, which
// avoids the constant timezone offset the localized strings caused.
function epgStart(e) {
    if (e && e.start_timestamp) return Number(e.start_timestamp) * 1000;
    return parseEpgTime(e && e.start);
}
function epgEnd(e) {
    const ts = e && (e.stop_timestamp || e.end_timestamp);
    if (ts) return Number(ts) * 1000;
    return parseEpgTime(e && e.end);
}
// Current programme + the one after it. Falls back to the first two listings
// when nothing matches "now" (e.g. all-future or stale EPG data).
function _findNowNext(listings) {
    const now = Date.now();
    const idx = listings.findIndex(e => { const s = epgStart(e), n = epgEnd(e); return now >= s && now < n; });
    return { cur: listings[idx >= 0 ? idx : 0], next: listings[idx >= 0 ? idx + 1 : 1] };
}
function fmtTime(ms) { return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function formatTimeRange(e) {
    const a = fmtTime(epgStart(e)), b = fmtTime(epgEnd(e));
    return a && b ? `${a} – ${b}` : (a || "");
}
function calcProgress(e) {
    try {
        const s = epgStart(e), en = epgEnd(e), now = Date.now();
        if (now < s || now > en) return 0;
        return Math.round(((now - s) / (en - s)) * 100);
    } catch { return 0; }
}


// ── XMLTV / custom EPG ────────────────────────────────────────────────────────

let xmltvCache = {};

async function loadCustomXMLTV(url, matchField) {
    try {
        /* Net.text honours the file's own `<?xml encoding="…"?>`, which is
           lost once the body is a string — DOMParser cannot recover it. */
        const text   = await Net.text(url, { timeout: 60000 });
        const parser = new DOMParser();
        const doc    = parser.parseFromString(text, "application/xml");
        if (doc.querySelector("parseerror")) throw new Error("Invalid XMLTV XML");

        const channelMap = {};
        doc.querySelectorAll("channel").forEach(ch => {
            const id   = ch.getAttribute("id") || "";
            const name = ch.querySelector("display-name")?.textContent?.trim() || id;
            channelMap[id] = name;
        });

        const parsed = {};
        doc.querySelectorAll("programme").forEach(prog => {
            const chId  = prog.getAttribute("channel") || "";
            const start = parseXMLTVDate(prog.getAttribute("start"));
            const stop  = parseXMLTVDate(prog.getAttribute("stop"));
            const title = prog.querySelector("title")?.textContent?.trim() || "";
            const desc  = prog.querySelector("desc")?.textContent?.trim()  || "";
            if (!start || !stop) return;
            if (!parsed[chId]) parsed[chId] = [];
            parsed[chId].push({ title, desc, start: toEpgTimeStr(start), end: toEpgTimeStr(stop) });
        });

        xmltvCache = { programmes: parsed, channelMap, matchField };
        try { localStorage.setItem("iptv_xmltv_cache", JSON.stringify({ ts: Date.now(), data: xmltvCache })); } catch {}

        const count = Object.keys(parsed).length;
        setSettingsStatus("epg-load-status", `✓ Loaded ${count} channels from XMLTV.`, "ok");
        mergeXMLTVIntoEpgCache();
        refreshTimeline();
    } catch (err) {
        setSettingsStatus("epg-load-status", "Error: " + err.message, "err");
    }
}

function parseXMLTVDate(str) {
    if (!str) return null;
    const m = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/);
    if (!m) return null;
    const [, yr, mo, dy, hh, mm, ss, tz] = m;
    const tzStr = tz ? tz.slice(0, 3) + ":" + tz.slice(3) : "+00:00";
    return new Date(`${yr}-${mo}-${dy}T${hh}:${mm}:${ss}${tzStr}`).getTime();
}
function toEpgTimeStr(ms) {
    return new Date(ms).toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}

function loadXMLTVFromCache() {
    try {
        const raw = localStorage.getItem("iptv_xmltv_cache");
        if (!raw) return;
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts > 24 * 60 * 60 * 1000) return;
        xmltvCache = data;
    } catch {}
}

function mergeXMLTVIntoEpgCache() {
    if (!xmltvCache.programmes) return;
    const matchField = xmltvCache.matchField || "tvg-id";

    // Build reverse name→xmlId map once instead of iterating per channel
    const nameToXmlId = {};
    for (const [xmlId, name] of Object.entries(xmltvCache.channelMap || {})) {
        nameToXmlId[name.toLowerCase()] = xmlId;
    }

    allChannels.forEach(ch => {
        const sid = String(ch.stream_id);
        let listings = null;
        if (matchField === "tvg-id") {
            const epgId = ch.epg_channel_id || "";
            listings = xmltvCache.programmes[epgId] || null;
            if (!listings) {
                const xmlId = nameToXmlId[(ch.name || "").toLowerCase()];
                if (xmlId) listings = xmltvCache.programmes[xmlId] || null;
            }
        } else {
            const xmlId = nameToXmlId[(ch.name || "").toLowerCase()];
            if (xmlId) listings = xmltvCache.programmes[xmlId] || null;
        }
        if (listings) epgCache[sid] = listings;
    });
}
