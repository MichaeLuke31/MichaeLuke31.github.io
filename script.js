// script.js
// Efficiently toggle a "scrolled" class on the header when page is scrolled.
// Uses requestAnimationFrame to avoid jank, and exits early if user prefers reduced motion.

(function () {
  const header = document.getElementById('page-header');
  if (!header) return;

  // Respect user preference for reduced motion
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;

  let lastKnownScrollY = 0;
  let ticking = false;
  const threshold = 20; // pixels of scroll before header shrinks

  function onScroll() {
    lastKnownScrollY = window.scrollY || window.pageYOffset;
    requestTick();
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(update);
    }
    ticking = true;
  }

  function update() {
    const shouldBeScrolled = lastKnownScrollY > threshold;
    header.classList.toggle('scrolled', shouldBeScrolled);
    ticking = false;
  }

  // Initialize state on load (in case page opens scrolled)
  function init() {
    lastKnownScrollY = window.scrollY || window.pageYOffset;
    header.classList.toggle('scrolled', lastKnownScrollY > threshold);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', requestTick);
  document.addEventListener('DOMContentLoaded', init);
  init();
})();
