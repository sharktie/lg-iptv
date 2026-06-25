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
function _dolbyName(c) {
    c = (c || "").toLowerCase();
    if (c.indexOf("ec-3") !== -1 || c.indexOf("eac3") !== -1 || c.indexOf("mp4a.a6") !== -1) return "Dolby Digital+";
    return "Dolby Digital";
}
function _isHevc(s) {
    s = (s || "").toLowerCase();
    return s.indexOf("hvc") !== -1 || s.indexOf("hev") !== -1 ||
           s.indexOf("h265") !== -1 || s.indexOf("hevc") !== -1 || s.indexOf("h.265") !== -1;
}

/*
 * IPTVPlayer — tiered fallback so a stream gets every reasonable shot at playing.
 * Order (each tier only runs if the previous one fails or stalls):
 *   1. Native <video> on the original URL  — the platform/hardware pipeline,
 *      the ONLY path that can do HEVC / Dolby, given the first clean attempt.
 *   2. hls.js (MSE)                          — software HLS demux (H.264/AAC).
 *   3. Native <video> on the raw .ts URL     — platform pipeline on raw MPEG-TS,
 *      rescues HLS-packaging failures (live only).
 * Transitions are error-driven (fast); a watchdog only guards true stalls and is
 * cancelled the moment the format is accepted (loadedmetadata) so slow 4K buffers
 * aren't cut off. _gen guards channel changes; _tok guards stale attempt events.
 */
class IPTVPlayer {
    constructor() {
        this.video    = document.getElementById("player");
        this._pipWrap = document.getElementById("pip-wrap");
        this.hls      = null;
        this._watchdog = null;
        this._monitor  = null;
        this._gen      = 0;   // bumped per play() — neutralises a previous channel
        this._tok      = 0;   // bumped per attempt — neutralises a previous tier
        this._diag     = [];
        this._codecs   = null;
        this._res      = "";
        this._activeEngine = "";
        this.video.tabIndex = -1;   // input handled by dpad.js
        this._setupDiag();
    }

