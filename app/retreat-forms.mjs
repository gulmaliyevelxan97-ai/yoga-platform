import {languages} from './state.mjs';

const maxQuestions = 12;
const maxQuestionLength = 240;
const maxAnswerLength = 400;
const labels = {
 title:['Анкеты ретрита','Retrit anketləri','Retreat forms'],
 loading:['Загружаем анкеты…','Anketlər yüklənir…','Loading forms…'],
 noForms:['Анкет пока нет.','Hələ anket yoxdur.','No forms yet.'],
 newForm:['Новая анкета','Yeni anket','New form'],
 name:['Название анкеты','Anketin adı','Form title'],
 questions:['Вопросы, по одному в строке','Suallar, hər sətirdə bir sual','Questions, one per line'],
 draft:['Черновик','Qaralama','Draft'],
 published:['Опубликована','Dərc olunub','Published'],
 save:['Сохранить черновик','Qaralamanı saxla','Save draft'],
 publish:['Опубликовать','Dərc et','Publish'],
 publishPrompt:['Опубликовать анкету для участников группы? После публикации вопросы фиксируются.','Anket qrup iştirakçılarına göstərilsin? Dərc edildikdən sonra suallar dəyişdirilə bilməz.','Publish the form for this cohort? Questions will be fixed after publication.'],
 submit:['Сохранить ответ только для себя','Cavabı yalnız özün üçün saxla','Save answer for yourself'],
 private:['Ответ доступен только вам.','Cavabı yalnız siz görə bilərsiniz.','Only you can see this answer.'],
 shared:['Ответ доступен наставникам группы.','Cavab qrupun mentorlarına görünür.','Your cohort mentors can see this answer.'],
 share:['Передать наставникам','Mentorlarla paylaş','Share with mentors'],
 sharePrompt:['Разрешить наставникам вашей группы читать этот ответ?','Qrupunuzun mentorlarına bu cavabı oxumağa icazə verilsin?','Allow mentors in your cohort to read this answer?'],
 unshare:['Отозвать доступ','Girişi ləğv et','Revoke access'],
 sharedAnswers:['Переданные ответы','Paylaşılmış cavablar','Shared answers'],
 refresh:['Обновить анкеты','Anketləri yenilə','Refresh forms'],
 saved:['Сохранено.','Yadda saxlanıldı.','Saved.'],
 refreshError:['Не удалось обновить список анкет.','Anketlərin siyahısı yenilənmədi.','Could not refresh the list of forms.'],
 invalid:['Укажите название и до 12 вопросов, каждый длиной до 240 символов.','Ad və hər biri 240 simvoladək olan ən çox 12 sual daxil edin.','Enter a title and up to 12 questions of at most 240 characters each.'],
 optionalAnswers:['Можно пропустить любой вопрос.','İstənilən sualı ötürə bilərsiniz.','You may skip any question.'],
 answerInvalid:['Заполните хотя бы один ответ, до 400 символов каждый.','Ən azı bir suala cavab verin. Hər cavab ən çox 400 simvol ola bilər.','Enter at least one answer, up to 400 characters each.'],
 unknownQuestions:['Эта версия анкеты требует обновления.','Anketin bu versiyası yenilənməlidir.','This form version requires an update.'],
 error:['Не удалось подтвердить действие. Обновите анкеты и проверьте результат.','Əməliyyat təsdiqlənmədi. Anketləri yeniləyib nəticəni yoxlayın.','The action could not be confirmed. Refresh forms and check the result.']
};

async function result(query) {
 const {data,error}=await query;
 if (error) throw error;
 return data;
}

const questionKey = index => 'q'+(index+1);
const lengthWithin = (value,limit) => typeof value==='string' && value.length>0 && value.length<=limit;

export function parseRetreatQuestions(value) {
 if (!Array.isArray(value) || !value.length || value.length>maxQuestions ||
     value.some(item=>typeof item?.text!=='string' || Object.keys(item).some(key=>key!=='text') ||
      !lengthWithin(item.text.trim(),maxQuestionLength) || /[\r\n]/.test(item.text.trim()))) return null;
 return value.map(item=>item.text.trim());
}

export function retreatFormDraft(values,publish=false) {
 const title=typeof values.title==='string'?values.title.trim():'';
 const rows=typeof values.questions==='string'?values.questions.split(/\r?\n/).map(text=>text.trim()).filter(Boolean):[];
 if (!lengthWithin(title,160) || rows.length>maxQuestions || (publish && !rows.length) ||
     rows.some(text=>!lengthWithin(text,maxQuestionLength))) throw new Error('invalid');
 return {title,questions:rows.map(text=>({text}))};
}

