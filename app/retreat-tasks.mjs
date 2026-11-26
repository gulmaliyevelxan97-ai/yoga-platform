import {languages} from './state.mjs';
import {schoolTimeZone} from './booking-calendar.mjs';

const copy = {
 title:['Задания ретрита','Retrit tapşırıqları','Retreat tasks'],
 loading:['Загружаем задания…','Tapşırıqlar yüklənir…','Loading tasks…'],
 empty:['Пока нет назначенных заданий.','Hələ tapşırıq təyin edilməyib.','You have no assigned tasks yet.'],
 deadline:['Срок (Баку)','Son tarix (Bakı)','Due (Baku time)'],
 response:['Комментарий (необязательно)','Şərh (istəyə görə)','Comment (optional)'],
 agree:['Я согласен передать этот ответ наставникам группы.','Bu cavabı qrupun mentorlarına göndərməyə razıyam.','I agree to share this response with the group’s mentors.'],
 send:['Передать наставникам','Mentorlara göndər','Send to mentors'],
 shareError:['Подтвердите передачу ответа и проверьте его длину.','Cavabın göndərilməsini təsdiqləyin və uzunluğunu yoxlayın.','Confirm sharing and check the response length.'],
 sent:['Ответ передан наставникам.','Cavab mentorlara göndərildi.','Your response was sent to the mentors.'],
 submitted:['На проверке','Yoxlanılır','Awaiting review'],
 reviewed:['Проверено','Yoxlanılıb','Reviewed'],
 feedback:['Обратная связь','Rəy','Feedback'],
 unavailable:['Не удалось подтвердить отправку. Обновите список и проверьте статус.','Göndəriş təsdiqlənmədi. Siyahını yeniləyin və statusu yoxlayın.','Submission could not be confirmed. Refresh the list and check the status.'],
 loadError:['Не удалось загрузить задания.','Tapşırıqları yükləmək mümkün olmadı.','Tasks could not be loaded.'],
 reload:['Обновить','Yenilə','Refresh']
};

export const retreatTasksTitle = copy.title;

async function result(query) {
 const {data,error}=await query;
 if (error) throw error;
 return data;
}

export async function readParticipantTasks(client,user) {
 if (!user?.id || user.is_anonymous) return {tasks:[],submissions:[]};
 const memberships=await result(client.from('restart_retreat_members').select('cohort_id')
  .eq('user_id',user.id).eq('role','participant'));
 if (!memberships.length) return {tasks:[],submissions:[]};
 const cohorts=memberships.map(m=>m.cohort_id);
 const [tasks,submissions]=await Promise.all([
  result(client.from('restart_retreat_assignments')
   .select('id,cohort_id,title,instructions,due_at,restart_retreat_cohorts(title)')
   .in('cohort_id',cohorts).or('participant_id.is.null,participant_id.eq.'+user.id)
   .order('due_at',{nullsFirst:false}).order('id')),
  result(client.from('restart_retreat_assignment_submissions')
   .select('assignment_id,response,status,feedback').in('cohort_id',cohorts).eq('participant_id',user.id))
 ]);
 return {tasks,submissions};
}

export function taskSubmissionArgs(task, response, consent) {
 if (!task?.id || !task.cohort_id || typeof response!=='string' || Array.from(response).length>4000 ||
     consent!=='yes') return null;
 return {p_cohort_id:task.cohort_id,p_assignment_id:task.id,p_response:response,p_share_with_mentor:true};
}

export async function retreatTasksPage({outlet,client,user,lang,esc,current}) {
 if (!current() || !user?.id || user.is_anonymous) return;
 const t=key=>copy[key][Math.max(0,languages.indexOf(lang))];
 const format=new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short',timeZone:schoolTimeZone});
 const refresh='<button type="button" data-task-refresh>'+t('reload')+'</button>';
 let tasks=[];
 let busy=false;

 async function load(notice='') {
  if (!current()) return;
  outlet.textContent=t('loading');
  try {
   const snapshot=await readParticipantTasks(client,user);
   if (!current()) return;
   tasks=snapshot.tasks;
   const responses=new Map(snapshot.submissions.map(item=>[item.assignment_id,item]));
   const cards=tasks.map(task=>{
    const entry=responses.get(task.id);
    const response=entry ?
     '<p><strong>'+t(entry.status==='reviewed'?'reviewed':'submitted')+'</strong></p>'+
     '<p>'+esc(entry.response)+'</p>'+
     (entry.feedback?'<h3>'+t('feedback')+'</h3><p>'+esc(entry.feedback)+'</p>':'') :
     '<form data-retreat-task="'+esc(task.id)+'"><label>'+t('response')+
     '<textarea name="response" rows="4" maxlength="4000"></textarea></label>'+
     '<label class="check"><input type="checkbox" name="consent" value="yes" required>'+t('agree')+'</label>'+
     '<button type="submit" class="cta">'+t('send')+'</button><p data-task-result role="status"></p></form>';
    return '<article class="panel"><h2>'+esc(task.title)+'</h2><p class="muted">'+
     esc(task.restart_retreat_cohorts?.title)+'</p>'+
     (task.due_at?'<p>'+t('deadline')+' · <time datetime="'+esc(task.due_at)+'">'+
      esc(format.format(new Date(task.due_at)))+'</time></p>':'')+
     (task.instructions?'<p>'+esc(task.instructions)+'</p>':'')+response+'</article>';
   }).join('');
   outlet.innerHTML=(notice?'<p role="status" tabindex="-1">'+t(notice)+'</p>':'')+
    (cards || '<p>'+t('empty')+'</p>')+refresh;
   if (notice) outlet.querySelector('[tabindex="-1"]')?.focus();
  } catch {
   if (current()) outlet.innerHTML=(notice?'<p role="status">'+t(notice)+'</p>':'')+
    '<p role="alert">'+t('loadError')+'</p>'+refresh;
  }
 }

 async function run(action) {
  if (busy || !current()) return;
  busy=true;
  const buttons=Array.from(outlet.querySelectorAll('button'));
  buttons.forEach(button=>{button.disabled=true;});
  try {await action();} finally {
   busy=false;
   buttons.forEach(button=>{button.disabled=false;});
  }
 }
 outlet.onclick=event=>{
  if (event.target.closest('[data-task-refresh]')) void run(()=>load());
 };
 outlet.onsubmit=event=>{
  const form=event.target;
  if (!form.matches('[data-retreat-task]')) return;
  event.preventDefault();
  event.stopPropagation();
  void run(async()=>{
   const fields=new FormData(form);
   const args=taskSubmissionArgs(tasks.find(task=>task.id===form.dataset.retreatTask),
    fields.get('response'),fields.get('consent'));
   const status=form.querySelector('[data-task-result]');
   if (!args) {status.textContent=t('shareError');return;}
   try {
    await result(client.rpc('restart_submit_retreat_assignment',args));
    await load('sent');
   } catch {
    if (current()) status.textContent=t('unavailable');
   }
  });
 };
 await run(()=>load());
}
