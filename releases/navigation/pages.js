'use strict';

const headlines={
 home:['Сила начинается внутри','Güc daxildən başlayır','Strength begins within'],
 about:['Четыре направления, один путь','Dörd istiqamət, bir yol','Four disciplines, one path'],
 programme:['56 дней практики','56 günlük təcrübə','56 days of practice'],
 signup:['Участие в RESTART','RESTART-da iştirak','Join RESTART'],
 progress:['Мой прогресс','İrəliləyişim','My progress']
};
const pageIntros={
 home:['Школа движения, внимания и дисциплины. Начните с одного действия и перенесите его в повседневную жизнь.','Hərəkət, diqqət və intizam məktəbi. Bir addımla başlayın və öyrəndiyinizi gündəlik həyatda tətbiq edin.','A school of movement, attention and discipline. Start with one action and bring it into daily life.'],
 method:['Классическая йога, японские традиции и авторский метод школы.','Klassik yoqa, yapon ənənələri və məktəbin öz metodu.','Classical yoga, Japanese traditions and the school’s own method.'],
 journal:['Ваши заметки сохраняются в браузере на этом устройстве.','Qeydləriniz bu cihazın brauzerində saxlanılır.','Your notes are stored in this browser on this device.']
};
function homeMotto(){
 return t('Не стать другим. Раскрыть себя.','Başqasına çevrilmə. Özünü kəşf et.','Discover who you are.');
}
function homeFounder(){
 return t('Elxan Gülmalıyev · основатель RESTART','Elxan Gülmalıyev · RESTART-ın təsisçisi','Elxan Gülmalıyev · founder of RESTART');
}
function homeActions(){
 return go('practices',t('Выбрать практику','Məşq seç','Find a practice'))+
  go('academy',t('Открыть Академию','Akademiyaya keç','Explore Academy')).replace('class="cta"','class="cta secondary"');
}

