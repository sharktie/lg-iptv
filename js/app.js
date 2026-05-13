
let cfg            = null;
let allChannels    = [];
let activeCategory = "favs";
let activeFavGroup = "all";
let epgCache       = {};
let favourites     = load("iptv_favourites", []);
let favGroups      = load("iptv_fav_groups", []);
let currentChannel = null;
let epgLoadAbortKey = 0;

const TIMELINE_HOURS = 3;
let timelineOffset   = 0;
const rowCache       = new Map();


function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}


const CHANNEL_CACHE_KEY = "iptv_ch_v2";
const CAT_CACHE_KEY     = "iptv_cat_v2";
const CACHE_TTL_MS      = 4 * 60 * 60 * 1000;

function loadChannelCache() {
    try {
        const raw = localStorage.getItem(CHANNEL_CACHE_KEY);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        return Date.now() - ts > CACHE_TTL_MS ? null : data;
    } catch { return null; }
}
function loadCatCache() {
    try {
        const raw = localStorage.getItem(CAT_CACHE_KEY);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        return Date.now() - ts > CACHE_TTL_MS ? null : data;
    } catch { return null; }
}
function saveChannelCache(channels, categories) {
    try {
        const slim = channels.map(({ stream_id, name, category_id, stream_icon, epg_channel_id }) =>
            ({ stream_id, name, category_id, stream_icon: stream_icon || "", epg_channel_id: epg_channel_id || "" }));
        localStorage.setItem(CHANNEL_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: slim }));
        localStorage.setItem(CAT_CACHE_KEY,     JSON.stringify({ ts: Date.now(), data: categories }));
    } catch {
        try { localStorage.removeItem("iptv_epg_v2"); } catch {}
        try {
            const slim = channels.map(({ stream_id, name, category_id, stream_icon }) =>
                ({ stream_id, name, category_id, stream_icon: stream_icon || "" }));
            localStorage.setItem(CHANNEL_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: slim }));
        } catch {}
    }
}


const EPG_CACHE_KEY = "iptv_epg_v2";
const EPG_TTL_MS    = 30 * 60 * 1000;

function loadEpgDiskCache() {
    try {
        const raw = localStorage.getItem(EPG_CACHE_KEY);
        if (!raw) return {};
        const { ts, data } = JSON.parse(raw);
        return Date.now() - ts > EPG_TTL_MS ? {} : data;
    } catch { return {}; }
}
let _epgSaveTimer = null;
function scheduleEpgSave() {
    clearTimeout(_epgSaveTimer);
    _epgSaveTimer = setTimeout(() => {
        try {
            const toSave = {};
            for (const [k, v] of Object.entries(epgCache)) {
                if (Array.isArray(v)) toSave[k] = v;
            }
            localStorage.setItem(EPG_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: toSave }));
        } catch {}
    }, 2000);
}


function isFav(sid)    { return favourites.includes(String(sid)); }
function toggleFav(sid) {
    sid = String(sid);
    favourites = isFav(sid) ? favourites.filter(x => x !== sid) : [...favourites, sid];
    save("iptv_favourites", favourites);
}
function moveFav(sid, dir) {
    sid = String(sid);
    const i = favourites.indexOf(sid), j = i + dir;
    if (i < 0 || j < 0 || j >= favourites.length) return;
    [favourites[i], favourites[j]] = [favourites[j], favourites[i]];
    save("iptv_favourites", favourites);
}


function createFavGroup(name) {
    const g = { id: "fg_" + Date.now().toString(36), name: name.trim(), channelIds: [] };
    favGroups.push(g); save("iptv_fav_groups", favGroups); return g;
}
function renameFavGroup(id, name) {
    const g = favGroups.find(x => x.id === id);
    if (g) { g.name = name.trim(); save("iptv_fav_groups", favGroups); }
}
function deleteFavGroup(id) {
    favGroups = favGroups.filter(x => x.id !== id);
    if (activeFavGroup === id) activeFavGroup = "all";
    save("iptv_fav_groups", favGroups);
}
function isInGroup(gid, sid) {
    const g = favGroups.find(x => x.id === gid);
    return g ? g.channelIds.includes(String(sid)) : false;
}
function toggleChannelInGroup(gid, sid) {
    sid = String(sid);
    const g = favGroups.find(x => x.id === gid);
    if (!g) return;
    g.channelIds = g.channelIds.includes(sid) ? g.channelIds.filter(x => x !== sid) : [...g.channelIds, sid];
    save("iptv_fav_groups", favGroups);
}


async function initApp() {
    const status = document.getElementById("status");
    const setStatus = (msg, err) => {
        status.textContent = msg;
        status.style.color = err ? "#ff5555" : "";
    };

    epgCache = loadEpgDiskCache();

    setStatus("Loading config…");
    try { cfg = await xtreamLoadConfig(); }
    catch (err) { setStatus("ERR: " + err.message, true); return; }

    if (!cfg?.server_url) { setStatus("ERR: missing server_url", true); return; }

    
    const cachedCh  = loadChannelCache();
    const cachedCat = loadCatCache();
    let categories  = cachedCat || [];

    if (cachedCh) {
        allChannels = cachedCh;
        setStatus(`${allChannels.length} channels (cached)`);
        _bootUI(categories);

        xtreamGetLiveChannels(cfg).then(fresh => {
            if (fresh.length) { allChannels = fresh; setStatus(`${allChannels.length} channels`); saveChannelCache(fresh, categories); applyFilters(); }
        }).catch(() => {});
        xtreamGetCategories(cfg).then(freshCat => {
            categories = freshCat; saveChannelCache(allChannels, freshCat); renderCategories(freshCat);
        }).catch(() => {});
        return;
    }

    setStatus("Logging in…");
    try {
        const login = await xtreamLogin(cfg);
        if (!login) { setStatus("ERR: Login failed — check credentials", true); return; }
    } catch (err) { setStatus("ERR: " + err.message, true); return; }

    try {
        setStatus("Fetching channels…");
        const [channels, cats] = await Promise.all([xtreamGetLiveChannels(cfg), xtreamGetCategories(cfg)]);
        if (!channels.length) { setStatus("ERR: 0 channels returned", true); return; }
        allChannels = channels; categories = cats;
        setStatus(`${allChannels.length} channels`);
        saveChannelCache(channels, categories);
        _bootUI(categories);
    } catch (err) { setStatus("ERR: " + err.message, true); }
}

