// Videos: show only a picture until someone presses play; then load the YouTube player (privacy-enhanced mode).
document.querySelectorAll('.video button[data-id]').forEach(function (b) {
  b.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + b.dataset.id + '?autoplay=1&rel=0';
    f.title = b.getAttribute('aria-label') || 'Video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    b.replaceWith(f);
  });
});

// Tabs: one group of videos at a time, so the page fits on one screen.
document.querySelectorAll('[role="tablist"]').forEach(function (list) {
  var tabs = list.querySelectorAll('[role="tab"]');
  function show(t) {
    tabs.forEach(function (x) {
      var on = x === t; x.setAttribute('aria-selected', on);
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(t); }); });
  show(list.querySelector('[aria-selected="true"]') || tabs[0]);
});

// Art pictures are shown clean; an invisible watermarked copy lies on top, so "Save image" gives the watermarked file.
function cleanOf(src) { return src.replace(/(\/assets\/art\/[^/]+\/)([^/]+\.jpg)$/, '$1c/$2'); }
document.querySelectorAll('.gallery .shot img, .art-tile img').forEach(function (wm) {
  var clean = cleanOf(wm.getAttribute('src'));
  if (clean === wm.getAttribute('src')) return;
  var pair = document.createElement('div'); pair.className = 'pair';
  var c = document.createElement('img'); c.className = 'clean'; c.src = clean; c.alt = ''; c.width = wm.width; c.height = wm.height;
  if (wm.loading) c.loading = wm.loading;
  wm.parentNode.insertBefore(pair, wm); pair.appendChild(c); pair.appendChild(wm); wm.classList.add('wmcopy');
});

// Galleries: a picture opens large on the same page; arrows or swipe move to the next one.
(function () {
  var shots = Array.prototype.slice.call(document.querySelectorAll('.gallery .shot'));
  if (!shots.length || !window.HTMLDialogElement) return;
  var d = document.createElement('dialog'); d.className = 'viewer'; d.setAttribute('aria-label', 'Picture viewer');
  d.innerHTML = '<figure><div class="pair"><img class="clean" alt=""><img class="wmcopy" alt=""></div></figure><div class="cap"></div><button class="x" aria-label="Close">×</button><button class="prev" aria-label="Previous picture">‹</button><button class="next" aria-label="Next picture">›</button>';
  document.body.appendChild(d);
  var img = d.querySelector('img.wmcopy'), cleanImg = d.querySelector('img.clean'), cap = d.querySelector('.cap'), i = 0, x0 = null;
  function show(n) {
    i = (n + shots.length) % shots.length;
    img.src = shots[i].href; cleanImg.src = cleanOf(shots[i].href); img.alt = cleanImg.alt = shots[i].querySelector('img').alt;
    cap.textContent = shots[i].dataset.title + '  ·  ' + (i + 1) + ' / ' + shots.length;
  }
  shots.forEach(function (a, n) { a.addEventListener('click', function (e) { e.preventDefault(); show(n); d.showModal(); }); });
  d.querySelector('.x').addEventListener('click', function () { d.close(); });
  d.querySelector('.prev').addEventListener('click', function () { show(i - 1); });
  d.querySelector('.next').addEventListener('click', function () { show(i + 1); });
  d.addEventListener('click', function (e) { if (e.target === d || e.target.tagName === 'FIGURE') d.close(); });
  d.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
  d.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  d.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); });
  d.addEventListener('close', function () { img.removeAttribute('src'); cleanImg.removeAttribute('src'); shots[i].focus(); });
})();

/* music: switch versions, one song plays at a time */
document.querySelectorAll('.song').forEach(function (card) {
  var audio = card.querySelector('audio'), cover = card.querySelector('.cover');
  card.querySelectorAll('.take').forEach(function (b) {
    b.addEventListener('click', function () {
      var playing = !audio.paused;
      card.querySelectorAll('.take').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      audio.src = b.dataset.src; cover.src = b.dataset.cover;
      if (playing) audio.play();
    });
  });
  audio.addEventListener('play', function () {
    document.querySelectorAll('.song audio').forEach(function (o) { if (o !== audio) o.pause(); });
  });
  audio.addEventListener('contextmenu', function (e) { e.preventDefault(); });
});
