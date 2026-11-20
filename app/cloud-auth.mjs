import {studentStore} from './cloud-data.mjs';

const recoveryKey = 'restart.cloud.recovery';
export const createPilotClient = (createClient, config) => createClient(config.url,config.key,{
 auth:{flowType:'pkce',detectSessionInUrl:false,storageKey:'restart.cloud.auth.v1'}
});

export function cloudAccount(client, onChange, guestLocale) {
 const auth = client.auth;
 let user = null;
 let store = null;
 let epoch = 0;
 let state = null;
 let recovery = false;
 let busy = false;
 let notice = '';
 let lastImport = null;
 let journalDraft = null;

 async function reload() {
  const current = epoch;
  const next = await store.read(state?.lang || guestLocale());
  if (current !== epoch) throw new Error('restart_session_changed');
  state = {...next,active:state?.active || null};
 }

 async function adopt(session, isRecovery = false) {
  const nextUser = session?.user ?? null;
  if (user?.id === nextUser?.id && recovery === isRecovery) return;
  epoch++;
  journalDraft = null;
  notice = '';
  lastImport = null;
  user = nextUser;
  recovery = isRecovery;
  store = user && !recovery ? studentStore(client,user.id) : null;
  state = null;
  if (recovery) sessionStorage.setItem(recoveryKey,user.id);
  else sessionStorage.removeItem(recoveryKey);
  onChange(true);
  if (store) {
   const current = epoch;
   try { await reload(); }
   catch { if (current === epoch) notice = 'cloudLoadFailed'; }
   if (current === epoch) onChange(true);
  }
 }

 const successMessage = {register:'cloudCheckEmail',reset:'cloudCheckEmail',password:'cloudPasswordSaved',logout:'cloudSignedOut',login:'cloudSignedIn'};
 async function action(kind, fields = {}) {
  if (busy) return false;
  busy = true;
  const redirectTo = new URL('./',location.href).href;
  try {
   let response;
   if (kind==='register') {
    response = await auth.signUp({email:fields.email,password:fields.password,options:{emailRedirectTo:redirectTo}});
   } else if (kind==='reset') {
    response = await auth.resetPasswordForEmail(fields.email,{redirectTo});
   } else if (kind==='login') {
    response = await auth.signInWithPassword({email:fields.email,password:fields.password});
   } else if (kind==='logout') {
    response = await auth.signOut({scope:'local'});
   } else if (kind==='password' && recovery) {
    response = await auth.updateUser({password:fields.password});
    if (!response.error) response = await auth.signOut({scope:'local'});
   } else return false;
   if (response.error) throw response.error;
   if (kind==='logout' || kind==='password') await adopt(null);
   else if (response.data?.session) await adopt(response.data.session);
   notice = user && !state && !recovery ? 'cloudLoadFailed' : successMessage[kind];
   return true;
  } catch {
   notice = 'cloudFailed';
   return false;
  } finally {
   busy = false;
   onChange(false);
  }
 }

 async function save(operation, ...values) {
  if (busy || !store) return false;
  const startEpoch = epoch;
  if (operation === 'saveJournal') journalDraft = {...values[0]};
  busy = true;
  try {
   const result = operation === 'refresh' ? null : await store[operation](...values);
   if (startEpoch !== epoch) return false;
   if (operation === 'import') lastImport = result;
   if (operation === 'saveJournal') journalDraft = null;
   // Acknowledged writes should not be retried just because the follow-up read failed.
   try {
    await reload();
    notice = operation==='import' ? 'cloudImported' : 'cloudSynced';
   } catch {
    if (startEpoch === epoch) {
     if (operation === 'refresh') notice = 'cloudLoadFailed';
     else {
      notice = 'cloudSavedReload';
      state = null;
     }
    }
   }
   return startEpoch === epoch && (operation !== 'refresh' || notice !== 'cloudLoadFailed');
  } catch (error) {
   if (startEpoch === epoch) {
    notice = error.message==='restart_conflict'||error.code==='23505' ? 'cloudConflict' : 'cloudFailed';
   }
   return false;
  } finally {
   busy = false;
   onChange(false);
  }
 }

 return {
  get user() {return user;}, get recovery() {return recovery;}, get state() {return state;},
  get journalDraft() {return journalDraft;},
  discardJournalDraft() {journalDraft = null;},
  get lastImport() {return lastImport;}, get notice() {return notice;}, get busy() {return busy;},
  action, save,
  async init() {
   try {
    const url = new URL(location.href);
    const code = url.searchParams.get('code');
    if (code || url.searchParams.has('error') || url.searchParams.has('error_code')) {
     const callbackError = url.searchParams.has('error') || url.searchParams.has('error_code');
     history.replaceState(null,'',url.pathname+'#account');
     if (callbackError || !code) notice = 'cloudLinkFailed';
     else {
      // Keep the SDK's PKCE flow identifier after removing callback parameters from the URL.
      const flowId = url.searchParams.get('sb_flow_id');
      const {data,error} = await auth.exchangeCodeForSession(code, flowId === null ? undefined : {flowId});
      if (error) notice = 'cloudLinkFailed';
      else await adopt(data.session,data.redirectType==='recovery');
     }
    }
    const {data,error} = await auth.getSession();
    if (error) throw error;
    await adopt(data.session,!!data.session && sessionStorage.getItem(recoveryKey)===data.session.user.id);
   } catch { notice = 'cloudFailed'; }
   finally {
    auth.onAuthStateChange((event,session)=>{
     if (event === 'INITIAL_SESSION' || event === 'USER_UPDATED') return;
     // Supabase holds its auth lock while notifying listeners.
     setTimeout(()=>void adopt(session,!!session && (event==='PASSWORD_RECOVERY' ||
      sessionStorage.getItem(recoveryKey)===session.user.id)).catch(()=>{notice='cloudFailed';onChange(false);}),0);
    });
    onChange(true);
   }
  }
 };
}
