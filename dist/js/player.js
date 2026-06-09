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
    key: "play",
    value: function play(url) {
      var _this = this;
      if (!url) return;
      this.destroyHls();
      this.video.pause();
      this.video.removeAttribute("src");
      this.video.innerHTML = "";
      this.video.style.display = "block";
      this._msg("Loading…");
      var isHls = url.includes(".m3u8");
      var hlsAvailable = typeof Hls !== "undefined" && Hls.isSupported();
      if (isHls && !this._canPlayNatively() && hlsAvailable) {
        this._attachHls(url);
        return;
      }
      var onPlaying = function onPlaying() {
        _this.video.removeEventListener("error", onError);
        _this._hideMsg();
      };
      var onError = function onError() {
        _this.video.removeEventListener("playing", onPlaying);
        if (isHls && hlsAvailable) _this._attachHls(url);
      };
      this.video.addEventListener("playing", onPlaying, {
        once: true
      });
      this.video.addEventListener("error", onError, {
        once: true
      });
      this.video.src = url;
      this.video.load();
      this.video.play().catch(function () {});
    }
  }, {
    key: "_canPlayNatively",
    value: function _canPlayNatively() {
      var _this$video;
      if (!((_this$video = this.video) !== null && _this$video !== void 0 && _this$video.canPlayType)) return false;
      return !!(this.video.canPlayType("application/vnd.apple.mpegURL") || this.video.canPlayType("application/x-mpegURL"));
    }
  }, {
    key: "_attachHls",
    value: function _attachHls(url) {
      var _this2 = this;
      this.destroyHls();
      this.hls = new Hls({
        enableWorker: false
      });
      this.hls.attachMedia(this.video);
      this.hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        return _this2.hls.loadSource(url);
      });
      this.hls.on(Hls.Events.MANIFEST_PARSED, function () {
        return _this2.video.play().catch(function () {});
      });
      this.video.addEventListener("playing", function () {
        return _this2._hideMsg();
      }, {
        once: true
      });
    }
  }]);
}();
var player = new IPTVPlayer();