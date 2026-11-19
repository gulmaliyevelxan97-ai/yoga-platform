// Generic self-guided timers. The optional YouTube references are from the public video-data.js catalogue.
export const catalog = [
  {id:'yoga', minutes:6, title:['Сканирование тела в движении','Hərəkətdə bədəni duymaq','Body awareness in motion'],
    description:['Выберите несколько знакомых поз йоги и переходите между ними в спокойном темпе. Останавливайтесь между позами, чтобы заметить опору и дыхание.','Bir neçə tanış yoqa pozası seçin və aralarında sakit templə keçid edin. Dayağı və nəfəsinizi hiss etmək üçün arada dayanın.','Choose a few familiar yoga poses and move between them at an easy pace. Pause between poses to notice your footing and breath.'],
    video:{id:'4C-gxOE0j7s', title:'5-Minute Morning Yoga', author:'Yoga With Adriene', language:'EN'}},
  {id:'meditation', minutes:5, title:['Пауза для внимания','Diqqət üçün fasilə','A pause for attention'],
    description:['Сядьте удобно. Заметьте звуки вокруг, затем ощущение опоры. Когда внимание уходит, мягко возвращайте его к одному из этих ощущений.','Rahat oturun. Ətrafdakı səslərə, sonra isə dayaq hissinə diqqət yetirin. Fikriniz yayınanda sakitcə bu hisslərdən birinə qayıdın.','Sit comfortably. Notice sounds around you, then the feeling of support. When your attention wanders, gently return to one of those sensations.'],
    video:{id:'DZ3PwmJdL-E', title:'Hüzur Daxilimdədir', author:'Lala Abdullazada', language:'AZ'}},
  {id:'breathing', minutes:3, title:['Естественное дыхание','Təbii nəfəs','Natural breathing'],
    description:['Устройтесь удобно и наблюдайте обычный вдох и выдох. Сохраняйте естественный ритм дыхания.','Rahat bir vəziyyət alın və adi nəfəs alış-verişinizi müşahidə edin. Təbii ritminizi qoruyun.','Get comfortable and notice each ordinary breath in and out. Let your breathing keep its natural rhythm.']},
  {id:'mobility', minutes:5, title:['Свободное движение','Sərbəst hərəkət','Easy movement'],
    description:['В удобном положении мягко подвигайте плечами, кистями и стопами. Выбирайте небольшую амплитуду, которая ощущается комфортно.','Rahat vəziyyətdə çiyinlərinizi, biləklərinizi və ayaqlarınızı asta hərəkət etdirin. Rahat hiss etdiyiniz kiçik hərəkət aralığını seçin.','In a comfortable position, gently move your shoulders, wrists and feet. Keep the range small and comfortable.']},
  {id:'strength', minutes:5, title:['Своя силовая практика','Öz güc məşqin','Your strength practice'],
    description:['Используйте таймер для знакомых силовых упражнений. Выберите посильный темп и оставьте время на отдых между подходами.','Taymeri tanış güc hərəkətləri üçün istifadə edin. Sizə uyğun temp seçin və setlər arasında dincəlin.','Use the timer for familiar strength exercises. Choose a manageable pace and allow time to rest between sets.']},
  {id:'recovery', minutes:4, title:['Время для отдыха','İstirahət vaxtı','Time to rest'],
    description:['Выберите удобную опору и дайте плечам расслабиться. В конце отметьте в дневнике, как вы себя чувствуете.','Rahat dayaq seçin və çiyinlərinizi boşaldın. Sonda özünüzü necə hiss etdiyinizi gündəlikdə qeyd edin.','Find comfortable support and let your shoulders relax. At the end, record how you feel in your journal.']}
];

export const categories = {
  yoga:['Йога','Yoqa','Yoga'], meditation:['Медитация','Meditasiya','Meditation'],
  breathing:['Дыхание','Nəfəs','Breathing'], mobility:['Мобильность','Hərəkətlilik','Mobility'],
  strength:['Сила','Güc','Strength'], recovery:['Восстановление','Bərpa','Recovery']
};

