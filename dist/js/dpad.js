"use strict";

// D-pad / LG TV Remote Navigation
// Requires "disableBackHistoryAPI": true in appinfo.json

var tvFocusZone = "channel-list";
var tvRowIndex = 0;
var tvSidebarIndex = 0;
var tvHeaderIndex = 0; // 0 = home-btn, 1 = settings-btn
var tvRowSubZone = "row";
var _fsEnterTimer = null;
var _rowEnterTimer = null;
var _rowEnterSid = null;
var _ctxMenuIndex = 0;
var _assignPanelIndex = 0;

// ── Back button ───────────────────────────────────────────────────────────────
// Central back handler for all pages.
// Call with a URL to navigate there, or with no argument to exit to Home.
// Pages that need back navigation (e.g. settings, catchup) pass their return
// URL; pages at the root of the app (e.g. index) pass nothing to exit.
//
// Usage:
//   tvGoBack();                    // exit app → webOS Home / exit popup
//   tvGoBack("../index.html");     // navigate back to homepage

function tvGoBack(backUrl) {
  if (backUrl) {
    window.location.href = backUrl;
  } else {
    webOS.platformBack();
  }
}

// Call this from any page that uses dpad.js to declare where Back should navigate.
// If not called, Back exits the app via webOS.platformBack().
//
// Usage (at page init):  tvSetBackUrl("../index.html");
function tvSetBackUrl(url) {
  window._tvBackUrl = url;
}
function initTVNavigation() {
  window.addEventListener("keydown", onTVKeyDown, {
    capture: true,
    passive: false
  });
  if (typeof webOSSystem !== "undefined" && typeof webOSSystem.notifyAppLoaded === "function") {
    webOSSystem.notifyAppLoaded();
  }

  // popstate fires when Back is pressed while the assign panel is open
  // (a history entry was pushed in showAssignPanel so that one Back press
  // closes the panel instead of leaving the page).
  window.addEventListener("popstate", function () {
    if (document.querySelector(".assign-panel")) {
      _assignHistoryPushed = false;
      closeAssignPanels();
      tvRowSubZone = "row";
      requestAnimationFrame(function () {
        return tvFocusRow(tvRowIndex);
      });
    }
  });
}
function _restoreZoneFocus() {
  if (tvFocusZone === "sidebar-header") _focusSidebarHeader();else if (tvFocusZone === "settings" || tvFocusZone === "sidebar-cats") tvFocusSidebarItem(tvSidebarIndex);else if (tvFocusZone === "channel-list") tvFocusRow(tvRowIndex);else setTVZone(tvFocusZone);
}
function _keyCode(e) {
  return e.keyCode || e.which;
}
function _isBack(e) {
  return _keyCode(e) === 461;
}

