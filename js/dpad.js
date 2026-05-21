// D-pad / LG TV Remote Navigation
// Requires "disableBackHistoryAPI": true in appinfo.json

let tvFocusZone       = "channel-list";
let tvRowIndex        = 0;
let tvSidebarIndex    = 0;
let tvRowSubZone      = "row";
let _fsEnterTimer     = null;
let _ctxMenuIndex     = 0;
let _assignPanelIndex = 0;

function initTVNavigation() {
    window.addEventListener("keydown", onTVKeyDown, { capture: true, passive: false });
    try { if (typeof webOSSystem !== "undefined") webOSSystem.notifyAppLoaded(); } catch (_) {}

    // popstate fires when Back is pressed while assign panel is open
    // (history entry was pushed in showAssignPanel).
    window.addEventListener("popstate", () => {
        if (document.querySelector(".assign-panel")) {
            _assignHistoryPushed = false;
            closeAssignPanels();
            tvRowSubZone = "row";
            requestAnimationFrame(() => tvFocusRow(tvRowIndex));
            return;
        }
        try { if (typeof webOS !== "undefined") webOS.platformBack(); } catch (_) {}
    });
}

function _restoreZoneFocus() {
    if (tvFocusZone === "settings" || tvFocusZone === "sidebar-cats") tvFocusSidebarItem(tvSidebarIndex);
    else if (tvFocusZone === "channel-list") tvFocusRow(tvRowIndex);
    else setTVZone(tvFocusZone);
}

function _keyCode(e) { return e.keyCode || e.which; }
function _isBack(e)  { return _keyCode(e) === 461; }

// webOS TV remote key codes
const _KEY = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, CH_UP: 427, CH_DN: 428 };

