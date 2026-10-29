'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const calendar=require('../api/meteor-calendar.js');
const {showerContext}=require('../api/meteor-viewing.js')._test;
function invoke(method='GET',instant=Date.parse('2026-11-04T12:00:00Z')){
 const before=Date.now;let status=0,body=null;
 const res={setHeader(){},status(code){status=code;return this;},json(x){body=x;return this;},end(){return this;}};
 try{Date.now=()=>instant;calendar({method},res);}finally{Date.now=before;}
 return {status,body};
}
test('calendar is independent of NWS/cloud-grid calls and returns active IMO windows',()=>{
 const now=Date.parse('2026-11-04T12:00:00Z'),r=invoke('GET',now);
 assert.equal(r.status,200);assert.equal(r.body.status,'ok');
 assert.deepEqual(r.body.active.map(x=>x.id),showerContext(now).active.map(x=>x.id));
 assert.ok(r.body.active.some(x=>x.id==='STA'));
 assert.equal(r.body.source.includes('no weather or GMN request'),true);
});
test('calendar returns Quadrantids across 2026 to 2027 UTC year rollover',()=>{
 const r=invoke('GET',Date.parse('2027-01-04T03:30:00Z'));
 assert.equal(r.status,200);
 assert.ok(r.body.active.some(x=>x.id==='QUA'));
 assert.equal(r.body.active.find(x=>x.id==='QUA').peakAt,'2027-01-04T03:30:00.000Z');
});
test('calendar endpoint restricts methods',()=>{
 const r=invoke('POST');assert.equal(r.status,405);
});
test('meteor page includes independent calendar fetch and isolated GMN display',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('public/national-tools/meteor-shower/index.html','utf8');
 assert.match(html,/\/api\/meteor-calendar/);
 assert.match(html,/loadShowerCalendar\(\);\s*loadObservedActivity\(\);/);
 assert.match(html,/Shower calendar temporarily unavailable/);
 assert.match(html,/activeShowerWindows=data\.active;calendarUnavailable=false/);
});
