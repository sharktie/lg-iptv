"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var cfg = null;
var allChannels = [];
var activeCategory = "favs";
var activeFavGroup = "all";
var epgCache = {};
var favourites = load("iptv_favourites", []);
var _favsSet = new Set(favourites);
var favGroups = load("iptv_fav_groups", []);
var currentChannel = null;
var epgLoadAbortKey = 0;
var epgBlocked = false; // set true on first 403 — stops all further EPG requests
var _hiddenCatsLive = new Set((load("iptv_hidden_cats_live", []) || []).map(String));
var _keepScrollOnApply = false;
var TIMELINE_HOURS = 3;
var timelineOffset = 0;
var rowCache = new Map();

// ── Settings stub (safe no-op if settings.js is removed) ─────────────────────
if (typeof setSettingsStatus === "undefined") {
  window.setSettingsStatus = function () {};
}

// ── Local storage helpers ─────────────────────────────────────────────────────

function load(key, fallback) {
  try {
    var v = localStorage.getItem(key);
    return v != null ? JSON.parse(v) : fallback;
  } catch (_unused) {
    return fallback;
  }
}
function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_unused2) {}
}

// ── Channel cache ─────────────────────────────────────────────────────────────

var CHANNEL_CACHE_KEY = "iptv_ch_v2";
var CAT_CACHE_KEY = "iptv_cat_v2";
var CACHE_TTL_MS = 4 * 60 * 60 * 1000;
function loadChannelCache() {
  try {
    var raw = localStorage.getItem(CHANNEL_CACHE_KEY);
    if (!raw) return null;
    var _JSON$parse = JSON.parse(raw),
      ts = _JSON$parse.ts,
      data = _JSON$parse.data;
    return Date.now() - ts > CACHE_TTL_MS ? null : data;
  } catch (_unused3) {
    return null;
  }
}
function loadCatCache() {
  try {
    var raw = localStorage.getItem(CAT_CACHE_KEY);
    if (!raw) return null;
    var _JSON$parse2 = JSON.parse(raw),
      ts = _JSON$parse2.ts,
      data = _JSON$parse2.data;
    return Date.now() - ts > CACHE_TTL_MS ? null : data;
  } catch (_unused4) {
    return null;
  }
}
function saveChannelCache(channels, categories) {
  try {
    var slim = channels.map(function (_ref) {
      var stream_id = _ref.stream_id,
        name = _ref.name,
        category_id = _ref.category_id,
        stream_icon = _ref.stream_icon,
        epg_channel_id = _ref.epg_channel_id;
      return {
        stream_id: stream_id,
        name: name,
        category_id: category_id,
        stream_icon: stream_icon || "",
        epg_channel_id: epg_channel_id || ""
      };
    });
    localStorage.setItem(CHANNEL_CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      data: slim
    }));
    localStorage.setItem(CAT_CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      data: categories
    }));
  } catch (_unused5) {
    try {
      localStorage.removeItem("iptv_epg_v2");
    } catch (_unused6) {}
    try {
      var _slim = channels.map(function (_ref2) {
        var stream_id = _ref2.stream_id,
          name = _ref2.name,
          category_id = _ref2.category_id,
          stream_icon = _ref2.stream_icon;
        return {
          stream_id: stream_id,
          name: name,
          category_id: category_id,
          stream_icon: stream_icon || ""
        };
      });
      localStorage.setItem(CHANNEL_CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        data: _slim
      }));
    } catch (_unused7) {}
  }
}

// ── EPG disk cache ────────────────────────────────────────────────────────────

var EPG_CACHE_KEY = "iptv_epg_v2";
var EPG_TTL_MS = 30 * 60 * 1000;
function loadEpgDiskCache() {
  try {
    var raw = localStorage.getItem(EPG_CACHE_KEY);
    if (!raw) return {};
    var _JSON$parse3 = JSON.parse(raw),
      ts = _JSON$parse3.ts,
      data = _JSON$parse3.data;
    return Date.now() - ts > EPG_TTL_MS ? {} : data;
  } catch (_unused8) {
    return {};
  }
}
var _epgSaveTimer = null;
function scheduleEpgSave() {
  clearTimeout(_epgSaveTimer);
  _epgSaveTimer = setTimeout(function () {
    try {
      var toSave = {};
      for (var _i = 0, _Object$entries = Object.entries(epgCache); _i < _Object$entries.length; _i++) {
        var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
          k = _Object$entries$_i[0],
          v = _Object$entries$_i[1];
        if (Array.isArray(v)) toSave[k] = v;
      }
      localStorage.setItem(EPG_CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        data: toSave
      }));
    } catch (_unused9) {}
  }, 2000);
}

// ── Favourites ────────────────────────────────────────────────────────────────

function isFav(sid) {
  return _favsSet.has(String(sid));
}
function toggleFav(sid) {
  sid = String(sid);
  if (_favsSet.has(sid)) {
    favourites = favourites.filter(function (x) {
      return x !== sid;
    });
    _favsSet.delete(sid);
  } else {
    favourites = [].concat(_toConsumableArray(favourites), [sid]);
    _favsSet.add(sid);
  }
  save("iptv_favourites", favourites);
}
function moveFav(sid, dir) {
  sid = String(sid);
  var i = favourites.indexOf(sid),
    j = i + dir;
  if (i < 0 || j < 0 || j >= favourites.length) return;
  var _ref3 = [favourites[j], favourites[i]];
  favourites[i] = _ref3[0];
  favourites[j] = _ref3[1];
  save("iptv_favourites", favourites);
}
function _reorderAndRefocus(sid, dir, subzone) {
  moveFav(sid, dir);
  _keepScrollOnApply = true;
  var channels = getFilteredChannels();
  var newIdx = channels.findIndex(function (ch) {
    return String(ch.stream_id) === sid;
  });
  if (newIdx >= 0) tvRowIndex = newIdx;
  _vsSetChannels(channels, true);
  loadEPGForCurrentCategory();
  tvRowSubZone = subzone;
  tvFocusRowButtons();
}

// ── Favourite groups ──────────────────────────────────────────────────────────

function createFavGroup(name) {
  var g = {
    id: "fg_" + Date.now().toString(36),
    name: name.trim(),
    channelIds: []
  };
  favGroups.push(g);
  save("iptv_fav_groups", favGroups);
  return g;
}
function renameFavGroup(id, name) {
  var g = favGroups.find(function (x) {
    return x.id === id;
  });
  if (g) {
    g.name = name.trim();
    save("iptv_fav_groups", favGroups);
  }
}
function deleteFavGroup(id) {
  favGroups = favGroups.filter(function (x) {
    return x.id !== id;
  });
  if (activeFavGroup === id) activeFavGroup = "all";
  save("iptv_fav_groups", favGroups);
}
function isInGroup(gid, sid) {
  var g = favGroups.find(function (x) {
    return x.id === gid;
  });
  return g ? g.channelIds.includes(String(sid)) : false;
}
function toggleChannelInGroup(gid, sid) {
  sid = String(sid);
  var g = favGroups.find(function (x) {
    return x.id === gid;
  });
  if (!g) return;
  g.channelIds = g.channelIds.includes(sid) ? g.channelIds.filter(function (x) {
    return x !== sid;
  }) : [].concat(_toConsumableArray(g.channelIds), [sid]);
  save("iptv_fav_groups", favGroups);
}

// ── App init ──────────────────────────────────────────────────────────────────

// ── Source type ───────────────────────────────────────────────────────────────

