import assert from 'node:assert/strict';
import {test} from 'node:test';
import {adjacentSwipeTab,enableTabSwipe} from '../app/swipe-navigation.mjs';

const tabs = ['today','practices','academy','path','profile'];
const start = {x:190,y:200};
const viewport = {width:360,duration:200};

test('A deliberate horizontal swipe moves one adjacent tab and never wraps',()=>{
 assert.equal(adjacentSwipeTab(tabs,'practices',start,{x:100,y:210},viewport),'academy');
 assert.equal(adjacentSwipeTab(tabs,'practices',start,{x:290,y:210},viewport),'today');
 assert.equal(adjacentSwipeTab(tabs,'today',start,{x:290,y:210},viewport),null);
 assert.equal(adjacentSwipeTab(tabs,'profile',start,{x:100,y:210},viewport),null);
 assert.equal(adjacentSwipeTab(tabs,'journal',start,{x:100,y:210},viewport),null);
});

test('Short, slow, edge and diagonal gestures do not navigate',()=>{
 for (const [from,to,options] of [
  [start,{x:135,y:200},viewport],
  [start,{x:95,y:200},{...viewport,duration:701}],
  [{x:350,y:200},{x:110,y:200},viewport],
  [start,{x:16,y:200},viewport],
  [start,{x:110,y:250},viewport]
 ]) assert.equal(adjacentSwipeTab(tabs,'practices',from,to,options),null);
});

test('Passive listeners ignore controls, route changes, selection, scroll, cancellation and extra fingers',()=>{
 const original = {window:globalThis.window,document:globalThis.document};
 const events = {};
 const calls = [];
 let route = 'practices';
 const selection = {isCollapsed:true};
 globalThis.window = {scrollY:120,getSelection:()=>selection};
 globalThis.document = {documentElement:{clientWidth:360}};
 const screen = {addEventListener(name,fn,options){assert.equal(options.passive,true);events[name]=fn;}};
 const touch=(clientX,clientY,identifier=1)=>({clientX,clientY,identifier});
 const begin=(block=false)=>events.touchstart({touches:[touch(190,200)],target:{closest:()=>block},timeStamp:100});
 const end=()=>events.touchend({touches:[],changedTouches:[touch(90,210)],timeStamp:240});
 try {
  enableTabSwipe(screen,tabs,()=>route,(...args)=>calls.push(args));
  begin(true);end();
  begin();route='academy';end();route='practices';
  begin();selection.isCollapsed=false;end();selection.isCollapsed=true;
  begin();window.scrollY=140;end();window.scrollY=120;
  begin();events.touchcancel();end();
  begin();events.touchmove({touches:[touch(190,260)]});end();
  begin();events.touchmove({touches:[touch(190,200),touch(250,200,2)]});end();
  assert.deepEqual(calls,[]);
  begin();end();
  assert.deepEqual(calls,[['practices','academy',120]]);
 } finally {Object.assign(globalThis,original);}
});
