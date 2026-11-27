import {schoolTimeZone} from './booking-calendar.mjs';
import {languages} from './state.mjs';

export const retreatStart='2026-11-28T14:00:00+04:00';
export const retreatEnd='2026-11-29T14:00:00+04:00';

const sessions=[
 ['WHITE','2026-11-28',[
  ['14:00','Прибытие, регистрация и чай','Gəliş, qeydiyyat və çay','Arrival, check-in and tea'],
  ['15:00','Открытие','Açılış','Opening'],
  ['15:15','Йога','Yoqa','Yoga'],
  ['16:00','Звуковая практика: шавасана, медитация, поющие чаши, ханг','Səs praktikası: şavasana, meditasiya, səs kasaları, handpan','Sound healing: savasana, meditation, singing bowls, handpan'],
  ['17:00','Рефлексия','Düşüncələrə vaxt','Reflection'],
  ['17:10','Полезный перекус','Sağlam qəlyanaltı','Healthy snack'],
  ['17:30','Лекция BODY MIND SPIRIT','BODY MIND SPIRIT mühazirəsi','BODY MIND SPIRIT talk'],
  ['18:00','Чайная церемония','Çay mərasimi','Tea ceremony'],
  ['18:30','Барбекю и полезная еда','Manqal və sağlam yeməklər','BBQ and healthy food'],
  ['20:30','Переход из WHITE в BLACK','WHITE mərhələsindən BLACK mərhələsinə keçid','White to Black']
 ]],
 ['BLACK','2026-11-28',[
  ['21:00','Body Experience','Body Experience','Body Experience'],
  ['21:30','FIRE & MOVEMENT','FIRE & MOVEMENT','FIRE & MOVEMENT',['По решению организаторов. Альтернатива — спокойная практика движения.',
   'Təşkilatçıların qərarından asılıdır. Alternativ — sakit hərəkət praktikası.',
   'Subject to organiser approval. Alternative: a gentle movement session.']],
  ['22:30','Круг с хангом','Handpan ətrafında dairə','Handpan circle'],
  ['22:45','Отдых и общение','İstirahət və ünsiyyət','Rest and social time']
 ]],
 ['REBIRTH','2026-11-29',[
  ['09:00','Подъём','Oyanış','Wake-up'],
  ['09:30','Йога','Yoqa','Yoga'],
  ['10:15','Медитация','Meditasiya','Meditation'],
  ['10:45','Завтрак','Səhər yeməyi','Breakfast'],
  ['12:00','Свободное время','Sərbəst vaxt','Free time'],
  ['13:00','Заключительная рефлексия и письмо себе в будущее','Yekun düşüncələr və gələcəkdəki özünə məktub','Final reflection and letter to your future self'],
  ['13:30','Закрытие','Bağlanış','Closing'],
  ['14:00','Завершение ретрита','Retritin sonu','Retreat ends']
 ]]
];

const copy={
 programme:['Официальная программа','Rəsmi proqram','Official programme'],
 timeZone:['Время Баку','Bakı vaxtı','Baku time'],
 countdown:['До начала ретрита','Retritin başlamasına qalıb','Time until the retreat starts'],
 inProgress:['Ретрит идёт','Retrit davam edir','The retreat is underway'],
 ended:['Ретрит завершён','Retrit başa çatıb','The retreat has ended'],
 days:['д','g','d'],hours:['ч','s','h'],minutes:['мин','dəq','min'],seconds:['с','san','sec'],
 leads:['Программу ведёт Эльхан Гюльмалыев. Чайную церемонию проводит приглашённый чайный мастер.',
  'Proqramı Elxan Gülmalıyev aparır. Çay mərasimini dəvət olunmuş çay ustası keçirir.',
  'Elxan Gülmalıyev leads the programme. A guest tea master leads the tea ceremony.']
};

const languageIndex=lang=>Math.max(0,languages.indexOf(lang));

export function retreatOfficialClock(now=new Date()) {
 const current=Number(now);
 if (current>=Date.parse(retreatEnd)) return {phase:'ended'};
 if (current>=Date.parse(retreatStart)) return {phase:'inProgress'};
 const total=Math.max(0,Math.ceil((Date.parse(retreatStart)-current)/1000));
 return {phase:'countdown',days:Math.floor(total/86400),hours:Math.floor(total/3600)%24,
  minutes:Math.floor(total/60)%60,seconds:total%60};
}

function countdownText(lang,now) {
 const index=languageIndex(lang);
 const clock=retreatOfficialClock(now);
 if (clock.phase!=='countdown') return copy[clock.phase][index];
 return copy.countdown[index]+' · '+['days','hours','minutes','seconds']
  .map(key=>clock[key]+' '+copy[key][index]).join(' ');
}

export function renderRetreatOfficial(lang,{now=new Date(),summaryOnly=false}={}) {
 const index=languageIndex(lang);
 const t=key=>copy[key][index];
 const displayDay=new Intl.DateTimeFormat(languages[index],{day:'numeric',month:'long',year:'numeric',timeZone:schoolTimeZone});
 const label=day=>displayDay.format(new Date(day+'T12:00:00+04:00'));
 return '<section class="panel" aria-labelledby="retreat-official-title"><h2 id="retreat-official-title">'+t('programme')+'</h2>'+
  '<p><time datetime="'+retreatStart+'">'+label('2026-11-28')+' 14:00</time> – '+
  '<time datetime="'+retreatEnd+'">'+label('2026-11-29')+' 14:00</time> · '+t('timeZone')+'</p>'+
  '<p role="timer" aria-live="off" data-retreat-official-clock>'+countdownText(lang,now)+'</p>'+
  (summaryOnly?'':'<p>'+t('leads')+'</p>'+
  sessions.map(([phase,day,items])=>'<section><h3>'+phase+' · '+label(day)+'</h3><ol class="history">'+
   items.map(row=>'<li><time datetime="'+day+'T'+row[0]+':00+04:00">'+row[0]+'</time><div>'+
    row[index+1]+(row[4]?'<small>'+row[4][index]+'</small>':'')+'</div></li>').join('')+'</ol></section>') .join(''))+
  '</section>';
}

export function bindRetreatOfficial(outlet,lang) {
 const timer=outlet.querySelector('[data-retreat-official-clock]');
 if (!timer) return;
 const now=new Date();
 timer.textContent=countdownText(lang,now);
 if (retreatOfficialClock(now).phase!=='countdown') return;
 const interval=setInterval(()=>{
  if (!timer.isConnected) {clearInterval(interval);return;}
  const now=new Date();
  timer.textContent=countdownText(lang,now);
  if (retreatOfficialClock(now).phase!=='countdown') clearInterval(interval);
 },1000);
 return ()=>clearInterval(interval);
}