    // ── Live diagnostics overlay (GREEN button) ─────────────────────────────────
    _setupDiag() {
        const self = this;
        window.addEventListener("keydown", function (e) {
            const kc = e.keyCode || e.which;
            if (kc === 404 /* GREEN */ || kc === 68 /* 'd' */) { e.preventDefault(); self._toggleDiag(); }
            else if (kc === 405 /* YELLOW */ || kc === 76 /* 'l' */) { e.preventDefault(); self.tryLowestQuality(); }
        }, true);
    }
    _toggleDiag() {
        if (this._diagEl) {
            clearInterval(this._diagTimer); this._diagTimer = null;
            if (this._diagEl.parentNode) this._diagEl.parentNode.removeChild(this._diagEl);
            this._diagEl = null;
            return;
        }
        const el = document.createElement("div");
        el.id = "player-diag";
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
        const lines = [
            "engine  : " + (this._activeEngine || "—") + "   tier " + ((this._attemptIdx || 0) + 1) + "/" + ((this._attempts && this._attempts.length) || 1),
            "res     : " + (v.videoWidth || 0) + "×" + (v.videoHeight || 0),
            "codec   : " + (this._codecs ? ((this._codecs.v || "?") + " / " + (this._codecs.a || "?")) : "n/a (native path)"),
            "time    : " + (v.currentTime || 0).toFixed(1) + (isFinite(v.duration) ? " / " + v.duration.toFixed(1) : " (live)") + "   paused:" + v.paused,
            "ready   : " + v.readyState + "   network:" + v.networkState,
            "frames  : " + (frames < 0 ? "n/a (no API)" : frames),
            "error   : " + (v.error ? _mediaErrText(v.error) : "—"),
            "lowQ    : " + (this._lowQuality ? "on" : "off"),
            "tried   : " + ((this._diag && this._diag.length) ? this._diag.join(" | ") : "—"),
            "",
            "(GREEN close · YELLOW lowest-quality)"
        ];
        this._diagEl.textContent = lines.join("\n");
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
    _showError() {
        // Keep the technical detail for the GREEN debug overlay only — the user
        // sees a clean, friendly message with no scary codes.
        this._lastError = this._diag.slice();
        const diagStr = this._diag.join(" ");
        let hint = "This channel couldn’t be played right now.";
        if ((this._codecs && _isHevc(this._codecs.v)) || _isHevc(diagStr)) {
            hint = "This may be a 4K/HEVC channel — try the HD version if your provider has one.";
        } else if (this._codecs && _isDolby(this._codecs.a)) {
            hint = "This channel uses Dolby audio — try the HD version if your provider has one.";
        }
        const el = document.getElementById("player-msg");
        if (el) {
            el.innerHTML = '<div class="pm-title">Can’t play this channel</div><div class="pm-detail">' + _esc(hint) + "</div>";
            el.style.display = "flex";
        }
    }

    // ── Engine plumbing ───────────────────────────────────────────────────────
    destroyHls() {
        if (this.hls) { try { this.hls.destroy(); } catch (_) {} this.hls = null; }
    }
    _clearWatchdog() {
        if (this._watchdog) { clearTimeout(this._watchdog); this._watchdog = null; }
        if (this._monitor)  { clearInterval(this._monitor); this._monitor = null; }
    }

    // How many video frames the decoder has actually produced (best-effort —
    // lets us catch "audio plays, video is black" failures). -1 = can't tell.
    _decodedFrames() {
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

    // Watch for REAL playback. Success = time advancing AND frames decoding.
    // Catches: a total stall, and "black screen" (time advances via audio but no
    // video frames) — both fall through to the next tier instead of hanging.
    _monitorPlayback(gen, tok, label) {
        this._clearWatchdog();
        const self = this, v = this.video, start = Date.now();
        let lastT = -1, blackSince = 0;
        this._monitor = setInterval(function () {
            if (!self._alive(gen, tok)) { self._clearWatchdog(); return; }
            const t = v.currentTime || 0;
            const advancing = t > 0.05 && t > lastT + 0.05;   // actually started AND moving
            lastT = t;
            const frames = self._decodedFrames();

            if (advancing) {
                if (frames !== 0) { self._clearWatchdog(); self._hideMsg(); return; }  // real video (or unknown)
                if (!blackSince) blackSince = Date.now();
                else if (Date.now() - blackSince > 3500) {
                    self._next(gen, label + ": video not decoding — black screen" + (self._res ? " (" + self._res + ")" : ""));
                }
            } else {
                blackSince = 0;
            }

            if (Date.now() - start > 15000 && t < 0.2) {
                self._next(gen, label + ": timed out — no playback after 15s");
            }
        }, 1000);
    }
    _resetVideo() {
        try { this.video.pause(); } catch (_) {}
        this.destroyHls();
        this.video.removeAttribute("src");
        this.video.innerHTML = "";
        try { this.video.load(); } catch (_) {}
    }

    // Re-play the current stream pinned to the lowest variant — often an SDR /
    // 8-bit rendition that renders where the HDR/10-bit one decodes to black.
    tryLowestQuality() {
        if (!this._lastUrl) return;
        this._lowQuality = true;
        this.play(this._lastUrl);
        this._msg("Trying lowest quality…");
    }

    play(url) {
        if (!url) return;
        if (url !== this._lastUrl) this._lowQuality = false;   // new channel → normal ABR
        this._lastUrl = url;
        const gen = ++this._gen;
        this._tok++;                       // any in-flight attempt is now stale
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
        const list = [{ engine: "native", url: url }];
        if (isHls) {
            list.push({ engine: "hls", url: url });
            const ts = url.replace(/\.m3u8(\?[^#]*)?$/i, ".ts$1");
            if (ts !== url) list.push({ engine: "native", url: ts });
        }
        return list;
    }

    _runAttempt(gen) {
        if (gen !== this._gen) return;
        const a = this._attempts[this._attemptIdx];
        if (!a) { this.destroyHls(); this._showError(); return; }
        const tok = this._tok;
        this._activeEngine = a.engine === "hls" ? "hls.js" : ("native" + (a.url.indexOf(".ts") !== -1 ? " (.ts)" : ""));
        if (a.engine === "hls") this._playHls(gen, tok, a.url);
        else                    this._playNative(gen, tok, a.url);
    }

    // Advance to the next tier. Bumps _tok first so the failing tier's lingering
    // listeners (and any spurious "error" from resetting the element) go silent.
    _next(gen, reason) {
        if (gen !== this._gen) return;
        this._clearWatchdog();
        if (reason) this._diag.push(reason);
        this._tok++;
        this._attemptIdx++;
        this.destroyHls();
        this._runAttempt(gen);
    }

    _alive(gen, tok) { return gen === this._gen && tok === this._tok; }

    _playNative(gen, tok, url) {
        if (!this._alive(gen, tok)) return;
        const self = this;
        const onMeta  = function () {
            if (!self._alive(gen, tok)) return;
            if (self.video.videoWidth && self.video.videoHeight) self._res = self.video.videoWidth + "×" + self.video.videoHeight;
        };
        const onError = function () { if (self._alive(gen, tok)) self._next(gen, "Native: " + _mediaErrText(self.video.error)); };
        const onPlay  = function () { if (self._alive(gen, tok)) self._hideMsg(); };   // snappy; monitor still checks frames
        this.video.addEventListener("loadedmetadata", onMeta,  { once: true });
        this.video.addEventListener("error",          onError, { once: true });
        this.video.addEventListener("playing",        onPlay,  { once: true });
        this.video.src = url;
        this.video.load();
        this.video.play().catch(function () {});
        this._monitorPlayback(gen, tok, "Native");
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
        // Tuned for fast channel start + snappy failure: small buffer, few retries.
        this.hls = new Hls({
            enableWorker: false,
            debug: false,
            maxBufferLength: 24,
            maxMaxBufferLength: 60,
            manifestLoadingTimeOut: 8000,
            manifestLoadingMaxRetry: 1,
            levelLoadingMaxRetry: 2,
            fragLoadingMaxRetry: 3
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
                // Audio fallback: if more than one track, prefer a non-Dolby one
                // (a stream that defaults to Dolby often carries an AAC alternate).
                const tracks = self.hls.audioTracks;
                if (tracks && tracks.length > 1) {
                    for (let i = 0; i < tracks.length; i++) {
                        const ac = (tracks[i].audioCodec || tracks[i].codec || "").toLowerCase();
                        if (ac && !_isDolby(ac)) { try { self.hls.audioTrack = i; } catch (_) {} break; }
                    }
                }
                if (self._codecs && !self._codecs.a && tracks && tracks[0]) {
                    self._codecs.a = tracks[0].audioCodec || tracks[0].codec || "";
                }
                if (self._lowQuality && self.hls.levels && self.hls.levels.length) {
                    self.hls.autoLevelCapping = 0;   // pin the lowest rendition
                    self.hls.currentLevel = 0;
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
        this.video.addEventListener("playing", function () { if (self._alive(gen, tok)) self._hideMsg(); }, { once: true });
        this._monitorPlayback(gen, tok, "HLS");
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
