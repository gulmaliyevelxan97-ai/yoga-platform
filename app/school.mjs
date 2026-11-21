import {academyCopy,programmeCardInfo,programmeEditor,saveProgrammeDetails} from './academy-programs.mjs';
import {classVenueField,classLocationFields,classDetailMarkup,classCalendarLink,classTimeInstant,classTimeInput} from './booking-calendar.mjs';
import {schoolNotices, saveLessonPreference} from './school-notices.mjs';
export const schoolStrings = {
 ...academyCopy,
 classKindFilter:['Тип занятия','Məşğələnin növü','Class type'],
 allClassKinds:['Все типы','Bütün növlər','All types'],
 myBookingsFilter:['Только мои записи','Yalnız mənim qeydiyyatlarım','Only my bookings'],
 lessonMedia:['Видео урока (YouTube или Vimeo)','Dərsin videosu (YouTube və ya Vimeo)','Lesson video (YouTube or Vimeo)'],
 lessonMediaWatch:['Открыть видео ↗','Videonu aç ↗','Open video ↗'],
 lessonMediaInvalid:['Укажите прямую HTTPS-ссылку на видео YouTube или Vimeo без дополнительных параметров.','Əlavə parametr olmadan YouTube və ya Vimeo videosunun birbaşa HTTPS keçidini daxil edin.','Enter a direct HTTPS YouTube or Vimeo video link without extra parameters.'],
 lessonDraftRecovered:['Восстановлен черновик этой вкладки','Bu vərəqdəki qaralama bərpa edildi','Draft recovered from this tab'],
 lessonDraftStored:['Черновик сохранён в этой вкладке','Qaralama bu vərəqdə saxlanıldı','Draft saved in this tab'],
 lessonDraftUnavailable:['Браузер не смог сохранить черновик в этой вкладке','Brauzer qaralamanı bu vərəqdə saxlaya bilmədi','The browser could not save this draft in this tab'],
 discardLessonDraft:['Удалить черновик','Qaralamanı sil','Discard draft'],
 previousLesson:['Предыдущий урок','Əvvəlki dərs','Previous lesson'],
 nextLesson:['Следующий урок','Növbəti dərs','Next lesson'],
 classFormatFilter:['Формат занятия','Məşğələnin formatı','Class format'],
 allFormats:['Все форматы','Bütün formatlar','All formats'],
 noMatchingClasses:['По выбранным фильтрам занятий нет.','Seçilmiş filtrlərə uyğun məşğələ yoxdur.','No classes match the selected filters.'],
 noUpcomingClasses:['Ближайших занятий пока нет.','Hələ qarşıdakı məşğələlər yoxdur.','No upcoming classes yet.'],
 bookingHistory:['История записей','Qeydiyyat tarixçəsi','Booking history'],
 bookingCancelled:['Запись отменена','Qeydiyyat ləğv olunub','Booking cancelled'],
 classFull:['Свободных мест нет','Boş yer yoxdur','No places available'],
 schoolSaved:['Сохранено','Yadda saxlanıldı','Saved'],
 schoolSaving:['Сохраняем…','Yadda saxlanılır…','Saving…'],
 lessonPositionTaken:['Эта позиция уже занята в модуле. Выберите другую.','Bu sıra nömrəsi modulda artıq istifadə olunur. Başqa nömrə seçin.','This position is already taken in the module. Choose another.'],
 resumeLesson:['Продолжить обучение','Öyrənməyə davam et','Continue learning'],
 revokeEnrollment:['Отозвать доступ','Girişi ləğv et','Revoke access'],
 student:['Ученик','Şagird','Student'],
 manageClasses:['Управление занятиями','Məşğələlərin idarə edilməsi','Manage classes'], newClass:['Создать занятие','Məşğələ yarat','Create class'],
 capacity:['Вместимость','Yer sayı','Capacity'], starts:['Начало','Başlanğıc','Starts'], ends:['Окончание','Son','Ends'], format:['Формат','Format','Format'],
 onsite:['Очно','Əyani','In person'], online:['Онлайн','Onlayn','Online'], group:['Группа','Qrup','Group'], individual:['Индивидуально','Fərdi','Individual'], event:['Мероприятие','Tədbir','Event'],
 stopClass:['Отменить занятие','Məşğələni ləğv et','Cancel class'], pending:['Ожидается','Gözlənilir','Pending'], present:['Присутствовал','İştirak edib','Present'], absent:['Отсутствовал','İştirak etməyib','Absent'],
 students:['Участники','İştirakçılar','Participants'], assignRole:['Назначить роль','Rol təyin et','Assign role'], instructor:['Преподаватель','Müəllim','Instructor'], admin:['Администратор','İdarəçi','Administrator'],
 audit:['Журнал изменений','Dəyişiklik jurnalı','Change log'], localClock:['Время Баку','Bakı vaxtı','Baku time'], venueEdit:['Место занятия','Məşğələnin yeri','Class venue'], editClass:['Изменить время, место и вместимость','Vaxtı, yeri və iştirakçı sayını dəyiş','Change time, venue and capacity'], schoolRole:['Роль','Rol','Role'],
 academy:['Мои программы','Proqramlarım','My programmes'], classes:['Мои занятия','Məşğələlərim','My classes'],
 staff:['Управление школой','Məktəbin idarə edilməsi','School management'], schoolEmpty:['Пока нет записей.','Hələ qeyd yoxdur.','No entries yet.'],
 schoolError:['Не удалось получить подтверждение сервера. Обновите данные.','Serverdən təsdiq alınmadı. Məlumatları yeniləyin.','Could not confirm the result. Refresh the data.'],
 reload:['Обновить','Yenilə','Refresh'], schoolPrograms:['Программы','Proqramlar','Programmes'], book:['Записаться','Yazıl','Book a place'],
 cancelBooking:['Отменить запись','Qeydiyyatı ləğv et','Cancel booking'], free:['Свободные места','Boş yerlər','Available places'],
 cancelled:['Отменено','Ləğv edilib','Cancelled'], createDraft:['Создать черновик','Qaralama yarat','Create draft'],
 schoolTitle:['Название','Ad','Title'], addModule:['Добавить модуль','Modul əlavə et','Add module'],
 addLesson:['Добавить урок','Dərs əlavə et','Add lesson'], order:['Порядок','Sıra','Position'],
 body:['Текст урока','Dərsin mətni','Lesson text'], publish:['Опубликовать','Dərc et','Publish'],
 archive:['В архив','Arxivləşdir','Archive'], enroll:['Добавить ученика','Şagird əlavə et','Enrol student'],
 memberId:['ID ученика','Şagirdin ID-si','Student ID'], draft:['Черновик','Qaralama','Draft'], published:['Опубликовано','Dərc edilib','Published'],
 archived:['В архиве','Arxivdə','Archived'], lesson:['Урок','Dərs','Lesson'], assignment:['Задание','Tapşırıq','Assignment'],
 practiceType:['Практика','Praktika','Practice'], completeLesson:['Отметить выполнение','Tamamlandığını qeyd et','Mark complete'],
 historyTitle:['Завершённые уроки','Tamamlanmış dərslər','Completed lessons'], denied:['Доступ ограничен.','Giriş məhduddur.','Access is restricted.'],
 schoolStats:['Статистика школы','Məktəbin statistikası','School statistics'], registered_students:['Ученики','Şagirdlər','Students'],
 active_learners_30d:['Активны за 30 дней','Son 30 gündə aktiv','Active in 30 days'], completed_practices:['Завершённые практики','Tamamlanmış praktikalar','Completed practices'],
 completed_lessons:['Завершённые уроки','Tamamlanmış dərslər','Completed lessons'], bookings:['Записи','Qeydiyyatlar','Bookings'], attended:['Посещения','İştirak','Attendance'],
 confirmed:['Запись подтверждена','Qeydiyyat təsdiqlənib','Booking confirmed'], kind:['Тип','Növ','Type'], lessonEdit:['Редактировать урок','Dərsi redaktə et','Edit lesson']
};

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

