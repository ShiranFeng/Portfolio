(() => {
  const list = document.querySelector('.project-index');
  if (!list || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const previewWidth = 132;
  const previewHeight = 84;
  const edge = 4;
  const items = [...list.querySelectorAll('.project-index__item')];

  function movePreview(item, x, y) {
    const right = x + 26;
    const left = right + previewWidth + edge <= window.innerWidth
      ? right
      : Math.max(edge, x - 26 - previewWidth);
    const top = Math.min(Math.max(y - 46, edge), Math.max(edge, window.innerHeight - previewHeight - edge));
    const preview = item.querySelector('.project-index__preview');
    preview.style.setProperty('--preview-x', `${left}px`);
    preview.style.setProperty('--preview-y', `${top}px`);
  }

  for (const item of items) {
    item.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      movePreview(item, event.clientX, event.clientY);
      item.classList.add('is-previewing');
    });
    item.addEventListener('pointermove', event => {
      if (item.classList.contains('is-previewing')) movePreview(item, event.clientX, event.clientY);
    });
    item.addEventListener('pointerleave', () => item.classList.remove('is-previewing'));
  }

  window.addEventListener('blur', () => {
    for (const item of items) item.classList.remove('is-previewing');
  });
})();
