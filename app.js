const hasKey = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
const el = id => document.getElementById(id);
function link(label, hash, className) {
  const a = document.createElement('a');
  a.textContent = label;
  a.href = '#' + hash;
  a.className = className;
  return a;
}
const sessionPrefix = 'yogaspace.session.';
const memorySessions = new Map();
let storageOK = true;
let language = 'ru';
try {
  const saved = localStorage.getItem('yogaspace.language');
  if (hasKey(lessonsByLanguage, saved)) language = saved;
} catch { storageOK = false; }
const t = key => phrases[key][['ru','az','en'].indexOf(language)];
let library = lessonsByLanguage[language];
let remaining = 0, deadline = 0, interval, activeRoute = '', lesson;
let currentSessions=[], contextCourse='', planSlot='', currentPath='', savedSecond=-1;
function renderProfile() {
  const sessions = new Map(memorySessions);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(sessionPrefix)) continue;
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (hasKey(library,entry.group) && Number.isInteger(entry.index) && library[entry.group].lessons[entry.index] &&
          [1,3,5,10,15].includes(entry.minutes) && Number.isSafeInteger(entry.date) &&
          Number.isFinite(new Date(entry.date).getTime())) sessions.set(key,entry);
      } catch { /* Skip an incomplete history entry. */ }
    }
  } catch { storageOK = false; }
  const sorted = [...sessions.values()].sort((a,b)=>b.date-a.date);
  el('sessionCount').textContent = sorted.length;
  const totalMinutes = sorted.reduce((sum,s)=>sum+s.minutes,0);
  el('minuteCount').textContent = totalMinutes;
  currentSessions=sorted;
  renderExtras(sorted,totalMinutes);
  dashboard(sorted);
  el('storageNote').textContent = t(storageOK?'local':'unavailable');
  el('empty').hidden = !!sorted.length;
  el('history').replaceChildren(...sorted.map(s=>{
    const li = document.createElement('li');
    const date = new Intl.DateTimeFormat(language,{day:'numeric',month:'short'}).format(s.date);
    li.textContent = library[s.group].lessons[s.index][0] + ' · ' + s.minutes + ' ' + t('minute') + ' · ' + date;
    return li;
  }));
}
function complete() {
  const [group,index] = activeRoute.split('/');
  const date = Date.now();
  const key = sessionPrefix + date + '.' + Math.random().toString(36).slice(2);
  const entry = {group,index:Number(index)-1,date,minutes:Number(el('length').value)};
  if(contextCourse) entry.course=contextCourse;
  if(planSlot) entry.planSlot=planSlot;
  saveSetting('resume',null);
  memorySessions.set(key,entry);
  try { localStorage.setItem(key,JSON.stringify(entry)); } catch { storageOK = false; }
  renderProfile();
}
function checkpoint(){
  if(!activeRoute || remaining<=0 || remaining>=duration()) return;
  saveSetting('resume',{id:activeRoute,minutes:Number(el('length').value),left:remaining,course:contextCourse,slot:planSlot});
}
function duration() { return Number(el('length').value) * 60000; }
function stop() {
  clearInterval(interval);
  deadline = 0;
}
function draw() {
  if (deadline) remaining = Math.max(0,deadline - Date.now());
  if (!remaining && deadline) { stop(); complete(); }
  const seconds = Math.ceil(remaining / 1000);
  el('time').textContent = [Math.floor(seconds/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
  if(deadline && seconds!==savedSecond){savedSecond=seconds;if(seconds%5===0) checkpoint();}
  const step = Math.min(2,Math.floor(3*(1-remaining/duration())));
  Array.from(el('steps').children).forEach((item,i)=>item.classList.toggle('current',Boolean(deadline) && i===step));
  const elapsed = duration() - remaining;
  el('elapsed').value = elapsed / duration();
  const guide = activeRoute === 'breath/1' && step === 1 && Boolean(deadline);
  el('breathCue').hidden = !guide;
  if (guide) el('breathCue').textContent = t(Math.floor((elapsed-duration()/3)/2000)%2 ? 'exhale':'inhale');
  const status = deadline ? t('step').replace('{n}',step+1) : t(!remaining?'done':remaining===duration()?'ready':'paused');
  if (el('status').textContent !== status) el('status').textContent = status;
  el('toggle').textContent = t(deadline?'pause':!remaining?'again':remaining===duration()?'start':'resume');
}
function reset() {
  stop();
  remaining = duration();
  draw();
}
el('toggle').onclick = () => {
  if (deadline) {
    draw();checkpoint();
    stop();
  } else {
    if (!remaining) remaining = duration();
    deadline = Date.now()+remaining;
    interval = setInterval(draw,200);
  }
  draw();
};
function userReset(){saveSetting('resume',null);reset();renderProfile();}
el('reset').onclick = userReset;
el('length').onchange = userReset;
document.addEventListener('visibilitychange',()=>{ if (deadline) {draw();checkpoint();} });
window.addEventListener('pagehide',()=>{if(deadline){draw();checkpoint();}});
function route(translateOnly = false) {
  const [id,index='1',suggested,source,slot] = location.hash.slice(1).split('/');
  el('moreNav').open=false;
  const currentTeacher = Object.values(teachers).find(teacher=>teacher.profile===id);
  const showFounder = Boolean(currentTeacher);
  if (showFounder) renderTeacherStory(currentTeacher);
  const programme = id==='course' && programmes.find(c=>c.id===index);
  const showPricing=id==='pricing';
  const wasDetail = !el('coursePage').hidden || document.body.classList.contains('pricing-page');
  document.body.classList.toggle('pricing-page',showPricing);
  if(programme) renderProgramme(programme,currentSessions);
  const wasFounder = !el('founder').hidden;
  for (const section of document.querySelectorAll('main > section')) {
    if (section.id !== 'studio') section.hidden = section.id === 'coursePage' ? !programme : section.id === 'founder' ? !showFounder : (showFounder || Boolean(programme) || (showPricing && section.id!=='pricing'));
  }
  document.title = 'Yoga Space · ' + t(showFounder?(currentTeacher.profileLabel || 'teacher'):'page');
  if(showPricing){document.title=t('pricing')+' · Yoga Space';if(translateOnly!==true)el('pricing').scrollIntoView();}
  if(programme){document.title=t(programme.title)+' · Yoga Space';if(translateOnly!==true){el('courseTitle').focus();el('coursePage').scrollIntoView();}}
  if (showFounder && translateOnly !== true) {el('founderTitle').focus();el('founder').scrollIntoView();}
  if ((wasFounder || wasDetail) && !programme && !showFounder && !hasKey(library,id)) document.getElementById(id)?.scrollIntoView();
  if (!hasKey(library,id)) {
    if (deadline) {draw();checkpoint();}
    stop();
    if(activeRoute) renderProfile();
    activeRoute = '';currentPath='';
    el('studio').hidden = true;
    return;
  }
  const group = library[id];
  const selected = Number(index) > 0 && group.lessons[Number(index)-1] ? Number(index)-1 : 0;
  const key = id + '/' + (selected+1);
  const changed = location.hash !== currentPath;
  if (changed || translateOnly === true) {
    if (changed && deadline) { draw();checkpoint();stop(); }
    activeRoute = key;currentPath=location.hash;
    el('category').textContent = group.name;
    el('lessons').replaceChildren(...group.lessons.map(([name],i)=>{
      const a = link(name,id+'/'+(i+1),'pill');
      if (i===selected) a.setAttribute('aria-current','true');
      return a;
    }));
    lesson = group.lessons[selected];
    el('title').textContent = lesson[0];
    el('intro').textContent = lesson[1];
    el('steps').replaceChildren(...lesson[2].map(text=>{
      const li = document.createElement('li');
      li.textContent = text;
      return li;
    }));
    if (changed) {
      el('length').value = ['1','3','5','10','15'].includes(suggested) ? suggested : (id==='yoga'?'10':'5');
      const snapshot=source==='resume'?readSetting('resume'):null;
      const restore=snapshot?.id===key && durations.includes(snapshot.minutes) && Number.isFinite(snapshot.left) && snapshot.left>0;
      const requested=restore?snapshot.course:source;
      contextCourse=programmes.find(c=>c.id===requested&&c.lessons.includes(key))?.id || '';
      planSlot=restore?snapshot.slot||'':source==='plan'?slot?.replace(/%2F/gi,'/')||'':'';
      reset();
      if(restore){el('length').value=String(snapshot.minutes);remaining=Math.min(duration(),snapshot.left);draw();}

    } else draw();
  }
  el('studio').hidden = false;
  if (translateOnly === true) return;
  el('studio').scrollIntoView();
  el('category').focus({preventScroll:true});
}
el('category').tabIndex=-1;
window.addEventListener('hashchange',route);
document.addEventListener('click',e=>{
  const target=e.target.closest('a');
  if (target && activeRoute && target.hash===location.hash) route();
});
function translate() {
  library = lessonsByLanguage[language];
  document.documentElement.lang = language;
  document.title = 'Yoga Space · ' + t('page');
  document.querySelectorAll('[data-t]').forEach(node=>node.textContent = t(node.dataset.t));
  document.querySelector('nav').setAttribute('aria-label',t('nav'));
  el('language').setAttribute('aria-label',t('language'));
  el('language').value = language;
  el('lessons').setAttribute('aria-label',t('lessons'));
  const value = el('length').value || '5';
  el('length').replaceChildren(...[1,3,5,10,15].map(n=>new Option(n+' '+t('minute'),n)));
  el('length').value = value;
  renderFilters();
  renderVideos();
  renderTeachers();
  renderBrand();
  renderSchedule();
  renderExpansion();
  renderProfile();
  route(true);
}
el('language').onchange = () => {
  language = el('language').value;
  try {localStorage.setItem('yogaspace.language',language);} catch {storageOK = false;}
  translate();
};
window.addEventListener('storage', e=>{
  if (!e.key || e.key.startsWith(favoritePrefix)) renderCatalog();
  if (!e.key || e.key.startsWith('yogaspace.v1.') || e.key.startsWith(sessionPrefix) || e.key.startsWith(favoritePrefix)) renderProfile();
});
setupStudio();
translate();
if (activeRoute || location.hash === '#founder' || location.hash.startsWith('#course/')) route();
