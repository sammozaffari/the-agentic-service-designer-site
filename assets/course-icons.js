/* Shared course-page runtime: Lucide icon mounting, Mermaid startup, and the
 * diagram fullscreen control. Loaded by module pages and interactive course
 * pages after the mermaid + lucide UMD bundles.
 *
 * Fullscreen strategy: native Fullscreen API first; if the API is missing or
 * refuses (older Safari, embedded webviews), fall back to a fixed-position
 * modal on the same element so the expand affordance always works. */
(function () {
  'use strict';

  function init() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    if (window.mermaid) {
      window.mermaid.initialize({ startOnLoad: true, securityLevel: 'loose' });
    }
  }

  function isNativeFsActive() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function exitNativeFs() {
    try {
      if (document.exitFullscreen) return document.exitFullscreen();
      if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    } catch (e) { /* fall through */ }
  }

  function openFallback(el) {
    el.classList.add('diagram-fs');
    document.body.classList.add('diagram-fs-open');
    var btn = el.querySelector('.diagram-expand');
    if (btn) btn.setAttribute('aria-label', 'Close expanded diagram');
  }

  function closeFallback(el) {
    el.classList.remove('diagram-fs');
    document.body.classList.remove('diagram-fs-open');
    var btn = el.querySelector('.diagram-expand');
    if (btn) btn.setAttribute('aria-label', 'Expand diagram fullscreen');
  }

  function toggle(btn) {
    var target = document.getElementById(btn.getAttribute('data-target'));
    if (!target) return;
    if (isNativeFsActive()) { exitNativeFs(); return; }
    if (target.classList.contains('diagram-fs')) { closeFallback(target); return; }
    var req = target.requestFullscreen || target.webkitRequestFullscreen;
    if (req) {
      try {
        var p = req.call(target);
        if (p && typeof p.catch === 'function') {
          p.catch(function () { openFallback(target); });
        }
        return;
      } catch (e) { /* fall through to modal */ }
    }
    openFallback(target);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.diagram-expand');
    if (btn) { toggle(btn); return; }
    // click anywhere outside an expanded fallback closes it
    var open = document.querySelector('.diagram.diagram-fs');
    if (open && !open.contains(e.target)) closeFallback(open);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.diagram.diagram-fs');
    if (open) { closeFallback(open); return; }
    if (isNativeFsActive()) exitNativeFs();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
