'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const meteor=require('../api/meteor-viewing.js');
const {parsePeriod,normalizeSky,skyAt,showerContext,gradeHour,forecastWindows,surrounding,solarMoon}=meteor._test;
test('NWS validTime must provide closed, positive duration; missing cells are not clear',()=>{
 const period=parsePeriod('2026-10-18T03:00:00+00:00/PT3H');
 assert.equal(period.end-period.start,3*3600000);
 assert.equal(parsePeriod('garbage'),null);
 assert.equal(parsePeriod('2026-10-18T03:00:00Z/PT0H'),null);
 const items=normalizeSky([{validTime:'2026-10-18T03:00:00Z/PT3H',value:0},
 {validTime:'2026-10-18T06:00:00Z/PT1H',value:null},
 {validTime:'2026-10-18T07:00:00Z/PT1H',value:999}]);
 assert.equal(items.length,1);
 assert.equal(skyAt(Date.parse('2026-10-18T04:00:00Z'),items),0);
 assert.equal(skyAt(Date.parse('2026-10-18T06:30:00Z'),items),null);
});
test('autumn Orionids and cross-year Quadrantids are seasonally categorized',()=>{
 assert.equal(showerContext(Date.parse('2026-10-21T08:00:00Z')).primary.id,'ORI');
 assert.ok(showerContext(Date.parse('2027-01-03T08:00:00Z')).active.some(s=>s.id==='QUA'));
 assert.ok(showerContext(Date.parse('2026-12-30T08:00:00Z')).active.some(s=>s.id==='QUA'));
});
test('observing score fails closed on absent cloud and daylight',()=>{
 const nighttime=Date.parse('2026-10-18T06:00:00Z'),daytime=Date.parse('2026-10-18T17:00:00Z');
 const c=showerContext(nighttime);
 assert.equal(gradeHour(nighttime,null,43.59,-83.89,c).score,null);
 assert.equal(gradeHour(daytime,0,43.59,-83.89,c).score,null);
 assert.ok(solarMoon(nighttime,43.59,-83.89).sunAlt< -12);
 assert.ok(gradeHour(nighttime,20,43.59,-83.89,c).score>=0);
});
test('72-hour forecast never invents cloudy-hour data and compares coordinates correctly',()=>{
 const now=Date.parse('2026-10-17T23:35:00Z');
 const p=normalizeSky([{validTime:'2026-10-18T00:00:00Z/PT2H',value:30}]);
 const f=forecastWindows(p,43.59,-83.89,now);
 assert.equal(f.hours.length,72);
 assert.equal(f.hours[0].cloud,30);
 assert.equal(f.hours[3].cloud,null);
 assert.equal(surrounding(43.59,-83.89,40).length,4);
 assert.equal(surrounding(43.59,-83.89,0).length,0);
});
test('API rejects invalid location without calling outside network',async()=>{
 const response={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.value=value;return this;}};
 await meteor({method:'GET',query:{lat:'0',lon:'0',radius:'999'}},response);
 assert.equal(response.code,400);
});
test('API issues NO viewing verdict when NWS fetch fails',async()=>{
 const saved=global.fetch;global.fetch=async()=>{throw Error('simulated NWS failure');};
 try{
  const res={setHeader(){},status(code){this.code=code;return this;},json(value){this.value=value;return this;}};
  await meteor({method:'GET',query:{lat:'43.59',lon:'-83.89',radius:'0'}},res);
  assert.equal(res.code,503);
  assert.equal(res.value.status,'unavailable');
 }finally{global.fetch=saved;}
});
