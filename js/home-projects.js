(() => {
  'use strict';
  const section = document.querySelector('#projects.home-projects');
  const flightStage = document.querySelector('[data-home-flight]');
  const inner = section?.querySelector('.home-projects__inner');
  const grid = section?.querySelector('.home-projects__grid');
  const intro = section?.querySelector('.home-projects__intro');
  const allProjects = section?.querySelector('.home-projects__all');
  const shipScene = section?.querySelector('.project-ship-intro');
  const ship = shipScene?.querySelector('.project-ship-intro__ship');
  if (!section || !inner || !grid || !intro || !shipScene || !ship) return;

  const cards = [...grid.querySelectorAll('.project-glass-card')];
  const shipLinks = [...shipScene.querySelectorAll('.project-ship-intro__window')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let transitionDone = false;
  let sectionVisible = false;
  let started = false;
  let prepared = false;
  let shipStartTimer = 0;
  let shipFallbackTimer = 0;
  let completionSent = false;

  function setShipLinksActive(active) {
    shipLinks.forEach(link => { link.tabIndex = active ? 0 : -1; });
    shipScene.setAttribute('aria-hidden', active ? 'false' : 'true');
  }
  function announceContentComplete() {
    if (completionSent) return;
    completionSent = true;
    clearTimeout(shipStartTimer);
    clearTimeout(shipFallbackTimer);
    document.dispatchEvent(new Event('projectcontentcomplete'));
  }
  function settleProjectShip() {
    if (!section.classList.contains('is-project-ship')) return;
    section.classList.add('is-project-settled');
    setShipLinksActive(true);
    announceContentComplete();
  }
  function startProjectSequence() {
    if (started || !transitionDone || !sectionVisible || reduced.matches) return;
    started = true;
    document.body.classList.add('is-project-view-active');
    section.classList.add('is-project-heading');
    intro.inert = false;
    // Let the title resolve before the same-sized ship flies in from the left.
    shipStartTimer = setTimeout(() => {
      if (reduced.matches) return announceContentComplete();
      section.classList.add('is-project-ship');
      shipFallbackTimer = setTimeout(settleProjectShip, 5000);
    }, 1050);
  }
  function syncProjectViewVisibility() {
    if (!started) return;
    const marker = flightStage || section;
    document.body.classList.toggle('is-project-view-active', marker.getBoundingClientRect().top <= 0);
  }
  function prepareProjectSequence() {
    if (prepared || reduced.matches) return;
    prepared = true;
    completionSent = false;
    section.classList.add('is-project-armed');
    intro.inert = true;
    grid.inert = true;
    if (allProjects) allProjects.inert = true;
    setShipLinksActive(false);
  }
  function armProjectSequence() {
    transitionDone = true;
    if (reduced.matches) return;
    prepareProjectSequence();
    startProjectSequence();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      sectionVisible = entries[0].isIntersecting;
      startProjectSequence();
    }, { threshold: .2 });
    observer.observe(section);
    document.addEventListener('projecttransitionstart', prepareProjectSequence, { once: true });
    document.addEventListener('projecttransitioncomplete', armProjectSequence, { once: true });
    ship.addEventListener('animationend', event => {
      if (event.animationName === 'project-ship-in') settleProjectShip();
    });
    reduced.addEventListener('change', () => {
      if (!reduced.matches) return;
      observer.disconnect();
      clearTimeout(shipStartTimer);
      clearTimeout(shipFallbackTimer);
      document.body.classList.remove('is-project-view-active');
      section.classList.remove('is-project-armed', 'is-project-heading', 'is-project-ship', 'is-project-settled');
      intro.inert = false;
      grid.inert = false;
      if (allProjects) allProjects.inert = false;
      setShipLinksActive(false);
      announceContentComplete();
    });
  }
  addEventListener('scroll', syncProjectViewVisibility, { passive: true });
  addEventListener('resize', syncProjectViewVisibility);

  // The spotlight stays directly under the pointer within each glass card.
  function lightAt(x, y) {
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${x - rect.left}px`);
      card.style.setProperty('--spot-y', `${y - rect.top}px`);
      card.style.setProperty('--spot-opacity', '1');
    });
  }
  function dim() { cards.forEach(card => card.style.setProperty('--spot-opacity', '0')); }
  grid.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch') lightAt(event.clientX, event.clientY);
  });
  grid.addEventListener('pointerleave', dim);
  cards.forEach(card => {
    card.addEventListener('focus', () => {
      const rect = card.getBoundingClientRect();
      lightAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    card.addEventListener('blur', dim);
  });
})();
