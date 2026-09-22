"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/* core/charset.js — turning bytes from a provider into the characters they meant.
 * Exposes window.Charset (not "Text" — that name is the DOM Text-node constructor).
 *
 * Non-Latin catalogues (Greek being the case that prompted this) were arriving
 * as boxes, "�" diamonds or "Î•Î»Î»Î·Î½Î¹ÎºÎ¬"-style gibberish. Three separate
 * failures produce those, and each needs its own repair:
 *
 *   1. Legacy-encoded bodies. fetch's text()/json() always decode as UTF-8 and
 *      ignore the Content-Type charset, so an M3U, XMLTV or panel reply saved
 *      as windows-1253 / ISO-8859-7 turns every Greek letter into U+FFFD.
 *      → decode() reads the BYTES and picks the charset itself.
 *   2. Base64 EPG text. Xtream base64-encodes programme titles, and atob()
 *      returns one char per BYTE — so UTF-8 Greek comes out as Latin-1 pairs.
 *      → fromBase64() decodes the bytes properly.
 *   3. Double-encoded UTF-8 already stored that way on the panel (UTF-8 bytes
 *      once misread as windows-1252 and re-saved). No charset choice on our side
 *      can undo that; the characters themselves have to be reversed.
 *      → repair() / repairDeep().
 *
 * ES5 — Babel target is Chrome 38. TextDecoder exists there, but the set of
 * labels varies by build, so every use is guarded.                            */