function onTVKeyDown(e) {
    const kc = _keyCode(e);

    const modal       = document.querySelector(".modal-overlay");
    const assignPanel = document.querySelector(".assign-panel");
    const ctxMenu     = document.querySelector(".ctx-menu");
    if (modal)       { _handleModalKey(e, modal);             return; }
    if (assignPanel) { _handleAssignPanelKey(e, assignPanel); return; }
    if (ctxMenu)     { _handleCtxMenuKey(e, ctxMenu);         return; }

    // If an input/select is focused (on-screen keyboard open), only handle Back
    // to dismiss — all other keys go to the input as normal.
    const focused = document.activeElement;
    const tag     = focused?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (_isBack(e)) {
            e.preventDefault(); e.stopImmediatePropagation();
            focused.blur();
            _restoreZoneFocus();
        }
        return;
    }

    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);

    switch (kc) {
        case _KEY.UP:
        case _KEY.DOWN: {
            e.preventDefault();
            const d = kc === _KEY.UP ? -1 : 1;
            if (isFs) { channelStep(d); showOSD(); return; }
            if (tvFocusZone === "channel-list") {
                if (tvRowSubZone === "reorder-up"   && d > 0) { tvRowSubZone = "reorder-down"; tvFocusRowButtons(); return; }
                if (tvRowSubZone === "reorder-down" && d < 0) { tvRowSubZone = "reorder-up";   tvFocusRowButtons(); return; }
                tvRowSubZone = "row";
                tvRowIndex = Math.max(0, Math.min(_vsChannels.length - 1, tvRowIndex + d));
                tvFocusRow(tvRowIndex);
            } else if (tvFocusZone === "sidebar-cats" || tvFocusZone === "settings") {
                const items = getSidebarFocusables();
                if (d < 0 && tvSidebarIndex === 0) setTVZone("sidebar-tabs");
                else { tvSidebarIndex = Math.max(0, Math.min(items.length - 1, tvSidebarIndex + d)); tvFocusSidebarItem(tvSidebarIndex); }
            } else if (tvFocusZone === "search") {
                if (d > 0) setTVZone("sidebar-tabs");
            } else if (tvFocusZone === "tl-nav") {
                if (d < 0) setTVZone("channel-list");
            } else if (tvFocusZone === "sidebar-tabs") {
                if (d < 0) setTVZone("search");
                else setTVZone(document.querySelector(".sidebar-tab.active")?.dataset.tab === "settings" ? "settings" : "sidebar-cats");
            }
            return;
        }
        case _KEY.LEFT: {
            e.preventDefault();
            if (isFs) { showOSD(); return; }
            if (tvFocusZone === "channel-list") {
                if      (tvRowSubZone === "reorder-down") { tvRowSubZone = "reorder-up";  tvFocusRowButtons(); }
                else if (tvRowSubZone === "reorder-up") {
                    const en = _vsChannels[tvRowIndex] ? rowCache.get(String(_vsChannels[tvRowIndex].stream_id)) : null;
                    tvRowSubZone = en?.col3?.style?.display !== "none" ? "assign" : "fav";
                    tvFocusRowButtons();
                }
                else if (tvRowSubZone === "assign") { tvRowSubZone = "fav"; tvFocusRowButtons(); }
                else if (tvRowSubZone === "fav")    { tvRowSubZone = "row"; tvFocusRow(tvRowIndex); }
                else                                { setTVZone("sidebar-cats"); }
            } else if (tvFocusZone === "tl-nav")      { setTVZone("channel-list"); }
              else if (tvFocusZone === "sidebar-tabs") { _moveSidebarTab(-1); }
            return;
        }
        case _KEY.RIGHT: {
            e.preventDefault();
            if (isFs) { showOSD(); return; }
            if (tvFocusZone === "sidebar-cats" || tvFocusZone === "settings") {
                setTVZone("channel-list");
            } else if (tvFocusZone === "channel-list") {
                const ch    = _vsChannels[tvRowIndex];
                const entry = ch ? rowCache.get(String(ch.stream_id)) : null;
                if      (tvRowSubZone === "row")  { tvRowSubZone = "fav"; tvFocusRowButtons(); }
                else if (tvRowSubZone === "fav") {
                    if      (entry?.col3?.style?.display !== "none") { tvRowSubZone = "assign";     tvFocusRowButtons(); }
                    else if (entry?.col4?.style?.display !== "none") { tvRowSubZone = "reorder-up"; tvFocusRowButtons(); }
                    else setTVZone("tl-nav");
                }
                else if (tvRowSubZone === "assign") {
                    if (entry?.col4?.style?.display !== "none") { tvRowSubZone = "reorder-up"; tvFocusRowButtons(); }
                    else setTVZone("tl-nav");
                }
                else if (tvRowSubZone === "reorder-up") { tvRowSubZone = "reorder-down"; tvFocusRowButtons(); }
                else setTVZone("tl-nav");
            } else if (tvFocusZone === "sidebar-tabs") { _moveSidebarTab(1); }
            return;
        }
        case _KEY.ENTER: {
            e.preventDefault();
            if (isFs) {
                if (_fsEnterTimer) { clearTimeout(_fsEnterTimer); _fsEnterTimer = null; toggleFullscreen(); }
                else { showOSD(); _fsEnterTimer = setTimeout(() => { _fsEnterTimer = null; }, 500); }
                return;
            }
            if (tvFocusZone === "channel-list") {
                const ch = _vsChannels[tvRowIndex];
                if (!ch) return;
                if      (tvRowSubZone === "fav")         { toggleFav(String(ch.stream_id)); const en = rowCache.get(String(ch.stream_id)); if (en) en.favBtn.classList.toggle("active", isFav(String(ch.stream_id))); if (activeCategory === "favs") applyFilters(); }
                else if (tvRowSubZone === "assign")       { rowCache.get(String(ch.stream_id))?.assignBtn?.click(); }
                else if (tvRowSubZone === "reorder-up")   { _reorderAndRefocus(String(ch.stream_id), -1, "reorder-up"); }
                else if (tvRowSubZone === "reorder-down") { _reorderAndRefocus(String(ch.stream_id),  1, "reorder-down"); }
                else {
                    if (currentChannel && String(currentChannel.stream_id) === String(ch.stream_id)) toggleFullscreen();
                    else selectChannel(ch);
                }
            } else if (tvFocusZone === "search") {
                const el = document.getElementById("search");
                if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (_) {} }
            } else if (tvFocusZone === "sidebar-cats") {
                getSidebarFocusables()[tvSidebarIndex]?.click();
            } else if (tvFocusZone === "settings") {
                const el = getSidebarFocusables()[tvSidebarIndex];
                if (!el) return;
                if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
                    el.focus();
                    if (el.tagName !== "SELECT") { try { el.setSelectionRange(el.value.length, el.value.length); } catch (_) {} }
                } else { el.click(); }
            } else if (tvFocusZone === "tl-nav") {
                document.querySelector(".tl-nav-btn.tv-focus-visible")?.click();
            } else if (tvFocusZone === "sidebar-tabs") {
                document.querySelector(".sidebar-tab.tv-focus-visible")?.click();
            }
            return;
        }
        case 461: { // Back (webOS)
            e.preventDefault(); e.stopImmediatePropagation();
            if (isFs) { toggleFullscreen(); return; }
            if      (tvFocusZone === "channel-list" || tvFocusZone === "tl-nav") setTVZone("sidebar-cats");
            else if (tvFocusZone === "settings" || tvFocusZone === "sidebar-cats") setTVZone("sidebar-tabs");
            else if (tvFocusZone === "sidebar-tabs") setTVZone("search");
            else setTVZone("sidebar-cats");
            return;
        }
        case _KEY.CH_UP:
            e.preventDefault(); channelStep(-1); if (isFs) showOSD(); return;
        case _KEY.CH_DN:
            e.preventDefault(); channelStep(1);  if (isFs) showOSD(); return;
    }
}

