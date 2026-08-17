// Agentic Service Designer — site JS
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Mermaid rendering (only when the CDN script has loaded)
  ready(function () {
    if (window.mermaid && document.querySelector('.mermaid')) {
      try {
        mermaid.initialize({ startOnLoad: true, theme: 'default', securityLevel: 'loose' });
      } catch (e) { console.warn('mermaid init:', e); }
    }
  });

  // Article grid filters (home page)
  ready(function () {
    var grid = document.getElementById('grid');
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
    var countEl = document.getElementById('count');
    var state = { q: '', track: '', fam: '' };

    function apply() {
      var q = state.q.toLowerCase();
      var n = 0;
      cards.forEach(function (c) {
        var okQ = !q || (c.dataset.search || '').includes(q);
        var okT = !state.track || c.dataset.track === state.track;
        var okF = !state.fam || (c.dataset.tech || '').includes(state.fam);
        var show = okQ && okT && okF;
        c.style.display = show ? '' : 'none';
        if (show) n++;
      });
      if (countEl) countEl.textContent = 'Showing ' + n + ' of ' + cards.length + ' case studies';
    }

    var qInput = document.getElementById('q');
    if (qInput) qInput.addEventListener('input', function (e) { state.q = e.target.value; apply(); });

    document.querySelectorAll('.fbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var group = b.closest('.fgroup').dataset.group;
        b.closest('.fgroup').querySelectorAll('.fbtn').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        state[group] = b.dataset.val;
        apply();
      });
    });
    apply();
  });

  // Smooth-scroll for same-page anchor links
  ready(function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
      });
    });
  });
})();
