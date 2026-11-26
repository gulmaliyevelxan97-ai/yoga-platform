import {languages} from './state.mjs';
import {classTimeInput,classTimeInstant} from './booking-calendar.mjs';

const copy={
 title:['Задания и ответы','Tapşırıqlar və cavablar','Assignments and responses'],
 loading:['Загружаем задания…','Tapşırıqlar yüklənir…','Loading assignments…'],
 create:['Новое задание','Yeni tapşırıq','New assignment'],
 name:['Название','Ad','Title'],
 instructions:['Инструкция','Təlimat','Instructions'],
 due:['Срок (Баку)','Son tarix (Bakı)','Due (Baku time)'],
 group:['Вся группа','Bütün qrup','Whole group'],
 recipient:['Получатель','Alan şəxs','Recipient'],
 save:['Сохранить','Yadda saxla','Save'],
 feedback:['Обратная связь','Rəy','Feedback'],
 review:['Отправить отзыв','Rəy göndər','Send feedback'],
 participant:['Участник','İştirakçı','Participant'],
 empty:['Ответов пока нет.','Hələ cavab yoxdur.','No responses yet.'],
 sent:['Изменения сохранены.','Dəyişikliklər yadda saxlanıldı.','Changes saved.'],
 invalid:['Проверьте заполненные поля.','Doldurulmuş sahələri yoxlayın.','Check the form fields.'],
 stale:['Данные изменились. Обновите список перед повтором.','Məlumat dəyişib. Yenidən cəhddən əvvəl siyahını yeniləyin.','The data changed. Refresh before retrying.'],
 error:['Не удалось подтвердить действие. Проверьте данные после обновления.','Əməliyyat təsdiqlənmədi. Yenilədikdən sonra məlumatı yoxlayın.','The action could not be confirmed. Check the data after refreshing.'],
 refresh:['Обновить задания','Tapşırıqları yenilə','Refresh assignments']
};

async function result(query) {
 const {data,error}=await query;
 if (error) throw error;
 return data;
}

export async function readRetreatMentorTasks(client,user) {
 if (!user?.id || user.is_anonymous) return null;
 const groups=await result(client.from('restart_retreat_members').select('cohort_id,restart_retreat_cohorts(title)')
  .eq('user_id',user.id).eq('role','mentor'));
 if (!groups.length) return null;
 const cohorts=groups.map(row=>row.cohort_id);
 const [tasks,submissions,people]=await Promise.all([
  result(client.from('restart_retreat_assignments').select('id,cohort_id,participant_id,title,instructions,due_at,revision')
   .in('cohort_id',cohorts).order('due_at',{nullsFirst:false}).order('id')),
  result(client.from('restart_retreat_assignment_submissions').select('id,cohort_id,assignment_id,participant_id,response,feedback,revision')
   .in('cohort_id',cohorts).order('submitted_at').order('id')),
  result(client.from('restart_retreat_admissions').select('cohort_id,applicant_id,full_name')
   .in('cohort_id',cohorts).eq('status','approved').order('full_name').order('id'))
 ]);
 return {groups,tasks,submissions,people};
}

const localDue=instant=>instant?classTimeInput(instant):'';
const length=value=>Array.from(value).length;

export function assignmentSaveArgs(cohort,data,assigned,task) {
 const title=data.title?.trim() ?? '';
 const instructions=data.instructions ?? '';
 const participant=task ? task.participant_id : (data.recipient || null);
 if (!title || length(title)>160 || length(instructions)>4000 ||
     (!task && participant && !assigned.includes(participant))) return null;
 let due;
 try {
  due=!data.due?null:data.due===localDue(task?.due_at)?task.due_at:classTimeInstant(data.due);
 } catch {return null;}
 return {p_cohort_id:cohort,p_item_id:task?.id ?? null,p_expected_revision:task?.revision ?? null,
  p_participant_id:participant,p_title:title,p_instructions:instructions,p_due_at:due};
}

export function assignmentReviewArgs(submission,feedback) {
 const text=feedback?.trim() ?? '';
 if (!submission || !text || length(text)>4000) return null;
 return {p_cohort_id:submission.cohort_id,p_submission_id:submission.id,
  p_expected_revision:submission.revision,p_feedback:text};
}

