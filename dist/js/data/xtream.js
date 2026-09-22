"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/* data/xtream.js — the Xtream Codes panel client.
 *
 * Thin by design: every call is one HTTP GET against player_api.php, and the
 * only real work is being tolerant of how much panels differ from each other.
 * URL construction and the profile itself live in core/config.js; HTTP and
 * timeouts live in core/net.js. This file is the vocabulary in between.
 *
 * The list-returning functions swallow errors and return [] on purpose: a
 * missing category list should degrade to "no categories", not blank the
 * screen. The two EPG functions are the exception — they rethrow HTTP errors so
 * callers can spot a 403 and stop hammering a panel that has switched EPG off.
 */

function _xtBase(cfg) {
  return Config.base(cfg);
}
function _xtApi(cfg, params) {
  return Config.apiUrl(cfg, params);
}
function xtreamLoadConfig() {
  if (window.IPTV_CONFIG) return Promise.resolve(window.IPTV_CONFIG);
  var cfg = Config.resolve();
  if (cfg && cfg.type !== 'm3u' && cfg.server_url) {
    window.IPTV_CONFIG = cfg;
    return Promise.resolve(cfg);
  }
  return Promise.reject(new Error('No Xtream profile configured'));
}

/* Try each candidate URL in turn until one answers. Returns { cfg, data } with
   cfg.server_url set to the URL that worked, or null when none did.
   Config.candidateUrls() supplies the http twin of every https entry — some
   panels present a certificate the TV browser rejects while plain http on the
   same host is fine. */
/* A panel that REJECTS the credentials still answers HTTP 200, with
   { user_info: { auth: 0 } } — and an expired or banned line answers
   { auth: 1, status: "Expired" }. Both are truthy, so accepting any JSON here
   meant a wrong password was recorded as a successful login against a
   "working" server; the failure then surfaced further down as "0 channels
   returned", which sends the user looking for the wrong problem entirely.
   settings.js already distinguishes these when saving a profile — this is the
   same test, applied on the path the app actually boots through. */
function _xtAuthProblem(result) {
  var info = result && result.user_info;
  if (!info) return null; // no user_info: not an auth reply, let it through
  if (Number(info.auth) !== 1) {
    return 'Login rejected — check the username and password.';
  }
  var status = String(info.status || '').toLowerCase();
  if (status && status !== 'active') {
    if (status === 'expired') return 'This subscription has expired.';
    if (status === 'banned') return 'This account has been banned by the provider.';
    if (status === 'disabled') return 'This account has been disabled by the provider.';
    return 'This account is not active (' + info.status + ').';
  }
  return null;
}
function xtreamLogin(_x) {
  return _xtreamLogin.apply(this, arguments);
}
function _xtreamLogin() {
  _xtreamLogin = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(cfg) {
    var urls, authProblem, _iterator, _step, url, probe, result, problem, _t, _t2;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          urls = Config.candidateUrls(cfg);
          /* Held rather than returned immediately: a later URL may authenticate fine
             (providers do run mismatched mirrors), so every candidate is still tried
             and the credential complaint is only reported if none of them worked. */
          authProblem = null;
          _iterator = _createForOfIteratorHelper(urls);
          _context.p = 1;
          _iterator.s();
        case 2:
          if ((_step = _iterator.n()).done) {
            _context.n = 9;
            break;
          }
          url = _step.value;
          _context.p = 3;
          probe = Object.assign({}, cfg, {
            server_url: url
          });
          _context.n = 4;
          return Net.json(_xtApi(probe, ''), {
            timeout: 12000
          });
        case 4:
          result = _context.v;
          if (result) {
            _context.n = 5;
            break;
          }
          return _context.a(3, 8);
        case 5:
          problem = _xtAuthProblem(result);
          if (!problem) {
            _context.n = 6;
            break;
          }
          authProblem = authProblem || problem;
          return _context.a(3, 8);
        case 6:
          /* Remember the winner so the next launch starts here instead of
             walking the list again. */
          Store.set(Config.KEY_RESOLVED, url);
          return _context.a(2, {
            cfg: probe,
            data: result
          });
        case 7:
          _context.p = 7;
          _t = _context.v;
        case 8:
          _context.n = 2;
          break;
        case 9:
          _context.n = 11;
          break;
        case 10:
          _context.p = 10;
          _t2 = _context.v;
          _iterator.e(_t2);
        case 11:
          _context.p = 11;
          _iterator.f();
          return _context.f(11);
        case 12:
          return _context.a(2, authProblem ? {
            authFailed: true,
            message: authProblem
          } : null);
      }
    }, _callee, null, [[3, 7], [1, 10, 11, 12]]);
  }));
  return _xtreamLogin.apply(this, arguments);
}
function xtreamGetLiveChannels(_x2) {
  return _xtreamGetLiveChannels.apply(this, arguments);
}
function _xtreamGetLiveChannels() {
  _xtreamGetLiveChannels = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(cfg) {
    var data, _t3;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          _context2.p = 0;
          _context2.n = 1;
          return Net.json(_xtApi(cfg, 'action=get_live_streams'), {
            timeout: 20000
          });
        case 1:
          data = _context2.v;
          return _context2.a(2, Array.isArray(data) ? data : data && data.data || []);
        case 2:
          _context2.p = 2;
          _t3 = _context2.v;
          return _context2.a(2, []);
      }
    }, _callee2, null, [[0, 2]]);
  }));
  return _xtreamGetLiveChannels.apply(this, arguments);
}
function xtreamGetCategories(_x3) {
  return _xtreamGetCategories.apply(this, arguments);
}
/* Short "now and next" guide for one channel. Rethrows HTTP errors — a 403
   here means the panel has EPG disabled for this account, and the caller stops
   asking rather than firing one doomed request per channel. */
