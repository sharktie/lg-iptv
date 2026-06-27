"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
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
function _lsGet(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}
function _lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}
function _splitLangCodes(value) {
  return String(value || "").split(/[,\s]+/).map(function (s) {
    return s.trim().toLowerCase();
  }).filter(function (s) {
    return !!s;
  });
}
function _langName(code) {
  var map = _defineProperty(_defineProperty({
    en: "English",
    ar: "Arabic",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    fa: "Persian",
    he: "Hebrew",
    ur: "Urdu",
    hi: "Hindi",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    el: "Greek",
    sv: "Swedish",
    no: "Norwegian",
    da: "Danish",
    fi: "Finnish",
    cs: "Czech",
    ro: "Romanian",
    hu: "Hungarian",
    bg: "Bulgarian",
    hr: "Croatian",
    sk: "Slovak",
    sl: "Slovenian",
    uk: "Ukrainian",
    sr: "Serbian",
    id: "Indonesian",
    th: "Thai",
    vi: "Vietnamese"
  }, "ro", "Romanian"), "bn", "Bengali");
  var c = String(code || "").toLowerCase();
  return map[c] || (c ? c.toUpperCase() : "English");
}
function _isRtlLanguage(code) {
  var c = String(code || "").toLowerCase();
  return c === "ar" || c === "fa" || c === "he" || c === "ur" || c === "ps" || c === "dv";
}
var _IPTV_PREFIX_LANGS = {
  EN: 1,
  ES: 1,
  AR: 1,
  FR: 1,
  DE: 1,
  IT: 1,
  PT: 1,
  RU: 1,
  TR: 1,
  FA: 1,
  HE: 1,
  UR: 1,
  HI: 1,
  PL: 1,
  NL: 1,
  SV: 1,
  DA: 1,
  FI: 1,
  CS: 1,
  RO: 1,
  HU: 1,
  BG: 1,
  HR: 1,
  SK: 1,
  SL: 1,
  UK: 1,
  EL: 1,
  SR: 1,
  JA: 1,
  KO: 1,
  ZH: 1,
  VI: 1,
  TH: 1,
  ID: 1,
  BN: 1,
  US: 1,
  GB: 1,
  MULTI: 1,
  MULT: 1
};
var _IPTV_PREFIX_SERVICES = {
  NF: 1,
  AMZ: 1,
  AMZN: 1,
  NETFLIX: 1,
  AMAZON: 1,
  DISNEY: 1,
  DSNY: 1,
  DSNP: 1,
  HBO: 1,
  MAX: 1,
  HULU: 1,
  APPLE: 1,
  ATVP: 1,
  PMNT: 1,
  PRIME: 1,
  PEACOCK: 1,
  PARAMOUNT: 1,
  STARZ: 1
};
var _IPTV_PREFIX_QUALITY = {
  "4K": 1,
  HD: 1,
  FHD: 1,
  UHD: 1,
  TOP: 1,
  HDR: 1,
  HEVC: 1,
  "2160P": 1,
  "1080P": 1,
  "720P": 1,
  BLURAY: 1,
  BRRIP: 1,
  WEBRIP: 1,
  WEB: 1,
  REPACK: 1,
  DV: 1,
  ATMOS: 1
};
function _isIptvPrefixToken(token) {
  var t = String(token || "").trim();
  if (!t) return true;
  var up = t.toUpperCase();
  if (/^4K$/i.test(t)) return true;
  if (/^(?:19|20)\d{2}P$/.test(up)) return true;
  if (_IPTV_PREFIX_LANGS[up] && t === up) return true;
  if (_IPTV_PREFIX_SERVICES[up] && t === up) return true;
  if (_IPTV_PREFIX_QUALITY[up] && t === up) return true;
  if (/[-/|]/.test(t)) {
    return t.split(/[-/|]+/).every(function (part) {
      return _isIptvPrefixToken(part);
    });
  }
  return false;
}
function _isIptvPrefixChunk(chunk) {
  var parts = String(chunk || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return true;
  return parts.every(_isIptvPrefixToken);
}
function _cleanMediaTitle(raw, yearHint) {
  var title = String(raw || "").replace(/\u2013|\u2014/g, "-").replace(/\s+/g, " ").trim();
  var year = String(yearHint || "").trim();
  if (!title) return {
    title: "",
    year: year
  };
  var parenYear = title.match(/\((\d{4})\)\s*$/);
  if (parenYear) {
    if (!year) year = parenYear[1];
    title = title.replace(/\(\d{4}\)\s*$/, "").trim();
  }
  var trailingYear = title.match(/\s+((?:19|20)\d{2})\s*$/);
  if (trailingYear) {
    if (!year) year = trailingYear[1];
    title = title.replace(/\s+(?:19|20)\d{2}\s*$/, "").trim();
  }
  title = title.replace(/^\[(?:[A-Z]{2,6})\]\s*/i, "");
  title = title.replace(/^\((?:[A-Z]{2,6})\)\s*/i, "");
  for (var i = 0; i < 8; i++) {
    var split = title.match(/^(.+?)\s*-\s+(.+)$/);
    if (!split) break;
    if (_isIptvPrefixChunk(split[1])) title = split[2].trim();else break;
  }
  for (var j = 0; j < 6; j++) {
    var wordSplit = title.match(/^(\S+)\s+(.+)$/);
    if (!wordSplit) break;
    if (_isIptvPrefixToken(wordSplit[1])) title = wordSplit[2].trim();else break;
  }
  title = title.replace(/^[-–—|:]+\s*/, "").trim();
  return {
    title: title,
    year: year
  };
}
function _subtitleLabel(entry) {
  if (!entry) return "Subtitles";
  return entry.label || entry.release || entry.title || entry.name || entry.langLabel || "Subtitles";
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
    this._playbackContext = null;
    this._subtitleBrowser = {
      mode: "root",
      lang: "",
      items: [],
      busy: false,
      error: ""
    };
    this._subtitleResults = {};
    this._externalTrackEls = [];
    this._osToken = "";
    this._osTokenPromise = null;
    this.video.tabIndex = -1; // input handled by dpad.js
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
      this._clearExternalTracks();
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
  }, {
    key: "_clearExternalTracks",
    value: function _clearExternalTracks() {
      while (this._externalTrackEls.length) {
        var el = this._externalTrackEls.pop();
        try {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        } catch (_) {}
        try {
          if (el && el.src) URL.revokeObjectURL(el.src);
        } catch (_) {}
      }
      this._setSubtitleDirection("");
    }
  }, {
    key: "_osSettings",
    value: function _osSettings() {
      return {
        username: _lsGet("iptv_opensubs_username", "") || "",
        password: _lsGet("iptv_opensubs_password", "") || "",
        apiKey: _lsGet("iptv_opensubs_apikey", "") || "",
        langs: _splitLangCodes(_lsGet("iptv_opensubs_languages", "") || ""),
        rtl: _lsGet("iptv_opensubs_rtl", "auto") || "auto"
      };
    }
  }, {
    key: "_languageCatalog",
    value: function _languageCatalog() {
      return ["en", "ar", "es", "fr", "de", "it", "pt", "ru", "tr", "fa", "he", "ur", "hi", "pl", "nl", "sv", "da", "fi", "cs", "ro", "hu", "bg", "hr", "sk", "sl", "uk", "el", "sr", "ja", "ko", "zh", "vi", "th", "id", "bn"];
    }
  }, {
    key: "_subtitleQuery",
    value: function _subtitleQuery() {
      var c = this._playbackContext || {};
      var yearHint = String(c.year || "").trim();
      if (c.type === "episode") {
        var series = String(c.seriesTitle || c.series_name || "").trim();
        if (!series && c.name) {
          var parts = String(c.name).split(" · ");
          if (parts.length > 1) series = parts[0].trim();
        }
        if (series) {
          var epClean = _cleanMediaTitle(series, yearHint);
          if (!epClean.title) return "";
          return epClean.year ? epClean.title + " " + epClean.year : epClean.title;
        }
      }
      var raw = String(c.title || c.name || c.searchTitle || "").trim();
      var cleaned = _cleanMediaTitle(raw, yearHint);
      if (!cleaned.title) return "";
      return cleaned.year ? cleaned.title + " " + cleaned.year : cleaned.title;
    }
  }, {
    key: "_normalizeImdbId",
    value: function _normalizeImdbId(value) {
      var raw = String(value || "").trim();
      if (!raw) return "";
      if (/^tt\d+$/i.test(raw)) return raw.toLowerCase();
      var digits = raw.replace(/\D/g, "");
      return digits ? "tt" + digits : "";
    }
  }, {
    key: "_buildOpenSubtitleSearchUrl",
    value: function _buildOpenSubtitleSearchUrl(lang) {
      var c = this._playbackContext || {};
      var params = [];
      var imdbId = this._normalizeImdbId(c.imdb_id || c.imdb);
      var tmdbId = String(c.tmdb_id || c.tmdb || "").replace(/\D/g, "");
      var query = this._subtitleQuery();
      var hasId = !!(imdbId || tmdbId);
      if (!hasId && !query) return "";
      params.push("languages=" + encodeURIComponent(lang));
      if (imdbId) params.push("imdb_id=" + encodeURIComponent(imdbId));
      if (tmdbId) params.push("tmdb_id=" + encodeURIComponent(tmdbId));
      if (c.type === "episode") {
        params.push("type=episode");
        var season = c.season != null ? c.season : c.season_number;
        var episode = c.episode != null ? c.episode : c.episode_number;
        if (season != null && season !== "") params.push("season_number=" + encodeURIComponent(season));
        if (episode != null && episode !== "") params.push("episode_number=" + encodeURIComponent(episode));
      } else if (c.type === "movie") {
        params.push("type=movie");
      }
      if (query) params.push("query=" + encodeURIComponent(query));
      params.push("order_by=download_count");
      params.push("order_direction=desc");
      return "https://api.opensubtitles.com/api/v1/subtitles?" + params.join("&");
    }
  }, {
    key: "_openSubtitleApiError",
    value: function _openSubtitleApiError(data, fallback) {
      if (data && Array.isArray(data.errors) && data.errors.length) {
        return data.errors.map(function (e) {
          return e && (e.detail || e.title || e.code) || "";
        }).filter(Boolean).join("; ");
      }
      if (data && data.message) return String(data.message);
      return fallback || "OpenSubtitles request failed";
    }
  }, {
    key: "_mapOpenSubtitleRow",
    value: function _mapOpenSubtitleRow(row, lang) {
      var attrs = row && row.attributes;
      if (!attrs) return null;
      var files = Array.isArray(attrs.files) ? attrs.files : [];
      var file = files[0];
      var fileId = file && (file.file_id != null ? file.file_id : file.id);
      if (fileId == null || fileId === "") return null;
      var release = file && file.file_name || attrs.release || attrs.file_name || attrs.feature_details && attrs.feature_details.title || "";
      var rowLang = String(attrs.language || lang || "").toLowerCase();
      var downloads = attrs.download_count || 0;
      var hi = !!(attrs.hearing_impaired || attrs.hi);
      var label = release || _langName(rowLang) + " subtitle";
      if (hi) label += " (HI)";
      if (downloads) label += " · " + downloads + " downloads";
      return {
        kind: "result",
        lang: rowLang || lang,
        label: label,
        release: release,
        fileId: fileId,
        hearing: hi,
        rating: downloads,
        raw: row
      };
    }
  }, {
    key: "_subtitleLangLabel",
    value: function _subtitleLangLabel(code) {
      return _langName(code);
    }
  }, {
    key: "_subtitleRootItems",
    value: function _subtitleRootItems() {
      var settings = this._osSettings();
      var preferred = settings.langs.length ? settings.langs : ["en", "ar"];
      var ordered = [];
      var seen = {};
      function add(code) {
        code = String(code || "").toLowerCase();
        if (!code || seen[code]) return;
        seen[code] = true;
        ordered.push(code);
      }
      preferred.forEach(add);
      this._languageCatalog().forEach(add);
      var items = [{
        kind: "off",
        label: "Off",
        value: "off"
      }];
      var native = this._nativeSubtitleItems();
      if (native.length) {
        items.push({
          kind: "heading",
          label: "Device / stream tracks"
        });
        native.forEach(function (track) {
          items.push(track);
        });
      }
      items.push({
        kind: "heading",
        label: "OpenSubtitles"
      });
      ordered.forEach(function (code) {
        items.push({
          kind: "lang",
          lang: code,
          label: _langName(code),
          value: code,
          count: null
        });
      });
      return items;
    }
  }, {
    key: "_nativeSubtitleItems",
    value: function _nativeSubtitleItems() {
      var items = [];
      if (this.hls && this.hls.subtitleTracks) {
        for (var i = 0; i < this.hls.subtitleTracks.length; i++) {
          var t = this.hls.subtitleTracks[i];
          items.push({
            kind: "track",
            src: "hls",
            id: i,
            label: t.name || t.lang || "Subtitle " + (i + 1),
            track: {
              src: "hls",
              id: i,
              label: t.name || t.lang || "Subtitle " + (i + 1)
            }
          });
        }
      }
      var tt = this.video.textTracks;
      if (tt) {
        for (var j = 0; j < tt.length; j++) {
          var k = tt[j].kind;
          if (k === "subtitles" || k === "captions" || k === "") {
            items.push({
              kind: "track",
              src: "native",
              id: j,
              label: tt[j].label || tt[j].language || "Track " + (j + 1),
              track: {
                src: "native",
                id: j,
                label: tt[j].label || tt[j].language || "Track " + (j + 1)
              }
            });
          }
        }
      }
      return items;
    }
  }, {
    key: "setPlaybackContext",
    value: function setPlaybackContext(ctx) {
      this._playbackContext = ctx || null;
      this._subtitleBrowser = {
        mode: "root",
        lang: "",
        items: [],
        busy: false,
        error: ""
      };
      this._subtitleResults = {};
    }
  }, {
    key: "getSubtitleMenuState",
    value: function getSubtitleMenuState() {
      return {
        mode: this._subtitleBrowser.mode,
        lang: this._subtitleBrowser.lang,
        busy: !!this._subtitleBrowser.busy,
        error: this._subtitleBrowser.error || "",
        items: this._subtitleBrowser.items && this._subtitleBrowser.items.length ? this._subtitleBrowser.items : this._subtitleRootItems(),
        title: this._subtitleBrowser.mode === "lang" ? _langName(this._subtitleBrowser.lang) + " subtitles" : "Subtitles"
      };
    }
  }, {
    key: "openSubtitleBrowser",
    value: function openSubtitleBrowser() {
      this._subtitleBrowser = {
        mode: "root",
        lang: "",
        items: this._subtitleRootItems(),
        busy: false,
        error: ""
      };
      return Promise.resolve(this.getSubtitleMenuState());
    }
  }, {
    key: "openSubtitleLanguage",
    value: function openSubtitleLanguage(lang) {
      var self = this;
      lang = String(lang || "").toLowerCase();
      if (!lang) return Promise.resolve(this.getSubtitleMenuState());
      this._subtitleBrowser.mode = "lang";
      this._subtitleBrowser.lang = lang;
      this._subtitleBrowser.error = "";
      this._subtitleBrowser.busy = true;
      this._subtitleBrowser.items = [{
        kind: "loading",
        label: "Loading subtitles…"
      }];
      return this._fetchOpenSubtitleResults(lang).then(function (items) {
        if (self._subtitleBrowser.lang !== lang) return self.getSubtitleMenuState();
        self._subtitleBrowser.busy = false;
        self._subtitleBrowser.items = items.length ? items : [{
          kind: "empty",
          label: "No subtitles found"
        }];
        return self.getSubtitleMenuState();
      }).catch(function (err) {
        if (self._subtitleBrowser.lang !== lang) return self.getSubtitleMenuState();
        self._subtitleBrowser.busy = false;
        self._subtitleBrowser.error = err && err.message ? err.message : "Search failed";
        self._subtitleBrowser.items = [{
          kind: "back",
          label: "← Back to languages"
        }, {
          kind: "error",
          label: self._subtitleBrowser.error
        }];
        return self.getSubtitleMenuState();
      });
    }
  }, {
    key: "closeSubtitleBrowser",
    value: function closeSubtitleBrowser() {
      this._subtitleBrowser.mode = "root";
      this._subtitleBrowser.lang = "";
      this._subtitleBrowser.busy = false;
      this._subtitleBrowser.error = "";
      this._subtitleBrowser.items = this._subtitleRootItems();
      return Promise.resolve(this.getSubtitleMenuState());
    }
  }, {
    key: "selectSubtitleMenuItem",
    value: function selectSubtitleMenuItem(item) {
      if (!item) return Promise.resolve(this.getSubtitleMenuState());
      if (item.kind === "off") {
        this.setSubtitle("off");
        return Promise.resolve(this.closeSubtitleBrowser());
      }
      if (item.kind === "track") {
        this.setSubtitle(item.track);
        return Promise.resolve(this.closeSubtitleBrowser());
      }
      if (item.kind === "lang") {
        return this.openSubtitleLanguage(item.lang || item.value);
      }
      if (item.kind === "result") {
        return this._applyOpenSubtitleResult(item);
      }
      if (item.kind === "back") {
        return this.closeSubtitleBrowser();
      }
      return Promise.resolve(this.getSubtitleMenuState());
    }
  }, {
    key: "_osHeaders",
    value: function _osHeaders(extra) {
      var os = this._osSettings();
      var headers = {
        "Accept": "application/json",
        "Api-Key": os.apiKey || "",
        "User-Agent": "LG-IPTV/1.0.27"
      };
      if (this._osToken) headers.Authorization = "Bearer " + this._osToken;
      if (extra) {
        for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) headers[k] = extra[k];
      }
      return headers;
    }
  }, {
    key: "_ensureOpenSubToken",
    value: function _ensureOpenSubToken() {
      var self = this;
      if (this._osToken) return Promise.resolve(this._osToken);
      if (this._osTokenPromise) return this._osTokenPromise;
      var os = this._osSettings();
      if (!os.apiKey) {
        return Promise.reject(new Error("OpenSubtitles API key is required — add it in Settings"));
      }
      if (!os.username || !os.password) {
        return Promise.reject(new Error("OpenSubtitles login is required for downloads — add account in Settings"));
      }
      this._osTokenPromise = fetch("https://api.opensubtitles.com/api/v1/login", {
        method: "POST",
        headers: this._osHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          username: os.username,
          password: os.password
        })
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(self._openSubtitleApiError(data, "Login failed (HTTP " + r.status + ")"));
          return data;
        });
      }).then(function (data) {
        self._osTokenPromise = null;
        var token = data && (data.token || data.jwt || data.access_token || data.data && (data.data.token || data.data.access_token));
        if (!token) throw new Error("Login succeeded but no token was returned");
        self._osToken = token;
        return self._osToken;
      }).catch(function (err) {
        self._osTokenPromise = null;
        self._osToken = "";
        throw err;
      });
      return this._osTokenPromise;
    }
  }, {
    key: "_fetchOpenSubtitleResults",
    value: function _fetchOpenSubtitleResults(lang) {
      var self = this;
      lang = String(lang || "").toLowerCase();
      if (!lang) return Promise.resolve([]);
      var os = this._osSettings();
      if (!os.apiKey) return Promise.reject(new Error("OpenSubtitles API key is required — add it in Settings"));
      var searchUrl = this._buildOpenSubtitleSearchUrl(lang);
      if (!searchUrl) return Promise.reject(new Error("No title or ID available for subtitle search"));
      var cacheKey = searchUrl;
      if (this._subtitleResults[cacheKey]) return Promise.resolve(this._subtitleResults[cacheKey]);
      return this._ensureOpenSubToken().then(function () {
        return fetch(searchUrl, {
          headers: self._osHeaders()
        });
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(self._openSubtitleApiError(data, "Search failed (HTTP " + r.status + ")"));
          return data;
        });
      }).then(function (data) {
        var rows = Array.isArray(data && data.data) ? data.data : [];
        var items = rows.map(function (row) {
          return self._mapOpenSubtitleRow(row, lang);
        }).filter(function (item) {
          return !!item;
        });
        items.unshift({
          kind: "back",
          label: "← Back to languages"
        });
        self._subtitleResults[cacheKey] = items;
        return items;
      });
    }
  }, {
    key: "_requestOpenSubtitleDownloadLink",
    value: function _requestOpenSubtitleDownloadLink(fileId) {
      var self = this;
      return this._ensureOpenSubToken().then(function () {
        return fetch("https://api.opensubtitles.com/api/v1/download", {
          method: "POST",
          headers: self._osHeaders({
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({
            file_id: Number(fileId)
          })
        });
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(self._openSubtitleApiError(data, "Download failed (HTTP " + r.status + ")"));
          var link = data && data.link;
          if (!link) throw new Error("API response is missing the download link");
          return link;
        });
      });
    }
  }, {
    key: "_downloadSubtitleText",
    value: function _downloadSubtitleText(item) {
      var self = this;
      if (!item) return Promise.reject(new Error("No subtitle selected"));
      if (!item.fileId) return Promise.reject(new Error("Missing subtitle file id"));
      return this._requestOpenSubtitleDownloadLink(item.fileId).then(function (link) {
        return fetch(link).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status + " on downloading subtitle file");
          return r.text();
        });
      });
    }
  }, {
    key: "_applyOpenSubtitleResult",
    value: function _applyOpenSubtitleResult(item) {
      var self = this;
      var lang = String(item && item.lang || this._subtitleBrowser.lang || "").toLowerCase();
      var fileId = item && item.fileId;
      if (!fileId && item && item.raw && item.raw.attributes && item.raw.attributes.files) {
        var f = item.raw.attributes.files[0];
        fileId = f && (f.file_id != null ? f.file_id : f.id);
      }
      if (!fileId) {
        this._subtitleBrowser.error = "Invalid subtitle data: missing file ID";
        this._subtitleBrowser.items = [{
          kind: "back",
          label: "← Back to languages"
        }, {
          kind: "error",
          label: this._subtitleBrowser.error
        }];
        return Promise.resolve(this.getSubtitleMenuState());
      }
      this._subtitleBrowser.busy = true;
      this._subtitleBrowser.items = [{
        kind: "loading",
        label: "Loading subtitle…"
      }];
      return this._requestOpenSubtitleDownloadLink(fileId).then(function (link) {
        return fetch(link);
      }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status + " on downloading subtitle file");
        return r.text();
      }).then(function (text) {
        if (!text) throw new Error("Empty subtitle file");
        var label = item && item.label || item && item.release || "Downloaded subtitle";
        self._applySubtitleText(text, lang, label);
        self._setSubtitleDirection(lang);
        return self.closeSubtitleBrowser();
      }).catch(function (err) {
        self._subtitleBrowser.busy = false;
        self._subtitleBrowser.error = err && err.message ? err.message : "Subtitle download failed";
        self._subtitleBrowser.items = [{
          kind: "back",
          label: "← Back to languages"
        }, {
          kind: "error",
          label: self._subtitleBrowser.error
        }];
        return self.getSubtitleMenuState();
      });
    }
  }, {
    key: "_applySubtitleText",
    value: function _applySubtitleText(text, lang, label) {
      var vtt = /^WEBVTT/i.test(String(text || "").trim()) ? String(text) : this._srtToVtt(text);

      // 1. CLEANUP: Prevent Memory Leaks and DOM clutter
      // Remove previously added external tracks and free up their Blob URLs
      if (this._externalTrackEls && this._externalTrackEls.length > 0) {
        for (var i = 0; i < this._externalTrackEls.length; i++) {
          var oldTrack = this._externalTrackEls[i];
          if (oldTrack.src) {
            URL.revokeObjectURL(oldTrack.src); // Free browser memory
          }
          if (oldTrack.parentNode === this.video) {
            this.video.removeChild(oldTrack); // Remove from DOM
          }
        }
      }
      this._externalTrackEls = []; // Reset the array

      // 2. Disable existing native tracks
      var tt = this.video.textTracks;
      if (tt) {
        for (var j = 0; j < tt.length; j++) tt[j].mode = "disabled";
      }

      // 3. Disable HLS.js built-in tracks
      if (this.hls) {
        try {
          this.hls.subtitleDisplay = false;
          this.hls.subtitleTrack = -1;
        } catch (_) {}
      }

      // 4. Create and configure the new track
      var track = document.createElement("track");
      track.kind = "subtitles";
      track.label = label || _langName(lang) || "Subtitles";
      if (lang) track.srclang = lang;
      track.src = URL.createObjectURL(new Blob([vtt], {
        type: "text/vtt"
      }));

      // 5. Append to DOM and track array
      this._externalTrackEls.push(track);
      this.video.appendChild(track);

      // 6. Activate the exact track we just created
      // `track.track` accesses the underlying TextTrack object for the element
      if (track.track) {
        track.track.mode = "showing";
      } else {
        // Fallback for some older browsers where track.track isn't immediately available
        tt = this.video.textTracks;
        if (tt && tt.length > 0) {
          tt[tt.length - 1].mode = "showing";
        }
      }
      this._activeSub = {
        src: "external",
        id: track.label,
        lang: lang,
        label: track.label
      };
    }
  }, {
    key: "_setSubtitleDirection",
    value: function _setSubtitleDirection(lang) {
      var rtlSetting = this._osSettings().rtl;
      var forceRtl = rtlSetting === "force";
      var autoRtl = rtlSetting === "auto" && _isRtlLanguage(lang);
      var on = forceRtl || autoRtl;
      if (this.video) this.video.classList.toggle("subtitle-rtl", on);
    }
  }, {
    key: "setPlaybackContextFromMeta",
    value: function setPlaybackContextFromMeta(meta) {
      this.setPlaybackContext(meta || null);
    }
  }, {
    key: "play",
    value: function play(url) {
      if (!url) return;
      if (url !== this._lastUrl) this._lowQuality = false; // new channel → normal ABR
      this._lastUrl = url;
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
        url: url,
        label: "Native"
      }];
      if (isHls) {
        list.push({
          engine: "hls",
          url: url,
          label: "HLS"
        });
        var ts = url.replace(/\.m3u8(\?[^#]*)?$/i, ".ts$1");
        if (ts !== url) list.push({
          engine: "native",
          url: ts,
          label: "Native (TS)"
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
      if (!this._lastUrl) return;
      this._lowQuality = true;
      this.play(this._lastUrl);
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