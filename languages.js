const russianLessons = {
  yoga: {name:'Йога', description:'Мягкое движение и внимание к телу.', lessons:[
    ['Утренняя разминка','Начните стоя, оставив достаточно места вокруг себя.',[
      'Поставьте стопы на ширину таза. Почувствуйте опору и слегка смягчите колени.',
      'Медленно поднимайте и опускайте плечи. Затем сделайте несколько небольших кругов плечами.',
      'Плавно перенесите вес с одной стопы на другую. Завершите в центре.']],
    ['Пауза за столом','Сядьте на устойчивый стул, поставьте обе стопы на пол.',[
      'Вытянитесь макушкой вверх, положив ладони на бёдра.',
      'По очереди тянитесь рукой к потолку в удобном диапазоне. Опускайте руку с выдохом.',
      'Мягко сведите лопатки, затем отпустите. Между повторениями отдыхайте.']]]},
  breath: {name:'Дыхание', description:'Спокойные упражнения в своём темпе.', lessons:[
    ['Ровное дыхание','Устройтесь удобно. Дышите без усилия и задержек.',[
      'Заметьте несколько обычных вдохов и выдохов.',
      'Мысленно считайте вдох и выдох до одинакового удобного числа. Можно начать с двух.',
      'Отпустите счёт и понаблюдайте за естественным ритмом.']],
    ['Дыхание с ладонью','Положите ладонь на нижние рёбра поверх одежды.',[
      'Заметьте движение под ладонью при обычном вдохе.',
      'Проследите за движением рёбер на выдохе. Дышите свободно.',
      'Опустите руку и понаблюдайте ещё несколько циклов.']]]},
  meditation: {name:'Медитация', description:'Тихие занятия для тренировки внимания.', lessons:[
    ['Сканирование тела','Сядьте или лягте. Можно прикрыть глаза.',[
      'Направьте внимание к стопам. Отметьте тепло, давление или контакт с полом.',
      'Переведите внимание к ладоням, плечам и лицу. Замечайте ощущения по очереди.',
      'Почувствуйте тело целиком. В конце откройте глаза и осмотритесь.']],
    ['Звуки вокруг','Сядьте удобно и дайте взгляду остановиться на одной точке.',[
      'Прислушайтесь к ближайшему звуку. Заметьте его начало и окончание.',
      'Расширьте внимание и прислушайтесь к отдалённым звукам.',
      'Если отвлеклись, мягко вернитесь к слушанию. В конце почувствуйте опору.']]]}
};
const lessonsByLanguage = {
  ru: russianLessons,
  az: {
    yoga:{name:'Yoqa',description:'Yüngül hərəkətlərlə bədəninizi hiss edin.',lessons:[
      ['Səhər isinməsi','Ayaq üstə durun və ətrafınızda rahat hərəkət etmək üçün yer saxlayın.',[
        'Ayaqlarınızı çanaq enində açın. Ayaqlarınızın yerə təmasını hiss edin və dizlərinizi azca bükün.',
        'Çiyinlərinizi yavaşca qaldırıb endirin. Sonra çiyinlərinizlə kiçik dairələr çəkin.',
        'Ağırlığınızı yavaşca bir ayaqdan digərinə keçirin. Sonda hər iki ayağınıza bərabər söykənin.']],
      ['Masa arxasında fasilə','Möhkəm stulda oturun və hər iki ayağınızı yerə qoyun.',[
        'Əllərinizi budlarınızın üstünə qoyun və başınızı dik tutun.',
        'Əllərinizi növbə ilə rahat bacardığınız qədər yuxarı uzadın. Nəfəs verərkən qolunuzu endirin.',
        'Kürək sümüklərinizi yüngülcə bir-birinə yaxınlaşdırıb sərbəst buraxın. Təkrarlar arasında dincəlin.']]]},
    breath:{name:'Nəfəs',description:'Öz ritminizdə sakit nəfəs məşqləri.',lessons:[
      ['Bərabər nəfəs','Rahat yerləşin. Nəfəsinizi saxlamadan sərbəst nəfəs alın.',[
        'Bir neçə dəfə adi qaydada nəfəs alın və verin. Ritminizi müşahidə edin.',
        'Nəfəs alıb-verərkən hər dəfə eyni ədədə qədər sayın. İkidən başlaya bilərsiniz.',
        'Saymağı dayandırın və nəfəsinizin təbii ritminə diqqət yetirin.']],
      ['Əlinizlə nəfəsi hiss edin','Əlinizi paltarınızın üstündən alt qabırğalarınıza qoyun.',[
        'Adi qaydada nəfəs alarkən əlinizin altındakı hərəkəti hiss edin.',
        'Nəfəs verərkən qabırğalarınızın hərəkətini izləyin. Sərbəst nəfəs alın.',
        'Əlinizi endirin və bir neçə nəfəs boyunca ritminizi müşahidə edin.']]]},
    meditation:{name:'Meditasiya',description:'Diqqəti toplamaq üçün sakit məşqlər.',lessons:[
      ['Bədəni hiss etmək','Oturun və ya uzanın. İstəsəniz, gözlərinizi yumun.',[
        'Diqqətinizi ayaqlarınıza yönəldin. İstiliyi, təzyiqi və ya yerə təması hiss edin.',
        'Diqqətinizi növbə ilə ovuclarınıza, çiyinlərinizə və üzünüzə yönəldin.',
        'Bədəninizi bütöv şəkildə hiss edin. Sonda gözlərinizi açıb ətrafa baxın.']],
      ['Ətrafdakı səslər','Rahat oturun və baxışınızı bir nöqtədə saxlayın.',[
        'Yaxındakı bir səsi dinləyin. Harada başlayıb harada bitdiyinə diqqət yetirin.',
        'İndi daha uzaqdan gələn səsləri də dinləyin.',
        'Fikriniz yayınsa, yenidən səslərə qayıdın. Sonda oturduğunuz yeri hiss edin.']]]}},
  en:{
    yoga:{name:'Yoga',description:'Gentle movement and body awareness.',lessons:[
      ['Morning mobility','Stand with room to move comfortably.',[
        'Place your feet hip-width apart. Feel the ground and soften your knees.','Slowly lift and lower your shoulders, then make a few small shoulder circles.','Shift your weight gently from foot to foot. Finish with your weight evenly balanced.']],
      ['A break at your desk','Sit on a stable chair with both feet on the floor.',[
        'Rest your palms on your thighs and lengthen the back of your neck.','Reach one arm at a time toward the ceiling within a comfortable range. Lower it as you breathe out.','Gently draw your shoulder blades together and release. Rest between repetitions.']]]},
    breath:{name:'Breathwork',description:'Quiet breathing exercises at your own pace.',lessons:[
      ['Even breathing','Settle into a comfortable position. Breathe freely without holding your breath.',[
        'Notice a few ordinary breaths.','Count to the same comfortable number on each inhale and exhale. Try starting with two.','Let the counting go and notice your natural rhythm.']],
      ['Breathing with your palm','Rest a hand over your lower ribs, on top of your clothes.',[
        'Feel the movement under your palm as you breathe in.','Follow the movement of your ribs as you breathe out. Let the breath flow easily.','Lower your hand and notice a few more breaths.']]]},
    meditation:{name:'Meditation',description:'Quiet sessions to practise paying attention.',lessons:[
      ['Body scan','Sit or lie down. Close your eyes if you like.',[
        'Bring your attention to your feet. Notice warmth, pressure or contact with the ground.','Move your attention to your palms, shoulders and face, noticing each area in turn.','Sense your whole body. Open your eyes and look around.']],
      ['Listening around you','Sit comfortably and let your gaze settle in one place.',[
        'Listen for a nearby sound. Notice when it begins and ends.','Widen your attention to sounds farther away.','When your thoughts wander, return to listening. Finish by feeling the support beneath you.']]]}}
};
// Each row is a single interface string in Russian, Azerbaijani and English.
const phrases = {
  practices:['Практики','Məşqlər','Practices'],about:['Об авторе','Müəllif haqqında','About Elxan'],profile:['Мой прогресс','İrəliləyişim','My progress'],
  studio:['Онлайн-студия Эльхана','Elxanın onlayn studiyası','Elxan’s online studio'],
  headline:['В своём','Öz','At your own'],accent:['ритме.','ritmində.','pace.'],
  lead:['Йога, дыхание и медитация. Выберите занятие и уделите несколько минут себе.','Yoqa, nəfəs və meditasiya. Bir məşq seçin və özünüzə bir neçə dəqiqə ayırın.','Yoga, breathwork and meditation. Choose a practice and take a few minutes for yourself.'],
  choose:['Выбрать практику','Məşq seç','Explore practices'],collection:['Коллекция практик','Məşq kolleksiyası','Practice collection'],
  back:['← Все направления','← Bütün istiqamətlər','← All practices'],length:['Продолжительность','Müddət','Duration'],
  start:['Начать','Başla','Start'],reset:['Сброс','Sıfırla','Reset'],pause:['Пауза','Fasilə','Pause'],resume:['Продолжить','Davam et','Resume'],again:['Повторить','Təkrarla','Repeat'],
  ready:['Готово к началу','Başlamağa hazırsınız','Ready to begin'],paused:['На паузе','Fasilədə','Paused'],done:['Практика завершена','Məşq tamamlandı','Practice complete'],step:['Шаг {n} из 3','3 addımdan {n}-cisi','Step {n} of 3'],
  minute:['мин','dəq','min'],sessions:['Завершено занятий','Tamamlanmış məşqlər','Sessions completed'],minutes:['Минут практики','Məşq dəqiqələri','Minutes practised'],
  history:['Последние занятия','Son məşqlər','Recent sessions'],empty:['Завершите первое занятие, и оно появится здесь.','İlk məşqinizi bitirdikdə burada görünəcək.','Finish your first session to see it here.'],
  local:['История занятий сохраняется в этом браузере.','Məşq tarixçəsi bu brauzerdə saxlanılır.','Your practice history is saved in this browser.'],
  unavailable:['Хранилище браузера недоступно. История сохраняется до закрытия страницы.','Brauzer yaddaşı əlçatan deyil. Tarixçə səhifə bağlanana qədər qalacaq.','Browser storage is unavailable. History lasts until you close this page.'],
  bio:['Я Эльхан, преподаватель йоги. Здесь можно начать утро с движения, сделать дыхательную паузу среди дня или провести несколько минут в тишине.','Mən Elxanam, yoqa müəllimiyəm. Burada səhərə hərəkətlə başlaya, gün ərzində nəfəs məşqi edə və ya bir neçə dəqiqəni sakitlikdə keçirə bilərsiniz.','I’m Elxan, a yoga teacher. Start your morning with movement, take a breathing break in the afternoon or spend a few minutes in stillness.'],
  top:['Наверх ↑','Yuxarı ↑','Back to top ↑'],language:['Язык','Dil','Language'],nav:['Основное меню','Əsas menyu','Main menu'],lessons:['Занятия','Məşqlər','Sessions'],
  page:['Студия практик','Məşq studiyası','Practice studio'],inhale:['Вдох','Nəfəs al','Breathe in'],exhale:['Выдох','Nəfəs ver','Breathe out']
};
Object.assign(phrases,{
  studio:['Международная онлайн-студия','Beynəlxalq onlayn studiya','International online studio'],
  collection:['Библиотека авторских занятий','Müəllif məşqləri kitabxanası','Guided practice library'],
  skip:['Перейти к занятиям','Məşqlərə keç','Skip to practices'],
  teacher:['Преподаватель','Müəllim','Teacher'], founder:['Основатель и преподаватель','Təsisçi və müəllim','Founder and teacher'],
  founderBio:['Основатель Yoga Space и первый преподаватель студии. Ведёт занятия по йоге, дыханию и медитации.','Yoga Space studiyasının təsisçisi və ilk müəllimidir. Yoqa, nəfəs və meditasiya məşqləri keçir.','Founder of Yoga Space and its first teacher. Guides yoga, breathwork and meditation sessions.'],
  distinctions:['Достижения','Nailiyyətlər','Achievements'],karate:['Четырёхкратный чемпион мира по карате.','Karate üzrə dördqat dünya çempionu.','Four-time world karate champion.'],
  approach:['Подход к практике','Məşqə yanaşma','Teaching approach'],
  method:['В занятиях студии движение сочетается с вниманием к дыханию. Вы сами выбираете длительность и можете сделать паузу на любом этапе.','Studiyanın məşqlərində hərəkət nəfəsə diqqətlə birləşir. Müddəti özünüz seçirsiniz və istənilən mərhələdə fasilə verə bilərsiniz.','Studio sessions pair movement with attention to the breath. Choose your own duration and pause at any step.'],
  direction:['Направление','İstiqamət','Discipline'],level:['Сложность','Səviyyə','Level'],recommended:['Рекомендуемое время','Tövsiyə olunan müddət','Suggested duration'],goal:['Цель','Məqsəd','Goal'],all:['Все','Hamısı','All'],
  introductory:['Вводный','Giriş','Introductory'],basic:['Базовый','Əsas','Foundational'],movement:['Размяться','Bədəni isitmək','Move gently'],release:['Расслабиться','Rahatlamaq','Unwind'],focus:['Собраться','Diqqəti toplamaq','Find focus'],
  found:['Найдено занятий: ','Tapılan məşqlərin sayı: ','Practices found: '],clear:['Сбросить фильтры','Filtrləri sıfırla','Clear filters'],
  favorite:['В избранное','Seçilmişlərə əlavə et','Save to favourites'],savedFav:['В избранном','Seçilmişlərdə','In favourites'],favorites:['Избранные практики','Seçilmiş məşqlər','Favourite practices'],favEmpty:['Добавьте занятие в избранное из библиотеки.','Kitabxanadan məşqi seçilmişlərə əlavə edin.','Save a practice from the library to see it here.'],
  videos:['Видеоуроки','Video dərslər','Video lessons'],soon:['Скоро','Tezliklə','Coming soon'],
  liveNav:['Расписание','Cədvəl','Schedule'],live:['Занятия с преподавателем','Müəllimlə məşqlər','Practise with a teacher'],schedule:['Расписание','Dərs cədvəli','Schedule'],format:['Формат занятия','Məşqin formatı','Session format'],
  individual:['Индивидуально','Fərdi','One to one'],groupClass:['В группе','Qrupda','Group'],
  noIndividual:['Даты индивидуальных занятий пока не опубликованы.','Fərdi məşqlərin tarixləri hələ dərc edilməyib.','Individual session dates have yet to be announced.'],
  noGroup:['Даты групповых занятий пока не опубликованы.','Qrup məşqlərinin tarixləri hələ dərc edilməyib.','Group session dates have yet to be announced.'],
  draftTitle:['Черновик заявки','Müraciətin qaralaması','Request draft'],draftHint:['Запишите удобное время для выбранного формата. Черновик останется в этом браузере. Отправка преподавателю и бронирование пока недоступны.','Seçdiyiniz format üçün uyğun vaxtı qeyd edin. Qaralama bu brauzerdə qalacaq. Müəllimə göndəriş və yer sifarişi hələ mümkün deyil.','Note a suitable time for the selected format. The draft stays in this browser. Submission and booking are not yet available.'],
  preferred:['Когда вам удобно?','Hansı vaxt sizə uyğundur?','When would suit you?'],saveDraft:['Сохранить черновик','Qaralamanı saxla','Save draft'],draftSaved:['Черновик сохранён на устройстве.','Qaralama cihazda saxlanıldı.','Draft saved on this device.'],draftFail:['Браузер не разрешил сохранить черновик.','Brauzer qaralamanı saxlamağa icazə vermədi.','Your browser could not save the draft.'],
  milestones:['Достижения в практике','Məşq nailiyyətləriniz','Practice milestones'],first:['Первое завершённое занятие','İlk tamamlanmış məşq','First session completed'],variety:['Три направления','Üç istiqamət','All three disciplines'],hour:['Час практики','Bir saatlıq məşq','One hour of practice'],earned:['Получено','Qazanılıb','Earned'],
  history:['История занятий','Məşq tarixçəsi','Practice history']
});
Object.assign(phrases,{
  slogan:['Где тело, разум и дух обретают единство.','Bədən, ağıl və ruhun vəhdət tapdığı məkan.','Where body, mind, and spirit become one.'],
  studio:['Международная онлайн-студия йоги','Beynəlxalq onlayn yoqa studiyası','International online yoga studio'],
  philosophyNav:['Философия','Fəlsəfə','Philosophy'],philosophy:['Наша философия','Fəlsəfəmiz','Our philosophy'],
  harmony:['Гармония тела и разума','Bədən və ağılın harmoniyası','Harmony of body and mind'],
  harmonyText:['Движение, дыхание и осознанность помогают почувствовать тело и найти внутреннее равновесие.','Hərəkət, nəfəs və fərqindəlik bədəni duymağa və daxili tarazlığı tapmağa kömək edir.','Movement, breath and awareness help us feel at home in the body and find inner balance.'],
  strength:['Сила и дисциплина','Güc və intizam','Strength and discipline'],
  strengthText:['Физическое развитие требует терпения. Устойчивость рождается в том, как мы действуем и возвращаемся к практике.','Fiziki inkişaf səbir tələb edir. Dözümlülük düşünülmüş addımlarımız və məşqə davamlı qayıtmağımızla formalaşır.','Physical development takes patience. Resilience grows through deliberate action and the simple act of returning to practice.'],
  spirit:['Духовное развитие и самопознание','Mənəvi inkişaf və özünüdərk','Spiritual growth and self-knowledge'],
  spiritText:['В тишине практики мы исследуем свой внутренний мир, замечаем ощущения и прислушиваемся к тому, что для нас важно.','Məşqin sakitliyində daxili dünyamızı araşdırır, duyğularımızı sezir və bizim üçün dəyərli olana qulaq asırıq.','In the quiet of practice, we explore our inner world, notice sensations and listen for what matters to us.'],
  aboutFounder:['Об основателе','Təsisçi haqqında','About the founder'],founder:['Основатель Yoga Space','Yoga Space-in təsisçisi','Founder of Yoga Space'],
  team:['Наши преподаватели','Müəllimlərimiz','Our teachers'],backTeam:['← К преподавателям','← Müəllimlərə qayıt','← Back to teachers'],
  role:['Основатель и первый преподаватель Yoga Space','Yoga Space-in təsisçisi və ilk müəllimi','Founder and first teacher of Yoga Space'],
  origins:['Сила начинается с осознанности','Güc fərqindəlikdən başlayır','Strength begins with awareness'],
  origins1:['Я верю, что настоящая сила человека определяется не только физическими возможностями, но и способностью понимать себя, сохранять внутреннее равновесие и осознанно управлять своими действиями.','Məncə, insanın həqiqi gücü həm fiziki imkanlarında, həm də özünü anlamaq, daxili tarazlığını qorumaq və davranışlarını şüurlu şəkildə yönləndirmək bacarığındadır.','I believe that true strength lies in our physical abilities and in our capacity to understand ourselves, stay balanced and act with intention.'],
  origins2:['Мой путь связан со спортом, боевыми искусствами, дисциплиной и постоянным стремлением к развитию. Этот опыт сформировал моё отношение к телу, разуму и внутреннему состоянию человека.','İdman, döyüş sənətləri, intizam və daim inkişaf etmək istəyi keçdiyim yolun bir hissəsidir. Bu təcrübə insanın bədəninə, ağlına və daxili aləminə baxışımı formalaşdırıb.','Sport, martial arts, discipline and a steady desire to grow have shaped my path. Those experiences shaped how I think about the body, the mind and our inner lives.'],
  origins3:['Со временем я пришёл к пониманию, что физическая сила и внутренняя гармония не противоречат друг другу. Напротив, они способны дополнять и усиливать друг друга.','Zaman keçdikcə anladım ki, fiziki güclə daxili harmoniya bir-birini tamamlayır və gücləndirir.','Over time I came to see how physical strength and inner harmony can complement and deepen one another.'],
  origins4:['Дисциплина помогает нам двигаться вперёд. Осознанность позволяет понимать, куда мы движемся. А внутреннее равновесие помогает не терять себя на этом пути.','İntizam irəli getməyə kömək edir. Fərqindəlik hara yönəldiyimizi anlamağa imkan verir. Daxili tarazlıq isə bu yolda özümüzü itirməməyə kömək edir.','Discipline helps us move forward. Awareness lets us see where we are going. Inner balance helps us stay true to ourselves along the way.'],
  why:['Почему я создал Yoga Space','Yoga Space-i niyə yaratdım','Why I created Yoga Space'],
  why1:['Я хотел создать пространство, в котором человек сможет не просто выполнять упражнения, а постепенно открывать новые стороны самого себя.','İstəyirdim ki, insan burada məşq edərkən özünün yeni tərəflərini də tədricən kəşf edə bilsin.','I wanted to create a space where, through practice, people could gradually discover new sides of themselves.'],
  why2:['Место, где движение становится способом почувствовать тело, дыхание — возможностью сосредоточиться, а медитация — практикой внимательного отношения к своему внутреннему миру.','Elə bir məkan ki, hərəkət bədəni duymağa, nəfəs diqqəti toplamağa, meditasiya isə daxili aləmə qayğı ilə yanaşmağa imkan versin.','A place where movement is a way to feel the body, breathing offers a moment of focus, and meditation teaches us to attend to our inner world.'],
  myPhilosophy:['Моя философия','Mənim fəlsəfəm','My philosophy'],
  belief1:['Сила без осознанности может стать напряжением. Дисциплина без внутреннего равновесия — ограничением. А стремление к гармонии без действия может остаться лишь намерением.','Fərqindəlik olmayanda güc gərginliyə, daxili tarazlıq olmayanda intizam məhdudiyyətə çevrilə bilər. Hərəkətə keçməyəndə isə harmoniyaya can atmaq sadəcə niyyət olaraq qalır.','Without awareness, strength can turn into tension. Without inner balance, discipline can become restrictive. Without action, the wish for harmony may remain an intention.'],
  belief2:['Именно поэтому я стремлюсь объединять эти качества в единую практику.','Buna görə də bu keyfiyyətləri vahid məşqdə birləşdirməyə çalışıram.','That is why I bring these qualities together in one practice.'],
  belief3:['Yoga Space — это не стремление стать кем-то другим. Это возможность глубже познакомиться с тем, кем ты уже являешься.','Yoga Space başqa birinə çevrilmək cəhdi deyil. Bura artıq kim olduğunu daha dərindən anlamaq üçün bir imkandır.','Yoga Space is a chance to get to know who you already are, without trying to become someone else.']
});
Object.assign(phrases,{
  international:['Международные достижения','Beynəlxalq nailiyyətlər','International achievements'],byFounder:['Сведения из личной биографии, предоставленной Эльханом.','Elxanın təqdim etdiyi şəxsi bioqrafiyadan.','From Elxan’s own account of his career.'],
  worldFour:['Четырёхкратный чемпион мира по каратэ','Karate üzrə dördqat dünya çempionu','Four-time world karate champion'],europe:['Чемпион Европы по каратэ','Karate üzrə Avropa çempionu','European karate champion'],mastery:['Мастер владения нунчаками','Nunçaku ustası','Nunchaku master'],finalist:['Финалист турецкого шоу талантов','Türkiyədə keçirilən istedad şousunun finalçısı','Finalist on a Turkish talent show'],
  art:['Искусство владения нунчаками','Nunçaku sənəti','The art of nunchaku'],artCopy:['В сценических выступлениях Эльхана на первый план выходят ритм, координация и контроль движения. В его Instagram можно посмотреть запись на берегу моря.','Elxanın səhnə çıxışlarında ritm, koordinasiya və hərəkətə nəzarət ön plana çıxır. Dəniz sahilində çəkilmiş videonu onun Instagram səhifəsində izləyə bilərsiniz.','Rhythm, coordination and control of movement are central to Elxan’s stage performances. His Instagram includes a performance filmed by the sea.'],
  stage:['Международная сцена','Beynəlxalq səhnə','International stage'],stageCopy:['Haberler со ссылкой на Acunn.com сообщает, что 28 января 2016 года в эфире Yetenek Sizsiniz Türkiye Эльхан и его команда выступили с нунчаками, получили три голоса жюри и прошли во второй тур. В публикации описан именно этот этап.','Haberler, Acunn.com-a istinadən, 28 yanvar 2016-cı ildə Yetenek Sizsiniz Türkiye verilişində Elxanın komandası ilə nunçaku çıxışı etdiyini, münsiflərdən üç müsbət səs alaraq ikinci tura keçdiyini bildirir. Məqalədə məhz həmin mərhələ təsvir olunur.','Haberler, citing Acunn.com, reports that Elxan and his team performed with nunchaku on Yetenek Sizsiniz Türkiye on 28 January 2016. Three jury votes took them through to the second round covered by the report.'],
  archive:['Личный архив','Şəxsi arxiv','Personal archive'],performanceLabel:['Выступление у моря · видео автора','Dəniz sahilində çıxış · müəllifin videosu','Seaside performance · Elxan’s video'],bySea:['Практика у моря','Dəniz sahilində məşq','Practice by the sea'],awardPost:['Награждение · публикация автора','Təltif mərasimi · müəllifin paylaşımı','Awards ceremony · Elxan’s post'],
  courses:['Программы','Proqramlar','Programmes'],planner:['Мой план','Planım','My plan'],pricing:['Форматы доступа','İstifadə imkanları','Access options'],
  morningSeries:['Движение в течение дня','Gün ərzində hərəkət','Movement through the day'],breathSeries:['Знакомство с дыханием','Nəfəslə tanışlıq','Getting to know your breath'],mindSeries:['Тело и звуки','Bədən və səslər','Body and sound'],moveSeries:['Осознанная пауза','Şüurlu fasilə','A mindful break'],restSeries:['Возвращение к покою','Sakitliyə qayıdış','Returning to stillness'],
  awareMove:['Осознанное движение','Şüurlu hərəkət','Mindful movement'],flexibility:['Гибкость и мобильность','Elastiklik və hərəkətlilik','Flexibility and mobility'],balance:['Сила и баланс','Güc və tarazlıq','Strength and balance'],recovery:['Восстановление и расслабление','Bərpa və rahatlama','Recovery and relaxation'],
  search:['Поиск по программе или уроку','Proqram və ya dərs axtar','Search programmes or lessons'],access:['Доступ','Giriş növü','Access'],free:['Бесплатно','Ödənişsiz','Free'],paidCourse:['Авторский видеокурс','Müəllifin video kursu','Paid video course'],premium:['Yoga Space Premium','Yoga Space Premium','Yoga Space Premium'],privateClass:['Индивидуальные занятия','Fərdi məşqlər','Private sessions'],
  foundCourses:['Найдено программ: ','Tapılan proqramların sayı: ','Programmes found: '],modules:['Модули практики','Məşq modulları','Practice modules'],courseProgress:['Завершено модулей','Tamamlanan modullar','Modules completed'],guidedText:['Самостоятельная практика с инструкциями и таймером','Təlimat və taymerlə müstəqil məşq','Self-guided practice with instructions and a timer'],videoPending:['Скоро. Видеоуроки и программа курса готовятся.','Tezliklə. Video dərslər və kurs proqramı hazırlanır.','Coming soon. The video lessons and syllabus are in preparation.'],
  weeklyTarget:['Занятий в неделю','Həftəlik məşq sayı','Sessions per week'],buildPlan:['Сохранить недельный план','Həftəlik planı saxla','Save weekly plan'],noPlanMatch:['Такого сочетания пока нет. Попробуйте выбрать «Все» в одном из фильтров.','Bu seçimlərə uyğun məşq hələ yoxdur. Filtrlərdən birində «Hamısı» seçin.','No practice matches this combination yet. Try selecting All in one filter.'],planSaved:['Недельный план сохранён.','Həftəlik plan saxlanıldı.','Weekly plan saved.'],weekly:['Занятий на этой неделе','Bu həftə tamamlanan məşqlər','Sessions this week'],noPlan:['Выберите параметры, чтобы составить неделю из доступных практик.','Mövcud məşqlərdən həftəlik plan yaratmaq üçün seçimlərinizi edin.','Choose your preferences to build a week from the available practices.'],
  completedProgrammes:['Пройденные программы','Tamamlanmış proqramlar','Completed programmes'],noCompleted:['Завершите все модули одной программы.','Bir proqramın bütün modullarını tamamlayın.','Complete every module in a programme to see it here.'],likedProgrammes:['Избранные программы','Seçilmiş proqramlar','Favourite programmes'],
  localProfile:['Профиль на этом устройстве','Bu cihazdakı profil','Profile on this device'],alias:['Имя для профиля','Profil adı','Profile name'],saveName:['Сохранить имя','Adı saxla','Save name'],
  freeOffer:['Базовые практики, таймер и недельные планы доступны сейчас.','Əsas məşqlər, taymer və həftəlik planlar artıq açıqdır.','Basic practices, the timer and weekly plans are available now.'],paidCourseOffer:['Отдельная покупка выбранного курса с видеоуроками автора.','Seçilmiş müəllif kursunu video dərslərlə birlikdə ayrıca almaq.','A single purchase for a selected course of original video lessons.'],premiumOffer:['Подписка на расширенную библиотеку студии.','Studiyanın genişləndirilmiş kitabxanasına abunə.','A subscription to the extended studio library.'],privateClassOffer:['Персональное занятие с преподавателем с отдельной оплатой.','Müəllimlə ayrıca ödənilən fərdi məşq.','An individually priced session with a teacher.'],planned:['Планируется · оплата закрыта','Planlaşdırılır · ödəniş bağlıdır','Planned · checkout unavailable'],
  membership:['Покупки и подписка','Alışlar və abunəlik','Purchases and subscription'],commerceHint:['Покупки, управление подпиской и оплаченный доступ появятся после запуска оплаты.','Alışlar, abunəliyin idarə edilməsi və ödənişli giriş ödəniş sistemi işə düşəndə açılacaq.','Purchases, subscription management and paid access will open when billing launches.'],
  bookingHistory:['Заявки на этом устройстве','Bu cihazdakı müraciətlər','Requests on this device'],draftCancelled:['Локальный черновик отменён.','Yerli qaralama ləğv edildi.','Local draft cancelled.'],cancelDraft:['Отменить черновик','Qaralamanı ləğv et','Cancel draft']
});

Object.assign(phrases,{
 nextModule:['К следующему модулю','Növbəti modula keç','Go to next module'],
 moreNav:['Ещё','Digər bölmələr','More'], way:['Мой путь','Keçdiyim yol','My journey'],
 transition:['От силы к гармонии','Gücdən harmoniyaya','From strength to harmony'],
 guest:['Гость · локальный профиль','Qonaq · yerli profil','Guest · local profile']
});
