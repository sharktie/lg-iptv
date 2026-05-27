/* settings.js — IPTV Settings (WebOS-compatible) */

(function () {
    'use strict';

    /* ── Storage helpers ──────────────────────────────────────────────────── */
    function load(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    }
    function save(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }

    /* ── Status helper ────────────────────────────────────────────────────── */
    var _statusTimers = {};
    function setStatus(id, msg, cls, autoClearMs) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = msg;
        el.className = 'settings-status' + (cls ? ' ' + cls : '');
        clearTimeout(_statusTimers[id]);
        if (autoClearMs) {
            _statusTimers[id] = setTimeout(function () {
                el.textContent = '';
                el.className = 'settings-status';
            }, autoClearMs);
        }
    }

    /* ── Tab switching ────────────────────────────────────────────────────── */
    var tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
    var panels  = Array.from(document.querySelectorAll('.settings-panel'));

    function activateTab(value) {
        tabBtns.forEach(function (btn) {
            var on = btn.dataset.value === value;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach(function (panel) {
            panel.classList.toggle('active', panel.id === 'panel-' + value);
        });
        if (value === 'xtream' || value === 'm3u') save('iptv_source_type', value);
        rebuildFocusables();
    }

    tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () { activateTab(btn.dataset.value); });
    });

    /* ── Populate form ────────────────────────────────────────────────────── */
    (function populateForm() {
        var stored    = load('iptv_custom_config', null) || (typeof IPTV_CONFIG     !== 'undefined' ? IPTV_CONFIG     : {});
        var m3uStored = load('iptv_m3u_config',    null) || (typeof IPTV_M3U_CONFIG !== 'undefined' ? IPTV_M3U_CONFIG : {});
        document.getElementById('cfg-server-url').value = stored.server_url      || '';
        document.getElementById('cfg-username').value   = stored.username        || '';
        document.getElementById('cfg-password').value   = stored.password        || '';
        document.getElementById('cfg-m3u-url').value    = m3uStored.playlist_url || '';
        document.getElementById('cfg-epg-url').value    = load('iptv_custom_epg_url',   '');
        document.getElementById('cfg-epg-match').value  = load('iptv_custom_epg_match', 'tvg-id');
        activateTab(load('iptv_source_type', 'xtream'));
    }());

    /* ── Button handlers ──────────────────────────────────────────────────── */
    document.getElementById('cfg-save-btn').addEventListener('click', function () {
        var cfg = {
            server_url: document.getElementById('cfg-server-url').value.trim().replace(/\/$/, ''),
            username:   document.getElementById('cfg-username').value.trim(),
            password:   document.getElementById('cfg-password').value.trim(),
        };
        if (!cfg.server_url || !cfg.username || !cfg.password) {
            setStatus('cfg-status', 'Please fill in all fields.', 'err'); return;
        }
        save('iptv_custom_config', cfg);
        save('iptv_source_type', 'xtream');
        try { localStorage.removeItem('iptv_ch_v2'); localStorage.removeItem('iptv_cat_v2'); } catch (e) {}
        if (typeof IPTV_CONFIG !== 'undefined') IPTV_CONFIG = cfg;
        setStatus('cfg-status', 'Saved — returning to Live TV…', 'ok');
        setTimeout(function () { history.back(); }, 900);
    });

    document.getElementById('cfg-m3u-save-btn').addEventListener('click', function () {
        var url = document.getElementById('cfg-m3u-url').value.trim();
        if (!url) { setStatus('cfg-m3u-status', 'Please enter a playlist URL.', 'err'); return; }
        var cfg = { playlist_url: url };
        save('iptv_m3u_config', cfg);
        save('iptv_source_type', 'm3u');
        try { localStorage.removeItem('iptv_m3u_cache'); } catch (e) {}
        if (typeof IPTV_M3U_CONFIG !== 'undefined') IPTV_M3U_CONFIG = cfg;
        setStatus('cfg-m3u-status', 'Saved — returning to Live TV…', 'ok');
        setTimeout(function () { history.back(); }, 900);
    });

    document.getElementById('cfg-epg-load-btn').addEventListener('click', function () {
        var url   = document.getElementById('cfg-epg-url').value.trim();
        var match = document.getElementById('cfg-epg-match').value;
        if (!url) { setStatus('epg-load-status', 'Enter an XMLTV URL first.', 'err'); return; }
        save('iptv_custom_epg_url', url);
        save('iptv_custom_epg_match', match);
        setStatus('epg-load-status', 'EPG settings saved.', 'ok', 3000);
    });

    document.getElementById('cfg-clear-cache-btn').addEventListener('click', function () {
        try { localStorage.removeItem('iptv_ch_v2'); localStorage.removeItem('iptv_cat_v2'); } catch (e) {}
        setStatus('cfg-clear-ch-status', 'Channel cache cleared.', 'ok', 3000);
    });

    document.getElementById('cfg-clear-epg-btn').addEventListener('click', function () {
        try { localStorage.removeItem('iptv_epg_v2'); localStorage.removeItem('iptv_xmltv_cache'); } catch (e) {}
        setStatus('cfg-clear-epg-status', 'EPG cache cleared.', 'ok', 3000);
    });

    document.getElementById('back-btn').addEventListener('click', function () { history.back(); });

    /* ── D-pad navigation ─────────────────────────────────────────────────── */

    var KEY = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, BACK: 461 };

    var focusables = [];
    var focusIndex = 0;
    var tabList    = [];
    var panelList  = [];

    function rebuildFocusables() {
        var backBtn     = document.getElementById('back-btn');
        var activePanel = document.querySelector('.settings-panel.active');
        tabList   = Array.from(document.querySelectorAll('#tab-strip .tab-btn'));
        panelList = activePanel
            ? Array.from(activePanel.querySelectorAll('input, select, button'))
                  .filter(function (el) { return !el.disabled; })
            : [];
        focusables = [backBtn].concat(tabList).concat(panelList);
    }

    function clearFocusRing() {
        document.querySelectorAll('.tv-focus-visible').forEach(function (el) {
            el.classList.remove('tv-focus-visible');
        });
    }

    function applyFocus(idx) {
        clearFocusRing();
        focusIndex = Math.max(0, Math.min(focusables.length - 1, idx));
        var el = focusables[focusIndex];
        if (!el) return;
        el.classList.add('tv-focus-visible');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* ── WebOS Back key handling ────────────────────────────────────────────
     *
     * On WebOS, pressing Back while the on-screen keyboard is open:
     *   1. WebOS dismisses the keyboard and blurs the input  ← happens first
     *   2. THEN the key event reaches the page
     *
     * This means by the time keydown/keyup fires, the input is already blurred
     * and we have no way to tell from activeElement that the keyboard was open.
     *
     * Solution: track which element had d-pad focus when Enter was pressed to
     * open the keyboard. If Back fires and that element still exists in the
     * focusables list, we know we're just closing the keyboard — stay on page.
     * If _inputEl is null, Back means navigate back.
     *
     * We use keyup for Back (461) because WebOS dispatches it more reliably
     * on keyup after the keyboard dismiss animation completes.
     */
    var _inputEl = null; /* the input that currently has / had keyboard focus */

    /* Set _inputEl when Enter opens a keyboard */
    function openKeyboard(el) {
        _inputEl = el;
        el.focus();
    }

    /* Clear _inputEl when keyboard is dismissed */
    document.addEventListener('focusout', function (e) {
        var tag = e.target ? e.target.tagName : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            /* Use a microtask so _inputEl is still set during the keyup
               that WebOS fires immediately after blur */
            setTimeout(function () { _inputEl = null; }, 50);
        }
    });

    /* All navigation keys on keydown (fast response) */
    window.addEventListener('keydown', function (e) {
        var kc = e.keyCode || e.which;

        /* While keyboard is open, absorb everything except Back (handled keyup) */
        if (_inputEl) {
            if (kc !== KEY.BACK) return; /* let typing keys through */
            e.preventDefault();          /* suppress any default for Back */
            return;
        }

        if (kc === KEY.BACK) { e.preventDefault(); return; } /* handled on keyup */

        var el = focusables[focusIndex];

        if (kc === KEY.UP) {
            e.preventDefault();
            if (panelList.length && el === panelList[0]) {
                var activeTab = tabList.filter(function (b) { return b.classList.contains('active'); })[0];
                var ati = focusables.indexOf(activeTab);
                if (ati !== -1) { applyFocus(ati); return; }
            }
            applyFocus(focusIndex - 1);
            return;
        }

        if (kc === KEY.DOWN) {
            e.preventDefault();
            if (tabList.indexOf(el) !== -1 && panelList.length) {
                applyFocus(focusables.indexOf(panelList[0]));
                return;
            }
            applyFocus(focusIndex + 1);
            return;
        }

        if (kc === KEY.LEFT || kc === KEY.RIGHT) {
            e.preventDefault();
            var dir = kc === KEY.RIGHT ? 1 : -1;
            if (el && tabList.indexOf(el) !== -1) {
                var ci = tabList.indexOf(el);
                var next = ci + dir;
                if (next >= 0 && next < tabList.length) {
                    tabList[next].click();
                    rebuildFocusables();
                    applyFocus(focusables.indexOf(tabList[next]));
                }
            } else if (el) {
                var row = el.closest('.field-row');
                if (row) {
                    var siblings = Array.from(row.querySelectorAll('input, select, button'))
                        .filter(function (n) { return focusables.indexOf(n) !== -1; });
                    var sc = siblings.indexOf(el);
                    var sn = sc + dir;
                    if (sn >= 0 && sn < siblings.length) {
                        applyFocus(focusables.indexOf(siblings[sn]));
                    }
                }
            }
            return;
        }

        if (kc === KEY.ENTER) {
            e.preventDefault();
            if (!el) return;
            if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
                openKeyboard(el);
            } else {
                el.click();
            }
            return;
        }
    });

    /* Back is handled on keyup — by this point WebOS has already closed the
       keyboard and fired focusout, but our 50ms timeout means _inputEl is
       still set, so we can distinguish "closing keyboard" from "go back". */
    window.addEventListener('keyup', function (e) {
        var kc = e.keyCode || e.which;
        if (kc !== KEY.BACK) return;
        e.preventDefault();

        if (_inputEl) {
            /* Keyboard was open — just dismiss it, stay on page */
            _inputEl = null;
            applyFocus(focusIndex);
        } else {
            history.back();
        }
    });

    /* Initial focus */
    rebuildFocusables();
    applyFocus(0);

}());
