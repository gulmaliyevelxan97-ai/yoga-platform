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
 journey:['Твой путь','Sənin yolun','Your journey'],
 journeyIntro:['Выбери, с чего начать. К любому этапу можно вернуться.','Haradan başlayacağını seç. İstənilən mərhələyə qayıda bilərsən.','Choose where to begin. You can return to any stage.'],
 before:['До ретрита','Retritdən əvvəl','Before the retreat'],
 live:['Во время ретрита','Retrit zamanı','During the retreat'],
 integrate:['После ретрита','Retritdən sonra','After the retreat'],
 awaken:['Пробуждение','Oyanış','Awakening'],
 immerse:['Погружение','Dərinləşmə','Immersion'],
 awareness:['Осознание','Dərk etmə','Awareness'],
 integration:['Интеграция','Gündəlik həyata dönüş','Integration'],
 journal:['Мой дневник','Gündəliyim','My journal'],
 nextStep:['Продолжить путь','Yola davam et','Continue the journey'],
 letter:['Письмо себе','Özümə məktub','Letter to myself'],
 overview:['Обзор','İcmal','Overview'],
 preparation:['Подготовка','Hazırlıq','Preparation'],
 after:['После ретрита','Retritdən sonra','After the retreat'],
 myIntention:['Моё намерение','Niyyətim','My intention'],
 mentor:['Мой наставник','Mentorum','My mentor'],
 nav:['Разделы ретрита','Retrit bölmələri','Retreat sections'],
 concept:['Две стороны ретрита','Retritin iki tərəfi','Two sides of the retreat'],
 white:['Свет, осознанность и открытость.','İşıq, fərqindəlik və açıqlıq.','Light, awareness and openness.'],
 black:['Тишина, глубина и внутреннее исследование.','Sükut, dərinlik və özünü kəşf.','Stillness, depth and inner exploration.'],
 pending:['Подробности появятся после утверждения организатором.','Təfərrüatlar təşkilatçı təsdiqlədikdən sonra burada görünəcək.','Details will appear here after the organiser confirms them.'],
 afterIntro:['Вернись сюда после ретрита, чтобы осмыслить свой опыт.','Təcrübəni dəyərləndirmək üçün retritdən sonra bura qayıt.','Come back after the retreat to reflect on your experience.'],
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

const sections = [
 ['', 'overview'], ['programme','programme'], ['preparation','preparation'],
 ['intention','myIntention'], ['mentor','mentor'], ['after','after'], ['letter','letter']
];

export function retreatSection(id) {
 return sections.some(([section])=>section===id) ? id : '';
}

export function renderRetreatExperience(lang,{section='',signedIn=false,intention='',preparation='',reflection='',letter=''}={}) {
 const t=translator(lang);
 const link=(route,label)=>'<a class="button" href="#'+route+'">'+t(label)+'</a>';
 const panel=(key,body)=>'<section class="panel retreat-panel"><h2>'+t(key)+'</h2>'+body+'</section>';
 const pending='<p class="muted">'+t('pending')+'</p>';
 const restricted='<p>'+t('guest')+'</p>';
 const nav=sections.map(([id,label])=>'<a href="#retreat'+(id?'/'+id:'')+'"'+
  (id===section?' aria-current="page"':'')+'>'+t(label)+'</a>').join('');
 const journeyGroups=[
  ['before',[['awaken','practice/breathing'],['myIntention','retreat/intention'],['preparation','retreat/preparation']]],
  ['live',[['immerse','retreat/programme']]],
  ['integrate',[['awareness','retreat/after'],['integration','retreat/letter']]]
 ];
 let step=0;
 const journey=panel('journey','<p>'+t('journeyIntro')+'</p><div class="retreat-journey">'+
  journeyGroups.map(([phase,stages])=>'<section><h3>'+t(phase)+'</h3><ol>'+stages.map(([label,route])=>
   '<li><a href="#'+route+'"><span aria-hidden="true">'+String(++step).padStart(2,'0')+'</span>'+t(label)+'</a></li>').join('')+
   '</ol></section>').join('')+'</div>');
 const concept=panel('concept','<p>WHITE &amp; BLACK EXPERIENCE</p><div class="retreat-experiences">'+
  '<details class="retreat-white"><summary>WHITE EXPERIENCE</summary><p>'+t('white')+'</p></details>'+
  '<details class="retreat-black"><summary>BLACK EXPERIENCE</summary><p>'+t('black')+'</p></details></div>');
 const content={
  '':()=>panel('welcome','<p>'+t('philosophy')+'</p>'+link('retreat/programme','programme'))+ (signedIn?'<div id="retreat-event-details-outlet"></div>':'') +journey+concept,
  programme:()=>panel('programme',signedIn?link('retreat-programme','programme'):pending)+concept,
  preparation:()=>panel('preparation',(signedIn?'<div id="retreat-event-details-outlet"></div>':
    '<dl class="retreat-logistics">'+['date','location','dress','packing'].map(key=>'<div><dt>'+t(key)+'</dt></div>').join('')+'</dl>'+pending)+preparation)+
    panel('prepare','<div class="actions">'+link('practice/breathing','breathe')+link('practice/meditation','meditate')+'</div>'),
  intention:()=>signedIn?panel('intention',link('retreat-forms','intention')):intention,
  mentor:()=>panel('mentor',signedIn?'<div class="actions">'+link('retreat-tasks','tasks')+link('retreat-connect','connect')+'</div>':restricted),
  letter:()=>letter,
  after:()=>panel('after','<p>'+t('afterIntro')+'</p>'+link('retreat/intention','myIntention')+link('retreat/letter','letter')+reflection+'<div class="retreat-next-step"><h3>'+t('nextStep')+'</h3><div class="actions">'+link('journal','journal')+link('practice/meditation','meditate')+'</div></div>'+
    (signedIn?'<div class="actions">'+link('retreat-forms','intention')+link('retreat-connect','connect')+'</div>':''))
 };
 return '<a class="link" href="#today">'+t('back')+'</a><header class="retreat-feature retreat-hero">'+
  '<span class="eyebrow">BODY · MIND · SPIRIT</span><h1>RESTART RETREAT</h1></header>'+
  '<nav class="retreat-nav" aria-label="'+t('nav')+'">'+nav+'</nav>'+content[retreatSection(section)]();
}
