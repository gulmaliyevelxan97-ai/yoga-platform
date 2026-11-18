const library = {
  yoga: {name:'Йога', description:'Мягкое движение и внимание к телу.', lessons:[
    ['Утренняя разминка','Начните стоя, оставив достаточно места вокруг себя.',[
      'Поставьте стопы на ширину таза. Почувствуйте опору и слегка смягчите колени.',
      'Медленно поднимайте и опускайте плечи. Затем сделайте несколько небольших кругов плечами.',
      'Плавно перенесите вес с одной стопы на другую. Завершите в центре.']],
    ['Пауза за столом','Сядьте на устойчивый стул, поставьте обе стопы на пол.',[
      'Вытянитесь макушкой вверх, положив ладони на бёдра.',
      'По очереди тянитесь рукой к потолку в удобном диапазоне. Опускайте руку с выдохом.',
      'Мягко сведите лопатки, затем отпустите. Между повторениями отдыхайте.']]]},
  breath: {name:'Дыхание', description:'Спокойные упражнения в своём темпе.', lessons:[
    ['Ровное дыхание','Устройтесь удобно. Дышите без усилия и задержек.',[
      'Заметьте несколько обычных вдохов и выдохов.',
      'Мысленно считайте вдох и выдох до одинакового удобного числа. Можно начать с двух.',
      'Отпустите счёт и понаблюдайте за естественным ритмом.']],
    ['Дыхание с ладонью','Положите ладонь на нижние рёбра поверх одежды.',[
      'Заметьте движение под ладонью при обычном вдохе.',
      'Проследите за движением рёбер на выдохе. Дышите свободно.',
      'Опустите руку и понаблюдайте ещё несколько циклов.']]]},
  meditation: {name:'Медитация', description:'Тихие занятия для тренировки внимания.', lessons:[
    ['Сканирование тела','Сядьте или лягте. Можно прикрыть глаза.',[
      'Направьте внимание к стопам. Отметьте тепло, давление или контакт с полом.',
      'Переведите внимание к ладоням, плечам и лицу. Замечайте ощущения по очереди.',
      'Почувствуйте тело целиком. В конце откройте глаза и осмотритесь.']],
    ['Звуки вокруг','Сядьте удобно и дайте взгляду остановиться на одной точке.',[
      'Прислушайтесь к ближайшему звуку. Заметьте его начало и окончание.',
      'Расширьте внимание и прислушайтесь к отдалённым звукам.',
      'Если отвлеклись, мягко вернитесь к слушанию. В конце почувствуйте опору.']]]}
};
const el = id => document.getElementById(id);
function link(label, hash, className) {
  const a = document.createElement('a');
  a.textContent = label;
  a.href = '#' + hash;
  a.className = className;
  return a;
}
for (const [id, group] of Object.entries(library)) {
  const card = link('', id, 'card');
  const arrow = document.createElement('span');
  arrow.textContent = '↗';
  arrow.setAttribute('aria-hidden','true');
  const title = document.createElement('b');
  title.textContent = group.name;
  const desc = document.createElement('p');
  desc.textContent = group.description;
  card.append(arrow,title,desc);
  el('categories').append(card);
}
for (const minutes of [1,3,5,10,15]) el('length').add(new Option(minutes + ' мин', minutes));
let remaining = 0, deadline = 0, interval, activeRoute = '', lesson;
function duration() { return Number(el('length').value) * 60000; }
function stop() {
  clearInterval(interval);
  deadline = 0;
}
function draw() {
  if (deadline) remaining = Math.max(0,deadline - Date.now());
  if (!remaining) stop();
  const seconds = Math.ceil(remaining / 1000);
  el('time').textContent = [Math.floor(seconds/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
  const step = Math.min(2,Math.floor(3*(1-remaining/duration())));
  Array.from(el('steps').children).forEach((item,i)=>item.classList.toggle('current',Boolean(deadline) && i===step));
  const status = deadline ? 'Шаг ' + (step+1) + ' из 3' : !remaining ? 'Практика завершена' : remaining===duration() ? 'Готово к началу' : 'На паузе';
  if (el('status').textContent !== status) el('status').textContent = status;
  el('toggle').textContent = deadline ? 'Пауза' : !remaining ? 'Повторить' : remaining===duration() ? 'Начать' : 'Продолжить';
}
function reset() {
  stop();
  remaining = duration();
  draw();
}
el('toggle').onclick = () => {
  if (deadline) {
    draw();
    stop();
  } else {
    if (!remaining) remaining = duration();
    deadline = Date.now()+remaining;
    interval = setInterval(draw,200);
  }
  draw();
};
el('reset').onclick = reset;
el('length').onchange = reset;
document.addEventListener('visibilitychange',()=>{ if (deadline) draw(); });
function route() {
  const [id,index='1'] = location.hash.slice(1).split('/');
  if (!Object.hasOwn(library,id)) {
    stop();
    activeRoute = '';
    el('studio').hidden = true;
    return;
  }
  const group = library[id];
  const selected = index === '2' ? 1 : 0;
  const key = id + '/' + (selected+1);
  if (key !== activeRoute) {
    activeRoute = key;
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
    el('length').value = id==='yoga' ? '10' : '5';
    reset();
  }
  el('studio').hidden = false;
  el('studio').scrollIntoView();
  el('category').focus({preventScroll:true});
}
el('category').tabIndex=-1;
window.addEventListener('hashchange',route);
document.querySelector('#categories').addEventListener('click', e=>{
  if (e.target.closest('a')?.hash === location.hash) route();
});
route();
