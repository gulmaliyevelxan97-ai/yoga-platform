const storageKey = 'restart.app.local.v1';
export const languages = ['ru', 'az', 'en'];
export const initialState = () => ({
  version: 1, lang: 'ru', name: '', goal: 3, sessions: [], journal: [], active: null,
  reminders: { time: '', practice: false, schedule: false, goal: false }
});

export function localRepository(getStorage = () => globalThis.localStorage) {
  let current = initialState();
  let available = true;
  try {
    const value = getStorage().getItem(storageKey);
    if (value) {
      const data = JSON.parse(value);
      if (data?.version === 1) current = { ...current, ...data };
    }
  } catch { available = false; }

  return {
    get available() { return available; },
    read() { return current; },
    write(patch) {
      current = { ...current, ...patch };
      try {
        getStorage().setItem(storageKey, JSON.stringify(current));
      } catch { available = false; }
      return current;
    }
  };
}

export function dateKey(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
}

export function shiftDate(date, offset) {
  const result = new Date(date);
  result.setDate(result.getDate() + offset);
  return result;
}

export function fromDateKey(key) {
  return new Date(key + 'T12:00:00');
}

export function weekStart(date) {
  return shiftDate(date, -(date.getDay() + 6) % 7);
}

export function elapsed(active, limit, now = Date.now()) {
  if (!active) return 0;
  const running = active.startedAt === null ? 0 : Math.max(0, now - active.startedAt);
  return Math.min(limit, Math.floor((active.accumulated + running) / 1000));
}

export function pause(active, limit, now = Date.now()) {
  const running = active.startedAt === null ? 0 : Math.max(0, now - active.startedAt);
  return { ...active, startedAt: null, accumulated: Math.min(limit * 1000, active.accumulated + running) };
}

export function metrics(sessions, today = new Date()) {
  const days = new Set(sessions.map(session => session.day));
  let cursor = days.has(dateKey(today)) ? today : shiftDate(today, -1);
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor = shiftDate(cursor, -1);
  }
  const monday = dateKey(weekStart(today));
  return {
    count: sessions.length,
    seconds: sessions.reduce((sum, session) => sum + session.seconds, 0),
    week: sessions.filter(session => session.day >= monday && session.day <= dateKey(today)).length,
    streak,
    days
  };
}

export function upsertEntry(list, entry) {
  return list.some(record => record.id === entry.id)
    ? list.map(record => record.id === entry.id ? entry : record)
    : [...list, entry];
}
