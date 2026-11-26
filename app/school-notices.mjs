const copy = {
 ru: {
  title:'Уведомления',empty:'Уведомлений пока нет.',lessons:'Сообщать о новых уроках в моих программах',save:'Сохранить',
  booking_confirmed:'Запись подтверждена',booking_cancelled:'Ваша запись отменена',class_changed:'Параметры занятия изменились',
  class_cancelled:'Занятие отменено',lesson_added:'В вашей программе появился урок',schedule:'Открыть расписание',academy:'Перейти к программам'
 },
 az: {
  title:'Bildirişlər',empty:'Hələ bildiriş yoxdur.',lessons:'Proqramlarıma yeni dərs əlavə olunanda mənə bildir',save:'Yadda saxla',
  booking_confirmed:'Qeydiyyatınız təsdiqləndi',booking_cancelled:'Qeydiyyatınız ləğv edildi',class_changed:'Məşğələ məlumatları dəyişdi',
  class_cancelled:'Məşğələ ləğv edildi',lesson_added:'Proqramınıza yeni dərs əlavə edildi',schedule:'Cədvələ bax',academy:'Proqramlara keç'
 },
 en: {
  title:'Notifications',empty:'No notifications yet.',lessons:'Notify me about new lessons in my programmes',save:'Save',
  booking_confirmed:'Booking confirmed',booking_cancelled:'Your booking was cancelled',class_changed:'Class details changed',
  class_cancelled:'Class cancelled',lesson_added:'A lesson was added to your programme',schedule:'View schedule',academy:'View programmes'
 }
};

export async function schoolNotices(client,userId,lang) {
 const locale = Object.hasOwn(copy,lang) ? lang : 'ru';
 const t = copy[locale];
 const [notices,preference] = await Promise.all([
  client.from('restart_inbox').select('kind,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(20),
  client.from('restart_notice_preferences').select('lesson_updates').eq('user_id',userId).maybeSingle()
 ]);
 if (notices.error || preference.error) throw notices.error || preference.error;
 const format = new Intl.DateTimeFormat(locale,{dateStyle:'short',timeStyle:'short'});
 const items = notices.data.map(notice=>{
  const date = new Date(notice.created_at);
  if (!['booking_confirmed','booking_cancelled','class_changed','class_cancelled','lesson_added'].includes(notice.kind) || !Number.isFinite(date.getTime())) return '';
  const lesson = notice.kind === 'lesson_added';
  return '<li><strong>'+t[notice.kind]+'</strong> · '+format.format(date)+' <a href="'+(lesson?'#academy':'#classes')+'">'+(lesson?t.academy:t.schedule)+'</a></li>';
 }).join('');
 return '<details class="panel"><summary>'+t.title+'</summary>'+(items?'<ul>'+items+'</ul>':'<p>'+t.empty+'</p>')+
  '<form data-lesson-notices><label class="check"><input type="checkbox" name="lesson_updates"'+(preference.data?.lesson_updates?' checked':'')+'>'+t.lessons+
  '</label><button>'+t.save+'</button></form></details>';
}

export async function saveLessonPreference(client,userId,enabled) {
 const {error} = await client.from('restart_notice_preferences').upsert({user_id:userId,lesson_updates:enabled===true},{onConflict:'user_id'});
 if (error) throw error;
}
