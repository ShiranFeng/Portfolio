(() => {
  'use strict';
  const section = document.querySelector('.home-gallery');
  if (!section) return;
  const arc = section.querySelector('.home-gallery-arc');
  const cards = [...arc.querySelectorAll('.home-gallery-card')];
  const earth = arc.querySelector('.home-gallery-earth img');
  const pause = section.querySelector('[data-gallery-pause]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let hovering = false, focused = false, visible = false, dragging = false;
  let offset = 0, last = 0, frame = 0, startX = 0, moved = false;
  let width = arc.clientWidth;
  let cardWidth = cards[0].offsetWidth;
  const spacing = () => cardWidth * 1.16;
  const draw = () => {
    const step = spacing();
    const length = cards.length * step;
    // One Earth revolution matches one full carousel cycle; negative offset spins left.
    if (earth) earth.style.setProperty('--earth-turn', `${(offset / length) * 360}deg`);
    cards.forEach((card, i) => {
      const x = ((i * step + offset + length / 2) % length + length) % length - length / 2;
      const ratio = x / (width / 2);
      const y = ratio * ratio * Math.min(120, width * .15);
      const angle = ratio * 28;
      card.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle}deg)`;
      card.style.setProperty('--unrotate', `${-angle}deg`);
      card.style.setProperty('--card-layer', String(2 + Math.round((1 - Math.min(1, Math.abs(ratio))) * 10)));
      const outside = Math.abs(x) > width / 2 + step;
      card.style.visibility = outside ? 'hidden' : 'visible';
      card.tabIndex = outside ? -1 : 0;
    });
  };
  const running = () => visible && !document.hidden && !paused && !hovering && !focused && !dragging;
  const tick = time => {
    frame = 0;
    if (!running()) { last = 0; return; }
    if (last) offset -= Math.min(time - last, 50) * .022;
    last = time;
    draw();
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    pause.textContent = paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', String(paused));
    if (running() && !frame) frame = requestAnimationFrame(tick);
    else if (!running()) { cancelAnimationFrame(frame); frame = 0; last = 0; }
  };
  pause.addEventListener('click', () => { paused = !paused; sync(); });
  section.querySelector('[data-gallery-prev]').addEventListener('click', () => { offset += spacing(); draw(); });
  section.querySelector('[data-gallery-next]').addEventListener('click', () => { offset -= spacing(); draw(); });
  arc.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovering = true; sync(); } });
  arc.addEventListener('pointerleave', () => { hovering = false; sync(); });
  arc.addEventListener('focusin', () => { focused = true; sync(); });
  arc.addEventListener('focusout', e => { focused = arc.contains(e.relatedTarget); sync(); });
  arc.addEventListener('pointerdown', e => { dragging = true; startX = e.clientX; moved = false; sync(); });
  window.addEventListener('pointermove', e => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    if (!moved && Math.abs(delta) < 8) return;
    moved = true; offset += delta; startX = e.clientX; draw();
  });
  const release = () => { dragging = false; sync(); };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  arc.addEventListener('dragstart', e => e.preventDefault());
  arc.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } });
  new ResizeObserver(() => { width = arc.clientWidth; cardWidth = cards[0].offsetWidth; draw(); }).observe(arc);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(section);
  reduced.addEventListener('change', () => { paused = reduced.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  draw(); sync();
})();
