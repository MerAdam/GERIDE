/* GE Ride — service worker : app utilisable hors ligne + cache des tuiles de carte */
var SHELL = 'geride-shell-v2';
var TILES = 'geride-tiles-v2';
var FILES = ['./', 'index.html', 'app.js', 'core.js', 'leaflet.js', 'leaflet.css', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
var MAX_TILES = 3000, puts = 0;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== SHELL && k !== TILES; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function trim() {
  return caches.open(TILES).then(function (c) {
    return c.keys().then(function (keys) {
      if (keys.length <= MAX_TILES) return;
      return Promise.all(keys.slice(0, keys.length - MAX_TILES).map(function (k) { return c.delete(k); }));
    });
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    // réseau d'abord (mises à jour), cache si hors ligne
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(SHELL).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('index.html'); }); }));
    return;
  }
  if (/tile\.openstreetmap\.org$/.test(url.hostname) || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(TILES).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); if (++puts % 100 === 0) trim(); }
          return res;
        });
        return hit || net;
      });
    }));
  }
});