function getSourceType() {
  return load("iptv_source_type", "xtream");
}
function initApp() {
  return _initApp.apply(this, arguments);
}
function _initApp() {
  _initApp = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    var status, setStatus;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          status = document.getElementById("status");
          setStatus = function setStatus(msg, err) {
            status.textContent = msg;
            status.style.color = err ? "#ff5555" : "";
          };
          epgCache = loadEpgDiskCache();
          if (!(getSourceType() === "m3u")) {
            _context.n = 2;
            break;
          }
          _context.n = 1;
          return _initAppM3U(setStatus);
        case 1:
          _context.n = 3;
          break;
        case 2:
          _context.n = 3;
          return _initAppXtream(setStatus);
        case 3:
          return _context.a(2);
      }
    }, _callee);
  }));
  return _initApp.apply(this, arguments);
}
function _initAppM3U(_x) {
  return _initAppM3U2.apply(this, arguments);
}
function _initAppM3U2() {
  _initAppM3U2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(setStatus) {
    var m3uCfg, cached, _yield$m3uGetChannels, channels, categories, _t, _t2;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          _context2.p = 0;
          _context2.n = 1;
          return m3uLoadConfig();
        case 1:
          m3uCfg = _context2.v;
          _context2.n = 3;
          break;
        case 2:
          _context2.p = 2;
          _t = _context2.v;
          setStatus("ERR: " + _t.message, true);
          return _context2.a(2);
        case 3:
          // Try disk cache first
          cached = m3uLoadCache();
          if (!cached) {
            _context2.n = 4;
            break;
          }
          allChannels = cached.channels;
          setStatus("".concat(allChannels.length, " channels (cached)"));
          _bootUI(cached.categories);
          // Refresh in background
          m3uFetchPlaylist(m3uCfg.playlist_url).then(function (_ref4) {
            var channels = _ref4.channels,
              categories = _ref4.categories;
            allChannels = channels;
            setStatus("".concat(allChannels.length, " channels"));
            m3uSaveCache(channels, categories);
            renderCategories(categories);
            applyFilters();
          }).catch(function () {});
          return _context2.a(2);
        case 4:
          _context2.p = 4;
          setStatus("Loading playlist…");
          _context2.n = 5;
          return m3uGetChannelsAndCategories(m3uCfg);
        case 5:
          _yield$m3uGetChannels = _context2.v;
          channels = _yield$m3uGetChannels.channels;
          categories = _yield$m3uGetChannels.categories;
          if (channels.length) {
            _context2.n = 6;
            break;
          }
          setStatus("ERR: 0 channels in playlist", true);
          return _context2.a(2);
        case 6:
          allChannels = channels;
          setStatus("".concat(allChannels.length, " channels"));
          m3uSaveCache(channels, categories);
          _bootUI(categories);
          _context2.n = 8;
          break;
        case 7:
          _context2.p = 7;
          _t2 = _context2.v;
          setStatus("ERR: " + _t2.message, true);
        case 8:
          return _context2.a(2);
      }
    }, _callee2, null, [[4, 7], [0, 2]]);
  }));
  return _initAppM3U2.apply(this, arguments);
}
function _initAppXtream(_x2) {
  return _initAppXtream2.apply(this, arguments);
}
function _initAppXtream2() {
  _initAppXtream2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(setStatus) {
    var _cfg;
    var cachedCh, cachedCat, categories, login, _yield$Promise$all, _yield$Promise$all2, channels, cats, _t3, _t4, _t5;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          setStatus("Loading config…");
          _context3.p = 1;
          _context3.n = 2;
          return xtreamLoadConfig();
        case 2:
          cfg = _context3.v;
          _context3.n = 4;
          break;
        case 3:
          _context3.p = 3;
          _t3 = _context3.v;
          setStatus("ERR: " + _t3.message, true);
          return _context3.a(2);
        case 4:
          if ((_cfg = cfg) !== null && _cfg !== void 0 && _cfg.server_url) {
            _context3.n = 5;
            break;
          }
          setStatus("No server configured — redirecting to Settings…", false);
          setTimeout(function () {
            window.location.href = "../pages/settings.html";
          }, 1800);
          return _context3.a(2);
        case 5:
          cachedCh = loadChannelCache();
          cachedCat = loadCatCache();
          categories = cachedCat || [];
          if (!cachedCh) {
            _context3.n = 6;
            break;
          }
          allChannels = cachedCh;
          setStatus("".concat(allChannels.length, " channels (cached)"));
          _bootUI(categories);
          xtreamGetLiveChannels(cfg).then(function (fresh) {
            if (fresh.length) {
              allChannels = fresh;
              setStatus("".concat(allChannels.length, " channels"));
              saveChannelCache(fresh, categories);
              applyFilters();
            }
          }).catch(function () {});
          xtreamGetCategories(cfg).then(function (freshCat) {
            categories = freshCat;
            saveChannelCache(allChannels, freshCat);
            renderCategories(freshCat);
          }).catch(function () {});
          return _context3.a(2);
        case 6:
          setStatus("Logging in…");
          _context3.p = 7;
          _context3.n = 8;
          return xtreamLogin(cfg);
        case 8:
          login = _context3.v;
          if (login) {
            _context3.n = 9;
            break;
          }
          setStatus("ERR: Login failed — check credentials", true);
          return _context3.a(2);
        case 9:
          // Update cfg with the resolved server_url (the URL that actually worked)
          cfg = login.cfg;
          _context3.n = 11;
          break;
        case 10:
          _context3.p = 10;
          _t4 = _context3.v;
          setStatus("ERR: " + _t4.message, true);
          return _context3.a(2);
        case 11:
          _context3.p = 11;
          setStatus("Fetching channels…");
          _context3.n = 12;
          return Promise.all([xtreamGetLiveChannels(cfg), xtreamGetCategories(cfg)]);
        case 12:
          _yield$Promise$all = _context3.v;
          _yield$Promise$all2 = _slicedToArray(_yield$Promise$all, 2);
          channels = _yield$Promise$all2[0];
          cats = _yield$Promise$all2[1];
          if (channels.length) {
            _context3.n = 13;
            break;
          }
          setStatus("ERR: 0 channels returned", true);
          return _context3.a(2);
        case 13:
          allChannels = channels;
          categories = cats;
          setStatus("".concat(allChannels.length, " channels"));
          saveChannelCache(channels, categories);
          _bootUI(categories);
          _context3.n = 15;
          break;
        case 14:
          _context3.p = 14;
          _t5 = _context3.v;
          setStatus("ERR: " + _t5.message, true);
        case 15:
          return _context3.a(2);
      }
    }, _callee3, null, [[11, 14], [7, 10], [1, 3]]);
  }));
  return _initAppXtream2.apply(this, arguments);
}
function _bootUI(categories) {
  renderCategories(categories);
  setupSearch();
  setupPip();
  setupTimelineNav();
  if (xmltvCache && xmltvCache.programmes) mergeXMLTVIntoEpgCache();
  activeCategory = favourites.length ? "favs" : "all";
  activeFavGroup = "all";
  if (activeCategory === "favs") {
    var sec = document.getElementById("cat-section-favs");
    if (sec) sec.classList.add("open");
  }
  renderFavSectionList();
  updateSidebarActive();
  applyFilters();
  tvRowIndex = 0;
  setTVZone("channel-list");
}

// ── Virtual scroll ────────────────────────────────────────────────────────────

