import {schoolTimeZone} from './booking-calendar.mjs';
import {languages} from './state.mjs';

const copy = {
 title:['Программа ретрита','Retrit proqramı','Retreat programme'],
 loading:['Загружаем программу…','Proqram yüklənir…','Loading programme…'],
 empty:['В этой группе ещё нет опубликованных пунктов.','Bu qrupda hələ dərc edilmiş proqram bəndi yoxdur.','This group has no published items yet.'],
 noGroup:['Программа появится после добавления в группу.','Qrupa əlavə olunduqdan sonra proqram görünəcək.','Your programme will appear after you join a group.'],
 error:['Не удалось загрузить программу.','Proqramı yükləmək mümkün olmadı.','The programme could not be loaded.'],
 retry:['Повторить','Yenidən cəhd et','Try again'],
 refresh:['Обновить программу','Proqramı yenilə','Refresh programme'],
 timeZone:['Время Баку','Bakı vaxtı','Baku time'],
 now:['Сейчас','İndi','Now'],
 next:['Далее','Növbəti','Next'],
 schedule:['Вся программа','Bütün proqram','Full programme'],
 finished:['Предстоящих пунктов пока нет.','Qarşıda planlaşdırılmış bənd hələ yoxdur.','There are no upcoming items.']
};

export const retreatProgrammeTitle = copy.title;

async function rows(query) {
 const {data,error}=await query;
 if (error) throw error;
 return data;
}

export async function readRetreatProgramme(client,user) {
 if (!user?.id || user.is_anonymous) return {groups:[],items:[]};
 const groups=await rows(client.from('restart_retreat_members')
  .select('cohort_id,restart_retreat_cohorts(title)').eq('user_id',user.id));
 if (!groups.length) return {groups,items:[]};
 const items=await rows(client.from('restart_retreat_programme_items')
  .select('id,cohort_id,title,description,starts_at,ends_at,published')
  .in('cohort_id',groups.map(group=>group.cohort_id))
  .eq('published',true).order('starts_at').order('id'));
 return {groups,items};
}

function programmeTimeline(items,cohort) {
 return items.filter(item=>item.cohort_id===cohort && item.published===true)
  .map(item=>({...item,start:Date.parse(item.starts_at),end:Date.parse(item.ends_at)}))
  .filter(item=>Number.isFinite(item.start))
  .sort((a,b)=>a.start-b.start);
}

export function retreatProgrammeWindow(items,cohort,now=new Date()) {
 const timeline=programmeTimeline(items,cohort);
 const stamp=now.getTime();
 const current=timeline.filter(item=>item.start<=stamp && item.end>stamp);
 const next=timeline.find(item=>item.start>stamp);
 const upcoming=next?timeline.filter(item=>item.start===next.start):[];
 return {timeline,current,upcoming};
}

function markup(lang,esc) {
 const locale=Math.max(0,languages.indexOf(lang));
 const t=key=>copy[key][locale];
 const format=new Intl.DateTimeFormat(languages[locale],{
  dateStyle:'medium',timeStyle:'short',timeZone:schoolTimeZone
 });
 const time=instant=>'<time datetime="'+esc(instant)+'">'+esc(format.format(new Date(instant)))+'</time>';
 const card=(item,description)=>{
  const tag=description?'h3':'h4';
  return '<article class="panel"><'+tag+'>'+esc(item.title)+'</'+tag+'><p>'+time(item.starts_at)+
  (item.end>item.start?' – '+time(item.ends_at):'')+'</p>'+
  (description && item.description?'<p>'+esc(item.description)+'</p>':'')+'</article>';
 };
 return {t,card};
}

function renderWindow({current,upcoming,timeline},{t,card}) {
 if (!timeline.length) return '';
 return (current.length?'<section><h3>'+t('now')+'</h3>'+current.map(item=>card(item,false)).join('')+'</section>':'')+
  (upcoming.length?'<section><h3>'+t('next')+'</h3>'+upcoming.map(item=>card(item,false)).join('')+'</section>':
   current.length?'':'<p>'+t('finished')+'</p>');
}

export function renderRetreatProgramme({groups,items},lang,esc,now=new Date()) {
 const ui=markup(lang,esc);
 const {t,card}=ui;
 if (!groups.length) return '<p role="status">'+t('noGroup')+'</p>';
 return '<p class="muted">'+t('timeZone')+'</p>'+groups.map(group=>{
  const cohort=group.cohort_id;
  const window=retreatProgrammeWindow(items,cohort,now);
  const cards=window.timeline.map(item=>card(item,true)).join('');
  return '<section><h2>'+esc(group.restart_retreat_cohorts?.title ?? t('title'))+'</h2>'+
   (cards?'<div data-retreat-programme-window="'+esc(cohort)+'" aria-live="polite">'+renderWindow(window,ui)+'</div>'+
    '<details><summary>'+t('schedule')+'</summary>'+cards+'</details>':'<p>'+t('empty')+'</p>')+'</section>';
 }).join('');
}

export async function retreatProgrammePage({outlet,client,user,lang,esc,current}) {
 const ui=markup(lang,esc);
 const {t}=ui;
 let timer;

 function updateAtBoundary(programme,now) {
  if (!current() || !outlet.isConnected) return;
  const stamp=now.getTime();
  const boundaries=programme.groups.flatMap(group=>programmeTimeline(programme.items,group.cohort_id)
   .flatMap(item=>[item.start,item.end])).filter(value=>value>stamp);
  if (!boundaries.length) return;
  const next=Math.min(...boundaries);
  timer=setTimeout(()=>{
   if (!current() || !outlet.isConnected) return;
   const clock=new Date();
   if (clock.getTime()>=next) {
    for (const node of outlet.querySelectorAll('[data-retreat-programme-window]')) {
     const window=retreatProgrammeWindow(programme.items,node.dataset.retreatProgrammeWindow,clock);
     node.innerHTML=renderWindow(window,ui);
    }
   }
   updateAtBoundary(programme,clock);
  },Math.min(next-stamp,60000));
 }

 async function load() {
  if (!current()) return;
  clearTimeout(timer);
  outlet.textContent=t('loading');
  try {
   const programme=await readRetreatProgramme(client,user);
   if (current()) {
    const now=new Date();
    outlet.innerHTML=renderRetreatProgramme(programme,lang,esc,now)+
     (programme.groups.length?'<button type="button" data-retreat-retry>'+t('refresh')+'</button>':'');
    updateAtBoundary(programme,now);
   }
  } catch {
   if (current()) outlet.innerHTML='<p role="alert">'+t('error')+
    '</p><button type="button" data-retreat-retry>'+t('retry')+'</button>';
  }
 }
 outlet.onclick=event=>{
  if (event.target.closest('[data-retreat-retry]')) void load();
 };
 await load();
}
