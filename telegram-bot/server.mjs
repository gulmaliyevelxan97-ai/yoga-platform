import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import { createBot } from './bot.mjs';
import { openStore } from './store.mjs';
import { telegramApi } from './telegram.mjs';

function contactUrl(value) {
  if (!value) return undefined;
  let url;
  try { url=new URL(value); } catch { throw new Error('RESTART_TEAM_URL must be an HTTPS link'); }
  if (url.protocol!=='https:' || url.username || url.password) throw new Error('RESTART_TEAM_URL must be an HTTPS link');
  return url.href;
}
async function start() {
  const token=process.env.TELEGRAM_BOT_TOKEN;
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token || '')) {
    throw new Error('Set TELEGRAM_BOT_TOKEN in the private environment before starting.');
  }
  const team=contactUrl(process.env.RESTART_TEAM_URL);
  const api=telegramApi(token);
  const webhook=await api('getWebhookInfo');
  if (webhook.url) throw new Error('A webhook is already configured. Coordinate the switch before starting polling.');
  const directory=resolve(process.env.RESTART_BOT_DB || './data/restart.sqlite');
  process.umask(0o077);
  await mkdir(dirname(directory),{recursive:true,mode:0o700});
  const store=openStore(directory,process.env.RESTART_BOT_TIMEZONE || 'Asia/Baku');
  const bot=createBot({api,store,team});
  const shutdown=new AbortController();
  process.once('SIGTERM',()=>shutdown.abort());
  process.once('SIGINT',()=>shutdown.abort());
  const wait=ms=>pause(ms,undefined,{signal:shutdown.signal}).catch(()=>{});
  let remindersPausedUntil=0;
  let remindersJob;
  const timer=setInterval(()=>{
    if (shutdown.signal.aborted || remindersJob || Date.now()<remindersPausedUntil) return;
    remindersJob=bot.remind().then(retry=>{
      if (retry) remindersPausedUntil=Date.now()+retry*1000;
    }).catch(()=>console.error('Could not process reminder settings.')).finally(()=>{remindersJob=undefined;});
  },30000);
  let recovery=1000;
  try {
    console.log('RESTART bot: long polling started.');
    while (!shutdown.signal.aborted) {
      try {
        const updates=await api('getUpdates',{offset:store.offset(),timeout:25,allowed_updates:['message','callback_query']});
        recovery=1000;
        for (const update of updates) {
          if (shutdown.signal.aborted) break;
          try { await bot.handle(update); }
          catch (error) {
            if (error.code===429) {
              await wait((error.retryAfter || 5)*1000);
              break;
            }
            if (error.code!==403 && error.code!==400) {
              // Retry a failed reply before acknowledging its update.
              throw error;
            }
          }
          store.advance(update.update_id+1);
        }
      } catch (error) {
        if ([401,404,409].includes(error.code)) throw new Error('Telegram rejected polling. Check access and run only one bot instance.');
        await wait(Math.max(recovery,(error.retryAfter || 0)*1000));
        recovery=Math.min(recovery*2,30000);
      }
    }
  } finally {
    clearInterval(timer);
    await remindersJob;
    store.close();
  }
}
start().catch(error=>{
  // Never print raw transport errors or request URLs.
  console.error(error.message === 'Telegram API rejected the request' ? 'Telegram API rejected startup.' : error.message);
  process.exitCode=1;
});
