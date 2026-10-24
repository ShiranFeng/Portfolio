(() => {
  'use strict';
  const astronaut = document.querySelector('[data-scroll-walk]');
  const hero = document.querySelector('.orbit-hero');
  const stage = document.querySelector('.star-stage');
  const scene = document.querySelector('.home-space-scene');
  const about = document.querySelector('#about');
  const frames = [...document.querySelectorAll('[data-walk-frame]')];
  const blink = document.querySelector('[data-blink-frame]');
  const aboutMask = document.querySelector('[data-about-mask]');
  const journeyStrip = document.querySelector('[data-journey-strip]');
  const journeyLinks = journeyStrip ? [...journeyStrip.querySelectorAll('a.journey-star')] : [];
  const flightStage = document.querySelector('[data-home-flight]');
  const scrollCue = document.querySelector('[data-scroll-cue]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!astronaut || !hero || !stage || !scene || !about || frames.length !== 15) return;

  const clamp = n => Math.max(0, Math.min(1, n));
  const quintOut = t => 1 - Math.pow(1 - t, 5);
  const cubicInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function renderAboutMask(elapsed) {
    if (!aboutMask) return;
    const topIn = quintOut(clamp((elapsed - 350) / 650));
    const bottomIn = quintOut(clamp((elapsed - 550) / 600));
    const lineIn = cubicInOut(clamp((elapsed - 100) / 400));
    aboutMask.style.setProperty('--mask-top', `${120 * (1 - topIn)}px`);
    aboutMask.style.setProperty('--mask-bottom', `${-100 * (1 - bottomIn)}%`);
    aboutMask.style.setProperty('--mask-line', String(lineIn));
  }
  let request = 0, motion = 0, selected = 0, landing = 0, landedAt = null;
  let pausedAt = null;
  let finishedOnce = false, held = false, holdY = 0, cueAt = null, flightGap = 50;
  function updateFlightGap() {
    if (!flightStage || !journeyStrip) return;
    const labels = [...journeyStrip.querySelectorAll('.journey-star__copy')];
    const bottom = Math.max(journeyStrip.getBoundingClientRect().bottom, ...labels.map(label => label.getBoundingClientRect().bottom));
    const baseTop = flightStage.getBoundingClientRect().top - flightGap;
    const needed = Math.max(50, Math.ceil(bottom + 50 - baseTop));
    if (needed !== flightGap) { flightGap = needed; flightStage.style.marginTop = `${flightGap}px`; }
  }
  const pauseReasons = new Set();
  function setJourneyPause(reason, active) {
    if (active) pauseReasons.add(reason); else pauseReasons.delete(reason);
    if (pauseReasons.size && pausedAt === null && landedAt !== null) pausedAt = performance.now();
    if (!pauseReasons.size && pausedAt !== null) {
      if (landedAt !== null) landedAt += performance.now() - pausedAt;
      pausedAt = null;
    }
  }
  journeyLinks.forEach(link => {
    link.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') setJourneyPause('pointer', true); });
    link.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch') setJourneyPause('pointer', false); });
    link.addEventListener('focus', () => setJourneyPause('focus', true));
    link.addEventListener('blur', () => setJourneyPause('focus', false));
  });
  function selectFrame(index) {
    selected = index;
    frames.forEach((image, i) => { image.style.opacity = i === index ? '1' : '0'; });
  }
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
    // Let the opening composition scroll normally until the astronaut reaches
    // the middle of the screen, then hold that position throughout the descent.
    const baseTop = astronaut.offsetParent.getBoundingClientRect().top + scrollY
      + astronaut.offsetTop;
    const baseCenter = baseTop + astronaut.offsetHeight / 2;
    const start = Math.max(0, baseCenter - innerHeight / 2);
    const landingEnd = start + innerHeight * .55;
    holdY = landingEnd;
    held = !finishedOnce && scrollY >= holdY - 1;
    if (held && scrollY > holdY) window.scrollTo({ top: holdY, behavior: 'instant' });
    const position = held ? Math.min(scrollY, holdY) : scrollY;
    landing = clamp((position - start) / (landingEnd - start));
    if (cueAt !== null && Math.abs(scrollY - cueAt) > 50) {
      scrollCue?.classList.remove('is-visible');
      cueAt = null;
    }
    if (landing < 1) {
      landedAt = null;
      document.documentElement.dataset.journeyFinished = 'false';
      pausedAt = null;
      pauseReasons.clear();
      if (journeyStrip) journeyStrip.inert = true;
      renderAboutMask(0);
      if (journeyStrip) journeyStrip.style.setProperty('--journey-visible', '0');
      astronaut.style.setProperty('--walk-x', '0px');
      selectFrame(Math.round(landing * 6));
    }

    // Hold the walking scene in place for a short stretch of scrolling. Ease
    // out of the hold gradually, so the page resumes without a sudden jump.
    const scale = 1 - landing * .12;
    const scaledCenter = baseTop + astronaut.offsetHeight * (.2 + .3 * scale);
    const holdEnd = landingEnd + (finishedOnce ? 0 : innerHeight * .9);
    const releaseDistance = innerHeight * .22;
    const release = clamp((position - holdEnd) / releaseDistance);
    const releaseOffset = finishedOnce ? 0 : releaseDistance * (release - release * release / 2);
    const y = Math.max(0, Math.min(position - start, holdEnd - start))
      + releaseOffset + baseCenter - scaledCenter;
    astronaut.style.setProperty('--walk-y', `${y}px`);
    if (aboutMask) aboutMask.style.setProperty('--intro-y', `${y}px`);
    if (journeyStrip) journeyStrip.style.setProperty('--intro-y', `${y}px`);
    astronaut.style.setProperty('--walk-scale', String(scale));
    astronaut.style.opacity = '1';

    const fade = clamp((landing - .35) / .6);
    hero.style.setProperty('--banner-opacity', String(1 - fade * fade * (3 - 2 * fade)));
    hero.classList.toggle('banner-gone', fade >= .99);
    updateFlightGap();
  }
  function schedule() { if (!request) request = requestAnimationFrame(render); }
  function animate(time) {
    if (reduced.matches || document.hidden) { motion = 0; return; }
    if (landing >= 1) {
      if (landedAt === null) landedAt = time;
      const elapsed = (pausedAt === null ? time : pausedAt) - landedAt;
      renderAboutMask(elapsed);
      const turnDuration = 500;
      const step = Math.floor(elapsed / 100);
      // Turn right and walk to the right third before the tracking shot.
      const turnSteps = 5;
      // The three right-facing steps alternate with the feet-together pose.
      const walkCycle = [12, 11, 13, 11, 14, 11];
      const walkStep = Math.floor((elapsed - turnDuration) / 150);
      const frame = step < turnSteps ? 7 + step : walkCycle[walkStep % walkCycle.length];
      if (frame !== selected) selectFrame(frame);
      const travel = clamp((elapsed - turnDuration) / 1700);
      const trackStart = turnDuration + 1700;
      const track = clamp((elapsed - trackStart) / 3200);
      // Continue walking across the frame as the trail unfolds behind him.
      const exit = clamp((elapsed - trackStart - 3200 - 600) / 1600);
      if (exit >= 1 && document.documentElement.dataset.journeyFinished !== 'true') {
        document.documentElement.dataset.journeyFinished = 'true';
        if (!finishedOnce) {
          finishedOnce = true;
          held = false;
          cueAt = scrollY;
          scrollCue?.classList.add('is-visible');
        }
        document.dispatchEvent(new Event('journeyfinished'));
      }
      const walkingPosition = Math.min(innerWidth / 6, 260);
      astronaut.style.setProperty('--walk-x', `${travel * walkingPosition + track * innerWidth * .25 + exit * innerWidth * .65}px`);
      if (journeyStrip) {
        const visible = elapsed >= trackStart;
        journeyStrip.style.setProperty('--journey-visible', visible ? '1' : '0');
        journeyStrip.inert = !visible;
        journeyStrip.style.setProperty('--journey-x', `${(1 - track) * innerWidth * .52}px`);
        // The trailing line ends underneath the character, never ahead of him.
        const character = astronaut.getBoundingClientRect();
        const boundary = character.left + character.width * .5;
        journeyStrip.style.setProperty('--journey-clip', `${Math.max(0, innerWidth - boundary)}px`);
        journeyLinks.forEach(link => {
          const box = link.getBoundingClientRect();
          link.tabIndex = visible && box.left >= 0 && box.right <= Math.min(boundary, innerWidth) ? 0 : -1;
        });
      }
    }
    const floating = selected === 0;
    astronaut.style.setProperty('--float-y', `${floating && landing === 0 ? Math.sin(time / 780) * 7 : 0}px`);
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
  addEventListener('wheel', event => { if (held && !reduced.matches && event.deltaY > 0) event.preventDefault(); }, { passive: false });
  let touchY = null;
  addEventListener('touchstart', event => { touchY = event.touches[0]?.clientY ?? null; }, { passive: true });
  addEventListener('touchmove', event => {
    const y = event.touches[0]?.clientY;
    if (held && !reduced.matches && touchY !== null && y < touchY) event.preventDefault();
    touchY = y ?? null;
  }, { passive: false });
  addEventListener('keydown', event => {
    if (held && !reduced.matches && ['ArrowDown', 'PageDown', 'End', ' '].includes(event.key) && !event.target.closest('input, textarea, select, button, a')) event.preventDefault();
  });
  reduced.addEventListener('change', () => { schedule(); syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  addEventListener('pagehide', () => cancelAnimationFrame(motion), { once: true });
  render();
  syncMotion();
})();
