// The Agentic Service Designer — site behaviours
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
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
})();
