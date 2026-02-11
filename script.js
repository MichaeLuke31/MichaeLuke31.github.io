// script.js
// Handles:
//  - header "scrolled" shrinking (existing behavior)
//  - header auto-hide when scrolling down and reveal when scrolling up
//  - top progress indicator (aria-updated)
// Uses requestAnimationFrame for efficiency and respects prefers-reduced-motion.

(function () {
  const header = document.getElementById('page-header');
  const progress = document.getElementById('page-progress');
  if (!header) return;

  // Respect reduced motion preference
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReduced = reduceMotion.matches;

  // If reduced motion, we won't auto-hide; keep only the scrolled state and progress if user allows later.
  if (prefersReduced) {
    // Still initialize scrolled state and update progress (but don't toggle hide)
    initScrolled();
    updateProgress();
    window.addEventListener('scroll', throttleTick);
    window.addEventListener('resize', throttleTick);
    return;
  }

  let lastY = window.scrollY || 0;
  let lastKnownScrollY = lastY;
  let ticking = false;
  const shrinkThreshold = 20;   // px before header shrinks (existing behavior)
  const hideThreshold = 80;     // px of scrolling down before header hides
  let lastDirection = null;     // "down" or "up"
  let accumulatedDelta = 0;     // accumulate delta to avoid tiny flips

  // Initialize
  initScrolled();
  updateProgress();

  // Attach listeners
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  function onResize() {
    // recompute immediately on resize
    lastKnownScrollY = window.scrollY || 0;
    requestTick();
  }

  function onScroll() {
    lastKnownScrollY = window.scrollY || 0;
    requestTick();
  }

  function requestTick() {
    if (!ticking) requestAnimationFrame(update);
    ticking = true;
  }

  function update() {
    const y = lastKnownScrollY;
    // 1) Shrink state
    header.classList.toggle('scrolled', y > shrinkThreshold);

    // 2) Progress bar update
    updateProgress();

    // 3) Auto-hide logic
    const delta = y - lastY;
    const dir = delta > 0 ? 'down' : (delta < 0 ? 'up' : lastDirection);
    // If direction changed, reset accumulator to avoid jitter
    if (dir !== lastDirection) accumulatedDelta = 0;

    accumulatedDelta += Math.abs(delta);
    // Only act when accumulated movement exceeds a small threshold to avoid flicker
    const actionThreshold = 12;

    if (accumulatedDelta > actionThreshold) {
      if (dir === 'down' && y > hideThreshold) {
        // hide header
        header.classList.add('hidden');
      } else if (dir === 'up' || y <= hideThreshold) {
        // show header
        header.classList.remove('hidden');
      }
      accumulatedDelta = 0;
    }

    lastDirection = dir;
    lastY = y;
    ticking = false;
  }

  // Fallback initializer for the scrolled class when page loads at a scrolled position
  function initScrolled() {
    const y = window.scrollY || 0;
    header.classList.toggle('scrolled', y > shrinkThreshold);
    header.classList.toggle('hidden', false);
  }

  // Update top progress indicator
  function updateProgress() {
    if (!progress) return;
    const doc = document.documentElement;
    const body = document.body;
    const scrollTop = window.scrollY || window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
    const scrollHeight = Math.max(doc.scrollHeight, body.scrollHeight) - window.innerHeight;
    const pct = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 0;
    // visually update width
    progress.style.width = pct + '%';
    // update accessible aria value
    progress.setAttribute('aria-valuenow', String(pct));
    // expose progress only when page is scrollable to assistive tech
    progress.setAttribute('aria-hidden', scrollHeight <= 0 ? 'true' : 'false');
  }

  // Throttled rAF tick used for reduced-motion branch or listeners
  let tickingSimple = false;
  function throttleTick() {
    if (!tickingSimple) {
      requestAnimationFrame(() => {
        initScrolled();
        updateProgress();
        tickingSimple = false;
      });
    }
    tickingSimple = true;
  }

  // Initialize immediately
  requestTick();
})();
