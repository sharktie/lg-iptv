class IPTVPlayer {
    constructor() {
        this.video    = document.getElementById("player");
        this._pipWrap = document.getElementById("pip-wrap");
        this.hls      = null;
        this._bindEvents();
    }

    // ── Events ────────────────────────────────────────────────────────────────
    _bindEvents() {
        // Handle keyboard input while in fullscreen.
        // fullscreenchange is handled by app.js (onFullscreenChange / setupPip).
        document.addEventListener("keydown", (e) => this._handleKey(e), true);
    }

    _handleKey(e) {
        if (!(document.fullscreenElement || document.webkitFullscreenElement)) return;
        const backKeys = [8, 27, 461, 10009, 10182];
        if (backKeys.includes(e.keyCode) || backKeys.includes(e.which)) {
            e.preventDefault(); e.stopPropagation();
            this.exitFullscreen(); return;
        }
        if ([37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault(); e.stopPropagation();
        }
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

    // ── Fullscreen ────────────────────────────────────────────────────────────
    toggleFullscreen() {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            this.exitFullscreen();
        } else {
            const el = this._pipWrap;
            (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
        }
    }

    exitFullscreen() {
        (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
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
        const hlsAvailable = typeof Hls !== "undefined" && Hls.isSupported();

        // If it's an HLS stream and the browser can't play it natively, go straight to hls.js
        if (isHls && !this._canPlayNatively() && hlsAvailable) {
            this._attachHls(url);
            return;
        }

        // Try native first; fall back to hls.js on error
        const onPlaying = () => {
            this.video.removeEventListener("error", onError);
            this._hideMsg();
        };

        const onError = () => {
            this.video.removeEventListener("playing", onPlaying);
            if (isHls && hlsAvailable) {
                this._attachHls(url);
            }
        };

        this.video.addEventListener("playing", onPlaying, { once: true });
        this.video.addEventListener("error",   onError,   { once: true });

        this.video.src = url;
        this.video.load();
        this.video.play().catch(() => {});
    }

    _canPlayNatively() {
        if (!this.video?.canPlayType) return false;
        return !!(
            this.video.canPlayType("application/vnd.apple.mpegURL") ||
            this.video.canPlayType("application/x-mpegURL")
        );
    }

    _attachHls(url) {
        this.destroyHls();

        this.hls = new Hls({ enableWorker: false });

        this.hls.attachMedia(this.video);

        this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            this.hls.loadSource(url);
        });

        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this.video.play().catch(() => {});
        });

        this.video.addEventListener("playing", () => this._hideMsg(), { once: true });
    }
}

const player = new IPTVPlayer();
