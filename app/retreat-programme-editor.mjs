import {languages} from './state.mjs';
import {classTimeInput,classTimeInstant} from './booking-calendar.mjs';

const copy = {
 title:['Программа группы','Qrupun proqramı','Cohort programme'],
 loading:['Загружаем программу…','Proqram yüklənir…','Loading programme…'],
 draft:['Черновик','Qaralama','Draft'],
 published:['Опубликовано','Dərc edilib','Published'],
 create:['Новый пункт программы','Yeni proqram bəndi','New programme item'],
 name:['Название','Ad','Title'],
 description:['Описание','Təsvir','Description'],
 start:['Начало (Баку)','Başlanğıc (Bakı)','Start (Baku)'],
 end:['Окончание (Баку)','Son (Bakı)','End (Baku)'],
 save:['Сохранить','Yadda saxla','Save'],
 publish:['Опубликовать','Dərc et','Publish'],
 confirm:['Показать этот пункт участникам группы?','Bu bənd qrup iştirakçılarına göstərilsin?','Show this item to cohort participants?'],
 saved:['Пункт сохранён.','Bənd yadda saxlanıldı.','Item saved.'],
 shared:['Пункт опубликован.','Bənd dərc edildi.','Item published.'],
 dirty:['Сначала сохраните изменения.','Əvvəlcə dəyişiklikləri yadda saxlayın.','Save your changes before publishing.'],
 invalid:['Проверьте название и время. Для публикации заполните начало.','Adı və vaxtı yoxlayın. Dərc etmək üçün başlanğıc vaxtını yazın.','Check the title and times. Publication requires a start time.'],
 error:['Не удалось подтвердить действие. Проверьте программу после обновления.','Əməliyyat təsdiqlənmədi. Yenilədikdən sonra proqramı yoxlayın.','The action could not be confirmed. Check the programme after refreshing.'],
 stale:['Пункт изменился. Обновите список перед повторной попыткой.','Bənd dəyişib. Yenidən cəhd etməzdən əvvəl siyahını yeniləyin.','The item has changed. Refresh the list before retrying.'],
 refresh:['Обновить программу','Proqramı yenilə','Refresh programme']
};

async function result(query) {
 const {data,error} = await query;
 if (error) throw error;
 return data;
}

export async function readMentorProgramme(client,user) {
 if (!user?.id || user.is_anonymous) return null;
 const memberships = await result(client.from('restart_retreat_members')
  .select('cohort_id,restart_retreat_cohorts(title)').eq('user_id',user.id).eq('role','mentor'));
 if (!memberships.length) return null;
 const items = await result(client.from('restart_retreat_programme_items')
  .select('id,cohort_id,title,description,starts_at,ends_at,published,revision')
  .in('cohort_id',memberships.map(row=>row.cohort_id)).order('starts_at').order('id'));
 return {memberships,items};
}

const timeValue = instant => instant ? classTimeInput(instant) : '';

export function programmeSaveArgs(data, cohort, item) {
 const date = (value,original) => !value ? null :
  value===timeValue(original) ? original : classTimeInstant(value);
 const title = item?.published ? item.title : data.title?.trim();
 const start = date(data.start,item?.starts_at);
 const end = date(data.end,item?.ends_at);
 if (!title || title.length>160 || (item?.published && !start) ||
     (end && (!start || Date.parse(end)<=Date.parse(start)))) throw new Error('Invalid programme item');
 return {
  p_cohort_id:cohort,p_item_id:item?.id ?? null,p_expected_revision:item?.revision ?? null,
  p_title:title,p_description:item?.published ? item.description : data.description ?? '',
  p_starts_at:start,p_ends_at:end
 };
}

