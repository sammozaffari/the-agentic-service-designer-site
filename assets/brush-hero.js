/* brush-hero.js
   Generative p5.brush hero backgrounds for case-study article heroes.

   Targets every `.art-hero` (and any element carrying `data-brush-hero`).
   A seeded, static brush field is rendered once into a transparent WEBGL
   canvas positioned behind the hero's content, then the loop is stopped.
   The seed comes from the data attribute (article slug), so two slugs
   produce visibly different compositions.

   Additive only: no markup is rewritten here. The canvas is inserted as a
   child of the hero and styled via assets/article-blocks.css.
*/

(function () {
  'use strict';

  var REDUCED =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- palette (sampled from assets/style.css :root tokens) ---------- */
  // lavender, sage, blue, butter, rose
  var PALETTE = ['#e8defa', '#e8eee5', '#e9f1f7', '#fff2bb', '#f9e9e4'];
  // keep the field muted: three of the pastels
  var FIELD_COLORS = ['#e8defa', '#e8eee5', '#e9f1f7'];
  // one slightly deeper accent for a delicate outline ribbon, still from the site family
  var ACCENT_COLORS = ['#d8c6f0', '#cfe0c8', '#d4e3f0'];

  /* ---------- helpers ---------- */
  function toRad(deg) {
    return (deg * Math.PI) / 180;
  }

  /* seeded PRNG (mulberry32) */
  function hashStr(str) {
    var h = 2166136261;
    var s = String(str);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seedAttr, pageSeed) {
    var src = seedAttr ? String(seedAttr).trim() : '';
    if (!src) {
      src = pageSeed || 'agentic-brush';
    }
    return mulberry32(hashStr(src));
  }

  /* ---------- paint ---------- */
  // Draw a static organic brush field across a centred WEBGL coordinate space.
  function paint(p, w, h, rng) {
    var hw = w / 2;
    var hh = h / 2;
    var span = Math.max(w, h);

    brush.scaleBrushes(Math.max(2.5, Math.min(5, span / 180)));

    // --- soft wash blobs for depth (low alpha, behind everything) ---
    var blobs = 3 + Math.floor(rng() * 3);
    for (var b = 0; b < blobs; b++) {
      var bcol = PALETTE[Math.floor(rng() * PALETTE.length)];
      var bx = (rng() * 2 - 1) * hw * 0.7;
      var by = (rng() * 2 - 1) * hh * 0.7;
      var br = span * (0.12 + rng() * 0.22);
      brush.fill(bcol, 60 + rng() * 40);
      brush.noStroke();
      brush.noHatch();
      brush.circle(bx, by, br);
    }
    brush.noFill();

    // --- organic flowing ribbons following a seeded vector field ---
    var fields = ['curved', 'waves', 'seabed', 'spiral', 'zigzag'];
    brush.field(fields[Math.floor(rng() * fields.length)]);

    var ribbons = 13 + Math.floor(rng() * 9);
    for (var i = 0; i < ribbons; i++) {
      var col = FIELD_COLORS[Math.floor(rng() * FIELD_COLORS.length)];
      var srcX = (rng() * 2 - 1) * hw * 0.95;
      var srcY = (rng() * 2 - 1) * hh * 0.95;
      var len = span * (0.3 + rng() * 0.65);
      var dir = rng() * 360; // degrees; p5 default angleMode is RADIANS
      var weight = 3 + rng() * 11;

      // field-aware ribbon
      brush.stroke(col);
      brush.strokeWeight(weight);
      brush.flowLine(srcX, srcY, len, toRad(dir));

      // crisp hairline accent following roughly the same start
      brush.stroke(ACCENT_COLORS[Math.floor(rng() * ACCENT_COLORS.length)]);
      brush.strokeWeight(1.6);
      brush.flowLine(srcX, srcY, len * 0.9, toRad(dir + 15 * (rng() - 0.5)));
    }
    brush.noField();

    // --- a couple of hand-drawn wandering splines for organic weight ---
    var splines = 2 + Math.floor(rng() * 2);
    for (var s = 0; s < splines; s++) {
      var sc = PALETTE[Math.floor(rng() * PALETTE.length)];
      var sx = (rng() * 2 - 1) * hw * 0.6;
      var sy = (rng() * 2 - 1) * hh * 0.6;
      var pts = [];
      var px = sx;
      var py = sy;
      var heading = rng() * 360;
      var segs = 5 + Math.floor(rng() * 3);
      for (var k = 0; k < segs; k++) {
        pts.push([px, py, 0.5 + rng() * 1.0]);
        heading += (rng() - 0.5) * 70;
        var step = span * (0.05 + rng() * 0.09);
        px += Math.cos(toRad(heading)) * step;
        py += Math.sin(toRad(heading)) * step;
      }
      brush.set('HB', sc, 4);
      brush.strokeWeight(4);
      brush.spline(pts, 0.5);
    }

    brush.noStroke();
  }

  /* ---------- mount one hero ---------- */
  function mount(el, rng) {
    if (typeof window.p5 === 'undefined' || typeof window.brush === 'undefined') {
      return;
    }
    var w = Math.max(1, el.clientWidth);
    var h = Math.max(1, el.clientHeight);

    var sketch = function (p) {
      if (typeof brush.instance === 'function') {
        brush.instance(p);
      }

      var cw = w;
      var ch = h;

      p.setup = function () {
        p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
        var cnv = p.createCanvas(cw, ch, p.WEBGL);
        if (cnv && cnv.elt) {
          cnv.elt.classList.add('brush-canvas');
          cnv.elt.setAttribute('aria-hidden', 'true');
          cnv.elt.setAttribute('tabindex', '-1');
        }
        p.noLoop(); // render exactly one frame (p5 runs draw once after setup)
      };

      p.draw = function () {
        p.clear(); // transparent canvas: strokes composite over the page paper
        paint(p, cw, ch, rng);
        p.noLoop();
      };

      p.windowResized = function () {
        var nw = el.clientWidth;
        var nh = el.clientHeight;
        if (nw === cw && nh === ch) {
          return;
        }
        cw = Math.max(1, nw);
        ch = Math.max(1, nh);
        p.resizeCanvas(cw, ch);
        p.redraw();
      };
    };

    new window.p5(sketch, el);
  }

  /* ---------- init ---------- */
  function init() {
    var targets = document.querySelectorAll(
      '.art-hero[data-brush-hero], .art-hero, [data-brush-hero]'
    );
    var seen = new Set();
    targets.forEach(function (el) {
      if (el.dataset && el.dataset.brushHero === 'off') {
        return;
      }
      if (seen.has(el)) {
        return;
      }
      seen.add(el);
      var rng = makeRng(
        el.getAttribute('data-brush-hero'),
        window.location.pathname
      );
      // prefers-reduced-motion: a single static frame is all we ever draw,
      // and noLoop() guarantees no animation, so no extra branch is needed.
      mount(el, rng);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
