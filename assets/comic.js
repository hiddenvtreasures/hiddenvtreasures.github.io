/* Comic reader: one page (phone) or a two-page spread (wide screens), cover and back cover on their own.
   Pages show clean; the watermarked copy lies invisibly on top, so "Save image" gets the watermarked file. */
(function () {
  var book = document.getElementById('cr-book'); if (!book) return;
  var pgs = [].slice.call(book.querySelectorAll('.cr-pg')), N = pgs.length, cur = 0;
  var count = document.getElementById('cr-count');
  function spread() { return window.innerWidth / Math.max(1, book.clientHeight) > 1.25 && window.innerWidth > 760; }
  function group(i) {             // pages shown together with page i
    if (!spread() || i === 0 || i === N - 1) return [i];
    var a = i % 2 ? i : i - 1;    // spreads: 2-3, 4-5 ... (1-based) = indexes 1-2, 3-4 ...
    return a + 1 < N - 1 ? [a, a + 1] : [a];
  }
  function load(i) { if (i < 0 || i >= N) return; pgs[i].querySelectorAll('img[data-src]').forEach(function (im) { im.src = im.dataset.src; im.removeAttribute('data-src'); }); }
  function show(i) {
    i = Math.max(0, Math.min(N - 1, i)); var g = group(i); cur = g[0];
    pgs.forEach(function (p, k) { p.classList.toggle('on', g.indexOf(k) >= 0); p.classList.toggle('left', g.length === 2 && k === g[0]); p.classList.toggle('right', g.length === 2 && k === g[1]); });
    g.forEach(load); load(g[g.length - 1] + 1); load(g[g.length - 1] + 2); load(g[0] - 1);
    count.textContent = (g.length === 2 ? (g[0] + 1) + '–' + (g[1] + 1) : (g[0] + 1)) + ' / ' + N;
    try { history.replaceState(null, '', '#p' + (g[0] + 1)); } catch (e) {}
  }
  function next() { var g = group(cur); show(g[g.length - 1] + 1); }
  function prev() { var g = group(Math.max(0, cur - 1)); show(g[0]); }
  document.querySelector('.cr-next').onclick = next; document.querySelector('.cr-prev').onclick = prev;
  document.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); } if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); } if (e.key === 'Home') show(0); if (e.key === 'End') show(N - 1); });
  book.addEventListener('click', function (e) { var r = book.getBoundingClientRect(); (e.clientX - r.left > r.width / 2 ? next : prev)(); });
  var x0 = null, y0 = null;
  book.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  book.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { (dx < 0 ? next : prev)(); } });
  book.addEventListener('contextmenu', function (e) { e.stopPropagation(); });
  function fit() {
    var foot = document.querySelector('.site-foot'), hint = document.querySelector('.cr-hint'), st = document.getElementById('cr-stage');
    var h = window.innerHeight - st.getBoundingClientRect().top - window.scrollY - (foot ? foot.offsetHeight : 0) - (hint ? hint.offsetHeight : 0) - 8;
    st.style.height = Math.max(300, h) + 'px';
    var over = document.documentElement.scrollHeight - window.innerHeight;
    if (over > 0) st.style.height = Math.max(300, h - over) + 'px';
    show(cur);
  }
  window.addEventListener('resize', fit);
  var m = /#p(\d+)/.exec(location.hash); if (m) cur = Math.min(N, Math.max(1, +m[1])) - 1;
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('load', fit);
})();
