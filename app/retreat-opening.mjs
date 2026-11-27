import {languages} from './state.mjs';

const copy = {
 title:['Начало пути','Yolun başlanğıcı','The beginning of the journey'],
 guidance:[
  'Устройся удобно. Позволь дыханию идти в естественном ритме. Обрати внимание на опору под собой. Если мысли отвлекают, мягко верни внимание к ощущениям. Ты можешь остановиться в любой момент.',
  'Rahat otur. Nəfəsini təbii ritmində saxla. Bədəninin nəyə söykəndiyini hiss et. Fikrin yayınsa, diqqətini sakitcə hisslərinə qaytar. İstənilən an dayana bilərsən.',
  'Get comfortable. Let your breathing follow its natural rhythm. Notice what is supporting your body. If your mind wanders, gently return to those sensations. You can stop at any time.'
 ],
 start:['Начать · 5 минут','Başla · 5 dəqiqə','Start · 5 minutes'],
 stop:['Остановить','Dayandır','Stop'],
 skip:['Перейти к намерению','Niyyətə keç','Continue to intention'],
 timer:['Оставшееся время','Qalan vaxt','Time remaining']
};

const translate = lang => key => copy[key][Math.max(0,languages.indexOf(lang))];

export function openingTime(seconds) {
 return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
}

export function renderRetreatOpening(lang) {
 const t=translate(lang);
 return '<section class="panel retreat-panel" data-retreat-opening><h2>'+t('title')+'</h2><p>'+t('guidance')+'</p>'+
  '<p role="timer" aria-label="'+t('timer')+'" data-opening-time>'+openingTime(300)+'</p>'+
  '<div class="actions"><button type="button" data-opening-start>'+t('start')+'</button>'+
  '<button type="button" data-opening-stop hidden>'+t('stop')+'</button>'+
  '<a class="button" href="#retreat/intention">'+t('skip')+'</a></div></section>';
}

export function bindRetreatOpening(outlet) {
 const panel=outlet.querySelector('[data-retreat-opening]');
 if (!panel) return;
 const start=panel.querySelector('[data-opening-start]');
 const stop=panel.querySelector('[data-opening-stop]');
 const clock=panel.querySelector('[data-opening-time]');
 let timer;
 const reset=()=>{
  clearInterval(timer);
  clock.textContent=openingTime(300);
  start.hidden=false;
  stop.hidden=true;
 };
 start.onclick=()=>{
  reset();
  start.hidden=true;
  stop.hidden=false;
  stop.focus();
  const end=Date.now()+300000;
  timer=setInterval(()=>{
   if (!panel.isConnected) {clearInterval(timer);return;}
   const remaining=Math.max(0,Math.ceil((end-Date.now())/1000));
   clock.textContent=openingTime(remaining);
   if (remaining===0) {
    clearInterval(timer);
    location.hash='retreat/intention';
   }
  },250);
 };
 stop.onclick=()=>{reset();start.focus();};
}