function _xtreamGetCategories() {
  _xtreamGetCategories = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(cfg) {
    var data, _t4;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          _context3.p = 0;
          _context3.n = 1;
          return Net.json(_xtApi(cfg, 'action=get_live_categories'));
        case 1:
          data = _context3.v;
          return _context3.a(2, Array.isArray(data) ? data : []);
        case 2:
          _context3.p = 2;
          _t4 = _context3.v;
          return _context3.a(2, []);
      }
    }, _callee3, null, [[0, 2]]);
  }));
  return _xtreamGetCategories.apply(this, arguments);
}
function xtreamGetEPG(_x4, _x5) {
  return _xtreamGetEPG.apply(this, arguments);
}
/* EPG titles/descriptions are base64 of UTF-8. atob() alone yields one char per
   byte, which rendered every Greek title as "Î•Î»Î»..." — Charset decodes the
   bytes. */
function _xtreamGetEPG() {
  _xtreamGetEPG = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(cfg, streamId) {
    var data, _t5;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          _context4.p = 0;
          _context4.n = 1;
          return Net.json(_xtApi(cfg, 'action=get_short_epg&stream_id=' + encodeURIComponent(streamId) + '&limit=10'));
        case 1:
          data = _context4.v;
          return _context4.a(2, data && data.epg_listings || []);
        case 2:
          _context4.p = 2;
          _t5 = _context4.v;
          if (!Net.isHttpError(_t5)) {
            _context4.n = 3;
            break;
          }
          throw _t5;
        case 3:
          return _context4.a(2, []);
      }
    }, _callee4, null, [[0, 2]]);
  }));
  return _xtreamGetEPG.apply(this, arguments);
}
function xtreamDecodeEPG(str) {
  return Charset.fromBase64(str);
}

/* Full programme guide for one channel, including past programmes. Unlike
   get_short_epg this returns the whole stored archive window, and each listing
   carries `has_archive` (1 = a catch-up recording exists). Titles/descriptions
   are base64 like the short EPG. Used by the Catch-up page. */
function xtreamGetSimpleDataTable(_x6, _x7) {
  return _xtreamGetSimpleDataTable.apply(this, arguments);
}
/* Two-digit pad helper for the timeshift start string. */
function _xtreamGetSimpleDataTable() {
  _xtreamGetSimpleDataTable = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(cfg, streamId) {
    var data, _t6;
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.p = _context5.n) {
        case 0:
          _context5.p = 0;
          _context5.n = 1;
          return Net.json(_xtApi(cfg, 'action=get_simple_data_table&stream_id=' + encodeURIComponent(streamId)));
        case 1:
          data = _context5.v;
          return _context5.a(2, data && data.epg_listings || []);
        case 2:
          _context5.p = 2;
          _t6 = _context5.v;
          if (!Net.isHttpError(_t6)) {
            _context5.n = 3;
            break;
          }
          throw _t6;
        case 3:
          return _context5.a(2, []);
      }
    }, _callee5, null, [[0, 2]]);
  }));
  return _xtreamGetSimpleDataTable.apply(this, arguments);
}
function _ts2(n) {
  return (n < 10 ? '0' : '') + n;
}

/* Format a Date as the `Y-m-d:H-i` string Xtream timeshift endpoints expect,
   in the device's local timezone (matches the wall-clock time shown in the
   programme list — correct when the TV and IPTV server share a timezone, which
   is the common case for same-country providers). */
function xtreamFormatTimeshiftStart(date) {
  return date.getFullYear() + '-' + _ts2(date.getMonth() + 1) + '-' + _ts2(date.getDate()) + ':' + _ts2(date.getHours()) + '-' + _ts2(date.getMinutes());
}

/* Candidate catch-up (timeshift) playback URLs for a past programme, in
   priority order so the player can walk the list until one plays — different
   panels expose different endpoints. `start` is the programme's start Date;
   `durationMin` is its length in minutes. */
function xtreamBuildTimeshiftURLs(cfg, streamId, start, durationMin) {
  var baseUrl = _xtBase(cfg);
  var u = encodeURIComponent(cfg.username);
  var p = encodeURIComponent(cfg.password);
  var id = encodeURIComponent(streamId);
  var dur = Math.max(1, Math.round(durationMin));
  var startStr = xtreamFormatTimeshiftStart(start);
  return [// Path style — colon kept literal (a valid path char; panels that don't
  // url-decode path segments reject %3A).
  "".concat(baseUrl, "/timeshift/").concat(u, "/").concat(p, "/").concat(dur, "/").concat(startStr, "/").concat(id, ".m3u8"),
  // Query style — colon encoded, which is correct for a query value.
  "".concat(baseUrl, "/streaming/timeshift.php?username=").concat(u, "&password=").concat(p) + "&stream=".concat(id, "&start=").concat(encodeURIComponent(startStr), "&duration=").concat(dur)];
}
function xtreamBuildLiveURL(cfg, streamId) {
  return Config.liveUrl(cfg, streamId);
}