import {languages} from './state.mjs';

const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const copy={
 title:['Подать заявку на ретрит','Retritə müraciət et','Apply for a retreat'],
 invitation:['Код приглашения','Dəvət kodu','Invitation code'],
 name:['Имя и фамилия','Ad və soyad','Full name'],
 consent:['Я согласен передать введённое имя наставникам этой группы для рассмотрения заявки.','Müraciətə baxılması üçün yazdığım adın bu qrupun mentorlarına göndərilməsinə razıyam.','I agree to share the name I entered with this group’s mentors so they can review my application.'],
 send:['Отправить заявку','Müraciəti göndər','Send application'],
 loading:['Загружаем заявки…','Müraciətlər yüklənir…','Loading applications…'],
 history:['Мои заявки','Müraciətlərim','My applications'],
 empty:['У вас пока нет заявок.','Hələ müraciətiniz yoxdur.','You have no applications yet.'],
 pending:['На рассмотрении','Baxılır','Pending'],
 approved:['Одобрена','Təsdiqlənib','Approved'],
 declined:['Отклонена','Rədd edilib','Declined'],
 group:['Группа','Qrup','Group'],
 saved:['Заявка найдена или принята. Посмотрите её статус ниже.','Müraciət tapıldı və ya qəbul edildi. Statusuna aşağıda baxın.','Your application was found or received. See its status below.'],
 invalid:['Проверьте код приглашения, имя и согласие.','Dəvət kodunu, adı və razılığınızı yoxlayın.','Check the invitation code, name and consent.'],
 unavailable:['Не удалось подать заявку. Проверьте приглашение и статус ранее отправленных заявок.','Müraciəti göndərmək mümkün olmadı. Dəvəti və əvvəlki müraciətlərin statusunu yoxlayın.','The application could not be submitted. Check your invitation and any existing application status.'],
 loadError:['Не удалось загрузить заявки.','Müraciətləri yükləmək mümkün olmadı.','Applications could not be loaded.'],
 reload:['Обновить статус','Statusu yenilə','Refresh status']
};

export const retreatAdmissionRequestTitle=copy.title;

async function result(query) {
 const {data,error}=await query;
 if (error) throw error;
 return data;
}

export async function readOwnRetreatAdmissions(client,user) {
 if (!user?.id || user.is_anonymous) return [];
 return result(client.from('restart_retreat_admissions')
  .select('cohort_id,status,submitted_at,approved_at,declined_at,restart_retreat_cohorts(title)')
  .eq('applicant_id',user.id).order('submitted_at',{ascending:false}).order('id'));
}

export function admissionRequestArgs(values) {
 const code=String(values.invitation ?? '').trim();
 const name=String(values.name ?? '').trim();
 if (!uuid.test(code) || !name || Array.from(name).length>160 ||
     /[\u0000-\u001f\u007f-\u009f]/u.test(name) || values.consent!=='yes') return null;
 return {p_cohort_id:code,p_full_name:name};
}

export async function retreatAdmissionRequestPage({outlet,client,user,lang,esc,current}) {
 if (!current() || !user?.id || user.is_anonymous) return;
 const t=key=>copy[key][Math.max(0,languages.indexOf(lang))];
 const date=new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeZone:'Asia/Baku'});
 let busy=false;
 outlet.innerHTML='<form class="panel" data-retreat-request>'+
  '<label>'+t('invitation')+'<input name="invitation" required maxlength="36" autocapitalize="none" autocomplete="off" spellcheck="false"></label>'+
  '<label>'+t('name')+'<input name="name" required maxlength="160" autocomplete="name"></label>'+
  '<label class="check"><input type="checkbox" name="consent" value="yes" required>'+t('consent')+'</label>'+
  '<button class="cta" type="submit">'+t('send')+'</button><p role="status" data-request-result></p></form>'+
  '<section class="panel"><h2>'+t('history')+'</h2><div data-request-history aria-live="polite"></div>'+
  '<button type="button" data-request-reload>'+t('reload')+'</button></section>';
 const history=outlet.querySelector('[data-request-history]');
 const message=outlet.querySelector('[data-request-result]');

 async function load() {
  history.textContent=t('loading');
  try {
   const requests=await readOwnRetreatAdmissions(client,user);
   if (!current()) return;
   history.innerHTML=requests.length?'<ul class="history">'+requests.map(item=>{
    const status=['pending','approved','declined'].includes(item.status)?item.status:'pending';
    const time=item.approved_at || item.declined_at || item.submitted_at;
    return '<li><div><strong>'+esc(item.restart_retreat_cohorts?.title || (t('group')+' '+item.cohort_id))+
     '</strong><small>'+t(status)+'</small></div><time datetime="'+esc(time)+'">'+esc(date.format(new Date(time)))+'</time></li>';
   }).join('')+'</ul>':'<p>'+t('empty')+'</p>';
  } catch {
   if (current()) history.textContent=t('loadError');
  }
 }

 async function run(action) {
  if (busy || !current()) return;
  busy=true;
  const buttons=Array.from(outlet.querySelectorAll('button'));
  for (const button of buttons) button.disabled=true;
  try {await action();} finally {
   busy=false;
   for (const button of buttons) button.disabled=false;
  }
 }

 outlet.onclick=event=>{
  if (event.target.closest('[data-request-reload]')) void run(load);
 };
 outlet.onsubmit=event=>{
  const form=event.target;
  if (!form.matches('[data-retreat-request]')) return;
  event.preventDefault();
  event.stopPropagation();
  void run(async()=>{
   const args=admissionRequestArgs(Object.fromEntries(new FormData(form)));
   if (!args) {message.textContent=t('invalid');return;}
   try {
    await result(client.rpc('restart_submit_retreat_admission',args));
    if (!current()) return;
    form.reset();
    message.textContent=t('saved');
    await load();
   } catch {
    if (current()) message.textContent=t('unavailable');
   }
  });
 };
 await run(load);
}
