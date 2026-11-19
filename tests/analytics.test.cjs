const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'../releases/navigation/analytics.js'),'utf8');
const id = 'G-TESTONLY123';

function loadAnalytics({configured = true, stored = null} = {}) {
 const callbacks = {};
 const loaded = [];
 const timers = [];
 const settings = {dataset:{},querySelector:()=>({}),addEventListener:(_,fn)=>{callbacks.choice = fn}};
 const location = new URL('https://example.test/yoga-platform/about.html?email=private@example.test#ph-body');
 const document = {
  body:{dataset:{page:'about'}},documentElement:{lang:'ru'},
  referrer:'https://example.org/private?phone=123',
  querySelector(selector){return selector==='[data-school-footer]'?{after(){}}:null},
  createElement(tag){return tag==='details'?settings:{}},
  head:{append(script){loaded.push(script.src)}},
  addEventListener(name,fn){callbacks[name]=fn}
 };
 const window = {addEventListener(name,fn){callbacks[name]=fn}};
 const localStorage = {getItem(){return stored},setItem(_,value){stored=value}};
 class IntersectionObserver {
  constructor(callback){callbacks.intersect=callback}
  observe(){}
  disconnect(){}
 }
 vm.runInNewContext(source.replace(/const measurementId = '[^']*';/,"const measurementId = '"+(configured?id:"")+"';"),{
  document,location,window,localStorage,IntersectionObserver,URL,setTimeout:fn=>timers.push(fn)
 });
 const events = () => Array.from(window.dataLayer||[]).filter(item=>item[0]==='event');
 const choose = value => callbacks.choice({target:{closest:()=>({dataset:{choice:value}})}});
 function click(selector,value) {
  callbacks.click({isTrusted:true,target:{closest:key=>key===selector?value:null}});
 }
 return {callbacks,loaded,window,events,choose,click,flush(){while(timers.length) timers.shift()()}};
}

test('Analytics makes no external request until configured and explicitly accepted', () => {
 const inactive = loadAnalytics({configured:false,stored:'yes'});
 assert.deepEqual(inactive.loaded,[]);
 const visitor = loadAnalytics();
 assert.deepEqual(visitor.loaded,[]);
 assert.equal(visitor.events().length,0);
 visitor.choose('no');
 assert.deepEqual(visitor.loaded,[]);
 visitor.choose('yes');
 visitor.choose('yes');
 assert.equal(visitor.loaded.length,1);
 visitor.choose('no');
 visitor.choose('yes');
 assert.equal(visitor.loaded.length,1);
 assert.deepEqual(visitor.events().map(event=>event[1]),['page_view','about_open']);
 const config = Array.from(visitor.window.dataLayer).find(command=>command[0]==='config')[2];
 assert.equal(config.send_page_view,false);
 assert.equal(config.allow_google_signals,false);
 assert.equal(config.allow_ad_personalization_signals,false);
 assert.equal(config.page_location,'https://example.test/yoga-platform/about.html');
 assert.equal(config.page_referrer,'https://example.org');
});

test('Programme visibility, outbound and booking events are explicit and stop after opt-out', () => {
 const visitor = loadAnalytics({stored:'yes'});
 visitor.callbacks.hashchange();
 visitor.callbacks.intersect([{isIntersecting:true,intersectionRatio:0.1}]);
 visitor.callbacks.intersect([{isIntersecting:true,intersectionRatio:0.5}]);
 visitor.callbacks.intersect([{isIntersecting:true,intersectionRatio:0.5}]);
 visitor.click('a[href]',{href:'https://www.instagram.com/reel/sample/?private=1'});
 visitor.click('a[href]',{href:'https://example.test/yoga-platform/participation.html'});
 visitor.click('a[href]',{href:'mailto:private@example.test'});
 visitor.click('a[href]',{href:'https://example.test/yoga-platform/about.html#about-directions'});
 visitor.choose('no');
 visitor.click('a[href]',{href:'https://t.me/example'});
 assert.equal(visitor.window['ga-disable-'+id],true);
 assert.deepEqual(visitor.events().map(event=>event[1]),['page_view','about_open','programme_overview_view','social_click','booking_click','contact_click','section_open']);
 assert.doesNotMatch(JSON.stringify(visitor.events()),/private|@|phone/);
});

test('Only a user opening a philosophy card sends its allowlisted direction', () => {
 const visitor=loadAnalytics({stored:'yes'});
 for (const direction of ['mind','body','nutrition','life']) {
  const details={id:'ph-'+direction,open:false,isConnected:true};
  const summary={parentElement:details};
  const target={closest:key=>key==='.about-direction summary'?summary:null};
  visitor.callbacks.click({isTrusted:false,target});
  visitor.click('.about-direction summary',summary);
  details.open=true;
  visitor.flush();
  visitor.click('.about-direction summary',summary);
  details.open=false;
  visitor.flush();
 }
 const openings=visitor.events().filter(event=>event[1]==='philosophy_card_open');
 assert.deepEqual(openings.map(event=>event[2].direction),['mind','body','nutrition','life']);
});
