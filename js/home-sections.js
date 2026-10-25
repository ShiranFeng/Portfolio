/* Staggered section entrances; content stays available without JavaScript. */
(() => {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sections = [...document.querySelectorAll('.home-intro-section:not(#projects)')];
  const played = new WeakSet();
  const animations = new Set();

  function entrance(element, delay, distance, opacityOnly = false) {
    const frames = opacityOnly
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [{ opacity: 0, transform: `translateY(${distance}px)` }, { opacity: 1, transform: 'translateY(0)' }];
    const animation = element.animate(frames, {
      duration: 1000, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'
    });
    animations.add(animation);
    animation.onfinish = () => animations.delete(animation);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || played.has(entry.target)) continue;
      played.add(entry.target);
      observer.unobserve(entry.target);
      if (reduced.matches) continue;
      const section = entry.target;
      const heading = section.querySelector('h2');
      if (heading) entrance(heading, 0, 44);
      section.querySelectorAll(':scope > div:first-child p').forEach((p, i) => entrance(p, 220 + i * 140, 32));
      // The carousel owns its card transforms, so fade its cards without moving them.
      section.querySelectorAll('.home-gallery-card').forEach((card, i) => entrance(card, 340 + i * 65, 0, true));
      const controls = section.querySelector('.home-gallery-controls');
      if (controls) entrance(controls, 600, 20);
    }
  }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });

  sections.forEach(section => observer.observe(section));
  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  reduced.addEventListener('change', () => { if (reduced.matches) cancelAnimations(); });
  // Keyboard users should never focus an element while it is still faded out.
  document.addEventListener('focusin', event => {
    if (event.target.closest('.home-intro-section')) cancelAnimations();
  });
})();
