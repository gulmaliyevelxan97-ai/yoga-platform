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
 calendar:['Наблюдайте, пробуйте и возвращайтесь к тому, что работает для вас.','Müşahidə edin, sınayın və sizə uyğun olana qayıdın.','Observe, experiment and return to what works for you.'],
 method:['Классическая йога, японские традиции и авторский метод школы.','Klassik yoqa, yapon ənənələri və məktəbin öz metodu.','Classical yoga, Japanese traditions and the school’s own method.'],
 journal:['Ваши заметки сохраняются в браузере на этом устройстве.','Qeydləriniz bu cihazın brauzerində saxlanılır.','Your notes are stored in this browser on this device.']
};
const directions=[
 ['Замечать реакцию, возвращать внимание и выбирать действие.','Reaksiyanı sezib diqqəti qaytarmaq və addımı seçmək.','Notice your reaction, return your attention and choose an action.'],
 ['Осваивать силу, подвижность, йогу и координацию через управляемое движение.','Nəzarətli hərəkətlə gücü, hərəkətliliyi, yoqanı və koordinasiyanı inkişaf etdirmək.','Build strength, mobility, yoga and coordination through controlled movement.'],
 ['Замечать, что влияет на пищевой выбор, и поддерживать выполнимые привычки.','Qida seçiminə nəyin təsir etdiyini görmək və mümkün vərdişləri qorumaq.','Notice what shapes food choices and build habits you can sustain.'],
 ['Связывать практику с ценностями, восстановлением и распорядком.','Məşqi dəyərlər, bərpa və gündəlik rejimlə əlaqələndirmək.','Connect practice with values, recovery and daily rhythm.']
];

