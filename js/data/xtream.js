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

function _xtBase(cfg) { return Config.base(cfg); }
function _xtApi(cfg, params) { return Config.apiUrl(cfg, params); }

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
    const info = result && result.user_info;
    if (!info) return null;                       // no user_info: not an auth reply, let it through
    if (Number(info.auth) !== 1) {
        return 'Login rejected — check the username and password.';
    }
    const status = String(info.status || '').toLowerCase();
    if (status && status !== 'active') {
        if (status === 'expired') return 'This subscription has expired.';
        if (status === 'banned')  return 'This account has been banned by the provider.';
        if (status === 'disabled') return 'This account has been disabled by the provider.';
        return 'This account is not active (' + info.status + ').';
    }
    return null;
}

async function xtreamLogin(cfg) {
    const urls = Config.candidateUrls(cfg);
    /* Held rather than returned immediately: a later URL may authenticate fine
       (providers do run mismatched mirrors), so every candidate is still tried
       and the credential complaint is only reported if none of them worked. */
    let authProblem = null;
    for (const url of urls) {
        try {
            const probe  = Object.assign({}, cfg, { server_url: url });
            const result = await Net.json(_xtApi(probe, ''), { timeout: 12000 });
            if (!result) continue;
            const problem = _xtAuthProblem(result);
            if (problem) { authProblem = authProblem || problem; continue; }
            /* Remember the winner so the next launch starts here instead of
               walking the list again. */
            Store.set(Config.KEY_RESOLVED, url);
            return { cfg: probe, data: result };
        } catch (_) {}
    }
    /* Distinguished from "nothing answered" so the caller can say which it was:
       the server being unreachable and the server saying no need different
       responses from the user. */
    return authProblem ? { authFailed: true, message: authProblem } : null;
}

async function xtreamGetLiveChannels(cfg) {
    try {
        const data = await Net.json(_xtApi(cfg, 'action=get_live_streams'), { timeout: 20000 });
        return Array.isArray(data) ? data : (data && data.data) || [];
    } catch (_) { return []; }
}

async function xtreamGetCategories(cfg) {
    try {
        const data = await Net.json(_xtApi(cfg, 'action=get_live_categories'));
        return Array.isArray(data) ? data : [];
    } catch (_) { return []; }
}

/* Short "now and next" guide for one channel. Rethrows HTTP errors — a 403
   here means the panel has EPG disabled for this account, and the caller stops
   asking rather than firing one doomed request per channel. */
async function xtreamGetEPG(cfg, streamId) {
    try {
        const data = await Net.json(
            _xtApi(cfg, 'action=get_short_epg&stream_id=' + encodeURIComponent(streamId) + '&limit=10'));
        return (data && data.epg_listings) || [];
    } catch (err) {
        if (Net.isHttpError(err)) throw err;
        return [];
    }
}

/* EPG titles/descriptions are base64 of UTF-8. atob() alone yields one char per
   byte, which rendered every Greek title as "Î•Î»Î»..." — Charset decodes the
   bytes. */
function xtreamDecodeEPG(str) {
    return Charset.fromBase64(str);
}

/* Full programme guide for one channel, including past programmes. Unlike
   get_short_epg this returns the whole stored archive window, and each listing
   carries `has_archive` (1 = a catch-up recording exists). Titles/descriptions
   are base64 like the short EPG. Used by the Catch-up page. */
async function xtreamGetSimpleDataTable(cfg, streamId) {
    try {
        const data = await Net.json(
            _xtApi(cfg, 'action=get_simple_data_table&stream_id=' + encodeURIComponent(streamId)));
        return (data && data.epg_listings) || [];
    } catch (err) {
        if (Net.isHttpError(err)) throw err;
        return [];
    }
}

/* Two-digit pad helper for the timeshift start string. */
function _ts2(n) { return (n < 10 ? '0' : '') + n; }

/* Format a Date as the `Y-m-d:H-i` string Xtream timeshift endpoints expect,
   in the device's local timezone (matches the wall-clock time shown in the
   programme list — correct when the TV and IPTV server share a timezone, which
   is the common case for same-country providers). */
function xtreamFormatTimeshiftStart(date) {
    return date.getFullYear() + '-' + _ts2(date.getMonth() + 1) + '-' + _ts2(date.getDate()) +
           ':' + _ts2(date.getHours()) + '-' + _ts2(date.getMinutes());
}

/* Candidate catch-up (timeshift) playback URLs for a past programme, in
   priority order so the player can walk the list until one plays — different
   panels expose different endpoints. `start` is the programme's start Date;
   `durationMin` is its length in minutes. */
function xtreamBuildTimeshiftURLs(cfg, streamId, start, durationMin) {
    const baseUrl  = _xtBase(cfg);
    const u        = encodeURIComponent(cfg.username);
    const p        = encodeURIComponent(cfg.password);
    const id       = encodeURIComponent(streamId);
    const dur      = Math.max(1, Math.round(durationMin));
    const startStr = xtreamFormatTimeshiftStart(start);
    return [
        // Path style — colon kept literal (a valid path char; panels that don't
        // url-decode path segments reject %3A).
        `${baseUrl}/timeshift/${u}/${p}/${dur}/${startStr}/${id}.m3u8`,
        // Query style — colon encoded, which is correct for a query value.
        `${baseUrl}/streaming/timeshift.php?username=${u}&password=${p}` +
            `&stream=${id}&start=${encodeURIComponent(startStr)}&duration=${dur}`
    ];
}

function xtreamBuildLiveURL(cfg, streamId) {
    return Config.liveUrl(cfg, streamId);
}
