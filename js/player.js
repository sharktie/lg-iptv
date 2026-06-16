class IPTVPlayer {
    constructor() {
        this.video    = document.getElementById("player");
        this._pipWrap = document.getElementById("pip-wrap");
        this.hls      = null;
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

    play(url) {
        if (!url) return;

        this.destroyHls();
        this.video.pause();
        this.video.removeAttribute("src");
        this.video.innerHTML = "";
        this.video.style.display = "block";

        this._msg("Loading…");

        const isHls = url.includes(".m3u8");

        if (isHls && !this._canPlayNatively()) {
            // Load HLS.js on demand — not needed for native HLS playback
            this._loadHls(() => {
                if (typeof Hls !== "undefined" && Hls.isSupported()) {
                    this._attachHls(url);
                } else {
                    this._playNative(url, isHls);
                }
            });
            return;
        }

        this._playNative(url, isHls);
    }

    _playNative(url, isHls) {
        const onPlaying = () => { this.video.removeEventListener("error", onError); this._hideMsg(); };
        const onError   = () => {
            this.video.removeEventListener("playing", onPlaying);
            if (isHls) {
                this._loadHls(() => {
                    if (typeof Hls !== "undefined" && Hls.isSupported()) this._attachHls(url);
                });
            }
        };
        this.video.addEventListener("playing", onPlaying, { once: true });
        this.video.addEventListener("error",   onError,   { once: true });
        this.video.src = url;
        this.video.load();
        this.video.play().catch(() => {});
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

    _attachHls(url) {
        this.destroyHls();
        this.hls = new Hls({ enableWorker: false });
        this.hls.attachMedia(this.video);
        this.hls.on(Hls.Events.MEDIA_ATTACHED, () => this.hls.loadSource(url));
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => this.video.play().catch(() => {}));
        this.video.addEventListener("playing", () => this._hideMsg(), { once: true });
    }
}

const player = new IPTVPlayer();