export const strings = {
 mentor:['Твой наставник','Mentorun','Your mentor'],
 meetMentor:['Познакомиться с наставником','Mentorunla tanış ol','Meet your mentor'],
 mentorRole:['Основатель RESTART и преподаватель йоги','RESTART-ın təsisçisi və yoqa müəllimi','RESTART founder and yoga teacher'],
 mentorStory:['История RESTART','RESTART-ın yaranması','The RESTART story'],
 mentorSport:['Спортивный путь','İdman yolu','Athletic background'],
 mentorTeaching:['Философия преподавания','Tədris fəlsəfəsi','Teaching philosophy'],
 mentorPillars:['Четыре направления RESTART','RESTART-ın dörd istiqaməti','Four pillars of RESTART'],
 today:['Сегодня','Bu gün','Today'], practices:['Практики','Məşqlər','Practices'],
 path:['Мой путь','Yolum','My path'], journal:['Дневник','Gündəlik','Journal'],
 profile:['Профиль','Profil','Profile'], schedule:['Расписание','Cədvəl','Schedule'],
 demo:['Демо · данные на этом устройстве','Demo · məlumatlar bu cihazdadır','Demo · data on this device'],
 welcome:['Добро пожаловать','Xoş gəlmisiniz','Welcome'],
 daily:['Практика дня','Günün məşqi','Daily practice'],
 start:['Начать практику','Məşqə başla','Start practice'], resume:['Продолжить','Davam et','Continue'],
 pause:['Пауза','Fasilə','Pause'], finish:['Завершить','Bitir','Finish'],
 stop:['Закончить без записи','Yadda saxlamadan bitir','End without saving'],
 next:['Ближайшее занятие','Növbəti məşğələ','Next class'],
 sample:['Пример расписания','Nümunə cədvəli','Sample schedule'],
 progress:['Прогресс за неделю','Həftəlik irəliləyiş','Weekly progress'],
 reflect:['Как вы себя чувствуете?','Özünüzü necə hiss edirsiniz?','How are you feeling?'],
 addJournal:['Сделать запись','Qeyd yaz','Write an entry'],
 all:['Все','Hamısı','All'], min:['мин','dəq','min'], sec:['с','san','sec'],
 timer:['Самостоятельная практика с таймером','Taymerlə sərbəst məşq','Self-guided practice with a timer'],
 video:['Открыть на YouTube','YouTube-da aç','Open on YouTube'],
 videoNote:['Стороннее видео · нужен интернет','Kənar video · internet lazımdır','External video · internet required'],
 activeOther:['Уже запущена другая практика','Başqa məşq artıq başladılıb','Another practice is in progress'],
 saved:['Сохранено','Yadda saxlanıldı','Saved'], completed:['Практика сохранена','Məşq yadda saxlanıldı','Practice saved'],
 sessions:['Практики','Məşqlər','Practices'], total:['Время занятий','Məşq müddəti','Practice time'],
 streak:['Дней подряд','Ardıcıl gün','Day streak'], calendar:['Активность за 28 дней','28 günlük aktivlik','28-day activity'],
 history:['История занятий','Məşq tarixçəsi','Practice history'],
 noSessions:['Здесь появятся завершённые практики.','Bitirdiyiniz məşqlər burada görünəcək.','Completed practices will appear here.'],
 goal:['Недельная цель','Həftəlik məqsəd','Weekly goal'],
 goalField:['Практик за неделю','Həftəlik məşq sayı','Practices per week'],
 localNote:['Данные сохраняются в этом браузере на устройстве. При очистке данных браузера или переустановке они могут исчезнуть.','Məlumatlar bu cihazdakı brauzerdə saxlanılır. Brauzer məlumatlarını sildikdə və ya tətbiqi yenidən quraşdırdıqda itə bilər.','Data is saved in this browser on this device. Clearing browser data or reinstalling may erase it.'],
 date:['Дата','Tarix','Date'], mood:['Настроение','Əhval','Mood'],
 energy:['Энергия','Enerji','Energy'], wellbeing:['Самочувствие','Özünü necə hiss edirsən','Wellbeing'],
 notes:['Личные заметки','Şəxsi qeydlər','Personal notes'],
 before:['До практики','Məşqdən əvvəl','Before practice'], after:['После практики','Məşqdən sonra','After practice'],
 save:['Сохранить','Yadda saxla','Save'], edit:['Изменить','Düzəliş et','Edit'],
 remove:['Удалить','Sil','Delete'], cancel:['Отмена','Ləğv et','Cancel'],
 confirmDelete:['Удалить эту запись?','Bu qeydi silmək istəyirsiniz?','Delete this entry?'],
 low:['Низкое','Aşağı','Low'], medium:['Среднее','Orta','Moderate'], high:['Высокое','Yüksək','High'],
 unset:['Не указано','Göstərilməyib','Unspecified'], entries:['Мои записи','Qeydlərim','My entries'],
 emptyNotes:['Записей пока нет.','Hələ qeyd yoxdur.','No entries yet.'],
 scheduleNote:['Это пример. Реальные занятия и запись на них появятся после подключения расписания RESTART.','Bu bir nümunədir. RESTART cədvəli qoşulduqdan sonra real məşğələlər və qeydiyyat görünəcək.','This is a sample. Live classes and bookings will appear when the RESTART schedule is connected.'],
 classTitle:['Групповая йога','Qrup yoqası','Group yoga'],
 classDetail:['Пример карточки группового занятия с датой и временем.','Tarix və saatı olan qrup məşğələsi kartının nümunəsi.','Example group class with a date and time.'],
 previous:['Предыдущая неделя','Əvvəlki həftə','Previous week'], nextWeek:['Следующая неделя','Növbəti həftə','Next week'],
 noClass:['На этот день нет занятий в примере.','Nümunədə bu günə məşğələ düşmür.','No sample classes on this date.'],
 name:['Имя на этом устройстве','Bu cihazda görünən ad','Name on this device'],
 reminders:['Напоминания','Xatırlatmalar','Reminders'],
 reminderNote:['Напоминания видны в открытом приложении. При закрытом приложении уведомления не приходят.','Xatırlatmalar tətbiq açıq olduqda görünür. Tətbiq bağlı olanda bildiriş gəlmir.','Reminders appear while the app is open. Notifications are not delivered when it is closed.'],
 remindPractice:['Практика на сегодня','Bu günün məşqi','Today’s practice'],
 remindSchedule:['Сегодня есть занятие в примере расписания','Nümunə cədvəlində bu gün məşğələ var','Today has a class on the sample schedule'],
 remindGoal:['Недельная цель ещё не достигнута','Həftəlik məqsədə hələ çatmamısınız','Weekly goal still in progress'],
 reminderTime:['Местное время','Yerli vaxt','Local time'],
 install:['Установить RESTART','RESTART-ı quraşdır','Install RESTART'],
 installed:['Открыто как приложение','Tətbiq kimi açılıb','Running as an app'],
 installHelp:['В Chrome откройте меню ⋮ → «Установить приложение» или «Добавить на главный экран».','Chrome-da ⋮ menyusunu açın və tətbiqi quraşdırın və ya əsas ekrana əlavə edin.','In Chrome, open ⋮ and choose Install app or Add to Home screen.'],
 site:['Публичный сайт RESTART','RESTART-ın açıq saytı','RESTART public website'],
 offline:['Нет сети · локальные функции доступны','Şəbəkə yoxdur · yerli funksiyalar işləyir','Offline · local features are available'],
 storageError:['Браузер не сохранил данные. Они могут пропасть при закрытии страницы.','Brauzer məlumatları saxlamadı. Səhifəni bağlayanda məlumatlar itə bilər.','The browser could not save data. It may be lost when this page closes.'],
 update:['Обновить приложение','Tətbiqi yenilə','Update app'],
 updateConfirm:['Обновить приложение? Несохранённый ввод будет сброшен.','Tətbiq yenilənsin? Yadda saxlanmamış məlumatlar itəcək.','Update the app? Unsaved changes will be cleared.']
};


