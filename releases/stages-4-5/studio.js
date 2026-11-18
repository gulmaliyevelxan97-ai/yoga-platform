// Teacher IDs and practice routes are stable references for profiles, bookmarks and videos.
const teachers = {
  elxan:{name:'Elxan Gülmalıyev',photo:'author.webp',instagram:'https://www.instagram.com/elxanaze001/',handle:'@elxanaze001',bio:'founderBio',distinctions:[],role:'role',profile:'founder',profileLabel:'aboutFounder',chapters:[['way','origins1','origins2'],['transition','origins3','origins4'],['why','why1','why2'],['myPhilosophy','belief1','belief2','belief3']]}
};
const practices = [
  {id:'yoga/1',teacher:'elxan',level:'basic',minutes:10,goal:'movement'},
  {id:'yoga/2',teacher:'elxan',level:'introductory',minutes:3,goal:'movement'},
  {id:'breath/1',teacher:'elxan',level:'basic',minutes:5,goal:'focus'},
  {id:'breath/2',teacher:'elxan',level:'introductory',minutes:3,goal:'release'},
  {id:'meditation/1',teacher:'elxan',level:'basic',minutes:10,goal:'release'},
  {id:'meditation/2',teacher:'elxan',level:'introductory',minutes:5,goal:'focus'}
];
const videoLessons = [
  {group:'yoga',teacher:'elxan',src:null},
  {group:'breath',teacher:'elxan',src:null},
  {group:'meditation',teacher:'elxan',src:null}
];
const favoritePrefix = 'yogaspace.favorite.';
const draftKey = 'yogaspace.request.';
const volatileFavorites = new Map();
let draftMessage = '';
function node(tag,text) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  return item;
}
function lessonInfo(id) {
  const [group,n] = id.split('/');
  return library[group].lessons[Number(n)-1];
}
function isFavorite(id) {
  if (volatileFavorites.has(id)) return volatileFavorites.get(id);
  try { return localStorage.getItem(favoritePrefix+id)==='1'; }
  catch { return false; }
}
function toggleFavorite(id,button) {
  const next = !isFavorite(id);
  try {
    if (next) localStorage.setItem(favoritePrefix+id,'1');
    else localStorage.removeItem(favoritePrefix+id);
    volatileFavorites.delete(id);
  } catch { storageOK = false; volatileFavorites.set(id,next); }
  labelFavorite(button,id);
  renderProfile();
}
function labelFavorite(button,id) {
  const saved = isFavorite(id);
  button.textContent = (saved?'♥ ':'♡ ') + t(saved?'savedFav':'favorite');
  button.setAttribute('aria-pressed',String(saved));
  button.setAttribute('aria-label',t(saved?'savedFav':'favorite')+' · '+lessonInfo(id)[0]);
}
function setOptions(id,values,format) {
  const select = el(id);
  const current = select.value;
  select.replaceChildren(new Option(t('all'),''),...values.map(v=>new Option(format(v),v)));
  select.value = current;
}
function renderFilters() {
  setOptions('filterGroup',Object.keys(library),id=>library[id].name);
  setOptions('filterLevel',['introductory','basic'],t);
  setOptions('filterTime',[3,5,10],n=>n+' '+t('minute'));
  setOptions('filterGoal',['movement','release','focus'],t);
  renderCatalog();
}
function practiceMatchesQuery(query, fields, locale) {
  const normalize = value => value.toLocaleLowerCase(locale).normalize('NFD').replace(/\p{M}/gu,'').replace(/ı/g,'i').replace(/ə/g,'e');
  const haystack = normalize(fields.join(' '));
  return normalize(query.trim()).split(/\s+/).every(word => haystack.includes(word));
}
function renderCatalog() {
  const group = el('filterGroup').value, level = el('filterLevel').value;
  const minutes = el('filterTime').value, goal = el('filterGoal').value;
  const query = el('practice-query')?.value.trim() || '';
  const visible = practices.filter(p=>(!group || p.id.startsWith(group+'/')) &&
    (!level || p.level===level) && (!minutes || p.minutes===Number(minutes)) && (!goal || p.goal===goal) &&
    (!query || practiceMatchesQuery(query,[lessonInfo(p.id)[0],library[p.id.split('/')[0]].name,t(p.goal)],language)));
  el('matches').textContent = t('found')+visible.length;
  el('clearFilters').hidden = !(query || group || level || minutes || goal);
  if (!visible.length && el('practice-query')) {
    el('catalog').replaceChildren(node('p',t('practiceNoResults')));
    return;
  }
  el('catalog').replaceChildren(...visible.map(p=>{
    const [group] = p.id.split('/');
    const item = node('section');
    item.className = 'practice-entry '+group;
    const meta = node('small',library[group].name+' · '+t(p.level));
    const heading = node('h3');
    const destination = p.id+'/'+p.minutes;
    heading.append(link(lessonInfo(p.id)[0],destination,'lesson-link'));
    const byline = link(teachers[p.teacher].name,'teacher-'+p.teacher,'byline');
    const detail = node('p',p.minutes+' '+t('minute')+' · '+t(p.goal));
    const button = node('button');
    labelFavorite(button,p.id);
    button.onclick = ()=>toggleFavorite(p.id,button);
    item.append(meta,heading,byline,detail,button);
    return item;
  }));
}
function renderVideos() {
  el('categories').replaceChildren(...videoLessons.map(v=>{
    const card = node('section');
    card.className = 'card video-card';
    const title = node('h3',library[v.group].name);
    if (v.src) {
      const video = node('video');
      video.controls = true;
      video.preload = 'metadata';
      video.src = v.src;
      video.setAttribute('aria-label',title.textContent);
      card.append(video);
    } else {
      const figure = node('figure'), image = node('img');
      image.src = './assets/'+v.group+'.webp';
      image.alt = ''; image.loading = 'lazy';
      figure.append(image);card.append(figure);
    }
    card.append(title,node('small',teachers[v.teacher].name));
    if (!v.src) card.append(node('strong',t('soon')));
    return card;
  }));
}
function renderTeachers() {
  el('teachers').replaceChildren(...Object.entries(teachers).map(([id,teacher])=>{
    const section = node('section'),img=node('img'),details=node('div');
    section.className='teacher-profile';section.id='teacher-'+id;
    img.src='./assets/'+teacher.photo;img.alt=teacher.name;img.loading='lazy';
    details.append(node('h3',teacher.name),node('p',t(teacher.role)),link(t(teacher.profileLabel || 'teacher'),teacher.profile,'primary'));
    section.append(img,details);return section;
  }));
}
function renderBrand() {
  el('pillars').replaceChildren(...['harmony','strength','spirit'].map(key=>{
    const item=node('section');item.append(node('h3',t(key)),node('p',t(key+'Text')));return item;
  }));
}
function renderTeacherStory(teacher) {
  const intro=node('div'),copy=node('div'),photo=node('img');
  intro.className='founder-intro';
  photo.src='./assets/'+teacher.photo;photo.alt=teacher.name;
  const title=node('h1',teacher.name);
  title.id='founderTitle';title.tabIndex=-1;
  copy.append(title,node('p',t(teacher.role)));
  intro.append(copy,photo);
  const story=node('div');story.className='story-copy';
  for (const [heading,...paragraphs] of teacher.chapters || []) {
    story.append(node('h2',t(heading)),...paragraphs.map(key=>node('p',t(key))));
  }
  if (teacher.distinctions.length) story.append(node('h2',t('distinctions')),...teacher.distinctions.map(key=>node('p',t(key))));
  if (teacher===teachers.elxan) addArchive(story);
  if (teacher.instagram) {
    const account=node('a',teacher.handle);account.href=teacher.instagram;story.append(account);
  }
  el('founderStory').replaceChildren(intro,story);
}
function renderExtras(sessions,totalMinutes) {
  const saved = practices.filter(p=>isFavorite(p.id));
  el('favEmpty').hidden = !!saved.length;
  el('favorites').replaceChildren(...saved.map(p=>{
    const item=node('li');item.append(link(lessonInfo(p.id)[0],p.id+'/'+p.minutes,''));
    return item;
  }));
  const groups = new Set(sessions.map(s=>s.group)).size;
  const goals = [['first',sessions.length,1],['variety',groups,3],['hour',totalMinutes,60]];
  el('awards').replaceChildren(...goals.map(([label,value,target])=>
    node('li',t(label)+' · '+(value>=target?t('earned'):value+' / '+target))));
}
function renderSchedule() {
  el('scheduleState').textContent = t(el('format').value==='group'?'noGroup':'noIndividual');
  try { el('cancelDraft').hidden = !localStorage.getItem(draftKey+el('format').value); }
  catch { el('cancelDraft').hidden=true; }
  el('demoRequest').hidden=el('cancelDraft').hidden;
  el('draftStatus').textContent = draftMessage?t(draftMessage):'';
}
function loadDraft() {
  let draft = '';
  try { draft = localStorage.getItem(draftKey+el('format').value) || ''; } catch { /* Storage is optional. */ }
  el('desired').value = draft;
  draftMessage = draft?'draftSaved':'';
  renderSchedule();
}
function setupStudio() {
  el('filters').addEventListener('change',renderCatalog);
  el('filters').addEventListener('submit',event=>event.preventDefault());
  el('practice-query')?.addEventListener('input',renderCatalog);
  el('clearFilters').onclick=()=>{el('filters').reset();renderCatalog();el('filterGroup').focus();};
  el('format').onchange=loadDraft;
  el('desired').oninput=()=>{draftMessage='';renderSchedule();el('demoRequest').hidden=true;};
  el('request').onsubmit=e=>{
    e.preventDefault();
    const value=el('desired').value.trim();
    if (!value) {el('desired').value='';el('desired').reportValidity();return;}
    try { localStorage.setItem(draftKey+el('format').value,value);draftMessage='draftSaved';recordRequest(draftMessage); }
    catch { draftMessage='draftFail'; }
    renderSchedule();
  };
  loadDraft();
}
