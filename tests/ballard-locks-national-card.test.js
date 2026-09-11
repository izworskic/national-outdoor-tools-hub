const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const page=fs.readFileSync(path.join(__dirname,'..','public','national-tools','index.html'),'utf8');

test('Ballard live conditions and the walking tour share one destination card',()=>{
  assert.equal((page.match(/data-tool-id="ballard-locks"/g)||[]).length,1);
  assert.ok(page.includes('href="https://chrisizworski.com/ballard-locks/"'));
  assert.ok(page.includes('href="https://chrisizworski.com/ballard-locks/tour/"'));
  assert.match(page,/Time a Ballard Locks visit/);
  assert.match(page,/AIS \+ WDFW salmon \+ NOAA tides \+ NWS weather \+ USACE operations/);
  assert.match(page,/20-, 45- and 75-minute self-guided routes/);
  assert.match(page,/Live AIS map \+ 12 stops \+ route presets \+ WDFW fish \+ live camera/);
});
