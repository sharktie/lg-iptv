"use strict";

/* core/net.js — the app's single HTTP layer. Exposes window.Net.
 *
 * Replaces four near-identical private fetch wrappers that had drifted apart
 * (api/xtream.js `_fetchJSON`, iptv-core.js `fetchJSON`, prewarm.js `fetchJSON`
 * and settings.js `updFetch`) — each with its own timeout and its own idea of
 * what counts as an error.
 *
 * Everything here goes through the fetch/AbortController shims in polyfills.js,
 * which is why the timeout is expressed as a plain setTimeout + abort rather
 * than anything newer: on webOS 5.40 AbortController is stubbed and the signal
 * is stripped before it reaches native fetch, so the timer must not be the only
 * thing keeping the promise honest.
 *
 * ES5 — Babel target is Chrome 38.                                            */
window.Net = function () {
  'use strict';

  var DEFAULT_TIMEOUT = 12000;

  /* An error carrying the HTTP status, so callers can tell "the server said
     no" (403 on EPG → back off permanently) from "the network died" (retry).
     The old code sniffed for the substring "403" in a message, which also
     matched a body that merely happened to contain those digits. */
  function httpError(status, url) {
    var err = new Error('HTTP ' + status);
    err.status = status;
    err.url = url;
    return err;
  }
  function isHttpError(err, status) {
    if (!err || typeof err.status !== 'number') return false;
    return status === undefined ? true : err.status === status;
  }
  function request(url, opts) {
    opts = opts || {};
    var timeout = opts.timeout || DEFAULT_TIMEOUT;
    var ctrl = new AbortController();
    var timedOut = false;
    var tid = setTimeout(function () {
      timedOut = true;
      ctrl.abort();
    }, timeout);
    var init = {
      signal: ctrl.signal
    };
    if (opts.method) init.method = opts.method;
    if (opts.headers) init.headers = opts.headers;
    if (opts.body) init.body = opts.body;
    if (opts.cache) init.cache = opts.cache;
    /* Honoured by the XHR shim in polyfills.js, which cannot decide after
       the fact whether a caller wants bytes or text. Native fetch ignores
       the key and serves arrayBuffer() regardless, so passing it always is
       safe on both paths. */
    if (opts.responseType) init.responseType = opts.responseType;
    return fetch(url, init).then(function (res) {
      clearTimeout(tid);
      if (!res.ok) throw httpError(res.status, url);
      return res;
    }, function (err) {
      clearTimeout(tid);
      if (timedOut) {
        var e = new Error('Timed out after ' + Math.round(timeout / 1000) + 's');
        e.timeout = true;
        e.url = url;
        throw e;
      }
      throw err;
    });
  }

  /* Body as a string, decoded by Charset rather than by the platform.
     Response.text() is UTF-8 no matter what the server declares, which turned
     every windows-1253 Greek channel name into "�" — so the bytes are read
     and the charset chosen here instead. Falls back to text() when the
     response cannot hand over bytes losslessly (the XHR shim on a browser
     that refused responseType). */
  function bodyText(res) {
    if (typeof res.arrayBuffer !== 'function' || res.lossyBuffer) return res.text();
    return res.arrayBuffer().then(function (buf) {
      var type = '';
      try {
        type = res.headers && res.headers.get('content-type') || '';
      } catch (e) {}
      return Charset.decode(buf, type);
    });
  }
  function withBytes(opts) {
    var o = {};
    for (var k in opts) if (Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
    o.responseType = 'arraybuffer';
    return o;
  }
  function json(url, opts) {
    return request(url, withBytes(opts || {})).then(bodyText).then(Charset.parseJSON);
  }
  function text(url, opts) {
    return request(url, withBytes(opts || {})).then(bodyText).then(Charset.repair);
  }

  /* Fetch that answers from Store's TTL cache when it can. On a cache miss
     the network result is cached before being handed back; on a network
     failure the rejection propagates untouched so callers can show a real
     error rather than an empty list that looks like "no content". */
  function cachedJSON(key, url, ttl, opts) {
    var hit = Store.cacheGet(key, ttl);
    if (hit) return Promise.resolve(hit);
    return json(url, opts).then(function (data) {
      Store.cacheSet(key, data);
      return data;
    });
  }

  /* Serve the cache immediately AND refresh in the background. `onFresh` is
     called only if the network answer differs in length from the cached one,
     which is the cheap test that matters for channel/VOD lists — it avoids
     repainting a 20 000-row list on every visit for no visible change. */
  function staleWhileRevalidate(key, url, ttl, onFresh) {
    var hit = Store.cacheGet(key, ttl);
    var net = json(url).then(function (data) {
      Store.cacheSet(key, data);
      var changed = !hit || !hit.length || !data || hit.length !== data.length;
      if (changed && typeof onFresh === 'function') onFresh(data);
      return data;
    });
    if (hit) {
      net['catch'](function () {});
      return Promise.resolve(hit);
    }
    return net;
  }

  /* Best-effort probe: does this URL exist and return something non-empty?
     Resolves with the body text, or null for anything else — it never
     rejects, because every caller treats "no" as an ordinary answer rather
     than a failure. Kept short-timeout on purpose: it runs speculatively
     against endpoints a panel may simply not implement. */
  function probeText(url, timeout) {
    return text(url, {
      timeout: timeout || 4000
    }).then(function (body) {
      return body && body.length ? body : null;
    })['catch'](function () {
      return null;
    });
  }
  return {
    DEFAULT_TIMEOUT: DEFAULT_TIMEOUT,
    request: request,
    json: json,
    text: text,
    cachedJSON: cachedJSON,
    staleWhileRevalidate: staleWhileRevalidate,
    probeText: probeText,
    httpError: httpError,
    isHttpError: isHttpError
  };
}();