function homePage(){
 return '<section class="home-explore"><h2>'+t('Исследуйте школу','Məktəblə tanış olun','Explore the school')+'</h2><div class="cards">'+['about','founder','practices'].map((key,i)=>'<article class="card"><h3><a href="'+pageUrl(key)+'">'+pageName(key)+'</a></h3><p>'+t(...[
 ['Четыре направления целостной практики.','Bütöv təcrübənin dörd istiqaməti.','Four dimensions of an integrated practice.'],
 ['Спортивный путь и философия Эльхана Гюльмалыева.','Elxan Gülmalıyevin idman yolu və fəlsəfəsi.','Elxan Gülmalıyev’s athletic background and teaching philosophy.'],
 ['Каталог, видеотека и таймеры.','Kataloq, videokitabxana və taymerlər.','A catalogue, video library and timers.']][i])+'</p></article>').join('')+'</div></section>';
}
function pageName(key){return t(...restartPages[key].slice(1))}
function weekStatus(){
 const completed=weekdays.reduce((sum,_,day)=>sum+count(day),0);
 const total=weekdays.length*tracks.length;
 return '<label class="week-status">'+t('Задания','Tapşırıqlar','Tasks')+' · '+completed+' / '+total+'<progress value="'+completed+'" max="'+total+'"></progress></label>';
}
function weekAction(){
 const next=nextDay();
 if(next<0)return go('progress',t('Открыть отчёт','Hesabatı aç','View your report'));
 const text=weekdays.some((_,day)=>count(day)>0)?
   t('Продолжить с дня','Bu gündən davam et','Continue from day')+' '+(next+1):
   t('Начать первую неделю','İlk həftəyə başla','Start week one');
 return go('day-'+(next+1),text);
}
function schoolWeeks(){
 return '<ol class="cards">'+pathway.map((phase,i)=>'<li class="card"><details '+(i===0?'open':'')+'><summary>'+t('Неделя','Həftə','Week')+' '+(i+1)+' · '+t(...phase)+'</summary><p>'+t(...pathwayGoals[i])+'</p></details>'+(i===0?weekStatus()+weekAction()+' <a href="'+pageUrl('calendar')+'">'+pageName('calendar')+'</a>':'<small>'+t('Будущий этап','Gələcək mərhələ','Upcoming stage')+'</small>')+'</li>').join('')+'</ol>';
}
function aboutPage(){
 const founder='<p><a class="cta" href="'+pageUrl('founder')+'">'+t('Познакомиться с основателем','Təsisçi ilə tanış olun','Meet the founder')+'</a></p>';
 return founder+'<div class="cards">'+directions.map((d,i)=>'<article><h2 id="ph-'+tracks[i].toLowerCase()+'">'+tracks[i]+'</h2><p>'+t(...d)+'</p></article>').join('')+'</div><h2>'+t('Восемь этапов','Səkkiz mərhələ','Eight stages')+'</h2>'+schoolWeeks();
}
function myPath(){
 const day=nextDay();
 if(day<0)return '<article><h2>'+t('Первая неделя завершена','İlk həftə tamamlandı','You finished week one')+'</h2>'+weekStatus()+weekAction()+' <a href="'+pageUrl('calendar')+'">'+pageName('calendar')+'</a></article>';
 const upcoming=[0,2,4].find(i=>i>=day&&!done[id(i,1)]);
 return '<div class="cards"><article><small>'+title()+'</small><h2>'+t(...weekdays[day])+'</h2><p>'+t(...themes[day])+'</p>'+weekStatus()+weekAction()+'</article><article><h2>'+t('Ближайшее очное занятие','Növbəti əyani məşğələ','Next in-person session')+'</h2><p>'+(upcoming===undefined?t('Все очные занятия этой недели отмечены или пройдены по календарю.','Bu həftənin əyani məşğələləri qeyd olunub və ya təqvimdə geridə qalıb.','This week’s in-person sessions are marked complete or earlier in the calendar.'):t(...weekdays[upcoming])+' · 90 '+t('мин','dəq','min'))+'</p>'+go('progress',pageName('progress'))+'</article></div><h2>'+t('Практики дня','Günün məşqləri','Today’s practices')+'</h2><div class="cards">'+window.weekTasks[day].map((task,k)=>'<article><small>'+tracks[k]+' · '+task.min+' '+t('мин','dəq','min')+'</small><h3>'+task[lang][0]+'</h3><p>'+(done[id(day,k)]?t('Выполнено','Tamamlandı','Completed'):t('К выполнению','İcra olunacaq','To do'))+'</p></article>').join('')+'</div>';
}
function participation(){
 return '<div class="cards"><article><h2>STANDARD</h2><p>'+t('Базовый формат участия в программе.','Proqramda əsas iştirak formatı.','The core programme option.')+'</p></article><article><h2>PREMIUM</h2><p>'+t('Расширенный формат участия. Состав пакета и даты набора будут объявлены отдельно.','Genişləndirilmiş iştirak formatı. Paketə daxil olan xidmətlər və qəbul tarixləri ayrıca elan ediləcək.','An extended option. Services included and enrolment dates will be announced separately.')+'</p></article></div>'+signup();
}
function schoolHeader(page){
 $('#headline').textContent=(page==='founder'?t('Эльхан Гюльмалыев','Elxan Gülmalıyev','Elxan Gülmalıyev'):headlines[page]?t(...headlines[page]):page==='calendar'?title():pageName(page));
 $('#lead').textContent=page==='founder'?t(...founderContent.introduction):pageIntros[page]?t(...pageIntros[page]):'';
 $('#kicker').textContent=page==='home'?'RESTART':pageName(page);
 const actions=$('#home-actions');
 if(actions)actions.innerHTML=go('path',t('Мой путь','Mənim yolum','My path'))+go('method',t('Изучить философию','Fəlsəfəni kəşf et','Explore the philosophy')).replace('class="cta"','class="cta secondary"')+go('programme',t('Посмотреть программу','Proqrama bax','View the programme')).replace('class="cta"','class="cta secondary"');
 document.title=$('#headline').textContent+' · RESTART';
}
function routePage(page,dayMatch){
 if(page==='calendar')return dayMatch?day(Number(dayMatch[1])-1):calendar();
 if(page==='home')return homePage();
 if(page==='about')return aboutPage();
 if(page==='founder')return founderPage();
 if(page==='programme')return schoolWeeks();
 if(page==='path')return myPath();
 if(page==='method')return '<blockquote>'+t('Не стать другим. Раскрыть себя.','Başqasına çevrilmə. Özünü kəşf et.','Discover who you are.')+'</blockquote>'+method();
 if(page==='progress')return progressCalendar()+'<p><a href="'+pageUrl('activity')+'">'+pageName('activity')+'</a></p>'+skillsReport()+report();
 if(page==='signup')return participation();
 return schoolPage(page);
}

function progressCalendar(){
 return '<div class="days" aria-label="'+pageName('calendar')+'">'+weekdays.map((d,i)=>'<a href="'+pageUrl('calendar')+'#day-'+(i+1)+'" aria-label="'+t(...d)+' · '+count(i)+' / 4">'+(i+1)+'<small>'+count(i)+'/4</small></a>').join('')+'</div>';
}
