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
/* livetv/epg.js — the programme guide: fetching, caching, the timeline window,
 * and the coloured strips drawn on each channel row.
 *
 * Three sources feed one cache, keyed by stream id:
 *   • Xtream get_short_epg   — per channel, batched, and abandoned entirely on
 *                              the first 403 (the panel has EPG switched off
 *                              for this account, so every further request is a
 *                              wasted round trip)
 *   • M3U                    — no server-side guide at all; returns empty
 *   • XMLTV                  — a user-supplied file, merged over the top
 *
 * Times are the fiddly part: Xtream returns BOTH Unix timestamps and localised
 * strings, and only the timestamps are unambiguous. epgStart/epgEnd prefer
 * them and fall back to parsing the strings as UTC.
 *
 * Requires: livetv/state.js.
 */

// ── EPG disk cache ────────────────────────────────────────────────────────────

/* Namespaced per profile. The cache is keyed internally by stream_id, and
   Xtream stream ids are small integers starting near 1 — so two providers
   collide on almost every id. With one global key, switching profiles left the
   previous provider's guide in place and drew its programme titles and times
   against the new provider's channels for the whole 30-minute TTL. */
var EPG_CACHE_BASE = "iptv_epg_v2";
var EPG_CACHE_LEGACY = EPG_CACHE_BASE; // the old unscoped key
var EPG_TTL_MS = 30 * 60 * 1000;
function epgCacheKey() {
  var scope = "none";
  try {
    scope = Config.scope();
  } catch (e) {}
  return EPG_CACHE_BASE + ":" + scope;
}
function loadEpgDiskCache() {
  /* The unscoped key can only hold another profile's data now, and it is one
     of the largest things in a store with a ~5 MB ceiling. Drop it once. */
  Store.remove(EPG_CACHE_LEGACY);
  return Store.cacheGet(epgCacheKey(), EPG_TTL_MS) || {};
}

// Writing is debounced because the guide arrives in batches of four channels
// and each batch would otherwise serialise the entire cache again — on a large
// category that is hundreds of full re-serialisations during one scroll.
var _epgSaveTimer = null;
function scheduleEpgSave() {
  clearTimeout(_epgSaveTimer);
  _epgSaveTimer = setTimeout(function () {
    // `null` marks "request in flight" and must not be persisted — on the
    // next launch it would read as "already fetched, nothing found" and
    // that channel would show no guide until the cache expired.
    var toSave = {};
    for (var _i = 0, _Object$entries = Object.entries(epgCache); _i < _Object$entries.length; _i++) {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        k = _Object$entries$_i[0],
        v = _Object$entries$_i[1];
      if (Array.isArray(v)) toSave[k] = v;
    }
    Store.cacheSet(epgCacheKey(), toSave);
  }, 2000);
}

// ── EPG loading ───────────────────────────────────────────────────────────────

/* `null` in epgCache means "request in flight". Every path out of the loader
   below has to hand those entries back, because the retry filter only picks up
   `undefined` — an entry left at `null` is never fetched again for the rest of
   the session, and buildEpgStrip draws it as a permanent "Loading…". Switching
   category mid-load is the ordinary way that happened. */
function releaseInFlightEpg(list) {
  for (var i = 0; i < list.length; i++) {
    var id = list[i].stream_id;
    if (epgCache[id] === null) delete epgCache[id];
  }
}
function loadEPGForCurrentCategory() {
  return _loadEPGForCurrentCategory.apply(this, arguments);
} // ── Timeline ──────────────────────────────────────────────────────────────────
function _loadEPGForCurrentCategory() {
  _loadEPGForCurrentCategory = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
    var myKey, needed, BATCH, i;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          if (!epgBlocked) {
            _context2.n = 1;
            break;
          }
          return _context2.a(2);
        case 1:
          myKey = ++epgLoadAbortKey;
          needed = getFilteredChannels().filter(function (ch) {
            return epgCache[ch.stream_id] === undefined;
          });
          if (needed.length) {
            _context2.n = 2;
            break;
          }
          return _context2.a(2);
        case 2:
          needed.forEach(function (ch) {
            epgCache[ch.stream_id] = null;
          });
          _context2.p = 3;
          BATCH = 4;
          i = 0;
        case 4:
          if (!(i < needed.length)) {
            _context2.n = 9;
            break;
          }
          if (!(epgLoadAbortKey !== myKey || epgBlocked)) {
            _context2.n = 5;
            break;
          }
          return _context2.a(2);
        case 5:
          _context2.n = 6;
          return Promise.all(needed.slice(i, i + BATCH).map(/*#__PURE__*/function () {
            var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ch) {
              var _t, _t2;
              return _regenerator().w(function (_context) {
                while (1) switch (_context.p = _context.n) {
                  case 0:
                    if (!epgBlocked) {
                      _context.n = 1;
                      break;
                    }
                    return _context.a(2);
                  case 1:
                    _context.p = 1;
                    if (!(ch._source === "m3u")) {
                      _context.n = 3;
                      break;
                    }
                    _context.n = 2;
                    return m3uGetEPG(ch.stream_id);
                  case 2:
                    _t = _context.v;
                    _context.n = 5;
                    break;
                  case 3:
                    _context.n = 4;
                    return xtreamGetEPG(cfg, ch.stream_id);
                  case 4:
                    _t = _context.v;
                  case 5:
                    epgCache[ch.stream_id] = _t;
                    _context.n = 7;
                    break;
                  case 6:
                    _context.p = 6;
                    _t2 = _context.v;
                    /* A 403 means this account has EPG switched off at the panel —
                       every remaining request would get the same answer, so stop
                       asking entirely rather than firing one per channel. Matched
                       on the status Net attaches, not on the digits "403" appearing
                       somewhere in a message. */
                    if (Net.isHttpError(_t2, 403) || Net.isHttpError(_t2, 401)) {
                      epgBlocked = true;
                    } else {
                      epgCache[ch.stream_id] = [];
                    }
                  case 7:
                    return _context.a(2);
                }
              }, _callee, null, [[1, 6]]);
            }));
            return function (_x3) {
              return _ref.apply(this, arguments);
            };
          }()));
        case 6:
          if (!(epgLoadAbortKey !== myKey || epgBlocked)) {
            _context2.n = 7;
            break;
          }
          return _context2.a(2);
        case 7:
          needed.slice(i, i + BATCH).forEach(function (ch) {
            return patchEpgStrip(ch.stream_id);
          });
        case 8:
          i += BATCH;
          _context2.n = 4;
          break;
        case 9:
          scheduleEpgSave();
        case 10:
          _context2.p = 10;
          /* Covers every exit: the two aborts above, an epgBlocked bail inside a
             batch, a throw, and the normal finish (where nothing is left null). */
          releaseInFlightEpg(needed);
          return _context2.f(10);
        case 11:
          return _context2.a(2);
      }
    }, _callee2, null, [[3,, 10, 11]]);
  }));
  return _loadEPGForCurrentCategory.apply(this, arguments);
}
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
    var eStart = epgStart(e),
      eEnd = epgEnd(e);
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

