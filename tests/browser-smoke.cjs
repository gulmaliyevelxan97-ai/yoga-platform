// Run against a local HTTP server with Playwright installed in the test environment.
const assert = require('node:assert/strict');
async function verifyStudio(p, base) {
const errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
p.setDefaultTimeout(7000);await p.goto(base+'#founder');await p.reload();await p.waitForSelector('#founderTitle');await p.locator('#founder img').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.decode())));
for(const width of [320,390,768,1366]){
 await p.setViewportSize({width,height:844});
 for(const lang of ['ru','az','en']){
 await p.selectOption('#language',lang);await p.goto(base+'#course/yoga');await p.waitForSelector('#courseTitle');
 assert.equal(await p.inputValue('#language'),lang);assert.equal(await p.locator('#coursePage ol li').count(),2);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.goto(base+'#courses');await p.waitForSelector('#courses');assert.equal(await p.locator('#courseList section').count(),7);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }}
await p.selectOption('#course-access','premium');assert.equal(await p.locator('#courseList section').count(),1);
await p.selectOption('#plan-count','4');await p.locator('#plannerForm button').click();assert.equal(await p.locator('#week li').count(),4);await p.locator('#week input').first().check();await p.reload();assert(await p.locator('#week input').first().isChecked());
await p.goto(base+'#course/yoga');await p.locator('#coursePage a.primary').click();await p.selectOption('#length','1');await p.clock.install();await p.click('#toggle');await p.clock.fastForward(20000);await p.click('#toggle');await p.goto(base+'#profile');await p.locator('#continuePractice a').click();assert.match(await p.locator('#time').innerText(),/^00:(39|40)$/);await p.click('#toggle');await p.clock.fastForward(61000);
await p.goto(base+'#course/yoga');await p.locator('#coursePage a.primary').click();await p.selectOption('#length','1');await p.click('#toggle');await p.clock.fastForward(61000);await p.goto(base+'#profile');await p.waitForSelector('#finishedCourses a');assert.equal(await p.locator('#minuteCount').innerText(),'2');
await p.fill('#desired','Evening');await p.locator('#request button').first().click();await p.click('#demoRequest');await p.locator('#demoBookings button').click();await p.click('#cancelDraft');
await p.goto(base+'#pricing');await p.waitForSelector('#priceCards');assert.equal(await p.locator('#priceCards section').count(),4);
await p.goto(base+'#top');await p.locator('img:visible').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.decode())));
assert.deepEqual(errors,[]);
}
module.exports={verifyStudio};