// ── Zone management ───────────────────────────────────────────────────────────

function setTVZone(zone) {
    tvFocusZone = zone; tvRowSubZone = "row";
    document.querySelectorAll(".tv-focus-visible").forEach(el => el.classList.remove("tv-focus-visible"));
    document.querySelectorAll(".tv-row-active").forEach(el => el.classList.remove("tv-row-active"));
    if (zone === "sidebar-cats" || zone === "settings") {
        tvSidebarIndex = Math.max(0, Math.min(getSidebarFocusables().length - 1, tvSidebarIndex));
        tvFocusSidebarItem(tvSidebarIndex);
    } else if (zone === "channel-list") {
        tvRowIndex = Math.max(0, Math.min(_vsChannels.length - 1, tvRowIndex));
        tvFocusRow(tvRowIndex);
    } else if (zone === "tl-nav") {
        document.getElementById("tl-now")?.classList.add("tv-focus-visible");
    } else if (zone === "sidebar-tabs") {
        tvSidebarIndex = 0;
        (document.querySelector(".sidebar-tab.active") || document.querySelector(".sidebar-tab"))?.classList.add("tv-focus-visible");
    } else if (zone === "search") {
        document.getElementById("search")?.classList.add("tv-focus-visible");
    }
}

// ── Focus helpers ─────────────────────────────────────────────────────────────

function getSidebarFocusables() {
    const panel = document.querySelector(".sidebar-panel.active");
    if (!panel) return [];
    return Array.from(panel.querySelectorAll(
        ".cat-btn, .cat-section-hdr, .cat-sub-btn, .cat-add-grp-btn, .settings-btn, .settings-input, .settings-select"
    )).filter(el => el.offsetParent !== null);
}

function _clearFocus() { document.querySelectorAll(".tv-focus-visible").forEach(el => el.classList.remove("tv-focus-visible")); }

function tvFocusSidebarItem(idx) {
    _clearFocus();
    const el = getSidebarFocusables()[idx];
    if (el) { el.classList.add("tv-focus-visible"); el.scrollIntoView({ block: "nearest" }); }
}

function tvFocusRow(idx) {
    _clearFocus();
    document.querySelectorAll(".tv-row-active").forEach(el => el.classList.remove("tv-row-active"));
    const ch = _vsChannels[idx];
    if (!ch) return;
    scrollTVRowIntoView(idx);
    requestAnimationFrame(() => {
        const entry = rowCache.get(String(ch.stream_id));
        if (entry) { entry.col1.classList.add("tv-focus-visible"); entry.row.focus({ preventScroll: true }); }
    });
}

function tvFocusRowButtons() {
    _clearFocus();
    const ch = _vsChannels[tvRowIndex];
    if (!ch) return;
    const entry = rowCache.get(String(ch.stream_id));
    if (!entry) return;
    scrollTVRowIntoView(tvRowIndex);
    requestAnimationFrame(() => {
        document.querySelectorAll(".tv-row-active").forEach(el => el.classList.remove("tv-row-active"));
        entry.row.classList.add("tv-row-active");
        if      (tvRowSubZone === "fav")                                              entry.col2.classList.add("tv-focus-visible");
        else if (tvRowSubZone === "reorder-up"   && entry.upBtn)                     entry.upBtn.classList.add("tv-focus-visible");
        else if (tvRowSubZone === "reorder-down" && entry.dnBtn)                     entry.dnBtn.classList.add("tv-focus-visible");
        else if (tvRowSubZone === "assign" && entry.col3?.style?.display !== "none") entry.col3.classList.add("tv-focus-visible");
    });
}

function scrollTVRowIntoView(idx) {
    const wrap = document.getElementById("channel-list-wrap");
    const top  = idx * VS_ROW_H, bot = top + VS_ROW_H;
    if      (top < wrap.scrollTop)                     wrap.scrollTop = top - VS_ROW_H;
    else if (bot > wrap.scrollTop + wrap.clientHeight) wrap.scrollTop = bot - wrap.clientHeight + VS_ROW_H;
}

