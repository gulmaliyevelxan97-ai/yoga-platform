import test from 'node:test';
import assert from 'node:assert/strict';
import {configureStagingRecovery} from '../scripts/configure-staging-recovery.mjs';

const publicUrl='https://gulmaliyevelxan97-ai.github.io/restart-2-pilot/participants/';
const founderUrl='https://restart-retreat-founder-staging.brawnymarch5.chatgpt.site/app/';

test('Recovery change is staging-only, narrowly patched, verified and idempotent',async()=>{
 const state={site_url:publicUrl,uri_allow_list:founderUrl+','+publicUrl,smtp_pass:'fixture-only'};
 const calls=[];
 const request=async (url,options)=>{
  assert.equal(url,'https://api.supabase.com/v1/projects/lpsudmemxqkywkpixgae/config/auth');
  calls.push(options.method);
  if(options.method==='PATCH'){
   const patch=JSON.parse(options.body);
   assert.deepEqual(Object.keys(patch).sort(),['mailer_subjects_recovery','mailer_templates_recovery_content']);
   assert.match(patch.mailer_templates_recovery_content,/\{\{ \.Token \}\}/);
   assert.doesNotMatch(patch.mailer_templates_recovery_content,/ConfirmationURL|TokenHash/);
   Object.assign(state,patch);
  }
  return {ok:true,json:async()=>({...state})};
 };
 const dry=await configureStagingRecovery({token:'fixture',request});
 assert.equal(dry.applied,false);
 assert.deepEqual(calls,['GET']);
 assert.equal(await configureStagingRecovery({token:'fixture',apply:true,request}).then(x=>x.applied),true);
 assert.equal(await configureStagingRecovery({token:'fixture',apply:true,request}).then(x=>x.applied),false);
 assert.deepEqual(calls,['GET','GET','PATCH','GET','GET']);
 assert.equal(state.smtp_pass,'fixture-only');
});

test('Missing credentials or a callback mismatch cannot change the template',async()=>{
 await assert.rejects(configureStagingRecovery({apply:true,request:()=>assert.fail()}),/token/);
 await assert.rejects(configureStagingRecovery({token:'fixture',apply:true,request:async (_,options)=>{
  assert.equal(options.method,'GET');
  return {ok:true,json:async()=>({site_url:founderUrl,uri_allow_list:founderUrl})};
 }}),/Redirect URL/);
});
