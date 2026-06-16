"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// ── M3U / M3U8 playlist support ───────────────────────────────────────────────
//
// Parses a remote M3U8 playlist URL and returns channels + categories in the
// same shape as xtreamGetLiveChannels / xtreamGetCategories so the rest of the
// app works without changes.
//
// #EXTINF attributes understood:
//   tvg-id, tvg-name, tvg-logo, tvg-chno, group-title

var M3U_CACHE_KEY = "iptv_m3u_v1";
var M3U_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

function m3uLoadConfig() {
  var _window$IPTV_M3U_CONF;
  var stored = function () {
    try {
      return JSON.parse(localStorage.getItem("iptv_m3u_config"));
    } catch (_unused) {
      return null;
    }
  }();
  if (stored !== null && stored !== void 0 && stored.playlist_url) return Promise.resolve(stored);
  if ((_window$IPTV_M3U_CONF = window.IPTV_M3U_CONFIG) !== null && _window$IPTV_M3U_CONF !== void 0 && _window$IPTV_M3U_CONF.playlist_url) return Promise.resolve(window.IPTV_M3U_CONFIG);
  return Promise.reject(new Error("No M3U playlist URL configured"));
}

// ── Disk cache ────────────────────────────────────────────────────────────────

function m3uLoadCache() {
  try {
    var raw = localStorage.getItem(M3U_CACHE_KEY);
    if (!raw) return null;
    var _JSON$parse = JSON.parse(raw),
      ts = _JSON$parse.ts,
      channels = _JSON$parse.channels,
      categories = _JSON$parse.categories;
    if (Date.now() - ts > M3U_TTL_MS) return null;
    return {
      channels: channels,
      categories: categories
    };
  } catch (_unused2) {
    return null;
  }
}
function m3uSaveCache(channels, categories) {
  try {
    localStorage.setItem(M3U_CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      channels: channels,
      categories: categories
    }));
  } catch (_unused3) {}
}
function m3uClearCache() {
  try {
    localStorage.removeItem(M3U_CACHE_KEY);
  } catch (_unused4) {}
}

// ── Parser ────────────────────────────────────────────────────────────────────

var _attrReCache = {};
function _parseAttr(extinf, attr) {
  var re = _attrReCache[attr];
  // Handles: attr="value"  attr='value'  attr=value (unquoted)
  if (!re) re = _attrReCache[attr] = new RegExp(attr + '=(?:"([^"]*)"|\'([^\']*)\'|([^\\s"\']*))');
  var m = extinf.match(re);
  return m ? (m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3] || "").trim() : "";
}
function m3uParse(text) {
  // Normalise all line-ending styles (\r\n, \r, \n) before splitting
  var lines = text.replace(/\r\n?/g, "\n").split("\n");
  var channels = [];
  var catSet = new Map(); // category_name → category_id
  var extinf = null;
  var streamId = 1;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("#EXTINF")) {
      extinf = line;
      continue;
    }

    // Skip other directives
    if (line.startsWith("#")) continue;

    // This line is a URL — pair with the preceding #EXTINF
    if (extinf) {
      var name = extinf.replace(/^#EXTINF[^,]*,/, "").trim();
      var tvgId = _parseAttr(extinf, "tvg-id") || _parseAttr(extinf, "tvg-name") || name;
      var logo = _parseAttr(extinf, "tvg-logo");
      var group = _parseAttr(extinf, "group-title") || "Uncategorised";
      if (!catSet.has(group)) catSet.set(group, String(catSet.size + 1));
      var categoryId = catSet.get(group);
      channels.push({
        stream_id: streamId++,
        name: name,
        stream_icon: logo,
        epg_channel_id: tvgId,
        category_id: categoryId,
        // M3U channels carry their URL directly — stored here so
        // xtreamBuildLiveURL can be skipped
        stream_url: line,
        _source: "m3u"
      });
      extinf = null;
    }
  }
  var categories = Array.from(catSet.entries()).map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      name = _ref2[0],
      id = _ref2[1];
    return {
      category_id: id,
      category_name: name
    };
  });
  return {
    channels: channels,
    categories: categories
  };
}

// ── Fetch + parse ─────────────────────────────────────────────────────────────
function m3uFetchPlaylist(_x) {
  return _m3uFetchPlaylist.apply(this, arguments);
} // ── Public API (mirrors xtream shape) ─────────────────────────────────────────
function _m3uFetchPlaylist() {
  _m3uFetchPlaylist = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(url) {
    var ctrl, tid, res, text, _t;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          ctrl = new AbortController();
          tid = setTimeout(function () {
            return ctrl.abort();
          }, 30000); // covers both fetch + body read
          _context.p = 1;
          _context.n = 2;
          return fetch(url, {
            signal: ctrl.signal
          });
        case 2:
          res = _context.v;
          if (res.ok) {
            _context.n = 3;
            break;
          }
          throw new Error("HTTP " + res.status);
        case 3:
          _context.n = 4;
          return res.text();
        case 4:
          text = _context.v;
          // body still covered by abort signal
          clearTimeout(tid);
          if (text.includes("#EXTM3U")) {
            _context.n = 5;
            break;
          }
          throw new Error("Not a valid M3U playlist");
        case 5:
          return _context.a(2, m3uParse(text));
        case 6:
          _context.p = 6;
          _t = _context.v;
          clearTimeout(tid);
          throw _t;
        case 7:
          return _context.a(2);
      }
    }, _callee, null, [[1, 6]]);
  }));
  return _m3uFetchPlaylist.apply(this, arguments);
}
function m3uGetChannelsAndCategories(_x2) {
  return _m3uGetChannelsAndCategories.apply(this, arguments);
} // M3U channels have no server-side EPG API — return empty so the app
// falls back to XMLTV if the user has configured one.
function _m3uGetChannelsAndCategories() {
  _m3uGetChannelsAndCategories = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(m3uCfg) {
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          return _context2.a(2, m3uFetchPlaylist(m3uCfg.playlist_url));
      }
    }, _callee2);
  }));
  return _m3uGetChannelsAndCategories.apply(this, arguments);
}
function m3uGetEPG(/*streamId*/
) {
  return Promise.resolve([]);
}

// Build the playback URL for an M3U channel — it's stored directly on the
// channel object, so just return it.
function m3uBuildLiveURL(channel) {
  return channel.stream_url || "";
}