function _bootUI(categories) {
    renderCategories(categories);
    setupSearch();
    setupPip();
    setupTimelineNav();
    
    if (xmltvCache && xmltvCache.programmes) mergeXMLTVIntoEpgCache();
    activeCategory = favourites.length ? "favs" : "all";
    activeFavGroup = "all";
    if (activeCategory === "favs") {
        const sec = document.getElementById("cat-section-favs");
        if (sec) sec.classList.add("open");
    }
    renderFavSectionList();
    updateSidebarActive();
    applyFilters();
}


const VS_ROW_H    = 70;
const VS_OVERSCAN = 5;

let _vsChannels   = [];
let _vsScrollTop  = 0;
let _vsHeight     = 0;
let _vsRafPending = false;

function initVirtualScroll() {
    const wrap = document.getElementById("channel-list-wrap");
    wrap.addEventListener("scroll", () => {
        _vsScrollTop = wrap.scrollTop;
        if (!_vsRafPending) {
            _vsRafPending = true;
            requestAnimationFrame(() => { _vsRafPending = false; _vsRender(); });
        }
    }, { passive: true });
    _vsHeight = wrap.clientHeight || window.innerHeight * 0.55;
}

function _vsSetChannels(channels) {
    _vsChannels = channels;
    const wrap = document.getElementById("channel-list-wrap");
    const list = document.getElementById("channel-list");
    if (!channels.length) { list.innerHTML = ""; list.style.height = "0px"; return; }
    list.style.height   = (channels.length * VS_ROW_H) + "px";
    list.style.position = "relative";
    wrap.scrollTop = _vsScrollTop = 0;
    _vsHeight = wrap.clientHeight || _vsHeight;
    _vsRender();
}

function _vsRender() {
    const list = document.getElementById("channel-list");
    const channels = _vsChannels;
    if (!channels.length) return;

    const first = Math.max(0, Math.floor(_vsScrollTop / VS_ROW_H) - VS_OVERSCAN);
    const last  = Math.min(channels.length - 1, Math.ceil((_vsScrollTop + _vsHeight) / VS_ROW_H) + VS_OVERSCAN);
    const isFavView = activeCategory === "favs";
    const fragment  = document.createDocumentFragment();
    const needed    = new Set();

    for (let i = first; i <= last; i++) {
        const ch  = channels[i];
        const sid = String(ch.stream_id);
        needed.add(sid);

        let entry = rowCache.get(sid);
        if (!entry) { entry = _buildRow(ch, sid); rowCache.set(sid, entry); }

        const { row, favBtn, assignBtn, reorder } = entry;
        row.style.position = "absolute";
        row.style.top      = (i * VS_ROW_H) + "px";
        row.style.left = row.style.right = "0";

        row.classList.toggle("selected", currentChannel !== null && String(currentChannel.stream_id) === sid);
        favBtn.classList.toggle("active", isFav(sid));
        assignBtn.style.display = isFavView ? "flex" : "none";
        assignBtn.classList.toggle("active", favGroups.some(g => g.channelIds.includes(sid)));
        reorder.style.display = (isFavView && activeFavGroup === "all") ? "flex" : "none";

        buildEpgStrip(entry.epgStrip, sid);
        if (!list.contains(row)) fragment.appendChild(row);
    }

    if (fragment.childElementCount) list.appendChild(fragment);
    Array.from(list.children).forEach(el => { if (!needed.has(el.dataset.sid)) el.remove(); });
}

function _buildRow(ch, sid) {
    const row = document.createElement("div");
    row.className = "tl-row"; row.dataset.sid = sid;

    const logoCell = document.createElement("div");
    logoCell.className = "tl-logo-cell";
    const initial = (ch.name || "?")[0].toUpperCase();
    if (ch.stream_icon) {
        const img = new Image();
        img.className = "ch-logo-static"; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
        img.onerror = function () {
            const fb = document.createElement("div");
            fb.className = "ch-logo-fallback"; fb.textContent = initial;
            if (this.parentNode) this.parentNode.replaceChild(fb, this);
        };
        img.src = ch.stream_icon;
        logoCell.appendChild(img);
    } else {
        const fb = document.createElement("div");
        fb.className = "ch-logo-fallback"; fb.textContent = initial;
        logoCell.appendChild(fb);
    }

    const nameCell = document.createElement("div");
    nameCell.className = "tl-name-cell";
    const nd = document.createElement("div");
    nd.className = "ch-name"; nd.textContent = ch.name || "Unknown";
    nameCell.appendChild(nd);

    const epgStrip = document.createElement("div");
    epgStrip.className = "tl-epg-strip"; epgStrip.dataset.sid = sid;

    const favBtn = document.createElement("button");
    favBtn.className = "fav-btn"; favBtn.textContent = "★";
    favBtn.addEventListener("click", e => {
        e.stopPropagation(); toggleFav(sid);
        if (activeCategory === "favs") { applyFilters(); return; }
        favBtn.classList.toggle("active", isFav(sid));
    });

    const assignBtn = document.createElement("button");
    assignBtn.className = "assign-btn"; assignBtn.textContent = "+";
    assignBtn.addEventListener("click", e => showAssignPanel(e, sid, assignBtn));

    const reorder = document.createElement("div");
    reorder.className = "fav-reorder";
    const upBtn = document.createElement("button");
    upBtn.className = "reorder-btn"; upBtn.textContent = "▲";
    upBtn.addEventListener("click", e => { e.stopPropagation(); moveFav(sid, -1); applyFilters(); });
    const dnBtn = document.createElement("button");
    dnBtn.className = "reorder-btn"; dnBtn.textContent = "▼";
    dnBtn.addEventListener("click", e => { e.stopPropagation(); moveFav(sid, 1); applyFilters(); });
    reorder.appendChild(upBtn); reorder.appendChild(dnBtn);

    row.appendChild(logoCell); row.appendChild(nameCell);
    row.appendChild(epgStrip); row.appendChild(favBtn);
    row.appendChild(assignBtn); row.appendChild(reorder);
    
    let _rowClickTimer = null;
    row.addEventListener("click", () => {
        if (_rowClickTimer) {
            clearTimeout(_rowClickTimer);
            _rowClickTimer = null;
            selectChannel(ch);
            toggleFullscreen();
        } else {
            _rowClickTimer = setTimeout(() => { _rowClickTimer = null; selectChannel(ch); }, 250);
        }
    });

    return { row, epgStrip, favBtn, assignBtn, reorder };
}


