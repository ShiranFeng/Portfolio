(() => {
  // TODO: The homepage character sequence is still in progress; refine or replace the action frames before final delivery.
  const astronaut = document.querySelector('[data-scroll-walk]');
  const stage = document.querySelector('.star-stage');
  const about = document.querySelector('#about');
  const frames = [...document.querySelectorAll('[data-walk-frame]')];
  const pupils = [...document.querySelectorAll('.orbit-astronaut__pupil')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!astronaut || !stage || !about || frames.length < 2) return;

  let requestId = 0;
  let motionId = 0;
  let progress = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  const clamp = (value) => Math.max(0, Math.min(1, value));

  const render = () => {
    requestId = 0;
    if (reducedMotion.matches) return;

    const stageBounds = stage.getBoundingClientRect();
    const aboutBounds = about.getBoundingClientRect();
    const stageTop = stageBounds.top + window.scrollY;
    const aboutTop = aboutBounds.top + window.scrollY;
    const start = Math.max(0, stageTop + stageBounds.height * .16 - window.innerHeight * .62);
    const end = Math.max(start + 1, aboutTop - window.innerHeight * .3);
    progress = clamp((window.scrollY - start) / (end - start));
    const framePosition = progress * (frames.length - 1);

    frames.forEach((image, index) => {
      image.style.opacity = String(Math.max(0, 1 - Math.abs(framePosition - index)));
    });
    astronaut.style.setProperty('--gaze-opacity', frames[0].style.opacity);

    const landingProgress = clamp(progress / .58);
    const walkingProgress = clamp((progress - .58) / .42);
    const walkY = stageBounds.height * (.12 * landingProgress + .05 * walkingProgress);
    astronaut.style.setProperty('--walk-y', `${walkY}px`);
    astronaut.style.setProperty('--walk-scale', String(1 - progress * .09));
  };

  const animateFloat = (time) => {
    if (reducedMotion.matches) {
      astronaut.style.setProperty('--float-y', '0px');
      motionId = 0;
      return;
    }
    const floatStrength = Math.max(0, 1 - progress * 4.6);
    const floatY = Math.sin(time / 780) * 9 * floatStrength;
    const bounds = astronaut.getBoundingClientRect();
    currentX += (targetX - currentX) * .14;
    currentY += (targetY - currentY) * .14;
    const pupilX = `${currentX * bounds.width * .009}px`;
    const pupilY = `${currentY * bounds.height * .0035}px`;
    pupils.forEach((pupil) => {
      pupil.style.setProperty('--pupil-x', pupilX);
      pupil.style.setProperty('--pupil-y', pupilY);
    });
    astronaut.style.setProperty('--float-y', `${floatY}px`);
    motionId = requestAnimationFrame(animateFloat);
  };

  const scheduleRender = () => {
    if (!requestId) requestId = requestAnimationFrame(render);
  };

  document.addEventListener('pointermove', (event) => {
    const bounds = astronaut.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - (bounds.left + bounds.width / 2)) / (window.innerWidth * .34)));
    targetY = Math.max(-1, Math.min(1, (event.clientY - (bounds.top + bounds.height / 2)) / (window.innerHeight * .34)));
  }, { passive: true });

  addEventListener('scroll', scheduleRender, { passive: true });
  addEventListener('resize', scheduleRender);
  reducedMotion.addEventListener('change', () => {
    scheduleRender();
    if (!reducedMotion.matches && !motionId) motionId = requestAnimationFrame(animateFloat);
  });
  render();
  if (!reducedMotion.matches) motionId = requestAnimationFrame(animateFloat);
  addEventListener('pagehide', () => cancelAnimationFrame(motionId), { once: true });
})();
