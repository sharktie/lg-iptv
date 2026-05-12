class IPTVPlayer {
    constructor() {
        this.video    = document.getElementById("player");
        this.hls      = null;
        this._fsActive = false;
        this._epgData  = null;
        this._pipWrap  = document.getElementById("pip-wrap");
        this._bindEvents();
        this._buildFSOverlay();
    }

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
        this._fsOverlay = o;
    }

    _bindEvents() {
        this.video.addEventListener("error",   () => this._msg("Stream error — try another channel"));
        this.video.addEventListener("waiting", () => this._msg("Buffering…"));
        this.video.addEventListener("playing", () => this._hideMsg());

        const fsBtn = document.getElementById("pip-fullscreen-btn");
        if (fsBtn) fsBtn.addEventListener("click", () => this.toggleFullscreen());

        document.addEventListener("fullscreenchange",       () => this._onFSChange());
        document.addEventListener("webkitfullscreenchange", () => this._onFSChange());

        document.addEventListener("keydown", (e) => this._handleKey(e), true);
    }

    _handleKey(e) {
        const inFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (!inFS) return;

        const backKeys = [8, 27, 461, 10009, 10182];

        if (backKeys.includes(e.keyCode) || backKeys.includes(e.which)) {
            e.preventDefault();
            e.stopPropagation();
            this.exitFullscreen();
            return;
        }

        if ([37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    _onFSChange() {
        this._fsActive = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (this._fsActive) {
            this._pipWrap.classList.add("fs-active");
            this._refreshFSOverlay();
        } else {
            this._pipWrap.classList.remove("fs-active");
        }
    }

    _refreshFSOverlay() {
        if (!this._epgData) return;
        const d = this._epgData;
        this._setText("fs-channel-name",   d.channelName  || "");
        this._setText("fs-now-title",      d.nowTitle     || "—");
        this._setText("fs-now-time",       d.nowTime      || "");
        this._setText("fs-now-desc",       d.nowDesc      || "");
        this._setText("fs-next-title",     d.nextTitle    || "—");
        this._setText("fs-next-time",      d.nextTime     || "");
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

    toggleFullscreen() {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            this.exitFullscreen();
        } else {
            const el = this._pipWrap;
            if      (el.requestFullscreen)       el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        }
    }

    exitFullscreen() {
        if      (document.exitFullscreen)       document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }

    _msg(text) {
        const el = document.getElementById("player-msg");
        if (el) { el.textContent = text; el.style.display = "flex"; }
    }

    _hideMsg() {
        const el = document.getElementById("player-msg");
        if (el) el.style.display = "none";
    }

    _destroy() {
        if (this.hls) { this.hls.destroy(); this.hls = null; }
        this.video.removeAttribute("src");
        this.video.load();
    }

    play(url) {
        if (!url) return;
        this._destroy();
        this._msg("Loading…");

        if (window.Hls && Hls.isSupported()) {
            this.hls = new Hls({
                enableWorker:             true,
                lowLatencyMode:           true,
                maxBufferLength:          8,
                maxMaxBufferLength:       16,
                maxBufferSize:            24 * 1000 * 1000,
                abrEwmaDefaultEstimate:   1000000,
                startLevel:              -1,
                fragLoadingMaxRetry:      3,
                manifestLoadingMaxRetry:  3,
            });

            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);

            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.video.play().catch(() => {});
            });

            this.hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
                const tracks = data.audioTracks || [];
                const aacIdx = tracks.findIndex(t =>
                    !t.codec || /mp4a|aac/i.test(t.codec || "")
                );
                if (aacIdx >= 0 && this.hls.audioTrack !== aacIdx) {
                    this.hls.audioTrack = aacIdx;
                }
            });

            this.hls.on(Hls.Events.ERROR, (_, data) => {
                if (!data.fatal) return;
                if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    if (data.details === "bufferIncompatibleCodecsError") {
                        this._destroy();
                        this.play(url);
                    } else {
                        this.hls.recoverMediaError();
                    }
                } else {
                    this._msg("Failed to load stream");
                    this._destroy();
                }
            });

        } else if (this.video.canPlayType("application/vnd.apple.mpegurl")) {
            this.video.src = url;
            this.video.play().catch(() => {});
        } else {
            this._msg("HLS not supported on this device");
        }
    }
}

const player = new IPTVPlayer();
