const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

const read = file => readFileSync(new URL('../' + file, 'file://' + __filename), 'utf8');
const script = read('releases/navigation/motion.js');

function mount(page, nodes, session = new Map(), reducedMotion = false) {
 const bodyClasses = new Set();
 const view = { querySelectorAll: () => nodes };
 const motion = { matches: !reducedMotion };
 let observer;
 let render;
 class IntersectionObserver {
  constructor(callback) {
   this.callback = callback;
   this.targets = new Set();
   observer = this;
  }
  observe(node) { this.targets.add(node); }
  unobserve(node) { this.targets.delete(node); }
  disconnect() { this.targets.clear(); }
 }
 const document = {
  body: { dataset: { page }, classList: bodyClasses },
  getElementById: () => view
 };
 runInNewContext(script, {
  document, matchMedia: () => motion, window: { IntersectionObserver }, IntersectionObserver,
  sessionStorage: { getItem: id => session.get(id), setItem: (id, value) => session.set(id, value) },
  MutationObserver: class { constructor(callback) { render = callback; } observe() {} }
 });
 return { bodyClasses, observer, render, motion };
}

test('Home introduction runs once per session and honors reduced motion', () => {
 const session = new Map();
 assert(!mount('home', [], session, true).bodyClasses.has('motion-home-intro'));
 assert(mount('home', [], session).bodyClasses.has('motion-home-intro'));
 assert(!mount('home', [], session).bodyClasses.has('motion-home-intro'));
 assert.match(read('index.html'), /id="home-actions"><a class="cta" href="\.\/my-path\.html"/);
});

test('Scroll animation adds a class only on intersection and does not replay after a translation', () => {
 const makeNode = () => ({ dataset: {}, isConnected: true, classList: new Set() });
 const nodes = [makeNode(), makeNode()];
 const { observer, render, motion } = mount('about', nodes);
 observer.callback([{target: nodes[0], isIntersecting: false}]);
 assert.equal(nodes[0].classList.size, 0);
 observer.callback([{target: nodes[0], isIntersecting: true}]);
 assert(nodes[0].classList.has('motion-reveal'));
 assert(!observer.targets.has(nodes[0]));

 nodes[0] = makeNode();
 render();
 assert(!observer.targets.has(nodes[0]));
 assert(observer.targets.has(nodes[1]));
 assert.equal(nodes[0].classList.size, 0);

 motion.matches = false;
 observer.callback([{target: nodes[1], isIntersecting: true}]);
 assert.equal(nodes[1].classList.size, 0);
});

test('About has four native disclosures and programme has eight plain stages in static HTML', () => {
 const about = read('about.html');
 const programme = read('programme.html');
 assert.deepEqual(Array.from(about.matchAll(/<details class="about-direction" id="ph-([a-z]+)">/g), m => m[1]),
  ['mind', 'body', 'nutrition', 'life']);
 const weeks = programme.match(/<ol class="about-weeks">(.+?)<\/ol>/s)[1];
 assert.match(weeks, /^(<li><span>0[1-8]<\/span><strong>[^<]+<\/strong><\/li>){8}$/);
});
