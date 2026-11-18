'use strict';

const restartPages = {
 home:['','Главная','Ana səhifə','Home'],
 about:['about.html','О RESTART','RESTART haqqında','About RESTART'],
 method:['philosophy.html','Философия','Fəlsəfə','Philosophy'],
 code:['code.html','Кодекс школы','Məktəbin prinsipləri','School code'],
 programme:['programme.html','Программа','Proqram','Programme'],
 path:['my-path.html','Мой путь','Mənim yolum','My path'],
 practices:['practices.html','Практики','Məşqlər','Practices'],
 journal:['journal.html','Дневник','Gündəlik','Journal'],
 progress:['progress.html','Мой прогресс','İrəliləyişim','My progress'],
 signup:['participation.html','Участие','İştirak','Participation'],
 activity:['activity.html','История и избранное','Tarixçə və seçilmişlər','History and favourites'],
 calendar:['week-one.html','Первая неделя','Birinci həftə','Week one']
};
const restartPage = document.body.dataset.page;
const navRoot = document.querySelector('[data-shell]');
function pageUrl(key){return './'+restartPages[key][0]}
function buildShell(locale){
 const i=Math.max(0,['ru','az','en'].indexOf(locale));
 const n=(key,caption)=>'<a href="'+pageUrl(key)+'"'+(restartPage===key?' aria-current="page"':'')+'>'+(caption||restartPages[key][i+1])+'</a>';
 navRoot.querySelector('.top-links').innerHTML=['about','method','programme','practices'].map(key=>n(key)).join('');
 navRoot.querySelector('.dock').innerHTML=['home','path','practices','progress'].map(key=>n(key)).join('');
 navRoot.querySelector('.all-links').innerHTML=Object.keys(restartPages).map(key=>n(key)).join('');
 navRoot.querySelector('.all-menu summary').textContent=['Разделы','Bölmələr','Sections'][i];
 const footer=document.querySelector('[data-school-footer]');
 if(footer)footer.innerHTML='<a href="./">RESTART</a><div>'+['code','journal','signup'].map(key=>n(key)).join('')+'<a href="./assets/brand/yoga-space-archive.jpg">'+['Фотоархив','Fotoarxiv','Photo archive'][i]+'</a></div>';
}
const programmeHashes=new Set(['restart56']);
const aboutHashes=new Set(['philosophy','foundations','ph-mind','ph-body','ph-nutrition','ph-life','directions']);
const activityHashes=new Set(['profile','membership','plan','app-settings']);
const practiceHashes=new Set(['practices','classes','studio','yoga','breath','meditation','course','courses','library','watch','live','video','about','founder','teacher-elxan','film','pricing']);
function legacyRoute(hash){
 const section=hash.slice(1).split('/')[0];
 if(programmeHashes.has(section))return pageUrl('programme');
 if(aboutHashes.has(section))return pageUrl('about')+hash;
 if(activityHashes.has(section))return pageUrl('activity')+hash;
 if(practiceHashes.has(section))return pageUrl('practices')+hash;
 return '';
}
if(restartPage==='home'&&legacyRoute(location.hash))location.replace(legacyRoute(location.hash));
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const anchor=event.target.closest('a[href^="#"]');
 if(!anchor||!['practices','activity'].includes(restartPage))return;
 const href=anchor.getAttribute('href');
 const destination=href==='#directions'&&restartPage==='practices'?'':href==='#top'?'./':legacyRoute(href);
 if(destination&&!destination.startsWith(pageUrl(restartPage))){event.preventDefault();location.assign(destination)}
});

if ('serviceWorker' in navigator && !['practices','activity'].includes(restartPage)) {
 navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
