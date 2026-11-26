import {languages} from './state.mjs';
import {schoolTimeZone} from './booking-calendar.mjs';

const copy={
 title:['Информация о ретрите','Retrit haqqında məlumat','Retreat details'],
 loading:['Загружаем информацию…','Məlumat yüklənir…','Loading event details…'],
 empty:['Организатор ещё не опубликовал информацию.','Təşkilatçı hələ məlumatı dərc etməyib.','The organiser has not published details yet.'],
 noGroup:['Информация появится после добавления в группу.','Qrupa əlavə olunduqdan sonra məlumat görünəcək.','Details will appear after you join a group.'],
 date:['Дата (Баку)','Tarix (Bakı)','Date (Baku)'],
 location:['Место','Məkan','Location'],
 dress:['Форма одежды','Geyim qaydası','Dress code'],
 packing:['Что взять с собой','Özünüzlə nə götürməli','What to bring'],
 countdown:['Дней до ретрита','Retritə qalan günlər','Days until the retreat'],
 today:['Ретрит сегодня','Retrit bu gündür','The retreat is today'],
 visible:['Показывать участникам группы','Qrup iştirakçılarına göstər','Show to cohort participants'],
 confirm:['Сохранить и показать эти данные участникам группы?','Bu məlumat yadda saxlanılsın və qrup iştirakçılarına göstərilsin?','Save these details and show them to cohort participants?'],
 preview:['Предпросмотр','Ön baxış','Preview'],
 previewOnly:['Так участники увидят сведения после публикации. Изменения пока не сохранены.','Dərc edildikdən sonra iştirakçılar məlumatı bu şəkildə görəcəklər. Dəyişikliklər hələ saxlanılmayıb.','This is how participants will see the details after publication. Changes have not been saved.'],
 previewEmpty:['Добавьте хотя бы одно поле и проверьте дату.','Ən azı bir xananı doldurun və tarixi yoxlayın.','Fill in at least one field and check the date.'],
 withdraw:['Сохранить изменения и скрыть сведения от участников?','Dəyişikliklər saxlanılsın və məlumat iştirakçılardan gizlədilsin?','Save changes and hide these details from participants?'],
 save:['Сохранить','Yadda saxla','Save'],
 saved:['Информация сохранена.','Məlumat yadda saxlanıldı.','Details saved.'],
 invalid:['Проверьте дату и заполненные поля.','Tarixi və doldurulmuş sahələri yoxlayın.','Check the date and the form fields.'],
 stale:['Информация изменилась. Обновите страницу перед повторной попыткой.','Məlumat dəyişib. Yenidən cəhd etməzdən əvvəl səhifəni yeniləyin.','The details have changed. Refresh before trying again.'],
 error:['Не удалось подтвердить действие. Проверьте информацию после обновления.','Əməliyyatı təsdiqləmək mümkün olmadı. Yenilədikdən sonra məlumatı yoxlayın.','The action could not be confirmed. Check the details after refreshing.'],
 retry:['Обновить','Yenilə','Refresh']
};

export const retreatEventDetailsTitle=copy.title;

const fields=[['location','location',300],['dress_code','dress',1000],['packing_list','packing',2000]];
const locale=lang=>languages[Math.max(0,languages.indexOf(lang))];
const labels=lang=>key=>copy[key][languages.indexOf(locale(lang))];

async function rows(query) {
 const {data,error}=await query;
 if (error) throw error;
 return data;
}

export async function readRetreatEventDetails(client,user,mentor=false) {
 if (!user?.id || user.is_anonymous) return {groups:[],details:[]};
 let membership=client.from('restart_retreat_members')
  .select('cohort_id,restart_retreat_cohorts(title)').eq('user_id',user.id);
 if (mentor) membership=membership.eq('role','mentor');
 const groups=await rows(membership.order('cohort_id'));
 if (!groups.length) return {groups,details:[]};
 let query=client.from('restart_retreat_event_details')
  .select('cohort_id,event_date,location,dress_code,packing_list,published,revision')
  .in('cohort_id',groups.map(group=>group.cohort_id));
 if (!mentor) query=query.eq('published',true);
 return {groups,details:await rows(query)};
}

