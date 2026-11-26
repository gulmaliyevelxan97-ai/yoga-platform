import {languages} from './state.mjs';

const approvedPageSize = 25;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const copy = {
 title:['Заявки на ретрит','Retrit müraciətləri','Retreat applications'],
 loading:['Загружаем заявки…','Müraciətlər yüklənir…','Loading applications…'],
 denied:['Заявки доступны только наставникам назначенных групп.','Müraciətləri yalnız təyin olunmuş qrupların mentorları görə bilər.','Applications are available to mentors of assigned groups.'],
 empty:['Нет заявок на рассмотрении.','Baxılmalı müraciət yoxdur.','There are no pending applications.'],
 participants:['Одобренные заявки','Təsdiqlənmiş müraciətlər','Approved applications'],
 nameSearch:['Поиск по имени','Ada görə axtarış','Search by name'],
 interactions:['Взаимодействия','Sizinlə əlaqə','Interactions'],
 interactionLoading:['Загружаем сведения…','Məlumat yüklənir…','Loading summary…'],
 interactionUnavailable:['Сведения недоступны.','Məlumat əlçatan deyil.','Summary unavailable.'],
 sharedResponses:['Переданные ответы на анкеты','Paylaşılmış anket cavabları','Shared form responses'],
 submittedTasks:['Задания на проверке','Yoxlamada olan tapşırıqlar','Assignments awaiting review'],
 reviewedTasks:['Проверенные задания','Yoxlanılmış tapşırıqlar','Reviewed assignments'],
 directMessages:['Сообщения в вашем диалоге','Sizin dialoqunuzdakı mesajlar','Messages in your conversation'],
 approvedOn:['Дата одобрения','Təsdiq tarixi','Approved on'],
 noParticipants:['Одобренных заявок пока нет.','Hələ təsdiqlənmiş müraciət yoxdur.','No applications have been approved yet.'],
 noMatches:['Совпадений нет.','Uyğun nəticə yoxdur.','No matching names.'],
 group:['Группа','Qrup','Group'],
 allGroups:['Все группы','Bütün qruplar','All groups'],
 search:['Найти','Axtar','Search'],
 previous:['Предыдущая','Əvvəlki','Previous'],
 next:['Следующая','Növbəti','Next'],
 page:['Страница','Səhifə','Page'],
 approve:['Одобрить','Təsdiqlə','Approve'],
 decline:['Отклонить','Rədd et','Decline'],
 confirm:['Отклонить заявку?','Müraciət rədd edilsin?','Decline this application?'],
 approved:['Заявка одобрена.','Müraciət təsdiqləndi.','Application approved.'],
 declined:['Заявка отклонена.','Müraciət rədd edildi.','Application declined.'],
 error:['Не удалось завершить действие. Обновите список и проверьте статус.','Əməliyyat baş tutmadı. Siyahını yeniləyin və statusu yoxlayın.','The action could not be completed. Refresh the list and check its status.'],
 refresh:['Обновить список','Siyahını yenilə','Refresh list']
};

export const retreatAdmissionTitle = copy.title;

async function rows(query) {
 const {data,error} = await query;
 if (error) throw error;
 return data;
}

