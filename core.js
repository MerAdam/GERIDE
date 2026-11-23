/* GE Ride — logique pure (données, géométrie, génération, GPX, quiz).
   Utilisable dans le navigateur (window.GECore) et dans Node (module.exports). */
(function (root) {
  'use strict';
  var R = 6371000;
  var rad = function (d) { return d * Math.PI / 180; };
  var LAT0 = 46.2; // latitude de référence pour la projection locale (Genève)
  var KX = Math.cos(rad(LAT0));

  // [lat, lon] -> mètres (projection équirectangulaire locale, précise à l'échelle du canton)
  function xy(lat, lon) { return [rad(lon) * R * KX, rad(lat) * R]; }

  function dist(a, b) { // a, b : [lat, lon], en mètres (haversine)
    var dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function segDist(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy, t = 0;
    if (l > 0) { t = ((px - x1) * dx + (py - y1) * dy) / l; t = t < 0 ? 0 : (t > 1 ? 1 : t); }
    var ex = x1 + t * dx - px, ey = y1 + t * dy - py;
    return Math.sqrt(ex * ex + ey * ey);
  }

  /* ---------- Frontière : assemblage des chemins OSM en anneaux ---------- */
  function same(a, b) { return Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7; }

  function stitchRings(ways) {
    var segs = ways.filter(function (w) { return w && w.length > 1; }).map(function (w) { return w.slice(); });
    var rings = [];
    while (segs.length) {
      var ring = segs.shift(), grew = true;
      while (grew && !same(ring[0], ring[ring.length - 1])) {
        grew = false;
        for (var i = 0; i < segs.length; i++) {
          var s = segs[i], e = ring[ring.length - 1];
          if (same(s[0], e)) ring = ring.concat(s.slice(1));
          else if (same(s[s.length - 1], e)) ring = ring.concat(s.slice(0, -1).reverse());
          else if (same(s[s.length - 1], ring[0])) ring = s.slice(0, -1).concat(ring);
          else if (same(s[0], ring[0])) ring = s.slice(1).reverse().concat(ring);
          else continue;
          segs.splice(i, 1); grew = true; break;
        }
      }
      if (ring.length > 3) rings.push(ring);
    }
    return rings;
  }

  function makeBoundary(rings) {
    var n = 0, i, j;
    for (i = 0; i < rings.length; i++) n += rings[i].length - 1;
    var segs = new Float64Array(n * 4), k = 0;
    var minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    for (i = 0; i < rings.length; i++) {
      var r = rings[i];
      for (j = 0; j < r.length - 1; j++) {
        var a = xy(r[j][0], r[j][1]), b = xy(r[j + 1][0], r[j + 1][1]);
        segs[k++] = a[0]; segs[k++] = a[1]; segs[k++] = b[0]; segs[k++] = b[1];
        if (r[j][0] < minLat) minLat = r[j][0]; if (r[j][0] > maxLat) maxLat = r[j][0];
        if (r[j][1] < minLon) minLon = r[j][1]; if (r[j][1] > maxLon) maxLon = r[j][1];
      }
    }
    return { rings: rings, segs: segs, bbox: [minLat, minLon, maxLat, maxLon] };
  }

  function inside(pt, B) { // pt [lat, lon] ; règle pair/impair sur tous les anneaux
    var lat = pt[0], lon = pt[1], c = false;
    if (lat < B.bbox[0] || lat > B.bbox[2] || lon < B.bbox[1] || lon > B.bbox[3]) return false;
    for (var r = 0; r < B.rings.length; r++) {
      var ring = B.rings[r];
      for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var yi = ring[i][0], xi = ring[i][1], yj = ring[j][0], xj = ring[j][1];
        if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) c = !c;
      }
    }
    return c;
  }

  function borderDist(pt, B) {
    var p = xy(pt[0], pt[1]), s = B.segs, m = Infinity;
    for (var k = 0; k < s.length; k += 4) {
      // rejet rapide : boîte englobante du segment élargie de la meilleure distance connue
      var x1 = s[k], y1 = s[k + 1], x2 = s[k + 2], y2 = s[k + 3];
      if ((p[0] < Math.min(x1, x2) - m) || (p[0] > Math.max(x1, x2) + m) ||
          (p[1] < Math.min(y1, y2) - m) || (p[1] > Math.max(y1, y2) + m)) continue;
      var d = segDist(p[0], p[1], x1, y1, x2, y2);
      if (d < m) m = d;
    }
    return m;
  }

  // Signed safety: >0 = dans le canton à d mètres de la limite ; <0 = hors canton
  function safety(pt, B) { var d = borderDist(pt, B); return inside(pt, B) ? d : -d; }

  // Vérifie chaque point d'un tracé (coords [lon, lat] façon GeoJSON), densifié tous les ~20 m
  function checkRoute(coords, B, margin) {
    var res = { ok: true, minDist: Infinity, outside: 0, tooClose: 0, worst: null };
    function test(lat, lon) {
      var s = safety([lat, lon], B);
      if (s < res.minDist) { res.minDist = s; res.worst = [lat, lon]; }
      if (s < 0) res.outside++; else if (s < margin) res.tooClose++;
    }
    for (var i = 0; i < coords.length; i++) {
      var a = coords[i];
      test(a[1], a[0]);
      if (i + 1 < coords.length) {
        var b = coords[i + 1], d = dist([a[1], a[0]], [b[1], b[0]]), n = Math.floor(d / 20);
        for (var t = 1; t < n; t++) test(a[1] + (b[1] - a[1]) * t / n, a[0] + (b[0] - a[0]) * t / n);
      }
    }
    res.ok = res.outside === 0 && res.tooClose === 0;
    return res;
  }

  /* ---------- Réseau : construction depuis la réponse Overpass ---------- */
  var r5 = function (x) { return Math.round(x * 1e5) / 1e5; };
  function normName(n) { return (n || '').replace(/^Genève,?\s+/i, '').trim(); }

  function buildNetwork(elements) {
    var nodes = {}, ways = {}, rels = [];
    elements.forEach(function (el) {
      if (el.type === 'node') nodes[el.id] = el;
      else if (el.type === 'way') ways[el.id] = el;
      else if (el.type === 'relation') rels.push(el);
    });
    var geom = {};
    function wayGeom(id) {
      if (geom[id]) return geom[id];
      var w = ways[id];
      if (!w || !w.geometry) return null;
      geom[id] = w.geometry.map(function (g) { return [r5(g.lat), r5(g.lon)]; });
      return geom[id];
    }

    // Limite du canton
    var bRel = rels.find(function (r) { return r.tags && r.tags['ISO3166-2'] === 'CH-GE'; });
    var rings = [];
    if (bRel) {
      var outer = bRel.members.filter(function (m) { return m.type === 'way' && (m.role === 'outer' || m.role === ''); })
        .map(function (m) { return wayGeom(m.ref); }).filter(Boolean);
      rings = stitchRings(outer);
    }

    // Lignes
    var lines = {}, usedWays = {};
    rels.forEach(function (r) {
      var t = r.tags || {};
      if (t.type !== 'route' || !/^(bus|tram|trolleybus)$/.test(t.route)) return;
      var ref = (t.ref || '').trim();
      if (!ref) return;
      var key = ref;
      var L = lines[key] || (lines[key] = { ref: ref, mode: t.route, colour: t.colour || '', name: '', variants: 0, ways: [], wayset: {}, seqs: [], termini: {}, operator: t.operator || '' });
      if (!L.colour && t.colour) L.colour = t.colour;
      if (t.route === 'tram') L.mode = 'tram';
      L.variants++;
      var seq = [];
      r.members.forEach(function (m) {
        if (m.type === 'way' && !/platform/.test(m.role || '')) {
          if (wayGeom(m.ref) && !L.wayset[m.ref]) { L.wayset[m.ref] = 1; L.ways.push(m.ref); usedWays[m.ref] = 1; }
        } else if (m.type === 'node' && /^(stop|platform)/.test(m.role || '')) {
          var n = nodes[m.ref];
          if (!n) return;
          var nm = normName(n.tags && n.tags.name);
          if (!nm) return;
          if (seq.length && seq[seq.length - 1].name === nm) return;
          seq.push({ name: nm, lat: n.lat, lon: n.lon });
        }
      });
      if (seq.length >= 2) {
        L.seqs.push(seq);
        L.termini[seq[0].name] = 1; L.termini[seq[seq.length - 1].name] = 1;
      }
      if (!L.name && t.from && t.to) L.name = normName(t.from) + ' – ' + normName(t.to);
    });

    // Arrêts : regroupement par nom (+ séparation si > 600 m)
    var places = [], byName = {};
    Object.keys(lines).forEach(function (k) {
      var L = lines[k];
      L.seqs.forEach(function (seq) {
        seq.forEach(function (s) {
          var list = byName[s.name] || (byName[s.name] = []);
          var p = list.find(function (q) { return dist([q.lat, q.lon], [s.lat, s.lon]) < 600; });
          if (!p) { p = { name: s.name, lat: s.lat, lon: s.lon, n: 0, sLat: 0, sLon: 0, lines: {}, terminus: false }; list.push(p); places.push(p); }
          p.n++; p.sLat += s.lat; p.sLon += s.lon; p.lines[k] = 1;
          if (L.termini[s.name]) p.terminus = true;
        });
      });
    });
    places.forEach(function (p) {
      p.lat = r5(p.sLat / p.n); p.lon = r5(p.sLon / p.n);
      p.lines = Object.keys(p.lines).sort(cmpRef);
      // identifiant stable d'une mise à jour à l'autre (sert à garder la progression)
      var slug = p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
      p.id = byName[p.name].length > 1 ? slug + '~' + p.lat.toFixed(2) + ',' + p.lon.toFixed(2) : slug;
      p.hub = p.lines.length >= 3;
      p.pr = /P\+R|dépôt|depot|centre de maintenance|garage/i.test(p.name);
      delete p.n; delete p.sLat; delete p.sLon;
    });

    // Lignes : séquence principale = variante la plus longue, arrêts rattachés aux places
    var out = Object.keys(lines).sort(cmpRef).map(function (k) {
      var L = lines[k];
      var main = L.seqs.slice().sort(function (a, b) { return b.length - a.length; })[0] || [];
      var stopIds = [];
      main.forEach(function (s) {
        var p = (byName[s.name] || []).find(function (q) { return dist([q.lat, q.lon], [s.lat, s.lon]) < 700; });
        if (p && stopIds.indexOf(p.id) < 0) stopIds.push(p.id);
      });
      var allIds = {};
      L.seqs.forEach(function (seq) { seq.forEach(function (s) {
        var p = (byName[s.name] || []).find(function (q) { return dist([q.lat, q.lon], [s.lat, s.lon]) < 700; });
        if (p) allIds[p.id] = 1;
      }); });
      var name = L.name || (main.length ? main[0].name + ' – ' + main[main.length - 1].name : '');
      return { ref: L.ref, mode: L.mode, colour: L.colour, name: name, operator: L.operator, ways: L.ways,
        stops: stopIds, allStops: Object.keys(allIds), termini: Object.keys(L.termini) };
    }).filter(function (l) { return l.stops.length >= 2; });

    var waysOut = {};
    Object.keys(usedWays).forEach(function (id) { waysOut[id] = geom[id]; });
    return { v: 1, at: new Date().toISOString(), rings: rings, lines: out, places: places, ways: waysOut };
  }

  function cmpRef(a, b) {
    var na = parseInt(a, 10), nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    if (!isNaN(na) && isNaN(nb)) return -1;
    if (isNaN(na) && !isNaN(nb)) return 1;
    return String(a).localeCompare(String(b), 'fr');
  }

  /* ---------- Génération des étapes ---------- */
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function scorePlace(p, o) {
    var sc = 1 + o.rand() * 1.5;
    if (o.prio.term && p.terminus) sc += 3;
    if (o.prio.unseen && !o.seen[p.id]) sc += 3;
    if (o.prio.hub && p.hub) sc += 2;
    if (o.prio.depot && p.pr) sc += 2.5;
    return sc;
  }

  // o: {places, center:[lat,lon], radius, n, prio, seen, B, margin, termOnly, start:[lat,lon], seed}
  function pickWaypoints(o) {
    o.rand = rng(o.seed || Date.now());
    var skipped = 0;
    var cand = o.places.filter(function (p) {
      if (dist(o.center, [p.lat, p.lon]) > o.radius) return false;
      if (o.termOnly && !p.terminus) return false;
      if (o.B && safety([p.lat, p.lon], o.B) < o.margin + 25) { skipped++; return false; }
      return true;
    }).map(function (p) { return { p: p, s: scorePlace(p, o) }; })
      .sort(function (a, b) { return b.s - a.s; });
    var spacing = Math.max(450, Math.min(1500, o.radius / Math.max(2, o.n) * 1.2));
    var picked = [];
    for (var i = 0; i < cand.length && picked.length < o.n; i++) {
      var c = cand[i];
      if (picked.every(function (q) { return dist([q.p.lat, q.p.lon], [c.p.lat, c.p.lon]) >= spacing; })) picked.push(c);
    }
    return { list: orderLoop(picked, o.center, o.start), skipped: skipped, candidates: cand.length };
  }

  // Ordre en boucle autour du centre de zone, en commençant par l'étape la plus proche du départ
  function orderLoop(picked, center, start) {
    if (picked.length < 2) return picked;
    var c = xy(center[0], center[1]);
    picked.forEach(function (q) { var a = xy(q.p.lat, q.p.lon); q.ang = Math.atan2(a[1] - c[1], a[0] - c[0]); });
    picked.sort(function (a, b) { return a.ang - b.ang; });
    var best = 0, bd = Infinity;
    picked.forEach(function (q, i) { var d = dist(start, [q.p.lat, q.p.lon]); if (d < bd) { bd = d; best = i; } });
    var rot = picked.slice(best).concat(picked.slice(0, best));
    // sens : celui dont la 2e étape est la plus proche de la dernière (boucle plus courte)
    var rev = [rot[0]].concat(rot.slice(1).reverse());
    function len(arr) { var s = dist(start, [arr[0].p.lat, arr[0].p.lon]); for (var i = 1; i < arr.length; i++) s += dist([arr[i - 1].p.lat, arr[i - 1].p.lon], [arr[i].p.lat, arr[i].p.lon]); return s + dist([arr[arr.length - 1].p.lat, arr[arr.length - 1].p.lon], start); }
    return len(rev) < len(rot) ? rev : rot;
  }

  function targetCount(durationMin, start, center) {
    var approachMin = dist(start, center) / 1000 * 1.7; // ~35 km/h effectifs, avec détours
    var left = durationMin - 2 * approachMin;
    return { n: Math.max(2, Math.min(12, Math.round(left / 7))), tooFar: left < 15, approachMin: approachMin };
  }

  // Étapes d'une ligne : sous-échantillon régulier, terminus inclus
  function lineWaypoints(line, placeById, B, margin, maxN) {
    var ok = [], skipped = 0;
    line.stops.forEach(function (id) {
      var p = placeById[id];
      if (!p) return;
      if (B && safety([p.lat, p.lon], B) < margin + 25) { skipped++; return; }
      ok.push(p);
    });
    if (ok.length <= maxN) return { list: ok, skipped: skipped };
    var res = [];
    for (var i = 0; i < maxN; i++) res.push(ok[Math.round(i * (ok.length - 1) / (maxN - 1))]);
    return { list: res, skipped: skipped };
  }

  /* ---------- Arrêts proches d'un tracé ---------- */
  function placesNearRoute(places, coords, radius) {
    var pts = coords.map(function (c) { return xy(c[1], c[0]); });
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (p) { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; });
    return places.filter(function (pl) {
      var q = xy(pl.lat, pl.lon);
      if (q[0] < minX - radius || q[0] > maxX + radius || q[1] < minY - radius || q[1] > maxY + radius) return false;
      for (var i = 0; i + 1 < pts.length; i++) {
        if (segDist(q[0], q[1], pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) <= radius) return true;
      }
      return false;
    });
  }

  /* ---------- GPX ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function gpx(name, coords, wpts) {
    var o = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<gpx version="1.1" creator="GE Ride" xmlns="http://www.topografix.com/GPX/1/1">',
      '<metadata><name>' + esc(name) + '</name></metadata>'];
    wpts.forEach(function (w) { o.push('<wpt lat="' + w.lat + '" lon="' + w.lon + '"><name>' + esc(w.name) + '</name></wpt>'); });
    o.push('<rte><name>' + esc(name) + '</name>');
    wpts.forEach(function (w) { o.push('<rtept lat="' + w.lat + '" lon="' + w.lon + '"><name>' + esc(w.name) + '</name></rtept>'); });
    o.push('</rte><trk><name>' + esc(name) + '</name><trkseg>');
    coords.forEach(function (c) { o.push('<trkpt lat="' + c[1] + '" lon="' + c[0] + '"></trkpt>'); });
    o.push('</trkseg></trk></gpx>');
    return o.join('\n');
  }

  /* ---------- Quiz ---------- */
  function shuffle(a, rand) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function makeQuiz(net, opts) {
    var rand = rng(opts.seed || Date.now()), qs = [];
    var lines = net.lines.filter(function (l) { return !opts.line || l.ref === opts.line; });
    var all = net.lines;
    var byId = {}; net.places.forEach(function (p) { byId[p.id] = p; });
    var tries = 0;
    while (qs.length < (opts.count || 5) && tries++ < 80) {
      var L = lines[Math.floor(rand() * lines.length)];
      if (!L) break;
      var kind = Math.floor(rand() * 3);
      if (kind === 0 && L.termini.length) {
        var t = L.termini[Math.floor(rand() * L.termini.length)];
        var others = shuffle(all.reduce(function (acc, l) { return acc.concat(l.termini); }, []).filter(function (x) { return L.termini.indexOf(x) < 0; }), rand);
        var opt = uniq([t].concat(others)).slice(0, 4);
        if (opt.length < 4) continue;
        qs.push({ q: 'Lequel de ces arrêts est un terminus de la ligne ' + L.ref + ' ?', o: shuffle(opt, rand), a: t, why: 'Terminus de la ligne ' + L.ref + ' : ' + L.termini.join(' / ') + '.' });
      } else if (kind === 1) {
        var sid = L.stops[Math.floor(rand() * L.stops.length)], p = byId[sid];
        if (!p) continue;
        var wrong = shuffle(all.filter(function (l) { return p.lines.indexOf(l.ref) < 0; }).map(function (l) { return l.ref; }), rand).slice(0, 3);
        if (wrong.length < 3) continue;
        qs.push({ q: 'Quelle ligne dessert l’arrêt « ' + p.name + ' » ?', o: shuffle([L.ref].concat(wrong), rand), a: L.ref, why: '« ' + p.name + ' » est desservi par : ' + p.lines.join(', ') + '.' });
      } else {
        var ids = L.stops, i = 1 + Math.floor(rand() * Math.max(1, ids.length - 2));
        var cur = byId[ids[i]], nxt = byId[ids[i + 1]];
        if (!cur || !nxt) continue;
        var far = shuffle(net.places.filter(function (q) { return L.allStops.indexOf(q.id) < 0 && dist([q.lat, q.lon], [cur.lat, cur.lon]) < 4000; }), rand).slice(0, 3).map(function (q) { return q.name; });
        var o2 = uniq([nxt.name].concat(far));
        if (o2.length < 4) continue;
        qs.push({ q: 'Sur la ligne ' + L.ref + ', quel arrêt suit « ' + cur.name + ' » (sens principal) ?', o: shuffle(o2.slice(0, 4), rand), a: nxt.name, why: 'Ligne ' + L.ref + ' : … ' + cur.name + ' → ' + nxt.name + ' …' });
      }
      if (qs.length > 1 && qs[qs.length - 1].q === qs[qs.length - 2].q) qs.pop();
    }
    return qs;
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  var api = { dist: dist, xy: xy, stitchRings: stitchRings, makeBoundary: makeBoundary, inside: inside, borderDist: borderDist,
    safety: safety, checkRoute: checkRoute, buildNetwork: buildNetwork, cmpRef: cmpRef, rng: rng, pickWaypoints: pickWaypoints,
    targetCount: targetCount, lineWaypoints: lineWaypoints, placesNearRoute: placesNearRoute, gpx: gpx, makeQuiz: makeQuiz };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GECore = api;
})(this);
