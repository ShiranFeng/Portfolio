(() => {
  'use strict';
  const stage = document.querySelector('[data-home-flight]');
  const canvas = stage && stage.querySelector('canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ship = new Image();
  ship.src = 'assets/home-astronaut/flight-ship.webp';
  const duration = 4700;
  let width = 0, height = 0, ratio = 1, active = false, start = null, frame = 0;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width; height = rect.height;
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function shipWidth() { return 2.5 * Math.max(100, Math.min(width * .16, 205)); }
  function point(theta) {
    // A gentle, uninterrupted path from upper right to lower left.
    const progress = (theta + Math.PI) / (2 * Math.PI);
    const padding = shipWidth() / 2 + 20;
    const x = width + padding - (width + 2 * padding) * progress;
    const y = height * (.29 + .28 * (2 * progress - progress * progress));
    return { x, y, dx: -(width + 2 * padding), dy: height * .56 * (1 - progress) };
  }
  function draw(time) {
    frame = 0;
    if (!active || reduced.matches || document.hidden || document.documentElement.dataset.journeyFinished !== 'true') {
      context.clearRect(0, 0, width, height);
      start = null;
      return;
    }
    if (start === null) start = time;
    const phase = ((time - start) % duration) / duration;
    // Ease gently into a noticeably slower middle, then accelerate away.
    const progress = phase + .88 * Math.sin(phase * 2 * Math.PI) / (2 * Math.PI);
    const theta = -Math.PI + progress * 2 * Math.PI;
    context.clearRect(0, 0, width, height);
    context.beginPath();
    for (let i = 0; i <= 240; i++) {
      const p = point(-Math.PI + i / 240 * 2 * Math.PI);
      if (i === 0) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y);
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
      context.beginPath(); context.moveTo(p.x, p.y); context.lineTo(q.x, q.y);
      context.strokeStyle = `rgba(246, 217, 129, ${strength * .7})`;
      context.lineWidth = 1 + strength * 3;
      context.stroke();
    }
    if (ship.complete && ship.naturalWidth) {
      const p = point(theta);
      const size = shipWidth();
      context.save();
      context.translate(p.x, p.y);
      // The supplied artwork points left at rest.
      context.rotate(Math.atan2(p.dy, p.dx) + Math.PI);
      context.imageSmoothingEnabled = false;
      context.drawImage(ship, -size / 2, -size / 4, size, size / 2);
      context.restore();
    }
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; start = null;
    context.clearRect(0, 0, width, height);
    if (active && !reduced.matches && !document.hidden && document.documentElement.dataset.journeyFinished === 'true') frame = requestAnimationFrame(draw);
  }
  resize();
  const observer = new IntersectionObserver(entries => {
    active = entries[0].isIntersecting;
    sync();
  }, { threshold: .1 });
  observer.observe(stage);
  addEventListener('resize', () => { resize(); sync(); }, { passive: true });
  document.addEventListener('journeyfinished', sync);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  addEventListener('pagehide', () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); }, { once: true });
})();
