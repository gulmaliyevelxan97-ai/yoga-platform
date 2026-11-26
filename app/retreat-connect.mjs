import {languages} from './state.mjs';
import {schoolTimeZone} from './booking-calendar.mjs';

const copy = {
 title:['Связь с группой','Qrupla əlaqə','Group messages'],
 loading:['Загружаем сообщения…','Mesajlar yüklənir…','Loading messages…'],
 noGroup:['Сообщения появятся после добавления в группу.','Qrupa əlavə olunduqdan sonra mesajlar görünəcək.','Messages will appear after you join a group.'],
 group:['Группа','Qrup','Group'],
 empty:['Сообщений пока нет.','Hələ mesaj yoxdur.','No messages yet.'],
 unread:['Непрочитанные','Oxunmamış mesajlar','Unread messages'],
 announcement:['Объявление','Elan','Announcement'],
 announce:['Новое объявление для группы','Qrup üçün yeni elan','New group announcement'],
 write:['Написать участнику','İştirakçıya yaz','Message a participant'],
 choose:['Выбрать участника','İştirakçı seç','Choose a participant'],
 contactNote:['Сообщение увидит только выбранный участник.','Mesajı yalnız seçdiyiniz iştirakçı görəcək.','Only the selected participant will receive this message.'],
 direct:['Личное сообщение','Şəxsi mesaj','Direct message'],
 mine:['От вас','Sizdən','From you'],
 reply:['Ответить лично','Şəxsi cavab yaz','Reply privately'],
 replyTo:['Личный ответ','Şəxsi cavab','Private reply'],
 replyNote:['Ответ получит отправитель выбранного сообщения.','Cavabı seçdiyiniz mesajın göndərəni alacaq.','The sender of the selected message will receive your reply.'],
 announceNote:['Объявление увидят участники и наставники этой группы.','Elanı bu qrupun iştirakçıları və mentorları görəcək.','Participants and mentors in this group will see the announcement.'],
 read:['Отметить прочитанным','Oxunmuş kimi işarələ','Mark as read'],
 text:['Текст сообщения','Mesajın mətni','Message text'],
 sent:['Сообщение отправлено.','Mesaj göndərildi.','Message sent.'],
 marked:['Сообщение отмечено прочитанным.','Mesaj oxunmuş kimi işarələndi.','Message marked as read.'],
 send:['Отправить','Göndər','Send'],
 cancel:['Отмена','Ləğv et','Cancel'],
 refresh:['Обновить','Yenilə','Refresh'],
 older:['Более ранние сообщения','Əvvəlki mesajlar','Older messages'],
 newer:['Более новые сообщения','Sonrakı mesajlar','Newer messages'],
 error:['Не удалось загрузить сообщения.','Mesajları yükləmək mümkün olmadı.','Messages could not be loaded.'],
 failed:['Не удалось подтвердить действие. Повторите попытку.','Əməliyyatı təsdiqləmək mümkün olmadı. Yenidən cəhd edin.','The action could not be confirmed. Try again.'],
 blank:['Введите текст сообщения.','Mesajın mətnini yazın.','Enter a message.']
};

export const retreatConnectTitle = copy.title;
const pageSize = 40;
const fields = 'id,cohort_id,sender_id,recipient_id,body,sent_at';

async function result(query) {
 const {data,error}=await query;
 if (error) throw error;
 return data;
}

export async function readRetreatConnectMemberships(client,user) {
 if (!user?.id || user.is_anonymous) return [];
 return result(client.from('restart_retreat_members')
  .select('cohort_id,role,restart_retreat_cohorts(title)').eq('user_id',user.id).order('cohort_id'));
}

export async function readRetreatConnectFeed(client,user,group,page=0) {
 const first=page*pageSize;
 const [feed,count]=await Promise.all([
  result(client.from('restart_retreat_messages').select(fields).eq('cohort_id',group)
   .order('sent_at',{ascending:false}).order('id',{ascending:false}).range(first,first+pageSize)),
  result(client.rpc('restart_retreat_unread_count',{p_cohort_id:group}))
 ]);
 const messages=feed.slice(0,pageSize);
 const receipts=messages.length ? await result(client.from('restart_retreat_message_reads')
  .select('message_id').eq('reader_id',user.id).in('message_id',messages.map(row=>row.id))) : [];
 return {messages,seen:new Set(receipts.map(row=>row.message_id)),unread:Number(count),hasOlder:feed.length>pageSize};
}