export async function loadMentorAdmissions(client, user, {search='', group='', page=0}={}) {
 if (!user?.id || user.is_anonymous) return null;
 const memberships = await rows(client.from('restart_retreat_members').select('cohort_id,restart_retreat_cohorts(title)')
  .eq('user_id',user.id).eq('role','mentor'));
 if (!memberships.length) return null;
 const cohorts=memberships.map(member=>member.cohort_id);
 const select=(fields,status)=>client.from('restart_retreat_admissions')
  .select(fields+',restart_retreat_cohorts(title)').in('cohort_id',cohorts).eq('status',status);
 const selectedGroup=cohorts.includes(group)?group:'';
 let approvedQuery=select('id,cohort_id,full_name,approved_at','approved');
 if (selectedGroup) approvedQuery=approvedQuery.eq('cohort_id',selectedGroup);
 const name=search.trim().slice(0,160);
 // PostgREST encodes the filter value as one query parameter. Escape PostgreSQL regex metacharacters.
 if (name) approvedQuery=approvedQuery.filter('full_name','imatch',name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 const start=page*approvedPageSize;
 const [pending,approved]=await Promise.all([
  rows(select('id,full_name,submitted_at','pending').order('submitted_at').order('id').limit(50)),
  rows(approvedQuery.order('approved_at',{ascending:false}).order('id').range(start,start+approvedPageSize))
 ]);
 return {pending,approved:approved.slice(0,approvedPageSize),hasNext:approved.length>approvedPageSize,memberships,selectedGroup};
}

async function countRows(query) {
 const {count,error}=await query;
 if (error || !Number.isSafeInteger(count) || count<0) throw error ?? new Error('Count unavailable');
 return count;
}

export async function readParticipantInteractions(client,user,admission) {
 if (!user?.id || user.is_anonymous || !uuid.test(admission?.id ?? '') || !uuid.test(admission?.cohort_id ?? '')) return null;
 const cohort=admission.cohort_id;
 const mentor=await rows(client.from('restart_retreat_members').select('cohort_id')
  .eq('cohort_id',cohort).eq('user_id',user.id).eq('role','mentor').maybeSingle());
 if (!mentor) return null;
 const approved=await rows(client.from('restart_retreat_admissions').select('applicant_id')
  .eq('id',admission.id).eq('cohort_id',cohort).eq('status','approved').maybeSingle());
 if (!uuid.test(approved?.applicant_id ?? '')) return null;
 const participant=approved.applicant_id;
 const count=table=>client.from(table).select('id',{count:'exact',head:true}).eq('cohort_id',cohort);
 const submissions=status=>count('restart_retreat_assignment_submissions').eq('participant_id',participant).eq('status',status);
 const messages=(sender,recipient)=>count('restart_retreat_messages').eq('sender_id',sender).eq('recipient_id',recipient);
 const [sharedResponses,submittedTasks,reviewedTasks,sent,received]=await Promise.all([
  countRows(count('restart_retreat_responses').eq('participant_id',participant).eq('share_with_mentor',true)),
  countRows(submissions('submitted')),countRows(submissions('reviewed')),
  countRows(messages(user.id,participant)),countRows(messages(participant,user.id))
 ]);
 return {sharedResponses,submittedTasks,reviewedTasks,directMessages:sent+received};
}

export async function decideRetreatAdmission(client,id,action) {
 if (!uuid.test(id) || !['approve','decline'].includes(action)) throw new Error('Invalid retreat decision');
 return rows(client.rpc('restart_'+action+'_retreat_admission',{p_request_id:id}));
}

export async function retreatMentorAdmissions({outlet,client,user,lang,esc,current}) {
 const t = key => copy[key][Math.max(0,languages.indexOf(lang))];
 const date = new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeZone:'Asia/Baku'});
 const refresh = '<button type="button" data-admission-action="refresh">'+t('refresh')+'</button>';
 let queue;
 let search = '';
 let group = '';
 let page = 0;
 const approvedList=()=>{
  const participants=queue.approved;
  return participants.length?'<ul class="history">'+participants.map(row=>'<li><div><strong>'+
   esc(row.full_name)+'</strong><small>'+esc(row.restart_retreat_cohorts?.title)+'</small>'+
   '<button type="button" data-admission-action="interactions" data-request="'+esc(row.id)+'">'+t('interactions')+'</button>'+
   '<div data-participant-interactions aria-live="polite"></div></div><small>'+
   t('approvedOn')+': '+esc(date.format(new Date(row.approved_at)))+'</small></li>').join('')+'</ul>':
   '<p>'+t(search || group ? 'noMatches':'noParticipants')+'</p>';
 };
 let busy = false;

 async function load(notice='') {
  if (!current()) return;
  outlet.textContent=t('loading');
  try {
   queue = await loadMentorAdmissions(client,user,{search,group,page});
   if (!current()) return;
   if (!queue) {
    outlet.innerHTML='<p role="status">'+t('denied')+'</p>';
    return;
   }
   group=queue.selectedGroup;
   const body = queue.pending.map(req=>'<article class="panel"><h2>'+esc(req.full_name)+'</h2><p>'+
    esc(req.restart_retreat_cohorts?.title)+' · '+esc(date.format(new Date(req.submitted_at)))+
    '</p><div class="actions">'+['approve','decline'].map(action=>
     '<button type="button" data-admission-action="'+action+'" data-request="'+esc(req.id)+'">'+t(action)+'</button>').join('')+
    '</div></article>').join('');
   outlet.innerHTML=(notice?'<p role="status" tabindex="-1">'+t(notice)+'</p>':'')+
    (body || '<p>'+t('empty')+'</p>')+refresh+
    '<section class="panel"><h2>'+t('participants')+'</h2>'+
    '<form data-approved-filters><div class="field-row"><label>'+t('group')+'<select name="group"><option value="">'+t('allGroups')+'</option>'+
    queue.memberships.map(row=>'<option value="'+esc(row.cohort_id)+'"'+(group===row.cohort_id?' selected':'')+'>'+
     esc(row.restart_retreat_cohorts?.title ?? row.cohort_id)+'</option>').join('')+'</select></label>'+
    '<label>'+t('nameSearch')+'<input type="search" name="search" maxlength="160" autocomplete="off" value="'+esc(search)+'"></label></div>'+
    '<button type="submit">'+t('search')+'</button></form>'+
    '<div data-approved-results aria-live="polite">'+approvedList()+'</div>'+
    '<div class="actions"><button type="button" data-admission-action="previous"'+(!page?' disabled':'')+'>'+t('previous')+'</button>'+
    '<p>'+t('page')+' '+(page+1)+'</p>'+
    '<button type="button" data-admission-action="next"'+(!queue.hasNext?' disabled':'')+'>'+t('next')+'</button></div></section>';
   if (notice) outlet.querySelector('[role=status]')?.focus();
  } catch {
   if (current()) outlet.innerHTML=(notice?'<p role="status">'+t(notice)+'</p>':'')+
    '<p role="alert">'+t('error')+'</p>'+refresh;
  }
 }

 outlet.onsubmit=async event=>{
  if (!event.target.matches('[data-approved-filters]')) return;
  event.preventDefault();
  event.stopPropagation();
  if (!current() || busy) return;
  const data=new FormData(event.target);
  search=String(data.get('search') ?? '').trim().slice(0,160);
  group=String(data.get('group') ?? '');
  page=0;
  busy=true;
  try {await load();} finally {busy=false;}
 };
 outlet.onclick=async event=>{
  const button = event.target.closest('[data-admission-action]');
  if (!button || !current() || busy) return;
  const {admissionAction:action,request:id} = button.dataset;
  if (action==='refresh' || action==='previous' || action==='next') {
   if ((action==='previous' && !page) || (action==='next' && !queue?.hasNext)) return;
   page=action==='previous'?page-1:action==='next'?page+1:0;
   busy=true;
   try { await load(); } finally { busy=false; }
   return;
  }
  if (action==='interactions') {
   const admission=queue?.approved.find(row=>row.id===id);
   const summary=button.closest('li')?.querySelector('[data-participant-interactions]');
   if (!admission || !summary) return;
   busy=true;
   button.disabled=true;
   summary.textContent=t('interactionLoading');
   try {
    const counts=await readParticipantInteractions(client,user,admission);
    if (!current()) return;
    if (counts) summary.innerHTML='<dl>'+Object.entries(counts).map(([key,count])=>
     '<dt>'+t(key)+'</dt><dd>'+count+'</dd>').join('')+'</dl>';
    else summary.textContent=t('interactionUnavailable');
   } catch {
    if (current()) summary.textContent=t('interactionUnavailable');
   } finally {
    busy=false;
    button.disabled=false;
   }
   return;
  }
  if (!queue?.pending.some(row=>row.id===id)) return;
  if (action==='decline' && !confirm(t('confirm'))) return;
  busy=true;
  const controls=Array.from(outlet.querySelectorAll('button:not(:disabled)'));
  for (const control of controls) control.disabled=true;
  try {
   await decideRetreatAdmission(client,id,action);
   await load(action==='approve'?'approved':'declined');
  } catch {
   if (current()) {
    outlet.querySelector('[role=alert]')?.remove();
    const message = document.createElement('p');
    message.setAttribute('role','alert');
    message.textContent=t('error');
    outlet.prepend(message);
   }
  } finally {
   busy=false;
   for (const control of controls) control.disabled=false;
  }
 };
 busy=true;
 try { await load(); } finally { busy=false; }
}