async function loadEPGForCurrentCategory() {
    const myKey  = ++epgLoadAbortKey;
    const needed = getFilteredChannels().filter(ch => epgCache[ch.stream_id] === undefined);
    if (!needed.length) return;
    needed.forEach(ch => { epgCache[ch.stream_id] = null; });

    const BATCH = 4;
    for (let i = 0; i < needed.length; i += BATCH) {
        if (epgLoadAbortKey !== myKey) return;
        await Promise.all(needed.slice(i, i + BATCH).map(async ch => {
            try { epgCache[ch.stream_id] = await xtreamGetEPG(cfg, ch.stream_id); }
            catch { epgCache[ch.stream_id] = []; }
        }));
        if (epgLoadAbortKey !== myKey) return;
        needed.slice(i, i + BATCH).forEach(ch => patchEpgStrip(ch.stream_id));
    }
    scheduleEpgSave();
}


let _osdTimer = null;

function setupPip() {
    document.getElementById("pip-fullscreen-btn").addEventListener("click", e => { e.stopPropagation(); toggleFullscreen(); });
    document.addEventListener("fullscreenchange",       onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    
    const osd = document.createElement("div");
    osd.id = "fs-osd";
    osd.innerHTML = `
        <div id="fs-osd-top">
            <div id="fs-osd-channel"></div>
        </div>
        <div id="fs-osd-bottom">
            <div id="fs-osd-epg-row">
                <span class="fs-osd-badge now">NOW</span>
                <span id="fs-osd-now-title"></span>
                <span id="fs-osd-now-time"></span>
            </div>
            <div id="fs-osd-epg-row2">
                <span class="fs-osd-badge next">NEXT</span>
                <span id="fs-osd-next-title"></span>
                <span id="fs-osd-next-time"></span>
            </div>
            <div id="fs-osd-bar-wrap"><div id="fs-osd-bar-fill"></div></div>
        </div>`;
    document.getElementById("pip-wrap").appendChild(osd);
}

function toggleFullscreen() {
    const pip  = document.getElementById("pip-wrap");
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!isFs) { const req = pip.requestFullscreen || pip.webkitRequestFullscreen; if (req) req.call(pip); }
    else { const ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex) ex.call(document); }
}

function onFullscreenChange() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    document.getElementById("pip-fullscreen-btn").title = isFs ? "Exit fullscreen" : "Fullscreen";
    document.getElementById("pip-wrap").classList.toggle("pip-fullscreen-active", isFs);
    if (isFs && currentChannel) showOSD();
}

function showOSD() {
    const osd = document.getElementById("fs-osd");
    if (!osd) return;

    
    document.getElementById("fs-osd-channel").textContent = currentChannel?.name || "";

    
    const listings = currentChannel ? epgCache[currentChannel.stream_id] : null;
    let nowTitle = "", nowTime = "", nextTitle = "", nextTime = "", progress = 0;

    if (listings && listings.length) {
        const now = Date.now();
        const idx = listings.findIndex(e => {
            const s = parseEpgTime(e.start), n = parseEpgTime(e.end);
            return now >= s && now < n;
        });
        const cur  = listings[idx >= 0 ? idx     : 0];
        const next = listings[idx >= 0 ? idx + 1 : 1];
        if (cur) {
            nowTitle = xtreamDecodeEPG(cur.title);
            nowTime  = formatTimeRange(cur.start, cur.end);
            progress = calcProgress(cur.start, cur.end);
        }
        if (next) {
            nextTitle = xtreamDecodeEPG(next.title);
            nextTime  = formatTimeRange(next.start, next.end);
        }
    }

    document.getElementById("fs-osd-now-title").textContent  = nowTitle  || "—";
    document.getElementById("fs-osd-now-time").textContent   = nowTime   || "";
    document.getElementById("fs-osd-next-title").textContent = nextTitle || "—";
    document.getElementById("fs-osd-next-time").textContent  = nextTime  || "";
    document.getElementById("fs-osd-bar-fill").style.width   = progress + "%";

    
    osd.classList.remove("osd-hidden");
    osd.classList.add("osd-visible");
    clearTimeout(_osdTimer);
    _osdTimer = setTimeout(() => {
        osd.classList.remove("osd-visible");
        osd.classList.add("osd-hidden");
    }, 4000);
}