var VS_ROW_H = 96;
var VS_OVERSCAN = 5;
var _vsChannels = [];
var _vsScrollTop = 0;
var _vsHeight = 0;
var _vsRafPending = false;
function initVirtualScroll() {
  var wrap = document.getElementById("channel-list-wrap");
  wrap.addEventListener("scroll", function () {
    _vsScrollTop = wrap.scrollTop;
    if (!_vsRafPending) {
      _vsRafPending = true;
      requestAnimationFrame(function () {
        _vsRafPending = false;
        _vsRender();
      });
    }
  }, {
    passive: true
  });
  _vsHeight = wrap.clientHeight || window.innerHeight * 0.55;
}
function _vsSetChannels(channels, keepScroll) {
  _vsChannels = channels;
  var wrap = document.getElementById("channel-list-wrap");
  var list = document.getElementById("channel-list");
  if (!channels.length) {
    list.innerHTML = "";
    list.style.height = "0px";
    return;
  }
  list.style.height = channels.length * VS_ROW_H + "px";
  list.style.position = "relative";
  if (!keepScroll) {
    wrap.scrollTop = _vsScrollTop = 0;
  }
  _vsHeight = wrap.clientHeight || _vsHeight;
  _vsRender();
}
function _vsRender() {
  var list = document.getElementById("channel-list");
  var channels = _vsChannels;
  if (!channels.length) return;
  var first = Math.max(0, Math.floor(_vsScrollTop / VS_ROW_H) - VS_OVERSCAN);
  var last = Math.min(channels.length - 1, Math.ceil((_vsScrollTop + _vsHeight) / VS_ROW_H) + VS_OVERSCAN);
  var isFavView = activeCategory === "favs";
  var fragment = document.createDocumentFragment();
  var needed = new Set();
  var _loop = function _loop() {
    var ch = channels[i];
    var sid = String(ch.stream_id);
    needed.add(sid);
    var entry = rowCache.get(sid);
    if (!entry) {
      entry = _buildRow(ch, sid);
      rowCache.set(sid, entry);
    }
    var _entry = entry,
      row = _entry.row,
      favBtn = _entry.favBtn,
      assignBtn = _entry.assignBtn,
      col3 = _entry.col3,
      col4 = _entry.col4;
    row.style.position = "absolute";
    row.style.top = i * VS_ROW_H + "px";
    row.style.left = row.style.right = "0";
    row.classList.toggle("selected", currentChannel !== null && String(currentChannel.stream_id) === sid);
    favBtn.classList.toggle("active", isFav(sid));
    col3.style.display = isFavView ? "flex" : "none";
    assignBtn.classList.toggle("active", favGroups.some(function (g) {
      return g.channelIds.includes(sid);
    }));
    col4.style.display = isFavView && activeFavGroup === "all" ? "flex" : "none";
    buildEpgStrip(entry.epgStrip, sid);
    if (!list.contains(row)) fragment.appendChild(row);
  };
  for (var i = first; i <= last; i++) {
    _loop();
  }
  if (fragment.childElementCount) list.appendChild(fragment);
  Array.from(list.children).forEach(function (el) {
    if (!needed.has(el.dataset.sid)) el.remove();
  });
}
function _buildRow(ch, sid) {
  var row = document.createElement("div");
  row.className = "tl-row";
  row.dataset.sid = sid;
  row.setAttribute("tabindex", "-1");

  // ── Col 1: logo + name + EPG strip ───────────────────────────────────────
  var col1 = document.createElement("div");
  col1.className = "tl-col1";
  var logoCell = document.createElement("div");
  logoCell.className = "tl-logo-cell";
  var initial = (ch.name || "?")[0].toUpperCase();
  if (ch.stream_icon) {
    var img = new Image();
    img.className = "ch-logo-static";
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.onerror = function () {
      var fb = document.createElement("div");
      fb.className = "ch-logo-fallback";
      fb.textContent = initial;
      if (this.parentNode) this.parentNode.replaceChild(fb, this);
    };
    img.src = ch.stream_icon;
    logoCell.appendChild(img);
  } else {
    var fb = document.createElement("div");
    fb.className = "ch-logo-fallback";
    fb.textContent = initial;
    logoCell.appendChild(fb);
  }
  var nameEpgWrap = document.createElement("div");
  nameEpgWrap.className = "tl-name-epg-wrap";
  var nd = document.createElement("div");
  nd.className = "ch-name";
  nd.textContent = ch.name || "Unknown";
  var epgStrip = document.createElement("div");
  epgStrip.className = "tl-epg-strip";
  epgStrip.dataset.sid = sid;
  nameEpgWrap.appendChild(nd);
  nameEpgWrap.appendChild(epgStrip);
  col1.appendChild(logoCell);
  col1.appendChild(nameEpgWrap);

  // ── Col 2: favourite button ───────────────────────────────────────────────
  var col2 = document.createElement("div");
  col2.className = "tl-col2";
  var favBtn = document.createElement("button");
  favBtn.className = "fav-btn";
  favBtn.textContent = "★";
  favBtn.setAttribute("tabindex", "-1");
  favBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleFav(sid);
    if (activeCategory === "favs") {
      applyFilters();
      return;
    }
    favBtn.classList.toggle("active", isFav(sid));
  });
  col2.appendChild(favBtn);

  // ── Col 3: assign (+) button — fav view only ─────────────────────────────
  var col3 = document.createElement("div");
  col3.className = "tl-col3";
  var assignBtn = document.createElement("button");
  assignBtn.className = "assign-btn";
  assignBtn.textContent = "+";
  assignBtn.setAttribute("tabindex", "-1");
  assignBtn.addEventListener("click", function (e) {
    return showAssignPanel(e, sid, assignBtn);
  });
  col3.appendChild(assignBtn);

  // ── Col 4: reorder buttons ────────────────────────────────────────────────
  var col4 = document.createElement("div");
  col4.className = "tl-col4";
  var reorder = document.createElement("div");
  reorder.className = "fav-reorder";
  var upBtn = document.createElement("button");
  upBtn.className = "reorder-btn reorder-up";
  upBtn.setAttribute("aria-label", "Move up");
  upBtn.innerHTML = "<svg viewBox=\"0 0 10 6\" width=\"10\" height=\"6\"><polyline points=\"1,5 5,1 9,5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
  upBtn.setAttribute("tabindex", "-1");
  upBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    _reorderAndRefocus(sid, -1, "reorder-up");
  });
  var dnBtn = document.createElement("button");
  dnBtn.className = "reorder-btn reorder-dn";
  dnBtn.setAttribute("aria-label", "Move down");
  dnBtn.innerHTML = "<svg viewBox=\"0 0 10 6\" width=\"10\" height=\"6\"><polyline points=\"1,1 5,5 9,1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
  dnBtn.setAttribute("tabindex", "-1");
  dnBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    _reorderAndRefocus(sid, 1, "reorder-down");
  });
  reorder.appendChild(upBtn);
  reorder.appendChild(dnBtn);
  col4.appendChild(reorder);
  row.appendChild(col1);
  row.appendChild(col2);
  row.appendChild(col3);
  row.appendChild(col4);

  // Magic remote pointer click selects the channel.
  // D-pad OK is handled via onTVKeyDown in dpad.js.
  col1.addEventListener("click", function () {
    return selectChannel(ch);
  });
  return {
    row: row,
    epgStrip: epgStrip,
    favBtn: favBtn,
    assignBtn: assignBtn,
    reorder: reorder,
    upBtn: upBtn,
    dnBtn: dnBtn,
    col1: col1,
    col2: col2,
    col3: col3,
    col4: col4
  };
}

