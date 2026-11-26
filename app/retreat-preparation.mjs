import {languages} from './state.mjs';

const storageKey='restart.retreat.preparation.v1';
const reflectionLimit=1200;
const checklist={
 details:['Уточнил(а) место и время у организатора','Məkanı və vaxtı təşkilatçı ilə dəqiqləşdirdim','I checked the place and time with the organiser'],
 clothes:['Подготовил(а) удобную одежду','Rahat geyim hazırladım','I set out comfortable clothes'],
 water:['Подготовил(а) воду','Su hazırladım','I packed water']
};
const copy={
 title:['Подготовка к ретриту','Retritə hazırlıq','Prepare for the retreat'],
 prompt:['Что хочется сохранить из этого опыта?','Bu təcrübədən nəyi yadda saxlamaq istəyirsiniz?','What would you like to take away from the experience?'],
 private:['Отметки и запись хранятся в этом браузере. Их можно удалить в любой момент.','İşarələr və qeyd bu brauzerdə saxlanılır. Onları istənilən vaxt silə bilərsiniz.','Your checklist and note are stored in this browser. You can delete them at any time.'],
 save:['Сохранить запись','Qeydi saxla','Save note'],
 clear:['Удалить отметки и запись','İşarələri və qeydi sil','Delete checklist and note'],
 confirm:['Удалить отметки и запись из этого браузера?','İşarələr və qeyd bu brauzerdən silinsin?','Delete the checklist and note from this browser?'],
 saved:['Сохранено в этом браузере.','Bu brauzerdə saxlanıldı.','Saved in this browser.'],
 cleared:['Отметки и запись удалены.','İşarələr və qeyd silindi.','Checklist and note deleted.'],
 failed:['Браузер не сохранил изменение.','Brauzer dəyişikliyi saxlamadı.','The browser could not save the change.']
};

const index=lang=>Math.max(0,languages.indexOf(lang));
function normalize(value) {
 const items=Array.isArray(value?.items)?value.items:[];
 return {
  items:Object.keys(checklist).filter(item=>items.includes(item)),
  reflection:typeof value?.reflection==='string'?value.reflection.slice(0,reflectionLimit):''
 };
}

export function readRetreatPreparation(storage) {
 try {
  return normalize(JSON.parse((storage ?? globalThis.localStorage).getItem(storageKey)));
 } catch {
  return normalize(null);
 }
}

export function writeRetreatPreparation(value,storage) {
 try {
  const target=storage ?? globalThis.localStorage;
  const next=normalize(value);
  if (!next.items.length && !next.reflection) target.removeItem(storageKey);
  else target.setItem(storageKey,JSON.stringify(next));
  return true;
 } catch {
  return false;
 }
}

export function renderRetreatPreparation(lang,esc,storage,reflection=false) {
 const current=readRetreatPreparation(storage);
 const language=index(lang);
 const t=key=>copy[key][language];
 const items=Object.entries(checklist).map(([key,label])=>'<label class="check"><input type="checkbox" name="'+key+
   '"'+(current.items.includes(key)?' checked':'')+'>'+label[language]+'</label>').join('');
 const form='<form data-preparation-form><label>'+t('prompt')+
  '<textarea name="reflection" rows="4" maxlength="'+reflectionLimit+'">'+esc(current.reflection)+'</textarea></label>'+
  '<button type="submit">'+t('save')+'</button></form>';
 return '<div data-retreat-preparation><p>'+t('private')+'</p>'+
  (reflection ? form : '<h3>'+t('title')+'</h3><div data-preparation-items>'+items+'</div>')+
  '<div class="actions"><button type="button" data-preparation-clear>'+t('clear')+'</button></div>'+
  '<p data-preparation-status role="status"></p></div>';
}

export function bindRetreatPreparation(outlet,lang,storage) {
 const section=outlet.querySelector('[data-retreat-preparation]');
 if (!section) return;
 const t=key=>copy[key][index(lang)];
 const controls=Array.from(section.querySelectorAll('[data-preparation-items] input'));
 const form=section.querySelector('[data-preparation-form]');
 const field=form?.elements.reflection;
 const status=section.querySelector('[data-preparation-status]');
 const selected=()=>controls.filter(control=>control.checked).map(control=>control.name);
 const show=key=>{status.textContent=t(key);};

 for (const control of controls) control.onchange=()=>{
  const current=readRetreatPreparation(storage);
  show(writeRetreatPreparation({...current,items:selected()},storage)?'saved':'failed');
 };

 if (form) form.onsubmit=event=>{
  event.preventDefault();
  event.stopPropagation();
  show(writeRetreatPreparation({...readRetreatPreparation(storage),reflection:field.value.trim()},storage)?'saved':'failed');
 };

 section.querySelector('[data-preparation-clear]').onclick=()=>{
  if (!confirm(t('confirm'))) return;
  if (!writeRetreatPreparation({},storage)) {show('failed');return;}
  controls.forEach(control=>{control.checked=false;});
  if (field) field.value='';
  show('cleared');
 };
}
