import {randomBytes,randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

const url='https://lpsudmemxqkywkpixgae.supabase.co';
const serviceKey=process.env.RESTART_STAGING_SERVICE_KEY;
const publicKey=process.env.RESTART_STAGING_PUBLISHABLE_KEY;

if (!process.argv.includes('--execute') || !serviceKey || !publicKey) {
 console.error('Use --execute with staging credentials in the environment. No test accounts were created.');
 process.exit(2);
}
const options={auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}};
const admin=createClient(url,serviceKey,options);
const fixture=randomUUID();
const users=[];
let step='setup';
let cohortId;

function ok(result) {
 if (result.error) throw new Error('Supabase rejected the request' +
  (result.error.code ? ' ('+result.error.code+')' : ''));
 return result.data;
}

async function testAccount(role) {
 step='create '+role+' fixture';
 const email='restart-qa-'+fixture+'-'+role+'@example.com';
 const password=randomBytes(24).toString('base64url');
 const {user}=ok(await admin.auth.admin.createUser({email,password,email_confirm:true}));
 users.push(user.id);
 return {id:user.id,email,password};
}

async function signIn(account) {
 const client=createClient(url,publicKey,options);
 const {session}=ok(await client.auth.signInWithPassword({
  email:account.email,password:account.password
 }));
 if (session?.user.id!==account.id) throw new Error('Unexpected test identity');
 return client;
}

try {
 const mentor=await testAccount('mentor');
 const participant=await testAccount('participant');
 const outsider=await testAccount('outsider');
 step='assign synthetic founder role and open three independent sessions';
 ok(await admin.from('restart_school_roles').insert({user_id:mentor.id,role:'owner'}));
 const m=await signIn(mentor);
 let p=await signIn(participant);
 const o=await signIn(outsider);
 step='create retreat through the founder session';
 if ((await p.rpc('restart_create_retreat',{p_title:'Forbidden'})).error?.code!=='42501') {
  throw new Error('Participant could create a retreat');
 }
 cohortId=ok(await m.rpc('restart_create_retreat',{p_title:'Synthetic QA '+fixture}));
 ok(await admin.from('restart_retreat_cohorts').update({admission_open:true}).eq('id',cohortId));
 step='submit, approve and publish';
 const request=ok(await p.rpc('restart_submit_retreat_admission',{p_cohort_id:cohortId,p_full_name:'Synthetic participant'}));
 const ownRequest=ok(await p.from('restart_retreat_admissions').select('status').eq('id',request).single());
 if (ownRequest.status!=='pending') throw new Error('Approval must be pending');
 if (ok(await o.from('restart_retreat_admissions').select('id').eq('id',request)).length!==0) throw new Error('Outsider saw admission');
 ok(await m.rpc('restart_approve_retreat_admission',{p_request_id:request}));
 const event=ok(await m.rpc('restart_save_retreat_programme_item',{
  p_cohort_id:cohortId,p_item_id:null,p_expected_revision:null,p_title:'Synthetic event',
  p_description:'',p_starts_at:'2026-11-29T10:00:00+04:00',p_ends_at:null
 }));
 ok(await m.rpc('restart_publish_retreat_programme_item',{
  p_cohort_id:cohortId,p_item_id:event.id,p_expected_revision:event.revision
 }));
 step='approve the second participant';
 const second=ok(await o.rpc('restart_submit_retreat_admission',{p_cohort_id:cohortId,p_full_name:'Synthetic participant two'}));
 ok(await m.rpc('restart_approve_retreat_admission',{p_request_id:second}));
 step='sign out and read programme from a new client';
 ok(await p.auth.signOut());
 p=await signIn(participant);
 const selectEvent=client=>client.from('restart_retreat_programme_items').select('id').eq('id',event.id);
 if (ok(await selectEvent(p)).length!==1 || ok(await selectEvent(o)).length!==1) throw new Error('Publication visibility mismatch');
 step='sync a direct message from another session';
 const message=ok(await m.rpc('restart_send_retreat_message',{
  p_cohort_id:cohortId,p_recipient_id:participant.id,p_body:'Synthetic QA message'
 }));
 if (ok(await p.rpc('restart_retreat_unread_count',{p_cohort_id:cohortId}))!==1) {
  throw new Error('Unread message was not visible');
 }
 if (ok(await o.from('restart_retreat_messages').select('id').eq('id',message)).length!==0) {
  throw new Error('Another approved participant saw a direct message');
 }
 ok(await p.rpc('restart_mark_retreat_message_read',{p_message_id:message}));
 const secondDevice=await signIn(participant);
 if (ok(await secondDevice.rpc('restart_retreat_unread_count',{p_cohort_id:cohortId}))!==0) {
  throw new Error('Read receipt did not sync');
 }
 console.log('Founder creation, password sign-in, approval, publication, repeat sign-in, message isolation and receipt sync passed.');
} catch (error) {
 console.error('Staging smoke stopped at '+step+': '+(error instanceof Error && error.message.startsWith('Supabase rejected') ? error.message : 'unexpected test failure'));
 process.exitCode=1;
} finally {
 if (cohortId) {
  const result=await admin.from('restart_retreat_cohorts').delete().eq('id',cohortId);
  if (result.error) {console.error('Synthetic cohort cleanup requires attention: '+cohortId);process.exitCode=1;}
 }
 for (const id of users) {
  const result=await admin.auth.admin.deleteUser(id);
  if (result.error) {console.error('Synthetic account cleanup requires attention: '+id);process.exitCode=1;}
 }
}
