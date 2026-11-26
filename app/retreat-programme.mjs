import {schoolTimeZone} from './booking-calendar.mjs';
import {languages} from './state.mjs';

const copy = {
 title:['Программа ретрита','Retrit proqramı','Retreat programme'],
 loading:['Загружаем программу…','Proqram yüklənir…','Loading programme…'],
 empty:['В этой группе ещё нет опубликованных пунктов.','Bu qrupda hələ dərc edilmiş proqram bəndi yoxdur.','This group has no published items yet.'],
 noGroup:['Программа появится после добавления в группу.','Qrupa əlavə olunduqdan sonra proqram görünəcək.','Your programme will appear after you join a group.'],
 error:['Не удалось загрузить программу.','Proqramı yükləmək mümkün olmadı.','The programme could not be loaded.'],
 retry:['Повторить','Yenidən cəhd et','Try again'],
 timeZone:['Время Баку','Bakı vaxtı','Baku time']
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
  .select('id,cohort_id,title,description,starts_at,ends_at')
  .in('cohort_id',groups.map(group=>group.cohort_id))
  .eq('published',true).order('starts_at').order('id'));
 return {groups,items};
}

export function renderRetreatProgramme({groups,items},lang,esc) {
 const locale=Math.max(0,languages.indexOf(lang));
 const t=key=>copy[key][locale];
 if (!groups.length) return '<p role="status">'+t('noGroup')+'</p>';
 const format=new Intl.DateTimeFormat(languages[locale],{
  dateStyle:'medium',timeStyle:'short',timeZone:schoolTimeZone
 });
 const time=instant=>'<time datetime="'+esc(instant)+'">'+esc(format.format(new Date(instant)))+'</time>';
 return '<p class="muted">'+t('timeZone')+'</p>'+groups.map(group=>{
  const cards=items.filter(item=>item.cohort_id===group.cohort_id).map(item=>
   '<article class="panel"><h3>'+esc(item.title)+'</h3><p>'+time(item.starts_at)+
   (item.ends_at?' – '+time(item.ends_at):'')+'</p>'+
   (item.description?'<p>'+esc(item.description)+'</p>':'')+'</article>').join('');
  return '<section><h2>'+esc(group.restart_retreat_cohorts?.title ?? t('title'))+'</h2>'+
   (cards || '<p>'+t('empty')+'</p>')+'</section>';
 }).join('');
}

export async function retreatProgrammePage({outlet,client,user,lang,esc,current}) {
 const t=key=>copy[key][Math.max(0,languages.indexOf(lang))];
 async function load() {
  if (!current()) return;
  outlet.textContent=t('loading');
  try {
   const programme=await readRetreatProgramme(client,user);
   if (current()) outlet.innerHTML=renderRetreatProgramme(programme,lang,esc);
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
