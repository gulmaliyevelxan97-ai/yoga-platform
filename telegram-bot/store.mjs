import { DatabaseSync, backup } from 'node:sqlite';
import { languages } from './content.mjs';

export const validTime = time => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
export function validZone(zone) {
  if (typeof zone !== 'string' || !/^(?:UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+)$/.test(zone)) return false;
  try { new Intl.DateTimeFormat('en',{timeZone:zone}); return true; }
  catch { return false; }
}
export function localSlot(now, zone) {
  const parts = new Intl.DateTimeFormat('en-CA',{
    timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map(({ type,value })=>[type,value]));
  return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};
}
function minutes(time) {
  const [hour,minute]=time.split(':').map(Number);
  return hour*60+minute;
}
export function openStore(file, defaultZone='Asia/Baku') {
  if (!validZone(defaultZone)) throw new Error('Invalid default time zone');
  const db=new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS members (
      chat_id INTEGER PRIMARY KEY, lang TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0,
      time TEXT NOT NULL DEFAULT '19:30', zone TEXT NOT NULL, last_date TEXT
    );
    CREATE TABLE IF NOT EXISTS polling (id INTEGER PRIMARY KEY CHECK(id=1), next_offset INTEGER NOT NULL);
  `);
  const prepare=sql=>db.prepare(sql);
  const fetch=prepare('SELECT * FROM members WHERE chat_id=?');
  const insert=prepare('INSERT OR IGNORE INTO members (chat_id,lang,zone) VALUES (?,?,?)');
  const claim=prepare('UPDATE members SET last_date=? WHERE chat_id=? AND enabled=1 AND zone=? AND time=? AND (last_date IS NULL OR last_date<>?)');
  return {
    member(chatId, language) {
      insert.run(chatId,languages.includes(language)?language:'ru',defaultZone);
      return fetch.get(chatId);
    },
    setLanguage(chatId,lang) { prepare('UPDATE members SET lang=? WHERE chat_id=?').run(lang,chatId); },
    setEnabled(chatId,enabled) { prepare('UPDATE members SET enabled=? WHERE chat_id=?').run(Number(enabled),chatId); },
    setTime(chatId,time) { prepare('UPDATE members SET time=? WHERE chat_id=?').run(time,chatId); },
    setZone(chatId,zone) { prepare('UPDATE members SET zone=? WHERE chat_id=?').run(zone,chatId); },
    offset() { return prepare('SELECT next_offset FROM polling WHERE id=1').get()?.next_offset ?? 0; },
    advance(offset) {
      prepare('INSERT INTO polling VALUES (1,?) ON CONFLICT(id) DO UPDATE SET next_offset=MAX(next_offset,excluded.next_offset)').run(offset);
    },
    *due(now) {
      const slots=new Map();
      for (const member of prepare('SELECT * FROM members WHERE enabled=1').all()) {
        if (!slots.has(member.zone)) slots.set(member.zone,localSlot(now,member.zone));
        const {date,time}=slots.get(member.zone);
        const delay=minutes(time)-minutes(member.time);
        if (delay<0 || delay>=10 || member.last_date===date) continue;
        if (claim.run(date,member.chat_id,member.zone,member.time,date).changes) yield {...member,last_date:date};
      }
    },
    release(member) {
      prepare('UPDATE members SET last_date=? WHERE chat_id=? AND last_date=?').run(null,member.chat_id,member.last_date);
    },
    backup(target) { return backup(db,target); },
    close() { db.close(); }
  };
}