function homePage(){
 const pathways=[
  {
   href:pageUrl('practices')+'#course/yoga',image:'yoga.webp',width:432,height:540,
   title:t('Йога и движение','Yoqa və hərəkət','Yoga and movement'),
   copy:t('Развивайте подвижность и внимание к телу.','Hərəkətliliyinizi artırın və bədəninizə diqqət yetirin.','Build mobility and awareness of your body.')
  },
  {
   href:pageUrl('practices')+'#course/breathing',image:'breath.webp',width:540,height:540,
   title:t('Дыхание','Nəfəs','Breathwork'),
   copy:t('Замедлитесь и найдите устойчивый ритм.','Yavaşlayın və özünüzə uyğun ritm tapın.','Slow down and find a steady rhythm.')
  },
  {
   href:pageUrl('practices')+'#course/listening',image:'meditation.webp',width:432,height:540,
   title:t('Медитация','Meditasiya','Meditation'),
   copy:t('Выделите время для спокойной практики внимания.','Sakit diqqət məşqinə vaxt ayırın.','Make time for a quiet practice of attention.')
  }
 ];
 const tiles=pathways.map(({href,image,width,height,title,copy})=>'<a class="home-practice" href="'+href+'">'+
  '<img src="./assets/'+image+'" width="'+width+'" height="'+height+'" alt="" loading="lazy" decoding="async"><div><h3>'+title+
  '</h3><p>'+copy+'</p></div></a>').join('');
 return '<section class="home-explore" aria-labelledby="home-explore-title"><h2 id="home-explore-title">'+
  t('Найдите свою практику','Öz məşqinizi tapın','Find your practice')+'</h2><div class="home-practices">'+tiles+
  '</div></section><section class="home-school" aria-labelledby="home-school-title">'+
  '<img src="./assets/author.webp" width="408" height="510" alt="Elxan Gülmalıyev" loading="lazy" decoding="async">'+
  '<div><h2 id="home-school-title">'+t('Школа Эльхана Гюльмалыева','Elxan Gülmalıyevin məktəbi','Elxan Gülmalıyev’s school')+'</h2><p>'+
  t('Спортивная дисциплина, осознанное движение и работа с дыханием в одном подходе.',
    'İdman intizamı, şüurlu hərəkət və nəfəs məşqləri vahid yanaşmada birləşir.',
    'Athletic discipline, mindful movement and breathwork come together in one approach.')+
  '</p><div class="school-actions">'+go('founder',t('Познакомиться с основателем','Təsisçi ilə tanış ol','Meet the founder'))+
  '<a class="home-text-link" href="'+pageUrl('method')+'">'+t('Философия школы','Məktəbin fəlsəfəsi','Our philosophy')+'</a></div></div></section>'+
  '<section class="home-learning" aria-labelledby="home-learning-title"><h2 id="home-learning-title">'+
  t('Продолжите обучение','Öyrənməyə davam edin','Keep learning')+'</h2><div class="cards">'+
  '<article class="card"><h3><a href="'+pageUrl('programme')+'">'+t('Программа на 56 дней','56 günlük proqram','56-day programme')+
  '</a></h3><p>'+t('Восемь этапов от первого шага до самостоятельной практики.','İlk addımdan müstəqil məşqə qədər səkkiz mərhələ.','Eight stages from the first step to independent practice.')+
  '</p></article><article class="card"><h3><a href="'+pageUrl('schedule')+'">'+
  t('Занятия с преподавателем','Müəllimlə məşğələlər','Classes with an instructor')+
  '</a></h3><p>'+t('Расписание и форматы занятий RESTART.','RESTART məşğələlərinin cədvəli və formatları.','RESTART class schedule and formats.')+
  '</p></article></div></section>';
}
function pageName(key){return t(...restartPages[key].slice(1))}
function publicWeeks(){
 const weeks=pathway.map((phase,i)=>'<li><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+t(...phase)+'</strong></li>').join('');
 return '<ol class="about-weeks">'+weeks+'</ol>';
}
function myPath(){
 return '<p>'+t('Материалы программы доступны участникам. Здесь можно открыть свой дневник и сохранённый прогресс.','Proqram materialları iştirakçılar üçündür. Burada gündəliyinizi və yadda saxlanmış nəticələrinizi aça bilərsiniz.','Programme materials are for participants. You can view your journal and saved progress here.')+'</p>'+go('journal',pageName('journal'))+' '+go('progress',pageName('progress'));
}
function participation(){
 return '<div class="cards"><article><h2>STANDARD</h2><p>'+t('Базовый формат участия в программе.','Proqramda əsas iştirak formatı.','The core programme option.')+'</p></article><article><h2>PREMIUM</h2><p>'+t('Расширенный формат участия. Состав пакета и даты набора будут объявлены отдельно.','Genişləndirilmiş iştirak formatı. Paketə daxil olan xidmətlər və qəbul tarixləri ayrıca elan ediləcək.','An extended option. Services included and enrolment dates will be announced separately.')+'</p></article></div>'+signup();
}
function schoolHeader(page){
 $('#headline').textContent=(page==='founder'?t('Эльхан Гюльмалыев','Elxan Gülmalıyev','Elxan Gülmalıyev'):headlines[page]?t(...headlines[page]):pageName(page));
 $('#lead').textContent=page==='founder'?t(...founderContent.introduction):pageIntros[page]?t(...pageIntros[page]):'';
 $('#kicker').textContent=page==='home'?'RESTART':pageName(page);
 const philosophyJump=$('#about-philosophy-jump');
 if(philosophyJump)philosophyJump.textContent=t('Читать философию RESTART','RESTART fəlsəfəsini oxu','Read the RESTART philosophy');
 const actions=$('#home-actions');
 if(actions){
  $('#home-founder a').textContent=homeFounder();
  $('#home-motto').textContent=homeMotto();
  actions.innerHTML=homeActions();
 }
 document.title=$('#headline').textContent+' · RESTART';
}
function philosophyPage(){
 return '<blockquote>'+t('Не стать другим. Раскрыть себя.','Başqasına çevrilmə. Özünü kəşf et.','Discover who you are.')+'</blockquote>'+philosophyDirections();
}
function routePage(page){
 if(page==='home')return homePage();
 if(page==='about')return aboutPage();
 if(page==='founder')return founderPage();
 if(page==='programme')return publicWeeks();
 if(page==='path')return myPath();
 if(page==='method')return philosophyPage();
 if(page==='progress')return '<p><a href="'+pageUrl('activity')+'">'+pageName('activity')+'</a></p>'+report();
 if(page==='signup')return participation();
 return schoolPage(page);
}
