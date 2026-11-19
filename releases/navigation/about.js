'use strict';

const restartStory = {
  title:['История и миссия RESTART','RESTART-ın yaranması və missiyası','The story and mission of RESTART'],
  tagline:['Сила тела. Гармония сознания.','Bədənin gücü. Şüurun harmoniyası.','Strength of body. Harmony of mind.'],
  paragraphs:[
   ['RESTART родился из стремления объединить два важнейших аспекта человеческого развития — физическую силу и внутреннюю гармонию.',
    'RESTART insan inkişafının iki mühüm tərəfini — fiziki gücü və daxili harmoniyanı — birləşdirmək istəyindən yarandı.',
    'RESTART grew out of a desire to bring together two essential aspects of human development: physical strength and inner harmony.'],
   ['Идея создания школы заключалась не просто в том, чтобы помогать людям становиться сильнее, выносливее и увереннее в собственном теле. Не менее важной целью было научить их находить внутреннее равновесие, осознанность и гармонию с собой через йогу и медитацию.',
    'Məktəbin məqsədi insanlara daha güclü, dözümlü və öz bədənlərində daha inamlı olmağa kömək etmək idi. Digər, eyni dərəcədə vacib məqsəd yoqa və meditasiya vasitəsilə daxili tarazlığı, fərqindəliyi və özü ilə harmoniyanı tapmağı öyrətmək idi.',
    'The school was founded to help people become stronger, build endurance and feel more confident in their bodies. An equally important aim was to teach them to find inner balance, awareness and harmony with themselves through yoga and meditation.'],
   ['В основе философии RESTART лежит убеждение, что физическое и внутреннее развитие не должны существовать отдельно друг от друга.',
    'RESTART fəlsəfəsinin əsasında fiziki və daxili inkişafın bir-birini tamamladığına inam dayanır.',
    'At the heart of RESTART is the belief that physical and inner development belong together.'],
   ['Сила без внутреннего равновесия может потерять своё направление. А внутренняя гармония становится глубже, когда человек учится понимать своё тело, управлять движением, дыханием и вниманием.',
    'Daxili tarazlıq olmadıqda güc öz istiqamətini itirə bilər. İnsan bədənini anlamağı, hərəkətini, nəfəsini və diqqətini idarə etməyi öyrəndikcə daxili harmoniya dərinləşir.',
    'Strength can lose its direction without inner balance. Inner harmony deepens as we learn to understand our bodies and guide our movement, breathing and attention.'],
   ['RESTART — это пространство, где дисциплина встречается с осознанностью, движение — с тишиной, а физическое совершенствование — с внутренним раскрытием.',
    'RESTART intizamın fərqindəliklə, hərəkətin sükutla, fiziki inkişafın isə özünü kəşflə qovuşduğu bir məkandır.',
    'RESTART is a space where discipline meets awareness, movement meets stillness, and physical development meets self-discovery.'],
   ['Здесь нет необходимости становиться кем-то другим. Важно научиться лучше понимать себя, раскрывать собственные возможности и находить баланс между силой и спокойствием.',
    'Burada başqa birinə çevrilməyə ehtiyac yoxdur. Əsas olan özünü daha yaxşı anlamağı, imkanlarını üzə çıxarmağı və güclə sakitlik arasında tarazlıq tapmağı öyrənməkdir.',
    'Here, there is no need to become someone else. What matters is learning to understand yourself better, discover what you are capable of, and find a balance between strength and calm.']
  ],
  motto:['Не стать другим. Раскрыть себя.','Başqa biri olma. Özünü kəşf et.','Become more fully yourself.']
 };

const aboutDirections = [
 ['◎', 'Учимся замечать реакцию до того, как она определит наш поступок. Возвращая внимание к дыханию или ощущениям, мы создаём паузу, в которой можно выбрать ответ.',
  'Reaksiyamız hərəkətimizi müəyyən etməzdən əvvəl onu sezməyi öyrənirik. Diqqəti nəfəsə və ya duyğulara qaytaranda necə cavab verəcəyimizi seçmək üçün bir an yaranır.',
  'We learn to notice a reaction before it shapes what we do. Returning attention to the breath or to a sensation creates a pause in which we can choose how to respond.'],
 ['◈', 'Сила начинается с умения управлять движением. Йога, работа над подвижностью и координацией помогают различать устойчивое усилие и напряжение, которое мешает.',
  'Güc hərəkəti idarə etmək bacarığından başlayır. Yoqa, hərəkətlilik və koordinasiya məşqləri dayanıqlı səylə hərəkətə mane olan gərginliyi ayırd etməyə kömək edir.',
  'Strength begins with the ability to guide movement. Yoga, mobility and coordination help us distinguish steady effort from tension that gets in the way.'],
 ['❧', 'Замечаем, как голод, усталость и обстоятельства влияют на питание. Ищем привычки, которые можно поддерживать в обычной жизни, оставляя место для гибкости.',
  'Aclığın, yorğunluğun və şəraitin qidalanmağımıza necə təsir etdiyini müşahidə edirik. Gündəlik həyatda davam etdirə biləcəyimiz və çevikliyə yer saxlayan vərdişlər axtarırıq.',
  'We notice how hunger, tiredness and circumstances shape what we eat. We look for habits we can sustain in everyday life, with room for flexibility.'],
 ['☀', 'Практика продолжается в том, как мы распределяем время, восстанавливаемся и держим слово перед собой. Небольшие решения помогают приблизить распорядок к тому, что для нас важно.',
  'Təcrübə vaxtımızı necə bölüşdürməyimizdə, bərpa olunmağımızda və özümüzə verdiyimiz sözə əməl etməyimizdə davam edir. Kiçik qərarlar gündəlik rejimimizi dəyərlərimizə yaxınlaşdırır.',
  'Practice continues in how we use our time, recover and keep promises to ourselves. Small decisions bring our daily rhythm closer to what matters to us.']
];

function aboutPage(){
 const {title,tagline,paragraphs,motto}=restartStory;
 const directions=aboutDirections.map(([mark,...description],i)=>`<details class="about-direction" id="ph-${tracks[i].toLowerCase()}">
  <summary><span class="about-illustration" aria-hidden="true">${mark}</span><strong>${tracks[i]}</strong><span class="about-toggle" aria-hidden="true"></span></summary>
  <p>${t(...description)}</p></details>`).join('');
 return `<section class="about-story" aria-labelledby="about-story">
 <h2 id="about-story">${t(...title)}</h2><p class="about-story-lead">${t(...tagline)}</p>
 ${paragraphs.map(paragraph=>`<p>${t(...paragraph)}</p>`).join('')}
 <p class="about-story-lead">${t(...motto)}</p>
 <a href="${pageUrl('founder')}">${t('Познакомиться с основателем','Təsisçi ilə tanış olun','Meet the founder')}</a></section>
 <section class="about-pathways" aria-labelledby="about-directions"><h2 id="about-directions">${t('Четыре направления','Dörd istiqamət','Four disciplines')}</h2><div class="about-directions">${directions}</div></section>
 <section class="about-pathways" aria-labelledby="about-weeks"><h2 id="about-weeks">${t('8 недель. 8 этапов. Один путь к себе','8 həftə. 8 mərhələ. Özünə doğru bir yol','8 weeks. 8 stages. One path to yourself')}</h2>
 ${publicWeeks()}</section>`;
}
