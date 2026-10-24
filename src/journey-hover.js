import { animate, hover } from 'motion';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
hover('.journey-star[href]', (element) => {
  const star = element.querySelector('.journey-star__glyph');
  if (!star || reduced.matches) return;
  animate(star, { scale: 1.3, rotate: -10 }, { duration: .22 });
  return () => animate(star, { scale: 1, rotate: 0 }, { duration: .22 });
});
