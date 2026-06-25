"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/* Helpers for human-readable playback diagnostics. */
function _esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function _mediaErrText(err) {
  if (!err) return "playback error";
  var map = {
    1: "aborted",
    2: "network error",
    3: "decode error — codec not supported",
    4: "format/codec not supported"
  };
  var t = map[err.code] || "error " + err.code;
  if (err.message) t += " — " + err.message;
  return t;
}
function _isDolby(c) {
  c = (c || "").toLowerCase();
  return c.indexOf("ec-3") !== -1 || c.indexOf("ac-3") !== -1 || c.indexOf("eac3") !== -1 || c.indexOf("ac3") !== -1 || c.indexOf("mp4a.a5") !== -1 || c.indexOf("mp4a.a6") !== -1;
}
function _dolbyName(c) {
  c = (c || "").toLowerCase();
  if (c.indexOf("ec-3") !== -1 || c.indexOf("eac3") !== -1 || c.indexOf("mp4a.a6") !== -1) return "Dolby Digital+";
  return "Dolby Digital";
}
function _isHevc(s) {
  s = (s || "").toLowerCase();
  return s.indexOf("hvc") !== -1 || s.indexOf("hev") !== -1 || s.indexOf("h265") !== -1 || s.indexOf("hevc") !== -1 || s.indexOf("h.265") !== -1;
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
var IPTVPlayer = /*#__PURE__*/function () {
  function IPTVPlayer() {
    _classCallCheck(this, IPTVPlayer);
    this.video = document.getElementById("player");
    this._pipWrap = document.getElementById("pip-wrap");
    this.hls = null;
    this._watchdog = null;
    this._monitor = null;
    this._gen = 0; // bumped per play() — neutralises a previous channel
    this._tok = 0; // bumped per attempt — neutralises a previous tier
    this._diag = [];
    this._codecs = null;
    this._res = "";
    this._activeEngine = "";
    this.video.tabIndex = -1; // input handled by dpad.js
    this._setupDiag();
  }

  // ── Live diagnostics overlay (GREEN button) ─────────────────────────────────
  return _createClass(IPTVPlayer, [{
    key: "_setupDiag",
    value: function _setupDiag() {
      var self = this;
      window.addEventListener("keydown", function (e) {
        var kc = e.keyCode || e.which;
        if (kc === 404 /* GREEN */ || kc === 68 /* 'd' */) {
          e.preventDefault();
          self._toggleDiag();
        } else if (kc === 405 /* YELLOW */ || kc === 76 /* 'l' */) {
          e.preventDefault();
          self.tryLowestQuality();
        }
      }, true);
    }
  }, {
    key: "_toggleDiag",
    value: function _toggleDiag() {
      if (this._diagEl) {
        clearInterval(this._diagTimer);
        this._diagTimer = null;
        if (this._diagEl.parentNode) this._diagEl.parentNode.removeChild(this._diagEl);
        this._diagEl = null;
        return;
      }
      var el = document.createElement("div");
      el.id = "player-diag";
      el.style.cssText = "position:absolute;top:14px;left:14px;z-index:99999;background:rgba(0,0,0,0.82);" + "color:#43e57a;font:14px/1.65 monospace;padding:14px 18px;border-radius:12px;" + "pointer-events:none;white-space:pre;letter-spacing:0.3px;";
      (this._pipWrap || document.body).appendChild(el);
      this._diagEl = el;
      var self = this;
      this._diagTimer = setInterval(function () {
        self._updateDiag();
      }, 500);
      this._updateDiag();
    }
  }, {
    key: "_updateDiag",
    value: function _updateDiag() {
      if (!this._diagEl) return;
      var v = this.video,
        frames = this._decodedFrames();
      var lines = ["engine  : " + (this._activeEngine || "—") + "   tier " + ((this._attemptIdx || 0) + 1) + "/" + (this._attempts && this._attempts.length || 1), "res     : " + (v.videoWidth || 0) + "×" + (v.videoHeight || 0), "codec   : " + (this._codecs ? (this._codecs.v || "?") + " / " + (this._codecs.a || "?") : "n/a (native path)"), "time    : " + (v.currentTime || 0).toFixed(1) + (isFinite(v.duration) ? " / " + v.duration.toFixed(1) : " (live)") + "   paused:" + v.paused, "ready   : " + v.readyState + "   network:" + v.networkState, "frames  : " + (frames < 0 ? "n/a (no API)" : frames), "error   : " + (v.error ? _mediaErrText(v.error) : "—"), "lowQ    : " + (this._lowQuality ? "on" : "off"), "tried   : " + (this._diag && this._diag.length ? this._diag.join(" | ") : "—"), "", "(GREEN close · YELLOW lowest-quality)"];
      this._diagEl.textContent = lines.join("\n");
    }

    // ── UI messages ───────────────────────────────────────────────────────────
  }, {
    key: "_msg",
    value: function _msg(text) {
      var el = document.getElementById("player-msg");
      if (el) {
        el.textContent = text;
        el.style.display = "flex";
      }
    }
  }, {
    key: "_hideMsg",
    value: function _hideMsg() {
      var el = document.getElementById("player-msg");
      if (el) el.style.display = "none";
    }
  }, {
    key: "_showError",
    value: function _showError() {
      // Keep the technical detail for the GREEN debug overlay only — the user
      // sees a clean, friendly message with no scary codes.
      this._lastError = this._diag.slice();
      var diagStr = this._diag.join(" ");
      var hint = "This channel couldn’t be played right now.";
      if (this._codecs && _isHevc(this._codecs.v) || _isHevc(diagStr)) {
        hint = "This may be a 4K/HEVC channel — try the HD version if your provider has one.";
      } else if (this._codecs && _isDolby(this._codecs.a)) {
        hint = "This channel uses Dolby audio — try the HD version if your provider has one.";
      }
      var el = document.getElementById("player-msg");
      if (el) {
        el.innerHTML = '<div class="pm-title">Can’t play this channel</div><div class="pm-detail">' + _esc(hint) + "</div>";
        el.style.display = "flex";
      }
    }

    // ── Engine plumbing ───────────────────────────────────────────────────────
  }, {
    key: "destroyHls",
    value: function destroyHls() {
      if (this.hls) {
        try {
          this.hls.destroy();
        } catch (_) {}
        this.hls = null;
      }
    }
  }, {
    key: "_clearWatchdog",
    value: function _clearWatchdog() {
      if (this._watchdog) {
        clearTimeout(this._watchdog);
        this._watchdog = null;
      }
      if (this._monitor) {
        clearInterval(this._monitor);
        this._monitor = null;
      }
    }

    // How many video frames the decoder has actually produced (best-effort —
    // lets us catch "audio plays, video is black" failures). -1 = can't tell.
  }, {
    key: "_decodedFrames",
    value: function _decodedFrames() {
      var v = this.video;
      try {
        if (v.getVideoPlaybackQuality) {
          var q = v.getVideoPlaybackQuality();
          if (q && typeof q.totalVideoFrames === "number") return q.totalVideoFrames;
        }
      } catch (_) {}
      if (typeof v.webkitDecodedFrameCount === "number") return v.webkitDecodedFrameCount;
      return -1;
    }

    // Watch for REAL playback. Success = time advancing AND frames decoding.
    // Catches: a total stall, and "black screen" (time advances via audio but no
    // video frames) — both fall through to the next tier instead of hanging.
  }, {
    key: "_monitorPlayback",
    value: function _monitorPlayback(gen, tok, label) {
      this._clearWatchdog();
      var self = this,
        v = this.video,
        start = Date.now();
      var lastT = -1,
        blackSince = 0;
      this._monitor = setInterval(function () {
        if (!self._alive(gen, tok)) {
          self._clearWatchdog();
          return;
        }
        var t = v.currentTime || 0;
        var advancing = t > 0.05 && t > lastT + 0.05; // actually started AND moving
        lastT = t;
        var frames = self._decodedFrames();
        if (advancing) {
          if (frames !== 0) {
            self._clearWatchdog();
            self._hideMsg();
            return;
          } // real video (or unknown)
          if (!blackSince) blackSince = Date.now();else if (Date.now() - blackSince > 3500) {
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
  }, {
    key: "_resetVideo",
    value: function _resetVideo() {
      try {
        this.video.pause();
      } catch (_) {}
      this.destroyHls();
      this.video.removeAttribute("src");
      this.video.innerHTML = "";
      try {
        this.video.load();
      } catch (_) {}
    }

    // Re-play the current stream pinned to the lowest variant — often an SDR /
    // 8-bit rendition that renders where the HDR/10-bit one decodes to black.
  }, {
    key: "tryLowestQuality",
    value: function tryLowestQuality() {
      if (!this._lastUrl) return;
      this._lowQuality = true;
      this.play(this._lastUrl);
      this._msg("Trying lowest quality…");
    }
  }, {
    key: "play",
    value: function play(url) {
      if (!url) return;
      if (url !== this._lastUrl) this._lowQuality = false; // new channel → normal ABR
      this._lastUrl = url;
      var gen = ++this._gen;
      this._tok++; // any in-flight attempt is now stale
      this._clearWatchdog();
      this._resetVideo();
      this.video.style.display = "block";
      this._msg("Loading…");
      this._diag = [];
      this._codecs = null;
      this._res = "";
      this._attempts = this._buildAttempts(url);
      this._attemptIdx = 0;
      this._runAttempt(gen);
    }
  }, {
    key: "_buildAttempts",
    value: function _buildAttempts(url) {
      var isHls = url.indexOf(".m3u8") !== -1;
      var list = [{
        engine: "native",
        url: url
      }];
      if (isHls) {
        list.push({
          engine: "hls",
          url: url
        });
        var ts = url.replace(/\.m3u8(\?[^#]*)?$/i, ".ts$1");
        if (ts !== url) list.push({
          engine: "native",
          url: ts
        });
      }
      return list;
    }
  }, {
    key: "_runAttempt",
    value: function _runAttempt(gen) {
      if (gen !== this._gen) return;
      var a = this._attempts[this._attemptIdx];
      if (!a) {
        this.destroyHls();
        this._showError();
        return;
      }
      var tok = this._tok;
      this._activeEngine = a.engine === "hls" ? "hls.js" : "native" + (a.url.indexOf(".ts") !== -1 ? " (.ts)" : "");
      if (a.engine === "hls") this._playHls(gen, tok, a.url);else this._playNative(gen, tok, a.url);
    }

    // Advance to the next tier. Bumps _tok first so the failing tier's lingering
    // listeners (and any spurious "error" from resetting the element) go silent.
  }, {
    key: "_next",
    value: function _next(gen, reason) {
      if (gen !== this._gen) return;
      this._clearWatchdog();
      if (reason) this._diag.push(reason);
      this._tok++;
      this._attemptIdx++;
      this.destroyHls();
      this._runAttempt(gen);
    }
  }, {
    key: "_alive",
    value: function _alive(gen, tok) {
      return gen === this._gen && tok === this._tok;
    }
  }, {
    key: "_playNative",
    value: function _playNative(gen, tok, url) {
      if (!this._alive(gen, tok)) return;
      var self = this;
      var onMeta = function onMeta() {
        if (!self._alive(gen, tok)) return;
        if (self.video.videoWidth && self.video.videoHeight) self._res = self.video.videoWidth + "×" + self.video.videoHeight;
      };
      var onError = function onError() {
        if (self._alive(gen, tok)) self._next(gen, "Native: " + _mediaErrText(self.video.error));
      };
      var onPlay = function onPlay() {
        if (self._alive(gen, tok)) self._hideMsg();
      }; // snappy; monitor still checks frames
      this.video.addEventListener("loadedmetadata", onMeta, {
        once: true
      });
      this.video.addEventListener("error", onError, {
        once: true
      });
      this.video.addEventListener("playing", onPlay, {
        once: true
      });
      this.video.src = url;
      this.video.load();
      this.video.play().catch(function () {});
      this._monitorPlayback(gen, tok, "Native");
    }
  }, {
    key: "_playHls",
    value: function _playHls(gen, tok, url) {
      if (!this._alive(gen, tok)) return;
      var self = this;
      this._loadHls(function () {
        if (!self._alive(gen, tok)) return;
        if (typeof Hls !== "undefined" && Hls.isSupported()) self._attachHls(gen, tok, url);else self._next(gen, "HLS.js unsupported on this browser");
      });
    }
  }, {
    key: "_attachHls",
    value: function _attachHls(gen, tok, url) {
      this.destroyHls();
      var self = this;
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
      this.hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        if (self._alive(gen, tok)) self.hls.loadSource(url);
      });
      this.hls.on(Hls.Events.MANIFEST_PARSED, function (ev, data) {
        if (!self._alive(gen, tok)) return;
        try {
          var lv = self.hls.levels && self.hls.levels[0] || data && data.levels && data.levels[0];
          if (lv) {
            self._codecs = {
              v: lv.videoCodec || "",
              a: lv.audioCodec || ""
            };
            if (lv.width && lv.height) self._res = lv.width + "×" + lv.height;
          }
          // Audio fallback: if more than one track, prefer a non-Dolby one
          // (a stream that defaults to Dolby often carries an AAC alternate).
          var tracks = self.hls.audioTracks;
          if (tracks && tracks.length > 1) {
            for (var i = 0; i < tracks.length; i++) {
              var ac = (tracks[i].audioCodec || tracks[i].codec || "").toLowerCase();
              if (ac && !_isDolby(ac)) {
                try {
                  self.hls.audioTrack = i;
                } catch (_) {}
                break;
              }
            }
          }
          if (self._codecs && !self._codecs.a && tracks && tracks[0]) {
            self._codecs.a = tracks[0].audioCodec || tracks[0].codec || "";
          }
          if (self._lowQuality && self.hls.levels && self.hls.levels.length) {
            self.hls.autoLevelCapping = 0; // pin the lowest rendition
            self.hls.currentLevel = 0;
          }
        } catch (_) {}
        self.video.play().catch(function () {});
      });
      this.hls.on(Hls.Events.ERROR, function (e, data) {
        if (!self._alive(gen, tok) || !data || !data.fatal) return;
        var d = data.details || data.type || "fatal error";
        if (data.reason) d += " (" + data.reason + ")";
        self._next(gen, "HLS: " + d);
      });
      this.video.addEventListener("playing", function () {
        if (self._alive(gen, tok)) self._hideMsg();
      }, {
        once: true
      });
      this._monitorPlayback(gen, tok, "HLS");
    }
  }, {
    key: "_loadHls",
    value: function _loadHls(callback) {
      var _this = this;
      if (typeof Hls !== "undefined") {
        callback();
        return;
      }
      if (this._hlsLoading) {
        this._hlsCallbacks.push(callback);
        return;
      }
      this._hlsLoading = true;
      this._hlsCallbacks = [callback];
      var s = document.createElement("script");
      s.src = "../assets/hls.min.js";
      s.onload = function () {
        _this._hlsLoading = false;
        _this._hlsCallbacks.forEach(function (fn) {
          return fn();
        });
        _this._hlsCallbacks = [];
      };
      s.onerror = function () {
        _this._hlsLoading = false;
        _this._hlsCallbacks.forEach(function (fn) {
          return fn();
        });
        _this._hlsCallbacks = [];
      };
      document.head.appendChild(s);
    }
  }]);
}();
var player = new IPTVPlayer();