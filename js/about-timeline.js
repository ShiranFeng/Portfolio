/* Motion Prompt #145 · MIT License (c) 2026 Shohei Ohtaki
 * https://showheyohtaki.github.io/motion-prompt/#145
 * The line tip, 22px reveal interval, cubic ease-out, and 16px text slide
 * follow the reference. The existing resume content supplies the events.
 */
(() => {
  const resume = document.querySelector('[data-resume-timeline]');
  if (!resume) return;

  const entries = [...resume.querySelectorAll('.resume-section:not(.resume-section--contact) .resume-entry')];
  if (!entries.length) return;

  const track = document.createElement('div');
  track.className = 'resume-timeline__track';
  track.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  fill.className = 'resume-timeline__fill';
  track.append(fill);
  resume.prepend(track);

  const dots = entries.map(entry => {
    const dot = document.createElement('span');
    dot.className = 'resume-timeline__dot';
    dot.setAttribute('aria-hidden', 'true');
    entry.prepend(dot);
    return dot;
  });

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const easeOut = value => 1 - Math.pow(1 - value, 3);
  let request = 0;

  function render() {
    request = 0;
    const resumeRect = resume.getBoundingClientRect();
    const centers = dots.map(dot => {
      const rect = dot.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    const first = centers[0];
    const last = centers[centers.length - 1];
    const start = first.y - resumeRect.top - 20;
    const height = last.y - first.y + 40;
    // The reference's 168px viewport puts the tip at 126px: 42px from below.
    const tipY = Math.max(0, window.innerHeight - 42);
    const tip = tipY - resumeRect.top;
    const length = reducedMotion.matches ? height : Math.max(0, Math.min(height, tip - start));

    track.style.left = `${first.x - resumeRect.left}px`;
    track.style.top = `${start}px`;
    track.style.height = `${height}px`;
    fill.style.height = `${length}px`;

    entries.forEach((entry, index) => {
      const q = reducedMotion.matches ? 1 : easeOut(clamp((tipY - centers[index].y) / 22));
      entry.style.setProperty('--timeline-q', String(q));
      entry.style.setProperty('--timeline-slide', `${16 * (1 - q)}px`);
      dots[index].style.setProperty('--timeline-q', String(q));
      dots[index].classList.toggle('is-reached', q > 0);
    });
  }

  function schedule() {
    if (!request) request = requestAnimationFrame(render);
  }

  resume.classList.add('is-timeline-ready');
  render();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('load', schedule, { once: true });
  reducedMotion.addEventListener('change', schedule);
  document.fonts?.ready.then(schedule);
  new ResizeObserver(schedule).observe(resume);
})();
