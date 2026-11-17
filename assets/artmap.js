/* Art page: a golden tree of every piece, growing from the V.
   Pieces float slowly, can be dragged; wheel / pinch zooms, dragging the background moves; a section zooms in.
   Pictures show clean; the watermarked copy lies invisibly on top, so "Save image" gets the watermarked file. */
(function () {
  var svg = document.getElementById('am-map');
  if (!svg) return;
  var ART = JSON.parse(document.getElementById('art-data').textContent);
  var NS = 'http://www.w3.org/2000/svg';
  var world = document.getElementById('am-world'), gE = document.getElementById('am-edges'), gN = document.getElementById('am-nodes'), starsG = document.getElementById('am-stars');
  var tip = document.getElementById('am-tip');
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function small(a) { return '/assets/art/' + a.dir + '/c/' + a.slug + '-s.jpg'; }
  function large(a) { return '/assets/art/' + a.dir + '/c/' + a.slug + '.jpg'; }
  function marked(a) { return '/assets/art/' + a.dir + '/' + a.slug + '.jpg'; }

  // ---------- size: the map fills the screen between the header and the footer (no scrolling) ----------
  function fitHeight() {
    var foot = document.querySelector('.site-foot');
    var h = window.innerHeight - svg.getBoundingClientRect().top - window.scrollY - (foot ? foot.offsetHeight : 0);
    svg.style.height = Math.max(360, h) + 'px';
  }
  fitHeight();

  // ---------- graph ----------
  var R = 34, nodes = [], links = [], byId = {};
  function add(n) { nodes.push(n); byId[n.id] = n; n.vx = 0; n.vy = 0; n.ph = rnd() * 6.28; return n; }
  var main = add({ id: 'Art', kind: 'main', r: 42 }); main.x = 0; main.y = 0; main.fixed = true;
  var ANG = { 'Crafts': -2.0, 'Drawings': -0.1, 'Tattoo designs': 1.9 };
  var secs = []; ART.forEach(function (a) { if (secs.indexOf(a.section) < 0) secs.push(a.section); });
  secs.forEach(function (s, k) { var n = add({ id: s, kind: 'sec', r: 18, label: s, section: s, ang: ANG[s] !== undefined ? ANG[s] : k * 2.1 }); n.x = Math.cos(n.ang) * 230; n.y = Math.sin(n.ang) * 230; links.push({ a: main, b: n, len: 230 }); });
  ART.forEach(function (a, i) {
    var groups = []; ART.forEach(function (x) { if (x.section === a.section && groups.indexOf(x.group) < 0) groups.push(x.group); });
    var parent = byId[a.section];
    if (groups.length > 1) {
      var gid = a.section + '/' + a.group;
      if (!byId[gid]) { var g = add({ id: gid, kind: 'grp', r: 9, label: a.group, section: a.section }); links.push({ a: parent, b: g, len: 120 }); }
      parent = byId[gid];
    }
    add({ id: 'p' + i, kind: 'pic', r: R, art: a, idx: i, section: a.section });
    links.push({ a: parent, b: byId['p' + i], len: 95 });
  });
  // children fan out in their parent's direction, in order (no crossing branches)
  function fan(p, per, max) {
    var kids = links.filter(function (l) { return l.a === p; }).map(function (l) { return l.b; });
    var spread = Math.min(max, per * kids.length);
    kids.forEach(function (c, j) {
      var a = p.ang + (kids.length === 1 ? 0 : (j / (kids.length - 1) - 0.5) * spread); c.ang = a;
      var len = links.filter(function (l) { return l.a === p && l.b === c; })[0].len + (c.kind === 'pic' && kids.length > 6 ? (j % 2) * 40 : 0);
      c.x = p.x + Math.cos(a) * len; c.y = p.y + Math.sin(a) * len;
      if (c.kind === 'grp') fan(c, 0.45, 2.4);
    });
  }
  nodes.forEach(function (n) { if (n.kind === 'sec') fan(n, 0.75, 1.9); });

  // ---------- drawing ----------
  links.forEach(function (l, i) {
    l.el = el('path', { 'class': 'am-edge' }, gE);
    l.w1 = l.a.kind === 'main' ? 7 : l.a.kind === 'sec' ? 4.5 : 3; l.w2 = l.b.kind === 'pic' ? 1 : 1.8;
    l.bend = (i % 2 ? 1 : -1) * 0.16;
  });
  nodes.forEach(function (n) {
    var g = el('g', { 'class': n.kind === 'pic' ? 'am-pic' : 'am-hub am-' + n.kind }, gN);
    if (n.kind === 'pic') {
      g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', n.art.title);
      el('circle', { r: R + 3, 'class': 'am-glow' }, g);
      el('image', { href: small(n.art), x: -R, y: -R, width: 2 * R, height: 2 * R, preserveAspectRatio: 'xMidYMid slice', 'clip-path': 'url(#am-clip)' }, g);
      el('circle', { r: R, 'class': 'am-ring' }, g);
      el('circle', { r: R + 1.5, 'class': 'am-rim' }, g);
    } else if (n.kind === 'main') {
      el('circle', { r: n.r * 2.4, 'class': 'am-halo' }, g);
      el('image', { href: '/assets/mark-v.svg', x: -n.r * 1.7, y: -n.r * 1.75, width: n.r * 3.4, height: n.r * 3.4 }, g);
    } else {
      var s = n.kind === 'sec' ? 13 : 7;
      el('path', { d: 'M0 ' + (-s) + ' L' + (s * 0.8) + ' 0 L0 ' + s + ' L' + (-s * 0.8) + ' 0 Z', 'class': 'am-gem' }, g);
      el('text', { y: -s - (n.kind === 'sec' ? 9 : 6) }, g).textContent = n.label;
    }
    n.el = g; g._n = n;
  });
  for (var i = 0; i < 140; i++) {
    var st = el('circle', { cx: rnd() * 2400 - 300, cy: rnd() * 1600 - 300, r: (rnd() * 1.1 + 0.3).toFixed(2), 'class': 'am-star' + (rnd() < 0.25 ? ' am-tw' : ''), opacity: (rnd() * 0.35 + 0.08).toFixed(2) }, starsG);
    if (st.getAttribute('class').indexOf('am-tw') >= 0) st.style.animationDelay = (rnd() * 4).toFixed(1) + 's';
  }

  // ---------- physics: a slow float that stops while you look ----------
  var alpha = 1, hovered = null, dragging = null, overlayOpen = false, still = reduced;
  function forces(a0) {
    for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
      var a = nodes[i], b = nodes[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy || 1, d = Math.sqrt(d2);
      var f = 9000 / d2 * a0, min = a.r + b.r + 14; if (d < min) f += (min - d) * 0.25;
      dx /= d; dy /= d; a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
    }
    links.forEach(function (l) { var dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, d = Math.hypot(dx, dy) || 1, f = (d - l.len) * 0.03 * Math.max(a0, 0.2); dx /= d; dy /= d; l.a.vx += dx * f; l.a.vy += dy * f; l.b.vx -= dx * f; l.b.vy -= dy * f; });
  }
  function integrate() { nodes.forEach(function (n) { if (n.fixed || n === dragging) { n.vx = n.vy = 0; return; } n.vx *= 0.82; n.vy *= 0.82; n.x += n.vx; n.y += n.vy; }); }
  function tick(t) {
    var target = (still || hovered || overlayOpen) ? 0 : 0.035;
    alpha += (target - alpha) * (alpha > target ? 0.02 : 0.01);
    if (alpha > 0.002 || dragging) {
      forces(alpha);
      if (alpha > 0.01) nodes.forEach(function (n) { if (n.kind === 'pic') { n.vx += Math.cos(t / 2000 + n.ph) * 0.5 * alpha; n.vy += Math.sin(t / 2300 + n.ph) * 0.5 * alpha; } });
      integrate();
    }
    draw(); requestAnimationFrame(tick);
  }
  function draw() {
    links.forEach(function (l) {
      var ax = l.a.x, ay = l.a.y, bx = l.b.x, by = l.b.y, dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len, ny = dx / len, cx = (ax + bx) / 2 + nx * len * l.bend, cy = (ay + by) / 2 + ny * len * l.bend;
      var w1 = l.w1 / 2, w2 = l.w2 / 2, wm = (l.w1 + l.w2) / 4;
      l.el.setAttribute('d', 'M' + (ax + nx * w1) + ' ' + (ay + ny * w1) + ' Q' + (cx + nx * wm) + ' ' + (cy + ny * wm) + ' ' + (bx + nx * w2) + ' ' + (by + ny * w2) +
        ' L' + (bx - nx * w2) + ' ' + (by - ny * w2) + ' Q' + (cx - nx * wm) + ' ' + (cy - ny * wm) + ' ' + (ax - nx * w1) + ' ' + (ay - ny * w1) + ' Z');
    });
    nodes.forEach(function (n) { n.el.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')' + (n === hovered ? ' scale(1.7)' : '')); });
  }

  // ---------- camera ----------
  var cam = { x: 0, y: 0, k: 1 };
  function applyCam() { world.setAttribute('transform', 'translate(' + cam.x + ',' + cam.y + ') scale(' + cam.k + ')'); starsG.setAttribute('transform', 'translate(' + cam.x * 0.08 + ',' + cam.y * 0.08 + ')'); }
  function fit(list, anim) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    list.forEach(function (n) { x0 = Math.min(x0, n.x - n.r); y0 = Math.min(y0, n.y - n.r); x1 = Math.max(x1, n.x + n.r); y1 = Math.max(y1, n.y + n.r); });
    var w = svg.clientWidth, h = svg.clientHeight, pad = 34, k = Math.min((w - 2 * pad) / (x1 - x0), (h - 2 * pad) / (y1 - y0), 2.2);
    var fx = (x0 + x1) / 2, fy = (y0 + y1) / 2, mk = (w < 700 ? 40 : 24) / (2 * R);
    if (k < mk) { k = mk; if (list.length === nodes.length) { fx = 0; fy = 0; } }
    var t = { k: k, x: w / 2 - fx * k, y: h / 2 - fy * k };
    if (!anim) { cam = t; applyCam(); return; }
    var f = { x: cam.x, y: cam.y, k: cam.k }, t0 = performance.now();
    (function step(now) { var p = Math.min(1, (now - t0) / 450), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      cam = { k: f.k + (t.k - f.k) * e, x: f.x + (t.x - f.x) * e, y: f.y + (t.y - f.y) * e }; applyCam(); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  function zoomAt(px, py, f) { var k = Math.max(0.25, Math.min(4, cam.k * f)); f = k / cam.k; cam.x = px - (px - cam.x) * f; cam.y = py - (py - cam.y) * f; cam.k = k; applyCam(); }
  svg.addEventListener('wheel', function (e) { e.preventDefault(); var r = svg.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  document.getElementById('am-zin').onclick = function () { zoomAt(svg.clientWidth / 2, svg.clientHeight / 2, 1.3); };
  document.getElementById('am-zout').onclick = function () { zoomAt(svg.clientWidth / 2, svg.clientHeight / 2, 1 / 1.3); };
  var stillBtn = document.getElementById('am-still');
  stillBtn.setAttribute('aria-pressed', still ? 'true' : 'false');
  stillBtn.onclick = function () { still = !still; stillBtn.setAttribute('aria-pressed', still ? 'true' : 'false'); };

  // ---------- pointer: click / tap, drag a piece, pan, pinch ----------
  var ptrs = {}, nptr = 0, down = null, pinch = null;
  function nodeOf(t) { while (t && t !== svg) { if (t._n) return t._n; t = t.parentNode; } return null; }
  function toWorld(cx, cy) { var r = svg.getBoundingClientRect(); return { x: (cx - r.left - cam.x) / cam.k, y: (cy - r.top - cam.y) / cam.k }; }
  function two() { var v = []; for (var k in ptrs) v.push(ptrs[k]); return v; }
  svg.addEventListener('pointerdown', function (e) {
    svg.setPointerCapture(e.pointerId); if (!ptrs[e.pointerId]) nptr++; ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (nptr === 2) { var v = two(); pinch = { d: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y), k: cam.k }; down = null; dragging = null; return; }
    down = { x: e.clientX, y: e.clientY, n: nodeOf(e.target), cam: { x: cam.x, y: cam.y }, moved: false };
  });
  svg.addEventListener('pointermove', function (e) {
    if (ptrs[e.pointerId]) ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (pinch && nptr === 2) { var v = two(), d = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y), r = svg.getBoundingClientRect(); zoomAt((v[0].x + v[1].x) / 2 - r.left, (v[0].y + v[1].y) / 2 - r.top, (pinch.k * d / pinch.d) / cam.k); return; }
    if (down) {
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.moved && Math.hypot(dx, dy) > 6) { down.moved = true; if (down.n && !down.n.fixed) { dragging = down.n; alpha = Math.max(alpha, 0.3); setHover(null); } else svg.classList.add('am-panning'); }
      if (down.moved) { if (dragging) { var w = toWorld(e.clientX, e.clientY); dragging.x = w.x; dragging.y = w.y; } else { cam.x = down.cam.x + dx; cam.y = down.cam.y + dy; applyCam(); } }
      return;
    }
    var n = nodeOf(e.target);
    setHover(n && n.kind === 'pic' ? n : null, e);
    if (n && n.kind === 'grp') { tip.textContent = n.label; tip.style.opacity = 1; moveTip(e); } else if (!hovered) tip.style.opacity = 0;
    if (hovered) moveTip(e);
  });
  function up(e) {
    if (ptrs[e.pointerId]) { delete ptrs[e.pointerId]; nptr--; } if (nptr < 2) pinch = null;
    if (down && !down.moved && down.n) { var n = down.n; if (n.kind === 'pic') openPic(n.idx); else if (n.kind === 'sec') setFilter(n.section); else if (n.kind === 'main') setFilter('all'); }
    down = null; dragging = null; svg.classList.remove('am-panning');
  }
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('pointerleave', function () { if (!down) { setHover(null); tip.style.opacity = 0; } });
  function moveTip(e) { tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; }
  function setHover(n, e) {
    if (hovered === n) return;
    if (hovered) hovered.el.classList.remove('am-hot');
    hovered = n;
    links.forEach(function (l) { l.el.classList.toggle('am-hot', !!n && l.b === n); });
    if (n) { n.el.classList.add('am-hot'); tip.textContent = n.art.title; tip.style.opacity = 1; if (e) moveTip(e); if (gN.lastChild !== n.el) gN.appendChild(n.el); }
    else tip.style.opacity = 0;
  }
  gN.addEventListener('keydown', function (e) { var n = nodeOf(e.target); if (n && n.kind === 'pic' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPic(n.idx); } });

  // ---------- sections ----------
  var filter = 'all';
  function inView() { return filter === 'all' ? nodes : nodes.filter(function (n) { return n.section === filter; }); }
  function setFilter(f) {
    filter = f;
    document.querySelectorAll('.am-bar button[data-f]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.f === f ? 'true' : 'false'); });
    nodes.forEach(function (n) { n.el.classList.toggle('am-dim', f !== 'all' && n.kind !== 'main' && n.section !== f); });
    links.forEach(function (l) { l.el.classList.toggle('am-dim', f !== 'all' && l.b.section !== f); });
    fit(inView(), true);
  }
  document.querySelectorAll('.am-bar button[data-f]').forEach(function (b) { b.addEventListener('click', function () { setFilter(b.dataset.f); }); });

  // ---------- picture viewer and list view ----------
  var viewer = document.getElementById('am-viewer'), listview = document.getElementById('am-listview');
  var cleanImg = document.getElementById('am-clean'), wmImg = document.getElementById('am-wm'), cur = 0, openedAt = 0;
  function order() { return ART.map(function (a, i) { return i; }).filter(function (i) { return filter === 'all' || ART[i].section === filter; }); }
  function show(o) { o.classList.add('open'); overlayOpen = true; openedAt = performance.now(); setHover(null); document.documentElement.classList.add('am-lock'); var c = o.querySelector('.am-close'); if (c) c.focus({ preventScroll: true }); }
  function hide() { viewer.classList.remove('open'); listview.classList.remove('open'); overlayOpen = false; document.documentElement.classList.remove('am-lock'); }
  function openPic(i) {
    cur = i; var a = ART[i];
    cleanImg.src = large(a); wmImg.src = marked(a); cleanImg.alt = a.title; wmImg.alt = a.title;
    document.getElementById('am-vt').textContent = a.title;
    document.getElementById('am-vs').textContent = a.section + (a.group !== a.section ? ' · ' + a.group : '');
    show(viewer);
  }
  function step(d) { var l = order(), k = l.indexOf(cur); openPic(l[(k + d + l.length) % l.length]); }
  viewer.querySelector('.am-prev').onclick = function () { step(-1); };
  viewer.querySelector('.am-next').onclick = function () { step(1); };
  document.querySelectorAll('.am-overlay .am-close').forEach(function (b) { b.onclick = hide; });
  [viewer, listview].forEach(function (o) { o.addEventListener('click', function (e) { if ((e.target === o || e.target.classList.contains('am-listwrap')) && performance.now() - openedAt > 450) hide(); }); });
  document.addEventListener('keydown', function (e) {
    if (!overlayOpen) return;
    if (e.key === 'Escape') hide();
    if (viewer.classList.contains('open')) { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); }
  });
  var tx = null;
  viewer.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', function (e) { if (tx === null) return; var d = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(d) > 50) step(d < 0 ? 1 : -1); });
  document.getElementById('am-list').onclick = function () { show(listview); };

  // ---------- start ----------
  for (var it = 0; it < 260; it++) { alpha = Math.max(alpha * 0.985, 0.05); forces(alpha); integrate(); }
  alpha = 0.15;
  draw(); fit(nodes, false);
  window.addEventListener('resize', function () { fitHeight(); fit(inView(), false); });
  requestAnimationFrame(tick);
})();
