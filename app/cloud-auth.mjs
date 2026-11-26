import {studentStore} from './cloud-data.mjs';
import {catalog} from './content.mjs';

const recoveryKey = 'restart.cloud.recovery';
const activePracticeKey = 'restart.cloud.practice.pending.v1';
const journalDraftKey = 'restart.cloud.journal.pending.v1';
export const createPilotClient = (createClient, config) => createClient(config.url,config.key,{
 auth:{flowType:'pkce',detectSessionInUrl:false,storageKey:'restart.cloud.auth.v1'}
});

function authNotice(error, kind) {
 if (error?.status === 429) return 'cloudRateLimited';
 if (kind === 'login' && error?.code === 'invalid_credentials') return 'cloudLoginInvalid';
 if (kind === 'login' && error?.code === 'email_not_confirmed') return 'cloudConfirmEmail';
 if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError) return 'cloudConnection';
 return 'cloudFailed';
}

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
 let activePractice = null;

 function setActivePractice(active) {
  if (!store) return;
  activePractice = active;
  if (state) state.active = active;
  try {
   if (active) sessionStorage.setItem(activePracticeKey,JSON.stringify({owner:user.id,active}));
   else sessionStorage.removeItem(activePracticeKey);
  } catch {
   // The timer can continue in memory when session storage is unavailable.
  }
 }

 function restoreActivePractice() {
  try {
   const saved = JSON.parse(sessionStorage.getItem(activePracticeKey));
   const active = saved?.active;
   if (store && user.id===saved?.owner && catalog.some(item=>item.id===active?.id) &&
       typeof active.sessionId==='string' && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(active.sessionId) &&
       Number.isSafeInteger(active.accumulated) && active.accumulated>=0 &&
       (active.startedAt===null || (Number.isSafeInteger(active.startedAt) && active.startedAt>=0))) return active;
   sessionStorage.removeItem(activePracticeKey);
  } catch {}
  return null;
 }

 function setJournalDraft(entry) {
  journalDraft = entry;
  try {
   if (entry) sessionStorage.setItem(journalDraftKey,JSON.stringify({owner:user.id,entry}));
   else sessionStorage.removeItem(journalDraftKey);
  } catch {
   // A restricted browser still keeps the pending draft in memory.
  }
 }

 function restoreJournalDraft() {
  try {
   const saved = JSON.parse(sessionStorage.getItem(journalDraftKey));
   if (user && !recovery && saved?.owner===user.id &&
       typeof saved.entry?.id==='string' && typeof saved.entry?.date==='string') return saved.entry;
   sessionStorage.removeItem(journalDraftKey);
  } catch {}
  return null;
 }

 async function reload() {
  const current = epoch;
  const next = await store.read(state?.lang || guestLocale());
  if (current !== epoch) throw new Error('restart_session_changed');
  if (activePractice && next.sessions.some(session=>session.id===activePractice.sessionId)) setActivePractice(null);
  state = {...next,active:activePractice};
 }

 async function adopt(session, isRecovery = false) {
  const nextUser = session?.user ?? null;
  if (user?.id === nextUser?.id && recovery === isRecovery) {
   user = nextUser;
   if (!user) {
    setJournalDraft(null);
    restoreActivePractice();
   }
   return;
  }
  epoch++;
  notice = '';
  lastImport = null;
  user = nextUser;
  recovery = isRecovery;
  store = user && !recovery ? studentStore(client,user.id) : null;
  journalDraft = restoreJournalDraft();
  activePractice = restoreActivePractice();
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
  } catch (error) {
   notice = authNotice(error,kind);
   return false;
  } finally {
   busy = false;
   onChange(false);
  }
 }

 async function save(operation, ...values) {
  if (busy || !store) return false;
  const startEpoch = epoch;
  if (operation === 'saveJournal') setJournalDraft({...values[0]});
  busy = true;
  try {
   const result = operation === 'refresh' ? null : await store[operation](...values);
   if (startEpoch !== epoch) return false;
   if (operation === 'import') lastImport = result;
   if (operation === 'saveJournal') setJournalDraft(null);
   if (operation === 'complete' && values[0]?.id===activePractice?.sessionId) setActivePractice(null);
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
  discardJournalDraft() {setJournalDraft(null);},
  get lastImport() {return lastImport;}, get notice() {return notice;}, get busy() {return busy;},
  action, save, setActivePractice,
  async init() {
   try {
    const url = new URL(location.href);
    const code = url.searchParams.get('code');
    const fragment = new URLSearchParams(url.hash.slice(1));
    const callbackError = [url.searchParams,fragment].some(params=>
     params.has('error') || params.has('error_code') || params.has('access_token') || params.has('refresh_token'));
    let linkFailed = false;
    if (url.searchParams.has('code') || callbackError) {
     history.replaceState(null,'',url.pathname+'#account');
     if (callbackError || !code) linkFailed = true;
     else {
      // Keep the SDK's PKCE flow identifier after removing callback parameters from the URL.
      const flowId = url.searchParams.get('sb_flow_id');
      const {data,error} = await auth.exchangeCodeForSession(code, flowId === null ? undefined : {flowId});
      if (error) linkFailed = true;
      else await adopt(data.session,data.redirectType==='recovery');
     }
    }
    const {data,error} = await auth.getSession();
    if (error) throw error;
    await adopt(data.session,!!data.session && sessionStorage.getItem(recoveryKey)===data.session.user.id);
    if (linkFailed) notice = 'cloudLinkFailed';
   } catch { notice = 'cloudFailed'; }
   finally {
    auth.onAuthStateChange((event,session)=>{
     // INITIAL_SESSION reconciles changes between getSession() and subscription.
     // Supabase holds its auth lock while notifying listeners.
     setTimeout(()=>void adopt(session,!!session && (event==='PASSWORD_RECOVERY' ||
      sessionStorage.getItem(recoveryKey)===session.user.id)).catch(()=>{notice='cloudFailed';onChange(false);}),0);
    });
    onChange(true);
   }
  }
 };
}
