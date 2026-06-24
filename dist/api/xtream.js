"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _fetchJSON(_x, _x2) {
  return _fetchJSON2.apply(this, arguments);
}
function _fetchJSON2() {
  _fetchJSON2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(url, timeoutMs) {
    var ctrl, tid, r, _t;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (timeoutMs === undefined) timeoutMs = 10000;
          ctrl = new AbortController();
          tid = setTimeout(function () {
            return ctrl.abort();
          }, timeoutMs);
          _context.p = 1;
          _context.n = 2;
          return fetch(url, {
            signal: ctrl.signal
          });
        case 2:
          r = _context.v;
          clearTimeout(tid);
          if (r.ok) {
            _context.n = 3;
            break;
          }
          throw new Error("HTTP " + r.status);
        case 3:
          _context.n = 4;
          return r.json();
        case 4:
          return _context.a(2, _context.v);
        case 5:
          _context.p = 5;
          _t = _context.v;
          clearTimeout(tid);
          throw _t;
        case 6:
          return _context.a(2);
      }
    }, _callee, null, [[1, 5]]);
  }));
  return _fetchJSON2.apply(this, arguments);
}
function _auth(cfg) {
  return "username=" + encodeURIComponent(cfg.username) + "&password=" + encodeURIComponent(cfg.password);
}
function _base(cfg) {
  return (cfg.server_url || "").replace(/\/+$/, "");
}
function xtreamLoadConfig() {
  if (window.IPTV_CONFIG) return Promise.resolve(window.IPTV_CONFIG);
  return Promise.reject(new Error("window.IPTV_CONFIG not set"));
}

// Try each server URL in order until one responds. Returns { cfg, data } with
// cfg.server_url set to the working URL, or null if all fail.
function xtreamLogin(_x3) {
  return _xtreamLogin.apply(this, arguments);
}
function _xtreamLogin() {
  _xtreamLogin = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(cfg) {
    var entered, urls, _i, _urls, url, base, result, _t2;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          entered = cfg.server_urls && cfg.server_urls.length ? cfg.server_urls : [cfg.server_url].filter(Boolean); // Try each URL, plus an http fallback for https entries — some servers use a
          // cert/TLS the TV browser rejects, and http on the same host/port still works.
          urls = [];
          entered.forEach(function (u) {
            urls.push(u);
            if (/^https:/i.test(u)) {
              var alt = u.replace(/^https:/i, "http:");
              if (urls.indexOf(alt) === -1) urls.push(alt);
            }
          });
          _i = 0, _urls = urls;
        case 1:
          if (!(_i < _urls.length)) {
            _context2.n = 7;
            break;
          }
          url = _urls[_i];
          _context2.p = 2;
          base = url.replace(/\/+$/, "");
          _context2.n = 3;
          return _fetchJSON("".concat(base, "/player_api.php?").concat(_auth(_objectSpread(_objectSpread({}, cfg), {}, {
            server_url: url
          }))), 12000);
        case 3:
          result = _context2.v;
          if (!result) {
            _context2.n = 4;
            break;
          }
          return _context2.a(2, {
            cfg: _objectSpread(_objectSpread({}, cfg), {}, {
              server_url: url
            }),
            data: result
          });
        case 4:
          _context2.n = 6;
          break;
        case 5:
          _context2.p = 5;
          _t2 = _context2.v;
        case 6:
          _i++;
          _context2.n = 1;
          break;
        case 7:
          return _context2.a(2, null);
      }
    }, _callee2, null, [[2, 5]]);
  }));
  return _xtreamLogin.apply(this, arguments);
}
function xtreamGetLiveChannels(_x4) {
  return _xtreamGetLiveChannels.apply(this, arguments);
}
function _xtreamGetLiveChannels() {
  _xtreamGetLiveChannels = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(cfg) {
    var data, _t3;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          _context3.p = 0;
          _context3.n = 1;
          return _fetchJSON("".concat(_base(cfg), "/player_api.php?").concat(_auth(cfg), "&action=get_live_streams"), 15000);
        case 1:
          data = _context3.v;
          return _context3.a(2, Array.isArray(data) ? data : (data === null || data === void 0 ? void 0 : data.data) || []);
        case 2:
          _context3.p = 2;
          _t3 = _context3.v;
          return _context3.a(2, []);
      }
    }, _callee3, null, [[0, 2]]);
  }));
  return _xtreamGetLiveChannels.apply(this, arguments);
}
function xtreamGetCategories(_x5) {
  return _xtreamGetCategories.apply(this, arguments);
}
function _xtreamGetCategories() {
  _xtreamGetCategories = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(cfg) {
    var data, _t4;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          _context4.p = 0;
          _context4.n = 1;
          return _fetchJSON("".concat(_base(cfg), "/player_api.php?").concat(_auth(cfg), "&action=get_live_categories"));
        case 1:
          data = _context4.v;
          return _context4.a(2, Array.isArray(data) ? data : []);
        case 2:
          _context4.p = 2;
          _t4 = _context4.v;
          return _context4.a(2, []);
      }
    }, _callee4, null, [[0, 2]]);
  }));
  return _xtreamGetCategories.apply(this, arguments);
}
function xtreamGetEPG(_x6, _x7) {
  return _xtreamGetEPG.apply(this, arguments);
}
function _xtreamGetEPG() {
  _xtreamGetEPG = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(cfg, streamId) {
    var data, _t5;
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.p = _context5.n) {
        case 0:
          _context5.p = 0;
          _context5.n = 1;
          return _fetchJSON("".concat(_base(cfg), "/player_api.php?").concat(_auth(cfg), "&action=get_short_epg&stream_id=").concat(encodeURIComponent(streamId), "&limit=10"));
        case 1:
          data = _context5.v;
          return _context5.a(2, (data === null || data === void 0 ? void 0 : data.epg_listings) || []);
        case 2:
          _context5.p = 2;
          _t5 = _context5.v;
          if (!(_t5 && _t5.message && /^HTTP \d/.test(_t5.message))) {
            _context5.n = 3;
            break;
          }
          throw _t5;
        case 3:
          return _context5.a(2, []);
      }
    }, _callee5, null, [[0, 2]]);
  }));
  return _xtreamGetEPG.apply(this, arguments);
}
function xtreamDecodeEPG(str) {
  if (!str) return "";
  try {
    return atob(str);
  } catch (_unused) {
    return str;
  }
}
function xtreamBaseUrl(cfg) {
  return _base(cfg);
}
function xtreamBuildLiveURL(cfg, streamId) {
  var baseUrl = xtreamBaseUrl(cfg);
  return "".concat(baseUrl, "/live/").concat(encodeURIComponent(cfg.username), "/").concat(encodeURIComponent(cfg.password), "/").concat(encodeURIComponent(streamId), ".m3u8");
}