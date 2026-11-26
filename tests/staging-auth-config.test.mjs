import assert from 'node:assert/strict';
import test from 'node:test';
import {configureStagingAuth} from '../scripts/configure-staging-auth.mjs';

function api(initial = {}) {
 let state={...initial};
 const methods=[];
 async function request(url, options) {
  assert.equal(url,'https://api.supabase.com/v1/projects/lpsudmemxqkywkpixgae/config/auth');
  assert.equal(options.redirect,'error');
  methods.push(options.method);
  if (options.method==='PATCH') state={...state,...JSON.parse(options.body)};
  return {ok:true,json:async()=>state};
 }
 return {request,methods};
}

test('Staging Auth defaults to read-only and verifies an explicit update',async()=>{
 const {request,methods}=api({smtp_pass:'fixture-sensitive'});
 const options={token:'fixture',request};
 const plan=await configureStagingAuth(options);
 assert.deepEqual(methods,['GET']);
 assert.equal(Object.hasOwn(plan.changes,'smtp_pass'),false);
 assert.equal(plan.changes.hook_before_user_created_enabled,true);
 assert.deepEqual(await configureStagingAuth({...options,apply:true}),{applied:true,changes:plan.changes});
 assert.deepEqual(methods,['GET','GET','PATCH','GET']);
 assert.deepEqual(await configureStagingAuth({...options,apply:true}),{applied:false,changes:{}});
});

test('Staging Auth refuses different hooks and additional redirect URLs',async()=>{
 for (const config of [{uri_allow_list:'https://other.example/'},{hook_before_user_created_uri:'https://other.example/'}]) {
  const {request,methods}=api(config);
  await assert.rejects(configureStagingAuth({token:'fixture',apply:true,request}),/already has/);
  assert.deepEqual(methods,['GET']);
 }
});
