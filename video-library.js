// Public, free lessons remain separate from studio modules and paid programmes.
(() => {
  const labels = {
    search: ['Поиск по названию или автору','Ad və ya müəllif üzrə axtarış','Search by title or teacher'],
    topic: ['Направление','İstiqamət','Style'], length: ['Длительность','Müddət','Duration'],
    level: ['Уровень','Səviyyə','Level'], language: ['Язык занятия','Dərsin dili','Spoken language'],
    any: ['Любой вариант','Hamısı','Any'], beginner: ['Для начинающих','Yeni başlayanlar üçün','For beginners'],
    intermediate: ['Средний','Orta','Intermediate'], all: ['Для всех уровней','Bütün səviyyələr üçün','All levels'],
    morning: ['Утренняя йога','Səhər yoqası','Morning yoga'], hatha: ['Хатха-йога','Hatha yoqası','Hatha yoga'],
    stretch: ['Растяжка и гибкость','Dartınma və elastiklik','Stretching and flexibility'],
    meditation: ['Медитация','Meditasiya','Meditation'], breath: ['Дыхательные практики','Nəfəs məşqləri','Breathwork'],
    relax: ['Расслабление','Rahatlama','Relaxation'], balance: ['Баланс и осознанное движение','Tarazlıq və şüurlu hərəkət','Balance and mindful movement'],
    short: ['До 15 мин','15 dəqiqəyədək','Up to 15 min'], medium: ['Более 15–30 мин','15 dəqiqədən çox, 30 dəqiqəyədək','Over 15 to 30 min'],
    long: ['Более 30 мин','30 dəqiqədən çox','Over 30 min'], ru: ['Русский','Rus dili','Russian'],
    az: ['Азербайджанский','Azərbaycan dili','Azerbaijani'], en: ['Английский','İngilis dili','English'],
    results: ['Найдено занятий','Tapılan dərslər','Lessons found'], empty: ['По этим параметрам занятий пока нет.','Bu seçimlərə uyğun dərs tapılmadı.','No lessons match these filters.'],
    reset: ['Сбросить фильтры','Filtrləri sıfırla','Clear filters'], more: ['Показать ещё','Daha çox göstər','Show more'],
    favorite: ['В избранное','Seçilmişlərə əlavə et','Save lesson'], saved: ['В избранном','Seçilmişlərdə','Saved'],
    done: ['Пройдено','Tamamlanıb','Completed'], complete: ['Отметить занятие пройденным','Dərsi tamamlanmış kimi qeyd et','Mark lesson as complete'],
    undo: ['Снять отметку о прохождении','Tamamlanma qeydini sil','Undo completion'],
    library: ['Бесплатная видеотека','Pulsuz videodərslər','Free video library'], original: ['Открыть на YouTube','YouTube-da aç','Open on YouTube'],
    play: ['Смотреть на сайте','Saytda izlə','Watch here'], recommend: ['Похожие видеоуроки','Oxşar videodərslər','Related video lessons'],
    freeRelated: ['Бесплатные видео по теме','Mövzuya uyğun pulsuz videolar','Free videos on this topic'],
    favoriteVideos: ['Избранные видео','Seçilmiş videolar','Saved videos'], completedVideos: ['Пройденные видеоуроки','Tamamlanmış videodərslər','Completed videos'],
    noneSaved: ['Здесь появятся видео, которые вы добавите в избранное.','Seçilmişlərə əlavə etdiyiniz videolar burada görünəcək.','Videos you save will appear here.'],
    noneDone: ['После занятия отметьте его пройденным на странице видео.','Dərsi bitirdikdən sonra video səhifəsində tamamlandığını qeyd edin.','After a lesson, mark it as complete on its video page.'],
    unknown: ['Видеоурок не найден','Videodərs tapılmadı','Video lesson not found'],
    programmes: ['Подходящие программы Yoga Space','Uyğun Yoga Space proqramları','Related Yoga Space programmes'],
    temporary: ['Изменения доступны до закрытия страницы. Браузер не разрешил сохранение.','Brauzer yaddaşa yazmağa icazə vermədi. Dəyişikliklər səhifə bağlananadək qalacaq.','Your browser blocked storage. Changes will last until you close this page.']
  };
  const relatedTopics = {
    yoga: ['beginner','morning','hatha'], breathing: ['breath'], listening: ['meditation'],
    movement: ['balance','stretch'], recovery: ['relax','meditation']
  };
  const topics = ['beginner','morning','hatha','stretch','meditation','breath','relax','balance'];
  const filters = {search:'',topic:'',length:'',level:'',language:''};
  const pageSize = 6;
  let limit = pageSize;
  let currentVideo = '';
  let currentLanguage = '';
  const index = new Map(curatedVideoLessons.map(video => [video.id,video]));
  const words = key => labels[key][['ru','az','en'].indexOf(language)];
  const fold = value => value.toLocaleLowerCase(language).normalize('NFKD').replace(/\p{M}/gu,'');
  const watchLink = (label,id,cls='') => link(label,'watch/'+id,cls);
  const runtime = seconds => Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  const lengthGroup = seconds => seconds <= 900 ? 'short' : seconds <= 1800 ? 'medium' : 'long';
  const thumbURL = id => 'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
  const isMarked = (kind,id) => readSetting('video.'+kind+'.'+id) === true;
  function element(tag,cls,text) {
    const item = node(tag,text);
    if(cls) item.className=cls;
    return item;
  }
  function cover(video,eager=false) {
    const image=element('img','film-thumbnail');
    image.alt='';
    image.width=480;
    image.height=360;
    image.loading=eager?'eager':'lazy';
    image.decoding='async';
    image.onerror=()=>{
      image.onerror=null;
      image.src='./assets/lake.jpg';
      image.classList.add('film-scenery');
    };
    image.src=thumbURL(video.id);
    return image;
  }
  function paintButton(button,video,kind) {
    const marked=isMarked(kind,video.id);
    const text=words(kind==='favorite'?(marked?'saved':'favorite'):(marked?'undo':'complete'));
    button.textContent=text;
    button.setAttribute('aria-pressed',String(marked));
    button.setAttribute('aria-label',text+' · '+video.title);
  }
  function marker(video,kind) {
    const button=element('button',kind==='favorite'?'film-fav':'film-complete');
    button.type='button';
    button.dataset.mark=kind;
    button.dataset.video=video.id;
    paintButton(button,video,kind);
    button.onclick=()=>{
      saveSetting('video.'+kind+'.'+video.id,!isMarked(kind,video.id));
      syncMarks();
      if(!storageOK) statusNote().textContent=words('temporary');
    };
    return button;
  }
  function statusNote(){
    let status=el('videoStorageStatus');
    if(!status) {
      status=element('p','');
      status.id='videoStorageStatus';
      status.setAttribute('role','status');
    }
    (currentVideo ? el('watch') : el('library')).append(status);
    return status;
  }
  function syncMarks() {
    for(const b of document.querySelectorAll('button[data-mark][data-video]')){
      const video=index.get(b.dataset.video);
      if(video) paintButton(b,video,b.dataset.mark);
    }
    for(const badge of document.querySelectorAll('[data-completed-video]')) badge.hidden=!isMarked('done',badge.dataset.completedVideo);
    profile();
  }
  function badge(video) {
    const done=element('span','film-done','✓ '+words('done'));
    done.dataset.completedVideo=video.id;
    done.hidden=!isMarked('done',video.id);
    return done;
  }
  function card(video) {
    const item=element('section','film-card');
    const anchor=watchLink('',video.id,'film-link');
    const frame=element('div','film-cover');
    frame.append(cover(video),element('span','film-runtime',runtime(video.seconds)));
    const details=element('div','film-info');
    details.append(element('small','',words(video.topic)+' · '+words(video.language)),element('h3','',video.title),element('p','',video.author));
    anchor.append(frame,details);
    const actions=element('div','film-actions');
    actions.append(marker(video,'favorite'),badge(video));
    item.append(anchor,actions);
    return item;
  }
  function resultList(){
    const query=fold(filters.search.trim());
    const matches=curatedVideoLessons.filter(v=>(!filters.topic||filters.topic===v.topic)&&
      (!filters.length||filters.length===lengthGroup(v.seconds))&&(!filters.level||filters.level===v.level)&&
      (!filters.language||filters.language===v.language)&&(!query||fold([v.title,v.author,words(v.topic)].join(' ')).includes(query)));
    el('videoCount').textContent=matches.length?words('results')+' · '+matches.length:words('empty');
    el('videoGrid').replaceChildren(...matches.slice(0,limit).map(card));
    const more=el('videoMore');
    const left=matches.length-limit;
    more.hidden=left<=0;
    more.textContent=words('more')+' ('+Math.min(pageSize,Math.max(0,left))+')';
  }
  function filterForm() {
    const form=el('videoFilters');
    form.replaceChildren();
    form.onsubmit=e=>e.preventDefault();
    const choices={topic:topics,length:['short','medium','long'],level:['beginner','intermediate','all'],language:[...new Set(curatedVideoLessons.map(v=>v.language))]};
    for(const field of Object.keys(filters)){
      const label=element('label',field==='search'?'film-search':'');
      const control=element(field==='search'?'input':'select','');
      control.id='video-'+field;
      if(field==='search') control.type='search';
      else control.append(...['',...choices[field]].map(v=>new Option(words(v||'any'),v)));
      control.value=filters[field];
      control.addEventListener(field==='search'?'input':'change',()=>{filters[field]=control.value;limit=pageSize;resultList();});
      label.append(element('span','',words(field)),control);
      form.append(label);
    }
    const reset=element('button','film-reset',words('reset'));
    reset.type='button';
    reset.onclick=()=>{
      for(const field of Object.keys(filters)){filters[field]='';el('video-'+field).value='';}
      limit=pageSize;
      resultList();
      el('video-search').focus();
    };
    form.append(reset);
    let more=el('videoMore');
    if(!more){more=element('button','film-more');more.id='videoMore';more.type='button';el('videoGrid').after(more);}
    more.onclick=()=>{
      const old=limit;
      limit+=pageSize;
      resultList();
      const firstNew=el('videoGrid').children[old]?.querySelector('a');
      if(firstNew) firstNew.focus({preventScroll:true});
    };
    resultList();
  }
  function collection(videos,title,root){
    if(!videos.length)return;
    root.append(element('h2','',words(title)));
    const grid=element('div','video-grid');
    grid.append(...videos.map(card));
    root.append(grid);
  }
  function courseLinks(video,root){
    const list=element('div','link-list');
    for(const programme of programmes){
      if(programme.access==='free'&&relatedTopics[programme.id]?.includes(video.topic))
        list.append(link(t(programme.title),'course/'+programme.id,''));
    }
    if(list.childElementCount)root.append(element('h2','',words('programmes')),list);
  }
  function programmeVideos(id){
    const programme=programmes.find(c=>c.id===id&&c.access==='free');
    if(!programme||!relatedTopics[id])return;
    const related=element('section','film-related');
    related.id='relatedVideos';
    const primary=curatedVideoLessons.filter(v=>relatedTopics[id].includes(v.topic));
    // Mix topics before taking three, so a broader programme offers more than one style.
    const sample=relatedTopics[id].map(topic=>primary.find(v=>v.topic===topic)).filter(Boolean);
    for(const v of primary)if(!sample.includes(v))sample.push(v);
    collection(sample.slice(0,3),'freeRelated',related);
    el('coursePage').append(related);
  }
  function profile(){
    const root=el('profileVideos');
    if(!root)return;
    root.replaceChildren();
    for(const [kind,title,empty] of [['favorite','favoriteVideos','noneSaved'],['done','completedVideos','noneDone']]){
      const marked=curatedVideoLessons.filter(v=>isMarked(kind,v.id));
      const group=element('div','film-profile');
      group.append(element('h3','',words(title)+' · '+marked.length));
      if(marked.length){
        const list=element('ul','');
        for(const video of marked){
          const li=element('li','');
          li.append(watchLink(video.title,video.id));
          list.append(li);
        }
        group.append(list);
      }else group.append(element('p','',words(empty)));
      root.append(group);
    }
  }
  function player(video){
    const frame=element('div','film-player');
    const play=element('button','film-start');
    play.type='button';
    play.append(cover(video,true),element('span','',words('play')+' ▶'));
    play.onclick=()=>{
      const iframe=element('iframe','');
      const url=new URL('https://www.youtube-nocookie.com/embed/'+video.id);
      url.searchParams.set('autoplay','1');
      url.searchParams.set('playsinline','1');
      url.searchParams.set('hl',language);
      iframe.src=url.href;
      iframe.title=video.title+' · '+video.author;
      iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen=true;
      iframe.referrerPolicy='strict-origin-when-cross-origin';
      frame.replaceChildren(iframe);
      iframe.focus({preventScroll:true});
    };
    frame.append(play);
    return frame;
  }
  function detail(video,stay){
    const watch=el('watch');
    const oldPlayer=stay?watch.querySelector('.film-player:has(iframe)'):null;
    // Keep the live iframe attached while relabelling the surrounding controls.
    let body=watch.querySelector('.film-details');
    if(!oldPlayer) {
      watch.replaceChildren();
      watch.append(link('← '+words('library'),'library','film-back'));
      body=element('div','film-details');
      watch.append(body);
      body.append(element('div','film-heading'),player(video),element('div','film-toolbar'),element('div','film-related'));
    }else watch.querySelector('.film-back').textContent='← '+words('library');
    const h1=element('h1','',video.title);
    h1.id='videoTitle';
    h1.tabIndex=-1;
    body.querySelector('.film-heading').replaceChildren(element('small','',words('library')+' · '+words(video.topic)),h1,
      element('p','',video.author+' · '+runtime(video.seconds)+' · '+words('language')+': '+words(video.language)+' · '+words(video.level)));
    const original=external(words('original')+' ↗','https://www.youtube.com/watch?v='+video.id);
    original.target='_blank';
    original.rel='noopener noreferrer';
    body.querySelector('.film-toolbar').replaceChildren(original,marker(video,'favorite'),marker(video,'done'),badge(video));
    const related=body.querySelector('.film-related');
    related.replaceChildren();
    courseLinks(video,related);
    const siblings=Object.values(relatedTopics).filter(group=>group.includes(video.topic)).flat();
    const score=v=>(v.topic===video.topic?8:siblings.includes(v.topic)?4:0)+(v.language===video.language?2:0)+(v.level===video.level?1:0);
    const matches=curatedVideoLessons.filter(v=>v.id!==video.id).sort((a,b)=>score(b)-score(a));
    collection(matches.slice(0,3),'recommend',related);
    document.title=video.title+' · Yoga Space';
  }
  function routeVideo(){
    const [kind,id]=location.hash.slice(1).split('/');
    const watch=el('watch');
    const changedLanguage=currentLanguage!==language;
    if(changedLanguage){filterForm();profile();currentLanguage=language;}
    const previous=currentVideo;
    currentVideo='';
    if(kind!=='watch'){
      watch.hidden=true;
      if(previous)watch.replaceChildren();
      if(kind==='course'&&!el('relatedVideos'))programmeVideos(id);
      if(previous)document.getElementById(kind)?.scrollIntoView();
      return;
    }
    for(const section of document.querySelectorAll('main > section')) section.hidden=section!==watch;
    const video=index.get(id);
    if(!video){
      watch.replaceChildren(element('h1','',words('unknown')),link('← '+words('library'),'library',''));
      watch.scrollIntoView();return;
    }
    currentVideo=id;
    if(previous!==id||changedLanguage||!watch.querySelector('.film-details'))detail(video,previous===id);
    document.title=video.title+' · Yoga Space';
    if(previous!==id){watch.scrollIntoView();el('videoTitle').focus({preventScroll:true});}
  }
  window.addEventListener('hashchange',routeVideo);
  el('language').addEventListener('change',routeVideo);
  window.addEventListener('storage',event=>{if(!event.key||event.key.startsWith('yogaspace.v1.video.'))syncMarks();});
  routeVideo();
})();
