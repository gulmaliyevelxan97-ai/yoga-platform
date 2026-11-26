import {languages} from './state.mjs';
import {schoolTimeZone} from './booking-calendar.mjs';

const key='restart.retreat.letter.v1';
const limit=2400;
const copy={
 title:['Письмо себе','Özümə məktub','Letter to yourself'],
 help:['Письмо хранится в этом браузере. Его можно открыть, изменить или удалить в любое время.',
  'Məktub bu brauzerdə saxlanılır. Onu istənilən vaxt açmaq, dəyişmək və ya silmək olar.',
  'Your letter stays in this browser. Open, edit or delete it at any time.'],
 text:['Текст письма','Məktubun mətni','Letter text'],
 revisit:['Дата, когда хочешь перечитать (необязательно, время Баку)',
  'Yenidən oxumaq istədiyin tarix (istəyə görə, Bakı vaxtı)','Revisit date (optional, Baku time)'],
 open:['Открыть письмо','Məktubu aç','Open letter'],
 write:['Написать письмо','Məktub yaz','Write a letter'],
 save:['Сохранить письмо','Məktubu saxla','Save letter'],
 remove:['Удалить письмо','Məktubu sil','Delete letter'],
 confirm:['Удалить письмо из этого браузера?','Məktub bu brauzerdən silinsin?','Delete the letter from this browser?'],
 saved:['Письмо сохранено.','Məktub saxlanıldı.','Letter saved.'],
 removed:['Письмо удалено.','Məktub silindi.','Letter deleted.'],
 due:['Можно перечитать письмо.','Məktubu yenidən oxuya bilərsən.','Your letter is ready to revisit.'],
 failed:['Браузер не сохранил изменение.','Brauzer dəyişikliyi saxlamadı.','The browser could not save the change.'],
 invalid:['Проверь текст письма и дату.','Məktubun mətnini və tarixi yoxla.','Check your letter and date.']
};

function dateValue(date) {
 if (typeof date!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
 const instant=new Date(date+'T00:00:00Z');
 return Number.isFinite(instant.getTime()) && instant.toISOString().slice(0,10)===date?date:'';
}

function normalize(value) {
 const text=typeof value?.text==='string'?value.text.trim().slice(0,limit):'';
 return {text,revisit:text?dateValue(value.revisit):''};
}

export function readRetreatLetter(storage) {
 try {return normalize(JSON.parse((storage ?? globalThis.localStorage).getItem(key)));}
 catch {return normalize(null);}
}

export function writeRetreatLetter(value,storage) {
 try {
  const target=storage ?? globalThis.localStorage;
  const next=normalize(value);
  if (next.text) target.setItem(key,JSON.stringify(next));
  else target.removeItem(key);
  return true;
 } catch {return false;}
}

export function retreatLetterReady(revisit,now=new Date()) {
 const valid=dateValue(revisit);
 if (!valid) return false;
 const date=new Intl.DateTimeFormat('en',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:schoolTimeZone});
 const parts=Object.fromEntries(date.formatToParts(now).map(({type,value})=>[type,value]));
 return valid<=parts.year+'-'+parts.month+'-'+parts.day;
}

const index=lang=>Math.max(0,languages.indexOf(lang));

export function renderRetreatLetter(lang,esc,storage,now=new Date()) {
 const current=readRetreatLetter(storage);
 const t=label=>copy[label][index(lang)];
 const due=retreatLetterReady(current.revisit,now);
 return '<section class="panel" data-retreat-letter><h2>'+t('title')+'</h2><p>'+t('help')+
  '</p><p data-letter-due'+(due?'':' hidden')+'>'+t('due')+'</p><details><summary data-letter-summary>'+
  t(current.text?'open':'write')+'</summary><form data-letter-form><label>'+t('text')+
  '<textarea name="text" rows="6" maxlength="'+limit+'" required>'+esc(current.text)+'</textarea></label>'+
  '<label>'+t('revisit')+'<input type="date" name="revisit" value="'+esc(current.revisit)+'"></label>'+
  '<div class="actions"><button type="submit">'+t('save')+'</button>'+
  '<button type="button" data-letter-remove'+(current.text?'':' hidden')+'>'+t('remove')+'</button></div>'+
  '</form></details><p role="status" data-letter-status></p></section>';
}

export function bindRetreatLetter(outlet,lang,storage) {
 const section=outlet.querySelector('[data-retreat-letter]');
 if (!section) return;
 const t=label=>copy[label][index(lang)];
 const form=section.querySelector('[data-letter-form]');
 const {text,revisit}=form.elements;
 const status=section.querySelector('[data-letter-status]');
 const due=section.querySelector('[data-letter-due]');
 const remove=section.querySelector('[data-letter-remove]');
 const summary=section.querySelector('[data-letter-summary]');
 const show=label=>{status.textContent=t(label);};
 const update=()=>{
  const current=readRetreatLetter(storage);
  remove.hidden=!current.text;
  summary.textContent=t(current.text?'open':'write');
  due.hidden=!retreatLetterReady(current.revisit);
 };
 form.onsubmit=event=>{
  event.preventDefault();
  event.stopPropagation();
  if (!text.value.trim() || (revisit.value && !dateValue(revisit.value))) {show('invalid');return;}
  if (!writeRetreatLetter({text:text.value,revisit:revisit.value},storage)) {show('failed');return;}
  update();
  show('saved');
 };
 remove.onclick=()=>{
  if (!confirm(t('confirm'))) return;
  if (!writeRetreatLetter({},storage)) {show('failed');return;}
  text.value=revisit.value='';
  update();
  text.focus();
  show('removed');
 };
}
