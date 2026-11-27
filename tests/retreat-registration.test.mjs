import test from 'node:test';
import assert from 'node:assert/strict';
import {registrationName} from '../app/cloud-auth.mjs';
import {admissionDefaultName} from '../app/retreat-admission-request.mjs';

test('Participant registration captures both names without weakening approval',()=>{
 assert.equal(registrationName({firstName:' Elxan ',lastName:' Gülmalıyev '}),'Elxan Gülmalıyev');
 assert.equal(registrationName({firstName:'Elxan'}),null);
 assert.equal(registrationName({firstName:'A\nB',lastName:'C'}),null);
 assert.equal(admissionDefaultName({full_name:'Elxan Gülmalıyev'}),'Elxan Gülmalıyev');
 assert.equal(admissionDefaultName({full_name:123}),'');
 assert.equal(admissionDefaultName({full_name:'a'.repeat(161)}),'');
});