export const mentorContent = {
 history: [
  'Эльхан основал RESTART, чтобы соединить физическое развитие с внутренним равновесием. Спортивная дисциплина, йога и медитация стали основой школы.',
  'Elxan fiziki inkişafı daxili tarazlıqla birləşdirmək üçün RESTART-ı qurdu. İdman intizamı, yoqa və meditasiya məktəbin əsasını təşkil edir.',
  'Elxan founded RESTART to bring physical development and inner balance together. The school draws on athletic discipline, yoga and meditation.'
 ],
 background: [
  ['Чемпион мира и Европы по каратэ','Karate üzrə dünya və Avropa çempionu','World and European karate champion'],
  ['Мастер владения нунчаками','Nunçaku ustası','Nunchaku practitioner']
 ],
 teaching: [
  'На занятиях Эльхан соединяет движение, дыхание и внимание. Он предлагает замечать привычки тела и выбирать темп, в котором движение остаётся осознанным.',
  'Elxan dərslərində hərəkəti, nəfəsi və diqqəti birləşdirir. O, bədənin vərdişlərini müşahidə etməyi və şüurlu hərəkət etməyə imkan verən temp seçməyi tövsiyə edir.',
  'Elxan brings movement, breath and attention together. He encourages students to notice their movement habits and choose a pace at which they can move with awareness.'
 ],
 pillars: {
  MIND:['Замечать свои реакции и делать выбор осознанно.','Reaksiyalarını sez və şüurlu seçim et.','Notice your reactions and make deliberate choices.'],
  BODY:['Развивать силу и чувствовать, как движется тело.','Gücünü artır və bədəninin necə hərəkət etdiyini hiss et.','Build strength and pay attention to how your body moves.'],
  NUTRITION:['Выстраивать привычки питания, которые вписываются в вашу жизнь.','Həyatına uyğun qidalanma vərdişləri qur.','Build eating habits that fit your life.'],
  LIFE:['Находить в повседневности время для важного и для отдыха.','Gündəlik həyatda vacib işlərə və istirahətə vaxt ayır.','Make room for what matters and for rest.']
 }
};
