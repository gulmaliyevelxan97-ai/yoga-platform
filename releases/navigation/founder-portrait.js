'use strict';

{
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const players = new Map();

  function syncPlayers() {
    for (const syncMotion of players.values()) syncMotion();
  }

  function mountPlayers() {
    for (const [video] of players) {
      if (!video.isConnected) {
        video.pause();
        players.delete(video);
      }
    }
    for (const portrait of document.querySelectorAll('.founder-portrait')) {
      const video = portrait.querySelector('video');
      if (!video || players.has(video)) continue;

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

        video.muted = true;
        video.src = video.dataset.src;
        video.play().catch(showPoster);
      }

      video.addEventListener('playing', () => {
        if (!motion.matches) portrait.classList.add('is-playing');
      });
      video.addEventListener('error', showPoster);
      video.addEventListener('pause', showPoster);
      players.set(video, syncMotion);
      syncMotion();
    }
  }

  motion.addEventListener('change', syncPlayers);
  mountPlayers();
  // Language changes replace the translated content in #view.
  new MutationObserver(mountPlayers).observe(document.querySelector('#view'), {childList: true});
}