function renderCategories(categories) {
    const container = document.getElementById("categories");
    container.innerHTML = "";

    const favSection = document.createElement("div");
    favSection.className = "cat-section"; favSection.id = "cat-section-favs";
    const favHdr = document.createElement("button");
    favHdr.className = "cat-section-hdr fav-section-hdr"; favHdr.id = "fav-section-hdr";
    favHdr.innerHTML = `<span class="section-star">★</span><span class="section-label">Favourites</span><span class="section-chevron">▾</span>`;
    favHdr.onclick = () => {
        const isOpen = favSection.classList.toggle("open");
        if (isOpen) { activeCategory = "favs"; activeFavGroup = "all"; updateSidebarActive(); applyFilters(); }
    };
    const favList = document.createElement("div");
    favList.className = "cat-section-list"; favList.id = "fav-section-list";
    favSection.appendChild(favHdr); favSection.appendChild(favList);
    container.appendChild(favSection);

    const allBtn = document.createElement("button");
    allBtn.className = "cat-btn"; allBtn.dataset.catId = "all"; allBtn.textContent = "All";
    allBtn.onclick = () => { activeCategory = "all"; activeFavGroup = "all"; updateSidebarActive(); applyFilters(); };
    container.appendChild(allBtn);

    if (categories.length) {
        const catSection = document.createElement("div");
        catSection.className = "cat-section"; catSection.id = "cat-section-cats";
        const catHdr = document.createElement("button");
        catHdr.className = "cat-section-hdr";
        catHdr.innerHTML = `<span class="section-label">Categories</span><span class="section-chevron">▾</span>`;
        catHdr.onclick = () => catSection.classList.toggle("open");
        const catList = document.createElement("div");
        catList.className = "cat-section-list";
        const frag = document.createDocumentFragment();
        categories.forEach(cat => {
            const btn = document.createElement("button");
            btn.className = "cat-btn cat-sub-btn"; btn.dataset.catId = cat.category_id;
            btn.textContent = cat.category_name;
            btn.onclick = () => { activeCategory = String(cat.category_id); activeFavGroup = "all"; catSection.classList.add("open"); updateSidebarActive(); applyFilters(); };
            frag.appendChild(btn);
        });
        catList.appendChild(frag);
        catSection.appendChild(catHdr); catSection.appendChild(catList);
        container.appendChild(catSection);
    }

    renderFavSectionList();
}

function updateSidebarActive() {
    document.querySelectorAll(".cat-btn, .cat-sub-btn, .cat-section-hdr").forEach(b => b.classList.remove("active"));
    if (activeCategory === "favs") {
        const hdr = document.getElementById("fav-section-hdr");
        if (hdr) hdr.classList.add("active");
        document.querySelectorAll("[data-fav-group]").forEach(btn => btn.classList.toggle("active", btn.dataset.favGroup === activeFavGroup));
    } else if (activeCategory === "all") {
        const allBtn = document.querySelector(".cat-btn[data-cat-id='all']");
        if (allBtn) allBtn.classList.add("active");
    } else {
        document.querySelectorAll(".cat-sub-btn[data-cat-id]").forEach(btn => btn.classList.toggle("active", btn.dataset.catId === String(activeCategory)));
        const catsSection = document.getElementById("cat-section-cats");
        if (catsSection) catsSection.classList.add("open");
    }
}

function renderFavGroupBar() { renderFavSectionList(); }

function renderFavSectionList() {
    const list = document.getElementById("fav-section-list");
    if (!list) return;
    list.innerHTML = "";
    const mkItem = (text, groupId) => {
        const btn = document.createElement("button");
        const isActive = activeCategory === "favs" && activeFavGroup === groupId;
        btn.className = "cat-sub-btn" + (isActive ? " active" : "");
        btn.dataset.favGroup = groupId; btn.textContent = text;
        btn.onclick = () => { activeCategory = "favs"; activeFavGroup = groupId; document.getElementById("cat-section-favs")?.classList.add("open"); updateSidebarActive(); applyFilters(); };
        list.appendChild(btn); return btn;
    };
    mkItem("All", "all");
    favGroups.forEach(g => {
        const btn = mkItem(g.name, g.id);
        btn.ondblclick    = e => { e.stopPropagation(); promptRenameGroup(g.id, g.name); };
        btn.oncontextmenu = e => { e.preventDefault(); showGroupContextMenu(e, g.id); };
    });
    const addBtn = document.createElement("button");
    addBtn.className = "cat-add-grp-btn"; addBtn.textContent = "+ New Group";
    addBtn.onclick = () => promptNewGroup();
    list.appendChild(addBtn);
}

function promptNewGroup() {
    showInputModal("New Favourite Group", "Group name", "", name => { if (!name) return; createFavGroup(name); renderFavSectionList(); });
}
function promptRenameGroup(id, currentName) {
    showInputModal("Rename Group", "Group name", currentName, name => { if (!name) return; renameFavGroup(id, name); renderFavSectionList(); });
}

function showGroupContextMenu(e, gid) {
    closeContextMenus();
    const menu = document.createElement("div");
    menu.className = "ctx-menu"; menu.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
    const mkItem = (text, danger, fn) => {
        const item = document.createElement("div");
        item.className = "ctx-item" + (danger ? " ctx-danger" : ""); item.textContent = text;
        item.onclick = () => { closeContextMenus(); fn(); }; menu.appendChild(item);
    };
    mkItem("Rename", false, () => { const g = favGroups.find(x => x.id === gid); if (g) promptRenameGroup(gid, g.name); });
    mkItem("Delete Group", true, () => { if (confirm("Delete this group? Channels stay in Favourites.")) { deleteFavGroup(gid); renderFavSectionList(); applyFilters(); } });
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener("click", closeContextMenus, { once: true }), 0);
}
function closeContextMenus() { document.querySelectorAll(".ctx-menu").forEach(m => m.remove()); }


function showAssignPanel(e, sid, anchorEl) {
    e.stopPropagation(); closeAssignPanels();
    if (!favGroups.length) { promptNewGroup(); return; }
    const panel = document.createElement("div");
    panel.className = "assign-panel";
    const title = document.createElement("div"); title.className = "assign-title"; title.textContent = "Add to group";
    panel.appendChild(title);
    favGroups.forEach(g => {
        const row = document.createElement("label"); row.className = "assign-row";
        const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = isInGroup(g.id, sid);
        cb.onchange = () => { toggleChannelInGroup(g.id, sid); updateAssignBtnState(sid); };
        const span = document.createElement("span"); span.textContent = g.name;
        row.appendChild(cb); row.appendChild(span); panel.appendChild(row);
    });
    const newBtn = document.createElement("button"); newBtn.className = "assign-new-btn"; newBtn.textContent = "+ New Group";
    newBtn.onclick = () => { closeAssignPanels(); promptNewGroup(); };
    panel.appendChild(newBtn);
    const rect = anchorEl.getBoundingClientRect();
    panel.style.cssText = `position:fixed;right:${window.innerWidth - rect.right}px;top:${rect.bottom + 4}px`;
    document.body.appendChild(panel);
    function onOutsideClick(ev) { if (!panel.contains(ev.target)) { closeAssignPanels(); document.removeEventListener("mousedown", onOutsideClick); } }
    setTimeout(() => document.addEventListener("mousedown", onOutsideClick), 0);
}
function closeAssignPanels() { document.querySelectorAll(".assign-panel").forEach(p => p.remove()); }
function updateAssignBtnState(sid) {
    const entry = rowCache.get(String(sid));
    if (!entry?.assignBtn) return;
    entry.assignBtn.classList.toggle("active", favGroups.some(g => g.channelIds.includes(String(sid))));
}


