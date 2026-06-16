// Auto-updater — checks GitHub for a newer .ipk and prompts the user to install.
// Runs on the homepage so it doesn't interfere with live playback.

const MANIFEST_URL          = "https://github.com/sharktie/lg-iptv/releases/latest/download/manifest.json";
const MANIFEST_FALLBACK_URL = "https://raw.githubusercontent.com/sharktie/lg-iptv/main/manifest.json";

function _updaterFetchWithTimeout(url, timeoutMs) {
    if (timeoutMs === undefined) timeoutMs = 12000;
    const ctrl = new AbortController();
    const tid  = setTimeout(function () { ctrl.abort(); }, timeoutMs);
    return fetch(url, { signal: ctrl.signal, cache: "no-store" })
        .then(function (res) { clearTimeout(tid); return res; })
        .catch(function (err) { clearTimeout(tid); throw err; });
}

function _fetchRemoteManifest() {
    return _updaterFetchWithTimeout(MANIFEST_URL + "?t=" + Date.now())
        .then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        })
        .catch(function () {
            return _updaterFetchWithTimeout(MANIFEST_FALLBACK_URL + "?t=" + Date.now())
                .then(function (res) {
                    if (!res.ok) throw new Error("HTTP " + res.status);
                    return res.json();
                });
        });
}

function _compareVersions(v1, v2) {
    const a = String(v1).split(".").map(Number);
    const b = String(v2).split(".").map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (a[i] || 0) - (b[i] || 0);
        if (diff !== 0) return diff > 0 ? 1 : -1;
    }
    return 0;
}

function checkForUpdates() {
    _updaterFetchWithTimeout("appinfo.json")
        .then(function (res) { if (!res.ok) throw new Error(); return res.json(); })
        .then(function (localInfo) {
            return _fetchRemoteManifest().then(function (manifest) {
                if (!manifest || !manifest.version) return;
                if (_compareVersions(manifest.version, localInfo.version) > 0) {
                    _showUpdatePrompt(localInfo.version, manifest.version, manifest.ipkUrl || manifest.ipk_url);
                }
            });
        })
        .catch(function () {});
}

function _setUpdateProgress(pct, msg) {
    const fill = document.getElementById("update-progress-fill");
    const text = document.getElementById("update-progress-msg");
    if (fill) fill.style.width = pct + "%";
    if (text) text.textContent = msg;
}

function _showUpdateError(overlay, err) {
    let errBox = overlay.querySelector(".update-error-msg");
    if (!errBox) {
        errBox = document.createElement("div");
        errBox.className = "update-error-msg";
        overlay.querySelector(".update-modal-box").appendChild(errBox);
    }
    errBox.textContent = "Install failed: " + (err && err.message ? err.message : String(err));
}

function _installUpdate(ipkUrl, onProgress) {
    return new Promise(function (resolve, reject) {
        if (typeof webOS === "undefined" || !webOS.service) {
            reject(new Error("webOS service not available")); return;
        }
        if (onProgress) onProgress(30, "Requesting install service…");
        webOS.service.request("luna://com.webos.appInstallService/dev/install", {
            method:     "install",
            parameters: { id: "com.sharktie.iptv", ipkUrl: ipkUrl },
            onSuccess:  function (res)  { if (onProgress) onProgress(90, "Finalising…"); resolve(res); },
            onFailure:  function (err2) { reject(new Error(err2 && (err2.errorText || err2.errorCode) ? (err2.errorText || String(err2.errorCode)) : JSON.stringify(err2))); }
        });
    });
}

function _showUpdatePrompt(currentVersion, newVersion, ipkUrl) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "update-modal";
    overlay.innerHTML =
        '<div class="modal-box update-modal-box">' +
            '<div class="update-modal-icon">📺</div>' +
            '<div class="modal-heading">Update Available</div>' +
            '<div class="update-modal-versions">' +
                '<span class="update-ver-old">v' + currentVersion + '</span>' +
                '<span class="update-ver-arrow">→</span>' +
                '<span class="update-ver-new">v' + newVersion + '</span>' +
            '</div>' +
            '<p class="update-modal-desc">A new version is ready to install. The app will restart automatically after updating.</p>' +
            '<div class="modal-btns update-modal-btns">' +
                '<button class="modal-btn" id="update-later-btn">Later</button>' +
                '<button class="modal-btn modal-btn-ok" id="update-now-btn">⬇ Update Now</button>' +
            '</div>' +
            '<div id="update-progress" class="update-progress" style="display:none">' +
                '<div class="update-progress-bar"><div class="update-progress-fill" id="update-progress-fill"></div></div>' +
                '<div class="update-progress-msg" id="update-progress-msg">Installing…</div>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    const laterBtn    = overlay.querySelector("#update-later-btn");
    const nowBtn      = overlay.querySelector("#update-now-btn");
    const progressBox = overlay.querySelector("#update-progress");

    laterBtn.addEventListener("click", function () { overlay.remove(); });

    nowBtn.addEventListener("click", function () {
        laterBtn.disabled = true; nowBtn.disabled = true; nowBtn.textContent = "Installing…";
        progressBox.style.display = "block";
        _setUpdateProgress(10, "Downloading update…");
        _installUpdate(ipkUrl, function (pct, msg) { _setUpdateProgress(pct, msg); })
            .then(function () {
                _setUpdateProgress(100, "Install complete — restarting…");
                setTimeout(function () {
                    try { webOS.platformBack(); } catch (_) {}
                    try { window.close(); } catch (_) {}
                }, 2000);
            })
            .catch(function (err) {
                _setUpdateProgress(0, "");
                progressBox.style.display = "none";
                laterBtn.disabled = false; nowBtn.disabled = false; nowBtn.textContent = "⬇ Update Now";
                _showUpdateError(overlay, err);
            });
    });

    // D-pad focus on the Now button
    setTimeout(function () {
        document.querySelectorAll(".tv-focus-visible").forEach(function (el) { el.classList.remove("tv-focus-visible"); });
        nowBtn.classList.add("tv-focus-visible");
        nowBtn.focus({ preventScroll: true });
    }, 80);
}

// Run 2 seconds after the page is interactive to avoid startup lag
setTimeout(checkForUpdates, 2000);
