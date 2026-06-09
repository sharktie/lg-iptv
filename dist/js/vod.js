"use strict";

/* vod.js — VOD/Series browser, Netflix-style (WebOS)
   ─────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────────────── */
  function getCfg() {
    try {
      var s = JSON.parse(localStorage.getItem('iptv_custom_config'));
      if (s && s.server_url) return s;
    } catch (e) {}
    if (typeof IPTV_CONFIG !== 'undefined' && IPTV_CONFIG && IPTV_CONFIG.server_url) return IPTV_CONFIG;
    return null;
  }
  function apiUrl(params) {
    var base = (cfg.server_url || '').replace(/\/+$/, '');
    return base + '/player_api.php?username=' + encodeURIComponent(cfg.username) + '&password=' + encodeURIComponent(cfg.password) + '&' + params;
  }
  function buildMovieUrl(streamId, ext) {
    var base = (cfg.server_url || '').replace(/\/+$/, '');
    return base + '/movie/' + encodeURIComponent(cfg.username) + '/' + encodeURIComponent(cfg.password) + '/' + encodeURIComponent(streamId) + '.' + (ext || 'mp4');
  }

  /* ── Cache (5-hour TTL) ─────────────────────────────────────────── */
  var CACHE_TTL = 5 * 60 * 60 * 1000;
  function cacheGet(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj.ts > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      return obj.data;
    } catch (e) {
      return null;
    }
  }
  function cacheSet(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({
        ts: Date.now(),
        data: data
      }));
    } catch (e) {}
  }
  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function fetchCached(cacheKey, url) {
    var cached = cacheGet(cacheKey);
    if (cached) return Promise.resolve(cached);
    return fetchJSON(url).then(function (data) {
      cacheSet(cacheKey, data);
      return data;
    });
  }

  /* ── Favourites ─────────────────────────────────────────────────── */
  function loadFavs() {
    try {
      return JSON.parse(localStorage.getItem('vod_favs')) || [];
    } catch (e) {
      return [];
    }
  }
  function saveFavs(f) {
    try {
      localStorage.setItem('vod_favs', JSON.stringify(f));
    } catch (e) {}
  }
  function isFav(type, catId) {
    return loadFavs().some(function (f) {
      return f.type === type && f.catId === catId;
    });
  }
  function toggleFav(type, catId, catName) {
    var favs = loadFavs();
    var idx = favs.findIndex(function (f) {
      return f.type === type && f.catId === catId;
    });
    if (idx === -1) favs.push({
      type: type,
      catId: catId,
      name: catName
    });else favs.splice(idx, 1);
    saveFavs(favs);
    renderSidebar();
    setTimeout(function () {
      var focusables = getFocusableItems();
      var target = focusables.find(function (el) {
        return el.dataset.type === type && el.dataset.catId === catId;
      });
      applyCatFocus(target ? focusables.indexOf(target) : catIndex);
    }, 40);
  }

  /* ── State ──────────────────────────────────────────────────────── */
  var cfg = null;
  var allItems = [];
  var searchQuery = '';
  var activeType = 'movie';
  var activeCatId = null;
  var sortMode = 'default';
  var groups = [{
    id: 'favs',
    label: 'Favourites',
    cats: [],
    open: true,
    special: true
  }, {
    id: 'movie',
    label: 'Movies',
    cats: [],
    open: true
  }, {
    id: 'series',
    label: 'TV Series',
    cats: [],
    open: false
  }];
  var zone = 'sidebar';
  var catIndex = 0;
  var gridIndex = 0;
  var detailIndex = 0;

  /* ── DOM refs ───────────────────────────────────────────────────── */
  var elCatList = document.getElementById('cat-list');
  var elGrid = document.getElementById('vod-grid');
  var elLoading = document.getElementById('vod-loading');
  var elEmpty = document.getElementById('vod-empty');
  var elCatName = document.getElementById('vod-cat-name');
  var elCount = document.getElementById('vod-count');
  var elSearch = document.getElementById('cat-search');
  var elDetailOverlay = document.getElementById('detail-overlay');
  var elBackBtn = document.getElementById('back-btn');
  var elFilterBar = document.getElementById('vod-filter-bar');

  /* ── Virtual / windowed grid ─────────────────────────────────────
     Renders BATCH_SIZE cards at a time; appends more on scroll.
     Cards use IntersectionObserver for lazy-loading poster images.  */
  var BATCH_SIZE = 48;
  var _renderData = [];
  var _renderPos = 0;
  var _imgObserver = null;

  /* Set up IntersectionObserver once — after DOM refs are live */
  if ('IntersectionObserver' in window) {
    _imgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          _imgObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px'
    });
  }
  function renderBatch() {
    var end = Math.min(_renderPos + BATCH_SIZE, _renderData.length);
    var frag = document.createDocumentFragment();
    for (var i = _renderPos; i < end; i++) frag.appendChild(makeCard(_renderData[i]));
    elGrid.appendChild(frag);
    _renderPos = end;
  }
  function initGrid(items) {
    /* Detach observer before wiping DOM */
    if (_imgObserver) {
      elGrid.querySelectorAll('img[data-src]').forEach(function (img) {
        _imgObserver.unobserve(img);
      });
    }
    elGrid.innerHTML = '';
    _renderData = items;
    _renderPos = 0;
    elEmpty.hidden = items.length > 0;
    if (!items.length) {
      elEmpty.textContent = searchQuery ? 'No titles match "' + searchQuery + '"' : 'No titles found.';
    }
    elCount.textContent = items.length ? items.length.toLocaleString() + ' titles' : '';
    if (items.length) renderBatch();
  }

  /* Scroll listener — attached after elGrid is defined */
  elGrid.addEventListener('scroll', function () {
    if (_renderPos >= _renderData.length) return;
    if (elGrid.scrollTop + elGrid.clientHeight >= elGrid.scrollHeight - 500) renderBatch();
  });

  /* ── Sort state ─────────────────────────────────────────────────── */
  function applySortFilter(items) {
    var arr = items.slice();
    if (sortMode === 'az') {
      arr.sort(function (a, b) {
        return (a.name || a.title || '').localeCompare(b.name || b.title || '');
      });
    } else if (sortMode === 'rating') {
      arr.sort(function (a, b) {
        return parseFloat(b.rating || b.rating_5based || 0) - parseFloat(a.rating || a.rating_5based || 0);
      });
    } else if (sortMode === 'year') {
      arr.sort(function (a, b) {
        return parseInt(b.year || b.releaseDate || 0, 10) - parseInt(a.year || a.releaseDate || 0, 10);
      });
    }
    return arr;
  }

  /* ── Init ───────────────────────────────────────────────────────── */
  cfg = getCfg();
  if (!cfg) {
    showError('No IPTV config found. Go to Settings first.');
    return;
  }
  elBackBtn.addEventListener('click', function () {
    history.back();
  });
  document.getElementById('detail-close').addEventListener('click', closeDetail);
  document.getElementById('detail-close-btn').addEventListener('click', closeDetail);
  document.getElementById('detail-backdrop-scrim').addEventListener('click', closeDetail);
  document.getElementById('detail-play-btn').addEventListener('click', playCurrentDetail);

  /* Search in grid titles */
  elSearch.addEventListener('input', function () {
    searchQuery = elSearch.value.trim().toLowerCase();
    initGrid(applySortFilter(filterItems()));
    gridIndex = 0;
  });

  /* Filter chips */
  elFilterBar.addEventListener('click', function (e) {
    var chip = e.target.closest('.filter-chip');
    if (!chip) return;
    elFilterBar.querySelectorAll('.filter-chip').forEach(function (c) {
      c.classList.remove('active');
    });
    chip.classList.add('active');
    sortMode = chip.dataset.sort || 'default';
    initGrid(applySortFilter(filterItems()));
    if (zone === 'filter') applyFilterFocus(getFilterChips().indexOf(chip));
  });

  /* ── Show empty state until user selects a category ─────────────── */
  setLoading(false);
  elEmpty.hidden = false;
  elEmpty.textContent = 'Select a category to browse';

  /* ── Load categories only (parallel, cached) ─────────────────────
     Categories are tiny payloads — load both at once, render as soon
     as either resolves so the sidebar appears immediately.            */
  var cacheKeyMovie = 'vod_cats_movie_' + cfg.server_url;
  var cacheKeySeries = 'vod_cats_series_' + cfg.server_url;
  var movieCatsPromise = fetchCached(cacheKeyMovie, apiUrl('action=get_vod_categories')).catch(function () {
    return [];
  });
  var seriesCatsPromise = fetchCached(cacheKeySeries, apiUrl('action=get_series_categories')).catch(function () {
    return [];
  });

  /* Render sidebar as soon as movie cats arrive (usually first) */
  movieCatsPromise.then(function (cats) {
    groups[1].cats = Array.isArray(cats) ? cats : [];
    renderSidebar();
  });

  /* Then update with series cats */
  seriesCatsPromise.then(function (cats) {
    groups[2].cats = Array.isArray(cats) ? cats : [];
    renderSidebar();
  });

  /* ── Sidebar ────────────────────────────────────────────────────── */
  function renderSidebar() {
    var prevScrollTop = elCatList.scrollTop;
    elCatList.innerHTML = '';
    groups.forEach(function (group) {
      if (group.id === 'favs') {
        var favs = loadFavs();
        group.cats = favs;
        if (!favs.length) return;
      }

      /* Group header */
      var header = document.createElement('li');
      header.className = 'cat-group-header';
      header.dataset.groupId = group.id;
      header.dataset.open = group.open ? 'true' : 'false';
      var arrow = document.createElement('span');
      arrow.className = 'cat-group-arrow';
      arrow.textContent = '▶';
      header.appendChild(arrow);
      var labelSpan = document.createElement('span');
      labelSpan.textContent = group.label;
      header.appendChild(labelSpan);
      header.addEventListener('click', function () {
        toggleGroup(group.id);
      });
      elCatList.appendChild(header);
      if (group.id === 'favs') {
        group.cats.forEach(function (fav) {
          elCatList.appendChild(makeCatItem(fav.type, fav.catId, fav.name, group.open, true));
        });
        return;
      }
      elCatList.appendChild(makeCatItem(group.id, 'all', 'All ' + group.label, group.open, false));
      group.cats.forEach(function (cat) {
        elCatList.appendChild(makeCatItem(group.id, cat.category_id, cat.category_name || 'Unnamed', group.open, false));
      });
    });
    updateSidebarActive();
    elCatList.scrollTop = prevScrollTop;
    setTimeout(function () {
      applyCatFocus(catIndex);
    }, 30);
  }
  function makeCatItem(type, catId, name, visible, isFavItem) {
    var li = document.createElement('li');
    li.className = 'cat-item cat-child';
    li.dataset.type = type;
    li.dataset.catId = catId;
    li.style.display = visible ? '' : 'none';
    var nameSpan = document.createElement('span');
    nameSpan.className = 'cat-item-name';
    nameSpan.textContent = name;
    li.appendChild(nameSpan);
    var star = document.createElement('button');
    star.className = 'cat-fav-btn' + (!isFavItem && isFav(type, catId) ? ' active' : isFavItem ? ' active' : '');
    star.title = isFavItem ? 'Remove favourite' : 'Add to favourites';
    star.textContent = '★';
    star.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleFav(type, catId, name);
    });
    li.appendChild(star);
    li.addEventListener('click', function () {
      selectItem(type, catId, name);
    });
    return li;
  }
  function toggleGroup(groupId) {
    var group = groups.filter(function (g) {
      return g.id === groupId;
    })[0];
    if (!group) return;
    group.open = !group.open;
    var header = elCatList.querySelector('.cat-group-header[data-group-id="' + groupId + '"]');
    if (header) header.dataset.open = group.open ? 'true' : 'false';

    /* Show/hide children */
    if (groupId === 'favs') {
      renderSidebar();
    } else {
      elCatList.querySelectorAll('.cat-child[data-type="' + groupId + '"]').forEach(function (el) {
        el.style.display = group.open ? '' : 'none';
      });
    }
    var all = getFocusableItems();
    var idx = header ? all.indexOf(header) : catIndex;
    applyCatFocus(idx !== -1 ? idx : catIndex);
  }
  function selectItem(type, catId, name) {
    activeType = type;
    activeCatId = catId;
    updateSidebarActive();
    loadContent(type, catId, name);
  }
  function updateSidebarActive() {
    elCatList.querySelectorAll('.cat-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.type === activeType && el.dataset.catId === activeCatId);
    });
  }
  function getFocusableItems() {
    return Array.from(elCatList.children).filter(function (el) {
      return el.style.display !== 'none';
    });
  }

  /* ── Content loading ────────────────────────────────────────────── */
  function loadContent(type, catId, catName) {
    elCatName.textContent = catName;
    setLoading(true);
    allItems = [];
    initGrid([]);
    var action = type === 'series' ? 'get_series' : 'get_vod_streams';
    var params = 'action=' + action;
    if (catId !== 'all') params += '&category_id=' + encodeURIComponent(catId);
    var ck = 'vod_content_' + cfg.server_url + '_' + type + '_' + catId;
    fetchCached(ck, apiUrl(params)).then(function (data) {
      allItems = Array.isArray(data) ? data : [];
      setLoading(false);
      initGrid(applySortFilter(filterItems()));
      gridIndex = 0;
      if (zone === 'grid') applyGridFocus(0);
    }).catch(function (err) {
      console.error('VOD load error:', err);
      setLoading(false);
      showError('Failed to load content. Check your connection and config.');
    });
  }

  /* ── Filtering ──────────────────────────────────────────────────── */
  function filterItems() {
    if (!searchQuery) return allItems;
    return allItems.filter(function (m) {
      return (m.name || m.title || '').toLowerCase().indexOf(searchQuery) !== -1;
    });
  }

  /* ── Card factory ───────────────────────────────────────────────── */
  function makeCard(m) {
    var card = document.createElement('div');
    card.className = 'vod-card';
    card.setAttribute('role', 'listitem');
    var icon = m.stream_icon || m.cover || m.backdrop_path || '';
    if (icon) {
      var img = document.createElement('img');
      img.className = 'vod-card-poster';
      img.alt = m.name || m.title || '';
      img.decoding = 'async';
      if (_imgObserver) {
        /* Lazy via IntersectionObserver */
        img.dataset.src = icon;
        img.src = '';
        _imgObserver.observe(img);
      } else {
        img.loading = 'lazy';
        img.src = icon;
      }
      img.onerror = function () {
        var ph = makePlaceholder(m.name || m.title || '');
        if (img.parentNode === card) card.replaceChild(ph, img);
      };
      card.appendChild(img);
    } else {
      card.appendChild(makePlaceholder(m.name || m.title || ''));
    }
    var info = document.createElement('div');
    info.className = 'vod-card-info';
    var titleEl = document.createElement('div');
    titleEl.className = 'vod-card-title';
    titleEl.textContent = m.name || m.title || 'Unknown';
    info.appendChild(titleEl);
    var meta = document.createElement('div');
    meta.className = 'vod-card-meta';
    var year = String(m.year || m.releaseDate || '').slice(0, 4);
    if (year) {
      var yearEl = document.createElement('span');
      yearEl.className = 'vod-card-year';
      yearEl.textContent = year;
      meta.appendChild(yearEl);
    }
    var rating = parseFloat(m.rating || m.rating_5based || 0);
    if (rating > 0) {
      var rEl = document.createElement('span');
      rEl.className = 'vod-card-rating';
      rEl.textContent = rating.toFixed(1);
      meta.appendChild(rEl);
    }
    if (activeType === 'series') {
      var badge = document.createElement('span');
      badge.className = 'vod-card-type-badge';
      badge.textContent = 'Series';
      meta.appendChild(badge);
    }
    info.appendChild(meta);
    card.appendChild(info);
    card.addEventListener('click', function () {
      openDetail(m);
    });
    return card;
  }
  function makePlaceholder(text) {
    var ph = document.createElement('div');
    ph.className = 'vod-card-poster-placeholder';
    var t = document.createElement('span');
    t.className = 'vod-card-placeholder-title';
    t.textContent = text;
    ph.appendChild(t);
    return ph;
  }

  /* ── Detail overlay ─────────────────────────────────────────────── */
  var _detailItem = null;
  function openDetail(item) {
    _detailItem = item;
    zone = 'detail';
    detailIndex = 0;
    var title = item.name || item.title || '';
    var year = String(item.year || item.releaseDate || '').slice(0, 4);
    var rating = parseFloat(item.rating || item.rating_5based || 0);
    var icon = item.stream_icon || item.cover || item.backdrop_path || '';
    document.getElementById('detail-title').textContent = title;
    document.getElementById('detail-year').textContent = year;
    document.getElementById('detail-duration').textContent = item.duration ? item.duration + ' min' : '';
    document.getElementById('detail-genre').textContent = item.genre || '';
    document.getElementById('detail-rating').textContent = rating > 0 ? rating.toFixed(1) : '';
    document.getElementById('detail-plot').textContent = item.plot || item.description || '';
    document.getElementById('detail-cast').textContent = item.cast || '';
    document.getElementById('detail-director').textContent = item.director || '';

    /* Poster */
    var poster = document.getElementById('detail-poster');
    poster.src = icon || '';
    poster.style.display = icon ? 'block' : 'none';

    /* Full-bleed cinematic backdrop */
    var bd = document.getElementById('detail-backdrop-img');
    bd.style.backgroundImage = icon ? 'url(' + icon + ')' : 'none';

    /* Lazy-fetch extended info if plot is missing */
    var infoId = item.stream_id || item.series_id;
    if (infoId && !item.plot && !item.description) {
      var action = activeType === 'series' ? 'action=get_series_info&series_id=' : 'action=get_vod_info&vod_id=';
      fetchJSON(apiUrl(action + infoId)).then(function (data) {
        var info = data && (data.info || data.movie_data || data);
        if (!info) return;
        if (info.plot || info.description) document.getElementById('detail-plot').textContent = info.plot || info.description;
        if (info.cast) document.getElementById('detail-cast').textContent = info.cast;
        if (info.director) document.getElementById('detail-director').textContent = info.director;
        if (info.genre) document.getElementById('detail-genre').textContent = info.genre;
        if (info.duration_secs) document.getElementById('detail-duration').textContent = Math.round(info.duration_secs / 60) + ' min';
        if ((info.movie_image || info.cover) && !icon) {
          var newIcon = info.movie_image || info.cover;
          poster.src = newIcon;
          poster.style.display = 'block';
          bd.style.backgroundImage = 'url(' + newIcon + ')';
        }
      }).catch(function () {});
    }
    elDetailOverlay.hidden = false;
    applyDetailFocus(0);
  }
  function closeDetail() {
    elDetailOverlay.hidden = true;
    _detailItem = null;
    /* Blank backdrop to free memory */
    document.getElementById('detail-backdrop-img').style.backgroundImage = 'none';
    zone = 'grid';
    applyGridFocus(gridIndex);
  }
  function playCurrentDetail() {
    if (!_detailItem) return;
    var title = _detailItem.name || _detailItem.title || '';
    if (activeType === 'series') {
      try {
        localStorage.setItem('iptv_series_id', _detailItem.series_id);
      } catch (e) {}
      try {
        localStorage.setItem('iptv_play_title', title);
      } catch (e) {}
      window.location.href = '../pages/series.html?id=' + encodeURIComponent(_detailItem.series_id) + '&title=' + encodeURIComponent(title);
    } else {
      var ext = _detailItem.container_extension || 'mp4';
      var url = buildMovieUrl(_detailItem.stream_id, ext);
      try {
        localStorage.setItem('iptv_play_url', url);
      } catch (e) {}
      try {
        localStorage.setItem('iptv_play_title', title);
      } catch (e) {}
      window.location.href = '../pages/player.html?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title);
    }
  }

  /* ── Loading / error ────────────────────────────────────────────── */
  function setLoading(on) {
    elLoading.style.display = on ? 'flex' : 'none';
    elGrid.style.display = on ? 'none' : '';
    if (on) elEmpty.hidden = true;
  }
  function showError(msg) {
    setLoading(false);
    elEmpty.textContent = msg;
    elEmpty.hidden = false;
  }

  /* ── D-pad focus helpers ────────────────────────────────────────── */
  function clearRings() {
    document.querySelectorAll('.tv-focus-visible').forEach(function (el) {
      el.classList.remove('tv-focus-visible');
    });
  }
  function applyCatFocus(idx) {
    clearRings();
    var items = getFocusableItems();
    if (!items.length) return;
    catIndex = Math.max(0, Math.min(items.length - 1, idx));
    items[catIndex].classList.add('tv-focus-visible');
    items[catIndex].scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  }
  function getGridCards() {
    return Array.from(elGrid.querySelectorAll('.vod-card'));
  }
  function applyGridFocus(idx) {
    clearRings();
    var cards = getGridCards();
    if (!cards.length) return;
    gridIndex = Math.max(0, Math.min(cards.length - 1, idx));
    cards[gridIndex].classList.add('tv-focus-visible');
    cards[gridIndex].scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
    if (gridIndex >= _renderPos - 20) renderBatch();
  }
  function getGridCols() {
    var cards = getGridCards();
    if (cards.length < 2) return 1;
    var firstTop = Math.round(cards[0].getBoundingClientRect().top);
    var cols = 0;
    for (var i = 0; i < cards.length; i++) {
      if (Math.round(cards[i].getBoundingClientRect().top) !== firstTop) break;
      cols++;
    }
    return cols || 1;
  }
  function getDetailBtns() {
    return Array.from(document.querySelectorAll('#detail-actions .detail-btn'));
  }
  function applyDetailFocus(idx) {
    clearRings();
    var btns = getDetailBtns();
    if (!btns.length) return;
    detailIndex = Math.max(0, Math.min(btns.length - 1, idx));
    btns[detailIndex].classList.add('tv-focus-visible');
  }

  /* Filter chip focus */
  var filterZoneIndex = 0;
  function getFilterChips() {
    return Array.from(elFilterBar.querySelectorAll('.filter-chip'));
  }
  function applyFilterFocus(idx) {
    clearRings();
    var chips = getFilterChips();
    if (!chips.length) return;
    filterZoneIndex = Math.max(0, Math.min(chips.length - 1, idx));
    chips[filterZoneIndex].classList.add('tv-focus-visible');
  }

  /* ── Keyboard (WebOS D-pad) ─────────────────────────────────────── */
  var _kbInput = null;
  elSearch.addEventListener('focus', function () {
    _kbInput = elSearch;
  });
  elSearch.addEventListener('blur', function () {
    _kbInput = null;
  });
  var KEY = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    ENTER: 13,
    BACK: 461
  };
  window.addEventListener('keydown', function (e) {
    var kc = e.keyCode || e.which;
    if (_kbInput) {
      if (kc === KEY.BACK) {
        e.preventDefault();
        _kbInput.blur();
      }
      return;
    }

    /* ── Detail zone ── */
    if (zone === 'detail') {
      if (kc === KEY.BACK) {
        e.preventDefault();
        closeDetail();
        return;
      }
      if (kc === KEY.LEFT) {
        e.preventDefault();
        applyDetailFocus(detailIndex - 1);
        return;
      }
      if (kc === KEY.RIGHT) {
        e.preventDefault();
        applyDetailFocus(detailIndex + 1);
        return;
      }
      if (kc === KEY.ENTER) {
        e.preventDefault();
        var b = getDetailBtns()[detailIndex];
        if (b) b.click();
        return;
      }
      return;
    }

    /* ── Sidebar zone ── */
    if (zone === 'sidebar') {
      if (kc === KEY.BACK) {
        e.preventDefault();
        history.back();
        return;
      }
      if (kc === KEY.UP) {
        e.preventDefault();
        if (catIndex === 0) {
          clearRings();
          elSearch.classList.add('tv-focus-visible');
          elSearch.focus();
          return;
        }
        applyCatFocus(catIndex - 1);
        return;
      }
      if (kc === KEY.DOWN) {
        e.preventDefault();
        applyCatFocus(catIndex + 1);
        return;
      }
      if (kc === KEY.RIGHT) {
        e.preventDefault();
        zone = 'filter';
        applyFilterFocus(filterZoneIndex);
        return;
      }
      if (kc === KEY.ENTER) {
        e.preventDefault();
        var items = getFocusableItems();
        if (items[catIndex]) items[catIndex].click();
        return;
      }
      return;
    }

    /* ── Filter bar zone ── */
    if (zone === 'filter') {
      if (kc === KEY.BACK) {
        e.preventDefault();
        zone = 'sidebar';
        applyCatFocus(catIndex);
        return;
      }
      if (kc === KEY.LEFT) {
        e.preventDefault();
        if (filterZoneIndex === 0) {
          zone = 'sidebar';
          applyCatFocus(catIndex);
          return;
        }
        applyFilterFocus(filterZoneIndex - 1);
        return;
      }
      if (kc === KEY.RIGHT) {
        e.preventDefault();
        applyFilterFocus(filterZoneIndex + 1);
        return;
      }
      if (kc === KEY.DOWN) {
        e.preventDefault();
        zone = 'grid';
        applyGridFocus(0);
        return;
      }
      if (kc === KEY.UP) {
        e.preventDefault();
        zone = 'sidebar';
        applyCatFocus(catIndex);
        return;
      }
      if (kc === KEY.ENTER) {
        e.preventDefault();
        var chips = getFilterChips();
        if (chips[filterZoneIndex]) chips[filterZoneIndex].click();
        return;
      }
      return;
    }

    /* ── Grid zone ── */
    if (zone === 'grid') {
      if (kc === KEY.BACK) {
        e.preventDefault();
        zone = 'sidebar';
        applyCatFocus(catIndex);
        return;
      }
      var cols = getGridCols();
      if (kc === KEY.UP) {
        e.preventDefault();
        if (gridIndex < cols) {
          zone = 'filter';
          applyFilterFocus(filterZoneIndex);
          return;
        }
        applyGridFocus(gridIndex - cols);
        return;
      }
      if (kc === KEY.DOWN) {
        e.preventDefault();
        applyGridFocus(gridIndex + cols);
        return;
      }
      if (kc === KEY.LEFT) {
        e.preventDefault();
        if (gridIndex % cols === 0) {
          zone = 'sidebar';
          applyCatFocus(catIndex);
          return;
        }
        applyGridFocus(gridIndex - 1);
        return;
      }
      if (kc === KEY.RIGHT) {
        e.preventDefault();
        applyGridFocus(gridIndex + 1);
        return;
      }
      if (kc === KEY.ENTER) {
        e.preventDefault();
        var cards = getGridCards();
        if (cards[gridIndex]) cards[gridIndex].click();
        return;
      }
      return;
    }
  });
})();