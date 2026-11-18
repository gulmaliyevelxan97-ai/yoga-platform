'use strict';

const code = [
 [['Познай себя, прежде чем менять себя.','Özünü dəyişməzdən əvvəl özünü tanı.','Know yourself before changing yourself.'],
  ['Начни с описания того, что можешь наблюдать. Вместо общей оценки запиши, какая опора помогла встать со стула спокойнее.','Müşahidə edə bildiyin faktı yaz. Məsələn, stuldan daha rahat qalxmağa hansı dayaq kömək etdi?','Record what you can observe. Which support helped you stand from the chair more steadily?']],
 [['Начинай каждый день с умом начинающего.','Hər günə yeni başlayan düşüncəsi ilə başla.','Begin each day with a beginner’s mind.'],
  ['Проверь знакомое движение заново. Сделай один медленный перенос веса и заметь, как сегодня ощущаются стопы.','Tanış hərəkəti yenidən yoxla. Ağırlığı yavaşca köçür və bu gün ayaqlarında nə hiss etdiyini sez.','Revisit a familiar movement. Shift your weight slowly once and notice how your feet feel today.']],
 [['Развивай силу без насилия.','Gücünü zorakılıq etmədən inkişaf etdir.','Develop strength without violence.'],
  ['Подбери усилие, при котором можешь контролировать движение. Если теряешь контроль, сократи амплитуду или используй опору.','Hərəkəti idarə edə bildiyin yükü seç. Nəzarət azalırsa, amplitudanı kiçilt və ya dayaqdan istifadə et.','Choose an effort that lets you control the movement. If control fades, shorten the range or add support.']],
 [['Будь предан практике, но свободен от результата.','Məşqə sadiq qal, nəticəyə bağlanma.','Stay committed to practice without clinging to results.'],
  ['Назначь повторяемое время для короткой практики и оцени качество внимания. Отметь полезное наблюдение независимо от числа повторений.','Qısa məşq üçün təkrarlana bilən bir vaxt seç və diqqətini qiymətləndir. Təkrar sayından asılı olmayaraq faydalı bir müşahidəni qeyd et.','Set a repeatable time for a short practice and assess the quality of your attention. Record one useful observation regardless of the number of repetitions.']],
 [['Превращай движение в осознанное действие.','Hərəkəti şüurlu bir əmələ çevir.','Turn movement into deliberate action.'],
  ['Выбери одну подсказку перед началом. Когда садишься, следи за тем, как плавно переносишь вес на стул.','Başlamazdan əvvəl bir ipucu seç. Oturarkən ağırlığını stula nə qədər yumşaq ötürdüyünə fikir ver.','Choose one cue before you begin. As you sit, notice how smoothly you transfer your weight to the chair.']],
 [['Сохраняй внимание после действия.','Hərəkətdən sonra da diqqətini saxla.','Sustain attention after the action.'],
  ['После последнего шага заметь, где вес, куда направлен взгляд и можно ли удобно остановиться. Примени ту же внимательность, заканчивая разговор.','Son addımdan sonra ağırlığın harada olduğuna, baxışına və rahat dayana bildiyinə fikir ver. Söhbəti bitirərkən də eyni diqqəti göstər.','After the final step, notice your weight, gaze and ability to stop comfortably. Bring the same attention to the end of a conversation.']],
 [['Уважай паузу так же, как усилие.','Fasiləyə də səy qədər dəyər ver.','Respect the pause as much as the effort.'],
  ['Заранее оставь время между подходами. Проверь, восстановилось ли ощущение контроля, прежде чем решать, продолжать ли.','Yanaşmalar arasında vaxt ayır. Davam etmək qərarından əvvəl hərəkətə nəzarət hissinin qayıdıb-qayıtmadığını yoxla.','Make room for a pause between sets. Check whether control has returned before deciding to continue.']],
 [['Совершенствуйся небольшими шагами.','Kiçik addımlarla irəlilə.','Improve in small steps.'],
  ['Измени одну деталь и посмотри, что произошло. Перед обедом положи телефон в сторону и отметь, что стало легче заметить.','Bir detalı dəyiş və nəticəni müşahidə et. Nahardan əvvəl telefonu kənara qoy və nəyi daha asan sezdiyini yaz.','Change one detail and observe what happens. Put your phone away before lunch and note what became easier to notice.']],
 [['Иди своим путём, уважая путь других.','Öz yolunla get, başqalarının yoluna hörmət et.','Follow your own path while respecting others.'],
  ['Выбери подходящую опору и оставь соседу пространство для его варианта. Перед советом спроси, хочет ли он обратную связь.','Sənə uyğun dayağı seç və yanındakı insana öz variantı üçün yer saxla. Məsləhət verməzdən əvvəl rəy istəyib-istəmədiyini soruş.','Choose suitable support and leave space for someone else’s version. Ask before offering feedback.']],
 [['Превращай знания в образ жизни.','Öyrəndiklərini həyat tərzinə çevir.','Bring what you learn into daily life.'],
  ['Привяжи знакомый навык к реальному моменту. Перед первым ответом на сложное сообщение сделай паузу и перечитай его.','Öyrəndiyin bacarığı gündəlik bir məqama bağla. Çətin mesaja cavab verməzdən əvvəl bir an dayan və onu yenidən oxu.','Tie the skill to a real situation. Before replying to a difficult message, pause and read it again.']]
];