// ── EPG loading ───────────────────────────────────────────────────────────────
function loadEPGForCurrentCategory() {
  return _loadEPGForCurrentCategory.apply(this, arguments);
} // ── Fullscreen / PiP / OSD ────────────────────────────────────────────────────
function _loadEPGForCurrentCategory() {
  _loadEPGForCurrentCategory = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
    var myKey, needed, BATCH, i;
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.n) {
        case 0:
          if (!epgBlocked) {
            _context5.n = 1;
            break;
          }
          return _context5.a(2);
        case 1:
          myKey = ++epgLoadAbortKey;
          needed = getFilteredChannels().filter(function (ch) {
            return epgCache[ch.stream_id] === undefined;
          });
          if (needed.length) {
            _context5.n = 2;
            break;
          }
          return _context5.a(2);
        case 2:
          needed.forEach(function (ch) {
            epgCache[ch.stream_id] = null;
          });
          BATCH = 4;
          i = 0;
        case 3:
          if (!(i < needed.length)) {
            _context5.n = 8;
            break;
          }
          if (!(epgLoadAbortKey !== myKey || epgBlocked)) {
            _context5.n = 4;
            break;
          }
          return _context5.a(2);
        case 4:
          _context5.n = 5;
          return Promise.all(needed.slice(i, i + BATCH).map(/*#__PURE__*/function () {
            var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(ch) {
              var _t6, _t7;
              return _regenerator().w(function (_context4) {
                while (1) switch (_context4.p = _context4.n) {
                  case 0:
                    if (!epgBlocked) {
                      _context4.n = 1;
                      break;
                    }
                    return _context4.a(2);
                  case 1:
                    _context4.p = 1;
                    if (!(ch._source === "m3u")) {
                      _context4.n = 3;
                      break;
                    }
                    _context4.n = 2;
                    return m3uGetEPG(ch.stream_id);
                  case 2:
                    _t6 = _context4.v;
                    _context4.n = 5;
                    break;
                  case 3:
                    _context4.n = 4;
                    return xtreamGetEPG(cfg, ch.stream_id);
                  case 4:
                    _t6 = _context4.v;
                  case 5:
                    epgCache[ch.stream_id] = _t6;
                    _context4.n = 7;
                    break;
                  case 6:
                    _context4.p = 6;
                    _t7 = _context4.v;
                    if (_t7 && _t7.message && _t7.message.indexOf("403") !== -1) {
                      epgBlocked = true;
                    } else {
                      epgCache[ch.stream_id] = [];
                    }
                  case 7:
                    return _context4.a(2);
                }
              }, _callee4, null, [[1, 6]]);
            }));
            return function (_x6) {
              return _ref5.apply(this, arguments);
            };
          }()));
        case 5:
          if (!(epgLoadAbortKey !== myKey || epgBlocked)) {
            _context5.n = 6;
            break;
          }
          return _context5.a(2);
        case 6:
          needed.slice(i, i + BATCH).forEach(function (ch) {
            return patchEpgStrip(ch.stream_id);
          });
        case 7:
          i += BATCH;
          _context5.n = 3;
          break;
        case 8:
          scheduleEpgSave();
        case 9:
          return _context5.a(2);
      }
    }, _callee5);
  }));
  return _loadEPGForCurrentCategory.apply(this, arguments);
}
var _osdTimer = null;
function setupPip() {
  document.getElementById("pip-fullscreen-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    toggleFullscreen();
  });
  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  var osd = document.createElement("div");
  osd.id = "fs-osd";
  osd.innerHTML = "\n        <div id=\"fs-osd-top\">\n            <div id=\"fs-osd-channel\"></div>\n            <div id=\"fs-osd-top-right\">\n                <span id=\"fs-osd-quality\" hidden></span>\n                <span id=\"fs-osd-ch-num\" hidden></span>\n            </div>\n        </div>\n        <div id=\"fs-osd-bottom\">\n            <div id=\"fs-osd-epg-row\">\n                <span class=\"fs-osd-badge now\">NOW</span>\n                <span id=\"fs-osd-now-title\"></span>\n                <span id=\"fs-osd-now-time\"></span>\n            </div>\n            <div id=\"fs-osd-epg-row2\">\n                <span class=\"fs-osd-badge next\">NEXT</span>\n                <span id=\"fs-osd-next-title\"></span>\n                <span id=\"fs-osd-next-time\"></span>\n            </div>\n            <div id=\"fs-osd-bar-wrap\"><div id=\"fs-osd-bar-fill\"></div></div>\n        </div>";
  document.getElementById("pip-wrap").appendChild(osd);
}
function toggleFullscreen() {
  var pip = document.getElementById("pip-wrap");
  var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (!isFs) {
    var req = pip.requestFullscreen || pip.webkitRequestFullscreen;
    if (req) req.call(pip);
  } else {
    var ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (ex) ex.call(document);
  }
}
function onFullscreenChange() {
  var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  document.getElementById("pip-fullscreen-btn").title = isFs ? "Exit fullscreen" : "Fullscreen";
  document.getElementById("pip-wrap").classList.toggle("pip-fullscreen-active", isFs);
  if (isFs) {
    if (currentChannel) showOSD();
  } else {
    setTVZone("channel-list");
  }
}
function showOSD() {
  var _currentChannel;
  var osd = document.getElementById("fs-osd");
  if (!osd) return;
  document.getElementById("fs-osd-channel").textContent = ((_currentChannel = currentChannel) === null || _currentChannel === void 0 ? void 0 : _currentChannel.name) || "";

  // ── Channel number badge ──────────────────────────────────────────────────
  var chNumEl = document.getElementById("fs-osd-ch-num");
  if (chNumEl) {
    var chIdx = currentChannel ? _vsChannels.findIndex(function (ch) {
      return String(ch.stream_id) === String(currentChannel.stream_id);
    }) : -1;
    if (chIdx >= 0) {
      chNumEl.textContent = "CH " + (chIdx + 1);
      chNumEl.removeAttribute("hidden");
    } else {
      chNumEl.setAttribute("hidden", "");
    }
  }

  // ── Stream quality badge ──────────────────────────────────────────────────
  var qualEl = document.getElementById("fs-osd-quality");
  if (qualEl) {
    var _player$video, _player$video2;
    var w = ((_player$video = player.video) === null || _player$video === void 0 ? void 0 : _player$video.videoWidth) || 0;
    var h = ((_player$video2 = player.video) === null || _player$video2 === void 0 ? void 0 : _player$video2.videoHeight) || 0;
    if (w > 0 && h > 0) {
      var cls = "";
      if (w >= 3840 || h >= 2160) cls = "quality-4k";else if (w >= 1920 || h >= 1080) cls = "quality-fhd";else if (w >= 1280 || h >= 720) cls = "quality-hd";
      qualEl.textContent = w + "×" + h;
      qualEl.className = cls;
      qualEl.removeAttribute("hidden");
    } else {
      qualEl.setAttribute("hidden", "");
    }
  }

  // ── EPG data ──────────────────────────────────────────────────────────────
  var listings = currentChannel ? epgCache[currentChannel.stream_id] : null;
  var nowTitle = "",
    nowTime = "",
    nextTitle = "",
    nextTime = "",
    progress = 0;
  if (listings && listings.length) {
    var now = Date.now();
    var idx = listings.findIndex(function (e) {
      var s = parseEpgTime(e.start),
        n = parseEpgTime(e.end);
      return now >= s && now < n;
    });
    var cur = listings[idx >= 0 ? idx : 0];
    var next = listings[idx >= 0 ? idx + 1 : 1];
    if (cur) {
      nowTitle = xtreamDecodeEPG(cur.title);
      nowTime = formatTimeRange(cur.start, cur.end);
      progress = calcProgress(cur.start, cur.end);
    }
    if (next) {
      nextTitle = xtreamDecodeEPG(next.title);
      nextTime = formatTimeRange(next.start, next.end);
    }
  }
  document.getElementById("fs-osd-now-title").textContent = nowTitle || "—";
  document.getElementById("fs-osd-now-time").textContent = nowTime || "";
  document.getElementById("fs-osd-next-title").textContent = nextTitle || "—";
  document.getElementById("fs-osd-next-time").textContent = nextTime || "";
  document.getElementById("fs-osd-bar-fill").style.width = progress + "%";
  osd.classList.remove("osd-hidden");
  osd.classList.add("osd-visible");
  clearTimeout(_osdTimer);
  _osdTimer = setTimeout(function () {
    osd.classList.remove("osd-visible");
    osd.classList.add("osd-hidden");
  }, 5000);
}