function showInputModal(heading, label, value, callback) {
    const overlay = document.createElement("div"); overlay.className = "modal-overlay";
    const box = document.createElement("div"); box.className = "modal-box";
    const h = document.createElement("div"); h.className = "modal-heading"; h.textContent = heading;
    const inp = document.createElement("input"); inp.className = "modal-input"; inp.type = "text"; inp.value = value; inp.placeholder = label;
    const btns = document.createElement("div"); btns.className = "modal-btns";
    const cancel = document.createElement("button"); cancel.className = "modal-btn"; cancel.textContent = "Cancel"; cancel.onclick = () => overlay.remove();
    const ok = document.createElement("button"); ok.className = "modal-btn modal-btn-ok"; ok.textContent = "OK"; ok.onclick = () => { overlay.remove(); callback(inp.value.trim()); };
    inp.onkeydown = e => { if (e.key === "Enter") ok.click(); if (e.key === "Escape") overlay.remove(); };
    btns.appendChild(cancel); btns.appendChild(ok);
    box.appendChild(h); box.appendChild(inp); box.appendChild(btns);
    overlay.appendChild(box); document.body.appendChild(overlay);
    setTimeout(() => inp.focus(), 50);
}


function getFilteredChannels() {
    const q = document.getElementById("search").value.toLowerCase();
    let list;
    if (activeCategory === "favs") {
        let favList = favourites.map(id => allChannels.find(ch => String(ch.stream_id) === id)).filter(Boolean);
        if (activeFavGroup !== "all") {
            const g = favGroups.find(x => x.id === activeFavGroup);
            const ids = g ? g.channelIds : [];
            favList = favList.filter(ch => ids.includes(String(ch.stream_id)));
        }
        list = favList;
    } else if (activeCategory === "all") {
        list = allChannels;
    } else {
        list = allChannels.filter(ch => String(ch.category_id) === String(activeCategory));
    }
    return q ? list.filter(ch => (ch.name || "").toLowerCase().includes(q)) : list;
}

let _applyTimer = null;
function applyFilters(immediate) {
    clearTimeout(_applyTimer);
    if (immediate) { _doApply(); return; }
    _applyTimer = setTimeout(_doApply, 80);
}

function _doApply() {
    const channels  = getFilteredChannels();
    const container = document.getElementById("channel-list");

    if (!channels.length) {
        container.innerHTML = "";
        container.style.height = "auto"; container.style.position = "static";
        const isFavView = activeCategory === "favs";
        container.innerHTML = `<div class="no-results">${
            isFavView
                ? (activeFavGroup !== "all" ? "No channels in this group — assign channels using the + button" : "No favourites yet — click ★ on any channel")
                : "No channels found"
        }</div>`;
        renderTimelineHeader(); return;
    }

    renderTimelineHeader();
    _vsSetChannels(channels);
    loadEPGForCurrentCategory();
}

function setupSearch() {
    document.getElementById("search").addEventListener("input", () => applyFilters(), { passive: true });
}


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

    strip.dataset.state = "filled"; strip.innerHTML = "";
    const now  = Date.now();
    const frag = document.createDocumentFragment();

    listings.forEach(e => {
        const eStart = parseEpgTime(e.start), eEnd = parseEpgTime(e.end);
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
            if (cached) { const ch = allChannels.find(c => String(c.stream_id) === sid); if (ch) selectChannel(ch, cached.row); }
        });
        frag.appendChild(block);
    });
    strip.appendChild(frag);
}


async function selectChannel(ch) {
    currentChannel = ch;
    document.querySelectorAll(".tl-row").forEach(r => r.classList.toggle("selected", r.dataset.sid === String(ch.stream_id)));
    document.getElementById("preview-channel-name").textContent = ch.name || "Unknown";
    document.getElementById("pip-channel-name").textContent     = ch.name || "Unknown";
    player.play(xtreamBuildLiveURL(cfg, ch.stream_id));
    setEPG("now", "Loading…", "", ""); setEPG("next", "—", "", "");
    document.getElementById("epg-bar-fill").style.width = "0%";
    showPreviewInfo();

    let listings = epgCache[ch.stream_id];
    if (!listings) {
        epgCache[ch.stream_id] = null;
        try { listings = await xtreamGetEPG(cfg, ch.stream_id); } catch { listings = []; }
        epgCache[ch.stream_id] = listings;
        patchEpgStrip(ch.stream_id); scheduleEpgSave();
    }
    if (!listings?.length) { setEPG("now", "No EPG data", "", ""); updateOSDIfFullscreen(); return; }

    const now = Date.now();
    const idx = listings.findIndex(e => { const s = parseEpgTime(e.start), n = parseEpgTime(e.end); return now >= s && now < n; });
    const cur  = listings[idx >= 0 ? idx     : 0];
    const next = listings[idx >= 0 ? idx + 1 : 1];
    setEPG("now", xtreamDecodeEPG(cur.title), formatTimeRange(cur.start, cur.end), xtreamDecodeEPG(cur.description));
    document.getElementById("epg-bar-fill").style.width = calcProgress(cur.start, cur.end) + "%";
    if (next) setEPG("next", xtreamDecodeEPG(next.title), formatTimeRange(next.start, next.end), "");
    updateOSDIfFullscreen();
}

function updateOSDIfFullscreen() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (isFs) showOSD();
}

function setEPG(slot, title, time, desc) {
    document.getElementById(`epg-${slot}-title`).textContent = title || "—";
    document.getElementById(`epg-${slot}-time`).textContent  = time  || "";
    const el = document.getElementById(`epg-${slot}-desc`);
    if (el) el.textContent = desc || "";
}


