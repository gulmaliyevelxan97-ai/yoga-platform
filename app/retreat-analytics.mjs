import {languages} from './state.mjs';

const labels={
 heading:['Сводка по группам','Qruplar üzrə icmal','Cohort overview'],
 loading:['Загружаем сводку…','İcmal yüklənir…','Loading overview…'],
 empty:['У вас пока нет групп ретрита.','Hələ retrit qrupunuz yoxdur.','You have no retreat cohorts yet.'],
 failed:['Не удалось загрузить сводку. Откройте раздел ещё раз.','İcmal yüklənmədi. Bölməni yenidən açın.','Could not load the overview. Open this section again.'],
 approved:['Одобренные заявки','Təsdiqlənmiş müraciətlər','Approved applications'],
 pending:['Заявки на рассмотрении','Baxılan müraciətlər','Pending applications'],
 shared:['Переданные ответы','Paylaşılmış cavablar','Shared responses'],
 submitted:['Задания на проверке','Yoxlamada olan tapşırıqlar','Submissions awaiting review'],
 reviewed:['Проверенные задания','Yoxlanmış tapşırıqlar','Reviewed submissions'],
 unread:['Ваши непрочитанные сообщения','Oxunmamış mesajlarınız','Your unread messages']
};

async function checked(query,field='data') {
 const result=await query;
 if (result.error) throw result.error;
 return result[field];
}

function count(value) {
 if (!Number.isSafeInteger(value) || value<0) throw new Error('Count unavailable');
 return value;
}

const metrics=[
 ['approved','restart_retreat_admissions','status','approved'],
 ['pending','restart_retreat_admissions','status','pending'],
 ['shared','restart_retreat_responses','share_with_mentor',true],
 ['submitted','restart_retreat_assignment_submissions','status','submitted'],
 ['reviewed','restart_retreat_assignment_submissions','status','reviewed']
];

export async function readRetreatAnalytics(client,user) {
 if (!user?.id || user.is_anonymous) return [];
 const groups=await checked(client.from('restart_retreat_members')
  .select('cohort_id,restart_retreat_cohorts(title)').eq('user_id',user.id).eq('role','mentor').order('cohort_id'));
 // One cohort at a time keeps request concurrency bounded on slower connections.
 const summaries=[];
 for (const {cohort_id:cohort,restart_retreat_cohorts:details} of groups) {
  const values=await Promise.all([
   ...metrics.map(async ([label,table,column,value])=>[label,count(await checked(client.from(table)
    .select('id',{count:'exact',head:true}).eq('cohort_id',cohort).eq(column,value),'count'))]),
   checked(client.rpc('restart_retreat_unread_count',{p_cohort_id:cohort})).then(value=>['unread',count(value)])
  ]);
  summaries.push({title:details?.title,values});
 }
 return summaries;
}

export async function retreatAnalyticsPage({outlet,client,user,lang,esc,current}) {
 const language=Math.max(0,languages.indexOf(lang));
 const t=key=>labels[key][language];
 const number=new Intl.NumberFormat(lang);
 outlet.innerHTML='<h2>'+t('heading')+'</h2><p role="status">'+t('loading')+'</p>';
 try {
  const groups=await readRetreatAnalytics(client,user);
  if (!current()) return;
  outlet.innerHTML='<h2>'+t('heading')+'</h2>'+(groups.length?groups.map(group=>
   '<article class="panel"><h3>'+esc(group.title)+'</h3><dl class="retreat-metrics">'+group.values.map(([label,value])=>
   '<div><dt>'+t(label)+'</dt><dd>'+number.format(value)+'</dd></div>').join('')+'</dl></article>').join(''):
   '<p>'+t('empty')+'</p>');
 } catch {
  if (current()) outlet.innerHTML='<p role="alert">'+t('failed')+'</p>';
 }
}
