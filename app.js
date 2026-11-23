/* GE Ride — application */
(function () {
'use strict';
var C = window.GECore;
var VERSION = '0.9';

/* ================= Constantes ================= */
var ZONES = [
  { id: 'arve', name: 'Arve-Lac', sub: 'Hermance · Anières · Corsier · Collonge-Bellerive', c: [46.278, 6.222], r: 3800 },
  { id: 'jussy', name: 'Campagne de Jussy', sub: 'Jussy · Presinge · Meinier · Gy · Choulex', c: [46.238, 6.262], r: 3200 },
  { id: 'rivegauche', name: 'Rive gauche', sub: 'Cologny · Vandœuvres · Chêne-Bougeries', c: [46.215, 6.19], r: 2600 },
  { id: 'trois', name: 'Trois-Chêne', sub: 'Chêne-Bourg · Thônex · Puplinge', c: [46.198, 6.21], r: 2300 },
  { id: 'saleve', name: 'Pied du Salève', sub: 'Veyrier · Troinex · Bardonnex · Plan-les-Ouates', c: [46.16, 6.145], r: 3600 },
  { id: 'lancy', name: 'Lancy · Onex · Bernex', sub: 'Lancy · Onex · Confignon · Bernex', c: [46.18, 6.095], r: 2800 },
  { id: 'champagne', name: 'Champagne', sub: 'Avully · Chancy · Avusy · Laconnex · Cartigny', c: [46.16, 6.005], r: 4200 },
  { id: 'mandement', name: 'Mandement', sub: 'Satigny · Dardagny · Russin · Peney', c: [46.205, 6.015], r: 3800 },
  { id: 'meyrin', name: 'Meyrin · Vernier', sub: 'Meyrin · Vernier · Aéroport · ZIMEYSA', c: [46.225, 6.085], r: 2800 },
  { id: 'rivedroite', name: 'Rive droite nord', sub: 'Versoix · Genthod · Collex-Bossy · Bellevue', c: [46.272, 6.148], r: 3300 },
  { id: 'ville', name: 'Ville de Genève', sub: 'Centre · Pâquis · Eaux-Vives · Plainpalais', c: [46.204, 6.143], r: 2000 }
];
var CORNAVIN = [46.2102, 6.1424];
var CENTER_POLY = [[6.1405, 46.2035], [6.1515, 46.2035], [6.1515, 46.1995], [6.1405, 46.1995], [6.1405, 46.2035]];
var OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
var QUERY = '[out:json][timeout:180];' +
  'area["ISO3166-2"="CH-GE"]["admin_level"="4"]->.ge;' +
  '(rel(area.ge)["type"="route"]["route"~"^(bus|tram|trolleybus)$"]["operator"~"genevois|^TPG",i];' +
  'rel(area.ge)["type"="route"]["route"~"^(bus|tram|trolleybus)$"]["network"~"^(unireso|léman pass|tpg)",i];)->.r;' +
  '.r out body;way(r.r)->.w;.w out geom;node(r.r)->.n;.n out;' +
  'rel["ISO3166-2"="CH-GE"]["admin_level"="4"]->.b;.b out body;way(r.b)->.bw;.bw out geom;';
var ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
var OSM_ATT = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
var TILES = {
  plan: { name: 'Plan', desc: 'Style proche de Google Maps', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', att: 'Fond © Esri, ' + OSM_ATT, cls: '', nat: 18 },
  sat: { name: 'Satellite', desc: 'Vue aérienne', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', att: 'Images © Esri, Maxar, Earthstar', cls: '', nat: 18 },
  swiss: { name: 'Carte nationale', desc: 'swisstopo, très détaillée en Suisse', url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg', att: '© <a href="https://www.swisstopo.admin.ch">swisstopo</a>', cls: '', nat: 18 },
  osm: { name: 'OpenStreetMap', desc: 'Carte libre classique', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', att: OSM_ATT, cls: '', nat: 19 },
  dark: { name: 'Sombre', desc: 'Pour rouler de nuit', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', att: OSM_ATT, cls: 'dark-tiles', nat: 19 }
};
var PAL = ['#F5A623', '#A78BFA', '#60A5FA', '#A3E635', '#F472B6', '#FB923C', '#22D3EE', '#E879F9', '#FACC15', '#4ADE80', '#F87171', '#93C5FD'];
var ICONS = {
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  gen: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V10a4 4 0 0 1 4-4h2M18 9v5a4 4 0 0 1-4 4h-2',
  lines: 'M4 6h16M4 12h16M4 18h10',
  prog: 'M5 20V11M12 20V4M19 20v-6',
  set: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h12M15 4v4M9 10v4M18 16v4'
};
var ICON_EXPAND = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
var ICON_SHRINK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
var TABS = [['map', 'Carte'], ['gen', 'Balade'], ['lines', 'Lignes'], ['prog', 'Progrès'], ['set', 'Réglages']];
var NAVS = { osmand: 'OsmAnd', organic: 'Organic Maps', gmaps: 'Google Maps', waze: 'Waze', gpx: 'Fichier GPX' };
var MODES = [['zone', 'Zone'], ['line', 'Ligne'], ['term', 'Terminus'], ['custom', 'Point'], ['rand', 'Surprise']];
var MODE_DESC = {
  zone: 'Une boucle par les arrêts intéressants d’une zone du canton.',
  line: 'Longe une ligne de terminus à terminus, puis retour au départ.',
  term: 'Enchaîne les terminus et boucles de rebroussement d’une zone.',
  custom: 'Une boucle autour d’un point que tu choisis sur la carte.',
  rand: 'L’app choisit la zone où tu as vu le moins d’arrêts.'
};
var PRIOS = [['term', 'Terminus et boucles', 'Points de rebroussement des lignes'], ['unseen', 'Arrêts jamais vus', 'D’après ta progression'],
  ['hub', 'Pôles de correspondance', 'Arrêts desservis par 3 lignes ou plus'], ['depot', 'P+R et dépôts', 'Quand ils sont nommés dans les données']];

/* ================= Stockage ================= */
function lsGet(k, d) { try { var v = localStorage.getItem('geride.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem('geride.' + k, JSON.stringify(v)); } catch (e) { } }
var idb = {
  db: null,
  open: function () {
    var self = this;
    if (self.db) return Promise.resolve(self.db);
    return new Promise(function (res, rej) {
      var r = indexedDB.open('geride', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { self.db = r.result; res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  },
  get: function (k) { return this.open().then(function (db) { return new Promise(function (res, rej) { var q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { res(q.result); }; q.onerror = function () { rej(q.error); }; }); }); },
  set: function (k, v) { return this.open().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = function () { res(); }; t.onerror = function () { rej(t.error); }; }); }); }
};

var DEFAULTS = { noBorder: true, margin: 50, noHighway: true, warnUnpaved: true, noCenter: false, nav: 'osmand', start: 'home', home: null,
  key: '', radius: 100, base: 'plan', layers: { lines: true, stops: true, seen: true, border: true }, autoTrack: true };
function loadSettings() { var s = lsGet('settings', {}); if (s.baseV !== 2) { s.base = 'plan'; s.baseV = 2; } var o = Object.assign({}, DEFAULTS, s); o.layers = Object.assign({}, DEFAULTS.layers, s.layers || {}); return o; }

/* ================= État ================= */
var S = {
  tab: 'map', net: null, B: null, byId: {}, byRef: {},
  set: loadSettings(),
  seen: lsGet('seen', {}),
  hist: lsGet('hist', []),
  g: Object.assign({ mode: 'zone', zone: 'arve', line: '', duration: 90, start: null, prio: { term: true, unseen: true, hub: true, depot: false }, custom: null, customR: 2500 }, lsGet('gen', {})),
  result: null, busy: false, err: '', loading: '', loadErr: '',
  L: { q: '', f: 'all', sel: null }, stopQ: '',
  quiz: null, pick: null, tracking: false, watchId: null, gpsPos: null, sheet: null
};
function saveSettings() { lsSet('settings', S.set); }
function saveSeen() { lsSet('seen', S.seen); }
function saveHist() { lsSet('hist', S.hist.slice(0, 200)); }
function saveGen() { var g = Object.assign({}, S.g); lsSet('gen', g); }

/* ================= Utilitaires ================= */
function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function $(id) { return document.getElementById(id); }
function fmtMin(m) { m = Math.round(m); return m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + String(m % 60).padStart(2, '0') : '') : m + ' min'; }
function fmtKm(m) { return (m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ','); }
function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
var toastT;
function toast(msg) { var t = $('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(function () { t.style.display = 'none'; }, 2600); }
function lineColour(L) {
  if (L.colour && /^#?[0-9a-f]{3,6}$/i.test(L.colour)) return L.colour[0] === '#' ? L.colour : '#' + L.colour;
  var s = 0; for (var i = 0; i < L.ref.length; i++) s = (s * 31 + L.ref.charCodeAt(i)) >>> 0;
  return PAL[s % PAL.length];
}
function inkOn(hex) {
  var x = hex.replace('#', ''); if (x.length === 3) x = x.split('').map(function (c) { return c + c; }).join('');
  var r = parseInt(x.substr(0, 2), 16), g = parseInt(x.substr(2, 2), 16), b = parseInt(x.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 140 ? '#0E151D' : '#FFFFFF';
}
function modeLabel(m) { return { tram: 'Tram', trolleybus: 'Trolleybus', bus: 'Bus' }[m] || 'Bus'; }
function zoneById(id) { return ZONES.find(function (z) { return z.id === id; }) || ZONES[0]; }
function seenCount(ids) { var n = 0; ids.forEach(function (id) { if (S.seen[id]) n++; }); return n; }
function zonePlaces(z) { return S.net ? S.net.places.filter(function (p) { return C.dist(z.c, [p.lat, p.lon]) <= z.r && (!S.B || C.inside([p.lat, p.lon], S.B)); }) : []; }
var zoneCache = null;
function zoneStats() {
  if (!S.net) return [];
  if (!zoneCache) zoneCache = ZONES.map(function (z) { return { z: z, ids: zonePlaces(z).map(function (p) { return p.id; }) }; });
  return zoneCache.map(function (x) { var s = seenCount(x.ids); return { z: x.z, total: x.ids.length, seen: s, p: pct(s, x.ids.length) }; });
}
var weakMemo = null;
function weakest() { // zone la moins connue ; égalités départagées au hasard (une fois par session)
  var st = zoneStats().filter(function (x) { return x.total >= 5; });
  if (!st.length) return ZONES[0];
  var min = Math.min.apply(null, st.map(function (x) { return x.p; }));
  var ties = st.filter(function (x) { return x.p === min; });
  if (!weakMemo || !ties.some(function (x) { return x.z.id === weakMemo; })) weakMemo = ties[Math.floor(Math.random() * ties.length)].z.id;
  return zoneById(weakMemo);
}
function surprisePool() { // zones les moins connues (jusqu'à 15 points au-dessus du minimum)
  var st = zoneStats().filter(function (x) { return x.total >= 5; });
  if (!st.length) return ZONES.slice();
  var min = Math.min.apply(null, st.map(function (x) { return x.p; }));
  return st.filter(function (x) { return x.p <= min + 15; }).map(function (x) { return x.z; });
}
function surpriseZone() {
  var pool = surprisePool();
  if (pool.length > 1 && S.lastSurprise) pool = pool.filter(function (z) { return z.id !== S.lastSurprise; });
  var z = pool[Math.floor(Math.random() * pool.length)]; S.lastSurprise = z.id; return z;
}

/* ================= Données réseau ================= */
function indexNet(net) {
  S.net = net; S.byId = {}; S.byRef = {}; zoneCache = null;
  net.places.forEach(function (p) { S.byId[p.id] = p; });
  net.lines.forEach(function (l) { S.byRef[l.ref] = l; });
  S.B = net.rings && net.rings.length ? C.makeBoundary(net.rings) : null;
  if (!S.g.line && net.lines.length) S.g.line = net.lines[0].ref;
  buildMapData();
}
function loadNetwork() {
  S.loading = 'Téléchargement du réseau depuis OpenStreetMap… (30 s à 2 min)'; S.loadErr = ''; render();
  var i = 0;
  function attempt() {
    var url = OVERPASS[i];
    return fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(QUERY), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); S.loading = 'Traitement des lignes et des arrêts…'; render(); return r.json(); })
      .catch(function (e) { i++; if (i < OVERPASS.length) { S.loading = 'Serveur occupé, nouvel essai (' + (i + 1) + '/' + OVERPASS.length + ')…'; render(); return attempt(); } throw e; });
  }
  return attempt().then(function (j) {
    var net = C.buildNetwork(j.elements || []);
    if (!net.rings.length) throw new Error('limite du canton introuvable');
    if (net.lines.length < 10) throw new Error('trop peu de lignes reçues (' + net.lines.length + ')');
    indexNet(net);
    return idb.set('net', net).catch(function () { });
  }).then(function () {
    S.loading = ''; toast('Réseau chargé : ' + S.net.lines.length + ' lignes, ' + S.net.places.length + ' arrêts'); render(); fitCanton();
  }).catch(function (e) {
    S.loading = ''; S.loadErr = 'Le chargement a échoué (' + (e.message || e) + '). Vérifie ta connexion et réessaie.'; render();
  });
}

/* ================= Carte ================= */
var map, tiles, G = {}, lineLayers = {}, markers = {};
function initMap() {
  map = L.map('map', { zoomControl: false, preferCanvas: true, attributionControl: false }).setView([46.2, 6.14], 11);
  L.control.attribution({ position: 'topleft' }).addTo(map);
  setBase();
  G.lines = L.layerGroup(); G.unseen = L.layerGroup(); G.seen = L.layerGroup(); G.border = L.layerGroup();
  G.zone = L.layerGroup(); G.route = L.layerGroup(); G.home = L.layerGroup(); G.gps = L.layerGroup();
  [G.border, G.lines, G.zone, G.route, G.unseen, G.seen, G.home, G.gps].forEach(function (g) { g.addTo(map); });
  map.on('click', onMapClick);
}
function setBase() {
  var t = TILES[S.set.base] || TILES.plan;
  if (tiles) map.removeLayer(tiles);
  tiles = L.tileLayer(t.url, { attribution: t.att, maxZoom: 19, maxNativeZoom: t.nat, className: t.cls }).addTo(map);
}
function stopStyle(p) {
  var seen = !!S.seen[p.id];
  return seen ? { radius: p.terminus ? 5.5 : 4, color: '#0E151D', weight: 1, fillColor: '#2DD4BF', fillOpacity: 1 }
    : { radius: p.terminus ? 5.5 : 3.6, color: p.terminus ? '#FF8A3D' : '#8796A5', weight: 1.5, fillColor: '#111920', fillOpacity: 1 };
}
function buildMapData() {
  if (!map) return;
  G.lines.clearLayers(); G.seen.clearLayers(); G.unseen.clearLayers(); G.border.clearLayers(); lineLayers = {}; markers = {};
  S.net.lines.slice().reverse().forEach(function (L0) {
    var segs = L0.ways.map(function (id) { return S.net.ways[id]; }).filter(Boolean);
    if (!segs.length) return;
    var pl = L.polyline(segs, { color: lineColour(L0), weight: L0.mode === 'tram' ? 4 : 3, opacity: 0.85, interactive: false });
    lineLayers[L0.ref] = pl; G.lines.addLayer(pl);
  });
  S.net.places.forEach(function (p) {
    var m = L.circleMarker([p.lat, p.lon], stopStyle(p));
    m.bindPopup(function () { return popupHtml(p); }, { maxWidth: 260 });
    markers[p.id] = m;
    (S.seen[p.id] ? G.seen : G.unseen).addLayer(m);
  });
  if (S.net.rings.length) G.border.addLayer(L.polygon(S.net.rings, { fill: false, color: '#F87171', weight: 2, dashArray: '6 5', interactive: false }));
}
function popupHtml(p) {
  var seen = !!S.seen[p.id];
  return '<b>' + h(p.name) + '</b><div class="mut" style="margin:4px 0 8px">Lignes ' + h(p.lines.join(', ')) + (p.terminus ? ' · terminus' : '') + '</div>' +
    '<button class="btn sm" data-act="toggleSeen" data-arg="' + h(p.id) + '">' + (seen ? 'Retirer des arrêts vus' : 'Marquer comme vu') + '</button>';
}
function refreshMarker(id) {
  var m = markers[id], p = S.byId[id]; if (!m || !p) return;
  G.seen.removeLayer(m); G.unseen.removeLayer(m); m.setStyle(stopStyle(p));
  (S.seen[id] ? G.seen : G.unseen).addLayer(m);
}
/* ---- Panneau glissant (mobile) ---- */
var SH = { state: 'mid', drag: null, y0: 0, top0: 0, cur: 0 };
function sheetMode() { return showsMap() && !S.full && window.innerWidth < 900; }
function midTop() { return Math.round($('stage').clientHeight * 0.46); }
function applySheet(anim) {
  var w = $('sheetwrap'); if (!w) return;
  var m = sheetMode(), top = m && SH.state === 'mid' ? midTop() : 0;
  w.style.transition = anim === false ? 'none' : '';
  w.style.top = top + 'px'; SH.cur = top;
  w.classList.toggle('expanded', !m || SH.state === 'full');
  w.classList.toggle('sheetmode', m);
}
function setSheet(state) { SH.state = state; applySheet(); }
function hiddenBottom() { // hauteur de carte cachée par le panneau
  if (!sheetMode()) return 0;
  var h = $('stage').clientHeight; return Math.min(h * 0.7, Math.max(0, h - midTop()));
}
(function () {
  var w = $('sheetwrap'), pnl = $('panel');
  w.addEventListener('touchstart', function (e) {
    if (!sheetMode() || e.touches.length !== 1) { SH.drag = false; return; }
    SH.y0 = e.touches[0].clientY; SH.top0 = SH.cur; SH.drag = null;
  }, { passive: true });
  w.addEventListener('touchmove', function (e) {
    if (SH.drag === false || !sheetMode()) return;
    var dy = e.touches[0].clientY - SH.y0;
    if (SH.drag === null) {
      if (Math.abs(dy) < 6) return;
      if (SH.state === 'mid') SH.drag = true;
      else SH.drag = dy > 0 && pnl.scrollTop <= 0;
      if (!SH.drag) return;
    }
    e.preventDefault();
    var t = Math.max(0, Math.min(midTop() + 60, SH.top0 + dy));
    w.style.transition = 'none'; w.style.top = t + 'px'; SH.cur = t;
  }, { passive: false });
  function end() {
    if (SH.drag) { var mt = midTop(); SH.state = SH.cur < mt * 0.7 ? 'full' : 'mid'; if (SH.state === 'full') pnl.scrollTop = 0; applySheet(); }
    SH.drag = null;
  }
  w.addEventListener('touchend', end); w.addEventListener('touchcancel', end);
  window.addEventListener('resize', function () { applySheet(false); });
})();
function fit(bounds) { if (!map) return; var hb = hiddenBottom(); map.fitBounds(bounds, { paddingTopLeft: [16, 40], paddingBottomRight: [16, hb + 16] }); }
function focusOn(ll, z) { if (!map) return; map.setView(ll, z, { animate: false }); var hb = hiddenBottom(); if (hb) map.panBy([0, hb / 2], { animate: false }); }
function fitCanton() { if (map && S.net && S.net.rings.length) fit(L.polygon(S.net.rings).getBounds()); }
function showsMap() { return S.tab === 'map' || S.tab === 'gen' || (S.tab === 'lines' && S.L.sel); }
function updateMap() {
  $('app').classList.toggle('nomap', !showsMap());
  $('app').classList.toggle('full', !!S.full && showsMap());
  applySheet();
  var fb = $('fullBtn'); if (fb) { fb.setAttribute('aria-label', S.full ? 'Quitter le plein écran' : 'Carte en plein écran'); fb.innerHTML = S.full ? ICON_SHRINK : ICON_EXPAND; }
  if (!map) return;
  setTimeout(function () { map.invalidateSize(); }, 60);
  var st = S.set, inRes = S.tab === 'gen' && S.result, hi = S.tab === 'lines' && S.L.sel ? S.L.sel : (S.tab === 'gen' && !S.result && S.g.mode === 'line' ? S.g.line : null);
  toggleLayer(G.lines, S.tab !== 'map' || st.layers.lines);
  Object.keys(lineLayers).forEach(function (ref) {
    var op = hi ? (ref === hi ? 1 : 0.1) : (S.tab === 'map' ? 0.85 : 0.25);
    lineLayers[ref].setStyle({ opacity: op, weight: hi && ref === hi ? 6 : 3 });
    if (hi && ref === hi) lineLayers[ref].bringToFront();
  });
  toggleLayer(G.unseen, S.tab !== 'map' || st.layers.stops);
  toggleLayer(G.seen, S.tab !== 'map' || st.layers.seen);
  toggleLayer(G.border, S.tab !== 'map' || st.layers.border);
  // zone
  G.zone.clearLayers();
  if (S.tab === 'gen') {
    var z = null;
    if (inRes && S.result.zone) z = S.result.zone;
    else if (!S.result && (S.g.mode === 'zone' || S.g.mode === 'term')) z = zoneById(S.g.zone);
    else if (!S.result && S.g.mode === 'custom' && S.g.custom) z = { c: S.g.custom, r: S.g.customR };
    if (z) G.zone.addLayer(L.circle(z.c, { radius: z.r, color: '#FF8A3D', weight: 1.5, dashArray: '5 4', fillColor: '#FF8A3D', fillOpacity: inRes ? 0.05 : 0.12, interactive: false }));
  }
  // itinéraire
  G.route.clearLayers();
  if (inRes) {
    var R = S.result, ll = R.coords.map(function (c) { return [c[1], c[0]]; });
    G.route.addLayer(L.polyline(ll, { color: '#0E151D', weight: 8, opacity: 0.9, interactive: false }));
    G.route.addLayer(L.polyline(ll, { color: R.valid ? '#FF8A3D' : '#F87171', weight: 4.5, opacity: 1, interactive: false }));
    R.wps.forEach(function (w, i) {
      G.route.addLayer(L.marker([w.lat, w.lon], { icon: L.divIcon({ className: '', html: '<div class="wp">' + (i + 1) + '</div>', iconSize: [24, 24], iconAnchor: [12, 12] }), keyboard: false })
        .bindPopup('<b>' + (i + 1) + '. ' + h(w.name) + '</b><div class="mut">' + h(w.why) + '</div>'));
    });
    if (R.check && R.check.worst && !R.valid) G.route.addLayer(L.circleMarker(R.check.worst, { radius: 10, color: '#F87171', weight: 3, fill: false }));
  }
  // domicile
  G.home.clearLayers();
  if (st.home) G.home.addLayer(L.marker(st.home, { icon: L.divIcon({ className: '', html: '<div class="home"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), keyboard: false, interactive: false }));
  // bandeau de sélection
  var b = $('banner');
  if (S.pick) { b.style.display = 'block'; b.textContent = S.pick === 'home' ? 'Touche la carte pour placer ton domicile' : 'Touche la carte pour choisir le centre de la balade'; }
  else b.style.display = 'none';
}
function toggleLayer(g, on) { if (on && !map.hasLayer(g)) map.addLayer(g); if (!on && map.hasLayer(g)) map.removeLayer(g); }
function onMapClick(e) {
  if (!S.pick) return;
  var pt = [Math.round(e.latlng.lat * 1e5) / 1e5, Math.round(e.latlng.lng * 1e5) / 1e5];
  if (S.pick === 'home') { S.set.home = pt; S.set.start = 'home'; saveSettings(); toast('Domicile enregistré'); S.pick = null; S.tab = 'set'; }
  else if (S.pick === 'custom') { S.g.custom = pt; S.g.mode = 'custom'; saveGen(); S.pick = null; S.tab = 'gen'; S.result = null; }
  render();
}

/* ================= GPS ================= */
function getGps() {
  return new Promise(function (res, rej) {
    if (!navigator.geolocation) return rej(new Error('GPS indisponible sur cet appareil'));
    navigator.geolocation.getCurrentPosition(function (p) { res([p.coords.latitude, p.coords.longitude]); },
      function () { rej(new Error('Position refusée ou indisponible')); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  });
}
function showGps(pt) {
  S.gpsPos = pt; G.gps.clearLayers();
  G.gps.addLayer(L.marker(pt, { icon: L.divIcon({ className: '', html: '<div class="gps"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }), keyboard: false, interactive: false }));
}
function startTracking() {
  if (!navigator.geolocation) { toast('GPS indisponible'); return; }
  S.tracking = true;
  S.watchId = navigator.geolocation.watchPosition(function (p) {
    var pt = [p.coords.latitude, p.coords.longitude]; showGps(pt);
    if (!S.net) return;
    var added = 0;
    S.net.places.forEach(function (pl) {
      if (!S.seen[pl.id] && Math.abs(pl.lat - pt[0]) < 0.005 && Math.abs(pl.lon - pt[1]) < 0.007 && C.dist(pt, [pl.lat, pl.lon]) <= S.set.radius) {
        S.seen[pl.id] = Date.now(); refreshMarker(pl.id); added++;
      }
    });
    if (added) { saveSeen(); toast(added === 1 ? 'Nouvel arrêt vu' : added + ' nouveaux arrêts vus'); if (S.tab === 'map') render(); }
    if (S.tab === 'map') map.panTo(pt);
    if (S.set.autoTrack && S.B && C.safety(pt, S.B) < 150 && Date.now() - (S.lastWarn || 0) > 30000) { S.lastWarn = Date.now(); toast('Attention : frontière à moins de 150 m'); }
  }, function () { toast('Position indisponible'); stopTracking(); }, { enableHighAccuracy: true, maximumAge: 5000 });
  render();
}
function stopTracking() { if (S.watchId != null) navigator.geolocation.clearWatch(S.watchId); S.watchId = null; S.tracking = false; render(); }

/* ================= Génération ================= */
function startPoint() {
  var st = S.g.start || S.set.start;
  if (st === 'home' && S.set.home) return Promise.resolve({ pt: S.set.home, label: 'Domicile' });
  if (st === 'gps') return getGps().then(function (pt) { showGps(pt); return { pt: pt, label: 'Ma position' }; });
  return Promise.resolve({ pt: CORNAVIN, label: 'Gare Cornavin' });
}
function orsRoute(start, wps, minimal) {
  var st = S.set;
  var coords = [[start[1], start[0]]].concat(wps.map(function (w) { return [w.lon, w.lat]; })).concat([[start[1], start[0]]]);
  var body = { coordinates: coords, instructions: false, preference: 'recommended', radiuses: coords.map(function () { return 400; }), options: {} };
  if (!minimal) body.extra_info = ['waycategory', 'surface', 'countryinfo'];
  if (st.noHighway) body.options.avoid_features = ['highways'];
  if (st.noBorder) body.options.avoid_borders = 'all';
  if (st.noCenter) body.options.avoid_polygons = { type: 'Polygon', coordinates: [CENTER_POLY] };
  return fetch(ORS_URL, { method: 'POST', headers: { 'Authorization': st.key.trim(), 'Content-Type': 'application/json', 'Accept': 'application/json, application/geo+json' }, body: JSON.stringify(body) })
    .then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok) {
          var f = j.features && j.features[0];
          if (!f) throw { msg: 'Réponse vide du calculateur' };
          return { coords: f.geometry.coordinates, distance: f.properties.summary.distance || 0, duration: f.properties.summary.duration || 0, extras: f.properties.extras || {} };
        }
        var m = (j.error && (j.error.message || j.error)) || '';
        if (r.status === 401 || r.status === 403) throw { msg: 'Clé OpenRouteService refusée. Vérifie-la dans les réglages.' };
        if (r.status === 429) throw { msg: 'Limite de requêtes OpenRouteService atteinte, réessaie dans une minute.' };
        var idx = /coordinate (\d+)/i.exec(String(m));
        if (idx) throw { msg: String(m), badIndex: parseInt(idx[1], 10) };
        if (!minimal && /extra_info|countryinfo/i.test(String(m))) throw { retryMinimal: true };
        throw { msg: 'Erreur du calculateur (' + r.status + ') ' + m };
      });
    }, function () { throw { msg: 'Pas de connexion au calculateur d’itinéraires.' }; });
}
function summaryDist(ex, test) {
  var s = ex && ex.summary; if (!s) return 0;
  return s.reduce(function (a, x) { return a + (test(x.value) ? x.distance : 0); }, 0);
}
function analyse(route) {
  var st = S.set, ex = route.extras || {};
  var check = S.B ? C.checkRoute(route.coords, S.B, st.noBorder ? st.margin : 0) : null;
  var countries = ex.countryinfo && ex.countryinfo.summary ? ex.countryinfo.summary.map(function (x) { return x.value; }) : [];
  var hwy = summaryDist(ex.waycategory, function (v) { return (v & 1) === 1; });
  var unp = summaryDist(ex.surface, function (v) { return v === 2 || (v >= 8 && v <= 13) || v >= 15; });
  var borderOk = !check || (check.outside === 0 && (!st.noBorder || check.tooClose === 0));
  if (countries.length > 1) borderOk = false;
  return { check: check, countries: countries, hwy: hwy, unp: unp, borderOk: borderOk };
}
function generate(variant) {
  if (S.busy) return;
  S.err = '';
  if (!S.net) { S.err = 'Charge d’abord le réseau TPG (onglet Carte).'; render(); return; }
  if (!S.set.key) { S.err = 'Ajoute ta clé OpenRouteService gratuite dans les réglages pour calculer les itinéraires.'; render(); return; }
  if (S.g.mode === 'custom' && !S.g.custom) { S.err = 'Choisis d’abord un point sur la carte.'; render(); return; }
  S.busy = true; render();
  var g = S.g, st = S.set, seed = Date.now() + (variant || 0) * 7919, notes = [], zone = null, title = '', items;
  startPoint().then(function (sp) {
    var start = sp.pt;
    if (st.noBorder && S.B && C.safety(start, S.B) < 0) throw { msg: 'Ton point de départ est hors du canton : impossible de garantir un trajet sans frontière.' };
    if (g.mode === 'line') {
      var L0 = S.byRef[g.line]; if (!L0) throw { msg: 'Choisis une ligne.' };
      var lw = C.lineWaypoints(L0, S.byId, st.noBorder ? S.B : null, st.margin, 10);
      if (lw.skipped) notes.push(lw.skipped + ' arrêt(s) hors canton ou trop près de la frontière ignoré(s).');
      items = lw.list.map(function (p, i) { return { p: p, s: 10 - (i === 0 || i === lw.list.length - 1 ? -5 : 0) }; });
      title = 'Suivre la ligne ' + L0.ref;
    } else {
      if (g.mode === 'custom') zone = { name: 'Autour du point choisi', c: g.custom, r: g.customR };
      else if (g.mode === 'rand') zone = surpriseZone();
      else zone = zoneById(g.zone);
      var tc = C.targetCount(g.duration, start, zone.c);
      if (tc.tooFar) notes.push('La zone est loin du départ : durée courte, peu d’étapes possibles.');
      var pk = C.pickWaypoints({ places: S.net.places, center: zone.c, radius: zone.r, n: tc.n, prio: g.prio, seen: S.seen,
        B: st.noBorder ? S.B : null, margin: st.margin, termOnly: g.mode === 'term', start: start, seed: seed });
      if (pk.skipped) notes.push(pk.skipped + ' arrêt(s) trop près de la frontière exclu(s).');
      items = pk.list;
      title = (g.mode === 'term' ? 'Tour des terminus · ' : g.mode === 'rand' ? 'Surprise · ' : '') + zone.name;
    }
    if (!items.length) throw { msg: g.mode === 'term' ? 'Aucun terminus utilisable dans cette zone. Essaie le mode Zone.' : 'Aucun arrêt utilisable dans cette zone.' };
    var tries = 0, minimal = false, last = null;
    function run() {
      var wps = items.map(function (x) { return x.p; });
      return orsRoute(start, wps, minimal).then(function (route) {
        var a = analyse(route); last = { route: route, a: a };
        var tooLong = g.mode !== 'line' && route.duration / 60 > g.duration * 1.25 && items.length > 2;
        if (!a.borderOk && tries < 4 && items.length > 1 && a.check && a.check.worst) {
          tries++;
          var w = a.check.worst, bi = 0, bd = Infinity;
          items.forEach(function (x, i) { var d = C.dist(w, [x.p.lat, x.p.lon]); if (d < bd) { bd = d; bi = i; } });
          notes.push('Étape « ' + items[bi].p.name + ' » retirée : le trajet passait trop près de la frontière.');
          items.splice(bi, 1); return run();
        }
        if (tooLong && tries < 5) {
          tries++;
          var lo = 0; items.forEach(function (x, i) { if (x.s < items[lo].s) lo = i; });
          items.splice(lo, 1); return run();
        }
        return last;
      }, function (e) {
        if (e && e.retryMinimal && !minimal) { minimal = true; return run(); }
        if (e && e.badIndex != null && tries < 5) {
          var k = e.badIndex - 1; // 0 = départ
          if (k >= 0 && k < items.length) { tries++; notes.push('« ' + items[k].p.name + ' » n’est pas accessible en voiture/moto : retiré.'); items.splice(k, 1); if (items.length) return run(); }
        }
        throw e;
      });
    }
    return run().then(function (res) {
      var a = res.a, wps = items.map(function (x) { return x.p; });
      var near = C.placesNearRoute(S.net.places, res.route.coords, st.radius);
      var newOnes = near.filter(function (p) { return !S.seen[p.id]; }).length;
      S.result = {
        title: title, startLabel: sp.label, start: start, zone: zone, coords: res.route.coords,
        distance: res.route.distance, duration: res.route.duration, a: a, check: a.check, valid: !st.noBorder || a.borderOk,
        near: near.map(function (p) { return p.id; }), newOnes: newOnes, notes: notes, done: false, saved: false, variant: variant || 0,
        wps: wps.map(function (p) { return { id: p.id, name: p.name, lat: p.lat, lon: p.lon, lines: p.lines, why: whyPlace(p) }; })
      };
      var b = L.latLngBounds(S.result.coords.map(function (c) { return [c[1], c[0]]; }));
      setTimeout(function () { fit(b); }, 150);
    });
  }).catch(function (e) {
    S.err = (e && (e.msg || e.message)) || 'Impossible de calculer l’itinéraire.';
  }).then(function () { S.busy = false; render(); if (S.result) { $('panel').scrollTop = 0; setSheet('mid'); } });
}
function whyPlace(p) {
  var w = [];
  if (p.terminus) w.push('Terminus');
  if (!S.seen[p.id]) w.push('jamais vu');
  if (p.hub) w.push('pôle ' + p.lines.length + ' lignes');
  if (p.pr) w.push('P+R / dépôt');
  return (w.length ? w.join(' · ') : 'Arrêt') + ' — lignes ' + p.lines.join(', ');
}

/* ================= Export / navigation ================= */
function gpxFile() {
  var R = S.result, name = 'GE Ride – ' + R.title;
  var txt = C.gpx(name, R.coords, [{ name: 'Départ', lat: R.start[0], lon: R.start[1] }].concat(R.wps));
  var fname = 'geride-' + R.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.gpx';
  return { txt: txt, name: fname };
}
function deliverFile(txt, name, type) {
  var blob = new Blob([txt], { type: type });
  try {
    var file = new File([blob], name, { type: type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], title: name }).catch(function (e) { if (e && e.name !== 'AbortError') download(blob, name); });
    }
  } catch (e) { }
  download(blob, name); return Promise.resolve();
}
function download(blob, name) {
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function openNav() {
  var R = S.result; if (!R) return;
  var nav = S.set.nav;
  if (nav === 'osmand' || nav === 'organic' || nav === 'gpx') {
    var f = gpxFile();
    deliverFile(f.txt, f.name, 'application/gpx+xml');
    if (nav !== 'gpx') toast('Ouvre le fichier avec ' + NAVS[nav] + ' et choisis « suivre la trace »');
    return;
  }
  sheet('external');
}
function externalUrl() {
  var R = S.result, s = R.start;
  if (S.set.nav === 'waze') { var w = R.wps[0]; return 'https://waze.com/ul?ll=' + w.lat + ',' + w.lon + '&navigate=yes'; }
  var wp = R.wps.slice(0, 8).map(function (w) { return w.lat + ',' + w.lon; }).join('|');
  return 'https://www.google.com/maps/dir/?api=1&origin=' + s[0] + ',' + s[1] + '&destination=' + s[0] + ',' + s[1] + '&waypoints=' + encodeURIComponent(wp) + '&travelmode=driving';
}

/* ================= Rendu ================= */
function tog(act, on, label, sub, subCls) {
  return '<button class="row" data-act="' + act + '" aria-pressed="' + !!on + '"><span class="rt"><b>' + label + '</b><small class="' + (subCls || '') + '">' + sub + '</small></span><span class="sw' + (on ? ' on' : '') + '"><i></i></span></button>';
}
function chip(act, arg, on, label, cls) { return '<button class="' + (cls || 'chip') + '" data-act="' + act + '" data-arg="' + h(arg) + '" aria-pressed="' + !!on + '">' + label + '</button>'; }
function back(act, label) { return '<button class="mbtn" data-act="' + act + '" aria-label="' + label + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>'; }
function lineBadge(L0, big) { var c = lineColour(L0); return '<span class="badge" style="background:' + c + ';color:' + inkOn(c) + (big ? ';height:38px;min-width:48px;font-size:16px' : '') + '">' + h(L0.ref) + '</span>'; }

function viewMap() {
  var o = [];
  if (S.pick) o.push('<div class="card hot"><b>' + (S.pick === 'home' ? 'Touche la carte pour placer ton domicile.' : 'Touche la carte pour choisir le centre de la balade.') + '</b><button class="btn sm" data-act="cancelPick">Annuler</button></div>');
  if (!S.net) {
    o.push('<div class="card hot"><h2>Bienvenue sur GE Ride</h2><span class="soft">Pour commencer, l’app télécharge une fois les lignes et arrêts TPG et la limite exacte du canton depuis OpenStreetMap. Ensuite, tout reste sur ton téléphone.</span>' +
      (S.loading ? '<div class="okbox" style="display:flex;gap:10px;align-items:center"><span class="spin" style="border-top-color:#34D399"></span>' + h(S.loading) + '</div>'
        : '<button class="btn pri" data-act="loadNet">Charger le réseau TPG</button>') +
      (S.loadErr ? '<div class="err">' + h(S.loadErr) + '</div>' : '') +
      '<span class="mut">Étape suivante : ta clé OpenRouteService gratuite (Réglages) pour calculer les balades.</span></div>');
    return o.join('');
  }
  var total = S.net.places.length, seen = seenCount(S.net.places.map(function (p) { return p.id; }));
  o.push('<div class="chips">' + [['lines', 'Lignes'], ['stops', 'Arrêts à découvrir'], ['seen', 'Arrêts vus'], ['border', 'Limite du canton']].map(function (x) {
    return chip('layer', x[0], S.set.layers[x[0]], x[1]);
  }).join('') + '</div>');
  o.push('<div class="grid3"><div class="stat"><b style="color:var(--acc)">' + pct(seen, total) + ' %</b><span>du réseau vu</span></div><div class="stat"><b>' + seen + '</b><span>arrêts vus / ' + total + '</span></div><div class="stat"><b>' + S.hist.length + '</b><span>balades faites</span></div></div>');
  o.push('<div class="card ' + (S.tracking ? 'good' : '') + '"><div style="display:flex;align-items:center;gap:12px"><div class="rt"><b style="font-weight:700">' + (S.tracking ? 'Suivi GPS actif' : 'Suivi GPS des arrêts') + '</b><small>' +
    (S.tracking ? 'Les arrêts à moins de ' + S.set.radius + ' m sont marqués automatiquement. Garde l’app ouverte.' : 'Marque les arrêts vus pendant que tu roules (app ouverte).') + '</small></div>' +
    '<button class="btn sm ' + (S.tracking ? 'red' : '') + '" data-act="' + (S.tracking ? 'stopTrack' : 'startTrack') + '">' + (S.tracking ? 'Arrêter' : 'Démarrer') + '</button></div></div>');
  o.push('<div class="stack"><label class="lab" for="stopQ">Trouver un arrêt</label><input class="field" id="stopQ" type="search" data-in="stopQ" value="' + h(S.stopQ) + '" placeholder="ex. Hermance, Bachet, Vésenaz…" autocomplete="off">');
  if (S.stopQ.trim().length >= 2) {
    var q = S.stopQ.trim().toLowerCase(), res = S.net.places.filter(function (p) { return p.name.toLowerCase().indexOf(q) >= 0; }).slice(0, 6);
    o.push(res.length ? res.map(function (p) { return '<button class="item" data-act="flyStop" data-arg="' + h(p.id) + '"><span class="dot" style="background:' + (S.seen[p.id] ? 'var(--seen)' : '#5B6B7A') + '"></span><span class="rt"><b>' + h(p.name) + '</b><small>Lignes ' + h(p.lines.join(', ')) + '</small></span></button>'; }).join('') : '<span class="mut">Aucun arrêt trouvé.</span>');
  }
  o.push('</div>');
  var wz = weakest(), zs = zoneStats().filter(function (x) { return x.total >= 5; }).sort(function (a, b) { return a.p - b.p; });
  o.push('<div class="card hot"><span class="lab" style="color:#FFB07A">Balade suggérée</span><h2>' + h(wz.name) + '</h2><span class="soft">' + h(wz.sub) + '</span><button class="btn pri" data-act="suggest" data-arg="' + wz.id + '">Générer cette balade</button></div>');
  o.push('<div class="stack"><span class="lab">Zones que tu connais le moins</span>' + zs.slice(0, 4).map(function (x) {
    return '<div class="item"><span class="rt"><b>' + h(x.z.name) + '</b><span class="bar"><i style="width:' + x.p + '%"></i></span><small>' + x.seen + ' / ' + x.total + ' arrêts vus</small></span><button class="btn sm" data-act="suggest" data-arg="' + x.z.id + '">Générer</button></div>';
  }).join('') + '</div>');
  return o.join('');
}

function viewGen() {
  var g = S.g, st = S.set, o = [];
  if (!S.net) return '<div class="card hot"><b>Le réseau n’est pas encore chargé.</b><button class="btn pri" data-act="goTab" data-arg="map">Aller le charger</button></div>';
  if (!st.key) o.push('<div class="card hot"><b>Il manque ta clé OpenRouteService</b><span class="soft">Elle est gratuite et sert à calculer les trajets. Crée-la sur openrouteservice.org puis colle-la dans les réglages.</span><div class="grid2"><a class="btn sm" href="https://openrouteservice.org/dev/#/signup" target="_blank" rel="noopener">1. Créer ma clé</a><button class="btn sm" data-act="goTab" data-arg="set">2. La coller ici</button></div></div>');
  o.push('<div class="stack"><span class="lab">Type de balade</span><div class="seg">' + MODES.map(function (m) { return chip('mode', m[0], g.mode === m[0], m[1]); }).join('') + '</div><span class="soft">' + MODE_DESC[g.mode] + '</span></div>');
  if (g.mode === 'zone' || g.mode === 'term') {
    o.push('<div class="stack"><span class="lab">Zone à découvrir</span><div class="grid2">' + ZONES.map(function (z) { return chip('zone', z.id, g.zone === z.id, h(z.name), 'zone'); }).join('') + '</div><span class="mut">' + h(zoneById(g.zone).sub) + '</span></div>');
  } else if (g.mode === 'line') {
    o.push('<div class="stack"><label class="lab" for="lineSel">Ligne à suivre</label><select class="field" id="lineSel" data-in="gline">' + S.net.lines.map(function (l) {
      return '<option value="' + h(l.ref) + '"' + (l.ref === g.line ? ' selected' : '') + '>' + modeLabel(l.mode) + ' ' + h(l.ref) + ' — ' + h(l.name) + '</option>';
    }).join('') + '</select></div>');
  } else if (g.mode === 'custom') {
    o.push('<div class="stack"><span class="lab">Centre de la balade</span><button class="btn" data-act="pickCustom">' + (g.custom ? 'Changer le point sur la carte' : 'Choisir un point sur la carte') + '</button>' +
      '<div style="display:flex;justify-content:space-between"><label class="lab" for="cr">Rayon</label><b id="crL">' + fmtKm(g.customR) + ' km</b></div><input id="cr" type="range" min="1000" max="6000" step="500" value="' + g.customR + '" data-in="customR" data-lbl="crL" data-fmt="km"></div>');
  } else {
    var pool = surprisePool(); o.push('<div class="okbox">Zone tirée au sort au moment de générer, parmi les ' + pool.length + ' zones que tu connais le moins. Chaque « Autre variante » change de zone.</div>');
  }
  if (g.mode !== 'line') {
    o.push('<div class="stack"><div style="display:flex;justify-content:space-between;align-items:baseline"><label class="lab" for="dur">Durée souhaitée</label><b id="durL" style="font-family:var(--hd);font-size:17px">' + fmtMin(g.duration) + '</b></div>' +
      '<input id="dur" type="range" min="30" max="240" step="15" value="' + g.duration + '" data-in="duration" data-lbl="durL" data-fmt="min"><div style="display:flex;justify-content:space-between" class="mut"><span>30 min</span><span>4 h</span></div></div>');
  }
  var stv = g.start || st.start;
  o.push('<div class="stack"><span class="lab">Départ et arrivée</span><div class="chips">' +
    chip('gstart', 'home', stv === 'home', st.home ? 'Domicile' : 'Domicile (à définir)') + chip('gstart', 'gps', stv === 'gps', 'Ma position GPS') + chip('gstart', 'cornavin', stv === 'cornavin', 'Gare Cornavin') + '</div></div>');
  if (g.mode !== 'line') o.push('<div class="card flush"><span class="lab">Passer en priorité par</span>' + PRIOS.map(function (p) { return tog('prio-' + p[0], g.prio[p[0]], p[1], p[2]); }).join('') + '</div>');
  var parts = [];
  if (st.noBorder) parts.push('sans frontière (marge ' + st.margin + ' m)');
  if (st.noHighway) parts.push('sans autoroute');
  if (st.noCenter) parts.push('évite l’hyper-centre');
  o.push('<div class="card ' + (st.noBorder ? 'good' : 'danger') + '" style="flex-direction:row;align-items:center"><span class="rt"><b style="font-weight:700;color:' + (st.noBorder ? 'var(--ok)' : '#FCA5A5') + '">Restrictions appliquées</b><small style="color:var(--soft)">' + (parts.length ? parts.join(' · ') : 'aucune') + '</small></span><button class="btn sm ghost" data-act="goTab" data-arg="set">Modifier</button></div>');
  if (S.err) o.push('<div class="err">' + h(S.err) + '</div>');
  o.push('<button class="btn pri" data-act="generate"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? '<span class="spin"></span> Calcul de l’itinéraire…' : 'Générer l’itinéraire') + '</button>');
  return o.join('');
}

function viewRes() {
  var R = S.result, a = R.a, st = S.set, o = [];
  o.push('<div style="display:flex;align-items:center;gap:10px">' + back('backGen', 'Retour aux réglages de la balade') + '<div class="rt"><h2>' + h(R.title) + '</h2><small>Départ : ' + h(R.startLabel) + (R.variant ? ' · variante ' + (R.variant + 1) : '') + '</small></div></div>');
  if (!R.valid) o.push('<div class="err"><b>Itinéraire refusé : il sort du canton ou passe à moins de ' + st.margin + ' m de la frontière.</b><br>Il est affiché en rouge pour information. N’utilise pas ce trajet. Essaie une autre variante ou une autre zone.</div>');
  else if (!st.noBorder && a.check && a.check.outside) o.push('<div class="err"><b>Ce trajet passe par la France.</b> Interdit en permis d’élève. Réactive « Ne jamais traverser la frontière » dans les réglages.</div>');
  o.push('<div class="grid4">' + [[fmtKm(R.distance), 'km'], [fmtMin(R.duration / 60), 'durée'], [String(R.wps.length), 'étapes'], [String(R.newOnes), 'nouveaux']].map(function (x) { return '<div class="stat c"><b style="font-size:18px">' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>');
  var chks = [];
  if (a.check) {
    var md = a.check.minDist;
    chks.push(a.check.outside ? ['var(--bad)', 'Frontière', 'Le trajet sort du canton de Genève (' + a.check.outside + ' points hors canton).']
      : (st.noBorder && a.check.tooClose) ? ['var(--bad)', 'Frontière', 'Passe à ' + Math.max(0, Math.round(md)) + ' m de la limite (marge demandée : ' + st.margin + ' m).']
      : ['var(--ok)', 'Frontière', 'Reste dans le canton. Point le plus proche de la limite : ' + Math.round(md) + ' m. Vérifié point par point.']);
  }
  if (a.countries.length > 1) chks.push(['var(--bad)', 'Pays traversés', 'Le calculateur signale ' + a.countries.length + ' pays sur le trajet.']);
  chks.push(a.hwy > 0 ? [st.noHighway ? 'var(--bad)' : 'var(--warn)', 'Autoroute', fmtKm(a.hwy) + ' km d’autoroute ou de semi-autoroute.'] : ['var(--ok)', 'Autoroute', 'Aucun tronçon d’autoroute.']);
  if (st.warnUnpaved) chks.push(a.unp > 50 ? ['var(--warn)', 'Revêtement', fmtKm(a.unp) + ' km possiblement non goudronnés : vérifie sur place.'] : ['var(--ok)', 'Revêtement', 'Routes goudronnées selon les données.']);
  o.push('<div class="card"><span class="lab">Contrôle des restrictions</span>' + chks.map(function (c) { return '<div class="chk"><span class="dot" style="background:' + c[0] + '"></span><span class="rt"><b style="font-weight:600">' + c[1] + '</b><small style="color:var(--soft);font-size:13px">' + c[2] + '</small></span></div>'; }).join('') + '</div>');
  if (R.notes.length) o.push('<div class="okbox" style="color:var(--soft)">' + R.notes.map(h).join('<br>') + '</div>');
  o.push('<div class="stack"><span class="lab">Étapes · touche pour voir sur la carte</span>' + R.wps.map(function (w, i) {
    return '<button class="item" data-act="flyWp" data-arg="' + i + '"><span class="num">' + (i + 1) + '</span><span class="rt"><b style="font-weight:600">' + h(w.name) + '</b><small>' + h(w.why) + '</small></span></button>';
  }).join('') + '<span class="mut">Départ et retour : ' + h(R.startLabel) + '</span></div>');
  var dis = R.valid ? '' : ' disabled';
  o.push('<button class="btn pri" data-act="openNav"' + dis + '>Ouvrir dans ' + NAVS[st.nav] + '</button>');
  o.push('<div class="grid3"><button class="btn" data-act="exportGpx"' + dis + '>Export GPX</button><button class="btn" data-act="variant"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? 'Calcul…' : 'Autre variante') + '</button><button class="btn" data-act="saveRide">' + (R.saved ? 'Enregistrée' : 'Enregistrer') + '</button></div>');
  o.push('<button class="btn" data-act="rideDone"' + (R.done ? ' disabled' : '') + ' style="border-color:#1F5A47;color:var(--ok)">' + (R.done ? 'Arrêts marqués comme vus' : 'J’ai fait cette balade : marquer ' + R.near.length + ' arrêts comme vus') + '</button>');
  if (S.err) o.push('<div class="err">' + h(S.err) + '</div>');
  return o.join('');
}

function viewLines() {
  if (!S.net) return '<div class="card hot"><b>Le réseau n’est pas encore chargé.</b><button class="btn pri" data-act="goTab" data-arg="map">Aller le charger</button></div>';
  var q = S.L.q.trim().toLowerCase();
  var list = S.net.lines.filter(function (l) {
    if (S.L.f !== 'all' && l.mode !== S.L.f) return false;
    if (!q) return true;
    return (l.ref + ' ' + l.name).toLowerCase().indexOf(q) >= 0 || l.stops.some(function (id) { var p = S.byId[id]; return p && p.name.toLowerCase().indexOf(q) >= 0; });
  });
  var o = ['<div class="stack"><label class="lab" for="lq">Rechercher une ligne ou un arrêt</label><input class="field" id="lq" type="search" data-in="lq" value="' + h(S.L.q) + '" placeholder="ex. 14, Hermance, Chancy…" autocomplete="off"></div>'];
  o.push('<div class="chips">' + [['all', 'Toutes'], ['tram', 'Tram'], ['trolleybus', 'Trolleybus'], ['bus', 'Bus']].map(function (x) { return chip('lf', x[0], S.L.f === x[0], x[1]); }).join('') + '</div>');
  o.push(list.map(function (l) {
    var p = pct(seenCount(l.allStops), l.allStops.length);
    return '<button class="item" data-act="openLine" data-arg="' + h(l.ref) + '">' + lineBadge(l) + '<span class="rt"><b style="font-weight:600">' + h(l.name) + '</b><span class="bar"><i style="width:' + p + '%"></i></span></span><span class="mut" style="flex:none">' + p + ' %</span></button>';
  }).join('') || '<span class="mut" style="text-align:center;padding:20px 0">Aucune ligne ne correspond.</span>');
  return o.join('');
}

function viewLine() {
  var L0 = S.byRef[S.L.sel]; if (!L0) { S.L.sel = null; return viewLines(); }
  var seen = seenCount(L0.allStops), p = pct(seen, L0.allStops.length);
  var o = ['<div style="display:flex;align-items:center;gap:10px">' + back('closeLine', 'Retour à la liste des lignes') + lineBadge(L0, true) + '<div class="rt"><h2>' + modeLabel(L0.mode) + ' ' + h(L0.ref) + '</h2><small>' + h(L0.name) + '</small></div></div>'];
  o.push('<div class="grid3"><div class="stat c"><b>' + L0.allStops.length + '</b><span>arrêts</span></div><div class="stat c"><b style="color:var(--seen)">' + seen + '</b><span>vus</span></div><div class="stat c"><b>' + p + ' %</b><span>connu</span></div></div>');
  o.push('<button class="btn pri" data-act="followLine">Suivre cette ligne à moto</button>');
  o.push('<button class="btn" data-act="quizLine">M’interroger sur cette ligne</button>');
  o.push('<div class="card"><span class="lab">Parcours (sens principal)</span>' + L0.stops.map(function (id, i) {
    var pl = S.byId[id]; if (!pl) return '';
    var out = S.B && !C.inside([pl.lat, pl.lon], S.B);
    return '<button class="item" style="padding:8px 10px" data-act="flyStop" data-arg="' + h(id) + '"><span class="dot" style="background:' + (S.seen[id] ? 'var(--seen)' : '#5B6B7A') + '"></span><span class="rt"><b style="font-size:14px">' + h(pl.name) + '</b>' +
      ((i === 0 || i === L0.stops.length - 1 || out) ? '<small>' + (i === 0 || i === L0.stops.length - 1 ? 'terminus' : '') + (out ? ' hors canton' : '') + '</small>' : '') + '</span></button>';
  }).join('') + '</div>');
  return o.join('');
}

var BADGES = [
  ['Premiers tours de roue', '10 arrêts vus', function (s) { return s.seen >= 10; }],
  ['Centurion', '100 arrêts vus', function (s) { return s.seen >= 100; }],
  ['Régulateur de terrain', '300 arrêts vus', function (s) { return s.seen >= 300; }],
  ['Chasseur de terminus', '20 terminus vus', function (s) { return s.term >= 20; }],
  ['Tous les trams', 'Tous les arrêts de tram vus', function (s) { return s.tram >= 1; }],
  ['Première balade', 'Une balade terminée', function (s) { return s.rides >= 1; }],
  ['Habitué', '10 balades terminées', function (s) { return s.rides >= 10; }],
  ['Canton maîtrisé', 'Toutes les zones à 80 %', function (s) { return s.zones80 === ZONES.length; }]
];
function viewProg() {
  if (S.quiz) return viewQuiz();
  if (!S.net) return '<div class="card hot"><b>Le réseau n’est pas encore chargé.</b><button class="btn pri" data-act="goTab" data-arg="map">Aller le charger</button></div>';
  var all = S.net.places, seen = seenCount(all.map(function (p) { return p.id; }));
  var terms = all.filter(function (p) { return p.terminus; }), tseen = seenCount(terms.map(function (p) { return p.id; }));
  var tramIds = {}; S.net.lines.filter(function (l) { return l.mode === 'tram'; }).forEach(function (l) { l.allStops.forEach(function (id) { tramIds[id] = 1; }); });
  var tk = Object.keys(tramIds), tramDone = tk.length && seenCount(tk) === tk.length;
  var zs = zoneStats(), z80 = zs.filter(function (x) { return x.p >= 80; }).length;
  var rides = S.hist.filter(function (x) { return x.done; }).length;
  var ss = { seen: seen, term: tseen, tram: tramDone ? 1 : 0, rides: rides, zones80: z80 };
  var p = pct(seen, all.length), circ = 2 * Math.PI * 42;
  var o = [];
  o.push('<div class="card" style="flex-direction:row;align-items:center;gap:16px"><svg width="100" height="100" viewBox="0 0 100 100" role="img" aria-label="' + p + ' % du réseau vu"><circle cx="50" cy="50" r="42" fill="none" stroke="#243241" stroke-width="10"/><circle cx="50" cy="50" r="42" fill="none" stroke="#2DD4BF" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (circ * p / 100).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 50 50)"/><text x="50" y="57" text-anchor="middle" font-size="20" font-weight="700" fill="#EEF2F6">' + p + ' %</text></svg>' +
    '<div class="rt"><h2>' + seen + ' / ' + all.length + ' arrêts</h2><small style="color:var(--soft);font-size:13px">' + tseen + ' terminus sur ' + terms.length + ' · ' + z80 + ' zone(s) sur ' + ZONES.length + ' à 80 %</small></div></div>');
  o.push('<button class="item" data-act="startQuiz" style="background:#1C1612;border-color:#5A3A22"><span class="rt"><b style="font-weight:700">Quiz du réseau</b><small style="color:var(--soft)">5 questions tirées des vraies lignes TPG</small></span><b style="color:var(--acc)">Jouer</b></button>');
  o.push('<div class="card"><span class="lab">Par zone · touche pour y générer une balade</span>' + zs.map(function (x) {
    return '<button class="item" style="padding:8px 10px;background:none;border:0" data-act="suggest" data-arg="' + x.z.id + '"><span style="width:120px;flex:none;font-size:13px">' + h(x.z.name) + '</span><span class="bar" style="flex:1"><i style="width:' + x.p + '%"></i></span><span class="mut" style="width:40px;text-align:right">' + x.p + ' %</span></button>';
  }).join('') + '</div>');
  o.push('<div class="stack"><span class="lab">Badges</span><div class="grid2">' + BADGES.map(function (b) {
    var on = b[2](ss);
    return '<div class="card" style="padding:12px;gap:3px;' + (on ? 'background:#13241F;border-color:#1F5A47' : 'border-style:dashed') + '"><b>' + b[0] + '</b><span class="mut">' + b[1] + '</span><span style="font-size:11px;font-weight:700;color:' + (on ? 'var(--ok)' : 'var(--mut)') + '">' + (on ? 'Obtenu' : 'À débloquer') + '</span></div>';
  }).join('') + '</div></div>');
  o.push('<div class="stack"><span class="lab">Historique</span>' + (S.hist.length ? S.hist.slice(0, 30).map(function (x) {
    return '<div class="item"><span class="rt"><b style="font-weight:600">' + h(x.t) + '</b><small>' + new Date(x.at).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' }) + ' · ' + fmtKm(x.km * 1000) + ' km · ' + (x.done ? x.n + ' nouveaux arrêts' : 'pas encore faite') + '</small></span></div>';
  }).join('') : '<span class="mut">Aucune balade pour l’instant.</span>') + '</div>');
  return o.join('');
}

function viewQuiz() {
  var Q = S.quiz, o = [];
  o.push('<div style="display:flex;align-items:center;gap:10px">' + back('endQuiz', 'Quitter le quiz') + '<h2 style="flex:1">Quiz' + (Q.line ? ' · ligne ' + h(Q.line) : ' du réseau') + '</h2><span class="mut">' + (Q.done ? 'Terminé' : (Q.i + 1) + ' / ' + Q.qs.length) + '</span></div>');
  if (!Q.qs.length) return o.join('') + '<span class="mut">Pas assez de données pour créer un quiz.</span>';
  if (Q.done) {
    o.push('<div class="card" style="align-items:center;text-align:center;padding:22px"><b style="font-family:var(--hd);font-size:42px;color:var(--acc)">' + Q.score + ' / ' + Q.qs.length + '</b><span class="soft">' + (Q.score === Q.qs.length ? 'Sans faute !' : 'Une balade dans ces coins-là et ce sera parfait.') + '</span><button class="btn pri" style="width:100%" data-act="startQuiz" data-arg="' + h(Q.line || '') + '">Nouveau quiz</button><button class="btn" style="width:100%" data-act="endQuiz">Retour</button></div>');
    return o.join('');
  }
  var q = Q.qs[Q.i], ans = Q.pick != null;
  o.push('<b style="font-size:18px;line-height:1.35">' + h(q.q) + '</b>');
  o.push(q.o.map(function (t, i) {
    var cls = 'background:var(--s1);border:1px solid var(--line2)';
    if (ans) cls = t === q.a ? 'background:#123A2C;border:1px solid var(--ok);font-weight:700' : (i === Q.pick ? 'background:#3A1717;border:1px solid var(--bad)' : 'background:#121A22;border:1px solid var(--s2);color:#8796A5');
    return '<button class="btn" style="justify-content:flex-start;text-align:left;min-height:52px;font-weight:500;' + cls + '" data-act="qpick" data-arg="' + i + '">' + h(t) + '</button>';
  }).join(''));
  if (ans) {
    var good = q.o[Q.pick] === q.a;
    o.push('<div class="card"><b style="color:' + (good ? 'var(--ok)' : '#FCA5A5') + '">' + (good ? 'Bien vu !' : 'Pas tout à fait.') + '</b><span class="soft">' + h(q.why) + '</span></div>');
    o.push('<button class="btn pri" data-act="qnext">' + (Q.i + 1 >= Q.qs.length ? 'Voir mon score' : 'Question suivante') + '</button>');
  }
  return o.join('');
}

function viewSet() {
  var st = S.set, o = [];
  o.push('<div class="card flush"><span class="lab">Restrictions de route</span>' +
    tog('setNoBorder', st.noBorder, 'Ne jamais traverser la frontière', st.noBorder ? 'Permis d’élève : obligatoire. Trajets limités au canton de Genève.' : 'Désactivé : les trajets peuvent passer par la France', st.noBorder ? 'okc' : 'badc') +
    (st.noBorder ? '<div style="padding:12px 14px;border-top:1px solid var(--line)" class="stack"><div style="display:flex;justify-content:space-between"><label for="mg">Marge avec la frontière</label><b id="mgL">' + st.margin + ' m</b></div><input id="mg" type="range" min="0" max="500" step="10" value="' + st.margin + '" data-in="margin" data-lbl="mgL" data-fmt="m"><span class="mut">Chaque trajet est revérifié tous les 20 m contre la limite exacte du canton. Les arrêts plus proches que la marge sont exclus.</span></div>' : '') +
    tog('set-noHighway', st.noHighway, 'Éviter les autoroutes', 'Autoroutes et semi-autoroutes') +
    tog('set-noCenter', st.noCenter, 'Éviter l’hyper-centre', 'Rues-Basses, Fusterie, Bel-Air') +
    tog('set-warnUnpaved', st.warnUnpaved, 'Signaler les routes non goudronnées', 'Avertissement dans le contrôle de l’itinéraire') + '</div>');
  o.push('<div class="stack"><span class="lab">Appli de navigation</span><div class="chips">' + Object.keys(NAVS).map(function (k) { return chip('nav', k, st.nav === k, NAVS[k]); }).join('') + '</div><span class="mut">' +
    (st.nav === 'gmaps' || st.nav === 'waze' ? 'Attention : ' + NAVS[st.nav] + ' recalcule son propre trajet et peut passer par la France ou l’autoroute. OsmAnd ou Organic Maps suivent exactement la trace GE Ride.' : 'Le GPX contient la trace exacte vérifiée : choisis « suivre la trace » dans l’appli.') + '</span></div>');
  o.push('<div class="card"><span class="lab">Départ par défaut</span><div class="chips">' + chip('defStart', 'home', st.start === 'home', 'Domicile') + chip('defStart', 'gps', st.start === 'gps', 'Position GPS') + chip('defStart', 'cornavin', st.start === 'cornavin', 'Gare Cornavin') + '</div>' +
    '<span class="soft">' + (st.home ? 'Domicile défini (' + st.home[0].toFixed(4) + ', ' + st.home[1].toFixed(4) + ')' : 'Domicile pas encore défini') + '</span><div class="grid2"><button class="btn sm" data-act="pickHome">Placer sur la carte</button><button class="btn sm" data-act="homeGps">Utiliser ma position</button></div></div>');
  o.push('<div class="card flush"><span class="lab">Suivi des arrêts vus</span>' + tog('set-autoTrack', st.autoTrack, 'Alerte frontière pendant le suivi', 'Message si tu approches à moins de 150 m') +
    '<div style="padding:12px 14px;border-top:1px solid var(--line)" class="stack"><span>Rayon de détection d’un arrêt</span><div class="chips">' + [50, 100, 200].map(function (r) { return chip('radius', r, st.radius === r, r + ' m'); }).join('') + '</div></div></div>');
  o.push('<div class="stack"><span class="lab">Fond de carte</span><div class="chips">' + Object.keys(TILES).map(function (k) { return chip('base', k, st.base === k, TILES[k].name); }).join('') + '</div></div>');
  o.push('<div class="card"><span class="lab">Calcul d’itinéraires</span><label for="key">Clé OpenRouteService</label><input class="field" id="key" type="password" data-in="key" value="' + h(st.key) + '" placeholder="Colle ta clé ici" autocomplete="off">' +
    '<span class="mut">Gratuite (2 000 trajets par jour). Crée un compte sur <a href="https://openrouteservice.org/dev/#/signup" target="_blank" rel="noopener">openrouteservice.org</a>, puis copie ta clé « Standard ». Elle reste sur ton téléphone.</span></div>');
  o.push('<div class="card"><span class="lab">Données</span><div style="display:flex;gap:12px;align-items:center"><span class="rt"><b>Réseau TPG (OpenStreetMap)</b><small>' +
    (S.net ? S.net.lines.length + ' lignes · ' + S.net.places.length + ' arrêts · chargé le ' + new Date(S.net.at).toLocaleDateString('fr-CH') : 'Pas encore chargé') + '</small></span><button class="btn sm" data-act="loadNet"' + (S.loading ? ' disabled' : '') + '>' + (S.loading ? 'En cours…' : (S.net ? 'Actualiser' : 'Charger')) + '</button></div>' +
    (S.loading ? '<span class="mut">' + h(S.loading) + '</span>' : '') + (S.loadErr ? '<div class="err">' + h(S.loadErr) + '</div>' : '') + '</div>');
  o.push('<div class="card"><span class="lab">Ma progression</span><div class="grid2"><button class="btn sm" data-act="exportProg">Sauvegarder</button><button class="btn sm" data-act="importProg">Restaurer</button></div><button class="btn sm red" data-act="askReset">Réinitialiser ma progression</button></div>');
  o.push('<span class="mut" style="text-align:center">GE Ride version ' + VERSION + ' · données © contributeurs <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · itinéraires <a href="https://openrouteservice.org" target="_blank" rel="noopener">openrouteservice</a> · fond de carte OpenStreetMap. Outil personnel, pas une app officielle des TPG.</span>');
  return o.join('');
}

function sheet(kind) {
  S.sheet = kind; var b = $('sheetBody'), html = '';
  if (kind === 'border') html = '<h2 style="color:#FCA5A5">Autoriser les passages de frontière ?</h2><span class="soft">En permis d’élève, tu n’as pas le droit de quitter la Suisse. Sans cette option, des itinéraires pourront passer par la France (Chancy, Moillesulaz, Anières…).</span><button class="btn pri" data-act="sheetClose">Garder la restriction</button><button class="btn red" data-act="borderOff">Désactiver quand même</button>';
  if (kind === 'reset') html = '<h2>Réinitialiser la progression ?</h2><span class="soft">Tous tes arrêts vus et ton historique seront effacés de ce téléphone. Pense à faire une sauvegarde avant.</span><button class="btn pri" data-act="sheetClose">Annuler</button><button class="btn red" data-act="doReset">Tout effacer</button>';
  if (kind === 'external') html = '<h2>Ouvrir dans ' + NAVS[S.set.nav] + ' ?</h2><span class="soft">' + NAVS[S.set.nav] + ' recalcule lui-même le trajet' + (S.set.nav === 'waze' ? ' et ne prend que la première étape' : ' (8 étapes max.)') + '. Il peut passer par l’autoroute ou la France, sans tenir compte des restrictions GE Ride. Pour suivre la trace vérifiée, utilise le GPX avec OsmAnd ou Organic Maps.</span><a class="btn pri" href="' + h(externalUrl()) + '" target="_blank" rel="noopener" data-act="sheetClose">Ouvrir quand même</a><button class="btn" data-act="sheetGpx">Exporter le GPX à la place</button><button class="btn ghost" data-act="sheetClose">Annuler</button>';
  if (kind === 'base') html = '<h2>Fond de carte</h2>' + Object.keys(TILES).map(function (k) { var t = TILES[k]; return '<button class="item" data-act="base" data-arg="' + k + '" aria-pressed="' + (S.set.base === k) + '" style="' + (S.set.base === k ? 'border-color:var(--acc)' : '') + '"><span class="rt"><b style="font-weight:600">' + t.name + '</b><small>' + t.desc + '</small></span>' + (S.set.base === k ? '<b style="color:var(--acc)">Actif</b>' : '') + '</button>'; }).join('') + '<button class="btn ghost" data-act="sheetClose">Fermer</button>';
  b.innerHTML = html; $('sheet').style.display = kind ? 'flex' : 'none';
}

function renderChrome() {
  var st = S.set;
  $('pills').innerHTML = '<button class="pill ' + (st.noBorder ? 'ok' : 'bad') + '" data-act="goTab" data-arg="set"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"/></svg>' + (st.noBorder ? 'Sans frontière' : 'Frontière autorisée') + '</button>' +
    '<button class="pill ' + (st.noHighway ? 'ok' : 'warn') + '" data-act="goTab" data-arg="set"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 3L5 21M16 3l3 18M12 5v2M12 11v2M12 17v2"/></svg>' + (st.noHighway ? 'Sans autoroute' : 'Autoroute autorisée') + '</button>' +
    (S.tracking ? '<span class="pill ok">GPS actif</span>' : '');
  $('tabs').innerHTML = TABS.map(function (t) {
    return '<button data-act="goTab" data-arg="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICONS[t[0]] + '"/></svg><span>' + t[1] + '</span></button>';
  }).join('');
  $('subtitle').textContent = { map: 'Ton canton, arrêt par arrêt', gen: S.result ? 'Itinéraire généré' : 'Nouvelle balade', lines: 'Réseau TPG', prog: S.quiz ? 'Quiz' : 'Ta progression', set: 'Réglages' }[S.tab];
}
function render() {
  var ae = document.activeElement, fid = ae && ae.id, sel = null;
  try { sel = ae && ae.selectionStart; } catch (e) { }
  renderChrome();
  var v = S.tab === 'map' ? viewMap() : S.tab === 'gen' ? (S.result ? viewRes() : viewGen()) : S.tab === 'lines' ? (S.L.sel ? viewLine() : viewLines()) : S.tab === 'prog' ? viewProg() : viewSet();
  $('panel').innerHTML = v;
  if (fid && /^(stopQ|lq|key)$/.test(fid)) { var el = $(fid); if (el) { el.focus(); try { if (sel != null) el.setSelectionRange(sel, sel); } catch (e) { } } }
  updateMap();
}

/* ================= Actions ================= */
var A = {
  goTab: function (t) { S.tab = t; S.pick = null; S.full = false; if (t !== 'prog') S.quiz = null; SH.state = 'mid'; render(); $('panel').scrollTop = 0; },
  loadNet: function () { if (!S.loading) loadNetwork(); },
  layer: function (k) { S.set.layers[k] = !S.set.layers[k]; saveSettings(); render(); },
  toggleSeen: function (id) { if (S.seen[id]) delete S.seen[id]; else S.seen[id] = Date.now(); saveSeen(); refreshMarker(id); map.closePopup(); render(); },
  flyStop: function (id) { var p = S.byId[id]; if (!p) return; if (!showsMap()) { S.tab = 'map'; render(); } setSheet('mid'); setTimeout(function () { focusOn([p.lat, p.lon], 16); markers[id] && markers[id].openPopup(); }, 150); },
  flyWp: function (i) { var w = S.result.wps[+i]; setSheet('mid'); setTimeout(function () { focusOn([w.lat, w.lon], 15); }, 100); },
  fitCanton: function () { fitCanton(); },
  locate: function () { getGps().then(function (pt) { showGps(pt); focusOn(pt, 15); }, function (e) { toast(e.message); }); },
  startTrack: startTracking, stopTrack: stopTracking,
  suggest: function (zid) { S.tab = 'gen'; S.g.mode = 'zone'; S.g.zone = zid; S.result = null; saveGen(); generate(0); },
  mode: function (m) { S.g.mode = m; S.err = ''; saveGen(); render(); if (m === 'custom' && !S.g.custom) A.pickCustom(); },
  zone: function (z) { S.g.zone = z; saveGen(); render(); var zz = zoneById(z); fit(L.latLng(zz.c).toBounds(zz.r * 2)); },
  gstart: function (s) { S.g.start = s; saveGen(); render(); if (s === 'home' && !S.set.home) A.pickHome(); },
  pickCustom: function () { S.pick = 'custom'; S.tab = 'map'; render(); },
  pickHome: function () { S.pick = 'home'; S.tab = 'map'; render(); },
  cancelPick: function () { S.pick = null; render(); },
  homeGps: function () { getGps().then(function (pt) { S.set.home = [Math.round(pt[0] * 1e5) / 1e5, Math.round(pt[1] * 1e5) / 1e5]; S.set.start = 'home'; saveSettings(); toast('Domicile enregistré'); render(); }, function (e) { toast(e.message); }); },
  generate: function () { generate(0); },
  variant: function () { var v = (S.result ? S.result.variant : 0) + 1; generate(v); },
  backGen: function () { S.result = null; S.err = ''; render(); },
  openNav: openNav,
  exportGpx: function () { var f = gpxFile(); deliverFile(f.txt, f.name, 'application/gpx+xml'); },
  saveRide: function () { var R = S.result; if (R.saved) return; R.saved = true; R.histAt = Date.now(); S.hist.unshift({ t: R.title, at: R.histAt, km: R.distance / 1000, n: 0, done: false }); saveHist(); toast('Balade enregistrée dans l’historique'); render(); },
  rideDone: function () {
    var R = S.result; if (R.done) return; var n = 0;
    R.near.forEach(function (id) { if (!S.seen[id]) { S.seen[id] = Date.now(); n++; refreshMarker(id); } });
    R.done = true; saveSeen();
    var ex = R.saved && S.hist.find(function (x) { return x.at === R.histAt; });
    if (ex) { ex.done = true; ex.n = n; } else { R.saved = true; R.histAt = Date.now(); S.hist.unshift({ t: R.title, at: R.histAt, km: R.distance / 1000, n: n, done: true }); }
    saveHist(); toast(n + ' nouveaux arrêts ajoutés à ta progression'); render();
  },
  lf: function (f) { S.L.f = f; render(); },
  openLine: function (ref) { S.L.sel = ref; render(); $('panel').scrollTop = 0; setSheet('mid'); var ll = lineLayers[ref]; if (ll) setTimeout(function () { fit(ll.getBounds()); }, 150); },
  closeLine: function () { S.L.sel = null; render(); },
  followLine: function () { S.g.mode = 'line'; S.g.line = S.L.sel; S.L.sel = null; S.tab = 'gen'; S.result = null; saveGen(); generate(0); },
  quizLine: function () { var ref = S.L.sel; S.tab = 'prog'; A.startQuiz(ref); },
  startQuiz: function (line) { S.quiz = { line: line || null, qs: C.makeQuiz(S.net, { count: 5, line: line || null }), i: 0, pick: null, score: 0, done: false }; render(); },
  endQuiz: function () { S.quiz = null; render(); },
  qpick: function (i) { var Q = S.quiz; if (Q.pick != null) return; Q.pick = +i; if (Q.qs[Q.i].o[Q.pick] === Q.qs[Q.i].a) Q.score++; render(); },
  qnext: function () { var Q = S.quiz; if (Q.i + 1 >= Q.qs.length) Q.done = true; else { Q.i++; Q.pick = null; } render(); },
  setNoBorder: function () { if (S.set.noBorder) sheet('border'); else { S.set.noBorder = true; saveSettings(); toast('Restriction frontière réactivée'); S.result = null; render(); } },
  borderOff: function () { S.set.noBorder = false; saveSettings(); sheet(null); S.result = null; toast('Restriction frontière désactivée'); render(); },
  sheetClose: function () { sheet(null); },
  sheetGpx: function () { sheet(null); A.exportGpx(); },
  nav: function (k) { S.set.nav = k; saveSettings(); render(); },
  defStart: function (k) { S.set.start = k; S.g.start = null; saveSettings(); saveGen(); render(); },
  radius: function (r) { S.set.radius = +r; saveSettings(); render(); },
  base: function (b) { S.set.base = b; saveSettings(); setBase(); if (S.sheet === 'base') sheet(null); render(); },
  baseSheet: function () { sheet('base'); },
  full: function () { S.full = !S.full; render(); setTimeout(function () { map.invalidateSize(); }, 80); },
  sheetToggle: function () { setSheet(SH.state === 'mid' ? 'full' : 'mid'); $('panel').scrollTop = 0; },
  askReset: function () { sheet('reset'); },
  doReset: function () { S.seen = {}; S.hist = []; saveSeen(); saveHist(); sheet(null); if (S.net) S.net.places.forEach(function (p) { refreshMarker(p.id); }); toast('Progression effacée'); render(); },
  exportProg: function () { deliverFile(JSON.stringify({ app: 'GE Ride', v: 1, at: new Date().toISOString(), seen: S.seen, hist: S.hist }), 'geride-progression.json', 'application/json'); },
  importProg: function () { $('importFile').click(); }
};
// interrupteurs génériques
function genericToggle(act) {
  var m = /^set-(\w+)$/.exec(act); if (m) { S.set[m[1]] = !S.set[m[1]]; saveSettings(); if (m[1] === 'noHighway' || m[1] === 'noCenter') S.result = null; render(); return true; }
  m = /^prio-(\w+)$/.exec(act); if (m) { S.g.prio[m[1]] = !S.g.prio[m[1]]; saveGen(); render(); return true; }
  return false;
}
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  var act = el.getAttribute('data-act'), arg = el.getAttribute('data-arg');
  if (el.tagName === 'A' && act === 'sheetClose') { setTimeout(function () { sheet(null); }, 50); return; }
  if (A[act]) { e.preventDefault(); A[act](arg, el); } else if (genericToggle(act)) e.preventDefault();
});
$('sheet').addEventListener('click', function (e) { if (e.target === $('sheet')) sheet(null); });
document.addEventListener('input', function (e) {
  var el = e.target, k = el.getAttribute && el.getAttribute('data-in'); if (!k) return;
  var lbl = el.getAttribute('data-lbl'), fmt = el.getAttribute('data-fmt'), v = el.value;
  if (k === 'duration') S.g.duration = +v;
  else if (k === 'customR') S.g.customR = +v;
  else if (k === 'margin') S.set.margin = +v;
  else if (k === 'stopQ') { S.stopQ = v; render(); return; }
  else if (k === 'lq') { S.L.q = v; render(); return; }
  else if (k === 'key') { S.set.key = v.trim(); saveSettings(); return; }
  if (lbl && $(lbl)) $(lbl).textContent = fmt === 'min' ? fmtMin(+v) : fmt === 'km' ? fmtKm(+v) + ' km' : v + ' m';
});
document.addEventListener('change', function (e) {
  var el = e.target, k = el.getAttribute && el.getAttribute('data-in'); if (!k) return;
  if (k === 'gline') { S.g.line = el.value; saveGen(); render(); var ll = lineLayers[el.value]; if (ll) fit(ll.getBounds()); return; }
  if (k === 'duration' || k === 'customR') { saveGen(); render(); }
  if (k === 'margin') { saveSettings(); S.result = null; render(); }
});
$('importFile').addEventListener('change', function (e) {
  var f = e.target.files && e.target.files[0]; if (!f) return;
  f.text().then(function (t) {
    var j = JSON.parse(t); if (!j || !j.seen) throw new Error();
    Object.keys(j.seen).forEach(function (id) { S.seen[id] = j.seen[id]; });
    (j.hist || []).forEach(function (x) { if (!S.hist.some(function (y) { return y.at === x.at; })) S.hist.push(x); });
    S.hist.sort(function (a, b) { return b.at - a.at; }); saveSeen(); saveHist();
    if (S.net) S.net.places.forEach(function (p) { refreshMarker(p.id); });
    toast('Progression restaurée'); render();
  }).catch(function () { toast('Fichier de sauvegarde invalide'); });
  e.target.value = '';
});

/* ================= Blocage du zoom de la page ================= */
['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) { document.addEventListener(ev, function (e) { if (!e.target.closest || !e.target.closest('#map')) e.preventDefault(); }, { passive: false }); });
document.addEventListener('touchmove', function (e) { if (e.touches.length > 1 && !(e.target.closest && e.target.closest('#map'))) e.preventDefault(); }, { passive: false });

// la page elle-même ne doit jamais bouger : seuls le panneau, la carte et les fenêtres défilent
document.addEventListener('touchmove', function (e) { if (!(e.target.closest && e.target.closest('#panel, #map, #sheetBody, #sheetwrap'))) e.preventDefault(); }, { passive: false });

/* ================= Démarrage ================= */
initMap();
render();
idb.get('net').then(function (net) {
  if (net && net.lines && net.places) { indexNet(net); render(); fitCanton(); }
}).catch(function () { });
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  var hadCtrl = !!navigator.serviceWorker.controller, reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (hadCtrl && !reloaded) { reloaded = true; location.reload(); } });
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (r) { r.update().catch(function () { }); }).catch(function () { }); });
}
})();
