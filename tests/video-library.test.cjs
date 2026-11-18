const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = name => readFileSync(path.join(__dirname, '..', name), 'utf8');
const topics = new Set(['beginner','morning','hatha','stretch','meditation','breath','relax','balance']);
test('The free video collection has unique original lessons and complete filter metadata', () => {
  const catalogue = vm.runInNewContext(read('video-data.js') + '\n;curatedVideoLessons');
  assert.ok(catalogue.length >= 20 && catalogue.length <= 30);
  assert.equal(new Set(catalogue.map(row => row.id)).size, catalogue.length);
  assert.deepEqual(new Set(catalogue.map(row => row.topic)), topics);
  for (const row of catalogue) {
    assert.match(row.id, /^[a-zA-Z0-9_-]{11}$/);
    assert.ok(row.title.trim() && row.author.trim());
    assert.ok(Number.isInteger(row.seconds) && row.seconds > 0);
    assert.ok(['ru','az','en'].includes(row.language));
    assert.ok(['beginner','intermediate','all'].includes(row.level));
  }
});

test('Video search accepts multiple words and accent-free AZ input, with stable duration order', () => {
  const source = read('releases/restart/video-library.js');
  const startup = "  window.addEventListener('hashchange',routeVideo);";
  assert.ok(source.includes(startup));
  const testSource = source.slice(0,source.indexOf(startup)) +
    'return {filters,matchingVideos};\n})();';
  const {filters,matchingVideos} = vm.runInNewContext(testSource,{
    language:'az',
    curatedVideoLessons:[
      {id:'a',title:'Dərin nəfəs',author:'Elxan',topic:'breath',seconds:980},
      {id:'b',title:'Dərin nəfəs',author:'Leyla',topic:'breath',seconds:700},
      {id:'c',title:'Sakit səhər',author:'Elxan',topic:'morning',seconds:800}
    ]
  });
  filters.search='nefes derin';
  filters.sort='shortest';
  assert.deepEqual(Array.from(matchingVideos(),video=>video.id),['b','a']);
  filters.sort='longest';
  assert.deepEqual(Array.from(matchingVideos(),video=>video.id),['a','b']);
  filters.search='breathwork Elxan';
  assert.deepEqual(Array.from(matchingVideos(),video=>video.id),['a']);
});
