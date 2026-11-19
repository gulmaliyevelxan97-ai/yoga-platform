'use strict';
const $=s=>document.querySelector(s);
const languages=['ru','az','en'];
const tracks=['MIND','BODY','NUTRITION','LIFE'];
const weekdays=[
 ['Вторник','Çərşənbə axşamı','Tuesday'],['Среда','Çərşənbə','Wednesday'],['Четверг','Cümə axşamı','Thursday'],['Пятница','Cümə','Friday'],['Суббота','Şənbə','Saturday'],['Воскресенье','Bazar','Sunday'],['Понедельник','Bazar ertəsi','Monday']];
const key='restart.programme56.awakening.v3';
function read(key){try{return localStorage.getItem(key)}catch{return null}}
let lang=read('yogaspace.language')||'ru';
if(!languages.includes(lang))lang='ru';
function t(...words){return words[languages.indexOf(lang)]}
function saved(){try{return JSON.parse(read(key))?.done||{}}catch{return {}}}
let done=saved();
function id(day,track){return 'w01.d'+(day+1)+'.'+tracks[track].toLowerCase()}
function count(day){return tracks.filter((_,i)=>done[id(day,i)]).length}
const dayWord=()=>t('День','Gün','Day');
function go(route,label){
 return '<a class="cta" href="'+pageUrl(route)+'">'+label+'</a>';
}
const local=()=>t('Отметки сохраняются в этом браузере.','Qeydlər bu brauzerdə saxlanılır.','Your checkmarks are saved in this browser.');
function signup(){
 const demo=t('Пример заявки. Контакт используется только для проверки формы и исчезает после подтверждения. Организатор его не получает.','Sınaq ərizəsi. Əlaqə məlumatı yalnız formanı yoxlamaq üçündür və təsdiqdən sonra silinir. Təşkilatçıya göndərilmir.','Demo application. Your contact is used only to validate the form and is cleared on confirmation. The organiser receives nothing.');
 return '<h2>'+t('Предзапись','İlkin qeydiyyat','Pre-registration')+'</h2><form><p>'+demo+'</p><label class="label">'+t('Тариф','Paket','Plan')+'<select required><option>STANDARD</option><option>PREMIUM</option></select></label><label class="label">'+t('Контактный email (можно тестовый)','Əlaqə üçün e-poçt (sınaq ünvanı da olar)','Contact email (a test address is fine)')+'<input type="email" autocomplete="off" required placeholder="name@example.com"></label><details open><summary>'+t('Условия демонстрации','Sınaq şərtləri','Demo terms')+'</summary><p>'+t('Выбор тарифа в примере не бронирует место и не создаёт обязательства по оплате.','Sınaqda paket seçimi yer ayırmır və ödəniş öhdəliyi yaratmır.','Selecting a plan here does not reserve a place or create a payment obligation.')+'</p></details><label class="label"><input type="checkbox" required> '+t('Согласен на обработку контакта в этой форме на устройстве.','Əlaqə məlumatımın bu cihazdakı formada işlənməsinə razıyam.','I agree to my contact being processed in this form on this device.')+'</label><label class="label"><input type="checkbox" required> '+t('Я ознакомился с условиями демонстрации.','Sınaq şərtləri ilə tanış oldum.','I have read the demo terms.')+'</label><button>'+t('Проверить заявку','Ərizəni yoxla','Check application')+'</button></form>'+go('programme',t('Посмотреть названия этапов','Mərhələlərin adlarına bax','View the stage names'));
}
function priorProgress(){
 const keys=['restart.programme56.v1','restart.programme56.awakening.v2'];
 const priorCount=keys.reduce((sum,key)=>{
   try{return sum+Object.values(JSON.parse(read(key))?.done||{}).filter(Number.isFinite).length}
   catch{return sum}
 },0);
 return priorCount ? '<p>'+t('Отметки прежних версий','Əvvəlki versiyaların qeydləri','Checkmarks from earlier versions')+' · '+priorCount+'</p>':'';
}
function report(){
 const rows=weekdays.flatMap((_,d)=>tracks.map((name,k)=>({name,d,time:done[id(d,k)]}))).filter(v=>Number.isFinite(v.time)).sort((a,b)=>b.time-a.time);
 return '<h2>'+t('Недельный отчёт','Həftəlik hesabat','Weekly report')+'</h2><p>'+local()+'</p>'+priorProgress()+'<article><h3>'+rows.length+' / 28</h3><progress aria-label="'+t('Прогресс','İrəliləyiş','Progress')+'" max="28" value="'+rows.length+'"></progress><p>'+t('Полностью пройдено дней','Tamamlanan günlər','Days completed')+' · '+weekdays.filter((_,i)=>count(i)===4).length+' / 7</p></article><div class="cards">'+tracks.map(n=>'<article><h3>'+n+'</h3>'+rows.filter(r=>r.name===n).length+' / 7</article>').join('')+'</div><h3>'+t('История недели','Həftənin tarixçəsi','Week history')+'</h3>'+(rows.length?'<ul>'+rows.map(r=>'<li>'+dayWord()+' '+(r.d+1)+' · '+r.name+' · '+new Date(r.time).toLocaleDateString(lang)+'</li>').join('')+'</ul>':t('Здесь появятся отмеченные задания.','Tamamladığınız tapşırıqlar burada görünəcək.','Your completed tasks will appear here.'));
}
function render(){
 document.documentElement.lang=lang;
 $('#lang').value=lang;
 const page=document.body.dataset.page;
 buildShell(lang);
 schoolHeader(page);
 $('#view').innerHTML=routePage(page);
 hydrateFields();
}
$('#lang').onchange=e=>{lang=e.target.value;try{localStorage.setItem('yogaspace.language',lang)}catch{}render()};
$('#view').addEventListener('submit',e=>{e.preventDefault();e.target.reset();$('#notice').textContent=t('Форма проверена. Заявка не отправлена.','Forma yoxlanıldı. Ərizə göndərilmədi.','Form checked. No application was sent.')});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});
window.addEventListener('storage',e=>{if(e.key===key){done=saved();render()}});
render();
