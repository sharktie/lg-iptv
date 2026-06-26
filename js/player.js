/* Helpers for human-readable playback diagnostics. */
function _esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function _mediaErrText(err) {
    if (!err) return "playback error";
    var map = { 1: "aborted", 2: "network error", 3: "decode error — codec not supported", 4: "format/codec not supported" };
    var t = map[err.code] || ("error " + err.code);
    if (err.message) t += " — " + err.message;
    return t;
}
function _isDolby(c) {
    c = (c || "").toLowerCase();
    return c.indexOf("ec-3") !== -1 || c.indexOf("ac-3") !== -1 ||
           c.indexOf("eac3") !== -1 || c.indexOf("ac3") !== -1 ||
           c.indexOf("mp4a.a5") !== -1 || c.indexOf("mp4a.a6") !== -1;
}
function _isHevc(s) {
    s = (s || "").toLowerCase();
    return s.indexOf("hvc") !== -1 || s.indexOf("hev") !== -1 ||
           s.indexOf("h265") !== -1 || s.indexOf("hevc") !== -1 || s.indexOf("h.265") !== -1;
}

/*
 * IPTVPlayer — simple, honest tiered playback.
 *
 *   Tier 1  native <video>   (platform/hardware pipeline — HEVC, HDR, Dolby)
 *   Tier 2  hls.js (MSE)     (software HLS demux — H.264/AAC)
 *   Tier 3  native on .ts    (raw MPEG-TS via the platform; live only)
 *
 * Auto-advance happens ONLY on a real `error` or a genuine no-data stall.
 * "Playing" = success; we never second-guess a stream that's actually running
 * (the old decoded-frame heuristic falsely failed HDR playback). If a stream
 * plays but is black, the user cycles engines manually with the RED button.
 *
 * Remote: RED = cycle engine · GREEN = diagnostics · YELLOW = lowest quality.
 */
class IPTVPlayer {
    constructor() {
        this.video    = document.getElementById("player");
        this._pipWrap = document.getElementById("pip-wrap");
        this.hls      = null;
        this._watchdog = null;
        this._gen      = 0;   // bumped per play()    — neutralises a previous channel
        this._tok      = 0;   // bumped per attempt   — neutralises a previous tier
        this._manual   = false;
        this._lowQuality = false;
        this._diag     = [];
        this._codecs   = null;
        this._res      = "";
        this._activeEngine = "";
        this.video.tabIndex = -1;   // input handled by dpad.js
        this._setupKeys();
    }

    // ── Remote color-button shortcuts ───────────────────────────────────────────
    _setupKeys() {
        const self = this;
        window.addEventListener("keydown", function (e) {
            const kc = e.keyCode || e.which;
            if (kc === 403 /* RED */ || kc === 67 /* 'c' */)            { e.preventDefault(); self.cycleEngine(); }
            else if (kc === 404 /* GREEN */ || kc === 68 /* 'd' */)     { e.preventDefault(); self._toggleDiag(); }
            else if (kc === 405 /* YELLOW */ || kc === 76 /* 'l' */)    { e.preventDefault(); self.tryLowestQuality(); }
        }, true);
    }

    // ── UI messages ─────────────────────────────────────────────────────────────
    _msg(text) {
        const el = document.getElementById("player-msg");
        if (el) { el.textContent = text; el.style.display = "flex"; }
    }
    _hideMsg() {
        const el = document.getElementById("player-msg");
        if (el) el.style.display = "none";
    }
    _showError() {
        this._lastError = this._diag.slice();   // technical detail → GREEN overlay only
        const diagStr = this._diag.join(" ");
        let hint = "This channel couldn’t be played right now.";
        if ((this._codecs && _isHevc(this._codecs.v)) || _isHevc(diagStr)) {
            hint = "This may be a 4K/HEVC channel — press RED to try another player, or use the HD version.";
        } else if (this._codecs && _isDolby(this._codecs.a)) {
            hint = "This channel uses Dolby audio — press RED to try another player, or use the HD version.";
        } else {
            hint = "Press RED to try a different player.";
        }
        const el = document.getElementById("player-msg");
        if (el) {
            el.innerHTML = '<div class="pm-title">Can’t play this channel</div><div class="pm-detail">' + _esc(hint) + "</div>";
            el.style.display = "flex";
        }
    }
    // Brief centred toast (engine name when cycling).
    _flash(text) {
        let el = this._flashEl;
        if (!el) {
            el = document.createElement("div");
            el.style.cssText = "position:absolute;top:16px;left:50%;z-index:99999;" +
                "-webkit-transform:translateX(-50%);transform:translateX(-50%);" +
                "background:rgba(0,0,0,0.78);color:#fff;font:600 16px/1 'Outfit',-apple-system,sans-serif;" +
                "padding:12px 22px;border-radius:999px;pointer-events:none;";
            (this._pipWrap || document.body).appendChild(el);
            this._flashEl = el;
        }
        el.textContent = text;
        el.style.display = "block";
        clearTimeout(this._flashTimer);
        const self = this;
        this._flashTimer = setTimeout(function () { if (self._flashEl) self._flashEl.style.display = "none"; }, 1500);
    }