const _epgTimeCache = Object.create(null);
function parseEpgTime(s) {
    if (!s) return 0;
    if (_epgTimeCache[s] !== undefined) return _epgTimeCache[s];
    return (_epgTimeCache[s] = new Date(s.replace(" ", "T") + "Z").getTime());
}
function fmtTime(ms) { return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function formatTimeRange(start, end) {
    const a = fmtTime(parseEpgTime(start)), b = fmtTime(parseEpgTime(end));
    return a && b ? `${a} – ${b}` : (a || "");
}
function calcProgress(start, end) {
    try { const s = parseEpgTime(start), e = parseEpgTime(end), now = Date.now(); if (now < s || now > e) return 0; return Math.round(((now - s) / (e - s)) * 100); }
    catch { return 0; }
}

async function checkForUpdates() {
    try {
        const localResponse = await fetch('../appinfo.json');
        const localManifest = await localResponse.json();
        const currentVersion = localManifest.version;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        const remoteResponse = await fetch('https://github.com/sharktie/lg-iptv/releases/latest/download/manifest.json', { signal: controller.signal });
        clearTimeout(timeoutId);
        const remoteManifest = await remoteResponse.json();

        if (compareVersions(remoteManifest.version, currentVersion) > 0) {
            console.log('Update available:', remoteManifest.version);
            await installUpdate(remoteManifest.ipkUrl);
        } else {
            console.log('App is up to date');
        }
    } catch (e) {
        console.log('Update check failed:', e);
    }
}

function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }
    return 0;
}

async function installUpdate(ipkUrl) {
    return new Promise((resolve, reject) => {
        webOS.service.request("luna://com.webos.appInstallService/dev/install", {
            method: "install",
            parameters: { ipkUrl: ipkUrl },
            onSuccess: function (res) {
                console.log('Install success:', res);
                resolve(res);
            },
            onFailure: function (err) {
                console.log('Install failed:', err);
                reject(err);
            }
        });
    });
}


window.onload = function () {
    
    const savedCfg = load("iptv_custom_config", null);
    if (savedCfg && savedCfg.server_url) window.IPTV_CONFIG = savedCfg;

    
    loadXMLTVFromCache();

    initVirtualScroll();
    initSettingsTabs();
    initSettingsPanel();
    initTVNavigation();
    initApp();

    setTimeout(checkForUpdates, 2000); // Check for updates 2 seconds after app init
    
    const savedEpgUrl = load("iptv_custom_epg_url", "");
    if (savedEpgUrl) {
        const matchField = load("iptv_custom_epg_match", "tvg-id");
        
        setTimeout(() => mergeXMLTVIntoEpgCache(), 2000);
    }
};


function initSettingsTabs() {
    document.querySelectorAll(".sidebar-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".sidebar-tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".sidebar-panel").forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
            if (tab.dataset.tab === "settings") populateSettingsForm();
        });
    });
}

function populateSettingsForm() {
    const stored = load("iptv_custom_config", null) || window.IPTV_CONFIG || {};
    document.getElementById("cfg-server-url").value = stored.server_url || "";
    document.getElementById("cfg-username").value   = stored.username   || "";
    document.getElementById("cfg-password").value   = stored.password   || "";
    document.getElementById("cfg-epg-url").value    = load("iptv_custom_epg_url", "");
    document.getElementById("cfg-epg-match").value  = load("iptv_custom_epg_match", "tvg-id");
}

function initSettingsPanel() {
    document.getElementById("cfg-save-btn").addEventListener("click", async () => {
        const newCfg = {
            server_url: document.getElementById("cfg-server-url").value.trim().replace(/\/$/, ""),
            username:   document.getElementById("cfg-username").value.trim(),
            password:   document.getElementById("cfg-password").value.trim(),
        };
        if (!newCfg.server_url || !newCfg.username || !newCfg.password) {
            setSettingsStatus("cfg-status", "Please fill in all fields.", "err"); return;
        }
        save("iptv_custom_config", newCfg);
        setSettingsStatus("cfg-status", "Saved! Reconnecting…", "ok");
        
        try { localStorage.removeItem("iptv_ch_v2"); localStorage.removeItem("iptv_cat_v2"); } catch {}
        window.IPTV_CONFIG = newCfg;
        cfg = newCfg;
        setTimeout(() => {
            rowCache.clear(); allChannels = []; epgCache = {};
            document.getElementById("categories").innerHTML = "";
            document.getElementById("channel-list").innerHTML = "";
            initApp();
            
            document.getElementById("tab-channels").click();
        }, 600);
    });

    document.getElementById("cfg-epg-load-btn").addEventListener("click", () => {
        const url   = document.getElementById("cfg-epg-url").value.trim();
        const match = document.getElementById("cfg-epg-match").value;
        if (!url) { setSettingsStatus("epg-load-status", "Enter an XMLTV URL first.", "err"); return; }
        save("iptv_custom_epg_url", url);
        save("iptv_custom_epg_match", match);
        setSettingsStatus("epg-load-status", "Loading XMLTV…", "");
        loadCustomXMLTV(url, match);
    });

    document.getElementById("cfg-clear-cache-btn").addEventListener("click", () => {
        try { localStorage.removeItem("iptv_ch_v2"); localStorage.removeItem("iptv_cat_v2"); } catch {}
        setSettingsStatus("cfg-status", "Channel cache cleared.", "ok");
    });

    document.getElementById("cfg-clear-epg-btn").addEventListener("click", () => {
        try { localStorage.removeItem("iptv_epg_v2"); localStorage.removeItem("iptv_xmltv_cache"); } catch {}
        epgCache = {}; xmltvCache = {};
        setSettingsStatus("epg-load-status", "EPG cache cleared.", "ok");
    });
}

function setSettingsStatus(elId, msg, cls) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg;
    el.className = "settings-status" + (cls ? " " + cls : "");
}


let xmltvCache = {}; 

