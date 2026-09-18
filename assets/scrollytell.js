/* Scroll-driven story.

   The stage is held in place by CSS position:sticky, so the page never takes the
   scroll away from the reader. This script does three things on top of that:
   swaps the screen as each step reaches the middle of the viewport, tilts the
   device in real 3D by how far through the section you are, and opens a lens over
   the region the current step is talking about.

   Everything degrades: the steps are ordinary text, the stage shows the first
   screen without script, and all motion stops under prefers-reduced-motion.

   Markup:
     <section class="st" data-align="right">
       <div class="st-rail"><div class="st-stage">
         <div class="st-device phone">
           <div class="st-screen">
             <img class="st-shot" src="..." alt="">   one per step
             <div class="st-lens"></div>
           </div>
         </div>
       </div></div>
       <ol class="st-copy">
         <li class="st-step" data-shot="0" data-lens="62,18,14"> ... </li>
       </ol>
     </section>
   data-shot is the index of the image this step shows.
   data-lens is "x%,y%,radius%" of the screen to open the lens over; omit for none.
*/
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setUp(section) {
    var shots = Array.prototype.slice.call(section.querySelectorAll('.st-shot'));
    var steps = Array.prototype.slice.call(section.querySelectorAll('.st-step'));
    var device = section.querySelector('.st-device');
    var lens = section.querySelector('.st-lens');
    if (!shots.length || !steps.length) return;

    shots[0].classList.add('is-on');
    steps[0].classList.add('is-on');

    var ticks = document.createElement('div');
    ticks.className = 'st-ticks';
    steps.forEach(function () { ticks.appendChild(document.createElement('i')); });
    ticks.firstChild.classList.add('on');
    var stage = section.querySelector('.st-stage');
    if (stage && steps.length > 1) stage.appendChild(ticks);

    var current = -1;
    function go(i) {
      if (i === current) return;
      current = i;
      var step = steps[i];
      var shotIndex = parseInt(step.getAttribute('data-shot') || i, 10);
      shots.forEach(function (s, k) { s.classList.toggle('is-on', k === shotIndex); });
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      Array.prototype.forEach.call(ticks.children, function (t, k) { t.classList.toggle('on', k === i); });

      if (lens) {
        var l = step.getAttribute('data-lens');
        if (l && !reduce) {
          var p = l.split(',');
          lens.style.setProperty('--lx', p[0] + '%');
          lens.style.setProperty('--ly', p[1] + '%');
          lens.style.setProperty('--lr', (p[2] || 12) + '%');
          lens.classList.add('is-on');
        } else {
          lens.classList.remove('is-on');
        }
      }
    }

    /* which step owns the middle of the viewport */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) go(steps.indexOf(e.target));
      });
    }, { rootMargin: '-48% 0px -48% 0px', threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });

    /* the tilt: a few degrees across the whole section, not a spin */
    if (reduce || !device) return;
    var ticking = false;
    function frame() {
      ticking = false;
      var r = section.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      if (r.bottom < 0 || r.top > vh) return;
      var t = (vh * 0.5 - r.top) / Math.max(1, r.height);
      t = Math.max(0, Math.min(1, t));
      var ry = (t - 0.5) * 17;          // rotate through about 17 degrees
      var rx = 5 - Math.abs(t - 0.5) * 7;
      var ty = (0.5 - Math.abs(t - 0.5)) * -14;
      device.style.transform =
        'rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg) translateY(' + ty.toFixed(1) + 'px)';
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  }

  function init() {
    if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      /* narrow: the stage is static and every step reads as ordinary content */
      document.querySelectorAll('.st .st-shot').forEach(function (s, i) {
        if (i === 0) s.classList.add('is-on');
      });
      return;
    }
    document.querySelectorAll('section.st').forEach(setUp);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
