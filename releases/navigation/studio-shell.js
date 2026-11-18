'use strict';
buildShell(document.getElementById('language').value);
document.getElementById('language').addEventListener('change', event=>buildShell(event.target.value));

const filter=document.getElementById('practice-type');
if(filter){
 function updatePracticeFilter(){
   const captions=language==='az'?['Məşq növü','Hamısı','Taymerli məşqlər','Video']:language==='en'?['Practice type','All','Guided timers','Video']:['Тип занятия','Все','Практики с таймером','Видео'];
   document.getElementById('practice-type-label').textContent=captions[0];
   [...filter.options].forEach((option,i)=>option.textContent=captions[i+1]);
 }
 filter.onchange=()=>{document.body.dataset.practiceFilter=filter.value};
 document.getElementById('language').addEventListener('change',updatePracticeFilter);
 updatePracticeFilter();
 window.addEventListener('hashchange',()=>{
   if(location.hash==='#library'||location.hash.startsWith('#watch/'))filter.value='video';
   else if(location.hash==='#practices'||location.hash==='#courses')filter.value='guided';
   else filter.value='all';
   document.body.dataset.practiceFilter=filter.value;
 });
}
