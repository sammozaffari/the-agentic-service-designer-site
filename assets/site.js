// The Agentic Service Designer — site behaviours
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ---------- Archive: category links + search + track filter + empty state ----------
  ready(function () {
    var grid = document.getElementById('grid-list') || document.getElementById('grid');
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
    var countEl = document.getElementById('count');
    var emptyEl = document.getElementById('empty');
    var qInput = document.getElementById('q');
    var qClear = document.getElementById('q-clear');
    var state = { q: '', cat: '', tracks: [] };

    function apply() {
      var q = state.q.toLowerCase();
      var n = 0;
      cards.forEach(function (c) {
        var okQ = !q || (c.dataset.search || '').indexOf(q) !== -1;
        var okC = !state.cat || c.dataset.cat === state.cat;
        var okT = !state.tracks.length || state.tracks.indexOf(c.dataset.track) !== -1;
        var show = okQ && okC && okT;
        c.style.display = show ? '' : 'none';
        if (show) { c.style.setProperty('--i', n); n++; }
      });
      if (countEl) countEl.textContent = 'Showing ' + n + ' of ' + cards.length;
      if (emptyEl) emptyEl.hidden = n !== 0;
      if (qClear) qClear.hidden = !state.q;
    }

    function clearAll() {
      state.q = ''; state.cat = ''; state.tracks = [];
      if (qInput) qInput.value = '';
      document.querySelectorAll('.filter-links a[data-cat]').forEach(function (l) {
        l.classList.toggle('on', l.dataset.cat === '');
      });
      document.querySelectorAll('.toggle-track.on').forEach(function (x) { x.classList.remove('on'); });
      apply();
    }

    document.querySelectorAll('.filter-links a[data-cat]').forEach(function (l) {
      l.addEventListener('click', function () {
        document.querySelectorAll('.filter-links a[data-cat]').forEach(function (x) { x.classList.remove('on'); });
        l.classList.add('on');
        state.cat = l.dataset.cat;
        apply();
      });
    });

    if (qInput) {
      qInput.addEventListener('input', function (e) { state.q = e.target.value; apply(); });
      qInput.addEventListener('search', function () { state.q = ''; apply(); });
    }
    if (qClear) {
      qClear.addEventListener('click', function () {
        state.q = '';
        if (qInput) { qInput.value = ''; qInput.focus(); }
        apply();
      });
    }

    var toggleBtn = document.getElementById('filter-toggle');
    var panel = document.getElementById('filter-panel');
    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', function () {
        var open = panel.classList.toggle('open');
        toggleBtn.classList.toggle('on', open);
      });
    }

    document.querySelectorAll('.toggle-track').forEach(function (b) {
      b.addEventListener('click', function () {
        b.classList.toggle('on');
        state.tracks = Array.prototype.map.call(document.querySelectorAll('.toggle-track.on'), function (x) { return x.dataset.track; });
        apply();
      });
    });
    ['filter-clear', 'empty-clear'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', clearAll);
    });

    apply();
  });

  // ---------- Article pages: progress bar, TOC scrollspy, back-to-top ----------
  ready(function () {
    var body = document.querySelector('.art-body');
    if (!body) return;

    var bar = document.getElementById('progress');
    var topBtn = document.getElementById('backtop');
    var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
    var sections = [];
    tocLinks.forEach(function (l) {
      var el = document.querySelector(l.getAttribute('href'));
      if (el) sections.push({ el: el, link: l });
    });

    function onScroll() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? (doc.scrollTop || document.body.scrollTop) / max : 0;
      if (bar) bar.style.width = (pct * 100).toFixed(2) + '%';
      if (topBtn) topBtn.classList.toggle('show', pct > 0.35);
      var y = (doc.scrollTop || document.body.scrollTop) + 140;
      var active = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].el.offsetTop <= y) active = sections[i];
      }
      tocLinks.forEach(function (l) { l.classList.remove('active'); });
      if (active) active.link.classList.add('active');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (topBtn) topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // ---------- smooth scroll for anchors ----------
  ready(function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
      });
    });
  });
})();
