import assert from 'node:assert/strict';
import test from 'node:test';
import {
 readRetreatConnectContacts, readRetreatConnectFeed, readRetreatConnectMemberships, retreatConnectPage,
 retreatConnectSendArgs, retreatReplyTarget
} from '../app/retreat-connect.mjs';

const participant={id:'participant'};
const mentor={id:'mentor'};
const group={cohort_id:'group',role:'participant',restart_retreat_cohorts:{title:'Retreat <group>'}};
const mentorGroup={...group,role:'mentor'};
const message={id:'message',cohort_id:'group',sender_id:'mentor',recipient_id:'participant',
 body:'Secret <script>\nStill private',sent_at:'2026-11-26T06:15:00Z'};

function fixture({messages=[message],groups=[group],unread=2,receipts=[],contacts=[]}={}) {
 const calls=[];
 const outputs={restart_retreat_members:groups,restart_retreat_messages:messages,restart_retreat_message_reads:receipts,restart_retreat_admissions:contacts};
 return {calls,client:{
  from(table) {
   calls.push([table]);
   const query=new Proxy({}, {get(_,method) {
    if (method==='then') return resolve=>resolve({data:outputs[table]});
    return (...args)=>{calls.push([table,method,...args]);return query;};
   }});
   return query;
  },
  rpc(name,args) {
   calls.push([name,args]);
   return {data:unread};
  }
 }};
}

test('Connect guards guest scopes before data requests and selects explicit columns',async()=>{
 const {client,calls}=fixture();
 assert.deepEqual(await readRetreatConnectMemberships(client,{...participant,is_anonymous:true}),[]);
 assert.deepEqual(await readRetreatConnectMemberships(client,null),[]);
 assert.equal(calls.length,0);
 assert.deepEqual(await readRetreatConnectMemberships(client,participant),[group]);
 const feed=await readRetreatConnectFeed(client,participant,'group',1);
 assert.equal(feed.unread,2);
 assert.deepEqual(feed.messages,[message]);
 assert.equal(feed.hasOlder,false);
 assert.ok(calls.some(call=>call.join('/')==='restart_retreat_messages/eq/cohort_id/group'));
 assert.ok(calls.some(call=>call.join('/')==='restart_retreat_messages/range/40/80'));
 assert.ok(calls.some(call=>call.join('/')==='restart_retreat_message_reads/eq/reader_id/participant'));
 assert.ok(calls.some(call=>call.join('/')==='restart_retreat_message_reads/in/message_id/message'));
 assert.ok(calls.some(([name,params])=>name==='restart_retreat_unread_count' && params.p_cohort_id==='group'));
 assert.ok(!calls.some(([,operation,fields])=>operation==='select' && (fields==='*' || fields?.includes('client_id'))));
});

test('Private replies derive recipients from the active group and mentor-only announcements use null recipients',()=>{
 const notice={...message,recipient_id:null};
 assert.equal(retreatReplyTarget(message,group,participant),'mentor');
 assert.equal(retreatReplyTarget(notice,group,participant),'mentor');
 assert.equal(retreatReplyTarget({...notice,sender_id:'otherMentor'},mentorGroup,mentor),null);
 assert.equal(retreatReplyTarget({...message,cohort_id:'elsewhere'},group,participant),null);
 assert.equal(retreatReplyTarget({...message,recipient_id:'someone else'},group,participant),null);
 assert.deepEqual(retreatConnectSendArgs(group,message,participant,'Reply','req'),{
  p_cohort_id:'group',p_recipient_id:'mentor',p_body:'Reply',p_client_id:'req'
 });
 assert.equal(retreatConnectSendArgs(mentorGroup,null,mentor,'Notice','req').p_recipient_id,null);
 assert.throws(()=>retreatConnectSendArgs(group,null,participant,'Notice','req'));
 assert.throws(()=>retreatConnectSendArgs(group,message,{...participant,is_anonymous:true},'Reply','req'));
});

test('Connect escapes message bodies, offers receipt and reply actions, and omits mentor controls for participants',async()=>{
 const {client}=fixture();
 const outlet={querySelectorAll:()=>[]};
 await retreatConnectPage({outlet,client,user:participant,lang:'en',current:()=>true,
  esc:value=>String(value).replaceAll('<','&lt;').replaceAll('>','&gt;')});
 assert.match(outlet.innerHTML,/Retreat &lt;group&gt;/);
 assert.match(outlet.innerHTML,/Secret &lt;script&gt;<br>Still private/);
 assert.match(outlet.innerHTML,/data-connect-action="read"/);
 assert.match(outlet.innerHTML,/data-connect-action="reply"/);
 assert.doesNotMatch(outlet.innerHTML,/data-connect-action="announce"/);
 assert.doesNotMatch(outlet.innerHTML,/<script>/);
});

test('Connect skips feed requests for signed-in users without cohort membership',async()=>{
 const {client,calls}=fixture({groups:[]});
 const outlet={querySelectorAll:()=>[]};
 await retreatConnectPage({outlet,client,user:participant,lang:'en',current:()=>true,esc:String});
 assert.match(outlet.innerHTML,/after you join a group/);
 assert.equal(calls.every(([table])=>table==='restart_retreat_members'),true);
});

test('Mentors can start direct messages from their approved applications without participant roster access',async()=>{
 const contact={cohort_id:group.cohort_id,applicant_id:'participant',full_name:'Alex <name>'};
 const {calls,client}=fixture({contacts:[contact],groups:[mentorGroup]});
 assert.deepEqual(await readRetreatConnectContacts(client,group),[]);
 assert.equal(calls.length,0);
 assert.deepEqual(await readRetreatConnectContacts(client,mentorGroup),[contact]);
 assert.ok(calls.some(call=>call.join('/')==='restart_retreat_admissions/eq/cohort_id/group'));
 assert.ok(calls.some(call=>call.join('/')==='restart_retreat_admissions/eq/status/approved'));
 const expected={p_cohort_id:'group',p_recipient_id:'participant',p_body:'A private message',p_client_id:'retry-id'};
 assert.deepEqual(retreatConnectSendArgs(mentorGroup,null,mentor,'A private message','retry-id',contact),expected);
 assert.throws(()=>retreatConnectSendArgs(mentorGroup,null,mentor,'No','req',{...contact,cohort_id:'other'}));
 assert.throws(()=>retreatConnectSendArgs(group,null,participant,'No','req',contact));
 const outlet={querySelectorAll:()=>[]};
 await retreatConnectPage({outlet,client,user:mentor,lang:'en',current:()=>true,
  esc:value=>String(value).replaceAll('<','&lt;').replaceAll('>','&gt;')});
 assert.match(outlet.innerHTML,/data-connect-action="write"/);
 assert.match(outlet.innerHTML,/data-connect-action="announce"/);
 assert.match(outlet.innerHTML,/Alex &lt;name&gt;/);
});