// ── Categories / sidebar ──────────────────────────────────────────────────────

function renderCategories(categories) {
  var container = document.getElementById("categories");
  container.innerHTML = "";
  var favSection = document.createElement("div");
  favSection.className = "cat-section";
  favSection.id = "cat-section-favs";
  var favHdr = document.createElement("button");
  favHdr.className = "cat-section-hdr fav-section-hdr";
  favHdr.id = "fav-section-hdr";
  favHdr.innerHTML = "<span class=\"section-star\">\u2605</span><span class=\"section-label\">Favourites</span><span class=\"section-chevron\">\u25BE</span>";
  favHdr.onclick = function () {
    var isOpen = favSection.classList.toggle("open");
    if (isOpen) {
      activeCategory = "favs";
      activeFavGroup = "all";
      updateSidebarActive();
      applyFilters();
    }
  };
  var favList = document.createElement("div");
  favList.className = "cat-section-list";
  favList.id = "fav-section-list";
  favSection.appendChild(favHdr);
  favSection.appendChild(favList);
  container.appendChild(favSection);
  var allBtn = document.createElement("button");
  allBtn.className = "cat-btn";
  allBtn.dataset.catId = "all";
  allBtn.textContent = "All";
  allBtn.onclick = function () {
    activeCategory = "all";
    activeFavGroup = "all";
    updateSidebarActive();
    applyFilters();
  };
  container.appendChild(allBtn);
  var visibleCats = categories.filter(function (cat) {
    return !_hiddenCatsLive.has(String(cat.category_id));
  });
  if (visibleCats.length) {
    var catSection = document.createElement("div");
    catSection.className = "cat-section";
    catSection.id = "cat-section-cats";
    var catHdr = document.createElement("button");
    catHdr.className = "cat-section-hdr";
    catHdr.innerHTML = "<span class=\"section-label\">Categories</span><span class=\"section-chevron\">\u25BE</span>";
    catHdr.onclick = function () {
      return catSection.classList.toggle("open");
    };
    var catList = document.createElement("div");
    catList.className = "cat-section-list";
    var frag = document.createDocumentFragment();
    visibleCats.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.className = "cat-btn cat-sub-btn";
      btn.dataset.catId = cat.category_id;
      btn.textContent = cat.category_name;
      btn.onclick = function () {
        activeCategory = String(cat.category_id);
        activeFavGroup = "all";
        catSection.classList.add("open");
        updateSidebarActive();
        applyFilters();
      };
      frag.appendChild(btn);
    });
    catList.appendChild(frag);
    catSection.appendChild(catHdr);
    catSection.appendChild(catList);
    container.appendChild(catSection);
  }
  renderFavSectionList();
}
function updateSidebarActive() {
  document.querySelectorAll(".cat-btn, .cat-sub-btn, .cat-section-hdr").forEach(function (b) {
    return b.classList.remove("active");
  });
  if (activeCategory === "favs") {
    var hdr = document.getElementById("fav-section-hdr");
    if (hdr) hdr.classList.add("active");
    document.querySelectorAll("[data-fav-group]").forEach(function (btn) {
      return btn.classList.toggle("active", btn.dataset.favGroup === activeFavGroup);
    });
  } else if (activeCategory === "all") {
    var _document$querySelect;
    (_document$querySelect = document.querySelector(".cat-btn[data-cat-id='all']")) === null || _document$querySelect === void 0 || _document$querySelect.classList.add("active");
  } else {
    var _document$getElementB;
    document.querySelectorAll(".cat-sub-btn[data-cat-id]").forEach(function (btn) {
      return btn.classList.toggle("active", btn.dataset.catId === String(activeCategory));
    });
    (_document$getElementB = document.getElementById("cat-section-cats")) === null || _document$getElementB === void 0 || _document$getElementB.classList.add("open");
  }
}
function renderFavSectionList() {
  var list = document.getElementById("fav-section-list");
  if (!list) return;
  list.innerHTML = "";
  var mkItem = function mkItem(text, groupId) {
    var btn = document.createElement("button");
    var isActive = activeCategory === "favs" && activeFavGroup === groupId;
    btn.className = "cat-sub-btn" + (isActive ? " active" : "");
    btn.dataset.favGroup = groupId;
    btn.textContent = text;
    btn.onclick = function () {
      var _document$getElementB2;
      activeCategory = "favs";
      activeFavGroup = groupId;
      (_document$getElementB2 = document.getElementById("cat-section-favs")) === null || _document$getElementB2 === void 0 || _document$getElementB2.classList.add("open");
      updateSidebarActive();
      applyFilters();
    };
    list.appendChild(btn);
    return btn;
  };
  mkItem("All", "all");
  favGroups.forEach(function (g) {
    var btn = mkItem(g.name, g.id);
    btn.ondblclick = function (e) {
      e.stopPropagation();
      promptRenameGroup(g.id, g.name);
    };
    btn.oncontextmenu = function (e) {
      e.preventDefault();
      showGroupContextMenu(e, g.id);
    };
  });
  var addBtn = document.createElement("button");
  addBtn.className = "cat-add-grp-btn";
  addBtn.textContent = "+ New Group";
  addBtn.onclick = function () {
    return promptNewGroup();
  };
  list.appendChild(addBtn);
}

// ── Group context menu ────────────────────────────────────────────────────────

function promptNewGroup() {
  showInputModal("New Favourite Group", "Group name", "", function (name) {
    if (!name) return;
    createFavGroup(name);
    renderFavSectionList();
  });
}
function promptRenameGroup(id, currentName) {
  showInputModal("Rename Group", "Group name", currentName, function (name) {
    if (!name) return;
    renameFavGroup(id, name);
    renderFavSectionList();
  });
}
function showGroupContextMenu(e, gid) {
  closeContextMenus();
  var menu = document.createElement("div");
  menu.className = "ctx-menu";
  menu.style.cssText = "left:".concat(e.clientX, "px;top:").concat(e.clientY, "px");
  var mkItem = function mkItem(text, danger, fn) {
    var item = document.createElement("div");
    item.className = "ctx-item" + (danger ? " ctx-danger" : "");
    item.textContent = text;
    item.onclick = function () {
      closeContextMenus();
      fn();
    };
    menu.appendChild(item);
  };
  mkItem("Rename", false, function () {
    var g = favGroups.find(function (x) {
      return x.id === gid;
    });
    if (g) promptRenameGroup(gid, g.name);
  });
  mkItem("Delete Group", true, function () {
    if (confirm("Delete this group? Channels stay in Favourites.")) {
      deleteFavGroup(gid);
      renderFavSectionList();
      applyFilters();
    }
  });
  document.body.appendChild(menu);
  _ctxMenuIndex = 0;
  var items = Array.from(menu.querySelectorAll(".ctx-item"));
  _focusCtxItem(menu, items);
  setTimeout(function () {
    return document.addEventListener("click", closeContextMenus, {
      once: true
    });
  }, 0);
}
function closeContextMenus() {
  document.querySelectorAll(".ctx-menu").forEach(function (m) {
    return m.remove();
  });
}

// ── Assign panel ──────────────────────────────────────────────────────────────