// ── EPG time helpers ──────────────────────────────────────────────────────────

/* Memoised because a full guide re-parses the same handful of strings per
   channel — but bounded, because the key is provider text: a 20 000-channel
   panel that returns no `start_timestamp` (the only case that reaches here)
   would otherwise leave a couple of hundred thousand entries in it for the
   session. Cleared wholesale rather than evicted one at a time; the parse is
   cheap and this only has to stop being unbounded. */
var EPG_TIME_CACHE_MAX = 20000;
var _epgTimeCache = Object.create(null);
var _epgTimeCacheN = 0;
function parseEpgTime(s) {
  if (!s) return 0;
  if (_epgTimeCache[s] !== undefined) return _epgTimeCache[s];
  if (++_epgTimeCacheN > EPG_TIME_CACHE_MAX) {
    _epgTimeCache = Object.create(null);
    _epgTimeCacheN = 1;
  }
  // The `start`/`end` strings are in the provider's timezone (unknown), so we
  // can't parse them reliably — used only as a fallback. Treated as UTC.
  return _epgTimeCache[s] = new Date(s.replace(" ", "T") + "Z").getTime();
}
// Prefer the Unix-epoch timestamps: they're absolute UTC and unambiguous, which
// avoids the constant timezone offset the localized strings caused.
function epgStart(e) {
  if (e && e.start_timestamp) return Number(e.start_timestamp) * 1000;
  return parseEpgTime(e && e.start);
}
function epgEnd(e) {
  var ts = e && (e.stop_timestamp || e.end_timestamp);
  if (ts) return Number(ts) * 1000;
  return parseEpgTime(e && e.end);
}
// Current programme + the one after it. Falls back to the first two listings
// when nothing matches "now" (e.g. all-future or stale EPG data).
function _findNowNext(listings) {
  var now = Date.now();
  var idx = listings.findIndex(function (e) {
    var s = epgStart(e),
      n = epgEnd(e);
    return now >= s && now < n;
  });
  return {
    cur: listings[idx >= 0 ? idx : 0],
    next: listings[idx >= 0 ? idx + 1 : 1]
  };
}
function fmtTime(ms) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatTimeRange(e) {
  var a = fmtTime(epgStart(e)),
    b = fmtTime(epgEnd(e));
  return a && b ? "".concat(a, " \u2013 ").concat(b) : a || "";
}
function calcProgress(e) {
  try {
    var s = epgStart(e),
      en = epgEnd(e),
      now = Date.now();
    if (now < s || now > en) return 0;
    return Math.round((now - s) / (en - s) * 100);
  } catch (_unused) {
    return 0;
  }
}

// ── XMLTV / custom EPG ────────────────────────────────────────────────────────

var xmltvCache = {};
function loadCustomXMLTV(_x, _x2) {
  return _loadCustomXMLTV.apply(this, arguments);
}
function _loadCustomXMLTV() {
  _loadCustomXMLTV = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(url, matchField) {
    var text, parser, doc, channelMap, parsed, count, _t3;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          _context3.p = 0;
          _context3.n = 1;
          return Net.text(url, {
            timeout: 60000
          });
        case 1:
          text = _context3.v;
          parser = new DOMParser();
          doc = parser.parseFromString(text, "application/xml");
          if (!doc.querySelector("parseerror")) {
            _context3.n = 2;
            break;
          }
          throw new Error("Invalid XMLTV XML");
        case 2:
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
          } catch (_unused3) {}
          count = Object.keys(parsed).length;
          setSettingsStatus("epg-load-status", "\u2713 Loaded ".concat(count, " channels from XMLTV."), "ok");
          mergeXMLTVIntoEpgCache();
          refreshTimeline();
          _context3.n = 4;
          break;
        case 3:
          _context3.p = 3;
          _t3 = _context3.v;
          setSettingsStatus("epg-load-status", "Error: " + _t3.message, "err");
        case 4:
          return _context3.a(2);
      }
    }, _callee3, null, [[0, 3]]);
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
    var _JSON$parse = JSON.parse(raw),
      ts = _JSON$parse.ts,
      data = _JSON$parse.data;
    if (Date.now() - ts > 24 * 60 * 60 * 1000) return;
    xmltvCache = data;
  } catch (_unused2) {}
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