export async function retreatMentorTasks({outlet,client,user,lang,esc,current}) {
 const t=key=>copy[key][Math.max(0,languages.indexOf(lang))];
 const refresh='<button type="button" data-mentor-tasks-refresh>'+t('refresh')+'</button>';
 const feedbackStatus='<p role="status" data-mentor-task-status></p>';
 let snapshot;
 let busy=false;

 function peopleIn(cohort) {return snapshot.people.filter(row=>row.cohort_id===cohort);}

 function taskForm(cohort,task) {
  const people=peopleIn(cohort);
  const name=id=>people.find(row=>row.applicant_id===id)?.full_name ?? t('participant');
  const recipient=task?
   '<p>'+t('recipient')+' · '+esc(task.participant_id?name(task.participant_id):t('group'))+'</p>':
   '<label>'+t('recipient')+'<select name="recipient"><option value="">'+t('group')+'</option>'+
   people.map(row=>'<option value="'+esc(row.applicant_id)+'">'+esc(row.full_name)+'</option>').join('')+'</select></label>';
  return '<form class="panel" data-mentor-task="'+esc(task?.id)+'" data-cohort="'+esc(cohort)+'">'+
   recipient+'<label>'+t('name')+'<input name="title" maxlength="160" required value="'+esc(task?.title)+'"></label>'+
   '<label>'+t('instructions')+'<textarea name="instructions" maxlength="4000">'+esc(task?.instructions)+'</textarea></label>'+
   '<label>'+t('due')+'<input name="due" type="datetime-local" value="'+esc(localDue(task?.due_at))+'"></label>'+
   '<button type="submit">'+t('save')+'</button>'+feedbackStatus+'</form>';
 }

 function taskArticle(task) {
  const people=peopleIn(task.cohort_id);
  const reviews=snapshot.submissions.filter(row=>row.assignment_id===task.id && row.cohort_id===task.cohort_id).map(row=>
   '<form class="panel" data-mentor-review="'+esc(row.id)+'" data-cohort="'+esc(row.cohort_id)+'"><p><strong>'+
   esc(people.find(person=>person.applicant_id===row.participant_id)?.full_name ?? t('participant'))+
   '</strong></p>'+(row.response?'<p>'+esc(row.response)+'</p>':'')+
   '<label>'+t('feedback')+'<textarea name="feedback" maxlength="4000" required>'+esc(row.feedback)+'</textarea></label>'+
   '<button type="submit">'+t('review')+'</button>'+feedbackStatus+'</form>').join('');
  return '<details class="panel"><summary>'+esc(task.title)+'</summary>'+taskForm(task.cohort_id,task)+
   (reviews || '<p>'+t('empty')+'</p>')+'</details>';
 }

 async function load(notice='',expanded) {
  if (!current()) return;
  outlet.textContent=t('loading');
  try {
   snapshot=await readRetreatMentorTasks(client,user);
   if (!current()) return;
   if (!snapshot) {outlet.textContent='';return;}
   outlet.innerHTML='<h2>'+t('title')+'</h2>'+
    (notice?'<p role="status" tabindex="-1">'+t(notice)+'</p>':'')+
    snapshot.groups.map(row=>'<details class="panel"'+
     (row.cohort_id===expanded || snapshot.groups.length===1?' open':'')+'><summary>'+
     esc(row.restart_retreat_cohorts?.title)+'</summary>'+
     snapshot.tasks.filter(task=>task.cohort_id===row.cohort_id).map(taskArticle).join('')+
     '<details class="panel"><summary>'+t('create')+'</summary>'+taskForm(row.cohort_id)+'</details></details>'
    ).join('')+refresh;
   if (notice) outlet.querySelector('[tabindex="-1"]')?.focus();
  } catch {
   if (current()) outlet.innerHTML=(notice?'<p role="status">'+t(notice)+'</p>':'')+
    '<p role="alert">'+t('error')+'</p>'+refresh;
  }
 }

 outlet.onclick=async event=>{
  if (!event.target.closest('[data-mentor-tasks-refresh]') || busy || !current()) return;
  busy=true;
  try {await load();} finally {busy=false;}
 };
 outlet.onsubmit=async event=>{
  const form=event.target;
  if (!form.matches('[data-mentor-task],[data-mentor-review]')) return;
  event.preventDefault();
  event.stopPropagation();
  if (busy || !current()) return;
  const {cohort,mentorTask,mentorReview}=form.dataset;
  if (!snapshot?.groups.some(row=>row.cohort_id===cohort)) return;
  const data=Object.fromEntries(new FormData(form));
  const reviewing=Boolean(mentorReview);
  const record=(reviewing?snapshot.submissions:snapshot.tasks).find(row=>
   row.cohort_id===cohort && row.id===(mentorReview || mentorTask));
  if ((mentorReview || mentorTask) && !record) return;
  const args=reviewing ? assignmentReviewArgs(record,data.feedback) :
   assignmentSaveArgs(cohort,data,peopleIn(cohort).map(row=>row.applicant_id),record);
  const message=form.querySelector('[data-mentor-task-status]');
  if (!args) {message.textContent=t('invalid');return;}
  busy=true;
  const button=form.querySelector('button');
  button.disabled=true;
  try {
   await result(client.rpc(reviewing?'restart_review_retreat_assignment':'restart_save_retreat_assignment',args));
   await load('sent',cohort);
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
