'use strict';
const $=s=>document.querySelector(s);
const languages=['ru','az','en'];
const tracks=['MIND','BODY','NUTRITION','LIFE'];
const weekdays=[
 ['Вторник','Çərşənbə axşamı','Tuesday'],['Среда','Çərşənbə','Wednesday'],['Четверг','Cümə axşamı','Thursday'],['Пятница','Cümə','Friday'],['Суббота','Şənbə','Saturday'],['Воскресенье','Bazar','Sunday'],['Понедельник','Bazar ertəsi','Monday']];
const themes=[
 ['Точка отсчёта: искусство присутствия','Başlanğıc nöqtəsi: hazır olma sənəti','Starting point: the art of presence'],['Дыхание и восстановление','Nəfəs və bərpa','Breathing and recovery'],['Искусство внутренней силы','Daxili güc sənəti','The art of inner strength'],['Мобильность и восстановление','Hərəkətlilik və bərpa','Mobility and recovery'],['Устойчивость среди перемен','Dəyişikliklər içində sabitlik','Steadiness amid change'],['Отдых и недельный отчёт','İstirahət və həftəlik hesabat','Rest and weekly review'],['Рефлексия и подготовка','Düşünmək və hazırlaşmaq','Reflection and preparation']];
const key='restart.programme56.awakening.v3';
function read(key){try{return localStorage.getItem(key)}catch{return null}}
let lang=read('yogaspace.language')||'ru';
if(!languages.includes(lang))lang='ru';
function t(...words){return words[languages.indexOf(lang)]}
function saved(){try{return JSON.parse(read(key))?.done||{}}catch{return {}}}
let done=saved();
function id(day,track){return 'w01.d'+(day+1)+'.'+tracks[track].toLowerCase()}
function count(day){return tracks.filter((_,i)=>done[id(day,i)]).length}
function nextDay(){return weekdays.findIndex((_,i)=>count(i)<4)}
const title=()=>t('Неделя 1 — Пробуждение','1-ci həftə — Oyanış','Week 1 — Awakening');
const tabs=()=>[t('Предзапись','İlkin qeydiyyat','Pre-registration'),t('Первая неделя','Birinci həftə','Week one'),t('Мой прогресс','İrəliləyişim','My progress'),...schoolTabs()];
const dayWord=()=>t('День','Gün','Day');
function routeURL(route){
 const standalone=!document.body.dataset.page;
 return standalone?'#'+route:route.startsWith('day-')?pageUrl('calendar')+'#'+route:pageUrl(route);
}
function go(route,label){
 return '<a class="cta" href="'+routeURL(route)+'">'+label+'</a>';
}
const local=()=>t('Отметки сохраняются в этом браузере.','Qeydlər bu brauzerdə saxlanılır.','Your checkmarks are saved in this browser.');
function signup(){
 const demo=t('Пример заявки. Контакт используется только для проверки формы и исчезает после подтверждения. Организатор его не получает.','Sınaq ərizəsi. Əlaqə məlumatı yalnız formanı yoxlamaq üçündür və təsdiqdən sonra silinir. Təşkilatçıya göndərilmir.','Demo application. Your contact is used only to validate the form and is cleared on confirmation. The organiser receives nothing.');
 return '<h2>'+tabs()[0]+'</h2><form><p>'+demo+'</p><label class="label">'+t('Тариф','Paket','Plan')+'<select required><option>STANDARD</option><option>PREMIUM</option></select></label><label class="label">'+t('Контактный email (можно тестовый)','Əlaqə üçün e-poçt (sınaq ünvanı da olar)','Contact email (a test address is fine)')+'<input type="email" autocomplete="off" required placeholder="name@example.com"></label><details open><summary>'+t('Условия демонстрации','Sınaq şərtləri','Demo terms')+'</summary><p>'+t('Просмотр первой недели свободный. Выбор тарифа в примере не бронирует место и не создаёт обязательства по оплате.','Birinci həftəyə sərbəst baxa bilərsiniz. Sınaqda paket seçimi yer ayırmır və ödəniş öhdəliyi yaratmır.','You can explore week one freely. Selecting a plan here does not reserve a place or create a payment obligation.')+'</p></details><label class="label"><input type="checkbox" required> '+t('Согласен на обработку контакта в этой форме на устройстве.','Əlaqə məlumatımın bu cihazdakı formada işlənməsinə razıyam.','I agree to my contact being processed in this form on this device.')+'</label><label class="label"><input type="checkbox" required> '+t('Я ознакомился с условиями демонстрации.','Sınaq şərtləri ilə tanış oldum.','I have read the demo terms.')+'</label><button>'+t('Проверить заявку','Ərizəni yoxla','Check application')+'</button></form>'+go('calendar',t('Посмотреть неделю без заявки','Ərizəsiz həftəyə bax','Explore without applying'));
}
function calendar(){
 const n=nextDay();
 return '<p class="draft">'+t('Рабочая версия методологии · для обсуждения','Metodikanın müzakirə üçün işçi versiyası','Methodology draft for review')+'</p><h2>'+tabs()[1]+'</h2><p>'+t('Начните со вторника. Можно вернуться к любому дню.','Çərşənbə axşamından başlayın. İstənilən günə qayıda bilərsiniz.','Start on Tuesday. You can revisit any day.')+'</p>'+ (n<0?go('progress',tabs()[2]):go('day-'+(n+1),t('Продолжить','Davam et','Continue')+' · '+t(...weekdays[n])))+'<div class="cards" style="margin-top:18px">'+themes.map((theme,i)=>'<article><small>'+dayWord()+' '+(i+1)+' · '+t(...weekdays[i])+'</small><h3><a href="#day-'+(i+1)+'">'+t(...theme)+'</a></h3><span>'+count(i)+' / 4 · '+t(...stages[dayStages[i]])+'</span></article>').join('')+'</div>';
}
function day(i){
 return '<p class="draft">'+t('Практика дня','Günün məşqi','Daily practice')+' · '+t(...stages[dayStages[i]])+'</p><h2>'+dayWord()+' '+(i+1)+' · '+t(...themes[i])+'</h2><p>'+t(...weekdays[i])+' · '+local()+'</p><div class="days">'+weekdays.map((_,d)=>'<a aria-label="'+dayWord()+' '+(d+1)+'" '+(i===d?'aria-current="page"':'')+' href="#day-'+(d+1)+'">'+(d+1)+'</a>').join('')+'</div><div class="cards">'+window.weekTasks[i].map((task,k)=>taskCard(task,i,k)).join('')+'</div>'+sessionPlan(i)+dayNotes(i)+'<div>'+'</div><p>'+go(i===6?'progress':'day-'+(i+2),i===6?tabs()[2]:t('Следующий день','Növbəti gün','Next day'))+'</p>';
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
 return '<h2>'+t('Недельный отчёт','Həftəlik hesabat','Weekly report')+'</h2><p>'+local()+'</p>'+priorProgress()+'<article><h3>'+rows.length+' / 28</h3><progress aria-label="'+tabs()[2]+'" max="28" value="'+rows.length+'"></progress><p>'+t('Полностью пройдено дней','Tamamlanan günlər','Days completed')+' · '+weekdays.filter((_,i)=>count(i)===4).length+' / 7</p>'+go(nextDay()<0?'calendar':'day-'+(nextDay()+1),nextDay()<0?tabs()[1]:t('К текущему дню','Cari günə keç','Go to current day'))+'</article><div class="cards">'+tracks.map(n=>'<article><h3>'+n+'</h3>'+rows.filter(r=>r.name===n).length+' / 7</article>').join('')+'</div><h3>'+t('История недели','Həftənin tarixçəsi','Week history')+'</h3>'+(rows.length?'<ul>'+rows.map(r=>'<li><a href="'+routeURL('day-'+(r.d+1))+'">'+dayWord()+' '+(r.d+1)+' · '+r.name+'</a> · '+new Date(r.time).toLocaleDateString(lang)+'</li>').join('')+'</ul>':t('Здесь появятся отмеченные задания.','Tamamladığınız tapşırıqlar burada görünəcək.','Your completed tasks will appear here.'));
}
function renderLegacy(){
 document.documentElement.lang=lang;$('#lang').value=lang;document.title='RESTART · '+title();
 $('#kicker').textContent=t('ПРОГРАММА · 56 ДНЕЙ','PROQRAM · 56 GÜN','PROGRAMME · 56 DAYS');$('#headline').textContent=title();
 $('#lead').textContent=t('Не стать другим. Раскрыть себя.','Özünü dəyişdirməyə çalışma. Özünü kəşf et.','Discover who you are, beyond who you think you should become.');
 const hash=location.hash.slice(1)||'calendar',routes=['signup','calendar','progress','method','code','path','journal'];
 const dayMatch=/^day-([1-7])$/.exec(hash);
 $('nav').innerHTML=tabs().map((label,i)=>'<a '+((dayMatch?'calendar':hash)===routes[i]?'aria-current="page"':'')+' href="#'+routes[i]+'">'+label+'</a>').join('');
 $('#view').innerHTML=dayMatch?day(Number(dayMatch[1])-1):hash==='method'?method():['code','path','journal'].includes(hash)?schoolPage(hash):hash==='progress'?skillsReport()+report():hash==='calendar'?calendar():signup();
 hydrateFields();
}
function render(){
 if(!document.body.dataset.page){renderLegacy();return}
 document.documentElement.lang=lang;
 $('#lang').value=lang;
 const page=document.body.dataset.page;
 const dayMatch=/^#day-([1-7])$/.exec(location.hash);
 buildShell(lang);
 schoolHeader(page);
 $('#view').innerHTML=routePage(page,dayMatch);
 hydrateFields();
}
$('#lang').onchange=e=>{lang=e.target.value;try{localStorage.setItem('yogaspace.language',lang)}catch{}render()};
$('#view').addEventListener('change',e=>{
 const input=e.target;if(!input.dataset.task)return;
 const latest=saved();if(input.checked)latest[input.dataset.task]=Date.now();else delete latest[input.dataset.task];
 try{localStorage.setItem(key,JSON.stringify({version:1,done:latest}));done=latest}
 catch{input.checked=!input.checked;$('#notice').textContent=t('Не удалось сохранить отметку.','Qeydi saxlamaq mümkün olmadı.','Could not save this checkmark.')}
});
$('#view').addEventListener('submit',e=>{e.preventDefault();e.target.reset();if(!document.body.dataset.page)location.hash='calendar';$('#notice').textContent=t('Форма проверена. Заявка не отправлена.','Forma yoxlanıldı. Ərizə göndərilmədi.','Form checked. No application was sent.')});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});
window.addEventListener('storage',e=>{if(e.key===key){done=saved();render()}});
render();
