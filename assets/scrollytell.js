/* Scroll-driven story.

   The stage is held in place by CSS position:sticky, so the page never takes the
   scroll away from the reader. This script does three things on top of that:
   swaps the screen as each step reaches the middle of the viewport, tilts the
   device in real 3D by how far through the section you are, and moves the frame in
   on the region the current step is talking about.

   Everything degrades: the steps are ordinary text, the stage shows the first
   screen without script, and all motion stops under prefers-reduced-motion.

   Markup:
     <section class="st" data-align="right">
       <div class="st-rail"><div class="st-stage">
         <div class="st-device phone">
           <div class="st-screen">
             <img class="st-shot" src="..." alt="">   one per step
           </div>
         </div>
       </div></div>
       <ol class="st-copy">
         <li class="st-step" data-shot="0" data-zoom="62,18,1.9"> ... </li>
       </ol>
     </section>
   data-stage picks the device on the stage; data-shot is the image within it.
   data-zoom is "x%,y%,scale": the frame moves in on that point. Omit for a full view.
*/
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setUp(section) {
    var devices = Array.prototype.slice.call(section.querySelectorAll('.st-device'));
    var shotsOf = devices.map(function (d) {
      return Array.prototype.slice.call(d.querySelectorAll('.st-shot'));
    });
    var shots = shotsOf.reduce(function (a, b) { return a.concat(b); }, []);
    var steps = Array.prototype.slice.call(section.querySelectorAll('.st-step'));
    if (!shots.length || !steps.length) return;

    shotsOf[0][0].classList.add('is-on');
    if (devices[0]) devices[0].classList.add('is-live');
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
      var stageIndex = parseInt(step.getAttribute('data-stage') || 0, 10);
      var local = shotsOf[stageIndex] || shotsOf[0];
      var shotIndex = parseInt(step.getAttribute('data-shot') || i, 10);
      shotIndex = Math.min(shotIndex, local.length - 1);
      devices.forEach(function (d, k) { d.classList.toggle('is-live', k === stageIndex); });
      shots.forEach(function (s) { s.classList.remove('is-on'); });
      if (local[shotIndex]) local[shotIndex].classList.add('is-on');
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      Array.prototype.forEach.call(ticks.children, function (t, k) { t.classList.toggle('on', k === i); });

      /* the frame moves in on the region this step names */
      var z = step.getAttribute('data-zoom');
      shots.forEach(function (sh) {
        sh.style.removeProperty('--z');
        sh.style.removeProperty('--zx');
        sh.style.removeProperty('--zy');
      });
      var active = local[shotIndex];
      if (active && z && !reduce) {
        var p = z.split(',');
        active.style.setProperty('--zx', p[0] + '%');
        active.style.setProperty('--zy', p[1] + '%');
        active.style.setProperty('--z', p[2] || 1.8);
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
    if (reduce || !devices.length) return;
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
      var live = section.querySelector('.st-device.is-live') || devices[0];
      live.style.transform =
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
