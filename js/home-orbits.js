(() => {
  'use strict';
  const astronaut = document.querySelector('[data-scroll-walk]');
  const hero = document.querySelector('.orbit-hero');
  const stage = document.querySelector('.star-stage');
  const scene = document.querySelector('.home-space-scene');
  const about = document.querySelector('#about');
  const frames = [...document.querySelectorAll('[data-walk-frame]')];
  const blink = document.querySelector('[data-blink-frame]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!astronaut || !hero || !stage || !scene || !about || frames.length !== 15) return;

  const clamp = n => Math.max(0, Math.min(1, n));
  let request = 0, motion = 0, selected = 0, landing = 0, walking = 0;
  function render() {
    request = 0;
    if (reduced.matches) {
      frames.forEach((image, i) => { image.style.opacity = i === 0 ? '1' : '0'; });
      astronaut.style.setProperty('--walk-y', '0px');
      astronaut.style.setProperty('--walk-x', '0px');
      astronaut.style.setProperty('--walk-scale', '1');
      hero.style.setProperty('--banner-opacity', '1');
      hero.classList.remove('banner-gone');
      if (blink) blink.style.opacity = '0';
      return;
    }
    const stageTop = stage.getBoundingClientRect().top + scrollY;
    const aboutTop = about.getBoundingClientRect().top + scrollY;
    const start = Math.max(0, stageTop - innerHeight * .58);
    const landingEnd = Math.max(start + innerHeight * .5, aboutTop - innerHeight * .24);
    const walkingEnd = landingEnd + Math.min(innerHeight * .7, about.offsetHeight * .6);
    landing = clamp((scrollY - start) / (landingEnd - start));
    walking = clamp((scrollY - landingEnd) / Math.max(1, walkingEnd - landingEnd));
    // Landing frame seven reaches About; the remaining standing, turn and walk frames follow.
    selected = walking > 0 ? 6 + Math.round(walking * 8) : Math.round(landing * 6);
    frames.forEach((image, i) => { image.style.opacity = i === selected ? '1' : '0'; });

    // The banner scrolls away; offset only the astronaut, then move it down.
    const y = scrollY + landing * Math.min(innerHeight * .3, 220);
    astronaut.style.setProperty('--walk-y', `${y}px`);
    astronaut.style.setProperty('--walk-x', `${walking * Math.min(innerWidth * .23, 270)}px`);
    astronaut.style.setProperty('--walk-scale', String(1 - landing * .12));
    astronaut.style.opacity = String(1 - clamp((scrollY - walkingEnd) / Math.max(1, innerHeight * .25)));

    const fade = clamp((landing - .42) / .43);
    hero.style.setProperty('--banner-opacity', String(1 - fade * fade * (3 - 2 * fade)));
    hero.classList.toggle('banner-gone', fade >= .99);
  }
  function schedule() { if (!request) request = requestAnimationFrame(render); }
  function animate(time) {
    if (reduced.matches || document.hidden) { motion = 0; return; }
    const floating = selected === 0;
    astronaut.style.setProperty('--float-y', `${floating ? Math.sin(time / 780) * 7 : 0}px`);
    if (blink) {
      const phase = time % 6200;
      blink.style.opacity = floating && ((phase > 2800 && phase < 2940) || (phase > 4550 && phase < 4680)) ? '1' : '0';
    }
    motion = requestAnimationFrame(animate);
  }
  function syncMotion() {
    if (motion) cancelAnimationFrame(motion);
    motion = 0;
    if (!reduced.matches && !document.hidden) motion = requestAnimationFrame(animate);
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduced.addEventListener('change', () => { schedule(); syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  addEventListener('pagehide', () => cancelAnimationFrame(motion), { once: true });
  render();
  syncMotion();
})();
