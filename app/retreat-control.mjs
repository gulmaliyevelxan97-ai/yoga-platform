import {languages} from './state.mjs';

const sections = {
 events: ['Мои ретриты','Retritlərim','My retreats'],
 participants: ['Участники','İştirakçılar','Participants'],
 programme: ['Программа','Proqram','Programme'],
 forms: ['Анкеты','Anketlər','Forms'],
 tasks: ['Задания','Tapşırıqlar','Assignments'],
 messages: ['Сообщения и объявления','Mesajlar və elanlar','Messages and announcements']
};
const copy = {
 title: ['Управление ретритами','Retritlərin idarə edilməsi','Retreat Control Center'],
 loading: ['Проверяем доступ…','Giriş yoxlanılır…','Checking access…'],
 denied: ['Кабинет доступен основателю и наставникам назначенных групп.','Kabinet təsisçi və təyin olunmuş qrupların mentorları üçün əlçatandır.','The founder and assigned cohort mentors can access this workspace.'],
 unavailable: ['Не удалось загрузить кабинет. Попробуйте ещё раз.','Kabinet yüklənmədi. Yenidən cəhd edin.','The workspace could not load. Try again.'],
 retry: ['Повторить','Yenidən cəhd et','Try again'],
 name: ['Название ретрита','Retritin adı','Retreat title'],
 create: ['Создать ретрит','Retrit yarat','Create retreat'],
 created: ['Ретрит создан. Заполните сведения перед публикацией.','Retrit yaradıldı. Dərc etməzdən əvvəl məlumatları doldurun.','Retreat created. Add event details before publication.'],
 failed: ['Создание не подтверждено. Обновите список перед повтором.','Yaradılma təsdiqlənmədi. Yenidən cəhd etməzdən əvvəl siyahını yeniləyin.','Creation was not confirmed. Refresh the list before trying again.']
};

export const retreatControlTitle = copy.title;
export const retreatControlSection = id => Object.hasOwn(sections,id) ? id : 'events';

async function data(query) {
 const result = await query;
 if (result.error) throw result.error;
 return result.data;
}

export async function readRetreatControlAccess(client,user) {
 if (!user?.id || user.is_anonymous) return null;
 const [role, memberships] = await Promise.all([
  data(client.from('restart_school_roles').select('role').eq('user_id',user.id).maybeSingle()),
  data(client.from('restart_retreat_members').select('cohort_id').eq('user_id',user.id).eq('role','mentor'))
 ]);
 const founder = role?.role === 'owner';
 return founder || memberships.length ? {founder, hasCohorts: Boolean(memberships.length)} : null;
}

export async function retreatControlPage({outlet,client,user,lang,current,section,mount}) {
 const index = Math.max(0,languages.indexOf(lang));
 const t = key => copy[key][index];
 let busy = false;
 async function load(notice='') {
  if (!current()) return;
  outlet.textContent=t('loading');
  try {
   const access = await readRetreatControlAccess(client,user);
   if (!current()) return;
   if (!access) {outlet.textContent=t('denied');return;}
   const nav = access.hasCohorts ? Object.entries(sections).map(([key,labels])=>
    '<a href="#retreat-mentor/'+key+'"'+(key===section?' aria-current="page"':'')+'>'+labels[index]+'</a>').join('') : '';
   const create = access.founder && section==='events'
    ? '<form class="panel" data-retreat-create><label>'+t('name')+'<input name="title" required maxlength="160"></label><button>'+t('create')+'</button></form>' : '';
   outlet.innerHTML=(nav?'<nav class="retreat-nav" aria-label="'+t('title')+'">'+nav+'</nav>':'')+
    create+'<p role="status" data-retreat-control-status>'+notice+'</p><section data-retreat-control-body></section>';
   if (access.hasCohorts) mount(section,outlet.querySelector('[data-retreat-control-body]'));
  } catch {
   if (current()) outlet.innerHTML='<p role="alert">'+t('unavailable')+'</p><button type="button" data-retreat-retry>'+t('retry')+'</button>';
  }
 }

 outlet.onclick = event => {
  if (event.target.closest('[data-retreat-retry]')) void load();
 };
 outlet.onsubmit = async event => {
  const form = event.target;
  if (!form.matches('[data-retreat-create]')) return;
  event.preventDefault();
  event.stopPropagation();
  if (busy || !current()) return;
  const title = form.elements.title.value.trim();
  if (!title) {form.elements.title.focus();return;}
  const button = form.querySelector('button');
  busy = true;
  button.disabled = true;
  try {
   await data(client.rpc('restart_create_retreat',{p_title:title}));
   await load(t('created'));
  } catch {
   if (current()) outlet.querySelector('[data-retreat-control-status]').textContent=t('failed');
  } finally {
   button.disabled = false;
   busy = false;
  }
 };
 await load();
}
