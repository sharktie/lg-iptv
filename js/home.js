// ── Homepage navigation ───────────────────────────────────────────────────────
//
// Tile order for D-pad: [livetv, vod, catchup, settings]
// Layout:  [livetv]  [vod]  [catchup ]
//                           [settings]
//
// LEFT/RIGHT moves between the three columns.
// UP/DOWN moves within the small-tile column (catchup ↔ settings).

const TILES = ["tile-livetv", "tile-vod", "tile-catchup", "tile-settings"];
const PAGES = {
    "tile-livetv":  "pages/livetv.html",
    "tile-vod":     "pages/vod.html",
    "tile-catchup": "pages/catchup.html",
    "tile-settings":"pages/settings.html",
};

// Column map — which tile is in which column
// Col 0: livetv, Col 1: vod, Col 2: catchup/settings
const COL = { "tile-livetv": 0, "tile-vod": 1, "tile-catchup": 2, "tile-settings": 2 };
const COL_FIRST = { 0: "tile-livetv", 1: "tile-vod", 2: "tile-catchup" };

let _focusedTile = "tile-livetv";

function _setFocus(id) {
    TILES.forEach(t => document.getElementById(t)?.classList.remove("tv-focus-visible"));
    _focusedTile = id;
    document.getElementById(id)?.classList.add("tv-focus-visible");
}

function _navigate(id) {
    window.location.href = PAGES[id];
}

function _handleKey(e) {
    const kc = e.keyCode || e.which;

    if (kc === 461) { // Back (webOS) — homepage is the root, so exit the app
        e.preventDefault();
        tvGoBack(); // no URL → calls webOS.platformBack()
        return;
    }
    if (kc === 13) { // ENTER
        e.preventDefault();
        _navigate(_focusedTile);
        return;
    }
    const col = COL[_focusedTile];
    if (kc === 37) { // LEFT
        e.preventDefault();
        if (col > 0) _setFocus(COL_FIRST[col - 1]);
        return;
    }
    if (kc === 39) { // RIGHT
        e.preventDefault();
        if (col < 2) _setFocus(COL_FIRST[col + 1]);
        return;
    }
    if (kc === 38) { // UP
        e.preventDefault();
        if (_focusedTile === "tile-settings") _setFocus("tile-catchup");
        return;
    }
    if (kc === 40) { // DOWN
        e.preventDefault();
        if (_focusedTile === "tile-catchup") _setFocus("tile-settings");
        return;
    }
}

function _updateDate() {
    const el = document.getElementById("home-date");
    if (!el) return;
    el.textContent = new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}

window.addEventListener("load", () => {
    // Wire up click handlers
    TILES.forEach(id => {
        document.getElementById(id)?.addEventListener("click", () => _navigate(id));
    });

    // D-pad
    window.addEventListener("keydown", _handleKey, { capture: true });

    // Initial focus
    _setFocus("tile-livetv");

    // Date display
    _updateDate();

    // Notify webOS
   // After
if (typeof webOSSystem !== 'undefined' && typeof webOSSystem.notifyAppLoaded === 'function') {
    webOSSystem.notifyAppLoaded();
}
});

