class IPTVPlayer {
    constructor() {
        this.video     = document.getElementById("player");
        this._pipWrap  = document.getElementById("pip-wrap");
        this._fsActive = false;
        this._epgData  = null;
        this._loadTimeout = null;
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
        this.video.addEventListener("waiting", () => {
            if (!this.video.paused && !this.video.ended) this._msg("Buffering…");
        });
        this.video.addEventListener("stalled", () => {
            if (!this.video.paused && !this.video.ended) this._msg("Buffering…");
        });
        this.video.addEventListener("playing", () => this._hideMsg());
        this.video.addEventListener("canplay", () => this._hideMsg());
        this.video.addEventListener("canplaythrough", () => this._hideMsg());
        this.video.addEventListener("progress", () => {
            if (!this.video.paused && this.video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
                this._hideMsg();
            }
        });

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
        if (el) {
            el.textContent = text;
            el.style.display = "flex";
        }
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
        if (this._loadTimeout) {
            clearTimeout(this._loadTimeout);
            this._loadTimeout = null;
        }
    }

    play(url) {
        if (!url) return;

        if (this._loadTimeout) {
            clearTimeout(this._loadTimeout);
            this._loadTimeout = null;
        }

        this.destroyHls();
        this.video.pause();
        this.video.removeAttribute("src");
        this.video.removeAttribute("type");
        this.video.innerHTML = "";
        this.video.style.display = "block";

        this._msg("Loading…");

        const cleanup = (handlers = []) => {
            handlers.forEach(({ event, listener }) => {
                this.video.removeEventListener(event, listener);
            });
            if (this._loadTimeout) {
                clearTimeout(this._loadTimeout);
                this._loadTimeout = null;
            }
        };

        const onError = () => {
            cleanup([{ event: "playing", listener: onPlaying }, { event: "error", listener: onError }]);
            if (typeof Hls !== "undefined" && Hls.isSupported() && url.includes(".m3u8")) {
                this.attachHls(url);
            } else {
                this._msg("Stream appears empty — provider or stream issue");
            }
        };

        const onPlaying = () => {
            cleanup([{ event: "playing", listener: onPlaying }, { event: "error", listener: onError }]);
            this._hideMsg();
        };

        this.video.addEventListener("error", onError, { once: true });
        this.video.addEventListener("playing", onPlaying, { once: true });

        this._loadTimeout = setTimeout(() => {
            cleanup([{ event: "playing", listener: onPlaying }, { event: "error", listener: onError }]);
            if (typeof Hls !== "undefined" && Hls.isSupported() && url.includes(".m3u8")) {
                this.attachHls(url);
            } else {
                this._msg("Stream appears empty — provider or stream issue");
            }
        }, 15000);

        this.video.src = url;
        this.video.load();
        this.video.play().catch(() => {});
    }

    canPlayHlsNatively() {
        if (!this.video || !this.video.canPlayType) return false;
        const can = this.video.canPlayType("application/vnd.apple.mpegURL") || this.video.canPlayType("application/x-mpegURL");
        return !!can;
    }

    attachHls(url) {
        this.destroyHls();
        if (typeof Hls === "undefined" || !Hls.isSupported()) {
            this._msg("Stream appears empty — provider or stream issue");
            return;
        }

        this.hls = new Hls({
            enableWorker: false,
            xhrSetup: (xhr) => {
                xhr.withCredentials = false;
            }
        });

        this.hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                this._msg("Stream appears empty — provider or stream issue");
                this.hls.destroy();
            }
        });

        this.hls.attachMedia(this.video);
        this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            this.hls.loadSource(url);
            this._msg("Loading…");
        });

        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this.video.play().catch(() => {});
        });

        const onPlaying = () => {
            this.video.removeEventListener("playing", onPlaying);
            this.video.removeEventListener("error", onError);
            if (this._loadTimeout) {
                clearTimeout(this._loadTimeout);
                this._loadTimeout = null;
            }
            this._hideMsg();
        };

        const onError = () => {
            this.video.removeEventListener("playing", onPlaying);
            this.video.removeEventListener("error", onError);
            if (this._loadTimeout) {
                clearTimeout(this._loadTimeout);
                this._loadTimeout = null;
            }
            this._msg("Stream appears empty — provider or stream issue");
            this.destroyHls();
        };

        this.video.addEventListener("playing", onPlaying, { once: true });
        this.video.addEventListener("error", onError, { once: true });

        this._loadTimeout = setTimeout(() => {
            this.video.removeEventListener("playing", onPlaying);
            this.video.removeEventListener("error", onError);
            this._msg("Stream appears empty — provider or stream issue");
            this.destroyHls();
        }, 15000);
    }
}

const player = new IPTVPlayer();