function showAssignPanel(e, sid, anchorEl) {
  e.stopPropagation();
  closeAssignPanels();
  if (!favGroups.length) {
    promptNewGroup();
    return;
  }
  history.pushState(null, "");
  _assignHistoryPushed = true;
  var panel = document.createElement("div");
  panel.className = "assign-panel";
  var title = document.createElement("div");
  title.className = "assign-title";
  title.textContent = "Add to group";
  panel.appendChild(title);
  favGroups.forEach(function (g) {
    var row = document.createElement("label");
    row.className = "assign-row";
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = isInGroup(g.id, sid);
    cb.onchange = function () {
      toggleChannelInGroup(g.id, sid);
      updateAssignBtnState(sid);
    };
    var span = document.createElement("span");
    span.textContent = g.name;
    row.appendChild(cb);
    row.appendChild(span);
    panel.appendChild(row);
  });
  var newBtn = document.createElement("button");
  newBtn.className = "assign-new-btn";
  newBtn.textContent = "+ New Group";
  newBtn.onclick = function () {
    closeAssignPanels(true);
    promptNewGroup();
  };
  panel.appendChild(newBtn);
  var rect = anchorEl.getBoundingClientRect();
  panel.style.cssText = "position:fixed;right:".concat(window.innerWidth - rect.right, "px;top:").concat(rect.bottom + 4, "px");
  document.body.appendChild(panel);
  _assignPanelIndex = 0;
  var items = Array.from(panel.querySelectorAll(".assign-row, .assign-new-btn"));
  _focusAssignItem(panel, items);
}
var _assignHistoryPushed = false;
function closeAssignPanels() {
  var popHistory = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  document.querySelectorAll(".assign-panel").forEach(function (p) {
    return p.remove();
  });
  if (popHistory && _assignHistoryPushed) {
    _assignHistoryPushed = false;
    history.back();
  } else {
    _assignHistoryPushed = false;
  }
}
function updateAssignBtnState(sid) {
  var entry = rowCache.get(String(sid));
  if (!(entry !== null && entry !== void 0 && entry.assignBtn)) return;
  entry.assignBtn.classList.toggle("active", favGroups.some(function (g) {
    return g.channelIds.includes(String(sid));
  }));
}

// ── Input modal ───────────────────────────────────────────────────────────────

function showInputModal(heading, label, value, callback) {
  var overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  var box = document.createElement("div");
  box.className = "modal-box";
  var h = document.createElement("div");
  h.className = "modal-heading";
  h.textContent = heading;
  var inp = document.createElement("input");
  inp.className = "modal-input";
  inp.type = "text";
  inp.value = value;
  inp.placeholder = label;
  var btns = document.createElement("div");
  btns.className = "modal-btns";
  var cancel = document.createElement("button");
  cancel.className = "modal-btn";
  cancel.textContent = "Cancel";
  cancel.onclick = function () {
    return overlay.remove();
  };
  var ok = document.createElement("button");
  ok.className = "modal-btn modal-btn-ok";
  ok.textContent = "OK";
  ok.onclick = function () {
    overlay.remove();
    callback(inp.value.trim());
  };
  inp.onkeydown = function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      ok.click();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      overlay.remove();
    }
  };
  btns.appendChild(cancel);
  btns.appendChild(ok);
  box.appendChild(h);
  box.appendChild(inp);
  box.appendChild(btns);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  setTimeout(function () {
    inp.focus();
    inp.select();
  }, 50);
}

// ── Filtering ─────────────────────────────────────────────────────────────────

function getFilteredChannels() {
  var q = document.getElementById("search").value.toLowerCase();
  var list;
  if (activeCategory === "favs") {
    var byId = new Map(allChannels.map(function (ch) {
      return [String(ch.stream_id), ch];
    }));
    var favList = favourites.map(function (id) {
      return byId.get(id);
    }).filter(Boolean);
    if (activeFavGroup !== "all") {
      var g = favGroups.find(function (x) {
        return x.id === activeFavGroup;
      });
      var ids = g ? g.channelIds : [];
      favList = favList.filter(function (ch) {
        return ids.includes(String(ch.stream_id));
      });
    }
    list = favList;
  } else if (activeCategory === "all") {
    list = _hiddenCatsLive.size ? allChannels.filter(function (ch) {
      return !_hiddenCatsLive.has(String(ch.category_id));
    }) : allChannels;
  } else {
    list = allChannels.filter(function (ch) {
      return String(ch.category_id) === String(activeCategory);
    });
  }
  return q ? list.filter(function (ch) {
    return (ch.name || "").toLowerCase().includes(q);
  }) : list;
}
var _applyTimer = null;
function applyFilters(immediate) {
  clearTimeout(_applyTimer);
  if (immediate) {
    _doApply();
    return;
  }
  _applyTimer = setTimeout(_doApply, 80);
}
function _doApply() {
  var channels = getFilteredChannels();
  var container = document.getElementById("channel-list");
  if (!channels.length) {
    container.style.height = "auto";
    container.style.position = "static";
    var isFavView = activeCategory === "favs";
    container.innerHTML = "<div class=\"no-results\">".concat(isFavView ? activeFavGroup !== "all" ? "No channels in this group — assign channels using the + button" : "No favourites yet — click ★ on any channel" : "No channels found", "</div>");
    renderTimelineHeader();
    return;
  }
  renderTimelineHeader();
  _vsSetChannels(channels, _keepScrollOnApply);
  _keepScrollOnApply = false;
  loadEPGForCurrentCategory();
}
function setupSearch() {
  document.getElementById("search").addEventListener("input", function () {
    return applyFilters();
  }, {
    passive: true
  });
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function getTimelineStart() {
  var now = new Date();
  var rounded = Math.floor((now.getHours() * 60 + now.getMinutes()) / 30) * 30;
  var d = new Date(now);
  d.setHours(0, rounded + timelineOffset, 0, 0);
  return d;
}
function getTimelineEnd() {
  return new Date(getTimelineStart().getTime() + TIMELINE_HOURS * 3600000);
}
function setupTimelineNav() {
  document.getElementById("tl-prev").addEventListener("click", function () {
    timelineOffset -= 60;
    refreshTimeline();
  });
  document.getElementById("tl-next").addEventListener("click", function () {
    timelineOffset += 60;
    refreshTimeline();
  });
  document.getElementById("tl-now").addEventListener("click", function () {
    timelineOffset = 0;
    refreshTimeline();
  });
}
function refreshTimeline() {
  renderTimelineHeader();
  getFilteredChannels().forEach(function (ch) {
    return patchEpgStrip(ch.stream_id);
  });
}
function renderTimelineHeader() {
  var header = document.getElementById("tl-time-header");
  var start = getTimelineStart();
  var frag = document.createDocumentFragment();
  for (var i = 0; i < TIMELINE_HOURS * 2; i++) {
    var t = new Date(start.getTime() + i * 30 * 60000);
    var d = document.createElement("div");
    d.className = "tl-header-slot";
    d.textContent = t.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    frag.appendChild(d);
  }
  header.innerHTML = "";
  header.appendChild(frag);
  var tlS = getTimelineStart().getTime(),
    tlE = getTimelineEnd().getTime();
  var pct = (Date.now() - tlS) / (tlE - tlS) * 100;
  var line = document.getElementById("tl-now-line");
  if (pct >= 0 && pct <= 100) {
    line.style.left = pct + "%";
    line.style.display = "block";
  } else line.style.display = "none";
}

// ── EPG strip rendering ───────────────────────────────────────────────────────

function patchEpgStrip(streamId) {
  var entry = rowCache.get(String(streamId));
  if (entry) buildEpgStrip(entry.epgStrip, String(streamId));
}
function buildEpgStrip(strip, sid) {
  var listings = epgCache[sid];
  var tlStart = getTimelineStart().getTime();
  var tlEnd = getTimelineEnd().getTime();
  var tlDur = tlEnd - tlStart;
  if (listings === undefined || listings === null) {
    if (strip.dataset.state === "loading") return;
    strip.innerHTML = "";
    strip.dataset.state = "loading";
    var ph = document.createElement("div");
    ph.className = "tl-epg-block tl-loading";
    ph.style.cssText = "left:0%;width:calc(100% - 2px)";
    ph.textContent = "Loading…";
    strip.appendChild(ph);
    return;
  }
  if (!listings.length) {
    if (strip.dataset.state === "empty") return;
    strip.innerHTML = "";
    strip.dataset.state = "empty";
    var _ph = document.createElement("div");
    _ph.className = "tl-epg-block tl-no-epg";
    _ph.style.cssText = "left:0%;width:calc(100% - 2px)";
    _ph.textContent = "No EPG";
    strip.appendChild(_ph);
    return;
  }

  // Skip re-render if already built for this timeline window
  if (strip.dataset.state === "filled" && strip.dataset.tlStart === String(tlStart)) return;
  strip.dataset.state = "filled";
  strip.dataset.tlStart = String(tlStart);
  strip.innerHTML = "";
  var now = Date.now();
  var frag = document.createDocumentFragment();
  listings.forEach(function (e) {
    var eStart = parseEpgTime(e.start),
      eEnd = parseEpgTime(e.end);
    if (eEnd <= tlStart || eStart >= tlEnd) return;
    var cs = Math.max(eStart, tlStart),
      ce = Math.min(eEnd, tlEnd);
    var left = (cs - tlStart) / tlDur * 100;
    var width = (ce - cs) / tlDur * 100;
    var isNow = now >= eStart && now < eEnd;
    var isPast = eEnd < now;
    var block = document.createElement("div");
    block.className = "tl-epg-block" + (isNow ? " tl-now" : "") + (isPast ? " tl-past" : "");
    block.style.left = left + "%";
    block.style.width = "calc(".concat(width, "% - 2px)");
    var timeSpan = document.createElement("span");
    timeSpan.className = "tl-block-time";
    timeSpan.textContent = "".concat(fmtTime(eStart), "\u2013").concat(fmtTime(eEnd));
    var titleSpan = document.createElement("span");
    titleSpan.className = "tl-block-title";
    titleSpan.textContent = xtreamDecodeEPG(e.title);
    block.appendChild(timeSpan);
    block.appendChild(titleSpan);
    if (isNow) {
      var fill = document.createElement("div");
      fill.className = "tl-progress-fill";
      fill.style.width = (now - eStart) / (eEnd - eStart) * 100 + "%";
      block.appendChild(fill);
    }
    block.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var cached = rowCache.get(sid);
      if (cached) {
        var ch = allChannels.find(function (c) {
          return String(c.stream_id) === sid;
        });
        if (ch) selectChannel(ch);
      }
    });
    frag.appendChild(block);
  });
  strip.appendChild(frag);
}

