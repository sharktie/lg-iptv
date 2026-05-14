class IPTVPlayer {
    constructor() {
        this.video    = document.getElementById("player");
        this._pipWrap = document.getElementById("pip-wrap");
        this._fsActive = false;
        this._epgData  = null;
        this.hls       = null;
        this._buildFSOverlay();
        this._bindEvents();
    }

    // ── Fullscreen overlay ────────────────────────────────────────────────────
    _buildFSOverlay() {
        const o = document.createElement("div");
        o.id = "fs-overlay";
        o.innerHTML =
            '<div id="fs-channel-name"></div>' +
            '<div id="fs-epg-wrap">' +
                '<div id="fs-epg-now">' +
                    '<span class="fs-badge now">NOW</span>' +
                    '<div class="fs-epg-body">' +
                        '<div id="fs-now-title"></div>' +
                        '<div id="fs-now-time"></div>' +
                        '<div id="fs-now-desc"></div>' +
                        '<div id="fs-epg-bar"><div id="fs-epg-bar-fill"></div></div>' +
                    '</div>' +
                '</div>' +
                '<div id="fs-epg-next">' +
                    '<span class="fs-badge next">NEXT</span>' +
                    '<div class="fs-epg-body">' +
                        '<div id="fs-next-title"></div>' +
                        '<div id="fs-next-time"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        this._pipWrap.appendChild(o);
    }

    // ── Events ────────────────────────────────────────────────────────────────
    _bindEvents() {
        document.addEventListener("fullscreenchange",       () => this._onFSChange());
        document.addEventListener("webkitfullscreenchange", () => this._onFSChange());
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

    _onFSChange() {
        this._fsActive = !!(document.fullscreenElement || document.webkitFullscreenElement);
        this._pipWrap.classList.toggle("fs-active", this._fsActive);
        if (this._fsActive) this._refreshFSOverlay();
    }

    // ── EPG overlay ───────────────────────────────────────────────────────────
    _refreshFSOverlay() {
        if (!this._epgData) return;
        const d = this._epgData;
        this._setText("fs-channel-name", d.channelName || "");
        this._setText("fs-now-title",    d.nowTitle    || "—");
        this._setText("fs-now-time",     d.nowTime     || "");
        this._setText("fs-now-desc",     d.nowDesc     || "");
        this._setText("fs-next-title",   d.nextTitle   || "—");
        this._setText("fs-next-time",    d.nextTime    || "");
        const fill = document.getElementById("fs-epg-bar-fill");
        if (fill) fill.style.width = (d.progress || 0) + "%";
    }

    _setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    setEPG(data) {
        this._epgData = data;
        if (this._fsActive) this._refreshFSOverlay();
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
            // If no fallback available we just leave the loading message — better than a false error
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