async function loadCustomXMLTV(url, matchField) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "application/xml");
        if (doc.querySelector("parseerror")) throw new Error("Invalid XMLTV XML");

        
        const channelMap = {}; 
        doc.querySelectorAll("channel").forEach(ch => {
            const id   = ch.getAttribute("id") || "";
            const name = ch.querySelector("display-name")?.textContent?.trim() || id;
            channelMap[id] = name;
        });

        
        const parsed = {};
        doc.querySelectorAll("programme").forEach(prog => {
            const chId = prog.getAttribute("channel") || "";
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
    const tzStr = tz ? tz.slice(0,3) + ":" + tz.slice(3) : "+00:00";
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
    allChannels.forEach(ch => {
        const sid = String(ch.stream_id);
        
        let listings = null;
        if (matchField === "tvg-id") {
            const epgId = ch.epg_channel_id || "";
            listings = xmltvCache.programmes[epgId] || null;
            
            if (!listings && epgId) {
                for (const [xmlId, name] of Object.entries(xmltvCache.channelMap || {})) {
                    if (name.toLowerCase() === (ch.name || "").toLowerCase()) {
                        listings = xmltvCache.programmes[xmlId] || null; break;
                    }
                }
            }
        } else {
            
            for (const [xmlId, name] of Object.entries(xmltvCache.channelMap || {})) {
                if (name.toLowerCase() === (ch.name || "").toLowerCase()) {
                    listings = xmltvCache.programmes[xmlId] || null; break;
                }
            }
        }
        if (listings) epgCache[sid] = listings;
    });
}




let _previewHideTimer = null;

function showPreviewInfo() {
    const info = document.getElementById("preview-info");
    if (!info) return;
    info.classList.add("preview-visible");
    clearTimeout(_previewHideTimer);
    _previewHideTimer = setTimeout(() => info.classList.remove("preview-visible"), 4000);
}


function channelStep(delta) {
    if (!_vsChannels.length) return;
    
    let idx = currentChannel
        ? _vsChannels.findIndex(ch => String(ch.stream_id) === String(currentChannel.stream_id))
        : -1;
    if (idx < 0) idx = delta > 0 ? -1 : _vsChannels.length;
    idx = Math.max(0, Math.min(_vsChannels.length - 1, idx + delta));
    tvRowIndex = idx;
    const ch = _vsChannels[idx];
    if (ch) {
        selectChannel(ch);
        tvFocusRow(idx);
    }
}



let tvFocusZone = "channel-list";
let tvRowIndex  = 0;   
let tvSidebarIndex = 0; 
let _tvUsingKeyboard = false;
let _fsEnterPressTimer = null;

function initTVNavigation() {
    document.addEventListener("keydown", onTVKeyDown, { passive: false });
    
    document.addEventListener("mousedown", () => {
        _tvUsingKeyboard = false;
        document.querySelectorAll(".tv-focus-visible").forEach(el => el.classList.remove("tv-focus-visible"));
    });
}


let tvRowSubZone = "row";

function onTVKeyDown(e) {
    
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (e.key === "Escape") { document.activeElement.blur(); setTVZone("channel-list"); }
        return;
    }

    _tvUsingKeyboard = true;
    const key = e.key;
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);

    if (key === "ArrowUp" || key === "ArrowDown") {
        e.preventDefault();
        if (isFs) {
            
            channelStep(key === "ArrowUp" ? -1 : 1);
            showOSD();
            return;
        }
        if (tvFocusZone === "channel-list") {
            tvRowSubZone = "row";
            const delta = key === "ArrowUp" ? -1 : 1;
            tvRowIndex = Math.max(0, Math.min(_vsChannels.length - 1, tvRowIndex + delta));
            tvFocusRow(tvRowIndex);
        } else if (tvFocusZone === "sidebar-cats") {
            const items = getSidebarFocusables();
            const delta = key === "ArrowUp" ? -1 : 1;
            tvSidebarIndex = Math.max(0, Math.min(items.length - 1, tvSidebarIndex + delta));
            tvFocusSidebarItem(tvSidebarIndex);
        } else if (tvFocusZone === "tl-nav") {
            
            if (key === "ArrowUp") setTVZone("channel-list");
        }
        return;
    }

    if (key === "ArrowLeft") {
        e.preventDefault();
        if (isFs) { showOSD(); return; }
        if (tvFocusZone === "channel-list") {
            if (tvRowSubZone === "assign") { tvRowSubZone = "fav"; tvFocusRowButtons(); }
            else if (tvRowSubZone === "fav") { tvRowSubZone = "row"; tvFocusRow(tvRowIndex); }
            else { setTVZone("sidebar-cats"); }
        } else if (tvFocusZone === "tl-nav") { setTVZone("channel-list"); }
        return;
    }

    if (key === "ArrowRight") {
        e.preventDefault();
        if (isFs) { showOSD(); return; }
        if (tvFocusZone === "sidebar-cats") { setTVZone("channel-list"); }
        else if (tvFocusZone === "channel-list") {
            const ch = _vsChannels[tvRowIndex];
            const entry = ch ? rowCache.get(String(ch.stream_id)) : null;
            if (tvRowSubZone === "row") {
                
                tvRowSubZone = "fav"; tvFocusRowButtons();
            } else if (tvRowSubZone === "fav") {
                
                if (entry?.assignBtn && entry.assignBtn.style.display !== "none") {
                    tvRowSubZone = "assign"; tvFocusRowButtons();
                } else {
                    setTVZone("tl-nav");
                }
            } else {
                setTVZone("tl-nav");
            }
        }
        return;
    }

    if (key === "Enter" || key === " ") {
        e.preventDefault();
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (isFs) {
            
            if (_fsEnterPressTimer) {
                clearTimeout(_fsEnterPressTimer);
                _fsEnterPressTimer = null;
                toggleFullscreen();
            } else {
                showOSD();
                _fsEnterPressTimer = setTimeout(() => { _fsEnterPressTimer = null; }, 600);
            }
            return;
        }
        if (tvFocusZone === "channel-list") {
            const ch = _vsChannels[tvRowIndex];
            if (!ch) return;
            if (tvRowSubZone === "fav") {
                
                toggleFav(String(ch.stream_id));
                const entry = rowCache.get(String(ch.stream_id));
                if (entry) entry.favBtn.classList.toggle("active", isFav(String(ch.stream_id)));
                if (activeCategory === "favs") applyFilters();
            } else if (tvRowSubZone === "assign") {
                const entry = rowCache.get(String(ch.stream_id));
                if (entry?.assignBtn) entry.assignBtn.click();
            } else {
                
                if (currentChannel && String(currentChannel.stream_id) === String(ch.stream_id)) {
                    toggleFullscreen();
                } else {
                    selectChannel(ch);
                }
            }
        } else if (tvFocusZone === "sidebar-cats") {
            const items = getSidebarFocusables();
            const el = items[tvSidebarIndex];
            if (el) el.click();
        } else if (tvFocusZone === "tl-nav") {
            const btns = document.querySelectorAll(".tl-nav-btn");
            const focused = Array.from(btns).find(b => b.classList.contains("tv-focus-visible"));
            if (focused) focused.click();
        }
        return;
    }

    
    if (key === "Escape" || key === "GoBack" || key === "Back" || key === "BrowserBack") {
        const isFs2 = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (isFs2) { e.preventDefault(); toggleFullscreen(); return; }
        return;
    }

    
    
    if (key === "PageUp"   || key === "ChannelUp"   || key === "MediaTrackPrevious") {
        e.preventDefault();
        channelStep(-1);
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (isFs) showOSD();
        return;
    }
    if (key === "PageDown" || key === "ChannelDown" || key === "MediaTrackNext") {
        e.preventDefault();
        channelStep(1);
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (isFs) showOSD();
        return;
    }

    
    if (key === "f" || key === "F") {
        if (tvFocusZone === "channel-list") {
            const ch = _vsChannels[tvRowIndex];
            if (ch) {
                toggleFav(String(ch.stream_id));
                const entry = rowCache.get(String(ch.stream_id));
                if (entry) entry.favBtn.classList.toggle("active", isFav(String(ch.stream_id)));
                if (activeCategory === "favs") applyFilters();
            }
        }
        return;
    }

    
    if (key === "Tab") {
        e.preventDefault();
        const zones = ["sidebar-cats", "channel-list", "tl-nav"];
        const cur   = zones.indexOf(tvFocusZone);
        const next  = e.shiftKey ? (cur - 1 + zones.length) % zones.length : (cur + 1) % zones.length;
        setTVZone(zones[next]);
        return;
    }

    
    if (key === "s" || key === "S") {
        document.getElementById("tab-settings").click();
        setTVZone("settings");
        return;
    }
    
    if (key === "c" || key === "C") {
        document.getElementById("tab-channels").click();
        setTVZone("sidebar-cats");
    }
}

