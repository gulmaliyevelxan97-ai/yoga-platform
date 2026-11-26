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
let groupCreated=false;

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
 step='seed isolated cohort';
 ok(await admin.from('restart_retreat_cohorts').insert({id:fixture,title:'Synthetic QA '+fixture,admission_open:true}));
 groupCreated=true;
 ok(await admin.from('restart_retreat_members').insert({cohort_id:fixture,user_id:mentor.id,role:'mentor'}));

 step='open three independent sessions';
 const m=await signIn(mentor);
 let p=await signIn(participant);
 const o=await signIn(outsider);
 step='submit, approve and publish';
 const request=ok(await p.rpc('restart_submit_retreat_admission',{p_cohort_id:fixture,p_full_name:'Synthetic participant'}));
 const ownRequest=ok(await p.from('restart_retreat_admissions').select('status').eq('id',request).single());
 if (ownRequest.status!=='pending') throw new Error('Approval must be pending');
 if (ok(await o.from('restart_retreat_admissions').select('id').eq('id',request)).length!==0) throw new Error('Outsider saw admission');
 ok(await m.rpc('restart_approve_retreat_admission',{p_request_id:request}));
 const event=ok(await m.rpc('restart_save_retreat_programme_item',{
  p_cohort_id:fixture,p_item_id:null,p_expected_revision:null,p_title:'Synthetic event',
  p_description:'',p_starts_at:'2026-11-29T10:00:00+04:00',p_ends_at:null
 }));
 ok(await m.rpc('restart_publish_retreat_programme_item',{
  p_cohort_id:fixture,p_item_id:event.id,p_expected_revision:event.revision
 }));
 step='sign out and read programme from a new client';
 ok(await p.auth.signOut());
 p=await signIn(participant);
 const selectEvent=client=>client.from('restart_retreat_programme_items').select('id').eq('id',event.id);
 if (ok(await selectEvent(p)).length!==1 || ok(await selectEvent(o)).length!==0) throw new Error('Publication visibility mismatch');
 step='sync a direct message from another session';
 const message=ok(await m.rpc('restart_send_retreat_message',{
  p_cohort_id:fixture,p_recipient_id:participant.id,p_body:'Synthetic QA message'
 }));
 if (ok(await p.rpc('restart_retreat_unread_count',{p_cohort_id:fixture}))!==1) {
  throw new Error('Unread message was not visible');
 }
 if (ok(await o.from('restart_retreat_messages').select('id').eq('id',message)).length!==0) {
  throw new Error('Outsider saw a direct message');
 }
 ok(await p.rpc('restart_mark_retreat_message_read',{p_message_id:message}));
 const secondDevice=await signIn(participant);
 if (ok(await secondDevice.rpc('restart_retreat_unread_count',{p_cohort_id:fixture}))!==0) {
  throw new Error('Read receipt did not sync');
 }
 console.log('Password sign-in, approval, publication, repeat sign-in, outsider isolation and receipt sync passed.');
} catch (error) {
 console.error('Staging smoke stopped at '+step+': '+(error instanceof Error && error.message.startsWith('Supabase rejected') ? error.message : 'unexpected test failure'));
 process.exitCode=1;
} finally {
 if (groupCreated) {
  const result=await admin.from('restart_retreat_cohorts').delete().eq('id',fixture);
  if (result.error) {console.error('Synthetic cohort cleanup requires attention: '+fixture);process.exitCode=1;}
 }
 for (const id of users) {
  const result=await admin.auth.admin.deleteUser(id);
  if (result.error) {console.error('Synthetic account cleanup requires attention: '+id);process.exitCode=1;}
 }
}