// ── Channel selection ─────────────────────────────────────────────────────────
function selectChannel(_x3) {
  return _selectChannel.apply(this, arguments);
}
function _selectChannel() {
  _selectChannel = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(ch) {
    var _listings;
    var _selSid, playUrl, listings, now, idx, cur, next, _t8, _t9;
    return _regenerator().w(function (_context6) {
      while (1) switch (_context6.p = _context6.n) {
        case 0:
          currentChannel = ch;
          _selSid = String(ch.stream_id);
          rowCache.forEach(function (entry, sid) {
            return entry.row.classList.toggle("selected", sid === _selSid);
          });
          document.getElementById("preview-channel-name").textContent = ch.name || "Unknown";
          document.getElementById("pip-channel-name").textContent = ch.name || "Unknown";
          playUrl = ch._source === "m3u" ? m3uBuildLiveURL(ch) : xtreamBuildLiveURL(cfg, ch.stream_id);
          player.play(playUrl);
          setEPG("now", "Loading…", "", "");
          setEPG("next", "—", "", "");
          document.getElementById("epg-bar-fill").style.width = "0%";
          showPreviewInfo();
          showOSD(); // immediate banner on channel switch — EPG data populated below
          listings = epgCache[ch.stream_id];
          if (!(!listings && !epgBlocked)) {
            _context6.n = 8;
            break;
          }
          epgCache[ch.stream_id] = null;
          _context6.p = 1;
          if (!(ch._source === "m3u")) {
            _context6.n = 3;
            break;
          }
          _context6.n = 2;
          return m3uGetEPG(ch.stream_id);
        case 2:
          _t8 = _context6.v;
          _context6.n = 5;
          break;
        case 3:
          _context6.n = 4;
          return xtreamGetEPG(cfg, ch.stream_id);
        case 4:
          _t8 = _context6.v;
        case 5:
          listings = _t8;
          _context6.n = 7;
          break;
        case 6:
          _context6.p = 6;
          _t9 = _context6.v;
          if (_t9 && _t9.message && _t9.message.indexOf("403") !== -1) epgBlocked = true;
          listings = [];
        case 7:
          epgCache[ch.stream_id] = listings;
          patchEpgStrip(ch.stream_id);
          scheduleEpgSave();
        case 8:
          if ((_listings = listings) !== null && _listings !== void 0 && _listings.length) {
            _context6.n = 9;
            break;
          }
          setEPG("now", "No EPG data", "", "");
          showOSD();
          return _context6.a(2);
        case 9:
          now = Date.now();
          idx = listings.findIndex(function (e) {
            var s = parseEpgTime(e.start),
              n = parseEpgTime(e.end);
            return now >= s && now < n;
          });
          cur = listings[idx >= 0 ? idx : 0];
          next = listings[idx >= 0 ? idx + 1 : 1];
          setEPG("now", xtreamDecodeEPG(cur.title), formatTimeRange(cur.start, cur.end), xtreamDecodeEPG(cur.description));
          document.getElementById("epg-bar-fill").style.width = calcProgress(cur.start, cur.end) + "%";
          if (next) setEPG("next", xtreamDecodeEPG(next.title), formatTimeRange(next.start, next.end), "");
          showOSD();
        case 10:
          return _context6.a(2);
      }
    }, _callee6, null, [[1, 6]]);
  }));
  return _selectChannel.apply(this, arguments);
}
function updateOSDIfFullscreen() {
  if (!!(document.fullscreenElement || document.webkitFullscreenElement)) showOSD();
}
function setEPG(slot, title, time, desc) {
  document.getElementById("epg-".concat(slot, "-title")).textContent = title || "—";
  document.getElementById("epg-".concat(slot, "-time")).textContent = time || "";
  var el = document.getElementById("epg-".concat(slot, "-desc"));
  if (el) el.textContent = desc || "";
}
function showPreviewInfo() {
  var _document$getElementB3;
  (_document$getElementB3 = document.getElementById("preview-info")) === null || _document$getElementB3 === void 0 || _document$getElementB3.classList.add("preview-visible");
}
function channelStep(delta) {
  if (!_vsChannels.length) return;
  var idx = currentChannel ? _vsChannels.findIndex(function (ch) {
    return String(ch.stream_id) === String(currentChannel.stream_id);
  }) : -1;
  if (idx < 0) idx = delta > 0 ? -1 : _vsChannels.length;
  idx = Math.max(0, Math.min(_vsChannels.length - 1, idx + delta));
  tvRowIndex = idx;
  var ch = _vsChannels[idx];
  if (ch) {
    selectChannel(ch);
    tvFocusRow(idx);
  }
}

// ── EPG time helpers ──────────────────────────────────────────────────────────

