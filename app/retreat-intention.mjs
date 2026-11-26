import {languages} from './state.mjs';

const key = 'restart.retreat.guest-intention.v1';
const limit = 500;
const copy = {
 title:['Моё намерение','Niyyətim','My intention'],
 description:[
  'Если хочешь, запиши, с каким намерением ты начинаешь практику. Запись хранится только в этой вкладке и не отправляется организатору.',
  'İstəsən, məşqə hansı niyyətlə başladığını yaz. Qeyd yalnız bu brauzer tabında qalır və təşkilatçıya göndərilmir.',
  'If you wish, write down your intention for the practice. This note stays in this tab and is never sent to the organiser.'
 ],
 hint:['Например, дать себе время на спокойное дыхание','Məsələn, sakit nəfəs almağa özümə vaxt ayırmaq','For example, give myself time to breathe calmly'],
 save:['Сохранить в этой вкладке','Bu tabda saxla','Save in this tab'],
 remove:['Удалить запись','Qeydi sil','Delete note'],
 saved:['Намерение сохранено в этой вкладке.','Niyyət bu tabda saxlanıldı.','Your intention is saved in this tab.'],
 removed:['Запись удалена.','Qeyd silindi.','Your note was deleted.'],
 failed:['Браузер не смог обновить запись.','Brauzer qeydi yeniləyə bilmədi.','The browser could not update your note.']
};

export function retreatIntentionMessage(lang, name) {
 return copy[name][Math.max(0,languages.indexOf(lang))];
}

export function readRetreatIntention(storage) {
 try {
  return ((storage ?? globalThis.sessionStorage).getItem(key) || '').slice(0,limit);
 } catch {
  return '';
 }
}

export function updateRetreatIntention(value, storage) {
 try {
  const target = storage ?? globalThis.sessionStorage;
  const text = value.slice(0,limit).trim();
  if (text) target.setItem(key,text);
  else target.removeItem(key);
  return text ? 'saved' : 'removed';
 } catch {
  return 'failed';
 }
}

export function renderRetreatIntention(lang, value, esc) {
 const t = name => retreatIntentionMessage(lang,name);
 return `<details class="panel">
 <summary>${t('title')}</summary>
 <form id="retreat-intention-form">
 <p id="retreat-intention-description">${t('description')}</p>
 <label>${t('title')}<textarea name="intention" maxlength="${limit}" rows="3" aria-describedby="retreat-intention-description" placeholder="${t('hint')}">${esc(value)}</textarea></label>
 <div class="actions"><button type="submit" value="save">${t('save')}</button><button type="submit" value="delete">${t('remove')}</button></div>
 <p role="status" data-intention-status></p>
 </form>
 </details>`;
}
