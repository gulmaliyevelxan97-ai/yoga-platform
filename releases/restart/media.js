// Load third-party media only when requested. The original link remains available.
el('loadReel').addEventListener('click', () => {
  const frame = document.createElement('iframe');
  frame.src = 'https://www.instagram.com/reel/Dak8U76i2e0/embed/';
  frame.title = t('restartReel');
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allowFullscreen = true;
  el('reelFrame').replaceChildren(frame);
  frame.focus();
});
el('language').addEventListener('change', () => {
  const frame = el('reelFrame').querySelector('iframe');
  if (frame) frame.title = t('restartReel');
});
