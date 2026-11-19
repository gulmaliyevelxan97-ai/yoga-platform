'use strict';

const founderContent = {
 introduction: [
  'Основатель RESTART и преподаватель йоги. В RESTART Эльхан соединяет дисциплину спортивной практики с вниманием к телу и дыханию.',
  'RESTART-ın təsisçisi və yoqa müəllimi. Elxan RESTART-da idman intizamını bədənə və nəfəsə diqqətlə birləşdirir.',
  'Founder of RESTART and yoga teacher. Elxan brings the discipline of sport together with attention to the body and breath.'
 ],
 sport: [
  ['Спортивный путь','İdman yolu','Athletic background'],
  ['Четырёхкратный чемпион мира по карате','Karate üzrə dördqat dünya çempionu','Four-time world karate champion'],
  ['Мастер владения нунчаку','Nunçakudan istifadə ustası','Skilled nunchaku practitioner'],
  ['Преподаватель йоги','Yoqa müəllimi','Yoga teacher'],
  ['Сведения о четырёх мировых титулах предоставлены основателем.',
   'Dörd dünya titulu barədə məlumatı təsisçi təqdim edib.',
   'The four world titles are reported by the founder.']
 ],
 philosophy: [
  ['Философия преподавания','Tədris fəlsəfəsi','Teaching philosophy'],
  ['Дисциплина помогает возвращаться к практике. Движение даёт возможность заметить привычки тела. Внимание к дыханию и короткая пауза помогают выбрать темп, в котором движение остаётся управляемым.',
   'İntizam məşqə qayıtmağa kömək edir. Hərəkət bədənin vərdişlərini müşahidə etmək imkanı verir. Nəfəsə diqqət və qısa fasilə hərəkəti idarə etməyə imkan verən tempi seçməyə kömək edir.',
   'Discipline helps you return to practice. Movement makes it possible to notice the body’s habits. Paying attention to breath and taking a brief pause help you choose a pace at which you can stay in control.']
 ],
 mission: {
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
 }
};

const founderPhotos = [
 {file:'author.webp',size:[408,510],caption:['Эльхан Гюльмалыев','Elxan Gülmalıyev','Elxan Gülmalıyev']},
 {file:'hero.webp',size:[900,900],caption:['Практика у моря','Dəniz kənarında məşq','Practice by the sea']},
 {file:'performance.webp',size:[640,800],caption:['Кадр выступления у моря','Dəniz kənarında çıxışdan kadr','A frame from the seaside performance']}
];

function founderPage(){
 const {sport,philosophy,mission}=founderContent;
 return '<div class="founder-story">'+
  '<section aria-labelledby="founder-sport"><h2 id="founder-sport">'+t(...sport[0])+'</h2><ul class="founder-credentials">'+
  sport.slice(1,4).map(item=>'<li>'+t(...item)+'</li>').join('')+'</ul><p class="founder-note">'+t(...sport[4])+'</p></section>'+
  '<section aria-labelledby="founder-teaching"><h2 id="founder-teaching">'+t(...philosophy[0])+'</h2><p>'+t(...philosophy[1])+'</p><a href="./philosophy.html">'+pageName('method')+'</a></section>'+
  '<section aria-labelledby="founder-mission"><h2 id="founder-mission">'+t(...mission.title)+'</h2><div class="founder-mission"><p class="founder-mission-lead">'+t(...mission.tagline)+'</p>'+
  mission.paragraphs.map(paragraph=>'<p>'+t(...paragraph)+'</p>').join('')+
  '<p class="founder-mission-lead">'+t(...mission.motto)+'</p></div></section>'+
  '<section aria-labelledby="founder-gallery"><h2 id="founder-gallery">'+t('Личный архив','Şəxsi arxiv','Personal archive')+'</h2>'+
  '<div class="founder-gallery">'+founderPhotos.map(({file,size,caption})=>
  '<figure><img src="./assets/'+file+'" width="'+size[0]+'" height="'+size[1]+'" loading="lazy" decoding="async" alt="'+t(...caption)+'"><figcaption>'+t(...caption)+'</figcaption></figure>').join('')+'</div></section>'+
  '<div class="school-actions">'+go('practices',t('Открыть практики','Məşqlərə keç','Explore practices'))+go('programme',t('Посмотреть программу','Proqrama bax','View the programme'))+'</div></div>';
}
