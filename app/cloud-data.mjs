import {initialState} from './state.mjs';

const pageSize = 200;
// Notes can contain escapes that take up to six bytes per character in JSON.
const importBatchSize = 50;
const singletonTables = {name:'restart_profiles',goal:'restart_goals',settings:'restart_settings'};
const profileRow = name => ({display_name:name});
const goalRow = goal => ({weekly_count:goal});
const settingsRow = (lang, reminders) => ({
 locale:lang, reminder_time:reminders.time, remind_practice:reminders.practice,
 remind_schedule:reminders.schedule, remind_goal:reminders.goal
});
const journalRow = entry => ({
 client_id:entry.id, entry_date:entry.date, mood:Number(entry.mood||0), energy:Number(entry.energy||0),
 wellbeing:Number(entry.wellbeing||0), before_note:entry.before||'', after_note:entry.after||'', notes:entry.notes||''
});
const practiceRow = session => ({
 client_id:session.id, practice:session.practice, practice_day:session.day, seconds:session.seconds
});

async function result(query) {
 const {data,error} = await query;
 if (error) throw error;
 return data;
}

async function allRows(client, user, table, columns) {
 const records = [];
 let lastId;
 for (;;) {
  let query = client.from(table).select(columns).eq('user_id',user);
  if (lastId) query = query.gt('client_id',lastId);
  const rows = await result(query.order('client_id').limit(pageSize));
  records.push(...rows);
  if (rows.length<pageSize) return records;
  lastId = rows.at(-1).client_id;
 }
}

export function importBatches(local, user, batchSize = importBatchSize) {
 const journal = local.journal.map(journalRow);
 const practices = local.sessions.map(practiceRow);
 const profile = local.name ? {profile:profileRow(local.name)} : {};
 const batches = [];
 for (let index=0; index < Math.max(1,journal.length,practices.length); index += batchSize) {
  batches.push({
   expected_user:user,
   ...(index===0 ? {...profile,goal:goalRow(local.goal),settings:settingsRow(local.lang,local.reminders)} : {}),
   journal:journal.slice(index,index+batchSize), practices:practices.slice(index,index+batchSize)
  });
 }
 return batches;
}

export function studentStore(client, user) {
 const readOne = table => result(client.from(table).select('*').eq('user_id',user).maybeSingle());
 async function saveRow(table, value, revision) {
  if (revision === undefined) {
   await result(client.from(table).insert({user_id:user,...value}));
   return;
  }
  let query = client.from(table).update(value).eq('user_id',user).eq('revision',revision);
  if (value.client_id) query = query.eq('client_id',value.client_id);
  const updated = await result(query.select('revision'));
  if (!updated.length) throw new Error('restart_conflict');
 }

 return {
  async read(locale = 'ru') {
   const [profile,goal,settings,journal,practices] = await Promise.all([
    ...Object.values(singletonTables).map(readOne),
    allRows(client,user,'restart_journal','client_id,entry_date,mood,energy,wellbeing,before_note,after_note,notes,deleted,revision'),
    allRows(client,user,'restart_practice_events','client_id,practice,practice_day,seconds')
   ]);
   const next = initialState();
   next.name = profile?.display_name ?? '';
   next.goal = goal?.weekly_count ?? next.goal;
   next.lang = settings?.locale ?? locale;
   if (settings) next.reminders = {
    time:settings.reminder_time,practice:settings.remind_practice,schedule:settings.remind_schedule,goal:settings.remind_goal
   };
   next.sessions = practices.map(row=>({id:row.client_id, practice:row.practice, day:row.practice_day, seconds:row.seconds}))
    .sort((a,b)=>a.day.localeCompare(b.day));
   next.journal = journal.filter(row=>!row.deleted).map(row=>({
    id:row.client_id,date:row.entry_date,mood:String(row.mood),energy:String(row.energy),wellbeing:String(row.wellbeing),
    before:row.before_note,after:row.after_note,notes:row.notes,revision:row.revision
   }));
   next.revisions = {name:profile?.revision,goal:goal?.revision,settings:settings?.revision};
   return next;
  },
  saveName: (name,revision) => saveRow(singletonTables.name,profileRow(name),revision),
  saveGoal: (goal,revision) => saveRow(singletonTables.goal,goalRow(goal),revision),
  saveSettings: (lang,reminders,revision) => saveRow(singletonTables.settings,settingsRow(lang,reminders),revision),
  saveJournal: entry => saveRow('restart_journal',journalRow(entry),entry.revision),
  deleteJournal: entry => saveRow('restart_journal',{
   client_id:entry.id, deleted:true, notes:'', before_note:'', after_note:'', mood:0, energy:0, wellbeing:0
  },entry.revision),
  complete: session => result(client.from('restart_practice_events').upsert({user_id:user,...practiceRow(session)},
   {onConflict:'user_id,client_id',ignoreDuplicates:true})),
  async import(local) {
   const inserted = {journal:0,practices:0};
   for (const payload of importBatches(local,user)) {
    const counts = await result(client.rpc('restart_import_local',{payload}));
    inserted.journal += counts.journal;
    inserted.practices += counts.practices;
   }
   return inserted;
  }
 };
}
