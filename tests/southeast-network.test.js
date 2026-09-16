const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Florida Red Tide preserves sampling uncertainty',()=>{
  const api=read('api/florida-red-tide.js');
  const page=read('public/national-tools/florida-red-tide/index.html');
  assert.match(api,/most recent eight|Most recent eight/i);
  assert.match(api,/Insufficient recent sampling nearby/);
  assert.match(api,/not an all-clear/i);
  assert.match(api,/radiusMi:25/);
  for(const band of ['very low','low','medium','high'])assert.match(api,new RegExp(band,'i'));
  assert.match(page,/no nearby sample is not the same thing as no red tide/i);
  assert.match(page,/FWC-FWRI/);
  assert.doesNotMatch(page,/safe beach|beach is safe/i);
});

test('Space Coast keeps schedule confidence separate from visibility weather',()=>{
  const api=read('api/space-coast-launch.js');
  const page=read('public/national-tools/space-coast-launch/index.html');
  assert.match(api,/scheduleConfidence/);
  assert.match(api,/weatherGrade/);
  assert.match(api,/isFutureLaunch/);
  assert.match(api,/filter\(l=>isFutureLaunch\(l,now\)\)/);
  assert.match(api,/Launch schedule confidence and viewing weather are separate signals/);
  assert.match(api,/Kennedy Space Center/);
  assert.match(api,/api\.weather\.gov/);
  assert.match(api,/NWS hourly guidance does not yet cover the launch time/);
  assert.doesNotMatch(api,/periods\.sort\(/,'launch weather must not substitute the nearest forecast period when the launch is outside the NWS hourly horizon');
  assert.match(page,/schedule confidence/);
  assert.match(page,/viewing weather/);
  assert.match(page,/Clear skies do not mean the rocket will launch/);
});

test('Southeast regional desk has three distinct decisions',()=>{
  const page=read('public/national-tools/southeast/index.html');
  for(const needle of ['Blue Spring Live','Florida Red Tide Live','Space Coast Launch Viewing'])assert.match(page,new RegExp(needle));
  assert.match(page,/does not blend unrelated signals/i);
  assert.match(page,/numberOfItems":3/);
});

test('Southeast serverless handlers load',()=>{
  assert.equal(typeof require(path.join(root,'api','florida-red-tide.js')),'function');
  assert.equal(typeof require(path.join(root,'api','space-coast-launch.js')),'function');
});