function _moveSidebarTab(delta) {
    const tabs = Array.from(document.querySelectorAll(".sidebar-tab"));
    const cur  = tabs.findIndex(t => t.classList.contains("tv-focus-visible"));
    _clearFocus();
    tabs[Math.max(0, Math.min(tabs.length - 1, (cur < 0 ? 0 : cur) + delta))]?.classList.add("tv-focus-visible");
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function _handleModalKey(e, modal) {
    if (_isBack(e)) {
        e.preventDefault(); e.stopImmediatePropagation();
        modal.remove();
        requestAnimationFrame(() => tvFocusSidebarItem(tvSidebarIndex));
        return;
    }
    const kc        = _keyCode(e);
    const inp       = modal.querySelector(".modal-input");
    const okBtn     = modal.querySelector(".modal-btn-ok");
    const cancelBtn = modal.querySelector(".modal-btn:not(.modal-btn-ok)");
    const focused   = modal.querySelector(".modal-btn.tv-focus-visible");
    if (document.activeElement === inp) {
        if (kc === _KEY.ENTER) { e.preventDefault(); inp.blur(); _setModalFocus(modal, okBtn); }
        return;
    }
    e.preventDefault();
    if (kc === _KEY.UP || kc === _KEY.DOWN || kc === _KEY.LEFT || kc === _KEY.RIGHT) {
        _setModalFocus(modal, focused === okBtn ? cancelBtn : focused === cancelBtn ? okBtn : inp);
        return;
    }
    if (kc === _KEY.ENTER) { if (focused) { focused.click(); return; } inp?.focus(); return; }
}

function _setModalFocus(modal, el) {
    modal.querySelectorAll(".tv-focus-visible").forEach(x => x.classList.remove("tv-focus-visible"));
    if (el) { el.classList.add("tv-focus-visible"); if (el.tagName === "INPUT") el.focus(); }
}

// ── Assign panel ──────────────────────────────────────────────────────────────

function _handleAssignPanelKey(e, panel) {
    if (_isBack(e)) {
        e.preventDefault(); e.stopImmediatePropagation();
        history.back();
        return;
    }
    const kc    = _keyCode(e);
    const items = Array.from(panel.querySelectorAll(".assign-row, .assign-new-btn"));
    if (!items.length) { e.preventDefault(); return; }
    if (kc === _KEY.UP || kc === _KEY.DOWN) {
        e.preventDefault();
        _assignPanelIndex = Math.max(0, Math.min(items.length - 1, _assignPanelIndex + (kc === _KEY.DOWN ? 1 : -1)));
        _focusAssignItem(panel, items);
        return;
    }
    if (kc === _KEY.ENTER) {
        e.preventDefault();
        const el = items[_assignPanelIndex];
        if (!el) return;
        if (el.classList.contains("assign-new-btn")) { el.click(); return; }
        const cb = el.querySelector("input[type='checkbox']");
        if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); }
        _focusAssignItem(panel, items);
        return;
    }
    e.preventDefault();
}

function _focusAssignItem(panel, items) {
    panel.querySelectorAll(".tv-focus-visible").forEach(el => el.classList.remove("tv-focus-visible"));
    const el = items[_assignPanelIndex];
    if (el) { el.classList.add("tv-focus-visible"); el.scrollIntoView({ block: "nearest" }); }
}

// ── Context menu ──────────────────────────────────────────────────────────────

function _handleCtxMenuKey(e, menu) {
    if (_isBack(e)) {
        e.preventDefault(); e.stopImmediatePropagation();
        closeContextMenus();
        requestAnimationFrame(() => tvFocusSidebarItem(tvSidebarIndex));
        return;
    }
    const kc    = _keyCode(e);
    const items = Array.from(menu.querySelectorAll(".ctx-item"));
    if (!items.length) { e.preventDefault(); return; }
    if (kc === _KEY.UP || kc === _KEY.DOWN) {
        e.preventDefault();
        _ctxMenuIndex = Math.max(0, Math.min(items.length - 1, _ctxMenuIndex + (kc === _KEY.DOWN ? 1 : -1)));
        _focusCtxItem(menu, items);
        return;
    }
    if (kc === _KEY.ENTER) { e.preventDefault(); items[_ctxMenuIndex]?.click(); return; }
    e.preventDefault();
}

function _focusCtxItem(menu, items) {
    menu.querySelectorAll(".tv-focus-visible").forEach(el => el.classList.remove("tv-focus-visible"));
    const el = items[_ctxMenuIndex];
    if (el) { el.classList.add("tv-focus-visible"); el.scrollIntoView({ block: "nearest" }); }
}
