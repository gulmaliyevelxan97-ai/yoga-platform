import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {cloudAccount,createPilotClient} from '../app/cloud-auth.mjs';

for (const appendFlowId of [false,true]) {
 test(`Supabase SDK confirms email and recovers password with flow ID set to ${appendFlowId}`, async()=>{
  const url='https://pilot.example.invalid/app/';
  const accountId='79529faa-6a8f-462b-8be8-94d65d433974';
  const user={id:accountId,email:'learner@example.invalid',email_confirmed_at:'2026-11-20T10:00:00Z'};
  const previous={location:globalThis.location,history:globalThis.history,sessionStorage:globalThis.sessionStorage};
  const memory=new Map();
  const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
  const requests=[];
  let reads=0;
  const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  const client=createPilotClient((host,key,options)=>createClient(host,key,{
   auth:{...options.auth,storage,autoRefreshToken:false,experimental:{appendPkceFlowIdToRedirects:appendFlowId}},
   global:{fetch:async(input,init)=>{
    const endpoint=new URL(input.url||input);
    const body=JSON.parse(init?.body||'null');
    if(endpoint.pathname.startsWith('/rest/v1/')) {reads++;return response([]);}
    requests.push({endpoint,body});
    if(['/auth/v1/signup','/auth/v1/recover'].includes(endpoint.pathname)) return response(user);
    if(endpoint.pathname==='/auth/v1/logout') return response({});
    if(endpoint.pathname==='/auth/v1/user') return response(user);
    assert.equal(endpoint.pathname,'/auth/v1/token');
    return response({access_token:'test-token',refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user});
   }}
  }),{url:'https://fixture.supabase.co',key:'fixture-publishable'});
  const setup=()=>cloudAccount(client,()=>{},()=> 'ru');
  globalThis.location={href:url};
  globalThis.sessionStorage=storage;
  globalThis.history={replaceState:(_a,_b,path)=>{globalThis.location.href=new URL(path,url).href;}};
  try {
   const guest=setup();
   assert.equal(await guest.action('register',{email:user.email,password:'fixture-pass-one'}),true);
   assert.equal(guest.user,null);
   for(const kind of ['confirmation','recovery']){
    if(kind==='recovery') assert.equal(await guest.action('reset',{email:user.email}),true);
    const callback=new URL(requests.at(-1).endpoint.searchParams.get('redirect_to'));
    assert.equal(callback.origin+callback.pathname,url);
    assert.equal(callback.searchParams.has('sb_flow_id'),appendFlowId);
    callback.searchParams.set('code',kind);
    globalThis.location.href=callback.href;
    const before=reads;
    const account=setup();
    await account.init();
    assert.equal(account.user?.id,accountId);
    assert.equal(globalThis.location.href,url+'#account');
    assert.equal(account.recovery,kind==='recovery');
    assert.ok(requests.at(-1).body.code_verifier);
    assert.equal(requests.at(-1).body.auth_code,kind);
    if(kind==='recovery'){
     assert.equal(reads,before);
     assert.equal(await account.action('password',{password:'fixture-pass-two'}),true);
     assert.equal(account.user,null);
    }else{
     assert.ok(reads>before);
     assert.equal(await account.action('logout'),true);
    }
   }
   assert.equal(await guest.action('login',{email:user.email,password:'fixture-pass-two'}),true);
   assert.equal(guest.user?.id,accountId);
   assert.equal(requests.at(-1).endpoint.searchParams.get('grant_type'),'password');
  }finally{
   await new Promise(resolve=>setTimeout(resolve,10));
   Object.assign(globalThis,previous);
  }
 });
}