// webOS TV remote key codes
var _KEY = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  ENTER: 13,
  CH_UP: 427,
  CH_DN: 428
};
function onTVKeyDown(e) {
  var kc = _keyCode(e);
  var modal = document.querySelector(".modal-overlay");
  var assignPanel = document.querySelector(".assign-panel");
  var ctxMenu = document.querySelector(".ctx-menu");
  if (modal) {
    _handleModalKey(e, modal);
    return;
  }
  if (assignPanel) {
    _handleAssignPanelKey(e, assignPanel);
    return;
  }
  if (ctxMenu) {
    _handleCtxMenuKey(e, ctxMenu);
    return;
  }

  // If an input/select is focused (on-screen keyboard open), only handle Back
  // to dismiss — all other keys go to the input as normal.
  var focused = document.activeElement;
  var tag = focused === null || focused === void 0 ? void 0 : focused.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    if (_isBack(e)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      focused.blur();
      _restoreZoneFocus();
    }
    return;
  }
  var isFs = typeof isFullscreen === "function" ? isFullscreen() : false;
  switch (kc) {
    case _KEY.UP:
    case _KEY.DOWN:
      {
        e.preventDefault();
        var d = kc === _KEY.UP ? -1 : 1;
        if (isFs) {
          channelStep(d);
          showOSD();
          return;
        }
        if (tvFocusZone === "channel-list") {
          if (tvRowSubZone === "reorder-up" && d > 0) {
            tvRowSubZone = "reorder-down";
            tvFocusRowButtons();
            return;
          }
          if (tvRowSubZone === "reorder-down" && d < 0) {
            tvRowSubZone = "reorder-up";
            tvFocusRowButtons();
            return;
          }
          tvRowSubZone = "row";
          tvRowIndex = Math.max(0, Math.min(_vsChannels.length - 1, tvRowIndex + d));
          tvFocusRow(tvRowIndex);
        } else if (tvFocusZone === "sidebar-cats" || tvFocusZone === "settings") {
          var items = getSidebarFocusables();
          if (d < 0 && tvSidebarIndex === 0) setTVZone("sidebar-tabs");else {
            tvSidebarIndex = Math.max(0, Math.min(items.length - 1, tvSidebarIndex + d));
            tvFocusSidebarItem(tvSidebarIndex);
          }
        } else if (tvFocusZone === "sidebar-header") {
          if (d > 0) setTVZone("search");
        } else if (tvFocusZone === "search") {
          if (d < 0) setTVZone("sidebar-header");else setTVZone("sidebar-tabs");
        } else if (tvFocusZone === "tl-nav") {
          if (d < 0) setTVZone("channel-list");
        } else if (tvFocusZone === "sidebar-tabs") {
          var _document$querySelect;
          if (d < 0) setTVZone("search");else setTVZone(((_document$querySelect = document.querySelector(".sidebar-tab.active")) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.dataset.tab) === "settings" ? "settings" : "sidebar-cats");
        }
        return;
      }
    case _KEY.LEFT:
      {
        e.preventDefault();
        if (isFs) {
          showOSD();
          return;
        }
        if (tvFocusZone === "sidebar-header") {
          if (tvHeaderIndex > 0) {
            tvHeaderIndex--;
            _focusSidebarHeader();
          }
          return;
        }
        if (tvFocusZone === "settings") {
          var _focused = getSidebarFocusables()[tvSidebarIndex];
          if (_focused !== null && _focused !== void 0 && _focused.classList.contains("source-toggle-btn")) {
            var btns = Array.from(document.querySelectorAll("#cfg-source-type .source-toggle-btn"));
            var ci = btns.indexOf(_focused);
            if (ci > 0) {
              tvSidebarIndex--;
              tvFocusSidebarItem(tvSidebarIndex);
              return;
            }
          }
        }
        if (tvFocusZone === "channel-list") {
          if (tvRowSubZone === "reorder-down") {
            tvRowSubZone = "reorder-up";
            tvFocusRowButtons();
          } else if (tvRowSubZone === "reorder-up") {
            var _en$col;
            var en = _vsChannels[tvRowIndex] ? rowCache.get(String(_vsChannels[tvRowIndex].stream_id)) : null;
            tvRowSubZone = (en === null || en === void 0 || (_en$col = en.col3) === null || _en$col === void 0 || (_en$col = _en$col.style) === null || _en$col === void 0 ? void 0 : _en$col.display) !== "none" ? "assign" : "fav";
            tvFocusRowButtons();
          } else if (tvRowSubZone === "assign") {
            tvRowSubZone = "fav";
            tvFocusRowButtons();
          } else if (tvRowSubZone === "fav") {
            tvRowSubZone = "row";
            tvFocusRow(tvRowIndex);
          } else {
            setTVZone("sidebar-cats");
          }
        } else if (tvFocusZone === "tl-nav") {
          setTVZone("channel-list");
        } else if (tvFocusZone === "sidebar-tabs") {
          _moveSidebarTab(-1);
        }
        return;
      }
    case _KEY.RIGHT:
      {
        e.preventDefault();
        if (isFs) {
          showOSD();
          return;
        }
        if (tvFocusZone === "sidebar-header") {
          if (tvHeaderIndex < 1) {
            tvHeaderIndex++;
            _focusSidebarHeader();
          }
          return;
        }
        if (tvFocusZone === "settings") {
          var _focused2 = getSidebarFocusables()[tvSidebarIndex];
          if (_focused2 !== null && _focused2 !== void 0 && _focused2.classList.contains("source-toggle-btn")) {
            var _btns = Array.from(document.querySelectorAll("#cfg-source-type .source-toggle-btn"));
            var _ci = _btns.indexOf(_focused2);
            if (_ci < _btns.length - 1) {
              tvSidebarIndex++;
              tvFocusSidebarItem(tvSidebarIndex);
              return;
            }
          }
        }
        if (tvFocusZone === "sidebar-cats" || tvFocusZone === "settings") {
          setTVZone("channel-list");
        } else if (tvFocusZone === "channel-list") {
          var ch = _vsChannels[tvRowIndex];
          var entry = ch ? rowCache.get(String(ch.stream_id)) : null;
          if (tvRowSubZone === "row") {
            tvRowSubZone = "fav";
            tvFocusRowButtons();
          } else if (tvRowSubZone === "fav") {
            var _entry$col, _entry$col2;
            if ((entry === null || entry === void 0 || (_entry$col = entry.col3) === null || _entry$col === void 0 || (_entry$col = _entry$col.style) === null || _entry$col === void 0 ? void 0 : _entry$col.display) !== "none") {
              tvRowSubZone = "assign";
              tvFocusRowButtons();
            } else if ((entry === null || entry === void 0 || (_entry$col2 = entry.col4) === null || _entry$col2 === void 0 || (_entry$col2 = _entry$col2.style) === null || _entry$col2 === void 0 ? void 0 : _entry$col2.display) !== "none") {
              tvRowSubZone = "reorder-up";
              tvFocusRowButtons();
            } else setTVZone("tl-nav");
          } else if (tvRowSubZone === "assign") {
            var _entry$col3;
            if ((entry === null || entry === void 0 || (_entry$col3 = entry.col4) === null || _entry$col3 === void 0 || (_entry$col3 = _entry$col3.style) === null || _entry$col3 === void 0 ? void 0 : _entry$col3.display) !== "none") {
              tvRowSubZone = "reorder-up";
              tvFocusRowButtons();
            } else setTVZone("tl-nav");
          } else if (tvRowSubZone === "reorder-up") {
            tvRowSubZone = "reorder-down";
            tvFocusRowButtons();
          } else setTVZone("tl-nav");
        } else if (tvFocusZone === "sidebar-tabs") {
          _moveSidebarTab(1);
        }
        return;
      }
    case _KEY.ENTER:
      {
        e.preventDefault();
        if (tvFocusZone === "sidebar-header") {
          var _hBtns$tvHeaderIndex;
          var _hBtns = [document.getElementById("home-btn"), document.getElementById("settings-btn")];
          (_hBtns$tvHeaderIndex = _hBtns[tvHeaderIndex]) === null || _hBtns$tvHeaderIndex === void 0 || _hBtns$tvHeaderIndex.click();
          return;
        }
        if (isFs) {
          if (_fsEnterTimer) {
            clearTimeout(_fsEnterTimer);
            _fsEnterTimer = null;
            toggleFullscreen();
          } else {
            showOSD();
            _fsEnterTimer = setTimeout(function () {
              _fsEnterTimer = null;
            }, 500);
          }
          return;
        }
        if (tvFocusZone === "channel-list") {
          var _ch = _vsChannels[tvRowIndex];
          if (!_ch) return;
          if (tvRowSubZone === "fav") {
            toggleFav(String(_ch.stream_id));
            var _en = rowCache.get(String(_ch.stream_id));
            if (_en) _en.favBtn.classList.toggle("active", isFav(String(_ch.stream_id)));
            if (activeCategory === "favs") applyFilters();
          } else if (tvRowSubZone === "assign") {
            var _rowCache$get;
            (_rowCache$get = rowCache.get(String(_ch.stream_id))) === null || _rowCache$get === void 0 || (_rowCache$get = _rowCache$get.assignBtn) === null || _rowCache$get === void 0 || _rowCache$get.click();
          } else if (tvRowSubZone === "reorder-up") {
            _reorderAndRefocus(String(_ch.stream_id), -1, "reorder-up");
          } else if (tvRowSubZone === "reorder-down") {
            _reorderAndRefocus(String(_ch.stream_id), 1, "reorder-down");
          } else {
            var sid = String(_ch.stream_id);
            var alreadyPlaying = currentChannel && String(currentChannel.stream_id) === sid;
            if (_rowEnterTimer && _rowEnterSid === sid) {
              // Double press — go fullscreen (select first if not already playing)
              clearTimeout(_rowEnterTimer);
              _rowEnterTimer = null;
              _rowEnterSid = null;
              if (!alreadyPlaying) selectChannel(_ch);
              toggleFullscreen();
            } else if (alreadyPlaying) {
              // Single press on active channel — fullscreen immediately, no restart
              clearTimeout(_rowEnterTimer);
              _rowEnterTimer = null;
              _rowEnterSid = null;
              toggleFullscreen();
            } else {
              // Single press on a different channel — select/play
              clearTimeout(_rowEnterTimer);
              _rowEnterSid = sid;
              _rowEnterTimer = setTimeout(function () {
                _rowEnterTimer = null;
                _rowEnterSid = null;
              }, 400);
              selectChannel(_ch);
            }
          }
        } else if (tvFocusZone === "search") {
          var el = document.getElementById("search");
          if (el) {
            el.focus();
            try {
              el.setSelectionRange(el.value.length, el.value.length);
            } catch (_) {}
          }
        } else if (tvFocusZone === "sidebar-cats") {
          var _getSidebarFocusables;
          (_getSidebarFocusables = getSidebarFocusables()[tvSidebarIndex]) === null || _getSidebarFocusables === void 0 || _getSidebarFocusables.click();
        } else if (tvFocusZone === "settings") {
          var _el = getSidebarFocusables()[tvSidebarIndex];
          if (!_el) return;
          if (_el.tagName === "INPUT" || _el.tagName === "TEXTAREA" || _el.tagName === "SELECT") {
            _el.focus();
            if (_el.tagName !== "SELECT") {
              try {
                _el.setSelectionRange(_el.value.length, _el.value.length);
              } catch (_) {}
            }
          } else {
            _el.click();
          }
        } else if (tvFocusZone === "tl-nav") {
          var _document$querySelect2;
          (_document$querySelect2 = document.querySelector(".tl-nav-btn.tv-focus-visible")) === null || _document$querySelect2 === void 0 || _document$querySelect2.click();
        } else if (tvFocusZone === "sidebar-tabs") {
          var _document$querySelect3;
          (_document$querySelect3 = document.querySelector(".sidebar-tab.tv-focus-visible")) === null || _document$querySelect3 === void 0 || _document$querySelect3.click();
        }
        return;
      }
    case 461:
      {
        // Back (webOS)
        e.preventDefault();
        e.stopImmediatePropagation();
        if (isFs) {
          toggleFullscreen();
          return;
        }
        tvGoBack(window._tvBackUrl);
        return;
      }
    case _KEY.CH_UP:
      e.preventDefault();
      channelStep(-1);
      if (isFs) showOSD();
      return;
    case _KEY.CH_DN:
      e.preventDefault();
      channelStep(1);
      if (isFs) showOSD();
      return;
  }
}

