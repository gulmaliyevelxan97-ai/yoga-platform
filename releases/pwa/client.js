(() => {
  const form = el('push-form');
  const fields = [...form.elements].filter(input => input.name === 'topic');
  const status = el('push-status');
  const subscribe = el('push-subscribe');
  const unsubscribe = el('push-unsubscribe');
  const install = el('restart-install');
  const preferencesKey = 'restart.push.preferences';
  const secretKey = 'restart.push.device';
  let prompt, registration, publicKey, subscription, locked = false;
  let statusKey = 'pushOff';
  function setStatus(key) { statusKey = key; status.textContent = key ? t(key) : ''; }
  el('language').addEventListener('change', () => setStatus(statusKey));
  try {
    const choices = JSON.parse(localStorage.getItem(preferencesKey) || '[]');
    for (const input of fields) input.checked = Array.isArray(choices) && choices.includes(input.value);
  } catch {}

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    prompt = event;
    install.hidden = false;
  });
  install.onclick = async () => {
    if (!prompt) return;
    const event = prompt;
    prompt = undefined;
    install.hidden = true;
    try { await event.prompt(); } catch {}
  };
  window.addEventListener('appinstalled', () => { install.hidden = true; prompt = undefined; });

  function getTopics() { return fields.filter(input => input.checked).map(input => input.value); }
  function credential() {
    let token = localStorage.getItem(secretKey);
    if (!token) {
      token = [...crypto.getRandomValues(new Uint8Array(32))].map(byte => byte.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(secretKey, token);
    }
    return token;
  }
  async function api(path, options = {}) {
    const response = await fetch(new URL(path, restartPushApi), { cache:'no-store', credentials:'omit', ...options });
    if (!response.ok) throw new Error('Push API unavailable');
    return response.json();
  }
  function headers() { return { 'Content-Type':'application/json', Authorization:'Bearer '+credential() }; }
  async function send(current, topics) {
    return api('/subscriptions', { method:'PUT', headers:headers(), body:JSON.stringify({subscription:current.toJSON(), topics}) });
  }
  function showControls() {
    subscribe.hidden = !publicKey || Boolean(subscription) || Notification.permission === 'denied';
    unsubscribe.hidden = !subscription;
  }
  function busy(action) {
    return async event => {
      event?.preventDefault();
      if (locked) return;
      locked = true;
      try { await action(); }
      catch { setStatus(globalThis.Notification?.permission === 'denied' ? 'pushDenied' : 'pushRetry'); }
      finally { locked = false; showControls(); }
    };
  }
  form.onsubmit = busy(async () => {
    const topics = getTopics();
    if (subscription) await send(subscription, topics);
    localStorage.setItem(preferencesKey, JSON.stringify(topics));
    setStatus('pushSaved');
  });
  subscribe.onclick = busy(async () => {
    const topics = getTopics();
    if (!topics.length) { setStatus('pushChoose'); return; }
    credential();
    const bytes = Uint8Array.from(atob(publicKey.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
    const current = await registration.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:bytes});
    try { await send(current, topics); }
    catch (error) { await current.unsubscribe(); throw error; }
    subscription = current;
    localStorage.setItem(preferencesKey, JSON.stringify(topics));
    setStatus('pushRegistered');
  });
  unsubscribe.onclick = busy(async () => {
    const current = subscription;
    // Revoke on the device even when the API is temporarily offline.
    try { await api('/subscriptions', {method:'DELETE', headers:headers()}); }
    finally { if (current) await current.unsubscribe(); subscription = await registration.pushManager.getSubscription(); }
    setStatus('pushRemoved');
  });

  async function initialize() {
    if (location.protocol === 'file:' || !('serviceWorker' in navigator)) return;
    const root = new URL('./', document.baseURI);
    await navigator.serviceWorker.register(new URL('service-worker.js',root));
    if (!restartPushApi) return;
    if (!('PushManager' in window && 'Notification' in window)) { setStatus('pushUnsupported'); return; }
    registration = await navigator.serviceWorker.ready;
    subscription = await registration.pushManager.getSubscription();
    ({publicKey} = await api('/config'));
    setStatus(Notification.permission === 'denied' ? 'pushDenied' : subscription ? 'pushRegistered' : '');
    showControls();
  }
  initialize().catch(() => { if (restartPushApi) setStatus('pushRetry'); });
})();
