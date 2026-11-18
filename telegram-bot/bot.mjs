import { languages, texts } from './content.mjs';
import { restartProgramme as programme } from './program.mjs';
import { validTime, validZone } from './store.mjs';

export const productionSite = 'https://gulmaliyevelxan97-ai.github.io/yoga-platform/';
export const founderContact = 'https://www.instagram.com/elxanaze001/';
const cb = (text, callback_data) => ({text,callback_data});
const web = (text,url) => ({text,url});
const languageButtons = [[cb('Русский','lang:ru'),cb('Azərbaycan dili','lang:az'),cb('English','lang:en')]];
const trackNames={mind:'MIND',body:'BODY',nutrition:'NUTRITION',life:'LIFE'};
const presetTimes=['08:00','12:00','19:30'];

export function createBot({api,store,site=productionSite,team=founderContact}) {
  const link = hash => new URL(hash,site).href;
  const send = (chat_id,text,rows) => api('sendMessage',{chat_id,text,link_preview_options:{is_disabled:true},
    ...(rows?.length && {reply_markup:{inline_keyboard:rows}})});
  const mainRows = t => [
    [cb(t.program,'program'),cb(t.progress,'progress')],
    [cb('MIND','mind'),cb('BODY','body')],
    [cb('NUTRITION','nutrition'),cb('LIFE','life')],
    [cb(t.reminders,'reminders'),cb(t.team,'team')],
    [web(t.site,site),cb(t.language,'language')]
  ];
  function noticeSettings(member) {
    const t=texts(member.lang);
    return send(member.chat_id,
      `${t.remindersText}\n\n${member.enabled?t.enabled:t.disabled} · ${t.at}: ${member.time} · ${t.zone}: ${member.zone}\n\n${t.timeHelp}`,[
      presetTimes.map(time=>cb(time,'time:'+time)),
      [cb(member.enabled?t.disable:t.enable,member.enabled?'disable':'enable')],
      [cb(t.back,'menu')]
    ]);
  }
  async function action(chatId, value, guess) {
    const member=store.member(chatId,guess), t=texts(member.lang);
    const back=[cb(t.back,'menu')];
    const refresh=()=>noticeSettings(store.member(chatId));
    if (value==='start') return send(chatId,t.welcome,mainRows(t));
    if (value==='menu') return send(chatId,t.menu,mainRows(t));
    if (value==='language') return send(chatId,t.language,[...languageButtons,back]);
    if (value.startsWith('lang:') && languages.includes(value.slice(5))) {
      store.setLanguage(chatId,value.slice(5));
      return action(chatId,'menu');
    }
    if (value==='program') return send(chatId,t.programText,[
      [web(t.plan,link(programme.weeklyPlan))],[web(t.announced,link(programme.announcement))],back
    ]);
    if (value==='progress') return send(chatId,t.progressText,[[web(t.progress,link('#profile'))],back]);
    if (value==='team') return send(chatId,t.teamText,[[web(t.contact,team),web(t.founder,link('#founder'))],back]);
    if (Object.hasOwn(programme.tracks,value)) return send(chatId,trackNames[value]+'\n\n'+t[value],[[web(t.more,link(programme.tracks[value]))],back]);
    if (value==='enable' || value==='disable') {
      store.setEnabled(chatId,value==='enable');
      return refresh();
    }
    if (value.startsWith('time:')) {
      if (!validTime(value.slice(5))) return send(chatId,t.badTime,[back]);
      store.setTime(chatId,value.slice(5));
      return refresh();
    }
    if (value.startsWith('zone:')) {
      if (!validZone(value.slice(5))) return send(chatId,t.badZone,[back]);
      store.setZone(chatId,value.slice(5));
      return refresh();
    }
    if (value==='reminders') return refresh();
    return send(chatId,t.help,mainRows(t));
  }

  return {
    async handle(update) {
      const callback=update.callback_query;
      const message=callback?.message ?? update.message;
      if (callback?.id) await api('answerCallbackQuery',{callback_query_id:callback.id}).catch(()=>{});
      if (message?.chat?.type!=='private' || !Number.isSafeInteger(message.chat.id) || message.chat.id<1) return;
      const chatId=message.chat.id;
      if (callback) {
        if (callback.from?.id !== chatId || typeof callback.data !== 'string') return;
        // Time zone changes use commands, since callback data is not trusted.
        if (callback.data.startsWith('zone:')) return;
        return action(chatId,callback.data);
      }
      const raw=message.text?.trim();
      if (!raw?.startsWith('/')) return;
      const [command,arg=''] = raw.split(/\s+/,2);
      const aliases = {start:'start',help:'help',language:'language',reminders:'reminders',stop:'disable',time:'time:'+arg,timezone:'zone:'+arg};
      const key=command.slice(1).split('@')[0].toLowerCase();
      if (!Object.hasOwn(aliases,key)) return;
      return action(chatId,aliases[key],message.from?.language_code?.split('-')[0]);
    },
    async remind(now=new Date(),signal) {
      for (const member of store.due(now)) {
        if (signal?.aborted) { store.release(member); break; }
        const t=texts(member.lang);
        try { await send(member.chat_id,t.daily,[[web(t.practice,link('#practices'))]]); }
        catch (error) {
          if (error.code===403 || error.code===400) store.setEnabled(member.chat_id,false);
          else if (error.code===429) { store.release(member); return error.retryAfter || 30; }
          else console.error('A scheduled delivery was not confirmed.');
        }
      }
      return 0;
    }
  };
}
