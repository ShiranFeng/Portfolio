/* Motion Prompt #147: the three featured artworks follow scroll position. */
(() => {
  const grid = document.querySelector('.artwork-gallery');
  const banner = document.querySelector('.gallery-banner');
  if (!grid || !banner) return;
  const artworks = [...grid.querySelectorAll('.artwork-card')];
  if (artworks.length < 3) return;
  const heading = grid.querySelector('.gallery-section-heading');
  if (heading) grid.before(heading);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scatter = document.createElement('div');
  scatter.className = 'gallery-scatter';
  scatter.setAttribute('aria-hidden', 'true');
  artworks.slice(0, 10).forEach((artwork, i) => {
    const image = artwork.querySelector('img').cloneNode();
    image.alt = '';
    image.loading = 'eager';
    image.style.setProperty('--x', `${i % 2 ? 91 : 9}%`);
    image.style.setProperty('--y', `${10 + Math.floor(i / 2) * 19}%`);
    image.style.setProperty('--tilt', `${(i % 3 - 1) * 14}deg`);
    scatter.append(image);
  });
  banner.prepend(scatter);

  const controls = document.createElement('div');
  controls.className = 'gallery-view-controls';
  controls.innerHTML = '<span>Selected works / Scroll to explore</span><button type="button" aria-controls="gallery-stack">View all artworks</button>';

  const stack = document.createElement('section');
  stack.id = 'gallery-stack';
  stack.className = 'gallery-stack';
  stack.setAttribute('aria-label', 'Selected artworks, stacking on scroll');
  const featured = [artworks[2], artworks[8], artworks[13]];
  const cards = featured.map((artwork, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `gallery-stack-card gallery-stack-card--${i + 1}`;
    card.style.setProperty('--stack-top', `${14 + i * 12}px`);
    card.setAttribute('aria-label', `${artwork.dataset.title}: view details`);
    const body = document.createElement('span');
    body.className = 'gallery-stack-card__body';
    const number = document.createElement('span');
    number.className = 'gallery-stack-card__number';
    number.textContent = String(i + 1).padStart(2, '0');
    const title = document.createElement('span');
    title.className = 'gallery-stack-card__title';
    title.textContent = artwork.dataset.title;
    const bars = document.createElement('span');
    bars.className = 'gallery-stack-card__bars';
    bars.setAttribute('aria-hidden', 'true');
    body.append(number, title, bars);
    const image = artwork.querySelector('img').cloneNode();
    image.className = 'gallery-stack-card__image';
    image.alt = '';
    image.loading = 'lazy';
    card.append(body, image);
    card.addEventListener('click', () => artwork.click());
    stack.append(card);
    return card;
  });
  grid.before(controls, stack);
  const toggle = controls.querySelector('button');
  const clamp = value => Math.max(0, Math.min(1, value));
  let frame = 0;

  function update() {
    frame = 0;
    if (stack.hidden) return;
    const width = cards[0].offsetWidth;
    const step = width * 170 / 371;
    const s = Math.max(0, Math.min(2, -stack.getBoundingClientRect().top / step));
    cards.forEach((card, i) => {
      const cover = clamp(s - i);
      const scale = 1 - 0.045 * cover - 0.045 * clamp(s - i - 1);
      card.style.setProperty('--stack-scale', scale);
      card.style.setProperty('--stack-cover', 0.16 * cover);
    });
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function setGrid(useGrid) {
    grid.hidden = !useGrid;
    stack.hidden = useGrid;
    toggle.textContent = useGrid ? 'View selected works' : 'View all artworks';
    toggle.setAttribute('aria-expanded', String(useGrid));
    if (!useGrid) schedule();
  }
  toggle.addEventListener('click', () => setGrid(!stack.hidden));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  reduced.addEventListener('change', () => setGrid(reduced.matches));
  setGrid(reduced.matches);
})();
