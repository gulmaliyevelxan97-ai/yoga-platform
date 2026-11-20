import test from 'node:test';
import assert from 'node:assert/strict';
import {studentStore} from '../app/cloud-data.mjs';
import {initialState} from '../app/state.mjs';

test('Import totals reflect server acknowledgements across batches and retries',async()=>{
 const user='test-user';
 const local=initialState();
 local.sessions=Array.from({length:51},(_,i)=>({id:String(i),practice:'yoga',day:'2026-11-20',seconds:120}));
 const stored=new Set();
 let calls=0;
 const client={async rpc(name,{payload}){
  assert.equal(name,'restart_import_local');
  assert.equal(payload.expected_user,user);
  if (++calls===2) return {error:new Error('connection lost')};
  const size=stored.size;
  for (const row of payload.practices) stored.add(row.client_id);
  return {data:{journal:0,practices:stored.size-size}};
 }};
 const store=studentStore(client,user);
 await assert.rejects(store.import(local),/connection lost/);
 assert.equal(stored.size,50);
 assert.deepEqual(await store.import(local),{journal:0,practices:1});
 assert.deepEqual(await store.import(local),{journal:0,practices:0});
 assert.equal(local.sessions.length,51);
});

test('Stale revisions are rejected without replacing the newer cloud note',async()=>{
 const user='user-a';
 const row={user_id:user,client_id:'entry',revision:1,notes:'original'};
 const client={from(table){
  assert.equal(table,'restart_journal');
  return {update(patch){
   const filters=[];
   return {eq(key,value){filters.push([key,value]);return this;},
    select(){
     assert.deepEqual(filters.map(([key])=>key),['user_id','revision','client_id']);
     if (!filters.every(([key,value])=>row[key]===value)) return {data:[]};
     Object.assign(row,patch,{revision:row.revision+1});
     return {data:[{revision:row.revision}]};
    }};
  }};
 }};
 const first=studentStore(client,user);
 const second=studentStore(client,user);
 await first.saveJournal({id:'entry',revision:1,notes:'edited'});
 await assert.rejects(second.saveJournal({id:'entry',revision:1,notes:'stale'}),/restart_conflict/);
 assert.equal(row.notes,'edited');
 await assert.rejects(studentStore(client,'user-b').saveJournal({id:'entry',revision:2,notes:'foreign'}),/restart_conflict/);
 assert.equal(row.notes,'edited');
});

test('Offline journal draft survives reload for its owner and clears on save, sign-out or account change',async()=>{
 const {cloudAccount}=await import('../app/cloud-auth.mjs');
 const original={location:globalThis.location,sessionStorage:globalThis.sessionStorage};
 globalThis.location={href:'https://pilot.example.invalid/app/'};
 const storage=new Map();
 globalThis.sessionStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
 let user={id:'test-a'};
 let offline=true;
 const client={from(){return {
  select(){return this},eq(){return this},order(){return this},limit(){return {data:[]}},
  maybeSingle(){return {data:null}},
  insert(){return offline ? {error:new Error('offline')} : {data:null}}
 }},auth:{async getSession(){return {data:{session:{user}}}},onAuthStateChange(){},async signOut(){return {}}}};
 try{
  const account=cloudAccount(client,()=>{},()=> 'en');
  await account.init();
  const entry={id:'test-entry',notes:'draft',date:'2026-11-20'};
  assert.equal(await account.save('saveJournal',entry),false);
  assert.deepEqual(account.journalDraft,entry);
  const reloaded=cloudAccount(client,()=>{},()=> 'en');
  await reloaded.init();
  assert.deepEqual(reloaded.journalDraft,entry);
  offline=false;
  assert.equal(await reloaded.save('saveJournal',reloaded.journalDraft),true);
  assert.equal(reloaded.journalDraft,null);
  assert.equal(storage.size,0);
  offline=true;
  await account.save('saveJournal',entry);
  await account.action('logout');
  assert.equal(account.journalDraft,null);
  assert.equal(storage.size,0);
  const first=cloudAccount(client,()=>{},()=> 'en');
  await first.init();
  await first.save('saveJournal',entry);
  user={id:'test-b'};
  const second=cloudAccount(client,()=>{},()=> 'en');
  await second.init();
  assert.equal(second.journalDraft,null);
  assert.equal(storage.size,0);
 }finally{Object.assign(globalThis,original)}
});
