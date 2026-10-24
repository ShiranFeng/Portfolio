(() => {
  'use strict';
  const section = document.querySelector('#projects.home-projects');
  const grid = section?.querySelector('.home-projects__grid');
  const intro = section?.querySelector('.home-projects__intro');
  const allProjects = section?.querySelector('.home-projects__all');
  const shipScene = section?.querySelector('.project-ship-intro');
  if (!section || !grid || !intro || !shipScene) return;

  const cards = [...grid.querySelectorAll('.project-glass-card')];
  const shipLinks = [...shipScene.querySelectorAll('.project-ship-intro__window')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let transitionDone = false;
  let sectionVisible = false;
  let started = false;

  function setShipLinksActive(active) {
    shipLinks.forEach(link => { link.tabIndex = active ? 0 : -1; });
    shipScene.setAttribute('aria-hidden', active ? 'false' : 'true');
  }
  function releaseProjects() {
    grid.inert = false;
    if (allProjects) allProjects.inert = false;
  }
  function settleProjectShip() {
    section.classList.add('is-project-settled');
    setShipLinksActive(true);
  }
  function startProjectSequence() {
    if (started || !transitionDone || !sectionVisible || reduced.matches) return;
    started = true;
    section.classList.add('is-project-heading');
    // Let the heading settle before the ship takes the cards' place.
    setTimeout(() => section.classList.add('is-project-ship'), 900);
  }
  function armProjectSequence() {
    transitionDone = true;
    if (reduced.matches) return;
    section.classList.add('is-project-armed');
    grid.inert = true;
    if (allProjects) allProjects.inert = true;
    setShipLinksActive(false);
    startProjectSequence();
  }

  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      sectionVisible = entries[0].isIntersecting;
      startProjectSequence();
    }, { threshold: .2 });
    observer.observe(section);
    document.addEventListener('projecttransitioncomplete', armProjectSequence, { once: true });
    shipScene.addEventListener('animationend', event => {
      if (event.target !== shipScene.querySelector('.project-ship-intro__ship') || event.animationName !== 'project-ship-in') return;
      settleProjectShip();
    });
    reduced.addEventListener('change', () => {
      if (!reduced.matches) return;
      observer.disconnect();
      section.classList.remove('is-project-armed', 'is-project-heading', 'is-project-ship', 'is-project-settled');
      setShipLinksActive(false);
      releaseProjects();
    });
  }

  // The spotlight is calculated in every card's own coordinates, so it stays
  // directly under the pointer and naturally lights nearby borders.
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
