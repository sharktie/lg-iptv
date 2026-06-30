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
function _isHevc(s) {
  s = (s || "").toLowerCase();
  return s.indexOf("hvc") !== -1 || s.indexOf("hev") !== -1 || s.indexOf("h265") !== -1 || s.indexOf("hevc") !== -1 || s.indexOf("h.265") !== -1;
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
var IPTVPlayer = /*#__PURE__*/function () {
  function IPTVPlayer() {
    _classCallCheck(this, IPTVPlayer);
    this.video = document.getElementById("player");
    this._pipWrap = document.getElementById("pip-wrap");
    this.hls = null;
    this._watchdog = null;
    this._gen = 0; // bumped per play()    — neutralises a previous channel
    this._tok = 0; // bumped per attempt   — neutralises a previous tier
    this._manual = false;
    this._lowQuality = false;
    this._diag = [];
    this._codecs = null;
    this._res = "";
    this._activeEngine = "";
    this.video.tabIndex = -1; // input handled by dpad.js
    try {
      this.video.classList.add("subs-" + (localStorage.getItem("vod_subs_size") || "md"));
    } catch (_) {
      this.video.classList.add("subs-md");
    }
    this._setupKeys();
  }

  // ── Remote color-button shortcuts ───────────────────────────────────────────
  return _createClass(IPTVPlayer, [{
    key: "_setupKeys",
    value: function _setupKeys() {
      var self = this;
      window.addEventListener("keydown", function (e) {
        var kc = e.keyCode || e.which;
        if (kc === 403 /* RED */ || kc === 67 /* 'c' */) {
          e.preventDefault();
          self.cycleEngine();
        } else if (kc === 404 /* GREEN */ || kc === 68 /* 'd' */) {
          e.preventDefault();
          self._toggleDiag();
        } else if (kc === 405 /* YELLOW */ || kc === 76 /* 'l' */) {
          e.preventDefault();
          self.tryLowestQuality();
        }
      }, true);
    }

    // ── UI messages ─────────────────────────────────────────────────────────────
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
      this._lastError = this._diag.slice(); // technical detail → GREEN overlay only
      var diagStr = this._diag.join(" ");
      var hint = "This channel couldn’t be played right now.";
      if (this._codecs && _isHevc(this._codecs.v) || _isHevc(diagStr)) {
        hint = "This may be a 4K/HEVC channel — press RED to try another player, or use the HD version.";
      } else if (this._codecs && _isDolby(this._codecs.a)) {
        hint = "This channel uses Dolby audio — press RED to try another player, or use the HD version.";
      } else {
        hint = "Press RED to try a different player.";
      }
      var el = document.getElementById("player-msg");
      if (el) {
        el.innerHTML = '<div class="pm-title">Can’t play this channel</div><div class="pm-detail">' + _esc(hint) + "</div>";
        el.style.display = "flex";
      }
    }
    // Brief centred toast (engine name when cycling).
  }, {
    key: "_flash",
    value: function _flash(text) {
      var el = this._flashEl;
      if (!el) {
        el = document.createElement("div");
        el.style.cssText = "position:absolute;top:16px;left:50%;z-index:99999;" + "-webkit-transform:translateX(-50%);transform:translateX(-50%);" + "background:rgba(0,0,0,0.78);color:#fff;font:600 16px/1 'Outfit',-apple-system,sans-serif;" + "padding:12px 22px;border-radius:999px;pointer-events:none;";
        (this._pipWrap || document.body).appendChild(el);
        this._flashEl = el;
      }
      el.textContent = text;
      el.style.display = "block";
      clearTimeout(this._flashTimer);
      var self = this;
      this._flashTimer = setTimeout(function () {
        if (self._flashEl) self._flashEl.style.display = "none";
      }, 1500);
    }

    // ── Diagnostics overlay (GREEN) ─────────────────────────────────────────────
  }, {
    key: "_decodedFrames",
    value: function _decodedFrames() {
      // display-only; never drives fallback
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
      this._diagEl.textContent = ["engine  : " + (this._activeEngine || "—") + (this._manual ? " (manual)" : "") + "   tier " + ((this._attemptIdx || 0) + 1) + "/" + (this._attempts && this._attempts.length || 1), "res     : " + (v.videoWidth || 0) + "×" + (v.videoHeight || 0), "codec   : " + (this._codecs ? (this._codecs.v || "?") + " / " + (this._codecs.a || "?") : "n/a (native)"), "time    : " + (v.currentTime || 0).toFixed(1) + (isFinite(v.duration) ? " / " + v.duration.toFixed(1) : " (live)") + "   paused:" + v.paused, "ready   : " + v.readyState + "   network:" + v.networkState, "frames  : " + (frames < 0 ? "n/a" : frames), "error   : " + (v.error ? _mediaErrText(v.error) : "—"), "lowQ    : " + (this._lowQuality ? "on" : "off"), "tried   : " + (this._diag && this._diag.length ? this._diag.join(" | ") : "—"), "", "(RED cycle · GREEN close · YELLOW lowest)"].join("\n");
    }

    // ── Engine plumbing ─────────────────────────────────────────────────────────
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
  }, {
    key: "_alive",
    value: function _alive(gen, tok) {
      return gen === this._gen && tok === this._tok;
    }

    // `url` may be a single URL or an array of candidate URLs (e.g. catch-up,
    // where the same programme is reachable via two timeshift endpoints). Each
    // candidate is expanded into its native/HLS/TS attempts, tried in order.
  }, {
    key: "play",
    value: function play(url) {
      if (!url) return;
      var urls = Array.isArray(url) ? url.filter(Boolean) : [url];
      if (!urls.length) return;
      var key = urls.join("|");
      if (key !== this._lastUrl) this._lowQuality = false; // new content → normal ABR
      this._lastUrl = key;
      this._urls = urls; // original list, for replay (tryLowestQuality)
      var gen = ++this._gen;
      this._tok++;
      this._manual = false;
      this._clearWatchdog();
      this._resetVideo();
      this.video.style.display = "block";
      this._msg("Loading…");
      this._diag = [];
      this._codecs = null;
      this._res = "";
      this._attempts = this._buildAttempts(urls);
      this._attemptIdx = 0;
      this._runAttempt(gen);
    }
  }, {
    key: "_buildAttempts",
    value: function _buildAttempts(urls) {
      if (!Array.isArray(urls)) urls = [urls];
      var list = [];
      var multi = urls.length > 1;
      urls.forEach(function (url, i) {
        var tag = multi ? " " + (i + 1) : "";
        var isHls = url.indexOf(".m3u8") !== -1;
        list.push({
          engine: "native",
          url: url,
          label: "Native" + tag
        });
        if (isHls) {
          list.push({
            engine: "hls",
            url: url,
            label: "HLS" + tag
          });
          var ts = url.replace(/\.m3u8(\?[^#]*)?$/i, ".ts$1");
          if (ts !== url) list.push({
            engine: "native",
            url: ts,
            label: "Native TS" + tag
          });
        }
      });
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
      this._activeEngine = a.label;
      if (a.engine === "hls") this._playHls(gen, tok, a.url);else this._playNative(gen, tok, a.url);
    }

    // Auto-advance to the next tier — disabled in manual mode (the user drives).
  }, {
    key: "_next",
    value: function _next(gen, reason) {
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
  }, {
    key: "cycleEngine",
    value: function cycleEngine() {
      if (!this._lastUrl || !this._attempts || this._attempts.length < 2) return;
      this._manual = true;
      var gen = ++this._gen;
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
  }, {
    key: "_arm",
    value: function _arm(gen, tok) {
      this._clearWatchdog();
      if (this._manual) return;
      var self = this;
      this._watchdog = setTimeout(function () {
        if (self._alive(gen, tok)) self._next(gen, self._activeEngine + ": no data after 12s");
      }, 12000);
    }
  }, {
    key: "_playNative",
    value: function _playNative(gen, tok, url) {
      if (!this._alive(gen, tok)) return;
      var self = this;
      var onSuccess = function onSuccess() {
        if (self._alive(gen, tok)) {
          self._clearWatchdog();
          self._hideMsg();
        }
      };
      var onData = function onData() {
        if (self._alive(gen, tok)) self._clearWatchdog();
      }; // data flowing → not a stall
      var onMeta = function onMeta() {
        if (self._alive(gen, tok) && self.video.videoWidth) self._res = self.video.videoWidth + "×" + self.video.videoHeight;
      };
      var onError = function onError() {
        if (self._alive(gen, tok)) self._next(gen, "Native: " + _mediaErrText(self.video.error));
      };
      this.video.addEventListener("playing", onSuccess, {
        once: true
      });
      this.video.addEventListener("loadeddata", onData, {
        once: true
      });
      this.video.addEventListener("loadedmetadata", onMeta, {
        once: true
      });
      this.video.addEventListener("error", onError, {
        once: true
      });
      this.video.src = url;
      this.video.load();
      this.video.play().catch(function () {});
      this._arm(gen, tok);
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
          var tracks = self.hls.audioTracks;
          if (tracks && tracks.length > 1) {
            // prefer a non-Dolby audio track
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
            self.hls.autoLevelCapping = 0;
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
        if (self._alive(gen, tok)) {
          self._clearWatchdog();
          self._hideMsg();
        }
      }, {
        once: true
      });
      this.video.addEventListener("loadeddata", function () {
        if (self._alive(gen, tok)) self._clearWatchdog();
      }, {
        once: true
      });
      this._arm(gen, tok);
    }

    // ── Subtitles ───────────────────────────────────────────────────────────────
  }, {
    key: "listSubtitles",
    value: function listSubtitles() {
      var out = [];
      if (this.hls && this.hls.subtitleTracks) {
        for (var i = 0; i < this.hls.subtitleTracks.length; i++) {
          var t = this.hls.subtitleTracks[i];
          out.push({
            src: "hls",
            id: i,
            label: t.name || t.lang || "Subtitle " + (i + 1)
          });
        }
      }
      var tt = this.video.textTracks;
      if (tt) {
        for (var _i = 0; _i < tt.length; _i++) {
          var k = tt[_i].kind;
          if (k === "subtitles" || k === "captions" || k === "") {
            out.push({
              src: "native",
              id: _i,
              label: tt[_i].label || tt[_i].language || "Track " + (_i + 1)
            });
          }
        }
      }
      return out;
    }
  }, {
    key: "setSubtitle",
    value: function setSubtitle(track) {
      var tt = this.video.textTracks;
      if (tt) for (var i = 0; i < tt.length; i++) tt[i].mode = "disabled";
      if (this.hls) {
        try {
          this.hls.subtitleDisplay = false;
          this.hls.subtitleTrack = -1;
        } catch (_) {}
      }
      if (!track || track === "off") {
        this._activeSub = "off";
        return;
      }
      if (track.src === "hls" && this.hls) {
        try {
          this.hls.subtitleDisplay = true;
          this.hls.subtitleTrack = track.id;
        } catch (_) {}
      } else if (track.src === "native" && tt && tt[track.id]) {
        tt[track.id].mode = "showing";
      }
      this._activeSub = track;
    }
  }, {
    key: "getSubSize",
    value: function getSubSize() {
      if (this._subSize) return this._subSize;
      try {
        return localStorage.getItem("vod_subs_size") || "md";
      } catch (_) {
        return "md";
      }
    }
  }, {
    key: "applySubSize",
    value: function applySubSize(size) {
      // 'md' | 'lg' | 'xl'
      size = size || "md";
      var v = this.video;
      v.classList.remove("subs-md", "subs-lg", "subs-xl");
      v.classList.add("subs-" + size);
      this._subSize = size;
      try {
        localStorage.setItem("vod_subs_size", size);
      } catch (_) {}
    }
  }, {
    key: "addExternalSubs",
    value: function addExternalSubs(list) {
      if (!list || !list.length) return;
      var self = this;
      list.forEach(function (s) {
        var url = s && (s.url || s.src || s);
        if (!url || typeof url !== "string") return;
        var lang = s && (s.lang || s.language) || "";
        fetch(url).then(function (r) {
          return r.ok ? r.text() : null;
        }).then(function (text) {
          if (!text) return;
          var vtt = /^WEBVTT/.test(text.trim()) ? text : self._srtToVtt(text);
          var el = document.createElement("track");
          el.kind = "subtitles";
          el.label = s && s.label || lang.toUpperCase() || "Subtitles";
          if (lang) el.srclang = lang;
          el.src = URL.createObjectURL(new Blob([vtt], {
            type: "text/vtt"
          }));
          self.video.appendChild(el);
        }).catch(function () {});
      });
    }
  }, {
    key: "_srtToVtt",
    value: function _srtToVtt(srt) {
      return "WEBVTT\n\n" + String(srt).replace(/\r+/g, "").replace(/^\d+\s*$/gm, "").replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2").replace(/\n{3,}/g, "\n\n").trim();
    }
  }, {
    key: "tryLowestQuality",
    value: function tryLowestQuality() {
      if (!this._urls) return;
      this._lowQuality = true;
      this.play(this._urls);
      this._flash("Lowest quality");
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