window.Charset = function () {
  'use strict';

  var hasDecoder = typeof TextDecoder === 'function';
  function tryDecode(bytes, label, fatal) {
    if (!hasDecoder) return null;
    try {
      return new TextDecoder(label, fatal ? {
        fatal: true
      } : undefined).decode(bytes);
    } catch (e) {
      return null;
    }
  }

  /* Strict UTF-8 without TextDecoder — the classic escape/decodeURIComponent
     trick, which throws on malformed input exactly like fatal:true does. */
  function utf8Strict(bytes) {
    var r = tryDecode(bytes, 'utf-8', true);
    if (r !== null || hasDecoder) return r;
    var s = '';
    for (var i = 0; i < bytes.length; i += 8192) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    try {
      return decodeURIComponent(escape(s));
    } catch (e) {
      return null;
    }
  }

  /* The charset a response claims: the Content-Type header first, then an
     in-band declaration (`<?xml encoding="…"?>`, `<meta charset>`) near the
     top of the body — XMLTV files routinely carry only the latter. */
  function declaredCharset(bytes, contentType) {
    var m = /charset\s*=\s*["']?([\w.:-]+)/i.exec(contentType || '');
    if (m) return m[1].toLowerCase();
    var head = '';
    var n = Math.min(bytes.length, 512);
    for (var i = 0; i < n; i++) head += String.fromCharCode(bytes[i]);
    m = /<\?xml[^>]*encoding\s*=\s*["']([\w.:-]+)/i.exec(head) || /<meta[^>]*charset\s*=\s*["']?([\w.:-]+)/i.exec(head);
    return m ? m[1].toLowerCase() : '';
  }

  /* No usable declaration and not valid UTF-8: guess the codepage from the
     high bytes. Latin text has accented letters sitting alone between ASCII
     ones ("café"); Greek and Cyrillic words are made ENTIRELY of high bytes,
     so a high byte is almost always next to another. Between those two the
     most frequent letters give it away — α/ο/ι (0xE1/0xEF/0xE9) and the
     tonos vowels (0xDC–0xDF) in windows-1253 versus а/о/е (0xE0/0xEE/0xE5)
     in windows-1251. */
  function guessLegacy(bytes) {
    var high = 0,
      paired = 0,
      greek = 0,
      cyrillic = 0;
    var n = Math.min(bytes.length, 200000);
    for (var i = 0; i < n; i++) {
      var b = bytes[i];
      if (b < 0x80) continue;
      high++;
      if (i > 0 && bytes[i - 1] >= 0x80 || i + 1 < n && bytes[i + 1] >= 0x80) paired++;
      if (b === 0xE1 || b === 0xEF || b === 0xE9 || b >= 0xDC && b <= 0xDF) greek++;else if (b === 0xE0 || b === 0xEE || b === 0xE5) cyrillic++;
    }
    if (!high || paired / high < 0.5) return 'windows-1252';
    return cyrillic > greek ? 'windows-1251' : 'windows-1253';
  }

  /* Bytes (ArrayBuffer or Uint8Array) → string.
      Order matters. A BOM is authoritative. After that valid UTF-8 wins even
     over a header that says otherwise, because servers mislabel UTF-8 as
     ISO-8859-1 constantly, while legacy Greek text that happens to form valid
     UTF-8 sequences is vanishingly rare. Only then is the declared charset
     trusted, and only then guessed at. */
  function decode(buf, contentType) {
    var bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    if (bytes.length >= 2) {
      if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
        var le = tryDecode(bytes, 'utf-16le');
        if (le !== null) return le;
      }
      if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
        var be = tryDecode(bytes, 'utf-16be');
        if (be !== null) return be;
      }
    }
    var utf8 = utf8Strict(bytes);
    if (utf8 !== null) return utf8;
    var declared = declaredCharset(bytes, contentType);
    if (declared && !/^utf-?8$/.test(declared)) {
      var d = tryDecode(bytes, declared);
      if (d !== null) return d;
    }
    var guessed = tryDecode(bytes, guessLegacy(bytes));
    if (guessed !== null) return guessed;
    return tryDecode(bytes, 'utf-8') || '';
  }

  /* ── Double-encoded UTF-8 ─────────────────────────────────────────────────
     When UTF-8 is misread as windows-1252 every byte becomes one character:
     a lead byte (0xC2–0xF4 → "Â".."ô") followed by continuation bytes
     (0x80–0xBF), which windows-1252 maps partly to Latin-1 and partly to the
     typographic characters below. Reversing that mapping recovers the bytes,
     and a strict UTF-8 decode of them is the proof the repair is right. */
  var CP1252 = {
    0x20AC: 0x80,
    0x201A: 0x82,
    0x0192: 0x83,
    0x201E: 0x84,
    0x2026: 0x85,
    0x2020: 0x86,
    0x2021: 0x87,
    0x02C6: 0x88,
    0x2030: 0x89,
    0x0160: 0x8A,
    0x2039: 0x8B,
    0x0152: 0x8C,
    0x017D: 0x8E,
    0x2018: 0x91,
    0x2019: 0x92,
    0x201C: 0x93,
    0x201D: 0x94,
    0x2022: 0x95,
    0x2013: 0x96,
    0x2014: 0x97,
    0x02DC: 0x98,
    0x2122: 0x99,
    0x0161: 0x9A,
    0x203A: 0x9B,
    0x0153: 0x9C,
    0x017E: 0x9E,
    0x0178: 0x9F
  };
  var CONT_CLASS = "[\\u0080-\\u00BF\\u0152\\u0153\\u0160\\u0161\\u0178\\u017D\\u017E\\u0192" + "\\u02C6\\u02DC\\u2013\\u2014\\u2018-\\u201A\\u201C-\\u201E\\u2020-\\u2022" + "\\u2026\\u2030\\u2039\\u203A\\u20AC\\u2122]";
  /* Cheap gate so the common case — nothing to fix — costs one regex test. */
  var MOJIBAKE = new RegExp("[\\u00C2-\\u00F4]" + CONT_CLASS);
  /* The same signature inside JSON \u escapes (PHP's json_encode default),
     which the raw-text test above cannot see. */
  var MOJIBAKE_ESCAPED = /\\u00(?:c[2-9a-f]|d[0-9a-f]|e[0-9a-f]|f[0-4])\\u(?:00[89ab][0-9a-f]|20[1-3a][0-9a-f]|01[5-9][0-9a-f]|02[cd][0-9a-f]|2122)/i;
  function byteOf(ch) {
    var c = ch.charCodeAt(0);
    if (c < 0x100) return c;
    return CP1252[c] !== undefined ? CP1252[c] : -1;
  }
  function repair(s) {
    if (typeof s !== 'string' || !MOJIBAKE.test(s)) return s;
    var out = '',
      i = 0,
      len = s.length;
    while (i < len) {
      var lead = s.charCodeAt(i);
      var need = lead >= 0xC2 && lead <= 0xDF ? 1 : lead >= 0xE0 && lead <= 0xEF ? 2 : lead >= 0xF0 && lead <= 0xF4 ? 3 : 0;
      if (need && i + need < len) {
        var cp = lead & (need === 1 ? 0x1F : need === 2 ? 0x0F : 0x07),
          ok = true;
        for (var k = 1; k <= need; k++) {
          var b = byteOf(s.charAt(i + k));
          if (b < 0x80 || b > 0xBF) {
            ok = false;
            break;
          }
          cp = cp << 6 | b & 0x3F;
        }
        /* Reject overlong forms and surrogates — a sequence strict
           UTF-8 would refuse is not mojibake, it is real text. */
        if (ok && (need === 2 && cp >= 0x800 && (cp < 0xD800 || cp > 0xDFFF) || need === 3 && cp >= 0x10000 && cp <= 0x10FFFF || need === 1)) {
          if (cp > 0xFFFF) {
            cp -= 0x10000;
            out += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
          } else {
            out += String.fromCharCode(cp);
          }
          i += need + 1;
          continue;
        }
      }
      /* All or nothing: in genuine mojibake EVERY lead-range character
         starts a valid sequence. One that does not ("Ñandú") means this
         is real Latin text, and touching any of it would corrupt it. */
      if (lead >= 0xC2 && lead <= 0xF4) return s;
      out += s.charAt(i);
      i++;
    }
    return out;
  }

  /* Repair every string inside a parsed JSON value, in place. */
  function repairDeep(v) {
    if (typeof v === 'string') return repair(v);
    if (!v || _typeof(v) !== 'object') return v;
    if (Array.isArray(v)) {
      for (var i = 0; i < v.length; i++) v[i] = repairDeep(v[i]);
    } else {
      for (var k in v) {
        if (Object.prototype.hasOwnProperty.call(v, k)) v[k] = repairDeep(v[k]);
      }
    }
    return v;
  }

  /* Whether a raw JSON body could contain anything repair() would change —
     walking a 20 000-channel list is only worth it when this says yes. */
  function needsRepair(text) {
    return MOJIBAKE.test(text) || MOJIBAKE_ESCAPED.test(text);
  }
  function parseJSON(text) {
    var data = JSON.parse(text);
    return needsRepair(text) ? repairDeep(data) : data;
  }

  /* Base64 → text, decoding the BYTES atob hands back rather than treating
     each one as a character. Strings that are not plausibly base64 come back
     untouched, since some panels send EPG text in the clear. */
  function fromBase64(str) {
    if (!str) return '';
    var s = String(str).replace(/\s+/g, '');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s) || s.length % 4 === 1) return repair(String(str));
    var bin;
    try {
      bin = atob(s);
    } catch (e) {
      return repair(String(str));
    }
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    /* Strict UTF-8 only: a short clear-text title ("News") is also valid
       base64, and its "decoded" bytes are noise that a legacy codepage would
       happily turn into "5ì,". Noise is almost never valid UTF-8, and
       control characters catch the ASCII-only remainder. */
    var out = utf8Strict(bytes);
    if (out === null || /[\u0000-\u0008\u000E-\u001F]/.test(out)) return repair(String(str));
    return repair(out);
  }
  return {
    decode: decode,
    repair: repair,
    repairDeep: repairDeep,
    parseJSON: parseJSON,
    fromBase64: fromBase64
  };
}();