    // ── Diagnostics overlay (GREEN) ─────────────────────────────────────────────
    _decodedFrames() {                       // display-only; never drives fallback
        const v = this.video;
        try {
            if (v.getVideoPlaybackQuality) {
                const q = v.getVideoPlaybackQuality();
                if (q && typeof q.totalVideoFrames === "number") return q.totalVideoFrames;
            }
        } catch (_) {}
        if (typeof v.webkitDecodedFrameCount === "number") return v.webkitDecodedFrameCount;
        return -1;
    }
    _toggleDiag() {
        if (this._diagEl) {
            clearInterval(this._diagTimer); this._diagTimer = null;
            if (this._diagEl.parentNode) this._diagEl.parentNode.removeChild(this._diagEl);
            this._diagEl = null;
            return;
        }
        const el = document.createElement("div");
        el.style.cssText = "position:absolute;top:14px;left:14px;z-index:99999;background:rgba(0,0,0,0.82);" +
            "color:#43e57a;font:14px/1.65 monospace;padding:14px 18px;border-radius:12px;" +
            "pointer-events:none;white-space:pre;letter-spacing:0.3px;";
        (this._pipWrap || document.body).appendChild(el);
        this._diagEl = el;
        const self = this;
        this._diagTimer = setInterval(function () { self._updateDiag(); }, 500);
        this._updateDiag();
    }
    _updateDiag() {
        if (!this._diagEl) return;
        const v = this.video, frames = this._decodedFrames();
        this._diagEl.textContent = [
            "engine  : " + (this._activeEngine || "—") + (this._manual ? " (manual)" : "") +
                "   tier " + ((this._attemptIdx || 0) + 1) + "/" + ((this._attempts && this._attempts.length) || 1),
            "res     : " + (v.videoWidth || 0) + "×" + (v.videoHeight || 0),
            "codec   : " + (this._codecs ? ((this._codecs.v || "?") + " / " + (this._codecs.a || "?")) : "n/a (native)"),
            "time    : " + (v.currentTime || 0).toFixed(1) + (isFinite(v.duration) ? " / " + v.duration.toFixed(1) : " (live)") + "   paused:" + v.paused,
            "ready   : " + v.readyState + "   network:" + v.networkState,
            "frames  : " + (frames < 0 ? "n/a" : frames),
            "error   : " + (v.error ? _mediaErrText(v.error) : "—"),
            "lowQ    : " + (this._lowQuality ? "on" : "off"),
            "tried   : " + ((this._diag && this._diag.length) ? this._diag.join(" | ") : "—"),
            "",
            "(RED cycle · GREEN close · YELLOW lowest)"
        ].join("\n");
    }

    // ── Engine plumbing ─────────────────────────────────────────────────────────
    destroyHls() {
        if (this.hls) { try { this.hls.destroy(); } catch (_) {} this.hls = null; }
    }
    _clearWatchdog() {
        if (this._watchdog) { clearTimeout(this._watchdog); this._watchdog = null; }
    }
    _resetVideo() {
        try { this.video.pause(); } catch (_) {}
        this.destroyHls();
        this.video.removeAttribute("src");
        this.video.innerHTML = "";
        try { this.video.load(); } catch (_) {}
    }
    _alive(gen, tok) { return gen === this._gen && tok === this._tok; }

    play(url) {
        if (!url) return;
        if (url !== this._lastUrl) this._lowQuality = false;   // new channel → normal ABR
        this._lastUrl = url;
        const gen = ++this._gen;
        this._tok++;
        this._manual = false;
        this._clearWatchdog();
        this._resetVideo();
        this.video.style.display = "block";
        this._msg("Loading…");

        this._diag   = [];
        this._codecs = null;
        this._res    = "";
        this._attempts   = this._buildAttempts(url);
        this._attemptIdx = 0;
        this._runAttempt(gen);
    }

