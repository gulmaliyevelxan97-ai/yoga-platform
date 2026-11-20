// Dates from the database are instants. Render an explicit zone for travelling students.
const copy = {
  ru: {venue:'Место занятия (необязательно)', calendar:'Сохранить в календарь', schoolTime:'Время занятия'},
  az: {venue:'Məşğələnin yeri (istəyə görə)', calendar:'Təqvimdə saxla', schoolTime:'Məşğələnin vaxtı'},
  en: {venue:'Class venue (optional)', calendar:'Save to calendar', schoolTime:'Class time'}
};
export const schoolTimeZone = 'Asia/Baku';

const labels = lang => copy[lang] || copy.ru;

export function classVenueField(lang) {
  return '<label>'+labels(lang).venue+'<input name="venue" maxlength="180"></label>';
}

export function classLocationFields(values) {
  return {venue:(values.venue || '').trim(), time_zone:schoolTimeZone};
}

const schoolClock = new Intl.DateTimeFormat('sv-SE',{
 timeZone:schoolTimeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
});

export function classTimeInput(instant) {
 return schoolClock.format(new Date(instant)).replace(' ','T');
}

export function classTimeInstant(value) {
 if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw Error('Invalid schedule time');
 const clock = Date.parse(value+'Z');
 const initial = Date.parse(classTimeInput(clock)+'Z');
 const instant = clock - (initial-clock);
 if (classTimeInput(instant)!==value) throw Error('Invalid schedule time');
 return new Date(instant).toISOString();
}

export function classDetailMarkup(session,lang,esc) {
  const {time_zone:zone, venue} = session;
  let result = '';
  if (zone && zone !== Intl.DateTimeFormat().resolvedOptions().timeZone) {
    const options = {dateStyle:'medium',timeStyle:'short',timeZone:zone};
    let time;
    try { time = new Intl.DateTimeFormat(lang,options); }
    catch (error) { if (!(error instanceof RangeError)) throw error; }
    if (time) result += '<p>'+labels(lang).schoolTime+' · '+esc(time.format(new Date(session.starts_at)))+' ('+esc(zone)+')</p>';
  }
  if (venue) result += '<p>'+esc(venue)+'</p>';
  return result;
}

function calendarText(value) {
  return String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g,'').replace(/([,;])/g,'\\$1');
}

function fold(line) {
  let bytes = 0;
  let out = '';
  const encoder = new TextEncoder();
  for (const glyph of line) {
    const size = encoder.encode(glyph).length;
    if (bytes + size > 75) { out += '\r\n '; bytes=1; }
    out += glyph;
    bytes += size;
  }
  return out;
}

// Store only this class in the user's exported file. No identities, roster or external requests.
export function classCalendarFile(session,now=new Date()) {
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(session.id)) throw Error('Invalid class ID');
  const stamp = value => new Date(value).toISOString().replace(/[:-]/g,'').replace(/\.\d{3}Z$/,'Z');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RESTART//Classes//EN','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT','UID:'+session.id+'@restart','DTSTAMP:'+stamp(now),
    'DTSTART:'+stamp(session.starts_at),'DTEND:'+stamp(session.ends_at),'SUMMARY:'+calendarText(session.title),
    ...(session.venue?['LOCATION:'+calendarText(session.venue)]:[]),
    'END:VEVENT','END:VCALENDAR',''].map(fold).join('\r\n');
}

export function classCalendarLink(session,lang) {
  const file = encodeURIComponent(classCalendarFile(session));
  return '<a class="button" download="RESTART.ics" href="data:text/calendar;charset=utf-8,'+file+'">'+labels(lang).calendar+'</a>';
}