const lessonDraftFields = {title:180,body:50000,position:10,kind:10,media_url:80};
const videoUrl = /^https:\/\/(?:www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}|youtu\.be\/[A-Za-z0-9_-]{11}|vimeo\.com\/[1-9][0-9]{0,11})$/;
export const validLessonVideo = value => typeof value==='string' && !/[\x00-\x1f\x7f]/.test(value) && videoUrl.test(value);
const lessonAction = action => action==='edit' || action==='lesson';

export function lessonDraftStore(account, project, storage) {
 const prefix = 'restart.lessonDraft.v1:'+encodeURIComponent(project ?? '')+':'+encodeURIComponent(account)+':';
 const key = (action,id) => prefix+action+':'+id;
 const valid = (action,id) => lessonAction(action) && uuid.test(id);
 const browserStorage = () => storage ?? globalThis.sessionStorage;
 const normalize = values => Object.fromEntries(Object.entries(lessonDraftFields).map(([field,limit])=>
  [field,typeof values?.[field]==='string' ? values[field].slice(0,limit) : '']).filter(([field])=>field!=='media_url' || Object.hasOwn(values ?? {},field)));
 return {
  read(action,id) {
   if (!valid(action,id)) return null;
   try {
    const raw = browserStorage()?.getItem(key(action,id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Object.keys(lessonDraftFields).some(field=>field!=='media_url' && typeof parsed[field]!=='string')) return null;
    return normalize(parsed);
   } catch { return null; }
  },
  write(action,id,values) {
   if (!valid(action,id)) return false;
   try {
    browserStorage().setItem(key(action,id),JSON.stringify(normalize(values)));
    return true;
   } catch { return false; }
  },
  clear(action,id) {
   if (!valid(action,id)) return false;
   try {
    browserStorage().removeItem(key(action,id));
    return true;
   } catch { return false; }
  }
 };
}

export async function schoolPage({outlet,client,user,route,t,esc,lang,current,draftStorage}) {
 const drafts = lessonDraftStore(user,client.supabaseUrl,draftStorage);
 const lessonBaselines = new Map();
 const table = name => client.from('restart_'+name);
 async function data(query) {
  const {data:rows,error} = await query;
  if (error) throw error;
  return rows;
 }
 const link = (name,label,id='') => '<a class="button" href="#'+name+(id?'/'+esc(id):'')+'">'+t(label)+'</a>';
 const empty = '<p class="muted">'+t('schoolEmpty')+'</p>';
 const input = (key,name,attrs='') => '<label>'+t(key)+'<input required name="'+name+'" '+attrs+'></label>';
 const titleInput = input('schoolTitle','title','maxlength="180"');
 const lessonFields = ({position,kind,body} = {}) =>
  input('order','position','type="number" min="1" max="2147483647" step="1" value="'+esc(position ?? '')+'"')+
  '<label>'+t('kind')+'<select name="kind">'+['lesson','practice','assignment'].map(option=>
   '<option value="'+option+'"'+(option===kind?' selected':'')+'>'+t(option==='practice'?'practiceType':option)+'</option>').join('')+
  '</select></label><label>'+t('body')+'<textarea name="body" maxlength="50000">\n'+esc(body ?? '')+'</textarea></label>';
 const form = (action,label,fields='',key='') => '<form class="panel" data-school="'+action+'" data-key="'+esc(key)+'">'+fields+'<button>'+t(label)+'</button></form>';
 function lessonForm(action,id,label,original,draft = drafts.read(action,id)) {
  const baseline = {title:original.title ?? '',body:(original.body ?? '').replace(/\r\n?/g,'\n'),position:String(original.position ?? ''),kind:original.kind ?? 'lesson'};
  if (lessonMediaAvailable) baseline.media_url=original.media_url ?? '';
  const fields = {...baseline,...draft};
  const mediaInput = lessonMediaAvailable ?
   '<label>'+t('lessonMedia')+'<input name="media_url" type="url" maxlength="80" value="'+esc(fields.media_url)+'"></label>' : '';
  lessonBaselines.set(action+':'+id,baseline);
  return '<form class="panel" data-school="'+action+'" data-key="'+esc(id)+'"><fieldset class="lesson-editor-fields">'+
   input('schoolTitle','title','maxlength="180" value="'+esc(fields.title)+'"')+lessonFields(fields)+mediaInput+
   '<p class="muted" role="status" data-lesson-draft-status>'+(draft?t('lessonDraftRecovered'):'')+'</p>'+
   '<div class="actions"><button type="submit">'+t(label)+'</button>'+
   '<button type="button" data-lesson-draft-discard'+(draft?'':' hidden')+'>'+t('discardLessonDraft')+'</button></div></fieldset></form>';
 }
 const date = value => new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Baku'}).format(new Date(value));
 let busy = false;
 let role = '';
 let isOwner = false;
 const classFilters = {format:'',kind:'',mine:false};
 const classMatches = ({format,kind,own}) => (!classFilters.format || format===classFilters.format) &&
  (!classFilters.kind || kind===classFilters.kind) && (!classFilters.mine || own);
 let lessonMediaAvailable = false;
 function lessonValues(values) {
  const fields = {title:values.title,body:values.body,position:Number(values.position),kind:values.kind};
  if (lessonMediaAvailable && typeof values.media_url==='string') {
   const media = values.media_url.trim();
   if (media && !validLessonVideo(media)) throw new Error('lessonMediaInvalid');
   fields.media_url=media || null;
  }
  return fields;
 }
 async function programmeLessons(modules) {
  if (!modules.length) return [];
  const list = columns=>table('lessons').select(columns).in('module_id',modules.map(m=>m.id)).order('position');
  const columns = 'id,module_id,title,body,kind,position';
  const result = await list(columns+',media_url');
  lessonMediaAvailable = !result.error;
  if (lessonMediaAvailable) return result.data;
  if (result.error.code==='42703') return data(list(columns));
  throw result.error;
 }
 async function programmes() {
  const programs = await data(table('programs').select('id,title,status,instructor_id,summary,direction,level,minutes,revision').order('title'));
  const program = programs.find(p=>p.id===route.id);
  if (!program) return programs.map(p=>'<article class="panel"><h2><a href="#'+route.name+'/'+esc(p.id)+'">'+esc(p.title)+'</a></h2><p>'+t(p.status)+'</p>'+programmeCardInfo(p,t,esc)+'</article>').join('') || empty;
  const staff = route.name==='staff';
  const editing = staff && (role==='admin' || (program.status==='draft' && program.instructor_id===user));
  const modules = await data(table('modules').select('id,title').eq('program_id',program.id).order('position'));
  const lessons = await programmeLessons(modules);
  const done = lessons.length && !staff ? await data(table('lesson_progress').select('lesson_id,completed_at').eq('user_id',user).in('lesson_id',lessons.map(l=>l.id))) : [];
  const completed = new Set(done.map(d=>d.lesson_id));
  let html = link(route.name,'schoolPrograms')+'<h2>'+esc(program.title)+'</h2>'+programmeCardInfo(program,t,esc);
  if (editing) html+=programmeEditor(program,t,esc);
  if (!staff && lessons.length) html += '<label>'+t('historyTitle')+' · '+completed.size+' / '+lessons.length+
   '<progress value="'+completed.size+'" max="'+lessons.length+'"></progress></label>';
  const orderedLessons = modules.flatMap(m=>lessons.filter(l=>l.module_id===m.id));
  const lessonNav = (lesson,label) => lesson ?
   '<button type="button" data-continue="'+esc(lesson.id)+'">'+t(label)+'</button>' : '';
  const nextLesson = orderedLessons.find(l=>!completed.has(l.id));
  if (!staff && nextLesson) html += lessonNav(nextLesson,'resumeLesson');
  if (staff && role==='admin') {
   if (program.status==='draft') html+=form('publish','publish','',program.id);
   if (program.status!=='archived') html+=form('archive','archive','',program.id);
   html+=form('enroll','enroll',input('memberId','student','maxlength="36"'),program.id);
   const members=await data(table('enrollments').select('user_id').eq('program_id',program.id));
   html+=members.map(m=>form('unenroll','revokeEnrollment','<span>'+esc(m.user_id)+'</span><input type="hidden" name="student" value="'+esc(m.user_id)+'">',program.id)).join('');
  }
  for (const m of modules) {
   html+='<section class="panel"><h3>'+esc(m.title)+'</h3>';
   for (const l of lessons.filter(l=>l.module_id===m.id)) {
    const recovered = editing && drafts.read('edit',l.id);
   html+='<details class="panel" data-lesson="'+esc(l.id)+'"'+(recovered?' open':'')+'><summary>'+esc(l.title)+(completed.has(l.id)?' ✓':'')+'</summary><p>'+esc(l.body).replace(/\n/g,'<br>')+'</p>';
    if (validLessonVideo(l.media_url)) html+='<p><a class="button" href="'+esc(l.media_url)+
     '" target="_blank" rel="noopener noreferrer">'+t('lessonMediaWatch')+'</a></p>';
    if (!staff) {
     if (!completed.has(l.id)) html+=form('complete','completeLesson','',l.id);
     const index=orderedLessons.indexOf(l);
     html+='<div class="actions">'+lessonNav(orderedLessons[index-1],'previousLesson')+
       lessonNav(orderedLessons[index+1],'nextLesson')+'</div>';
    }
    if (editing) html+=lessonForm('edit',l.id,'lessonEdit',l,recovered);
    html+='</details>';
   }
   if (editing) html+=lessonForm('lesson',m.id,'addLesson',{});
   html+='</section>';
  }
  return html+(editing?form('module','addModule',titleInput+input('order','position','type="number" min="1" step="1"'),program.id):'');
 }
 const select = (label,name,values) => '<label>'+t(label)+'<select name="'+name+'">'+values.map(v=>'<option value="'+v+'">'+t(v)+'</option>').join('')+'</select></label>';
 async function management() {
  let query=table('class_sessions').select('id,title,starts_at,ends_at,status,capacity,venue').order('starts_at',{ascending:false}).limit(50);
  if(role==='instructor') query=query.eq('instructor_id',user);
  const sessions=await data(query);
  const roster=sessions.length ? await data(table('bookings').select('session_id,user_id,status,attendance').in('session_id',sessions.map(s=>s.id)).eq('status','booked')) : [];
  const editClass = s => '<details><summary>'+t('editClass')+'</summary>'+form('editClass','save',
   '<p>'+t('localClock')+'</p>'+input('starts','start','type="datetime-local" value="'+esc(classTimeInput(s.starts_at))+'"')+
   input('ends','end','type="datetime-local" value="'+esc(classTimeInput(s.ends_at))+'"')+
   input('capacity','capacity','type="number" min="1" max="1000" value="'+esc(s.capacity)+'"')+
   '<label>'+t('venueEdit')+'<input name="venue" maxlength="180" value="'+esc(s.venue)+'"></label>',s.id)+'</details>';
  let html='<details class="panel"><summary>'+t('manageClasses')+'</summary>'+form('newClass','newClass',titleInput+'<p>'+t('localClock')+'</p>'+input('starts','start','type="datetime-local"')+input('ends','end','type="datetime-local"')+select('format','format',['onsite','online'])+select('kind','kind',['group','individual','event'])+input('capacity','capacity','type="number" min="1" max="1000"')+classVenueField(lang))+
   sessions.map(s=>'<details><summary>'+esc(s.title)+' · '+esc(date(s.starts_at))+'</summary>'+(s.status==='cancelled'?t('cancelled'):editClass(s)+form('stopClass','stopClass','',s.id))+roster.filter(b=>b.session_id===s.id).map(b=>form('attendance','save','<p>'+esc(b.user_id)+' · '+t(b.attendance)+'</p><input type="hidden" name="student" value="'+esc(b.user_id)+'">'+select('attended','attendance',['present','absent']),s.id)).join('')+'</details>').join('')+'</details>';
  if(role==='admin') {
   const audit=await data(table('school_audit').select('operation,relation_name,happened_at').order('id',{ascending:false}).limit(20));
   if(isOwner) html+='<details class="panel"><summary>'+t('schoolRole')+'</summary>'+form('role','assignRole',input('memberId','student','maxlength="36"')+select('schoolRole','role',['student','instructor','admin']))+'</details>';
   html+='<details class="panel"><summary>'+t('audit')+'</summary>'+audit.map(a=>'<p>'+esc(date(a.happened_at))+' · '+esc(a.operation)+' · '+esc(a.relation_name)+'</p>').join('')+'</details>';
  }
  return html;
 }
 async function classes() {
  const now = new Date().toISOString();
  const [sessions,bookings] = await Promise.all([
   data(table('class_sessions').select('id,title,starts_at,ends_at,status,capacity,seats_taken,format,kind,venue').gte('starts_at',now).order('starts_at')),
   data(table('bookings').select('session_id,status').eq('user_id',user))
  ]);
  const byId = new Map(bookings.map(booking=>[booking.session_id,booking.status]));
  const history = bookings.length ? await data(table('class_sessions')
   .select('id,title,starts_at,status,restart_bookings!inner(status)')
   .eq('restart_bookings.user_id',user).lt('starts_at',now).order('starts_at',{ascending:false}).limit(30)) : [];
  const filterSelect = (name,label,options) => '<label>'+t(label)+'<select data-class-filter="'+name+'">'+
   options.map(([value,key])=>'<option value="'+value+'"'+(value===classFilters[name]?' selected':'')+'>'+t(key)+'</option>').join('')+
   '</select></label>';
  const filters = '<div class="panel">'+
   filterSelect('format','classFormatFilter',[['','allFormats'],['onsite','onsite'],['online','online']])+
   filterSelect('kind','classKindFilter',[['','allClassKinds'],['group','group'],['individual','individual'],['event','event']])+
   '<label><input type="checkbox" data-class-filter="mine"'+(classFilters.mine?' checked':'')+'> '+t('myBookingsFilter')+'</label></div>';
  const cards = sessions.map(s=>{
   const places=Math.max(0,s.capacity-s.seats_taken);
   const owns = byId.get(s.id)==='booked';
   const status = s.status==='cancelled' ? '<p>'+t('cancelled')+'</p>' :
    '<p>'+(places ? t('free')+' · '+places+' / '+s.capacity : t('classFull'))+'</p>'+
    (owns?'<p>'+t('confirmed')+'</p>'+classCalendarLink(s,lang)+form('cancel','cancelBooking','',s.id):places>0?form('book','book','',s.id):'');
   return '<article class="panel" data-class-card data-format="'+esc(s.format)+'" data-kind="'+esc(s.kind)+'" data-own="'+owns+'"'+
    (classMatches({...s,own:owns})?'':' hidden')+
    '><h2>'+esc(s.title)+'</h2><p>'+esc(date(s.starts_at))+' · '+t('localClock')+'</p>'+
    '<p>'+t(s.format)+' · '+t(s.kind)+'</p>'+classDetailMarkup(s,lang,esc)+status+'</article>';
  }).join('');
  const hasMatches = sessions.some(s=>classMatches({...s,own:byId.get(s.id)==='booked'}));
  const historyItems=history.map(s=>'<li><strong>'+esc(s.title)+'</strong> · '+esc(date(s.starts_at))+' · '+
   t(s.status==='cancelled'?'cancelled':s.restart_bookings[0]?.status==='booked'?'confirmed':'bookingCancelled')+'</li>').join('');
  return (sessions.length?filters:'')+'<p data-class-empty role="status"'+(hasMatches?' hidden':'')+'>'+t(sessions.length?'noMatchingClasses':'noUpcomingClasses')+'</p>'+cards+
   '<details class="panel"><summary>'+t('bookingHistory')+'</summary>'+(historyItems?'<ul>'+historyItems+'</ul>':empty)+'</details>';
 }
 async function load(saved = false) {
  if (!current()) return;
  outlet.textContent=t('cloudLoading');
  lessonBaselines.clear();
  try {
   const roles=await data(table('school_roles').select('role').eq('user_id',user).maybeSingle());
   isOwner=roles?.role==='owner';
   role=isOwner?'admin':roles?.role || 'student';
   const staff=['admin','instructor'].includes(role);
   let html='<nav class="actions">'+link('academy','academy')+' '+link('classes','classes')+(staff?' '+link('staff','staff'):'')+'</nav>';
   if (route.name==='staff' && !staff) html+='<p>'+t('denied')+'</p>';
   else if (route.name==='classes') html+=(await classes())+(await schoolNotices(client,user,lang));
   else {
    if (route.name==='staff' && !route.id) {
     if (role==='admin') {
      const stats=await data(client.rpc('restart_school_metrics'));
      html+='<section class="panel"><h2>'+t('schoolStats')+'</h2><dl>'+['registered_students','active_learners_30d','completed_practices','completed_lessons','bookings','attended'].map(k=>'<dt>'+t(k)+'</dt><dd>'+esc(stats[k])+'</dd>').join('')+'</dl></section>';
     }
     html+=form('program','createDraft',titleInput)+await management();
    }
    html+=await programmes();
   }
   if(current()) {
    outlet.innerHTML=(saved?'<p role="status" tabindex="-1">'+t('schoolSaved')+'</p>':'')+html;
    if (saved) outlet.querySelector('[role=status]').focus();
   }
  } catch { if(current()) error(); }
 }
 function error() { outlet.innerHTML='<p role="alert">'+t('schoolError')+'</p>'+form('refresh','reload'); }
 outlet.onchange=e=>{
  const filter=e.target.dataset.classFilter;
  if (!current() || !Object.hasOwn(classFilters,filter)) return;
  classFilters[filter]=filter==='mine'?e.target.checked:e.target.value;
  const cards=[...outlet.querySelectorAll('[data-class-card]')];
  for (const card of cards) {
   const {format,kind,own}=card.dataset;
   card.hidden=!classMatches({format,kind,own:own==='true'});
  }
  outlet.querySelector('[data-class-empty]').hidden=cards.some(card=>!card.hidden);
 };
 outlet.oninput=e=>{
  const editor = e.target.closest('form[data-school="edit"],form[data-school="lesson"]');
  if (!current() || !editor || !Object.hasOwn(lessonDraftFields,e.target.name)) return;
  const {school,key} = editor.dataset;
  const baseline = lessonBaselines.get(school+':'+key);
  if (!baseline) return;
  const values = Object.fromEntries(new FormData(editor));
  const changed = Object.keys(baseline).some(field=>baseline[field]!==values[field]);
  const stored = changed ? drafts.write(school,key,values) : drafts.clear(school,key);
  editor.querySelector('[data-lesson-draft-status]').textContent =
   stored ? (changed?t('lessonDraftStored'):'') : t('lessonDraftUnavailable');
  editor.querySelector('[data-lesson-draft-discard]').hidden = !changed;
 };
 outlet.onclick=e=>{
  if (!current()) return;
  const discard = e.target.closest('button[data-lesson-draft-discard]');
  if (discard) {
   const editor = discard.form;
   const {school,key} = editor.dataset;
   const baseline = lessonBaselines.get(school+':'+key);
   if (!baseline || !confirm(t('discardLessonDraft')+'?')) return;
   const cleared = drafts.clear(school,key);
   if (cleared) {
    for (const [field,value] of Object.entries(baseline)) editor.elements[field].value=value;
    discard.hidden=true;
    editor.querySelector('input[name="title"]').focus();
   }
   editor.querySelector('[data-lesson-draft-status]').textContent = cleared?'':t('lessonDraftUnavailable');
   return;
  }
  const id=e.target.closest('button[data-continue]')?.dataset.continue;
  if (!uuid.test(id || '')) return;
  const lesson=outlet.querySelector('details[data-lesson="'+id+'"]');
  if (lesson) { lesson.open=true; lesson.querySelector('summary').focus(); }
 };
 outlet.onsubmit=async e=>{
  e.preventDefault(); e.stopPropagation();
  if (busy || !current()) return;
  const f=e.target;
  const key=f.dataset.key, action=f.hasAttribute('data-lesson-notices')?'noticePref':f.dataset.school, values=Object.fromEntries(new FormData(f));
  if(key && !uuid.test(key)) return;
  busy=true;
  f.querySelector('[role=alert]')?.remove();
  const submit = f.querySelector('button');
  const lessonEditor = lessonAction(action) ? f.querySelector('fieldset') : null;
  if (lessonEditor) lessonEditor.disabled=true;
  const label = submit.textContent;
  submit.disabled=true;
  submit.textContent=t('schoolSaving');
  try {
   if ((await client.auth.getSession()).data.session?.user.id!==user || !current()) return;
   switch(action) {
    case 'refresh': break;
    case 'noticePref': await saveLessonPreference(client,user,f.elements.lesson_updates.checked); break;
    case 'newClass': await data(table('class_sessions').insert({title:values.title,starts_at:classTimeInstant(values.start),ends_at:classTimeInstant(values.end),kind:values.kind,format:values.format,capacity:Number(values.capacity),...classLocationFields(values)})); break;
    case 'editClass': await data(table('class_sessions').update({
     starts_at:classTimeInstant(values.start),ends_at:classTimeInstant(values.end),
     capacity:Number(values.capacity),...classLocationFields(values)
    }).eq('id',key).eq('status','scheduled').select('id').single()); break;
    case 'stopClass': if(!confirm(t('stopClass')+'?')) return; await data(table('class_sessions').update({status:'cancelled'}).eq('id',key).select('id').single()); break;
    case 'attendance': await data(client.rpc('restart_mark_attendance',{p_session_id:key,p_user_id:values.student,p_attendance:values.attendance})); break;
    case 'role': {
     if (!isOwner) return;
     if (!uuid.test(values.student) || !confirm(t('assignRole')+' · '+t(values.role)+' · '+values.student+'?')) return;
     const existing=await data(table('school_roles').select('role').eq('user_id',values.student).maybeSingle());
     if (values.student===user && values.role!=='admin') throw Error();
     if(values.role==='student') {
      if(existing) await data(table('school_roles').delete().eq('user_id',values.student).select('user_id').single());
      break;
     }
     if(existing) await data(table('school_roles').update({role:values.role}).eq('user_id',values.student).select('role').single());
     else await data(table('school_roles').insert({user_id:values.student,role:values.role}));
     break;
    }
    case 'complete': await data(table('lesson_progress').upsert({lesson_id:key},{onConflict:'user_id,lesson_id',ignoreDuplicates:true})); break;
    case 'book': case 'cancel': await data(client.rpc('restart_set_booking',{p_session_id:key,p_book:action==='book'})); break;
    case 'courseDetails': await saveProgrammeDetails(client,key,values); break;
    case 'program': await data(table('programs').insert({title:values.title})); break;
    case 'enroll': if (!uuid.test(values.student)) throw Error(); await data(table('enrollments').insert({program_id:key,user_id:values.student})); break;
    case 'unenroll':
     if (!uuid.test(values.student) || !confirm(t('revokeEnrollment')+' · '+values.student+'?')) return;
     await data(table('enrollments').delete().eq('user_id',values.student).eq('program_id',key).select('user_id').single());
     break;
    case 'publish': case 'archive': if (!confirm(t(action)+'?')) return; await data(table('programs').update({status:action==='publish'?'published':'archived'}).eq('id',key).select('id').single()); break;
    case 'module': await data(table('modules').insert({program_id:key,title:values.title,position:Number(values.position)})); break;
    case 'lesson': await data(table('lessons').insert({module_id:key,...lessonValues(values)})); break;
    case 'edit': await data(table('lessons').update(lessonValues(values)).eq('id',key).select('id').single()); break;
    default: return;
   }
   if (lessonEditor) drafts.clear(action,key);
   await load(action!=='refresh');
  } catch (failure) {
   const lessonPositionTaken = (action==='edit' || action==='lesson') && failure.code==='23505';
   if(current()) {
    const alert=f.querySelector('[role=alert]') || f.appendChild(document.createElement('p'));
    alert.setAttribute('role','alert');
    alert.textContent=t(lessonPositionTaken?'lessonPositionTaken':['courseConflict','lessonMediaInvalid'].includes(failure.message)?failure.message:'schoolError');
   }
  }
  finally {
   busy=false;
   if (lessonEditor) lessonEditor.disabled=false;
   submit.disabled=false;
   submit.textContent=label;
  }
 };
 await load();
}
