"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var IPTVPlayer = /*#__PURE__*/function () {
  function IPTVPlayer() {
    _classCallCheck(this, IPTVPlayer);
    this.video = document.getElementById("player");
    this._pipWrap = document.getElementById("pip-wrap");
    this.hls = null;
    this._watchdog = null;
    this._gen = 0; // bumped each play() so stale callbacks self-cancel
    // Prevent the video element from stealing remote focus —
    // all input is handled by dpad.js.
    this.video.tabIndex = -1;
  }

  // ── UI messages ───────────────────────────────────────────────────────────
  return _createClass(IPTVPlayer, [{
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

    // ── Playback ──────────────────────────────────────────────────────────────
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
    key: "play",
    value: function play(url) {
      if (!url) return;
      var gen = ++this._gen; // invalidate any in-flight attempt
      this._clearWatchdog();
      this.destroyHls();
      try {
        this.video.pause();
      } catch (_) {}
      this.video.removeAttribute("src");
      this.video.innerHTML = "";
      this.video.style.display = "block";
      this._msg("Loading…");
      this._url = url;
      this._isHls = url.includes(".m3u8");
      this._triedNative = false;
      this._triedHls = false;

      // Pick a starting path from the browser hint, but either route falls
      // back to the other if it stalls or errors — so a single incompatible
      // path (e.g. hls.js failing on old WebOS Chromium) no longer leaves the
      // stream stuck on "Loading…" forever.
      if (this._isHls && !this._canPlayNatively()) this._tryHls(gen);else this._tryNative(gen);
    }

    // Watchdog: if no data arrives in time, the chosen path is stuck — fall back.
  }, {
    key: "_arm",
    value: function _arm(gen, which) {
      this._clearWatchdog();
      var self = this;
      this._watchdog = setTimeout(function () {
        if (gen === self._gen) self._fallback(gen, which);
      }, 14000);
    }
  }, {
    key: "_fallback",
    value: function _fallback(gen, which) {
      if (gen !== this._gen) return;
      this._clearWatchdog();
      var url = this._url;
      if (!url) return;
      if (which === "native" && this._isHls && !this._triedHls) {
        this._tryHls(gen);
      } else if (which === "hls" && !this._triedNative) {
        this.destroyHls();
        this._tryNative(gen);
      } else {
        this.destroyHls();
        this._msg("Can't play this channel.");
      }
    }
  }, {
    key: "_tryNative",
    value: function _tryNative(gen) {
      if (gen !== this._gen) return;
      this._triedNative = true;
      var self = this,
        url = this._url;
      var onPlaying = function onPlaying() {
        if (gen === self._gen) {
          self._clearWatchdog();
          self._hideMsg();
        }
      };
      var onData = function onData() {
        if (gen === self._gen) self._clearWatchdog();
      };
      var onError = function onError() {
        if (gen === self._gen) self._fallback(gen, "native");
      };
      this.video.addEventListener("playing", onPlaying, {
        once: true
      });
      this.video.addEventListener("loadeddata", onData, {
        once: true
      });
      this.video.addEventListener("error", onError, {
        once: true
      });
      this.destroyHls();
      this.video.src = url;
      this.video.load();
      this.video.play().catch(function () {});
      this._arm(gen, "native");
    }
  }, {
    key: "_tryHls",
    value: function _tryHls(gen) {
      if (gen !== this._gen) return;
      this._triedHls = true;
      var self = this,
        url = this._url;
      this._loadHls(function () {
        if (gen !== self._gen) return;
        if (typeof Hls !== "undefined" && Hls.isSupported()) {
          self._attachHls(gen, url);
          self._arm(gen, "hls");
        } else {
          // hls.js unavailable or unsupported here → let the platform try.
          self._tryNative(gen);
        }
      });
    }
  }, {
    key: "_attachHls",
    value: function _attachHls(gen, url) {
      this.destroyHls();
      var self = this;
      this.video.removeAttribute("src");
      this.video.innerHTML = "";
      this.hls = new Hls({
        enableWorker: false
      });
      this.hls.attachMedia(this.video);
      this.hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        if (gen === self._gen) self.hls.loadSource(url);
      });
      this.hls.on(Hls.Events.MANIFEST_PARSED, function () {
        if (gen === self._gen) self.video.play().catch(function () {});
      });
      // Fatal hls.js errors (codec/MSE issues on old Chromium) → fall back.
      this.hls.on(Hls.Events.ERROR, function (e, data) {
        if (gen === self._gen && data && data.fatal) self._fallback(gen, "hls");
      });
      this.video.addEventListener("loadeddata", function () {
        if (gen === self._gen) self._clearWatchdog();
      }, {
        once: true
      });
      this.video.addEventListener("playing", function () {
        if (gen === self._gen) {
          self._clearWatchdog();
          self._hideMsg();
        }
      }, {
        once: true
      });
    }
  }, {
    key: "_canPlayNatively",
    value: function _canPlayNatively() {
      if (!this.video || !this.video.canPlayType) return false;
      return !!(this.video.canPlayType("application/vnd.apple.mpegURL") || this.video.canPlayType("application/x-mpegURL"));
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