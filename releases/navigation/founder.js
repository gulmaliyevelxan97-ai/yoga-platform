'use strict';

const founderContent = {
 introduction: [
  'Основатель RESTART и преподаватель йоги. В RESTART Эльхан соединяет дисциплину спортивной практики с вниманием к телу и дыханию.',
  'RESTART-ın təsisçisi və yoqa müəllimi. Elxan RESTART-da idman intizamını bədənə və nəfəsə diqqətlə birləşdirir.',
  'Founder of RESTART and yoga teacher. Elxan brings the discipline of sport together with attention to the body and breath.'
 ],
 karate: [
  ['Чемпион Мира и Европы по каратэ','Karate üzrə Dünya və Avropa çempionu','World and European Karate Champion'],
  ['Каратэ — часть спортивного пути Эльхана. Опыт этой практики лежит в основе его подхода к дисциплине и точности движения.',
   'Karate Elxanın idman yolunun bir hissəsidir. Bu təcrübə onun intizama və hərəkət dəqiqliyinə yanaşmasının əsasını təşkil edir.',
   'Karate is part of Elxan’s athletic background. It informs his approach to discipline and precision in movement.']
 ],
 yoga: [
  ['Преподаватель йоги','Yoqa müəllimi','Yoga teacher'],
  ['В преподавании Эльхан соединяет движение, дыхание и внимание. Он предлагает замечать привычки тела и выбирать темп, в котором движения остаются осознанными и управляемыми.',
   'Elxan tədrisində hərəkəti, nəfəsi və diqqəti birləşdirir. O, bədənin vərdişlərini müşahidə etməyi və hərəkətləri şüurlu, nəzarətli şəkildə yerinə yetirməyə imkan verən temp seçməyi tövsiyə edir.',
   'Elxan brings movement, breath and attention together in his teaching. He encourages students to notice their movement habits and choose a pace at which they can move with awareness and control.']
 ],
 workshops: [
  ['Тренинги и мастер-классы','Təlimlər və ustad dərsləri','Training and masterclasses'],
  ['На тренингах и мастер-классах принципы RESTART раскрываются через практику движения, дыхания и внимания.',
   'Təlimlərdə və ustad dərslərində RESTART prinsipləri hərəkət, nəfəs və diqqət məşqləri vasitəsilə aydınlaşır.',
   'Training and masterclasses explore the principles of RESTART through movement, breath and attention.']
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

// Add approved images here with their intrinsic dimensions and translated captions.
const founderMedia = {
 championship: {
  file:'founder-championship.webp',
  width:1024,
  height:1029,
  caption:[
   'Эльхан Гюльмалыев с кубком и медалью на чемпионате.',
   'Elxan Gülmalıyev çempionatda kubok və medalla.',
   'Elxan Gülmalıyev with a trophy and medal at the championship.'
  ]
 },
 workshops: [
  {file:'founder-workshop-group.webp',width:1280,height:788,caption:['Групповое фото с участниками','İştirakçılarla qrup fotosu','Group photo with participants']},
  {file:'founder-workshop-talk.webp',width:1280,height:853,caption:['Эльхан выступает перед участниками','Elxan iştirakçılar qarşısında çıxış edir','Elxan speaking to participants']},
  {file:'founder-workshop-outdoors.webp',width:960,height:1280,caption:['Групповая практика на свежем воздухе','Açıq havada qrup məşqi','Outdoor group practice']}
 ]
};

function founderPhoto({file, width, height, caption}, linkToOriginal = false){
 const url='./assets/'+file;
 const description=t(...caption);
 const image='<img src="'+url+'" width="'+width+'" height="'+height+'" loading="lazy" decoding="async" alt="'+description+'">';
 return '<figure>'+(linkToOriginal?'<a href="'+url+'">'+image+'</a>':image)+'<figcaption>'+description+'</figcaption></figure>';
}

function founderPage(){
 const {karate,yoga,mission,workshops}=founderContent;
 const championship=founderMedia.championship;
 const workshopPhotos=founderMedia.workshops;
 return '<div class="founder-story">'+
  '<section aria-labelledby="founder-karate" class="founder-feature">'+
  (championship?founderPhoto(championship):'')+
  '<h2 id="founder-karate">'+t(...karate[0])+'</h2><p>'+t(...karate[1])+'</p></section>'+
  '<section aria-labelledby="founder-yoga" class="founder-feature founder-yoga">'+
  '<div><h2 id="founder-yoga">'+t(...yoga[0])+'</h2><p>'+t(...yoga[1])+'</p></div>'+
  '<div class="founder-portrait"><img src="./assets/founder-yoga.webp" width="432" height="702" loading="lazy" decoding="async" alt="'+
  t('Эльхан Гюльмалыев с поющей чашей','Elxan Gülmalıyev səs kasası ilə','Elxan Gülmalıyev with a singing bowl')+'">'+
  '<video data-src="./assets/founder-yoga.mp4" poster="./assets/founder-yoga.webp" muted playsinline autoplay loop preload="none" aria-hidden="true"></video></div></section>'+
  '<section aria-labelledby="founder-mission" class="founder-feature"><h2 id="founder-mission">'+t(...mission.title)+'</h2><div class="founder-mission"><p class="founder-mission-lead">'+t(...mission.tagline)+'</p>'+
  mission.paragraphs.map(paragraph=>'<p>'+t(...paragraph)+'</p>').join('')+
  '<p class="founder-mission-lead">'+t(...mission.motto)+'</p><a href="./philosophy.html">'+pageName('method')+'</a></div></section>'+
  '<section aria-labelledby="founder-workshops" class="founder-feature"><h2 id="founder-workshops">'+t(...workshops[0])+'</h2><p>'+t(...workshops[1])+'</p>'+
  (workshopPhotos.length?'<div class="founder-gallery">'+workshopPhotos.map(photo=>founderPhoto(photo,true)).join('')+'</div>':'')+'</section>'+
  '<section class="founder-invitation" aria-labelledby="founder-invitation"><h2 id="founder-invitation">'+t('От философии к практике','Fəlsəfədən praktikaya','From philosophy to practice')+'</h2>'+
  '<div class="school-actions">'+go('practices',t('Открыть практики','Məşqlərə keç','Explore practices'))+go('programme',t('Посмотреть программу','Proqrama bax','View the programme'))+'</div></section></div>';
}
