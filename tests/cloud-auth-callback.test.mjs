import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cloudAccount} from '../app/cloud-auth.mjs';
import {cloudStrings} from '../app/cloud-copy.mjs';

test('Failed email links are removed from the URL and private SDK messages stay out of the UI',async()=>{
 const saved={location:globalThis.location,history:globalThis.history,sessionStorage:globalThis.sessionStorage};
 const clean=[];
 globalThis.location={href:'https://example.invalid/yoga-platform/app/#error=access_denied&error_code=otp_expired'};
 globalThis.history={replaceState:(_state,_title,path)=>clean.push(path)};
 globalThis.sessionStorage={getItem:()=>null,removeItem(){}};
 let failure;
 const auth={getSession:async()=>({data:{session:null}}),onAuthStateChange(){},
  async signInWithPassword(){return {error:{...failure,message:'internal detail'}}}};
 try{
  const account=cloudAccount({auth},()=>{},()=> 'ru');
  await account.init();
  assert.deepEqual(clean,['/yoga-platform/app/#account']);
  assert.equal(account.notice,'cloudLinkFailed');
  for (const [error,expected] of [
   [{code:'invalid_credentials'},'cloudLoginInvalid'],[{code:'email_not_confirmed'},'cloudConfirmEmail'],
   [{status:429},'cloudRateLimited'],[{name:'AuthRetryableFetchError'},'cloudConnection']
  ]) {
   failure=error;
   assert.equal(await account.action('login',{email:'test@example.invalid',password:'fixture'}),false);
   assert.equal(account.notice,expected);
   assert.equal(cloudStrings[expected].length,3);
  }
 }finally{Object.assign(globalThis,saved)}
});
