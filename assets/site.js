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

  // ---------- About page: interactive dot portrait ----------
  ready(function () {
    var canvas = document.getElementById('portrait');
    if (!canvas) return;
    var dataEl = document.getElementById('portrait-data');
    if (!dataEl || dataEl.textContent.trim() === 'null') return;
    var grid = JSON.parse(dataEl.textContent);
    var stage = canvas.parentElement;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var COLS = grid.cols, ROWS = grid.rows;
    var lum = new Uint8Array(grid.lum);
    var N = COLS * ROWS;

    // ASCII code-portrait: density ramp of glyphs, per-cell random pick + slow flicker
    var RAMP = [' ', '.', ',:;-', '~=+!?', '/\\|<>{}[]', 'cvxznrst', 'oaepqdbgu', 'AXYZSRG094', 'OWQB$&#%86', '@#MW$%&B08', '@#$%&WMB8N'];
    var baseGlyphs = new Array(N);
    var flickerPhase = new Array(N), flickerInterval = new Array(N);
    var frame = 0;
    for (var gi = 0; gi < N; gi++) {
      var lv = lum[gi];
      var cs = RAMP[lv];
      baseGlyphs[gi] = (lv === 0) ? ' ' : cs[Math.floor(Math.random() * cs.length)];
      flickerPhase[gi] = Math.floor(Math.random() * 600);
      flickerInterval[gi] = 300 + Math.floor(Math.random() * 900);
    }

    // spring state per cell (x displacement in cell units, y, vx, vy)
    var dx = new Float32Array(N), dy = new Float32Array(N);
    var vx = new Float32Array(N), vy = new Float32Array(N);
    var heat = new Float32Array(N); // 0..1 hover heat
    var accentIdx = 0;
    var ACCENTS = [
      [232, 222, 250], // lavender
      [232, 238, 229], // sage
      [255, 242, 187], // butter
      [233, 241, 247], // powder blue
    ];
    var INK = [23, 24, 23];
    var GREY = [190, 189, 184];

    var mouse = { x: -1000, y: -1000, inside: false, gridX: -1, gridY: -1 };
    var R = 26; // hover radius in cell units

    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h, cw: w / COLS, ch: h / ROWS };
    }

    var dim = resize();
    window.addEventListener('resize', function () { dim = resize(); draw(); });

    function lerp(a, b, t) { return a + (b - a) * t; }
    function mix(c1, c2, t) { return [lerp(c1[0], c2[0], t) | 0, lerp(c1[1], c2[1], t) | 0, lerp(c1[2], c2[2], t) | 0]; }

    var springK = 0.05, damp = 0.78;
    var running = false;

    function step() {
      var i, gx, gy, x, y, d, f;
      var energy = 0;
      for (gy = 0; gy < ROWS; gy++) {
        for (gx = 0; gx < COLS; gx++) {
          i = gy * COLS + gx;
          if (!lum[i]) { dx[i] = dy[i] = vx[i] = vy[i] = 0; continue; }
          // repulsion impulse from cursor
          d = Math.max(0.001, Math.hypot(mouse.gridX - gx, mouse.gridY - gy));
          if (mouse.inside && d < R) {
            f = (1 - d / R) * 0.24;
            vx[i] += ((gx - mouse.gridX) / d) * f + (Math.random() - 0.5) * 0.06;
            vy[i] += ((gy - mouse.gridY) / d) * f + (Math.random() - 0.5) * 0.06;
            heat[i] = Math.min(1, heat[i] + 0.35);
          } else {
            heat[i] = Math.max(0, heat[i] - 0.08);
          }
          vx[i] -= springK * dx[i]; vy[i] -= springK * dy[i];
          vx[i] *= damp; vy[i] *= damp;
          dx[i] += vx[i]; dy[i] += vy[i];
          dx[i] *= 0.985; dy[i] *= 0.985;
          energy += Math.abs(vx[i]) + Math.abs(vy[i]) + heat[i];
        }
      }
      if (energy > 60) { draw(); requestAnimationFrame(step); }
      else { running = false; draw(); }
    }

    function kick() {
      if (reduceMotion) return;
      if (!running) { running = true; requestAnimationFrame(step); }
    }

    function draw() {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, dim.w, dim.h);
      var accent = ACCENTS[accentIdx];
      var cellH = dim.ch, cellW = dim.cw;
      var fs = Math.max(4, Math.round(cellW * 1.67));
      ctx.font = '400 ' + fs + 'px "IBM Plex Mono", Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      frame++;
      var i, gx, gy, px, py, s, lv, glyph, cs;
      for (gy = 0; gy < ROWS; gy++) {
        for (gx = 0; gx < COLS; gx++) {
          i = gy * COLS + gx;
          lv = lum[i];
          if (!lv) continue;
          s = lv / 9; // 0..1 darkness weight (higher = darker)
          px = (gx + dx[i]) * cellW + cellW / 2;
          py = (gy + dy[i]) * cellH + cellH / 2;
          if ((frame + flickerPhase[i]) % flickerInterval[i] === 0) {
            cs = RAMP[lv];
            baseGlyphs[i] = cs[Math.floor(Math.random() * cs.length)];
          }
          glyph = baseGlyphs[i];
          if (heat[i] > 0.02) {
            var h = heat[i];
            var base = mix(accent, INK, s * 0.85);
            ctx.fillStyle = 'rgba(' + base[0] + ',' + base[1] + ',' + base[2] + ',' + (0.55 + h * 0.45).toFixed(2) + ')';
          } else {
            ctx.fillStyle = 'rgba(212,212,212,' + (0.30 + s * 0.70).toFixed(2) + ')';
          }
          ctx.fillText(glyph, px, py);
        }
      }
    }

    function toGrid(ev) {
      var rect = canvas.getBoundingClientRect();
      mouse.gridX = ((ev.clientX - rect.left) / rect.width) * COLS;
      mouse.gridY = ((ev.clientY - rect.top) / rect.height) * ROWS;
    }
    canvas.addEventListener('mousemove', function (ev) {
      mouse.inside = true;
      toGrid(ev);
      kick();
    });
    canvas.addEventListener('mouseleave', function () {
      mouse.inside = false;
      mouse.gridX = mouse.gridY = -1000;
      kick();
    });
    canvas.addEventListener('click', function (ev) {
      toGrid(ev);
      accentIdx = (accentIdx + 1) % ACCENTS.length;
      kick();
    });

    draw();
    var fallback = stage.querySelector('.portrait-fallback');
    if (fallback) fallback.style.display = 'none';
    if (reduceMotion) return;
    // gentle idle shimmer
    setInterval(function () {
      if (!running && mouse.inside === false && Math.random() < 0.3) kick();
    }, 1400);
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
