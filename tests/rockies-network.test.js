const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Trail Ridge Road keeps NPS road status authoritative',()=>{
  const api=require(path.join(root,'api','trail-ridge-road.js'));
  const source=read('api/trail-ridge-road.js');
  const page=read('public/national-tools/trail-ridge-road/index.html');
  const parsed=api._test.roadStatus('Trail Ridge Road is Open to Through Travel. Timed Entry Reservations are required from 9 a.m. to 2 p.m.');
  assert.equal(parsed.level,'open');
  assert.equal(parsed.label,'Open to through travel');
  assert.match(source,/NPS road status is authoritative/);
  assert.match(source,/weather assessment never overrides it/);
  assert.match(source,/11796/);
  assert.match(page,/Road first\. Weather second\./);
  assert.match(page,/official NPS road status comes first/i);
  assert.doesNotMatch(page,/weather says.*road.*open/i);
});

test('Yellowstone geyser engine preserves prediction windows and source priority',()=>{
  const api=require(path.join(root,'api','yellowstone-geysers.js'));
  const now=Date.parse('2026-09-16T18:00:00Z');
  const raw=[
    {geyserName:'Old Faithful',userName:'GeyserTimes user',prediction:'2026-09-16T19:00:00Z',windowOpen:'2026-09-16T18:50:00Z',windowClose:'2026-09-16T19:10:00Z',expiration:'2026-09-16T20:00:00Z',timestamp:'2026-09-16T17:00:00Z',eruptionForecastNumber:1},
    {geyserName:'Old Faithful',userName:'National Park Service',prediction:'2026-09-16T19:02:00Z',windowOpen:'2026-09-16T18:52:00Z',windowClose:'2026-09-16T19:12:00Z',expiration:'2026-09-16T20:00:00Z',timestamp:'2026-09-16T16:50:00Z',eruptionForecastNumber:1},
    {geyserName:'Grand',userName:'National Park Service',prediction:'2026-09-16T18:40:00Z',windowOpen:'2026-09-16T18:20:00Z',windowClose:'2026-09-16T19:00:00Z',expiration:'2026-09-16T19:30:00Z',timestamp:'2026-09-16T17:10:00Z',eruptionForecastNumber:1}
  ];
  const selected=api._test.selectCurrent(raw,now);
  const oldFaithful=selected.find(x=>x.geyserName==='Old Faithful');
  assert.equal(oldFaithful.source,'National Park Service');
  assert.equal(oldFaithful.windowOpen,'2026-09-16T18:52:00.000Z');
  assert.equal(api._test.soonest(selected,now).geyserName,'Grand');
  const source=read('api/yellowstone-geysers.js');
  const page=read('public/national-tools/yellowstone-geysers/index.html');
  assert.match(source,/does not calculate its own eruption model/);
  assert.match(source,/Open Database License/);
  assert.match(page,/A window, not an appointment/);
  assert.match(page,/does not invent an eruption schedule/i);
});

test('Rockies regional desk contains three distinct decision tools',()=>{
  const page=read('public/national-tools/rockies/index.html');
  for(const needle of ['Rocky Mountain Elk Rut Live','Trail Ridge Road Live','Yellowstone Geyser Timing'])assert.match(page,new RegExp(needle));
  assert.match(page,/meaningless Rockies score/i);
  assert.match(page,/numberOfItems":3/);
});

test('Rockies discovery is materialized and linked from the national directory',()=>{
  const html=read('public/national-tools/index.html');
  for(const id of ['elk-rut','trail-ridge-road','yellowstone-geysers'])assert.match(html,new RegExp(`data-tool-id="${id}"`));
  assert.match(html,/href="\/national-tools\/rockies\/"/);
  assert.match(html,/Open the Rockies decision desk/);
});

test('Rockies serverless handlers load',()=>{
  assert.equal(typeof require(path.join(root,'api','trail-ridge-road.js')),'function');
  assert.equal(typeof require(path.join(root,'api','yellowstone-geysers.js')),'function');
});
