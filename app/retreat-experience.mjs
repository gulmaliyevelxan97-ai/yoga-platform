import {languages} from './state.mjs';

const title = 'RESTART RETREAT';
const copy = {
 entry:['Открыть раздел ретрита','Retrit bölməsini aç','Explore the retreat'],
 welcome:['Добро пожаловать','Xoş gəlmisən','Welcome'],
 philosophy:[
  'Пространство, чтобы замедлиться, прислушаться к телу и яснее понять своё намерение.',
  'Yavaşlamaq, bədənini dinləmək və niyyətini daha aydın anlamaq üçün bir məkan.',
  'A space to slow down, listen to your body and find clarity about your intention.'
 ],
 details:['Программа и организация','Proqram və təşkilati məlumat','Programme and practical details'],
 pending:['Подробности появятся после утверждения организатором.','Təfərrüatlar təşkilatçı təsdiqlədikdən sonra burada görünəcək.','Details will appear here after the organiser confirms them.'],
 date:['Дата и время','Tarix və saat','Date and time'],
 programme:['Полная программа','Tam proqram','Full programme'],
 location:['Место проведения','Keçirildiyi yer','Location'],
 dress:['Дресс-код','Geyim qaydası','Dress code'],
 packing:['Что взять с собой','Özünlə nə götürməli','What to bring'],
 prepare:['Добровольные практики перед ретритом','Retritdən əvvəl könüllü məşqlər','Optional preparation'],
 breathe:['Спокойное дыхание','Sakit nəfəs','Gentle breathing'],
 meditate:['Медитация','Meditasiya','Meditation'],
 personal:['Мой ретрит','Retritim','My retreat'],
 intention:['Анкеты и «Моё намерение»','Anketlər və «Niyyətim»','Forms and “My intention”'],
 tasks:['Задания','Tapşırıqlar','Tasks'],
 connect:['Наставник и объявления','Mentor və elanlar','Mentor and announcements'],
 guest:['Программа группы, индивидуальные задания, переписка и рекомендации доступны после входа и допуска в группу.','Qrup proqramı, fərdi tapşırıqlar, yazışmalar və tövsiyələr giriş və qrupa qəbuldan sonra açılır.','The cohort programme, individual tasks, messages and recommendations are available after sign-in and approval.'],
 back:['На экран «Сегодня»','«Bu gün» bölməsinə','Back to Today']
};

const translator = lang => key => copy[key][Math.max(0,languages.indexOf(lang))];

export function renderRetreatCard(lang) {
 const t=translator(lang);
 return '<a class="retreat-feature" href="#retreat"><span class="eyebrow">BODY · MIND · SPIRIT</span>'+
  '<strong>'+title+'</strong><span>'+t('entry')+' <span aria-hidden="true">→</span></span></a>';
}

export function renderRetreatExperience(lang,{signedIn=false,intention=''}={}) {
 const t=translator(lang);
 const link=(route,label)=>'<a class="button" href="#'+route+'">'+t(label)+'</a>';
 const details=['date','programme','location','dress','packing','WHITE & BLACK EXPERIENCE'];
 const personal=signedIn ?
  '<div class="actions">'+link('retreat-programme','programme')+link('retreat-forms','intention')+
  link('retreat-tasks','tasks')+link('retreat-connect','connect')+'</div>' : '<p>'+t('guest')+'</p>';
 return '<a class="link" href="#today">'+t('back')+'</a><header class="retreat-feature">'+
  '<span class="eyebrow">BODY · MIND · SPIRIT</span><h1>'+title+'</h1><p>'+t('welcome')+'</p></header>'+
  '<section class="panel"><h2>'+t('welcome')+'</h2><p>'+t('philosophy')+'</p></section>'+
  '<section class="panel"><h2>'+t('details')+'</h2><ul class="retreat-details">'+details.map(label=>
   '<li>'+ (copy[label]?t(label):'WHITE &amp; BLACK EXPERIENCE')+'</li>').join('')+'</ul><p class="muted">'+t('pending')+'</p></section>'+
  '<section class="panel"><h2>'+t('prepare')+'</h2><div class="actions">'+
  link('practice/breathing','breathe')+link('practice/meditation','meditate')+'</div></section>'+
  intention+'<section class="panel"><h2>'+t('personal')+'</h2>'+personal+'</section>';
}
