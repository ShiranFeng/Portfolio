(() => {
  const root = document.documentElement;
  root.classList.add('home-loading');
  const failSafe = setTimeout(() => root.classList.remove('home-loading'), 35000);

  document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.querySelector('.home-loader');
    const number = loader.querySelector('.home-loader__number');
    const progress = loader.querySelector('progress');
    const message = loader.querySelector('.home-loader__message');
    const reveal = () => {
      clearTimeout(failSafe);
      root.classList.remove('home-loading');
      loader.remove();
      dispatchEvent(new Event('resize'));
    };
    loader.querySelector('[data-load-retry]').addEventListener('click', () => location.reload());
    loader.querySelector('[data-load-continue]').addEventListener('click', reveal);

    const bounded = promise => new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Loading timed out')), 25000);
      Promise.resolve(promise).then(resolve, reject).finally(() => clearTimeout(timeout));
    });
    const component = id => bounded(new Promise(resolve => {
      const element = document.getElementById(id);
      if (element.children.length) return resolve();
      const observer = new MutationObserver(() => {
        if (element.children.length) { observer.disconnect(); resolve(); }
      });
      observer.observe(element, { childList: true });
      setTimeout(() => observer.disconnect(), 25000);
    }));
    const imageReady = source => {
      const image = new Image();
      image.src = source;
      return bounded(image.decode());
    };
    const sources = new Set([...document.querySelectorAll('img[src]')]
      .filter(image => !image.closest('[hidden], .mind-scene'))
      .map(image => image.src).filter(Boolean));
    const tasks = [...sources].map(imageReady);
    tasks.push(bounded(document.fonts.ready));
    for (const id of ['navbar-placeholder', 'footer-placeholder']) {
      tasks.push(component(id).then(() => Promise.all(
        [...document.getElementById(id).querySelectorAll('img[src]')].map(image => imageReady(image.src))
      )));
    }
    let completed = 0;
    const results = await Promise.allSettled(tasks.map(task => task.then(() => {
      completed++;
      const percentage = Math.min(99, Math.floor(completed / tasks.length * 100));
      number.textContent = `${percentage}%`;
      progress.value = percentage;
    })));
    clearTimeout(failSafe);
    if (!root.classList.contains('home-loading')) return;
    if (results.some(result => result.status === 'rejected')) {
      message.textContent = 'Some resources could not load. Try again or continue with what is ready.';
      loader.querySelector('.home-loader__actions').hidden = false;
      return;
    }
    number.textContent = '100%';
    progress.value = 100;
    message.textContent = 'Ready for liftoff';
    setTimeout(reveal, 300);
  });
})();