// ── Zone management ───────────────────────────────────────────────────────────

function setTVZone(zone) {
  tvFocusZone = zone;
  tvRowSubZone = "row";
  document.querySelectorAll(".tv-focus-visible").forEach(function (el) {
    return el.classList.remove("tv-focus-visible");
  });
  document.querySelectorAll(".tv-row-active").forEach(function (el) {
    return el.classList.remove("tv-row-active");
  });
  if (zone === "sidebar-header") {
    tvHeaderIndex = 0;
    _focusSidebarHeader();
  } else if (zone === "sidebar-cats" || zone === "settings") {
    tvSidebarIndex = Math.max(0, Math.min(getSidebarFocusables().length - 1, tvSidebarIndex));
    tvFocusSidebarItem(tvSidebarIndex);
  } else if (zone === "channel-list") {
    tvRowIndex = Math.max(0, Math.min(_vsChannels.length - 1, tvRowIndex));
    tvFocusRow(tvRowIndex);
  } else if (zone === "tl-nav") {
    var _document$getElementB;
    (_document$getElementB = document.getElementById("tl-now")) === null || _document$getElementB === void 0 || _document$getElementB.classList.add("tv-focus-visible");
  } else if (zone === "sidebar-tabs") {
    var _ref;
    tvSidebarIndex = 0;
    (_ref = document.querySelector(".sidebar-tab.active") || document.querySelector(".sidebar-tab")) === null || _ref === void 0 || _ref.classList.add("tv-focus-visible");
  } else if (zone === "search") {
    var _document$getElementB2;
    (_document$getElementB2 = document.getElementById("search")) === null || _document$getElementB2 === void 0 || _document$getElementB2.classList.add("tv-focus-visible");
  }
}
function _focusSidebarHeader() {
  _clearFocus();
  var btns = [document.getElementById("home-btn"), document.getElementById("settings-btn")];
  var el = btns[tvHeaderIndex];
  if (el) {
    el.classList.add("tv-focus-visible");
  }
}

