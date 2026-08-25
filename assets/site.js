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
      if (countEl) countEl.textContent = (state.q || state.cat || state.tracks.length) ? 'Showing ' + n + ' of ' + cards.length : '';
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

    // ---------- About page: interactive code portrait ----------
  // Photo-derived ASCII portrait. The image itself stays static; hovering
  // reveals each cell's true photo colour, and clicking spreads colour
  // across the portrait (or back to mono). After timothymaurer.nl.
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
    var rgb = grid.rgb || null;
    var N = COLS * ROWS;

    // ASCII density ramp, per-cell random glyphs, slow flicker
    var RAMP = [' ', '.', ',:;-', '~=+!?', '/\\|<>{}[]', 'cvxznrst', 'oaepqdbgu', 'AXYZSRG094', 'OWQB$&#%86', '@#MW$%&B08', '@#$%&WMB8N'];
    var OPACITY = [0, 0.30, 0.30, 0.30, 0.65, 0.65, 0.65, 1.0, 1.0, 1.0, 1.0];
    var baseGlyphs = new Array(N);
    var flickerPhase = new Array(N), flickerInterval = new Array(N);
    var frame = 0;
    var gi, lv, cs;
    for (gi = 0; gi < N; gi++) {
      lv = lum[gi];
      cs = RAMP[lv];
      baseGlyphs[gi] = (lv === 0) ? ' ' : cs[Math.floor(Math.random() * cs.length)];
      flickerPhase[gi] = Math.floor(Math.random() * 600);
      flickerInterval[gi] = 300 + Math.floor(Math.random() * 900);
    }

    // virus spread state: 0 = mono, 1 = coloured
    var infected = new Uint8Array(N);
    var spreading = false;
    var spreadDir = 'color';
    var frontier = [];
    var spreadTimer = 0;
    var cellNoise = new Array(N);
    for (gi = 0; gi < N; gi++) cellNoise[gi] = Math.random();
    var isAllColored = false;

    var mouseX = -1000, mouseY = -1000;
    var HOVER_RADIUS = 70;

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

    function startSpread(fromX, fromY, dir) {
      spreading = true;
      spreadDir = dir;
      var cx = Math.floor(fromX / dim.cw);
      var cy = Math.floor(fromY / dim.ch);
      frontier = [];
      for (var dy = -2; dy <= 2; dy++) {
        for (var dx = -2; dx <= 2; dx++) {
          var nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
            var idx = ny * COLS + nx;
            var target = dir === 'color' ? 1 : 0;
            if (infected[idx] !== target) { infected[idx] = target; frontier.push(idx); }
          }
        }
      }
      spreadTimer = 0;
    }

    function stepSpread() {
      if (!spreading || frontier.length === 0) { spreading = false; return; }
      spreadTimer++;
      if (spreadTimer % 5 >= 3) return; // burst-pause pacing
      var target = spreadDir === 'color' ? 1 : 0;
      var newFrontier = [];
      var batch = Math.min(15 + Math.floor(Math.random() * 20), frontier.length);
      for (var b = 0; b < batch; b++) {
        if (frontier.length === 0) break;
        var pick = Math.floor(Math.random() * frontier.length);
        var idx = frontier[pick];
        frontier[pick] = frontier[frontier.length - 1];
        frontier.pop();
        var x = idx % COLS;
        var y = (idx - x) / COLS;
        var dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        if (Math.random() < 0.25) dirs.push([-1,-1],[1,-1],[-1,1],[1,1]);
        if (Math.random() < 0.05) dirs.push([Math.floor((Math.random()-0.5)*12), Math.floor((Math.random()-0.5)*8)]);
        for (var di = 0; di < dirs.length; di++) {
          var ddx = dirs[di][0], ddy = dirs[di][1];
          var nx = x + ddx, ny = y + ddy;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
            var ni = ny * COLS + nx;
            if (infected[ni] !== target) {
              if (Math.random() > cellNoise[ni] * 0.55) { infected[ni] = target; newFrontier.push(ni); }
              else { newFrontier.push(idx); }
            }
          }
        }
      }
      frontier = frontier.concat(newFrontier);
      if (frontier.length === 0) spreading = false;
    }

    function draw() {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, dim.w, dim.h);
      var cellH = dim.ch, cellW = dim.cw;
      var fs = Math.max(4, Math.round(cellW * 1.67));
      ctx.font = '400 ' + fs + 'px "IBM Plex Mono", Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      frame++;
      var i, gx, gy, px, py, s, lv2, glyph, alpha;
      for (gy = 0; gy < ROWS; gy++) {
        for (gx = 0; gx < COLS; gx++) {
          i = gy * COLS + gx;
          lv2 = lum[i];
          if (!lv2) continue;
          s = lv2 / 9;
          px = (gx + 0.5) * cellW;
          py = (gy + 0.5) * cellH;
          var dxm = px - mouseX, dym = py - mouseY;
          var dist = Math.sqrt(dxm * dxm + dym * dym);
          var inHover = dist < HOVER_RADIUS * (0.35 + cellNoise[i] * 0.65);
          if ((frame + flickerPhase[i]) % flickerInterval[i] === 0) {
            cs = RAMP[lv2];
            baseGlyphs[i] = cs[Math.floor(Math.random() * cs.length)];
          }
          glyph = baseGlyphs[i];
          alpha = OPACITY[lv2];
          if (infected[i] === 1 || inHover) {
            if (rgb) {
              var o = i * 3;
              ctx.fillStyle = 'rgba(' + rgb[o] + ',' + rgb[o+1] + ',' + rgb[o+2] + ',' + alpha + ')';
            } else {
              ctx.fillStyle = 'rgba(212,212,212,' + alpha + ')';
            }
          } else {
            ctx.fillStyle = 'rgba(212,212,212,' + alpha + ')';
          }
          ctx.fillText(glyph, px, py);
        }
      }
    }

    function loop() {
      stepSpread();
      draw();
      requestAnimationFrame(loop);
    }

    canvas.addEventListener('mousemove', function (ev) {
      var rect = canvas.getBoundingClientRect();
      mouseX = ev.clientX - rect.left;
      mouseY = ev.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', function () { mouseX = -1000; mouseY = -1000; });
    canvas.addEventListener('click', function (ev) {
      var rect = canvas.getBoundingClientRect();
      var cx = ev.clientX - rect.left;
      var cy = ev.clientY - rect.top;
      isAllColored = !isAllColored;
      startSpread(cx, cy, isAllColored ? 'color' : 'mono');
    });

    draw();
    var fallback = stage.querySelector('.portrait-fallback');
    if (fallback) fallback.style.display = 'none';
    if (reduceMotion) return;
    requestAnimationFrame(loop);
  });
// Anchor smooth-scrolling is handled by `html { scroll-behavior: smooth }` in CSS,
// which also respects prefers-reduced-motion; no JS needed.
})();