export async function mentorProgrammeEditor({outlet,client,user,lang,esc,current}) {
 const t = key=>copy[key][Math.max(0,languages.indexOf(lang))];
 const refresh='<button type="button" data-programme-refresh>'+t('refresh')+'</button>';
 let snapshot;
 let busy=false;

 function form(cohort,item) {
  const id=item?.id ?? '';
  const readonly=item?.published?' readonly':'';
  return '<form class="panel" data-programme-form data-cohort="'+esc(cohort)+'" data-item="'+esc(id)+'">'+
   '<h3>'+esc(item?.title ?? t('create'))+'</h3>'+(item?'<p>'+t(item.published?'published':'draft')+'</p>':'')+
   '<label>'+t('name')+'<input name="title" required maxlength="160" value="'+esc(item?.title)+'"'+readonly+'></label>'+
   '<label>'+t('description')+'<textarea name="description" maxlength="4000"'+readonly+'>'+esc(item?.description)+'</textarea></label>'+
   '<div class="field-row"><label>'+t('start')+'<input name="start" type="datetime-local" value="'+esc(timeValue(item?.starts_at))+'"></label>'+
   '<label>'+t('end')+'<input name="end" type="datetime-local" value="'+esc(timeValue(item?.ends_at))+'"></label></div>'+
   '<div class="actions"><button type="submit" value="save">'+t('save')+'</button>'+
   (item&&!item.published?'<button type="submit" value="publish">'+t('publish')+'</button>':'')+
   '</div><p role="status" data-programme-message></p></form>';
 }

 async function load(notice='',expanded) {
  if (!current()) return;
  outlet.textContent=t('loading');
  try {
   snapshot = await readMentorProgramme(client,user);
   if (!current()) return;
   if (!snapshot) {outlet.textContent='';return;}
   outlet.innerHTML='<h2>'+t('title')+'</h2>'+
    (notice?'<p role="status" tabindex="-1">'+t(notice)+'</p>':'')+
    snapshot.memberships.map(row=>'<details class="panel"'+(row.cohort_id===expanded || snapshot.memberships.length===1?' open':'')+'><summary>'+esc(row.restart_retreat_cohorts?.title)+'</summary>'+
     snapshot.items.filter(item=>item.cohort_id===row.cohort_id).map(item=>form(row.cohort_id,item)).join('')+
     form(row.cohort_id)+'</details>').join('')+refresh;
   if (notice) outlet.querySelector('[tabindex="-1"]')?.focus();
  } catch {
   if (current()) outlet.innerHTML=(notice?'<p role="status">'+t(notice)+'</p>':'')+
    '<p role="alert">'+t('error')+'</p>'+refresh;
  }
 }

 outlet.onclick=async event=>{
  if (!event.target.closest('[data-programme-refresh]') || busy || !current()) return;
  busy=true;
  try {await load();} finally {busy=false;}
 };

 outlet.onsubmit=async event=>{
  const form=event.target;
  if (!form.matches('[data-programme-form]')) return;
  event.preventDefault();
  event.stopPropagation();
  if (busy || !current()) return;
  const {cohort,item:id}=form.dataset;
  if (!snapshot?.memberships.some(row=>row.cohort_id===cohort)) return;
  const item=snapshot.items.find(row=>row.id===id && row.cohort_id===cohort);
  if (id && !item) return;
  const data=Object.fromEntries(new FormData(form));
  const message=form.querySelector('[data-programme-message]');
  const publish=event.submitter?.value==='publish';
  let args;
  try {
   args=programmeSaveArgs(data,cohort,item);
  } catch {
   message.textContent=t('invalid');
   return;
  }
  if (publish) {
   if (!item || item.published || !args.p_starts_at) {message.textContent=t('invalid');return;}
   const changed=['title','description','start','end'].some(name=>
    form.elements.namedItem(name).defaultValue!==data[name]);
   if (changed) {message.textContent=t('dirty');return;}
   if (!confirm(t('confirm'))) return;
   args={p_cohort_id:cohort,p_item_id:item.id,p_expected_revision:item.revision};
  }
  busy=true;
  const buttons=Array.from(form.querySelectorAll('button'));
  buttons.forEach(button=>{button.disabled=true;});
  try {
   await result(client.rpc(publish?'restart_publish_retreat_programme_item':'restart_save_retreat_programme_item',args));
   await load(publish?'shared':'saved',cohort);
  } catch (error) {
   if (current()) message.textContent=t(error.code==='40001'?'stale':'error');
  } finally {
   busy=false;
   buttons.forEach(button=>{button.disabled=false;});
  }
 };
 busy=true;
 try {await load();} finally {busy=false;}
}
