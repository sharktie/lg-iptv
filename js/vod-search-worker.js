/* vod-search-worker.js — off-main-thread VOD search.
 *
 * Runs in a Web Worker (background thread). It fetches the full movie + series
 * catalogs, builds a slim lower-cased index once, then answers query messages —
 * so filtering tens of thousands of titles never blocks the UI thread.
 *
 * Plain ES5 (no fetch/Array.from/includes) so it runs in the worker scope on
 * every webOS version without needing the page's polyfills.                    */
(function () {
    'use strict';

    var index = [];      // [{ id, type, name, lc, icon }]
    var ready = false;

    function xhrJSON(url, cb) {
        try {
            var x = new XMLHttpRequest();
            x.open('GET', url, true);
            x.onload = function () {
                if (x.status >= 200 && x.status < 300) {
                    try { cb(null, JSON.parse(x.responseText)); } catch (e) { cb(e); }
                } else { cb(new Error('HTTP ' + x.status)); }
            };
            x.onerror = function () { cb(new Error('network')); };
            x.send();
        } catch (e) { cb(e); }
    }

    function addAll(arr, type) {
        if (!arr || !arr.length) return;
        for (var i = 0; i < arr.length; i++) {
            var m = arr[i];
            var id = type === 'series' ? m.series_id : m.stream_id;
            if (id === undefined || id === null) continue;
            var nm = m.name || m.title || '';
            index.push({
                id: id, type: type, name: nm, lc: nm.toLowerCase(),
                icon: m.stream_icon || m.cover || m.cover_big || m.icon || ''
            });
        }
    }

    function load(movieUrl, seriesUrl) {
        var pending = 2;
        function done() {
            pending--;
            if (pending === 0) { ready = true; self.postMessage({ cmd: 'ready', count: index.length }); }
        }
        xhrJSON(movieUrl,  function (err, data) { if (!err) addAll(data, 'movie');  done(); });
        xhrJSON(seriesUrl, function (err, data) { if (!err) addAll(data, 'series'); done(); });
    }

    function search(q, limit, reqId) {
        q = (q || '').toLowerCase();
        var out = [], lim = limit || 40;
        for (var i = 0; i < index.length && out.length < lim; i++) {
            var it = index[i];
            if (it.lc.indexOf(q) === -1) continue;
            if (it.type === 'series') out.push({ series_id: it.id, name: it.name, cover: it.icon, __type: 'series' });
            else                      out.push({ stream_id: it.id, name: it.name, stream_icon: it.icon, __type: 'movie' });
        }
        self.postMessage({ cmd: 'results', reqId: reqId, q: q, items: out, ready: ready });
    }

    self.onmessage = function (e) {
        var d = e.data || {};
        if (d.cmd === 'load') {
            if (ready) self.postMessage({ cmd: 'ready', count: index.length });
            else if (!index.length) load(d.movieUrl, d.seriesUrl);
        } else if (d.cmd === 'search') {
            search(d.q, d.limit, d.reqId);
        }
    };
}());
