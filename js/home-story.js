(() => {
  const sky = document.querySelector('.home-story-sky');
  const sections = [...document.querySelectorAll('#torn-paper-mind, #about, #gallery, #projects, #work')];
  if (!sky || sections.length !== 5) return;
  const sparkOne = sky.querySelector('.home-story-spark--one');
  const sparkTwo = sky.querySelector('.home-story-spark--two');
  const sparkThree = sky.querySelector('.home-story-spark--three');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  const clamp = n => Math.max(0, Math.min(1, n));
  function render() {
    frame = 0;
    const center = innerHeight * .52;
    const distances = sections.map(section => Math.abs(section.getBoundingClientRect().top + section.offsetHeight / 2 - center));
    const nearest = distances.indexOf(Math.min(...distances));
    sky.dataset.chapter = String(nearest);
    if (reduced.matches) return;
    const travel = clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
    sky.style.setProperty('--story-travel', travel.toFixed(4));
    const width = innerWidth;
    const height = innerHeight;
    sparkOne.style.transform = `translate3d(${travel * width * .18}px, ${travel * height * .54}px, 0) rotate(${travel * 120}deg)`;
    sparkTwo.style.transform = `translate3d(${-travel * width * .13}px, ${travel * height * .3}px, 0) rotate(${-travel * 100}deg)`;
    sparkThree.style.transform = `translate3d(${travel * width * .1}px, ${-travel * height * .18}px, 0) rotate(${travel * 60}deg)`;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduced.addEventListener('change', schedule);
  render();
})();
