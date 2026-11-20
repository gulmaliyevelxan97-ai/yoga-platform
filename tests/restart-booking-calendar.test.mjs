import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classCalendarFile,classCalendarLink,classVenueField,classLocationFields,classDetailMarkup
} from '../app/booking-calendar.mjs';

const session = {id:'b3b5a1d3-e576-4136-85b3-4461a82e958a',starts_at:'2027-01-22T11:30:00+04:00',
  ends_at:'2027-01-22T12:30:00+04:00',time_zone:'Asia/Baku',title:'Йога, дыхание; йога',
  venue:'Bakı, зал 1'};

test('calendar export uses absolute instants, escapes text and folds UTF-8 without splitting glyphs',()=>{
  const file = classCalendarFile({...session,title:'Yoga\r\nATTENDEE:x'+ 'ə'.repeat(80)},'2027-01-01');
  assert.match(file,/DTSTART:20270122T073000Z/);
  assert.match(file,/DTEND:20270122T083000Z/);
  assert.match(file,/SUMMARY:Yoga\\nATTENDEE:x/);
  assert.match(file,/LOCATION:Bakı\\, зал 1/);
  assert(file.split('\r\n').every(line => Buffer.byteLength(line) <= 75));
  assert(file.replace(/\r\n /g,'').includes('ə'.repeat(80)));
  assert(!file.includes('\r\nATTENDEE:'));
});

test('school venue, timezone and local calendar action support all three languages and older classes',()=>{
  for (const lang of ['ru','az','en']) {
    assert(classVenueField(lang).includes('name="venue"'));
    const link = classCalendarLink(session,lang);
    assert(link.includes('download="RESTART.ics"'));
    assert(!link.includes('http'));
    assert(classDetailMarkup(session,lang,String).includes('Bakı'));
  }
  assert.equal(classLocationFields({venue:' abc '}).venue,'abc');
  assert.equal(classDetailMarkup({...session,venue:'',time_zone:'Unknown/Zone'},'az',String),'');
  assert.equal(classDetailMarkup({...session,venue:'',time_zone:null},'en',String),'');
});

test('School wall times are interpreted in Baku on every device', async()=>{
 const {classTimeInput,classTimeInstant}=await import('../app/booking-calendar.mjs');
 assert.equal(classTimeInstant('2026-11-21T00:15'),'2026-11-20T20:15:00.000Z');
 assert.equal(classTimeInput('2026-11-20T20:15:00.000Z'),'2026-11-21T00:15');
 assert.throws(()=>classTimeInstant('2026-02-30T18:00'));
});
