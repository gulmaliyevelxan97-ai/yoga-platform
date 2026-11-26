import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRetreatCard,renderRetreatExperience} from '../app/retreat-experience.mjs';

test('Retreat introduction links to public practices without cloud routes or invented dates',()=>{
 for (const lang of ['ru','az','en']) {
  assert.match(renderRetreatCard(lang),/href="#retreat".*RESTART RETREAT/);
  const view=renderRetreatExperience(lang,{intention:'<form id="retreat-intention-form"></form>'});
  assert.match(view,/<h1>RESTART RETREAT<\/h1>/);
  assert.match(view,/WHITE &amp; BLACK EXPERIENCE/);
  assert.match(view,/href="#practice\/breathing"/);
  assert.match(view,/href="#practice\/meditation"/);
  assert.match(view,/id="retreat-intention-form"/);
  assert.doesNotMatch(view,/href="#retreat-(programme|forms|tasks|connect)"|<time[ >]/);
 }
});
test('Authenticated retreat links lead to existing enrolment-scoped screens',()=>{
 const view=renderRetreatExperience('en',{signedIn:true});
 for (const route of ['programme','forms','tasks','connect']) assert.match(view,new RegExp('href="#retreat-'+route+'"'));
 assert.doesNotMatch(view,/retreat-intention-form/);
});