export function retreatFormAnswers(questions,values) {
 const answers={};
 questions.forEach((_,index)=>{
  const key=questionKey(index);
  const answer=typeof values[key]==='string'?values[key].trim():'';
  if (answer.length>maxAnswerLength) throw new Error('answerInvalid');
  if (answer) answers[key]=answer;
 });
 if (!Object.keys(answers).length) throw new Error('answerInvalid');
 return answers;
}

export async function readRetreatForms(client,user) {
 if (!user?.id || user.is_anonymous) return null;
 const memberships=await result(client.from('restart_retreat_members').select('cohort_id,role,restart_retreat_cohorts(title)')
  .eq('user_id',user.id).in('role',['mentor','participant']));
 if (!memberships.length) return null;
 const mentors=memberships.filter(row=>row.role==='mentor').map(row=>row.cohort_id);
 const participants=memberships.filter(row=>row.role==='participant').map(row=>row.cohort_id);
 const responses=cohorts=>client.from('restart_retreat_responses').select('id,cohort_id,form_id,answers,share_with_mentor')
  .in('cohort_id',cohorts).order('recorded_at',{ascending:false});
 const [forms,own,shared]=await Promise.all([
  result(client.from('restart_retreat_forms').select('id,cohort_id,title,questions,published')
   .in('cohort_id',memberships.map(row=>row.cohort_id)).order('title')),
  participants.length?result(responses(participants).eq('participant_id',user.id)):[],
  mentors.length?result(responses(mentors).eq('share_with_mentor',true)):[]
 ]);
 return {memberships,forms,own,shared};
}