// ── Focus helpers ─────────────────────────────────────────────────────────────

function getSidebarFocusables() {
  var panel = document.querySelector(".sidebar-panel.active");
  if (!panel) return [];
  return Array.from(panel.querySelectorAll(".cat-btn, .cat-section-hdr, .cat-sub-btn, .cat-add-grp-btn, .settings-btn, .settings-input, .settings-select, .source-toggle-btn")).filter(function (el) {
    return el.offsetParent !== null;
  });
}
function _clearFocus() {
  document.querySelectorAll(".tv-focus-visible").forEach(function (el) {
    return el.classList.remove("tv-focus-visible");
  });
}
function tvFocusSidebarItem(idx) {
  _clearFocus();
  var el = getSidebarFocusables()[idx];
  if (el) {
    el.classList.add("tv-focus-visible");
    el.scrollIntoView({
      block: "nearest"
    });
  }
}
function tvFocusRow(idx) {
  _clearFocus();
  document.querySelectorAll(".tv-row-active").forEach(function (el) {
    return el.classList.remove("tv-row-active");
  });
  var ch = _vsChannels[idx];
  if (!ch) return;
  scrollTVRowIntoView(idx);
  requestAnimationFrame(function () {
    var entry = rowCache.get(String(ch.stream_id));
    if (entry) {
      entry.col1.classList.add("tv-focus-visible");
      entry.row.focus({
        preventScroll: true
      });
    }
  });
}
function tvFocusRowButtons() {
  _clearFocus();
  var ch = _vsChannels[tvRowIndex];
  if (!ch) return;
  var entry = rowCache.get(String(ch.stream_id));
  if (!entry) return;
  scrollTVRowIntoView(tvRowIndex);
  requestAnimationFrame(function () {
    var _entry$col4;
    document.querySelectorAll(".tv-row-active").forEach(function (el) {
      return el.classList.remove("tv-row-active");
    });
    entry.row.classList.add("tv-row-active");
    if (tvRowSubZone === "fav") entry.col2.classList.add("tv-focus-visible");else if (tvRowSubZone === "reorder-up" && entry.upBtn) entry.upBtn.classList.add("tv-focus-visible");else if (tvRowSubZone === "reorder-down" && entry.dnBtn) entry.dnBtn.classList.add("tv-focus-visible");else if (tvRowSubZone === "assign" && ((_entry$col4 = entry.col3) === null || _entry$col4 === void 0 || (_entry$col4 = _entry$col4.style) === null || _entry$col4 === void 0 ? void 0 : _entry$col4.display) !== "none") entry.col3.classList.add("tv-focus-visible");
  });
}
function scrollTVRowIntoView(idx) {
  var wrap = document.getElementById("channel-list-wrap");
  var top = idx * VS_ROW_H,
    bot = top + VS_ROW_H;
  if (top < wrap.scrollTop) wrap.scrollTop = top - VS_ROW_H;else if (bot > wrap.scrollTop + wrap.clientHeight) wrap.scrollTop = bot - wrap.clientHeight + VS_ROW_H;
}
function _moveSidebarTab(delta) {
  var _tabs$Math$max;
  var tabs = Array.from(document.querySelectorAll(".sidebar-tab"));
  var cur = tabs.findIndex(function (t) {
    return t.classList.contains("tv-focus-visible");
  });
  _clearFocus();
  (_tabs$Math$max = tabs[Math.max(0, Math.min(tabs.length - 1, (cur < 0 ? 0 : cur) + delta))]) === null || _tabs$Math$max === void 0 || _tabs$Math$max.classList.add("tv-focus-visible");
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function _handleModalKey(e, modal) {
  if (_isBack(e)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    modal.remove();
    requestAnimationFrame(function () {
      return tvFocusSidebarItem(tvSidebarIndex);
    });
    return;
  }
  var kc = _keyCode(e);
  var inp = modal.querySelector(".modal-input");
  var okBtn = modal.querySelector(".modal-btn-ok");
  var cancelBtn = modal.querySelector(".modal-btn:not(.modal-btn-ok)");
  var focused = modal.querySelector(".modal-btn.tv-focus-visible");
  if (document.activeElement === inp) {
    if (kc === _KEY.ENTER) {
      e.preventDefault();
      inp.blur();
      _setModalFocus(modal, okBtn);
    }
    return;
  }
  e.preventDefault();
  if (kc === _KEY.UP || kc === _KEY.DOWN || kc === _KEY.LEFT || kc === _KEY.RIGHT) {
    _setModalFocus(modal, focused === okBtn ? cancelBtn : focused === cancelBtn ? okBtn : inp);
    return;
  }
  if (kc === _KEY.ENTER) {
    if (focused) {
      focused.click();
      return;
    }
    inp === null || inp === void 0 || inp.focus();
    return;
  }
}
function _setModalFocus(modal, el) {
  modal.querySelectorAll(".tv-focus-visible").forEach(function (x) {
    return x.classList.remove("tv-focus-visible");
  });
  if (el) {
    el.classList.add("tv-focus-visible");
    if (el.tagName === "INPUT") el.focus();
  }
}

// ── Assign panel ──────────────────────────────────────────────────────────────

function _handleAssignPanelKey(e, panel) {
  if (_isBack(e)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    history.back();
    return;
  }
  var kc = _keyCode(e);
  var items = Array.from(panel.querySelectorAll(".assign-row, .assign-new-btn"));
  if (!items.length) {
    e.preventDefault();
    return;
  }
  if (kc === _KEY.UP || kc === _KEY.DOWN) {
    e.preventDefault();
    _assignPanelIndex = Math.max(0, Math.min(items.length - 1, _assignPanelIndex + (kc === _KEY.DOWN ? 1 : -1)));
    _focusAssignItem(panel, items);
    return;
  }
  if (kc === _KEY.ENTER) {
    e.preventDefault();
    var el = items[_assignPanelIndex];
    if (!el) return;
    if (el.classList.contains("assign-new-btn")) {
      el.click();
      return;
    }
    var cb = el.querySelector("input[type='checkbox']");
    if (cb) {
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change"));
    }
    _focusAssignItem(panel, items);
    return;
  }
  e.preventDefault();
}
function _focusAssignItem(panel, items) {
  panel.querySelectorAll(".tv-focus-visible").forEach(function (el) {
    return el.classList.remove("tv-focus-visible");
  });
  var el = items[_assignPanelIndex];
  if (el) {
    el.classList.add("tv-focus-visible");
    el.scrollIntoView({
      block: "nearest"
    });
  }
}

// ── Context menu ──────────────────────────────────────────────────────────────

function _handleCtxMenuKey(e, menu) {
  if (_isBack(e)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    closeContextMenus();
    requestAnimationFrame(function () {
      return tvFocusSidebarItem(tvSidebarIndex);
    });
    return;
  }
  var kc = _keyCode(e);
  var items = Array.from(menu.querySelectorAll(".ctx-item"));
  if (!items.length) {
    e.preventDefault();
    return;
  }
  if (kc === _KEY.UP || kc === _KEY.DOWN) {
    e.preventDefault();
    _ctxMenuIndex = Math.max(0, Math.min(items.length - 1, _ctxMenuIndex + (kc === _KEY.DOWN ? 1 : -1)));
    _focusCtxItem(menu, items);
    return;
  }
  if (kc === _KEY.ENTER) {
    var _items$_ctxMenuIndex;
    e.preventDefault();
    (_items$_ctxMenuIndex = items[_ctxMenuIndex]) === null || _items$_ctxMenuIndex === void 0 || _items$_ctxMenuIndex.click();
    return;
  }
  e.preventDefault();
}
function _focusCtxItem(menu, items) {
  menu.querySelectorAll(".tv-focus-visible").forEach(function (el) {
    return el.classList.remove("tv-focus-visible");
  });
  var el = items[_ctxMenuIndex];
  if (el) {
    el.classList.add("tv-focus-visible");
    el.scrollIntoView({
      block: "nearest"
    });
  }
}