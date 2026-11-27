import test from 'node:test';
import assert from 'node:assert/strict';
import {registrationName,registrationDetails,cloudAccount} from '../app/cloud-auth.mjs';
import {admissionDefaultName} from '../app/retreat-admission-request.mjs';

test('Participant registration captures both names without weakening approval',()=>{
 assert.equal(registrationName({firstName:' Elxan ',lastName:' Gülmalıyev '}),'Elxan Gülmalıyev');
 assert.equal(registrationName({firstName:'Elxan'}),null);
 assert.equal(registrationName({firstName:'A\nB',lastName:'C'}),null);
 assert.equal(admissionDefaultName({full_name:'Elxan Gülmalıyev'}),'Elxan Gülmalıyev');
 assert.equal(admissionDefaultName({full_name:123}),'');
 assert.equal(admissionDefaultName({full_name:'a'.repeat(161)}),'');
});

test('Registration requires matching valid passwords and explicit consent, with gender optional',async()=>{
 const values={firstName:'Test',lastName:'Participant',email:'pilot@example.invalid',
  password:'fixture-password',passwordConfirmation:'fixture-password',registrationConsent:'yes'};
 assert.equal(registrationDetails({...values,passwordConfirmation:'mismatch'}).notice,'cloudPasswordMismatch');
 assert.equal(registrationDetails({...values,registrationConsent:''}).notice,'cloudRegistrationConsentRequired');
 assert.equal(registrationDetails({...values,password:'😀'.repeat(20),passwordConfirmation:'😀'.repeat(20)}).notice,'cloudRegistrationPassword');
 assert.equal(registrationDetails({...values,gender:'unexpected'}).notice,'cloudRegistrationPreferenceInvalid');
 const included={full_name:'Test Participant',registration_data_consent_version:1};
 assert.deepEqual(registrationDetails({...values,gender:'prefer_not_to_say'}),{data:included});
 assert.deepEqual(registrationDetails({...values,gender:'woman'}),{data:{...included,gender_preference:'woman'}});

 const previous=globalThis.location;
 const calls=[];
 globalThis.location={href:'https://fixture.example/app/#account/register'};
 try {
  const account=cloudAccount({auth:{signUp:async payload=>{calls.push(payload);return {data:{session:null}};}}},()=>{},()=> 'en');
  assert.equal(await account.action('register',{...values,registrationConsent:''}),false);
  assert.equal(account.notice,'cloudRegistrationConsentRequired');
  assert.equal(await account.action('register',{...values,passwordConfirmation:'mismatch'}),false);
  assert.equal(calls.length,0);
  assert.equal(await account.action('register',values),true);
  assert.deepEqual(calls,[{email:values.email,password:values.password,options:{
   emailRedirectTo:'https://fixture.example/app/',data:included
  }}]);
 } finally {globalThis.location=previous;}
});
