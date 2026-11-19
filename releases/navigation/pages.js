'use strict';

const headlines={
 home:['Не стать другим. Раскрыть себя.','Başqasına çevrilmə. Özünü kəşf et.','Discover who you are.'],
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
function homePage(){
 return '<section class="home-explore"><h2>'+t('Исследуйте школу','Məktəblə tanış olun','Explore the school')+'</h2><div class="cards">'+['about','founder','practices'].map((key,i)=>'<article class="card"><h3><a href="'+pageUrl(key)+'">'+pageName(key)+'</a></h3><p>'+t(...[
 ['Четыре направления целостной практики.','Bütöv təcrübənin dörd istiqaməti.','Four dimensions of an integrated practice.'],
 ['Спортивный путь и философия Эльхана Гюльмалыева.','Elxan Gülmalıyevin idman yolu və fəlsəfəsi.','Elxan Gülmalıyev’s athletic background and teaching philosophy.'],
 ['Каталог, видеотека и таймеры.','Kataloq, videokitabxana və taymerlər.','A catalogue, video library and timers.']][i])+'</p></article>').join('')+'</div></section>';
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
 const actions=$('#home-actions');
 if(actions)actions.innerHTML=go('path',t('Мой путь','Mənim yolum','My path'))+go('method',t('Изучить философию','Fəlsəfəni kəşf et','Explore the philosophy')).replace('class="cta"','class="cta secondary"')+go('programme',t('Посмотреть программу','Proqrama bax','View the programme')).replace('class="cta"','class="cta secondary"');
 document.title=$('#headline').textContent+' · RESTART';
}
function routePage(page){
 if(page==='home')return homePage();
 if(page==='about')return aboutPage();
 if(page==='founder')return founderPage();
 if(page==='programme')return publicWeeks();
 if(page==='path')return myPath();
 if(page==='method')return '<blockquote>'+t('Не стать другим. Раскрыть себя.','Başqasına çevrilmə. Özünü kəşf et.','Discover who you are.')+'</blockquote>';
 if(page==='progress')return '<p><a href="'+pageUrl('activity')+'">'+pageName('activity')+'</a></p>'+report();
 if(page==='signup')return participation();
 return schoolPage(page);
}
