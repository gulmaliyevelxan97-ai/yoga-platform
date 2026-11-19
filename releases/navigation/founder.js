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
 ]
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
 const {karate,yoga,workshops}=founderContent;
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
  '<section aria-labelledby="founder-workshops" class="founder-feature"><h2 id="founder-workshops">'+t(...workshops[0])+'</h2><p>'+t(...workshops[1])+'</p>'+
  (workshopPhotos.length?'<div class="founder-gallery">'+workshopPhotos.map(photo=>founderPhoto(photo,true)).join('')+'</div>':'')+'</section>'+
  '<section class="founder-invitation" aria-labelledby="founder-invitation"><h2 id="founder-invitation">'+t('От философии к практике','Fəlsəfədən praktikaya','From philosophy to practice')+'</h2>'+
  '<div class="school-actions">'+go('practices',t('Открыть практики','Məşqlərə keç','Explore practices'))+go('programme',t('Посмотреть программу','Proqrama bax','View the programme'))+'</div></section></div>';
}
