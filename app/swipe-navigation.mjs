const edgeWidth = 24;
const minimumDistance = 72;
const maximumDuration = 700;
const interactive = 'a,button,input,textarea,select,label,summary,details,form,'+
 '[contenteditable],[role="button"],[role="slider"],[data-no-swipe],video,audio,iframe';

export function adjacentSwipeTab(tabs, current, start, end, {width, duration}) {
 const index = tabs.indexOf(current);
 const dx = end.x - start.x;
 const dy = end.y - start.y;
 if (index < 0 || duration < 0 || duration > maximumDuration ||
     start.x < edgeWidth || end.x < edgeWidth || start.x > width-edgeWidth || end.x > width-edgeWidth ||
     Math.abs(dx) < minimumDistance || Math.abs(dy) > Math.abs(dx)*.55) return null;
 return tabs[index + (dx < 0 ? 1 : -1)] ?? null;
}

export function enableTabSwipe(screen, tabs, currentTab, navigate) {
 let gesture;
 const point = touch => ({x:touch.clientX,y:touch.clientY});
 const on = (name,fn) => screen.addEventListener(name,fn,{passive:true});

 on('touchstart',event=>{
  gesture = null;
  const tab = currentTab();
  if (event.touches.length!==1 || !tabs.includes(tab) || event.target.closest(interactive)) return;
  const touch = event.touches[0];
  gesture = {tab,id:touch.identifier,start:point(touch),at:event.timeStamp,top:window.scrollY};
 });
 on('touchmove',event=>{
  if (!gesture) return;
  const touch = event.touches[0];
  if (event.touches.length!==1 || touch.identifier!==gesture.id) {
   gesture = null;
   return;
  }
  const dx = Math.abs(touch.clientX-gesture.start.x);
  const dy = Math.abs(touch.clientY-gesture.start.y);
  if ((dy>28 && dy>=dx) || Math.abs(window.scrollY-gesture.top)>8) gesture = null;
 });
 on('touchcancel',()=>{gesture = null;});
 on('touchend',event=>{
  const ended = gesture;
  gesture = null;
  if (!ended || event.touches.length || ended.tab!==currentTab() ||
      Math.abs(window.scrollY-ended.top)>8 || window.getSelection()?.isCollapsed===false) return;
  const touch = Array.from(event.changedTouches).find(item=>item.identifier===ended.id);
  if (!touch) return;
  const next = adjacentSwipeTab(tabs,ended.tab,ended.start,point(touch),{
   width:document.documentElement.clientWidth,duration:event.timeStamp-ended.at
  });
  if (next) navigate(ended.tab,next,ended.top);
 });
}
