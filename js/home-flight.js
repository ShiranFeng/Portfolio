(() => {
  'use strict';
  const stage = document.querySelector('[data-home-flight]');
  const canvas = stage?.querySelector('canvas');
  if (!stage || !canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ship = new Image();
  ship.src = 'assets/home-astronaut/flight-ship.png';
  const duration = 4700 / 1.5;
  let width = 0, height = 0, ratio = 1;
  let active = false, started = false, completed = false, start = null, frame = 0;
  let locked = false, lockedY = 0, touchY = null;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function shipWidth() { return 2.5 * Math.max(100, Math.min(width * .16, 205)); }
  function point(theta) {
    const progress = (theta + Math.PI) / (2 * Math.PI);
    const padding = shipWidth() / 2 + 20;
    const x = width + padding - (width + 2 * padding) * progress;
    // The curved route is balanced around the viewport midpoint.
    const y = height * (.3 + .3 * (2 * progress - progress * progress));
    return { x, y, dx: -(width + 2 * padding), dy: height * .3 * (1 - progress) / Math.PI };
  }

  function blockScroll(event) {
    if (locked) event.preventDefault();
  }
  function trackTouchStart(event) { touchY = event.touches[0]?.clientY ?? null; }
  function blockTouchMove(event) {
    const nextY = event.touches[0]?.clientY ?? null;
    if (locked && touchY !== null && nextY !== null && nextY !== touchY) event.preventDefault();
    touchY = nextY;
  }
  function holdScrollPosition() {
    if (!locked) return;
    if (Math.abs(scrollY - lockedY) > 1) window.scrollTo({ top: lockedY, behavior: 'instant' });
  }
  function lockPage() {
    if (locked) return;
    locked = true;
    lockedY = scrollY;
    document.documentElement.classList.add('project-flight-lock');
    addEventListener('wheel', blockScroll, { passive: false, capture: true });
    addEventListener('touchstart', trackTouchStart, { passive: true, capture: true });
    addEventListener('touchmove', blockTouchMove, { passive: false, capture: true });
    addEventListener('keydown', blockScrollKeys, true);
    addEventListener('scroll', holdScrollPosition, { passive: true });
  }
  function blockScrollKeys(event) {
    if (locked && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) event.preventDefault();
  }
  function unlockPage() {
    if (!locked) return;
    locked = false;
    document.documentElement.classList.remove('project-flight-lock');
    removeEventListener('wheel', blockScroll, true);
    removeEventListener('touchstart', trackTouchStart, true);
    removeEventListener('touchmove', blockTouchMove, true);
    removeEventListener('keydown', blockScrollKeys, true);
    removeEventListener('scroll', holdScrollPosition);
  }

  function canStart() {
    const rect = stage.getBoundingClientRect();
    return rect.top <= 1 && rect.bottom >= innerHeight * .55
      && document.documentElement.dataset.journeyFinished === 'true';
  }
  function finish() {
    if (completed) return;
    completed = true;
    context.clearRect(0, 0, width, height);
    stage.classList.add('is-complete');
    document.dispatchEvent(new Event('projecttransitioncomplete'));
  }
  function draw(time) {
    frame = 0;
    if (reduced.matches || document.hidden || !active || completed
      || document.documentElement.dataset.journeyFinished !== 'true') {
      context.clearRect(0, 0, width, height);
      return;
    }
    if (!started) {
      if (!canStart()) return;
      started = true;
      start = time;
      lockPage();
      document.dispatchEvent(new Event('projecttransitionstart'));
    }
    const elapsed = time - start;
    if (elapsed >= duration) {
      finish();
      return;
    }
    const phase = elapsed / duration;
    const progress = phase + .88 * Math.sin(phase * 2 * Math.PI) / (2 * Math.PI);
    const theta = -Math.PI + progress * 2 * Math.PI;

    context.clearRect(0, 0, width, height);
    context.beginPath();
    for (let i = 0; i <= 240; i++) {
      const p = point(-Math.PI + i / 240 * 2 * Math.PI);
      if (i === 0) context.moveTo(p.x, p.y);
      else context.lineTo(p.x, p.y);
    }
    context.strokeStyle = 'rgba(241, 231, 210, .42)';
    context.lineWidth = 6;
    context.lineCap = 'round';
    context.setLineDash([2, 15]);
    context.stroke();
    context.setLineDash([]);

    for (let i = 24; i > 0; i--) {
      const a = Math.max(-Math.PI, theta - i * .03);
      const b = Math.max(-Math.PI, theta - (i - 1) * .03);
      const p = point(a), q = point(b), strength = (25 - i) / 24;
      context.beginPath();
      context.moveTo(p.x, p.y);
      context.lineTo(q.x, q.y);
      context.strokeStyle = `rgba(246, 217, 129, ${strength * .7})`;
      context.lineWidth = 1 + strength * 3;
      context.stroke();
    }

    if (ship.complete && ship.naturalWidth) {
      const p = point(theta);
      const size = shipWidth();
      context.save();
      context.translate(p.x, p.y);
      context.rotate(Math.atan2(p.dy, p.dx) + Math.PI);
      context.imageSmoothingEnabled = false;
      context.drawImage(ship, -size / 2, -size / 4, size, size / 2);
      context.restore();
    }
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (reduced.matches) {
      context.clearRect(0, 0, width, height);
      if (started && !completed) finish();
      return;
    }
    if (active && !completed && !document.hidden
      && document.documentElement.dataset.journeyFinished === 'true') frame = requestAnimationFrame(draw);
  }

  resize();
  const observer = new IntersectionObserver(entries => {
    active = entries[0].isIntersecting && entries[0].intersectionRatio >= .55;
    sync();
  }, { threshold: .55 });
  observer.observe(stage);
  addEventListener('scroll', () => { if (!started) sync(); }, { passive: true });
  addEventListener('resize', () => { resize(); if (!started) sync(); }, { passive: true });
  document.addEventListener('journeyfinished', sync);
  document.addEventListener('projectcontentcomplete', unlockPage);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  addEventListener('pagehide', () => {
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
    unlockPage();
  }, { once: true });
})();
