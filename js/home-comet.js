(() => {
  'use strict';

  const comet = document.querySelector('#home-shooting-star');
  const stars = [...document.querySelectorAll('.space-layer--far .space-object')];
  const stage = document.querySelector('.star-stage');
  const about = document.querySelector('#about');
  if (!comet || !stage || !about) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  let frame = 0;

  function render() {
    frame = 0;
    const bounds = stage.getBoundingClientRect();
    const start = bounds.top + scrollY + stage.clientHeight * .7 - innerHeight * .86;
    const end = about.getBoundingClientRect().top + scrollY - innerHeight * .25;
    const progress = clamp((scrollY - Math.max(0, start)) / Math.max(1, end - Math.max(0, start)));
    const fade = clamp((progress - .46) / .54);

    comet.style.opacity = String(1 - fade * fade * (3 - 2 * fade));
    comet.style.transform = reduced.matches
      ? 'none'
      : `translate3d(${-bounds.width * .56 * progress}px, ${bounds.width * .2 * progress}px, 0)`;

    stars.forEach((star, index) => {
      const depth = .025 + index * .009;
      star.style.transform = reduced.matches
        ? 'none'
        : `translate3d(0, ${-bounds.width * depth * progress}px, 0)`;
    });
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('load', schedule);
  comet.addEventListener('load', schedule);
  reduced.addEventListener('change', schedule);
  render();
})();