    _buildAttempts(url) {
        const isHls = url.indexOf(".m3u8") !== -1;
        const list = [{ engine: "native", url: url, label: "Native" }];
        if (isHls) {
            list.push({ engine: "hls", url: url, label: "HLS" });
            const ts = url.replace(/\.m3u8(\?[^#]*)?$/i, ".ts$1");
            if (ts !== url) list.push({ engine: "native", url: ts, label: "Native (TS)" });
        }
        return list;
    }

    _runAttempt(gen) {
        if (gen !== this._gen) return;
        const a = this._attempts[this._attemptIdx];
        if (!a) { this.destroyHls(); this._showError(); return; }
        const tok = this._tok;
        this._activeEngine = a.label;
        if (a.engine === "hls") this._playHls(gen, tok, a.url);
        else                    this._playNative(gen, tok, a.url);
    }

    // Auto-advance to the next tier — disabled in manual mode (the user drives).
    _next(gen, reason) {
        if (gen !== this._gen) return;
        this._clearWatchdog();
        if (reason) this._diag.push(reason);
        if (this._manual) return;
        this._tok++;
        this._attemptIdx++;
        this.destroyHls();
        this._runAttempt(gen);
    }

    // RED: manually switch to the next engine and stay there.
    cycleEngine() {
        if (!this._lastUrl || !this._attempts || this._attempts.length < 2) return;
        this._manual = true;
        const gen = ++this._gen;
        this._tok++;
        this._clearWatchdog();
        this.destroyHls();
        this._attemptIdx = (this._attemptIdx + 1) % this._attempts.length;
        this._flash("Player: " + this._attempts[this._attemptIdx].label);
        this._msg("Loading…");
        this._resetVideo();
        this.video.style.display = "block";
        this._runAttempt(gen);
    }

    // Stall watchdog — fires only if NOTHING loads (no data, no error). Auto only.
    _arm(gen, tok) {
        this._clearWatchdog();
        if (this._manual) return;
        const self = this;
        this._watchdog = setTimeout(function () {
            if (self._alive(gen, tok)) self._next(gen, self._activeEngine + ": no data after 12s");
        }, 12000);
    }

    _playNative(gen, tok, url) {
        if (!this._alive(gen, tok)) return;
        const self = this;
        const onSuccess = function () { if (self._alive(gen, tok)) { self._clearWatchdog(); self._hideMsg(); } };
        const onData    = function () { if (self._alive(gen, tok)) self._clearWatchdog(); };   // data flowing → not a stall
        const onMeta    = function () { if (self._alive(gen, tok) && self.video.videoWidth) self._res = self.video.videoWidth + "×" + self.video.videoHeight; };
        const onError   = function () { if (self._alive(gen, tok)) self._next(gen, "Native: " + _mediaErrText(self.video.error)); };
        this.video.addEventListener("playing",        onSuccess, { once: true });
        this.video.addEventListener("loadeddata",     onData,    { once: true });
        this.video.addEventListener("loadedmetadata", onMeta,    { once: true });
        this.video.addEventListener("error",          onError,   { once: true });
        this.video.src = url;
        this.video.load();
        this.video.play().catch(function () {});
        this._arm(gen, tok);
    }

    _playHls(gen, tok, url) {
        if (!this._alive(gen, tok)) return;
        const self = this;
        this._loadHls(function () {
            if (!self._alive(gen, tok)) return;
            if (typeof Hls !== "undefined" && Hls.isSupported()) self._attachHls(gen, tok, url);
            else self._next(gen, "HLS.js unsupported on this browser");
        });
    }

    _attachHls(gen, tok, url) {
        this.destroyHls();
        const self = this;
        this.hls = new Hls({
            enableWorker: false, debug: false,
            maxBufferLength: 24, maxMaxBufferLength: 60,
            manifestLoadingTimeOut: 8000, manifestLoadingMaxRetry: 1,
            levelLoadingMaxRetry: 2, fragLoadingMaxRetry: 3
        });
        this.hls.attachMedia(this.video);
        this.hls.on(Hls.Events.MEDIA_ATTACHED,  function () { if (self._alive(gen, tok)) self.hls.loadSource(url); });
        this.hls.on(Hls.Events.MANIFEST_PARSED, function (ev, data) {
            if (!self._alive(gen, tok)) return;
            try {
                const lv = (self.hls.levels && self.hls.levels[0]) || (data && data.levels && data.levels[0]);
                if (lv) {
                    self._codecs = { v: lv.videoCodec || "", a: lv.audioCodec || "" };
                    if (lv.width && lv.height) self._res = lv.width + "×" + lv.height;
                }
                const tracks = self.hls.audioTracks;
                if (tracks && tracks.length > 1) {           // prefer a non-Dolby audio track
                    for (let i = 0; i < tracks.length; i++) {
                        const ac = (tracks[i].audioCodec || tracks[i].codec || "").toLowerCase();
                        if (ac && !_isDolby(ac)) { try { self.hls.audioTrack = i; } catch (_) {} break; }
                    }
                }
                if (self._codecs && !self._codecs.a && tracks && tracks[0]) {
                    self._codecs.a = tracks[0].audioCodec || tracks[0].codec || "";
                }
                if (self._lowQuality && self.hls.levels && self.hls.levels.length) {
                    self.hls.autoLevelCapping = 0; self.hls.currentLevel = 0;
                }
            } catch (_) {}
            self.video.play().catch(function () {});
        });
        this.hls.on(Hls.Events.ERROR, function (e, data) {
            if (!self._alive(gen, tok) || !data || !data.fatal) return;
            let d = data.details || data.type || "fatal error";
            if (data.reason) d += " (" + data.reason + ")";
            self._next(gen, "HLS: " + d);
        });
        this.video.addEventListener("playing",    function () { if (self._alive(gen, tok)) { self._clearWatchdog(); self._hideMsg(); } }, { once: true });
        this.video.addEventListener("loadeddata", function () { if (self._alive(gen, tok)) self._clearWatchdog(); }, { once: true });
        this._arm(gen, tok);
    }

    // ── Subtitles ───────────────────────────────────────────────────────────────
    listSubtitles() {
        const out = [];
        if (this.hls && this.hls.subtitleTracks) {
            for (let i = 0; i < this.hls.subtitleTracks.length; i++) {
                const t = this.hls.subtitleTracks[i];
                out.push({ src: "hls", id: i, label: t.name || t.lang || ("Subtitle " + (i + 1)) });
            }
        }
        const tt = this.video.textTracks;
        if (tt) {
            for (let i = 0; i < tt.length; i++) {
                const k = tt[i].kind;
                if (k === "subtitles" || k === "captions" || k === "") {
                    out.push({ src: "native", id: i, label: tt[i].label || tt[i].language || ("Track " + (i + 1)) });
                }
            }
        }
        return out;
    }
    setSubtitle(track) {
        const tt = this.video.textTracks;
        if (tt) for (let i = 0; i < tt.length; i++) tt[i].mode = "disabled";
        if (this.hls) { try { this.hls.subtitleDisplay = false; this.hls.subtitleTrack = -1; } catch (_) {} }
        if (!track || track === "off") { this._activeSub = "off"; return; }
        if (track.src === "hls" && this.hls) {
            try { this.hls.subtitleDisplay = true; this.hls.subtitleTrack = track.id; } catch (_) {}
        } else if (track.src === "native" && tt && tt[track.id]) {
            tt[track.id].mode = "showing";
        }
        this._activeSub = track;
    }
    addExternalSubs(list) {
        if (!list || !list.length) return;
        const self = this;
        list.forEach(function (s) {
            const url = s && (s.url || s.src || s);
            if (!url || typeof url !== "string") return;
            const lang = (s && (s.lang || s.language)) || "";
            fetch(url).then(function (r) { return r.ok ? r.text() : null; }).then(function (text) {
                if (!text) return;
                const vtt = /^WEBVTT/.test(text.trim()) ? text : self._srtToVtt(text);
                const el = document.createElement("track");
                el.kind = "subtitles";
                el.label = (s && s.label) || lang.toUpperCase() || "Subtitles";
                if (lang) el.srclang = lang;
                el.src = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
                self.video.appendChild(el);
            }).catch(function () {});
        });
    }
    _srtToVtt(srt) {
        return "WEBVTT\n\n" + String(srt)
            .replace(/\r+/g, "")
            .replace(/^\d+\s*$/gm, "")
            .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    tryLowestQuality() {
        if (!this._lastUrl) return;
        this._lowQuality = true;
        this.play(this._lastUrl);
        this._flash("Lowest quality");
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
