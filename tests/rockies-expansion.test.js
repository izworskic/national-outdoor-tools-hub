const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const trail=require('../api/trail-ridge-road.js')._test;
const geysers=require('../api/yellowstone-geysers.js')._test;
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}

test('Trail Ridge uses official NPS road wording as the controlling status',()=>{
  const open=trail.roadStatus('Trail Ridge Road is Open to Through Travel. Timed Entry Reservations are required from 9 a.m. to 2 p.m.');
  assert.equal(open.level,'open');
  assert.match(open.timedEntry,/Timed Entry Reservations/i);
  const closed=trail.roadStatus('Trail Ridge Road is Closed for the Season.');
  assert.equal(closed.level,'closed');
  assert.equal(closed.label,'Closed for the season');
});

test('Trail Ridge weather remains supporting context, not road authority',()=>{
  const assessment=trail.weatherAssessment([{shortForecast:'Heavy Snow',detailedForecast:'Snow likely',windSpeed:'45 mph',temperature:28}],[]);
  assert.equal(assessment.level,'high');
  assert.match(assessment.detail,/Official NPS road status remains the controlling source/i);
});

test('Yellowstone selector drops expired forecasts and prefers official attribution',()=>{
  const now=Date.parse('2026-09-16T18:00:00Z');
  const rows=[
    {geyserName:'Old Faithful',prediction:'2026-09-16T18:40:00Z',windowOpen:'2026-09-16T18:25:00Z',windowClose:'2026-09-16T18:55:00Z',expiration:'2026-09-16T19:00:00Z',timestamp:'2026-09-16T17:30:00Z',eruptionForecastNumber:1,userName:'GeyserTimes contributor'},
    {geyserName:'Old Faithful',prediction:'2026-09-16T18:42:00Z',windowOpen:'2026-09-16T18:27:00Z',windowClose:'2026-09-16T18:57:00Z',expiration:'2026-09-16T19:00:00Z',timestamp:'2026-09-16T17:20:00Z',eruptionForecastNumber:1,userName:'National Park Service'},
    {geyserName:'Grand',prediction:'2026-09-16T16:00:00Z',windowOpen:'2026-09-16T15:00:00Z',windowClose:'2026-09-16T16:30:00Z',expiration:'2026-09-16T16:40:00Z',timestamp:'2026-09-16T14:00:00Z',eruptionForecastNumber:1,userName:'National Park Service'}
  ];
  const selected=geysers.selectCurrent(rows,now);
  assert.equal(selected.find(x=>x.geyserName==='Old Faithful').source,'National Park Service');
  assert.equal(selected.find(x=>x.geyserName==='Grand').available,false);
});

test('Yellowstone soonest returns an existing prediction window',()=>{
  const now=Date.parse('2026-09-16T18:00:00Z');
  const next=geysers.soonest([
    {geyserName:'Daisy',available:true,windowOpen:'2026-09-16T19:00:00Z',windowClose:'2026-09-16T19:30:00Z',prediction:'2026-09-16T19:15:00Z'},
    {geyserName:'Old Faithful',available:true,windowOpen:'2026-09-16T18:20:00Z',windowClose:'2026-09-16T18:50:00Z',prediction:'2026-09-16T18:35:00Z'}
  ],now);
  assert.equal(next.geyserName,'Old Faithful');
  assert.equal(next.windowOpen,'2026-09-16T18:20:00Z');
});

test('Rockies pages expose all three distinct decisions and source boundaries',()=>{
  const ridge=read('public/national-tools/trail-ridge-road/index.html');
  const yellowstone=read('public/national-tools/yellowstone-geysers/index.html');
  const rockies=read('public/national-tools/rockies/index.html');
  assert.match(ridge,/Road first\. Weather second\./);
  assert.match(ridge,/official NPS road status/i);
  assert.match(yellowstone,/prediction window/i);
  assert.match(yellowstone,/does not calculate its own eruption model/i);
  for(const text of ['Rocky Mountain Elk Rut Live','Trail Ridge Road Live','Yellowstone Geyser Timing']) assert.ok(rockies.includes(text),`Rockies desk missing ${text}`);
  assert.match(rockies,/three different mountain decisions/i);
});
