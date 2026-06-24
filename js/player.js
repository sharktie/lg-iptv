class IPTVPlayer {
    constructor() {
        this.video    = document.getElementById("player");
        this._pipWrap = document.getElementById("pip-wrap");
        this.hls      = null;
        this._watchdog = null;
        this._gen      = 0;   // bumped each play() so stale callbacks self-cancel
        // Prevent the video element from stealing remote focus —
        // all input is handled by dpad.js.
        this.video.tabIndex = -1;
    }

    // ── UI messages ───────────────────────────────────────────────────────────

    _msg(text) {
        const el = document.getElementById("player-msg");
        if (el) { el.textContent = text; el.style.display = "flex"; }
    }

    _hideMsg() {
        const el = document.getElementById("player-msg");
        if (el) el.style.display = "none";
    }

    // ── Playback ──────────────────────────────────────────────────────────────

    destroyHls() {
        if (this.hls) {
            try { this.hls.destroy(); } catch (_) {}
            this.hls = null;
        }
    }

    _clearWatchdog() {
        if (this._watchdog) { clearTimeout(this._watchdog); this._watchdog = null; }
    }

    play(url) {
        if (!url) return;

        const gen = ++this._gen;               // invalidate any in-flight attempt
        this._clearWatchdog();
        this.destroyHls();
        try { this.video.pause(); } catch (_) {}
        this.video.removeAttribute("src");
        this.video.innerHTML = "";
        this.video.style.display = "block";
        this._msg("Loading…");

        this._url         = url;
        this._isHls       = url.includes(".m3u8");
        this._triedNative = false;
        this._triedHls    = false;

        // Pick a starting path from the browser hint, but either route falls
        // back to the other if it stalls or errors — so a single incompatible
        // path (e.g. hls.js failing on old WebOS Chromium) no longer leaves the
        // stream stuck on "Loading…" forever.
        if (this._isHls && !this._canPlayNatively()) this._tryHls(gen);
        else                                          this._tryNative(gen);
    }

    // Watchdog: if no data arrives in time, the chosen path is stuck — fall back.
    _arm(gen, which) {
        this._clearWatchdog();
        const self = this;
        this._watchdog = setTimeout(function () {
            if (gen === self._gen) self._fallback(gen, which);
        }, 14000);
    }

    _fallback(gen, which) {
        if (gen !== this._gen) return;
        this._clearWatchdog();
        const url = this._url;
        if (!url) return;
        if (which === "native" && this._isHls && !this._triedHls) {
            this._tryHls(gen);
        } else if (which === "hls" && !this._triedNative) {
            this.destroyHls();
            this._tryNative(gen);
        } else {
            this.destroyHls();
            this._msg("Can't play this channel.");
        }
    }

    _tryNative(gen) {
        if (gen !== this._gen) return;
        this._triedNative = true;
        const self = this, url = this._url;
        const onPlaying = function () { if (gen === self._gen) { self._clearWatchdog(); self._hideMsg(); } };
        const onData    = function () { if (gen === self._gen) self._clearWatchdog(); };
        const onError   = function () { if (gen === self._gen) self._fallback(gen, "native"); };
        this.video.addEventListener("playing",   onPlaying, { once: true });
        this.video.addEventListener("loadeddata", onData,   { once: true });
        this.video.addEventListener("error",     onError,   { once: true });
        this.destroyHls();
        this.video.src = url;
        this.video.load();
        this.video.play().catch(function () {});
        this._arm(gen, "native");
    }

    _tryHls(gen) {
        if (gen !== this._gen) return;
        this._triedHls = true;
        const self = this, url = this._url;
        this._loadHls(function () {
            if (gen !== self._gen) return;
            if (typeof Hls !== "undefined" && Hls.isSupported()) {
                self._attachHls(gen, url);
                self._arm(gen, "hls");
            } else {
                // hls.js unavailable or unsupported here → let the platform try.
                self._tryNative(gen);
            }
        });
    }

    _attachHls(gen, url) {
        this.destroyHls();
        const self = this;
        this.video.removeAttribute("src");
        this.video.innerHTML = "";
        this.hls = new Hls({ enableWorker: false });
        this.hls.attachMedia(this.video);
        this.hls.on(Hls.Events.MEDIA_ATTACHED,  function () { if (gen === self._gen) self.hls.loadSource(url); });
        this.hls.on(Hls.Events.MANIFEST_PARSED, function () { if (gen === self._gen) self.video.play().catch(function () {}); });
        // Fatal hls.js errors (codec/MSE issues on old Chromium) → fall back.
        this.hls.on(Hls.Events.ERROR, function (e, data) {
            if (gen === self._gen && data && data.fatal) self._fallback(gen, "hls");
        });
        this.video.addEventListener("loadeddata", function () { if (gen === self._gen) self._clearWatchdog(); }, { once: true });
        this.video.addEventListener("playing",    function () { if (gen === self._gen) { self._clearWatchdog(); self._hideMsg(); } }, { once: true });
    }

    _canPlayNatively() {
        if (!this.video || !this.video.canPlayType) return false;
        return !!(
            this.video.canPlayType("application/vnd.apple.mpegURL") ||
            this.video.canPlayType("application/x-mpegURL")
        );
    }

    _loadHls(callback) {
        if (typeof Hls !== "undefined") { callback(); return; }
        if (this._hlsLoading) { this._hlsCallbacks.push(callback); return; }
        this._hlsLoading   = true;
        this._hlsCallbacks = [callback];
        const s = document.createElement("script");
        s.src = "../assets/hls.min.js";
        s.onload  = () => { this._hlsLoading = false; this._hlsCallbacks.forEach(fn => fn()); this._hlsCallbacks = []; };
        s.onerror = () => { this._hlsLoading = false; this._hlsCallbacks.forEach(fn => fn()); this._hlsCallbacks = []; };
        document.head.appendChild(s);
    }
}

const player = new IPTVPlayer();
