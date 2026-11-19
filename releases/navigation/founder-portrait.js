'use strict';

{
  const portrait = document.querySelector('.founder-portrait');
  const video = portrait.querySelector('video');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function showPoster() {
    portrait.classList.remove('is-playing');
  }

  function syncMotion() {
    if (motion.matches) {
      showPoster();
      video.pause();
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
      return;
    }

    // Keep the image visible until playback starts, including if autoplay is denied.
    video.muted = true;
    video.src = video.dataset.src;
    video.play().catch(showPoster);
  }

  video.addEventListener('playing', () => {
    if (!motion.matches) portrait.classList.add('is-playing');
  });
  video.addEventListener('error', showPoster);
  video.addEventListener('pause', showPoster);
  motion.addEventListener('change', syncMotion);
  syncMotion();
}