export async function readRetreatConnectContacts(client,group) {
 if (group?.role!=='mentor') return [];
 return result(client.from('restart_retreat_admissions').select('cohort_id,applicant_id,full_name')
  .eq('cohort_id',group.cohort_id).eq('status','approved').order('approved_at',{ascending:false}).order('id').limit(100));
}

export function retreatReplyTarget(message,group,user) {
 if (!message || message.cohort_id!==group?.cohort_id || message.sender_id===user.id) return null;
 if (message.recipient_id===user.id || (message.recipient_id===null && group.role==='participant')) return message.sender_id;
 return null;
}

export function retreatConnectSendArgs(group,message,user,body,clientId,contact=null) {
 if (!group || !user?.id || user.is_anonymous) throw new Error('Membership required');
 const recipient=message ? retreatReplyTarget(message,group,user) : contact?.applicant_id ?? null;
 if ((message && !recipient) || (!message && group.role!=='mentor') ||
  (contact && (contact.cohort_id!==group.cohort_id || !recipient || recipient===user.id))) throw new Error('Message unavailable');
 return {p_cohort_id:group.cohort_id,p_recipient_id:recipient,p_body:body,p_client_id:clientId};
}

export async function retreatConnectPage({outlet,client,user,lang,current,esc}) {
 const locale=Math.max(0,languages.indexOf(lang));
 const t=key=>copy[key][locale];
 const date=new Intl.DateTimeFormat(languages[locale],{dateStyle:'medium',timeStyle:'short',timeZone:schoolTimeZone});
 const button=(action,label,id='')=>'<button type="button" data-connect-action="'+action+'" data-message="'+esc(id)+'">'+t(label)+'</button>';
 const refresh=button('refresh','refresh');
 let groups=[];
 let group;
 let feed;
 let contacts=[];
 let page=0;
 let busy=false;
 let request;
 let compose;
 let opener;

 function notice(label,error=false) {
  if (!current()) return;
  const el=outlet.querySelector('[data-connect-notice]');
  if (!el) return;
  el.setAttribute('role',error?'alert':'status');
  el.textContent=t(label);
  el.focus({preventScroll:true});
 }

 function showDraft(message,control,choosing=false) {
  if (!group) return;
  compose=message??null;
  opener=control;
  request=null;
  const form=outlet.querySelector('[data-connect-send]');
  form.hidden=false;
  form.reset();
  form.querySelector('h2').textContent=t(choosing?'write':message?'replyTo':'announce');
  form.querySelector('p').textContent=t(choosing?'contactNote':message?'replyNote':'announceNote');
  const recipient=form.elements.recipient;
  recipient.disabled=!choosing;
  recipient.required=choosing;
  recipient.closest('label').hidden=!choosing;
  (choosing?recipient:form.elements.body).focus();
 }

 function render() {
  const cards=feed.messages.map(message=>{
   const own=message.sender_id===user.id;
   const heading=t(message.recipient_id===null?'announcement':'direct');
   const timestamp=esc(date.format(new Date(message.sent_at)));
   const mark=!own && !feed.seen.has(message.id) ? button('read','read',message.id) : '';
   const reply=retreatReplyTarget(message,group,user) ? button('reply','reply',message.id) : '';
   return '<article class="panel"><h2>'+heading+'</h2><p class="muted">'+
    (own?t('mine')+' · ':'')+'<time datetime="'+esc(message.sent_at)+'">'+timestamp+'</time></p><p>'+
    esc(message.body).replaceAll('\n','<br>')+'</p>'+
    (mark || reply ? '<div class="actions">'+mark+reply+'</div>' : '')+'</article>';
  }).join('');
  outlet.innerHTML='<label>'+t('group')+'<select data-connect-group>'+groups.map(item=>
   '<option value="'+esc(item.cohort_id)+'"'+(item===group?' selected':'')+'>'+
   esc(item.restart_retreat_cohorts?.title ?? t('group'))+'</option>').join('')+'</select></label>'+
   '<p>'+t('unread')+' · '+esc(feed.unread)+'</p><p data-connect-notice role="status" tabindex="-1"></p>'+
   '<div class="actions">'+refresh+(group.role==='mentor'?button('announce','announce'):'')+
   (contacts.length?button('write','write'):'')+'</div>'+
   '<form class="panel" data-connect-send hidden><h2></h2><p class="muted"></p>'+
   '<label hidden>'+t('choose')+'<select name="recipient" disabled><option value="">'+t('choose')+'</option>'+
   contacts.map(contact=>'<option value="'+esc(contact.applicant_id)+'">'+esc(contact.full_name)+'</option>').join('')+
   '</select></label><label>'+t('text')+
   '<textarea name="body" maxlength="4000" required></textarea></label><div class="actions">'+
   '<button class="cta" type="submit">'+t('send')+'</button>'+button('cancel','cancel')+'</div></form>'+
   (cards || '<p>'+t('empty')+'</p>')+
   (page || feed.hasOlder ? '<div class="actions">'+(page?button('newer','newer'):'')+
    (feed.hasOlder?button('older','older'):'')+'</div>' : '');
 }

 async function load(label) {
  if (!current()) return;
  outlet.textContent=t('loading');
  try {
   groups=await readRetreatConnectMemberships(client,user);
   if (!current()) return;
   const previous=group?.cohort_id;
   group=groups.find(item=>item.cohort_id===previous) ?? groups[0];
   if (!group) {
    outlet.innerHTML='<p role="status">'+t('noGroup')+'</p>'+refresh;
    return;
   }
   if (group.cohort_id!==previous) page=0;
   [feed,contacts]=await Promise.all([
    readRetreatConnectFeed(client,user,group.cohort_id,page),
    readRetreatConnectContacts(client,group)
   ]);
   if (!current()) return;
   render();
   if (label) notice(label);
  } catch {
   if (current()) outlet.innerHTML=(label?'<p role="status">'+t(label)+'</p>':'')+
    '<p role="alert">'+t('error')+'</p>'+refresh;
  }
 }

 function disable(locked) {
  for (const control of outlet.querySelectorAll('button,select,textarea')) {
   control.disabled=locked || (control.name==='recipient' && control.closest('label').hidden);
  }
 }

 async function act(task) {
  if (busy || !current()) return;
  busy=true;
  disable(true);
  try { await task(); }
  catch { notice('failed',true); }
  finally {
   busy=false;
   if (current()) disable(false);
  }
 }

 outlet.onchange=event=>{
  if (!event.target.matches('[data-connect-group]') || busy || !current()) return;
  const selected=groups.find(item=>item.cohort_id===event.target.value);
  if (!selected || selected===group) return;
  group=selected;
  page=0;
  void act(load);
 };
 outlet.onclick=event=>{
  const control=event.target.closest('[data-connect-action]');
  if (!control || busy || !current()) return;
  const message=feed?.messages.find(row=>row.id===control.dataset.message);
  switch(control.dataset.connectAction) {
   case 'refresh': page=0; void act(load); break;
   case 'older': if (feed?.hasOlder) { page++; void act(load); } break;
   case 'newer': if (page) { page--; void act(load); } break;
   case 'write': if (contacts.length) showDraft(null,control,true); break;
   case 'announce': if (group?.role==='mentor') showDraft(null,control); break;
   case 'reply': if (retreatReplyTarget(message,group,user)) showDraft(message,control); break;
   case 'cancel': outlet.querySelector('[data-connect-send]').hidden=true; opener?.focus(); break;
   case 'read':
    if (!message || message.sender_id===user.id || feed.seen.has(message.id)) return;
    void act(async()=>{
     await result(client.rpc('restart_mark_retreat_message_read',{p_message_id:message.id}));
     await load('marked');
    });
    break;
  }
 };
 outlet.onsubmit=event=>{
  if (!event.target.matches('[data-connect-send]')) return;
  event.preventDefault();
  event.stopPropagation();
  if (busy || !current()) return;
  const {body:input,recipient}=event.target.elements;
  const body=input.value.trim();
  if (!body) { notice('blank',true); return; }
  const contact=recipient.disabled ? null : contacts.find(item=>item.applicant_id===recipient.value);
  if (!recipient.disabled && !contact) return;
  void act(async()=>{
   const target=retreatConnectSendArgs(group,compose,user,body,request?.p_client_id,contact);
   if (request?.p_body!==body || request?.p_recipient_id!==target.p_recipient_id) {
    request={...target,p_client_id:crypto.randomUUID()};
   }
   await result(client.rpc('restart_send_retreat_message',request));
   request=null;
   page=0;
   await load('sent');
  });
 };

 await act(load);
}