function dateInstant(date) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
 const instant=new Date(date+'T00:00:00Z');
 return Number.isFinite(instant.getTime()) && instant.toISOString().slice(0,10)===date ? instant : null;
}

const bakuDay = new Intl.DateTimeFormat('en',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:schoolTimeZone});

export function retreatDaysUntil(date,now=new Date()) {
 const event=dateInstant(date);
 if (!event) return null;
 const parts=Object.fromEntries(bakuDay.formatToParts(now).map(({type,value})=>[type,value]));
 const today=dateInstant(parts.year+'-'+parts.month+'-'+parts.day);
 const days=Number(event-today)/86400000;
 return days>=0 ? days : null;
}

export function eventDetailsSaveArgs(cohort,detail,values) {
 const date=values.event_date || null;
 const published=values.visible==='yes';
 const content=Object.fromEntries(fields.map(([field])=>[field,values[field]?.trim() || null]));
 if ((date && !dateInstant(date)) || (published && !date && !Object.values(content).some(Boolean)) ||
     fields.some(([field,,limit])=>Array.from(content[field] ?? '').length>limit)) return null;
 return {p_cohort_id:cohort,p_expected_revision:detail?.revision ?? null,p_event_date:date,
  p_location:content.location,p_dress_code:content.dress_code,p_packing_list:content.packing_list,p_published:published};
}

export function renderRetreatEventDetails({groups,details},lang,esc,now=new Date()) {
 const t=labels(lang);
 const format=new Intl.DateTimeFormat(locale(lang),{dateStyle:'long',timeZone:'UTC'});
 const values=new Map(details.filter(row=>row.published).map(row=>[row.cohort_id,row]));
 const text=value=>esc(value).replace(/\n/g,'<br>');
 if (!groups.length) return '<p>'+t('noGroup')+'</p>';
 return groups.map(group=>{
  const item=values.get(group.cohort_id);
  const title=esc(group.restart_retreat_cohorts?.title || t('title'));
  if (!item) return '<article class="panel"><h2>'+title+'</h2><p>'+t('empty')+'</p></article>';
  const instant=dateInstant(item.event_date);
  const days=instant?retreatDaysUntil(item.event_date,now):null;
  const when=instant?'<dt>'+t('date')+'</dt><dd><time datetime="'+esc(item.event_date)+'">'+
   esc(format.format(instant))+'</time></dd>':'';
  const detailFields=fields
   .filter(([field])=>item[field]).map(([field,key])=>'<dt>'+t(key)+'</dt><dd>'+text(item[field])+'</dd>').join('');
  return '<article class="panel"><h2>'+title+'</h2>'+
   (days===null?'':days===0?'<p>'+t('today')+'</p>':'<p>'+t('countdown')+' · '+new Intl.NumberFormat(locale(lang)).format(days)+'</p>')+
   '<dl>'+when+detailFields+'</dl></article>';
 }).join('');
}

export function renderRetreatEventPreview(group,values,lang,esc,now=new Date()) {
 const t=labels(lang);
 const args=eventDetailsSaveArgs(group.cohort_id,null,{...values,visible:'yes'});
 if (!args) return '<p>'+t('previewEmpty')+'</p>';
 const row=Object.fromEntries(['cohort_id','event_date','location','dress_code','packing_list','published'].map(field=>[field,args['p_'+field]]));
 return '<p class="muted">'+t('previewOnly')+'</p>'+renderRetreatEventDetails({groups:[group],details:[row]},lang,esc,now);
}