export async function retreatFormsPage({outlet,client,user,lang,esc,current,confirmAction=message=>globalThis.confirm(message)}) {
 const t=key=>labels[key][Math.max(0,languages.indexOf(lang))];
 const refresh='<button type="button" data-retreat-form-refresh>'+t('refresh')+'</button>';
 let snapshot;
 let busy=false;

 function editor(cohort,form) {
  const formTitle=form?.title??'';
  const prompts=form?.questions??[];
  const supported=Array.isArray(prompts) && (!prompts.length || parseRetreatQuestions(prompts));
  if (!supported) return '<p role="status">'+t('unknownQuestions')+'</p>';
  return '<form class="panel" data-retreat-action="editor" data-cohort="'+esc(cohort)+'" data-form="'+esc(form?.id??'')+'">'+
   '<h4>'+esc(formTitle||t('newForm'))+'</h4><p>'+t('draft')+'</p>'+
   '<label>'+t('name')+'<input name="title" required maxlength="160" value="'+esc(formTitle)+'"></label>'+
   '<label>'+t('questions')+'<textarea name="questions" maxlength="2900">\n'+esc(prompts.map(row=>row.text).join('\n'))+'</textarea></label>'+
   '<div class="actions"><button type="submit" value="save">'+t('save')+'</button>'+
   (form?'<button type="submit" value="publish">'+t('publish')+'</button>':'')+
   '</div><p role="status" data-retreat-form-message></p></form>';
 }

 function answers(questions,response) {
  return '<dl>'+questions.map((text,index)=>{
   const answer=response.answers?.[questionKey(index)];
   return typeof answer==='string' && answer ? '<dt>'+esc(text)+'</dt><dd>'+esc(answer)+'</dd>' : '';
  }).join('')+'</dl>';
 }

 function participantForm(form,questions) {
  const own=snapshot.own.find(row=>row.form_id===form.id && row.cohort_id===form.cohort_id);
  const attributes=' data-cohort="'+esc(form.cohort_id)+'" data-form="'+esc(form.id)+'"';
  if (!own) return '<form data-retreat-action="response"'+attributes+'><p>'+t('optionalAnswers')+'</p>'+
   questions.map((text,index)=>'<label>'+esc(text)+'<textarea name="'+questionKey(index)+'" maxlength="'+maxAnswerLength+'"></textarea></label>').join('')+
   '<button type="submit">'+t('submit')+'</button><p role="status" data-retreat-form-message></p></form>';
  return answers(questions,own)+'<p>'+t(own.share_with_mentor?'shared':'private')+'</p><form data-retreat-action="consent"'+attributes+'>'+
   '<button type="submit">'+t(own.share_with_mentor?'unshare':'share')+'</button><p role="status" data-retreat-form-message></p></form>';
 }

 function renderForm(form,mentor) {
  if (!form.published) return mentor?editor(form.cohort_id,form):'';
  const questions=parseRetreatQuestions(form.questions);
  const body=!questions?'<p>'+t('unknownQuestions')+'</p>':mentor?
   '<p>'+t('published')+'</p><details><summary>'+t('sharedAnswers')+'</summary>'+
    snapshot.shared.filter(row=>row.cohort_id===form.cohort_id && row.form_id===form.id && row.share_with_mentor)
     .map(row=>answers(questions,row)).join('')+'</details>':participantForm(form,questions);
  return '<section class="panel"><h4>'+esc(form.title)+'</h4>'+body+'</section>';
 }

 async function load(notice='') {
  if (!current()) return;
  outlet.textContent=t('loading');
  try {
   snapshot=await readRetreatForms(client,user);
   if (!current()) return;
   if (!snapshot) {outlet.textContent='';return;}
   outlet.innerHTML='<h2>'+t('title')+'</h2>'+
    (notice?'<p role="status" tabindex="-1">'+t(notice)+'</p>':'')+
    snapshot.memberships.map(membership=>{
     const mentor=membership.role==='mentor';
     const cohort=membership.cohort_id;
     const forms=snapshot.forms.filter(form=>form.cohort_id===cohort && (mentor || form.published));
     return '<section class="panel"><h3>'+esc(membership.restart_retreat_cohorts?.title)+'</h3>'+
      (forms.map(form=>renderForm(form,mentor)).join('')||'<p>'+t('noForms')+'</p>')+
      (mentor?editor(cohort):'')+'</section>';
    }).join('')+refresh;
   if (notice) outlet.querySelector('[tabindex="-1"]')?.focus();
  } catch {
   if (current()) {
    snapshot=null;
    outlet.innerHTML=(notice?'<p role="status" tabindex="-1">'+t(notice)+'</p>':'')+
     '<p role="alert">'+t(notice?'refreshError':'error')+'</p>'+refresh;
    if (notice) outlet.querySelector('[tabindex="-1"]')?.focus();
   }
  }
 }

 outlet.onclick=async event=>{
  if (busy || !current() || !event.target.closest('[data-retreat-form-refresh]')) return;
  busy=true;
  try {await load();} finally {busy=false;}
 };

 outlet.onsubmit=async event=>{
  const element=event.target;
  const {retreatAction:action,cohort,form:id}=element.dataset;
  if (!action) return;
  event.preventDefault();
  event.stopPropagation();
  if (busy || !current()) return;
  const membership=snapshot?.memberships.find(row=>row.cohort_id===cohort);
  if (!membership) return;
  const form=snapshot.forms.find(row=>row.cohort_id===cohort && row.id===id);
  const message=element.querySelector('[data-retreat-form-message]');
  busy=true;
  const buttons=[...element.querySelectorAll('button')];
  buttons.forEach(button=>{button.disabled=true;});
  try {
   if (action==='editor' && membership.role==='mentor' && (!id || (form && !form.published))) {
    const publish=event.submitter?.value==='publish';
    const payload=retreatFormDraft(Object.fromEntries(new FormData(element)),publish);
    if (publish && (!form || !confirmAction(t('publishPrompt')))) return;
    const table=client.from('restart_retreat_forms');
    const write=form?table.update({...payload,published:publish}).eq('cohort_id',cohort).eq('id',id).eq('published',false):
     table.insert({...payload,cohort_id:cohort});
    await result(write.select('id').single());
   } else if (membership.role==='participant' && form?.published) {
    const own=snapshot.own.find(row=>row.form_id===id && row.cohort_id===cohort);
    if (action==='response' && !own) {
     const questions=parseRetreatQuestions(form.questions);
     if (!questions) return;
     const answers=retreatFormAnswers(questions,Object.fromEntries(new FormData(element)));
     await result(client.from('restart_retreat_responses').insert({cohort_id:cohort,form_id:id,answers}).select('id').single());
    } else if (action==='consent' && own) {
     const share=!own.share_with_mentor;
     if (share && !confirmAction(t('sharePrompt'))) return;
     await result(client.from('restart_retreat_responses').update({share_with_mentor:share})
      .eq('id',own.id).eq('cohort_id',cohort).eq('form_id',id).eq('participant_id',user.id)
      .eq('share_with_mentor',!share).select('id').single());
    } else return;
   } else return;
   await load('saved');
  } catch (error) {
   if (current()) message.textContent=t(['invalid','answerInvalid'].includes(error.message)?error.message:'error');
  } finally {
   busy=false;
   buttons.forEach(button=>{button.disabled=false;});
  }
 };

 busy=true;
 try {await load();} finally {busy=false;}
}
