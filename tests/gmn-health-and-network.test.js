'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {evaluate}=require('../lib/gmn-health.js');
const now=Date.parse('2026-11-04T12:00:00Z');
const ran=(when,conclusion='success')=>({status:'completed',conclusion,event:'schedule',head_branch:'main',created_at:new Date(when).toISOString()});
const sample=(at)=>({iauCode:'STA',observedAt:new Date(at).toISOString(),flux:0.57,confidenceLow:0.491,confidenceHigh:0.658,meteorCount:180,unit:'meteors/1000 km2/hour (+6.5 mag)'});
test('healthy GMN schedule and a recent calibrated observation do not alert',()=>{
 const r=evaluate({now,runs:[ran(now-6*3600000)],snapshot:{sourceHealth:'observed',lastGoodAt:new Date(now-3*3600000).toISOString(),observations:[sample(now-3*3600000)]}});
 assert.equal(r.status,'ok');assert.equal(r.freshMeasurements,1);assert.ok(r.active.includes('STA'));
});
test('missing refresh is actionable even when old snapshot was healthy',()=>{
 const r=evaluate({now,runs:[ran(now-20*3600000)],snapshot:{sourceHealth:'observed',observations:[sample(now-3*3600000)]}});
 assert.equal(r.status,'alert');assert.match(r.findings.join(' '),/15 hours/);
});
test('GMN format/network failure triggers alert; normal unpublished file does not',()=>{
 const good=[ran(now-3*3600000)];
 const fault=evaluate({now,runs:good,snapshot:{sourceHealth:'source-unavailable',observations:[]}});
 assert.equal(fault.status,'alert');
 const normal=evaluate({now,runs:good,snapshot:{sourceHealth:'not-published',observations:[]}});
 assert.equal(normal.status,'ok');
});
test('quiet period does not require a fresh meteor count',()=>{
 const quiet=Date.parse('2026-03-01T12:00:00Z');
 const r=evaluate({now:quiet,runs:[ran(quiet-3*3600000)],snapshot:{sourceHealth:'no-active',observations:[]}});
 assert.equal(r.status,'ok');assert.deepEqual(r.active,[]);
});
test('newly expired measurements do not become current because cache refreshed',()=>{
 const r=evaluate({now,runs:[ran(now-3*3600000)],snapshot:{sourceHealth:'observed',lastGoodAt:new Date(now-73*3600000).toISOString(),observations:[sample(now-73*3600000)]}});
 assert.equal(r.status,'alert');assert.equal(r.freshMeasurements,0);
});
test('shared GMN component is emitted on all 24 parks and seven regional pages',()=>{
 const root='public/national-tools/dark-sky/';
 for(const p of JSON.parse(fs.readFileSync('data/great-lakes-dark-sky.json','utf8')).places){
  const html=fs.readFileSync(root+p.slug+'/index.html','utf8');
  assert.match(html,/id="gmnObservedNetwork"/,p.slug);
  assert.match(html,/gmn-observed-component\.js/,p.slug);
  assert.match(html,/GMN 95% intervals describe measurement uncertainty/,p.slug);
 }
 for(const slug of ['midwest','michigan','wisconsin','minnesota','illinois','indiana','ohio']){
  const html=fs.readFileSync(root+slug+'/index.html','utf8');
  assert.match(html,/id="gmnObservedNetwork"/,slug);
  assert.match(html,/gmn-observed-component\.js/,slug);
 }
 const hub=fs.readFileSync(root+'index.html','utf8');
 assert.match(hub,/id="gmnObservedNetwork"/);
 assert.ok(fs.existsSync(root+'assets/gmn-observed-component.js'));
 assert.ok(fs.existsSync(root+'assets/gmn-observed-component.css'));
});