export async function retreatEventDetailsPage({outlet,client,user,lang,esc,current,mentor=false}) {
 if (!current() || !user?.id || user.is_anonymous) return;
 const t=labels(lang);
 const refresh='<button type="button" data-event-refresh>'+t('retry')+'</button>';
 let snapshot;
 let busy=false;

 function editor() {
  if (!snapshot.groups.length) return '';
  return '<h2>'+t('title')+'</h2>'+snapshot.groups.map(group=>{
   const item=snapshot.details.find(row=>row.cohort_id===group.cohort_id);
   const previewId='retreat-event-preview-'+esc(group.cohort_id);
   return '<form class="panel" data-event-cohort="'+esc(group.cohort_id)+'"><h3>'+esc(group.restart_retreat_cohorts?.title || t('title'))+'</h3>'+
    '<label>'+t('date')+'<input type="date" name="event_date" value="'+esc(item?.event_date)+'"></label>'+
    fields.map(([field,key,limit])=>
     '<label>'+t(key)+'<textarea name="'+field+'" rows="3" maxlength="'+limit+'">'+esc(item?.[field])+'</textarea></label>').join('')+
    '<label class="check"><input name="visible" type="checkbox" value="yes" '+(item?.published?'checked':'')+'>'+t('visible')+'</label>'+
    '<div class="actions"><button type="submit" class="cta">'+t('save')+'</button>'+
    '<button type="button" data-event-preview aria-expanded="false" aria-controls="'+previewId+'">'+t('preview')+'</button></div>'+
    '<p role="status" data-event-result></p><div id="'+previewId+'" data-event-preview-panel aria-live="polite" hidden></div></form>';
  }).join('');
 }

 async function load(notice='') {
  if (!current()) return;
  outlet.textContent=t('loading');
  try {
   snapshot=await readRetreatEventDetails(client,user,mentor);
   if (!current()) return;
   const view=mentor?editor():renderRetreatEventDetails(snapshot,lang,esc);
   outlet.innerHTML=(notice?'<p role="status" tabindex="-1">'+t(notice)+'</p>':'')+view+(view?refresh:'');
   if (notice) outlet.querySelector('[tabindex="-1"]')?.focus();
  } catch {
   if (current()) outlet.innerHTML=(notice?'<p role="status">'+t(notice)+'</p>':'')+
    '<p role="alert">'+t('error')+'</p>'+refresh;
  }
 }

 outlet.onclick=async event=>{
  if (busy || !current()) return;
  const preview=mentor?event.target.closest('[data-event-preview]'):null;
  if (preview) {
   const form=preview.form;
   const group=snapshot?.groups.find(row=>row.cohort_id===form?.dataset.eventCohort);
   if (!group) return;
   const panel=form.querySelector('[data-event-preview-panel]');
   if (!panel) return;
   const open=panel.hidden;
   panel.hidden=!open;
   preview.setAttribute('aria-expanded',String(open));
   panel.innerHTML=open?renderRetreatEventPreview(group,Object.fromEntries(new FormData(form)),lang,esc):'';
   return;
  }
  if (!event.target.closest('[data-event-refresh]')) return;
  busy=true;
  try {await load();} finally {busy=false;}
 };
 if (mentor) outlet.oninput=event=>{
  const form=event.target.closest('[data-event-cohort]');
  const panel=form?.querySelector('[data-event-preview-panel]');
  if (!panel || panel.hidden) return;
  panel.hidden=true;
  panel.replaceChildren();
  form.querySelector('[data-event-preview]').setAttribute('aria-expanded','false');
 };
 if (mentor) outlet.onsubmit=async event=>{
  const form=event.target;
  if (!form.matches('[data-event-cohort]')) return;
  event.preventDefault();
  event.stopPropagation();
  if (busy || !current()) return;
  const cohort=form.dataset.eventCohort;
  if (!snapshot?.groups.some(row=>row.cohort_id===cohort)) return;
  const detail=snapshot.details.find(row=>row.cohort_id===cohort);
  const args=eventDetailsSaveArgs(cohort,detail,Object.fromEntries(new FormData(form)));
  const message=form.querySelector('[data-event-result]');
  if (!args) {message.textContent=t('invalid');return;}
  if (args.p_published && !confirm(t('confirm'))) return;
  if (!args.p_published && detail?.published && !confirm(t('withdraw'))) return;
  busy=true;
  const button=form.querySelector('button[type=submit]');
  button.disabled=true;
  try {
   await rows(client.rpc('restart_save_retreat_event_details',args));
   await load('saved');
  } catch (error) {
   if (current()) message.textContent=t(error.code==='40001'?'stale':'error');
  } finally {
   busy=false;
   button.disabled=false;
  }
 };
 busy=true;
 try {await load();} finally {busy=false;}
}