const pathway=[
 ['Пробуждение','Oyanış','Awakening'],['Освобождение','Azadlaşma','Letting go'],['Основание','Təməl','Foundation'],['Дисциплина','İntizam','Discipline'],['Равновесие','Tarazlıq','Balance'],['Преодоление','Çətinlikləri aşmaq','Overcoming obstacles'],['Интеграция','Bütövləşdirmə','Integration'],['Новое начало','Yeni başlanğıc','A new beginning']];
const pathwayGoals=[
 ['Описать исходную точку и выбрать посильное действие.','Başlanğıc vəziyyətini təsvir etmək və mümkün addımı seçmək.','Describe your starting point and choose a manageable action.'],
 ['Распознать привычную реакцию и найти другой вариант.','Vərdiş etdiyin reaksiyanı sezib başqa variant tapmaq.','Recognise a habitual response and find another option.'],
 ['Создать повторяемые условия для практики.','Məşq üçün təkrarlana bilən şərait yaratmaq.','Create repeatable conditions for practice.'],
 ['Вернуться к практике после пропуска.','Fasilədən sonra məşqə qayıtmaq.','Return to practice after an interruption.'],
 ['Соотнести усилие и восстановление.','Səyi və bərpanı uyğunlaşdırmaq.','Match effort to recovery.'],
 ['Подобрать посильную версию при изменении условий.','Şərait dəyişəndə uyğun variant seçmək.','Choose a manageable version when circumstances change.'],
 ['Перенести навык в другую ситуацию.','Bacarığı başqa vəziyyətdə tətbiq etmək.','Transfer a skill to a different setting.'],
 ['Составить собственный план продолжения.','Davam etmək üçün şəxsi plan qurmaq.','Make your own plan for continuing.']];
const schoolTabs=()=>[t('Философия RESTART','RESTART fəlsəfəsi','RESTART philosophy'),t('Кодекс школы','Məktəbin prinsipləri','School code'),t('Мой путь','Mənim yolum','My path'),t('Дневник осознанности','Fərqindəlik gündəliyi','Mindfulness journal')];

function schoolPage(route){
 if(route==='code')return '<h2>'+schoolTabs()[1]+'</h2>'+code.map(([rule,example],i)=>'<article><h3>'+(i+1)+'. '+t(...rule)+'</h3><details><summary>'+t('Как применить','Necə tətbiq etməli','How to put it into practice')+'</summary><p>'+t(...example)+'</p></details></article>').join('');
 if(route==='path')return '<h2>'+schoolTabs()[2]+'</h2><ol class="cards">'+pathway.map((phase,i)=>'<li class="card"><h3>'+t(...phase)+'</h3><p>'+t(...pathwayGoals[i])+'</p>'+(i===0?go('calendar',tabs()[1]):'<small>'+t('Этап программы · проект','Proqram mərhələsi · layihə','Programme stage · draft')+'</small>')+'</li>').join('')+'</ol>';
 return '<h2>'+schoolTabs()[3]+'</h2><p>'+t('Записи доступны на этом устройстве в текущем браузере.','Qeydlər bu cihazın cari brauzerində saxlanılır.','Notes are stored in this browser on this device.')+'</p>'+weekdays.map((d,i)=>'<details class="card"><summary>'+t(...d)+'</summary>'+dayNotes(i)+'</details>').join('');
}
