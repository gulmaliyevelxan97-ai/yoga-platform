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
