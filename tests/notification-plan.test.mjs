import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
 dueNotifications, notificationPlanMessage, readNotificationPlan,
 renderNotificationPlan, writeNotificationPlan
} from '../app/notification-plan.mjs';

function storage(initial=null) {
 let value = initial;
 return {getItem:()=>value,setItem:(_,data)=>{value=data;}};
}

const baku = {
 enabled:true, timeZone:'Asia/Baku',
 times:{morning:'08:00',day:'13:30',evening:'20:00'},
 categories:['practice','academy']
};
const instant = text => new Date(text);

test('Device schedule stores known topics, validates data and starts disabled',()=>{
 const store = storage('invalid json');
 const defaults = readNotificationPlan(store);
 assert.equal(defaults.enabled,false);
 assert.equal(defaults.timeZone,'Asia/Baku');
 assert.equal(writeNotificationPlan({...baku,categories:['academy','academy','unknown','practice']},store),true);
 assert.deepEqual(readNotificationPlan(store).categories,['practice','academy']);
 assert.equal(readNotificationPlan(storage('{"version":2,"enabled":true}')).enabled,false);
 assert.equal(writeNotificationPlan(baku,{setItem(){throw Error('Storage unavailable');}}),false);
});

test('Baku time produces due events with their local calendar date and seen keys suppress duplicates',()=>{
 const now = instant('2026-11-21T04:00:40.000Z');
 const [event] = dueNotifications(baku,{now});
 assert.deepEqual(event,{
  id:'2026-11-21:morning',period:'morning',date:'2026-11-21',time:'08:00',categories:['practice','academy']
 });
 assert.deepEqual(dueNotifications(baku,{now,seen:new Set([event.id])}),[]);
 assert.deepEqual(dueNotifications({...baku,enabled:false},{now}),[]);
 assert.deepEqual(dueNotifications({...baku,categories:[]},{now}),[]);
 assert.equal(dueNotifications(baku,{now:instant('2026-11-21T09:30:00Z')})[0].period,'day');
 assert.equal(dueNotifications(baku,{now:instant('2026-11-21T16:00:00Z')})[0].period,'evening');
});

test('Quiet hours suppress scheduled and delivery times across local midnight',()=>{
 const plan = {...baku,times:{morning:'07:00',day:'21:59',evening:'23:59'},quiet:{start:'22:00',end:'07:00'}};
 assert.deepEqual(dueNotifications(plan,{now:instant('2026-11-20T19:59:00Z')}),[]);
 assert.deepEqual(dueNotifications(plan,{now:instant('2026-11-20T20:00:00Z'),windowMinutes:130}),[]);
 assert.equal(dueNotifications(plan,{now:instant('2026-11-21T03:00:00Z')})[0].period,'morning');
 const midnight = {...baku,times:{evening:'23:59'}};
 assert.equal(dueNotifications(midnight,{now:instant('2026-11-20T20:00:00Z'),windowMinutes:2})[0].date,'2026-11-20');
});

test('Missing DST times do not fire and a repeated wall-clock slot is offered once',()=>{
 const plan = {...baku,timeZone:'America/New_York',times:{morning:'02:00',day:'01:30'}};
 assert.deepEqual(dueNotifications(plan,{now:instant('2026-03-08T07:00:00Z')}),[]);
 const [slot] = dueNotifications(plan,{now:instant('2026-11-01T05:30:00Z')});
 assert.equal(slot.id,'2026-11-01:day');
 assert.deepEqual(dueNotifications(plan,{now:instant('2026-11-01T06:30:00Z'),seen:new Set([slot.id])}),[]);
 assert.equal(dueNotifications(plan,{now:instant('2026-11-01T06:31:00Z'),windowMinutes:120}).length,1);
});

test('Preference form is localized, has schedule fields and does not claim background delivery',()=>{
 for (const lang of ['ru','az','en']) {
  const html = renderNotificationPlan({...baku,timeZone:'"><script>'},lang);
  assert.match(html,/id="notification-plan-form"/);
  assert.match(html,/value="Asia\/Baku"/);
  assert.match(html,/name="quietStart"/);
  assert.doesNotMatch(html,/<script>/);
  assert.equal(typeof notificationPlanMessage(lang,'saved'),'string');
 }
 assert.match(renderNotificationPlan(baku,'en'),/while RESTART is open/);
});
