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
