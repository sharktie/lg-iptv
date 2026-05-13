class IPTVPlayer {
    constructor() {
        this.video     = document.getElementById("player");
        this.hls       = null;
        this._pipWrap  = document.getElementById("pip-wrap");
        this._fsActive = false;
        this._epgData  = null;
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
        this.video.addEventListener("waiting", () => this._msg("Buffering…"));
        this.video.addEventListener("playing", () => this._hideMsg());
        this.video.addEventListener("stalled", () => this._msg("Buffering…"));

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

    // ── Teardown ──────────────────────────────────────────────────────────────
    _destroy() {
        if (this.hls) { this.hls.destroy(); this.hls = null; }
        this.video.pause();
        this.video.removeAttribute("src");
        // Do NOT call video.load() — with no src it fires a spurious async error
        // on webOS that gets caught by the next play attempt's error handler.
    }

    // ── Playback ──────────────────────────────────────────────────────────────
    play(url) {
        if (!url) return;
        this._destroy();
        this._msg("Loading…");

        // Try the webOS native player first — it handles HDR, Dolby Vision,
        // H.265, AC3 and everything else the TV supports natively.
        // If it fires an error, fall back to hls.js.
        this.video.src = url;
        this.video.load();

        const onError = () => {
            console.log("[player] Native failed (code " + this.video.error?.code + ") — trying hls.js");
            // Clear src before switching so no second spurious error fires.
            this.video.removeAttribute("src");
            this._playHLS(url);
        };

        this.video.addEventListener("error", onError, { once: true });

        // Cancel the error handler the moment native playback succeeds.
        this.video.addEventListener("playing", () => {
            this.video.removeEventListener("error", onError);
        }, { once: true });

        this.video.play().catch(() => {});
    }

    _playHLS(url) {
        this.hls = new Hls({
            enableWorker:            false,
            maxBufferLength:         10,
            maxMaxBufferLength:      20,
            maxBufferSize:           16 * 1000 * 1000,
            fragLoadingMaxRetry:     3,
            manifestLoadingMaxRetry: 3,
        });

        this.hls.loadSource(url);
        this.hls.attachMedia(this.video);

        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this.video.play().catch(() => {});
        });

        this.hls.on(Hls.Events.ERROR, (_, data) => {
            if (!data.fatal) return;
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                this.hls.recoverMediaError();
            } else {
                this._msg("Stream error — try another channel");
                this.hls.destroy();
                this.hls = null;
            }
        });
    }
}

const player = new IPTVPlayer();