// This catalogue references the existing practice IDs; unavailable programmes have no media or access grant.
const programmes = [
  {id:'yoga',title:'morningSeries',area:'yoga',level:'basic',access:'free',teacher:'elxan',lessons:['yoga/1','yoga/2']},
  {id:'breathing',title:'breathSeries',area:'breath',level:'introductory',access:'free',teacher:'elxan',lessons:['breath/2','breath/1']},
  {id:'listening',title:'mindSeries',area:'meditation',level:'introductory',access:'free',teacher:'elxan',lessons:['meditation/1','meditation/2']},
  {id:'movement',title:'moveSeries',area:'awareMove',level:'introductory',access:'free',teacher:'elxan',lessons:['yoga/2','breath/2']},
  {id:'mobility',title:'flexibility',area:'flexibility',access:'paidCourse',teacher:'elxan',lessons:[]},
  {id:'balance',title:'balance',area:'balance',access:'premium',teacher:'elxan',lessons:[]},
  {id:'recovery',title:'restSeries',area:'recovery',level:'introductory',access:'free',teacher:'elxan',lessons:['breath/2','meditation/1']}
];
const durations = [1,3,5,10,15];
const sessionDays = [1,2,3,4,5,6,7];
const localMemory = new Map();
function readSetting(id,fallback=null) {
  if (localMemory.has(id)) return localMemory.get(id);
  try { const raw=localStorage.getItem('yogaspace.v1.'+id);return raw===null?fallback:JSON.parse(raw); }
  catch { return fallback; }
}
function saveSetting(id,value) {
  try {localStorage.setItem('yogaspace.v1.'+id,JSON.stringify(value));localMemory.delete(id);}
  catch {storageOK=false;localMemory.set(id,value);}
}
const courseMinutes = c => c.lessons.reduce((sum,id)=>sum+practices.find(p=>p.id===id).minutes,0);
const areaName = area => library[area]?.name || t(area);
function courseDone(c,sessions) {
  return c.lessons.filter(id=>sessions.some(s=>s.group+'/'+(s.index+1)===id && s.course===c.id));
}
function external(label,url) {
  const a=node('a',label);a.href=url;return a;
}
function addArchive(story) {
  const panel=node('section'),list=node('ul');
  for(const key of ['worldFour','europe','mastery','finalist'])list.append(node('li',t(key)));
  panel.append(node('h2',t('international')),node('p',t('byFounder')),list);
  const gallery=node('div');gallery.className='archive-grid';
  for(const [photo,title,url] of [
    ['performance','performanceLabel','https://www.instagram.com/p/CTRXcPOA2R3/'],
    ['hero','bySea','https://www.instagram.com/elxanaze001/']]){
    const figure=node('figure'),img=node('img');img.src='./assets/'+photo+'.webp';img.alt=t(title);img.loading='lazy';
    const caption=node('figcaption');caption.append(external(t(title)+' ↗',url));figure.append(img,caption);gallery.append(figure);
  }
  panel.append(node('h2',t('art')),node('p',t('artCopy')),node('h2',t('stage')),node('p',t('stageCopy')),
    external('Haberler · 28.01.2016 ↗','https://www.haberler.com/komik-ilginc/elxan-gulmaliyev-ve-ekibinin-nunchaku-gosterisi-8108994-haberi/'),
    node('h2',t('archive')),gallery,external(t('awardPost')+' ↗','https://www.instagram.com/p/CnbzW9_ApQE/'));
  story.prepend(panel);
}
function formField(form,id,key,type='select') {
  const label=node('label'),control=node(type);
  label.append(node('span',t(key)),control);control.id=id;form.append(label);return control;
}
function options(control,values,format,current) {
  control.replaceChildren(...values.map(v=>new Option(format(v),v)));
  if(values.map(String).includes(String(current)))control.value=current;
}
const searchState={query:'',area:'',access:'',level:'',time:''};
function renderCourses() {
  const form=el('courseSearch');form.onsubmit=e=>e.preventDefault();form.replaceChildren();
  const input=formField(form,'query','search','input');input.type='search';input.value=searchState.query;
  input.oninput=()=>{searchState.query=input.value;listCourses();};
  for(const [key,label,values,format] of [
    ['area','direction',programmes.map(c=>c.area),areaName],['access','access',['free','paidCourse','premium'],t],
    ['level','level',['introductory','basic'],t],['time','recommended',[...new Set(programmes.map(courseMinutes).filter(Boolean))].sort((a,b)=>a-b),n=>n+' '+t('minute')]]){
    const control=formField(form,'course-'+key,label);
    options(control,['',...values],v=>v?format(v):t('all'),searchState[key]);
    control.onchange=()=>{searchState[key]=control.value;listCourses();};
  }
  listCourses();
}
function listCourses() {
  const q=searchState.query.trim().toLocaleLowerCase(language);
  const found=programmes.filter(c=>(!searchState.area||searchState.area===c.area)&&(!searchState.access||searchState.access===c.access)&&
    (!searchState.level||searchState.level===c.level)&&(!searchState.time||Number(searchState.time)===courseMinutes(c))&&[t(c.title),areaName(c.area),...c.lessons.map(id=>lessonInfo(id)[0])].join(' ').toLocaleLowerCase(language).includes(q));
  el('courseCount').textContent=t('foundCourses')+found.length;
  el('courseList').replaceChildren(...found.map(c=>{
    const card=node('section');card.className='practice-entry';
    const title=node('h3');title.append(link(t(c.title),'course/'+c.id,'lesson-link'));
    card.append(node('small',areaName(c.area)+' · '+t(c.access)),title,node('p',c.lessons.length?
      t(c.level)+' · '+courseMinutes(c)+' '+t('minute'):t('soon')));return card;
  }));
}
function renderProgramme(c,sessions) {
  const root=el('coursePage');root.replaceChildren(link('← '+t('courses'),'courses',''));
  const title=node('h1',t(c.title));title.tabIndex=-1;title.id='courseTitle';
  root.append(title,link(teachers[c.teacher].name,'founder','byline'),node('p',[areaName(c.area),t(c.access),c.level&&t(c.level)].filter(Boolean).join(' · ')));
  const fav=node('button'),key='courseFavorite.'+c.id;
  function label(){const value=readSetting(key)===true;fav.textContent=t(value?'savedFav':'favorite');fav.setAttribute('aria-pressed',String(value));}
  fav.onclick=()=>{saveSetting(key,readSetting(key)!==true);label();renderProfile();};label();root.append(fav);
  if(!c.lessons.length){root.append(node('p',t('videoPending')),link(t('pricing'),'pricing',''));return;}
  const done=courseDone(c,sessions);
  const meter=node('progress');
  meter.className='course-meter';
  meter.max=c.lessons.length;
  meter.value=done.length;
  meter.setAttribute('aria-label',t('courseProgress'));
  root.append(node('p',t('goal')+': '+t('goal_'+c.id)));
  root.append(node('p',t('guidedText')+' · '+courseMinutes(c)+' '+t('minute')),node('h2',t('modules')),
    node('p',t('courseProgress')+' '+done.length+' / '+c.lessons.length),meter);
  const list=node('ol');
  for(const id of c.lessons){
    const p=practices.find(item=>item.id===id),li=node('li');
    li.append(link(lessonInfo(id)[0],id+'/'+p.minutes+'/'+c.id,''),node('span',' · '+p.minutes+' '+t('minute')+(done.includes(id)?' ✓':'')));
    list.append(li);
  }
  root.append(list);
  const next=c.lessons.find(id=>!done.includes(id));
  if(next){const p=practices.find(item=>item.id===next);root.append(link(t('nextModule'),next+'/'+p.minutes+'/'+c.id,'primary'));}

}
function monday(date=new Date()){
  const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d;
}
function dateKey(d){return [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-');}
const defaultPlan={area:'',level:'',goal:'',minutes:5,count:3};
function getPlan(){
  const p=readSetting('plan');
  if(!p||!durations.includes(p.minutes)||!sessionDays.includes(p.count))return null;
  return p;
}
function matchesPlan(p){return practices.filter(item=>(!p.area||item.id.startsWith(p.area+'/'))&&(!p.goal||p.goal===item.goal)&&(!p.level||p.level===item.level));}
function renderPlanner(){
  const form=el('plannerForm'),values=getPlan()||defaultPlan;
  const previous=Object.fromEntries([...form.querySelectorAll('select')].map(s=>[s.name,s.value]));
  form.replaceChildren();
  for(const [key,label,choices,format] of [
    ['goal','goal',['','movement','release','focus'],t],['level','level',['','introductory','basic'],t],
    ['area','direction',['',...Object.keys(library)],areaName],['minutes','length',durations,n=>n+' '+t('minute')],
    ['count','weeklyTarget',sessionDays,String]]){
    const control=formField(form,'plan-'+key,label);control.name=key;
    options(control,choices,v=>v===''?t('all'):format(v),previous[key]??values[key]);
  }
  form.append(node('button',t('buildPlan')));form.onsubmit=e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form));data.minutes=Number(data.minutes);data.count=Number(data.count);
    if(!matchesPlan(data).length){el('planStatus').textContent=t('noPlanMatch');return;}
    saveSetting('plan',data);el('planStatus').textContent=t(storageOK?'planSaved':'unavailable');
    renderProfile();
  };
  el('planStatus').textContent='';
}
function renderWeek(sessions){
  const p=getPlan(),week=monday(),root=el('week');root.replaceChildren();
  const active=sessions.filter(s=>s.date>=week.getTime()&&s.date<=Date.now());
  el('weekStats').textContent=t('weekly')+' · '+active.length+(p?' / '+p.count:'')+' · '+active.reduce((n,s)=>n+s.minutes,0)+' '+t('minute');
  if(!p){root.textContent=t('noPlan');return;}
  const pool=matchesPlan(p);if(!pool.length)return;
  const list=node('ul');list.className='agenda';
  for(let i=0;i<p.count;i++){
    const date=new Date(week);date.setDate(date.getDate()+Math.floor(i*7/p.count));
    const item=pool[i%pool.length],li=node('li'),id=dateKey(date)+'.'+item.id+'.'+p.minutes;
    const label=node('label'),box=node('input');box.type='checkbox';
    box.checked=readSetting('check.'+id)===true||active.some(s=>s.planSlot===id);
    box.disabled=active.some(s=>s.planSlot===id);
    box.onchange=()=>saveSetting('check.'+id,box.checked);
    label.append(box,node('span',new Intl.DateTimeFormat(language,{weekday:'short',day:'numeric',month:'short'}).format(date)));
    li.append(label,link(lessonInfo(item.id)[0],item.id+'/'+p.minutes+'/plan/'+encodeURIComponent(id),''),node('small',p.minutes+' '+t('minute')));list.append(li);
  }
  root.append(list);
}
function dashboard(sessions){
  renderWeek(sessions);
  const textList=(id,values,empty)=>{el(id).replaceChildren(...(values.length?values:[node('span',t(empty))]));};
  const completed=programmes.filter(c=>c.lessons.length&&courseDone(c,sessions).length===c.lessons.length);
  textList('finishedCourses',completed.map(c=>link(t(c.title),'course/'+c.id,'')),'noCompleted');
  textList('myCourses',programmes.filter(c=>readSetting('courseFavorite.'+c.id)===true).map(c=>link(t(c.title),'course/'+c.id,'')),'favEmpty');
  const snap=readSetting('resume');
  const valid=snap&&practices.some(p=>p.id===snap.id)&&durations.includes(snap.minutes)&&Number.isFinite(snap.left)&&snap.left>0;
  el('continuePractice').replaceChildren(...(valid?[link(t('resume')+' · '+lessonInfo(snap.id)[0],snap.id+'/'+snap.minutes+'/resume','pill')]:[]));
  el('profileName').textContent=readSetting('name')||t('localProfile');
  el('alias').value=readSetting('name')||'';
  renderDemoBookings();
  el('bookingLog').replaceChildren(...getBookingLog().map(log=>node('li',new Intl.DateTimeFormat(language,{day:'numeric',month:'short'}).format(log.time)+' · '+t(log.format==='group'?'groupClass':'individual')+' · '+t(log.action))));
}
function demoRequests(){
  const rows=readSetting('demoRequests',[]);
  return Array.isArray(rows)?rows.filter(row=>row && typeof row.id==='string' && typeof row.preference==='string'):[];
}
function renderDemoBookings(){
  el('demoBookings').replaceChildren(...demoRequests().map(row=>{
    const entry=node('div'),status=node('p',t(row.cancelled?'demoCancelled':'demoActive'));
    entry.append(status,node('p',t(row.format==='group'?'groupClass':'individual')+' · '+row.preference));
    if(!row.cancelled){
      const cancel=node('button',t('cancelDemo'));
      cancel.onclick=()=>{saveSetting('demoRequests',demoRequests().map(item=>item.id===row.id?{...item,cancelled:true}:item));renderProfile();};
      entry.append(cancel);
    }
    return entry;
  }));
}
function getBookingLog(){
  const rows=readSetting('bookingLog',[]);
  return Array.isArray(rows)?rows.filter(l=>l&&['draftSaved','draftCancelled'].includes(l.action)&&Number.isFinite(l.time)&&Math.abs(l.time)<8.64e15):[];
}
function recordRequest(action){saveSetting('bookingLog',[{action,format:el('format').value,time:Date.now()},...getBookingLog()]);renderProfile();}
function renderPlans(){
  el('priceCards').replaceChildren(...['free','paidCourse','premium','privateClass'].map(key=>{
    const card=node('section');card.className='practice-entry';
    card.append(node('h3',t(key)),node('p',t(key+'Offer')),key==='free'?link(t('practices'),'practices','pill'):node('small',t('planned')));
    return card;
  }));
}
function renderExpansion(){
  renderCourses();renderPlanner();renderPlans();
  el('nameForm').onsubmit=e=>{e.preventDefault();saveSetting('name',el('alias').value.trim().slice(0,50));renderProfile();};
  el('demoRequest').onclick=()=>{
    const format=el('format').value;
    let preference='';
    try{preference=localStorage.getItem(draftKey+format);}catch{draftMessage='draftFail';renderSchedule();return;}
    if(!preference||preference!==el('desired').value.trim())return;
    const rows=demoRequests();
    if(!rows.some(r=>!r.cancelled && r.format===format && r.preference===preference)){
      rows.unshift({id:Date.now()+'-'+Math.random().toString(36).slice(2),format,preference,cancelled:false});
      saveSetting('demoRequests',rows);
    }
    draftMessage=storageOK?'demoActive':'unavailable';renderSchedule();renderProfile();
  };
  el('cancelDraft').onclick=()=>{
    try {localStorage.removeItem(draftKey+el('format').value);el('desired').value='';draftMessage='draftCancelled';recordRequest(draftMessage);}
    catch{draftMessage='draftFail';}
    renderSchedule();
  };
}
