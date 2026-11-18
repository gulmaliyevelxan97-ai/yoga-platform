import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBot, productionSite } from './bot.mjs';
import { restartProgramme } from './program.mjs';
import { openStore } from './store.mjs';
import { telegramApi } from './telegram.mjs';

const id=1234;
const message=(text,language_code='ru')=>({message:{text,chat:{type:'private',id},from:{id,language_code}}});
const click=data=>({callback_query:{id:'callback-id',data,from:{id},message:{chat:{type:'private',id}}}});
const at=iso=>new Date(iso);
function session() {
  const store=openStore(':memory:');
  const out=[];
  const bot=createBot({store,api:async(method,payload)=>{out.push({method,payload});}});
  return {store,bot,out,sent:()=>out.filter(call=>call.method==='sendMessage').at(-1)?.payload};
}

test('Welcome has all requested options and the production website link',async()=>{
  const {bot,store,sent}=session();
  try {
    await bot.handle(message('/start'));
    assert.match(sent().text,/новое начало/i);
    const buttons=sent().reply_markup.inline_keyboard.flat();
    assert.deepEqual(buttons.map(x=>x.callback_data).filter(Boolean),['program','progress','mind','body','nutrition','life','reminders','team','language']);
    assert.equal(buttons.find(x=>x.url).url,productionSite);
    assert.equal(store.member(id).enabled,0);
  } finally {store.close();}
});

test('Programme, four tracks, profile and team open real routes without fake enrolment',async()=>{
  const {bot,store,sent}=session();
  try {
    for (const [key,hash] of Object.entries({...restartProgramme.tracks,program:'#plan',progress:'#profile',team:'#founder'})) {
      await bot.handle(click(key));
      assert(sent().reply_markup.inline_keyboard.flat().some(b=>b.url===productionSite+hash),key);
    }
    await bot.handle(click('program'));
    assert.match(sent().text,/анонсирована/);
    assert.equal(restartProgramme.durationDays,56);
  } finally {store.close();}
});

test('AZ and EN selection persists and a Telegram language hint is used on first contact',async()=>{
  const {bot,store,sent}=session();
  try {
    await bot.handle(message('/start','az'));
    assert.match(sent().text,/xoş gəlmisən/);
    await bot.handle(click('lang:en'));
    assert.match(sent().text,/Main menu/);
    await bot.handle(message('/start','ru'));
    assert.match(sent().text,/Welcome to RESTART/);
  } finally {store.close();}
});

test('Reminder requires explicit consent, follows time zone and is sent once per day',async()=>{
  const {bot,out,store}=session();
  const reminders=()=>out.filter(c=>c.method==='sendMessage'&&c.payload.text.startsWith('Время для RESTART')).length;
  try {
    await bot.handle(click('time:08:00'));
    await bot.remind(at('2026-11-19T04:00:00Z'));
    assert.equal(reminders(),0);
    await bot.handle(click('enable'));
    await bot.remind(at('2026-11-19T03:59:59Z'));
    assert.equal(reminders(),0);
    await bot.remind(at('2026-11-19T04:00:00Z'));
    await bot.remind(at('2026-11-19T04:03:00Z'));
    assert.equal(reminders(),1);
    await bot.handle(message('/timezone Europe/London'));
    await bot.remind(at('2026-11-20T08:00:00Z'));
    assert.equal(reminders(),2);
    await bot.handle(message('/stop'));
    await bot.remind(at('2026-11-21T08:00:00Z'));
    assert.equal(reminders(),2);
  } finally {store.close();}
});

test('Invalid inputs, group commands and mismatched callbacks cannot change settings',async()=>{
  const {bot,store}=session();
  try {
    for (const text of ['/time 29:40','/timezone +04:00']) await bot.handle(message(text));
    const group=message('/start');group.message.chat.type='group';
    const forged=click('enable');forged.callback_query.from.id=id+1;
    await bot.handle(group);await bot.handle(forged);
    assert.equal(store.member(id).enabled,0);
    assert.equal(store.member(id).time,'19:30');
    assert.equal(store.member(id).zone,'Asia/Baku');
  } finally {store.close();}
});

test('Blocked chats stop reminders; 429 releases the slot for a confirmed retry',async()=>{
  const store=openStore(':memory:');
  try {
    store.member(id);store.setEnabled(id,true);
    let failure=429,sends=0;
    const bot=createBot({store,api:async()=>{sends++;throw Object.assign(new Error('test'),{code:failure,retryAfter:7});}});
    const due=at('2026-11-19T15:30:00Z');
    assert.equal(await bot.remind(due),7);
    failure=403;
    assert.equal(await bot.remind(due),0);
    await bot.remind(at('2026-11-20T15:30:00Z'));
    assert.equal(sends,2);
    assert.equal(store.member(id).enabled,0);
  } finally {store.close();}
});

test('Reminder settings and long-poll offset are durable across service restarts',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'restart-bot-'));
  try {
    const db=join(dir,'restart.sqlite');
    const first=openStore(db);
    first.member(id,'az');first.setEnabled(id,true);
    first.setTime(id,'08:00');first.advance(87);first.advance(80);first.close();
    const second=openStore(db);
    try {
      assert.equal(second.offset(),87);
      assert.equal(second.member(id).lang,'az');
      assert.equal(second.member(id).enabled,1);
      assert.equal(second.member(id).time,'08:00');
    } finally {second.close();}
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('Bot API request and rate limit conversion with a fake transport',async()=>{
  const api=telegramApi('dummy',{fetcher:async(url,options)=>{
    assert.equal(new URL(url).hostname,'api.telegram.org');
    assert.equal(options.method,'POST');
    assert.deepEqual(JSON.parse(options.body),{timeout:25});
    return {ok:false,status:429,json:async()=>({ok:false,error_code:429,parameters:{retry_after:12}})};
  }});
  await assert.rejects(api('getUpdates',{timeout:25}),err=>err.code===429&&err.retryAfter===12&&!err.message.includes('dummy'));
});