var _epgTimeCache = Object.create(null);
function parseEpgTime(s) {
  if (!s) return 0;
  if (_epgTimeCache[s] !== undefined) return _epgTimeCache[s];
  return _epgTimeCache[s] = new Date(s.replace(" ", "T") + "Z").getTime();
}
function fmtTime(ms) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatTimeRange(start, end) {
  var a = fmtTime(parseEpgTime(start)),
    b = fmtTime(parseEpgTime(end));
  return a && b ? "".concat(a, " \u2013 ").concat(b) : a || "";
}
function calcProgress(start, end) {
  try {
    var s = parseEpgTime(start),
      e = parseEpgTime(end),
      now = Date.now();
    if (now < s || now > e) return 0;
    return Math.round((now - s) / (e - s) * 100);
  } catch (_unused0) {
    return 0;
  }
}

// ── XMLTV / custom EPG ────────────────────────────────────────────────────────

var xmltvCache = {};
function loadCustomXMLTV(_x4, _x5) {
  return _loadCustomXMLTV.apply(this, arguments);
}
function _loadCustomXMLTV() {
  _loadCustomXMLTV = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(url, matchField) {
    var res, text, parser, doc, channelMap, parsed, count, _t0;
    return _regenerator().w(function (_context7) {
      while (1) switch (_context7.p = _context7.n) {
        case 0:
          _context7.p = 0;
          _context7.n = 1;
          return fetch(url);
        case 1:
          res = _context7.v;
          if (res.ok) {
            _context7.n = 2;
            break;
          }
          throw new Error("HTTP " + res.status);
        case 2:
          _context7.n = 3;
          return res.text();
        case 3:
          text = _context7.v;
          parser = new DOMParser();
          doc = parser.parseFromString(text, "application/xml");
          if (!doc.querySelector("parseerror")) {
            _context7.n = 4;
            break;
          }
          throw new Error("Invalid XMLTV XML");
        case 4:
          channelMap = {};
          doc.querySelectorAll("channel").forEach(function (ch) {
            var _ch$querySelector;
            var id = ch.getAttribute("id") || "";
            var name = ((_ch$querySelector = ch.querySelector("display-name")) === null || _ch$querySelector === void 0 || (_ch$querySelector = _ch$querySelector.textContent) === null || _ch$querySelector === void 0 ? void 0 : _ch$querySelector.trim()) || id;
            channelMap[id] = name;
          });
          parsed = {};
          doc.querySelectorAll("programme").forEach(function (prog) {
            var _prog$querySelector, _prog$querySelector2;
            var chId = prog.getAttribute("channel") || "";
            var start = parseXMLTVDate(prog.getAttribute("start"));
            var stop = parseXMLTVDate(prog.getAttribute("stop"));
            var title = ((_prog$querySelector = prog.querySelector("title")) === null || _prog$querySelector === void 0 || (_prog$querySelector = _prog$querySelector.textContent) === null || _prog$querySelector === void 0 ? void 0 : _prog$querySelector.trim()) || "";
            var desc = ((_prog$querySelector2 = prog.querySelector("desc")) === null || _prog$querySelector2 === void 0 || (_prog$querySelector2 = _prog$querySelector2.textContent) === null || _prog$querySelector2 === void 0 ? void 0 : _prog$querySelector2.trim()) || "";
            if (!start || !stop) return;
            if (!parsed[chId]) parsed[chId] = [];
            parsed[chId].push({
              title: title,
              desc: desc,
              start: toEpgTimeStr(start),
              end: toEpgTimeStr(stop)
            });
          });
          xmltvCache = {
            programmes: parsed,
            channelMap: channelMap,
            matchField: matchField
          };
          try {
            localStorage.setItem("iptv_xmltv_cache", JSON.stringify({
              ts: Date.now(),
              data: xmltvCache
            }));
          } catch (_unused10) {}
          count = Object.keys(parsed).length;
          setSettingsStatus("epg-load-status", "\u2713 Loaded ".concat(count, " channels from XMLTV."), "ok");
          mergeXMLTVIntoEpgCache();
          refreshTimeline();
          _context7.n = 6;
          break;
        case 5:
          _context7.p = 5;
          _t0 = _context7.v;
          setSettingsStatus("epg-load-status", "Error: " + _t0.message, "err");
        case 6:
          return _context7.a(2);
      }
    }, _callee7, null, [[0, 5]]);
  }));
  return _loadCustomXMLTV.apply(this, arguments);
}
function parseXMLTVDate(str) {
  if (!str) return null;
  var m = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/);
  if (!m) return null;
  var _m = _slicedToArray(m, 8),
    yr = _m[1],
    mo = _m[2],
    dy = _m[3],
    hh = _m[4],
    mm = _m[5],
    ss = _m[6],
    tz = _m[7];
  var tzStr = tz ? tz.slice(0, 3) + ":" + tz.slice(3) : "+00:00";
  return new Date("".concat(yr, "-").concat(mo, "-").concat(dy, "T").concat(hh, ":").concat(mm, ":").concat(ss).concat(tzStr)).getTime();
}
function toEpgTimeStr(ms) {
  return new Date(ms).toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}
function loadXMLTVFromCache() {
  try {
    var raw = localStorage.getItem("iptv_xmltv_cache");
    if (!raw) return;
    var _JSON$parse4 = JSON.parse(raw),
      ts = _JSON$parse4.ts,
      data = _JSON$parse4.data;
    if (Date.now() - ts > 24 * 60 * 60 * 1000) return;
    xmltvCache = data;
  } catch (_unused1) {}
}
function mergeXMLTVIntoEpgCache() {
  if (!xmltvCache.programmes) return;
  var matchField = xmltvCache.matchField || "tvg-id";

  // Build reverse name→xmlId map once instead of iterating per channel
  var nameToXmlId = {};
  for (var _i2 = 0, _Object$entries2 = Object.entries(xmltvCache.channelMap || {}); _i2 < _Object$entries2.length; _i2++) {
    var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2),
      xmlId = _Object$entries2$_i[0],
      name = _Object$entries2$_i[1];
    nameToXmlId[name.toLowerCase()] = xmlId;
  }
  allChannels.forEach(function (ch) {
    var sid = String(ch.stream_id);
    var listings = null;
    if (matchField === "tvg-id") {
      var epgId = ch.epg_channel_id || "";
      listings = xmltvCache.programmes[epgId] || null;
      if (!listings) {
        var _xmlId = nameToXmlId[(ch.name || "").toLowerCase()];
        if (_xmlId) listings = xmltvCache.programmes[_xmlId] || null;
      }
    } else {
      var _xmlId2 = nameToXmlId[(ch.name || "").toLowerCase()];
      if (_xmlId2) listings = xmltvCache.programmes[_xmlId2] || null;
    }
    if (listings) epgCache[sid] = listings;
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

window.onload = function () {
  // ── Load active profile into IPTV_CONFIG ──────────────────────────────────
  // Prefer the profiles system; fall back to legacy iptv_custom_config.
  (function loadActiveProfile() {
    try {
      var profiles = load("iptv_profiles", null);
      if (profiles && profiles.length) {
        var activeId = load("iptv_active_profile", null);
        var profile = activeId && profiles.find(function (p) {
          return p.id === activeId;
        }) || profiles[0];
        if (profile) {
          var resolvedUrl = load("iptv_active_resolved_url", null);
          var urls = Array.isArray(profile.server_urls) ? profile.server_urls : [];
          window.IPTV_CONFIG = {
            server_url: resolvedUrl || urls[0] || "",
            server_urls: urls,
            username: profile.username || "",
            password: profile.password || ""
          };
          return;
        }
      }
      // Legacy fallback
      var savedCfg = load("iptv_custom_config", null);
      if (savedCfg && savedCfg.server_url) window.IPTV_CONFIG = savedCfg;
    } catch (_) {}
  })();
  loadXMLTVFromCache();
  initVirtualScroll();
  initTVNavigation();
  initApp();
  if (load("iptv_custom_epg_url", "")) {
    setTimeout(function () {
      return mergeXMLTVIntoEpgCache();
    }, 2000);
  }
};