import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRetreatCard,renderRetreatExperience,retreatSection} from '../app/retreat-experience.mjs';

test('Guest retreat sections provide useful preparation without cloud links or invented dates',()=>{
 const sections=['programme','preparation','intention','mentor','after'];
 for (const lang of ['ru','az','en']) {
  assert.match(renderRetreatCard(lang),/href="#retreat".*RESTART RETREAT/);
  const overview=renderRetreatExperience(lang);
  assert.match(overview,/<h1>RESTART RETREAT<\/h1>/);
  assert.match(overview,/WHITE &amp; BLACK EXPERIENCE/);
  for (const section of sections) {
   assert.match(overview,new RegExp('href="#retreat/'+section+'"'));
   const view=renderRetreatExperience(lang,{section,intention:'<form id="retreat-intention-form"></form>'});
   assert.match(view,new RegExp('href="#retreat/'+section+'" aria-current="page"'));
   assert.doesNotMatch(view,/href="#retreat-(programme|forms|tasks|connect)"|<time[ >]/);
   if (section==='preparation') assert.match(view,/href="#practice\/breathing".*href="#practice\/meditation"/);
   if (section==='intention') assert.match(view,/id="retreat-intention-form"/);
  }
 }
 assert.equal(retreatSection('__proto__'),'');
});

test('Authenticated retreat links lead to existing enrolment-scoped screens',()=>{
 for (const [section,routes] of Object.entries({programme:['programme'],intention:['forms'],mentor:['tasks','connect']})) {
  const view=renderRetreatExperience('en',{section,signedIn:true});
  for (const route of routes) assert.match(view,new RegExp('href="#retreat-'+route+'"'));
  assert.doesNotMatch(view,/retreat-intention-form/);
 }
});

test('The journey links all six stages and lets guests return to a local letter',()=>{
 for (const lang of ['ru','az','en']) {
  const html=renderRetreatExperience(lang);
  const journey=html.split('class="retreat-journey"')[1].split('</div>')[0];
  assert.equal((journey.match(/<li>/g)||[]).length,6);
  assert.match(journey,/#retreat\/letter/);
  assert.match(html,/<details class="retreat-white">/);
  assert.match(html,/<details class="retreat-black">/);
  assert.match(renderRetreatExperience(lang,{section:'after'}),/#retreat\/intention/);
 }
 assert.match(renderRetreatExperience('en',{signedIn:true}),/id="retreat-event-details-outlet"/);
 assert.doesNotMatch(renderRetreatExperience('en'),/id="retreat-event-details-outlet"/);
});
