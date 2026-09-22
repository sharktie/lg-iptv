"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/* polyfills.js — runtime shims for older WebOS browsers.
 *
 * Babel transpiles ES6+ *syntax* (arrow fns, let/const, classes) but does NOT
 * add the missing built-in *methods* below. WebOS 3 ships Chrome 38, WebOS 4
 * Chrome 53 — both lack many of these, which previously threw and killed whole
 * pages (e.g. Settings → "can't create profiles"). Each shim is feature-detected
 * so newer TVs are untouched. Plain ES5 so it runs before Babel output. Load
 * this FIRST on every page.
 */
(function () {
  'use strict';

  /* ── Array.from (Chrome 45+) ─────────────────────────────────────────── */
  if (!Array.from) {
    Array.from = function (arrayLike, mapFn, thisArg) {
      if (arrayLike == null) throw new TypeError('Array.from requires an array-like object');
      var items = Object(arrayLike);
      var len = arrayLike.length >>> 0;
      var out = [];
      // Iterable (Set/Map/NodeList with Symbol.iterator)
      if (typeof Symbol !== 'undefined' && Symbol.iterator && items[Symbol.iterator]) {
        var it = items[Symbol.iterator]();
        var step,
          i = 0;
        while (!(step = it.next()).done) {
          out.push(mapFn ? mapFn.call(thisArg, step.value, i) : step.value);
          i++;
        }
        return out;
      }
      for (var j = 0; j < len; j++) {
        out.push(mapFn ? mapFn.call(thisArg, items[j], j) : items[j]);
      }
      return out;
    };
  }

  /* ── Array.prototype.find / findIndex (Chrome 45+) ───────────────────── */
  if (!Array.prototype.find) {
    Array.prototype.find = function (cb, thisArg) {
      for (var i = 0; i < this.length; i++) {
        if (cb.call(thisArg, this[i], i, this)) return this[i];
      }
      return undefined;
    };
  }
  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function (cb, thisArg) {
      for (var i = 0; i < this.length; i++) {
        if (cb.call(thisArg, this[i], i, this)) return i;
      }
      return -1;
    };
  }

  /* ── Array.prototype.includes (Chrome 47+) ───────────────────────────── */
  if (!Array.prototype.includes) {
    Array.prototype.includes = function (search, fromIndex) {
      var o = Object(this),
        len = o.length >>> 0;
      if (len === 0) return false;
      var i = fromIndex | 0;
      if (i < 0) i = Math.max(len + i, 0);
      for (; i < len; i++) {
        var v = o[i];
        if (v === search || v !== v && search !== search) return true; // NaN
      }
      return false;
    };
  }

  /* ── Array.prototype.fill (Chrome 45+) ───────────────────────────────── */
  if (!Array.prototype.fill) {
    Array.prototype.fill = function (value, start, end) {
      var len = this.length >>> 0;
      var i = start >> 0;
      i = i < 0 ? Math.max(len + i, 0) : Math.min(i, len);
      var e = end === undefined ? len : end >> 0;
      e = e < 0 ? Math.max(len + e, 0) : Math.min(e, len);
      for (; i < e; i++) this[i] = value;
      return this;
    };
  }

  /* ── String.prototype.includes / startsWith / endsWith (Chrome 41+) ──── */
  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      return this.indexOf(search, start || 0) !== -1;
    };
  }
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (search, pos) {
      pos = pos || 0;
      return this.substr(pos, search.length) === search;
    };
  }
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (search, len) {
      var s = String(this);
      if (len === undefined || len > s.length) len = s.length;
      return s.substring(len - search.length, len) === search;
    };
  }
  if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
      return new Array((count | 0) + 1).join(this);
    };
  }

  /* ── Object.assign (Chrome 45+) ──────────────────────────────────────── */
  if (typeof Object.assign !== 'function') {
    Object.assign = function (target) {
      if (target == null) throw new TypeError('Cannot convert undefined or null to object');
      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i];
        if (src == null) continue;
        for (var key in src) {
          if (Object.prototype.hasOwnProperty.call(src, key)) to[key] = src[key];
        }
      }
      return to;
    };
  }

  /* ── Object.entries / values (Chrome 54+) ────────────────────────────── */
  if (!Object.entries) {
    Object.entries = function (obj) {
      var keys = Object.keys(obj),
        out = [];
      for (var i = 0; i < keys.length; i++) out.push([keys[i], obj[keys[i]]]);
      return out;
    };
  }
  if (!Object.values) {
    Object.values = function (obj) {
      var keys = Object.keys(obj),
        out = [];
      for (var i = 0; i < keys.length; i++) out.push(obj[keys[i]]);
      return out;
    };
  }

  /* ── NodeList / HTMLCollection forEach (Chrome 51+) ──────────────────── */
  if (typeof NodeList !== 'undefined' && NodeList.prototype && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }
  if (typeof HTMLCollection !== 'undefined' && HTMLCollection.prototype && !HTMLCollection.prototype.forEach) {
    HTMLCollection.prototype.forEach = Array.prototype.forEach;
  }

  /* ── Element.matches / closest (Chrome 41/45+) ───────────────────────── */
  if (typeof Element !== 'undefined') {
    var ep = Element.prototype;
    if (!ep.matches) {
      ep.matches = ep.matchesSelector || ep.webkitMatchesSelector || ep.mozMatchesSelector || ep.msMatchesSelector || function (sel) {
        var nodes = (this.document || this.ownerDocument).querySelectorAll(sel);
        var i = nodes.length;
        while (--i >= 0 && nodes[i] !== this) {}
        return i > -1;
      };
    }
    if (!ep.closest) {
      ep.closest = function (sel) {
        var el = this;
        while (el && el.nodeType === 1) {
          if (el.matches(sel)) return el;
          el = el.parentElement || el.parentNode;
        }
        return null;
      };
    }
  }

  /* ── scrollIntoView(options) (Chrome 61+) ─────────────────────────────────
     Every D-pad screen in this app moves its focus ring with
     `el.scrollIntoView({ block: 'nearest' })` — seventeen call sites across
     the channel list, the VOD rails, catch-up, settings and the player menu.
      Old Blink does not understand the dictionary. It does NOT throw, which is
     what makes this worth polyfilling rather than try/catching: the argument
     is coerced to a boolean, `{}` is truthy, and every one of those calls
     silently becomes `scrollIntoView(true)` — "align to the TOP". So on the
     TVs this app targets, each press of the D-pad yanked the focused row to
     the top of its container instead of nudging it just into view, which
     reads as the list jumping around under you.
      Installed only where the dictionary is unsupported, and it defers to the
     native method for the boolean/no-arg forms, so modern engines are
     untouched. `scrollBehavior` in the style object is the detection: CSSOM
     View smooth scrolling shipped alongside the dictionary form. */
  if (typeof Element !== 'undefined' && Element.prototype && Element.prototype.scrollIntoView && document.documentElement && !('scrollBehavior' in document.documentElement.style)) {
    var _nativeSIV = Element.prototype.scrollIntoView;

    /* The nearest ancestor that actually scrolls on the given axis. Falls
       back to null, where the native call is the better answer than
       guessing at the viewport. */
    var _scrollParent = function _scrollParent(el, axis) {
      var node = el.parentNode;
      while (node && node.nodeType === 1) {
        var s;
        try {
          s = window.getComputedStyle(node);
        } catch (e) {
          return null;
        }
        var ov = axis === 'x' ? s.overflowX : s.overflowY;
        var scrolls = axis === 'x' ? node.scrollWidth > node.clientWidth : node.scrollHeight > node.clientHeight;
        if ((ov === 'auto' || ov === 'scroll' || ov === 'overlay') && scrolls) return node;
        node = node.parentNode;
      }
      return null;
    };
    Element.prototype.scrollIntoView = function (arg) {
      if (!arg || _typeof(arg) !== 'object') return _nativeSIV.call(this, arg);
      var block = arg.block || 'start';
      var inline = arg.inline || 'nearest';
      var handled = false;
      var vp = _scrollParent(this, 'y');
      if (vp) {
        var er = this.getBoundingClientRect(),
          pr = vp.getBoundingClientRect();
        var top = er.top - pr.top + vp.scrollTop,
          bot = top + er.height;
        if (block === 'start') vp.scrollTop = top;else if (block === 'end') vp.scrollTop = bot - vp.clientHeight;else if (block === 'center') vp.scrollTop = top - (vp.clientHeight - er.height) / 2;else if (top < vp.scrollTop) vp.scrollTop = top;else if (bot > vp.scrollTop + vp.clientHeight) vp.scrollTop = bot - vp.clientHeight;
        handled = true;
      }
      var hp = _scrollParent(this, 'x');
      if (hp) {
        var er2 = this.getBoundingClientRect(),
          pr2 = hp.getBoundingClientRect();
        var left = er2.left - pr2.left + hp.scrollLeft,
          right = left + er2.width;
        if (inline === 'start') hp.scrollLeft = left;else if (inline === 'end') hp.scrollLeft = right - hp.clientWidth;else if (inline === 'center') hp.scrollLeft = left - (hp.clientWidth - er2.width) / 2;else if (left < hp.scrollLeft) hp.scrollLeft = left;else if (right > hp.scrollLeft + hp.clientWidth) hp.scrollLeft = right - hp.clientWidth;
        handled = true;
      }

      /* Nothing scrollable around it — let the platform decide, using the
         boolean that matches the requested block. */
      if (!handled) _nativeSIV.call(this, block !== 'end' && block !== 'nearest');
    };
  }

  /* ── Number.isNaN / isFinite (Chrome 25/19 — safe guard) ─────────────── */
  if (!Number.isNaN) Number.isNaN = function (v) {
    return v !== v;
  };
  if (!Number.isFinite) Number.isFinite = function (v) {
    return typeof v === 'number' && isFinite(v);
  };

  /* ── AbortController + fetch interplay ───────────────────────────────────
     Three cases across WebOS versions:
       • Modern (WebOS 6+/Chrome 79+): both native → leave untouched.
       • WebOS 5.40-ish: native fetch but NO AbortController. We stub
         AbortController, but its fake `signal` is not a real AbortSignal, so
         passing it to native fetch throws "signal is not of type
         AbortSignal". We therefore wrap native fetch to strip that stub
         signal (timeouts stop cancelling early, but the request still works).
       • Old (WebOS 3/Chrome 38): no fetch at all → XHR-based fetch shim that
         honours the stub signal.
     Without this, the stub would merely swap "AbortController not defined"
     for a fetch TypeError on WebOS 5.40. */
  var hadNativeFetch = typeof window.fetch === 'function';
  var abortStubbed = typeof AbortController === 'undefined';
  if (abortStubbed) {
    window.AbortController = function () {
      this.signal = {
        aborted: false,
        addEventListener: function addEventListener() {},
        removeEventListener: function removeEventListener() {}
      };
    };
    window.AbortController.prototype.abort = function () {
      this.signal.aborted = true;
      if (typeof this.signal.onabort === 'function') this.signal.onabort();
    };
  }
  if (!hadNativeFetch) {
    // No native fetch — XHR shim that honours the (stub) signal.
    window.fetch = function (url, opts) {
      opts = opts || {};
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(opts.method || 'GET', url, true);
        /* Callers that need the raw BYTES rather than a decoded string
           ask for them up front, because XHR cannot supply both: setting
           responseType makes responseText unavailable. Subtitle
           downloads are the case that needs this — a .srt from a Chinese
           or Western European source is frequently not UTF-8, and once
           the browser has decoded it with the wrong charset the original
           bytes are gone and the mojibake is unrecoverable. */
        var wantBuffer = opts.responseType === 'arraybuffer';
        if (wantBuffer) {
          try {
            xhr.responseType = 'arraybuffer';
          } catch (e) {
            wantBuffer = false;
          }
        }
        if (opts.headers) {
          for (var h in opts.headers) {
            if (Object.prototype.hasOwnProperty.call(opts.headers, h)) {
              try {
                xhr.setRequestHeader(h, opts.headers[h]);
              } catch (e) {}
            }
          }
        }
        xhr.onload = function () {
          var body = 'response' in xhr ? xhr.response : xhr.responseText;
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            /* Bytes were asked for but XHR could not supply them,
               so arrayBuffer() below would be a lossy re-widening
               of already-decoded text. Net checks this and reads
               text() instead. */
            lossyBuffer: opts.responseType === 'arraybuffer' && !wantBuffer,
            /* Enough of the Headers interface for the one thing the
               app does with it: refusing to read a response body
               that turns out to be a 2 GB movie rather than the
               subtitle file we asked for. Header names are
               case-insensitive per spec, and getResponseHeader
               already handles that. */
            headers: {
              get: function get(name) {
                try {
                  return xhr.getResponseHeader(name);
                } catch (e) {
                  return null;
                }
              }
            },
            /* arrayBuffer() is part of the Response interface the app
               actually uses (subtitle downloads decode bytes
               themselves), and omitting it meant a caller that
               reached this shim died on "res.arrayBuffer is not a
               function" rather than degrading. Present in both
               modes: without responseType support the body is
               already a string, so it is widened back to bytes —
               lossy for non-ASCII, but a working ASCII path beats a
               TypeError, and callers that care ask for the buffer. */
            arrayBuffer: function arrayBuffer() {
              if (wantBuffer && body && body.byteLength !== undefined) {
                return Promise.resolve(body);
              }
              var s = String(body === null || body === undefined ? '' : body);
              var buf = new ArrayBuffer(s.length);
              var view = new Uint8Array(buf);
              for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
              return Promise.resolve(buf);
            },
            text: function text() {
              return Promise.resolve(bodyText());
            },
            json: function json() {
              return Promise.resolve(JSON.parse(bodyText()));
            }
          });

          /* In arraybuffer mode `body` is an ArrayBuffer, so text()
             and json() have to decode it rather than hand back
             "[object ArrayBuffer]". */
          function bodyText() {
            if (!wantBuffer || !body || body.byteLength === undefined) return body;
            var bytes = new Uint8Array(body),
              out = '';
            for (var i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
            try {
              return decodeURIComponent(escape(out));
            } catch (e) {
              return out;
            }
          }
        };
        xhr.onerror = function () {
          reject(new TypeError('Network request failed'));
        };
        if (opts.signal) {
          if (opts.signal.aborted) {
            xhr.abort();
            reject(new Error('Aborted'));
            return;
          }
          opts.signal.onabort = function () {
            try {
              xhr.abort();
            } catch (e) {}
            reject(new Error('Aborted'));
          };
        }
        xhr.send(opts.body || null);
      });
    };
  } else if (abortStubbed) {
    // Native fetch present but AbortController was stubbed: strip the fake
    // signal so native fetch doesn't reject it.
    var _nativeFetch = window.fetch;
    window.fetch = function (url, opts) {
      if (opts && opts.signal) {
        var clean = {};
        for (var k in opts) {
          if (Object.prototype.hasOwnProperty.call(opts, k) && k !== 'signal') clean[k] = opts[k];
        }
        return _nativeFetch.call(this, url, clean);
      }
      return _nativeFetch.call(this, url, opts);
    };
  }
})();