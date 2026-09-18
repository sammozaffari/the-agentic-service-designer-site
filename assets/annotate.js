/* Scroll-driven annotations for case-study artefacts.
   Markup:
     <figure class="fig fig-wide annot">
       <img src="..." alt="...">
       <script type="application/json" class="annot-data">[
         {"n":1,"x":22,"y":41,"kind":"decision","title":"...","body":"...","link":{"href":"#sec-4","text":"..."}}
       ]</script>
       <figcaption>...</figcaption>
     </figure>
   kind: decision | evidence | quote | pain | pattern
   x and y are percentages of the image box.

   The list of notes is rendered into the page as real text, so nothing is lost
   when JavaScript does not run, when the page is printed, or to a screen reader.
   The pins and the pop-out cards are the enhancement on top. */
(function () {
  var PREFIX = { decision: 'Decision', evidence: 'Evidence', quote: 'What we heard', pain: 'Pain point', pattern: 'Pattern' };

  function build(fig) {
    var script = fig.querySelector('script.annot-data');
    if (!script) return;
    var notes;
    try { notes = JSON.parse(script.textContent); } catch (e) { return; }
    if (!notes.length) return;

    var media = fig.querySelector('img, svg, .annot-media');
    if (!media) return;

    var stage = document.createElement('div');
    stage.className = 'annot-stage';
    media.parentNode.insertBefore(stage, media);
    stage.appendChild(media);

    var list = document.createElement('ol');
    list.className = 'annot-list';

    notes.forEach(function (note, i) {
      var pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'annot-pin';
      pin.style.left = note.x + '%';
      pin.style.top = note.y + '%';
      pin.textContent = note.n != null ? note.n : (i + 1);
      pin.setAttribute('aria-describedby', 'annot-' + (note.n || i + 1) + '-' + Math.random().toString(36).slice(2, 7));

      var pop = document.createElement('div');
      pop.className = 'annot-pop' + (note.x > 58 ? ' left' : '');
      pop.id = pin.getAttribute('aria-describedby');
      pop.innerHTML =
        '<span class="annot-kind">' + (PREFIX[note.kind] || 'Note') + '</span>' +
        '<b>' + (note.title || '') + '</b>' +
        '<p>' + (note.body || '') + '</p>' +
        (note.link ? '<a href="' + note.link.href + '">' + note.link.text + '</a>' : '');
      pop.style.left = note.x + '%';
      pop.style.top = note.y + '%';

      stage.appendChild(pin);
      stage.appendChild(pop);

      var li = document.createElement('li');
      li.className = 'annot-note';
      li.innerHTML =
        '<span class="n">' + (note.n != null ? note.n : i + 1) + '</span>' +
        '<div><span class="annot-kind">' + (PREFIX[note.kind] || 'Note') + '</span>' +
        '<b>' + (note.title || '') + '</b>' +
        '<p>' + (note.body || '') + '</p>' +
        (note.link ? '<a href="' + note.link.href + '">' + note.link.text + '</a>' : '') + '</div>';
      list.appendChild(li);

      function open() {
        stage.querySelectorAll('.is-open').forEach(function (n) { n.classList.remove('is-open'); });
        list.querySelectorAll('.is-open').forEach(function (n) { n.classList.remove('is-open'); });
        pop.classList.add('is-open'); pin.classList.add('is-open'); li.classList.add('is-open');
      }
      pin.addEventListener('mouseenter', open);
      pin.addEventListener('focus', open);
      pin.addEventListener('click', open);
      li.addEventListener('mouseenter', open);
      note._open = open;
    });

    var cap = fig.querySelector('figcaption');
    if (cap) fig.insertBefore(list, cap); else fig.appendChild(list);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* As the figure crosses the viewport, step through the notes in order. */
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var r = stage.getBoundingClientRect();
        var vh = window.innerHeight || 800;
        if (r.bottom < vh * 0.2 || r.top > vh * 0.9) return;
        var travelled = (vh * 0.75 - r.top) / Math.max(1, r.height + vh * 0.45);
        var i = Math.floor(Math.min(0.999, Math.max(0, travelled)) * notes.length);
        if (notes[i] && !notes[i]._isOpen) {
          notes.forEach(function (n) { n._isOpen = false; });
          notes[i]._isOpen = true;
          notes[i]._open();
        }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function init() { document.querySelectorAll('figure.annot').forEach(build); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