function setTVZone(zone) {
    tvFocusZone = zone;
    tvRowSubZone = "row";
    document.querySelectorAll(".tv-focus-visible").forEach(el => el.classList.remove("tv-focus-visible"));
    if (zone === "sidebar-cats") {
        const items = getSidebarFocusables();
        tvSidebarIndex = Math.max(0, Math.min(items.length - 1, tvSidebarIndex));
        tvFocusSidebarItem(tvSidebarIndex);
    } else if (zone === "channel-list") {
        tvRowIndex = Math.max(0, Math.min(_vsChannels.length - 1, tvRowIndex));
        tvFocusRow(tvRowIndex);
    } else if (zone === "tl-nav") {
        const btn = document.getElementById("tl-now");
        if (btn) btn.classList.add("tv-focus-visible");
    }
}

function tvFocusRowButtons() {
    document.querySelectorAll(".tv-focus-visible").forEach(el => el.classList.remove("tv-focus-visible"));
    const ch = _vsChannels[tvRowIndex];
    if (!ch) return;
    const entry = rowCache.get(String(ch.stream_id));
    if (!entry) return;
    scrollTVRowIntoView(tvRowIndex);
    requestAnimationFrame(() => {
        if (tvRowSubZone === "fav") {
            entry.favBtn.classList.add("tv-focus-visible");
            entry.row.classList.add("tv-focus-visible");
        } else if (tvRowSubZone === "assign" && entry.assignBtn.style.display !== "none") {
            entry.assignBtn.classList.add("tv-focus-visible");
            entry.row.classList.add("tv-focus-visible");
        }
    });
}

function getSidebarFocusables() {
    const panel = document.querySelector(".sidebar-panel.active");
    if (!panel) return [];
    return Array.from(panel.querySelectorAll(
        ".cat-btn, .cat-section-hdr, .cat-sub-btn, .cat-add-grp-btn, .settings-btn, .settings-input, .settings-select"
    )).filter(el => el.offsetParent !== null);
}

function tvFocusSidebarItem(idx) {
    const items = getSidebarFocusables();
    document.querySelectorAll(".tv-focus-visible").forEach(el => el.classList.remove("tv-focus-visible"));
    if (!items.length) return;
    const el = items[idx];
    if (el) { el.classList.add("tv-focus-visible"); el.scrollIntoView({ block: "nearest" }); }
}

function tvFocusRow(idx) {
    document.querySelectorAll(".tv-focus-visible").forEach(el => el.classList.remove("tv-focus-visible"));
    const ch = _vsChannels[idx];
    if (!ch) return;
    
    scrollTVRowIntoView(idx);
    requestAnimationFrame(() => {
        const sid = String(ch.stream_id);
        const entry = rowCache.get(sid);
        if (entry) entry.row.classList.add("tv-focus-visible");
    });
}

function scrollTVRowIntoView(idx) {
    const wrap = document.getElementById("channel-list-wrap");
    const rowTop    = idx * VS_ROW_H;
    const rowBottom = rowTop + VS_ROW_H;
    const viewTop   = wrap.scrollTop;
    const viewBottom = viewTop + wrap.clientHeight;
    if (rowTop < viewTop) wrap.scrollTop = rowTop - VS_ROW_H;
    else if (rowBottom > viewBottom) wrap.scrollTop = rowBottom - wrap.clientHeight + VS_ROW_H;
}


