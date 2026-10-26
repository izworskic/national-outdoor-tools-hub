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
 assert.ok(f.nearTerm===null||Date.parse(f.nearTerm.time)<now+18*3600000,'near-term verdict must stay within next 18 hours');
 assert.equal(f.hours[0].cloud,null); // the partial 23:00 hour precedes valid NWS coverage
 assert.equal(f.hours[1].cloud,30);
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


test('current partial dark hour is eligible for an immediate verdict',()=>{
 const now=Date.parse('2026-10-18T06:35:00Z');
 const periods=normalizeSky([{validTime:'2026-10-18T06:00:00Z/PT1H',value:8}]);
 const forecast=forecastWindows(periods,43.59,-83.89,now);
 assert.equal(forecast.hours.length,72);
 assert.equal(forecast.hours[0].time,'2026-10-18T06:00:00.000Z');
 assert.ok(forecast.nearTerm,'current available dark hour should produce near-term viewing result');
 assert.equal(forecast.nearTerm.time,forecast.hours[0].time);
});
test('expired shower radiant is not carried into shower-free nights',()=>{
 const date=Date.parse('2026-12-27T06:00:00Z');
 assert.equal(showerContext(date).primary,null);
 const lingering=showerContext(Date.parse('2026-12-26T08:00:00Z'));
 const hour=gradeHour(date,20,43.59,-83.89,lingering);
 assert.equal(hour.radiantAlt,null);
});
test('Hawaii and Aleutian coordinates are not rejected before NWS checking',async()=>{
 const saved=global.fetch;global.fetch=async()=>{throw Error('simulated NWS failure');};
 const response=()=>({setHeader(){},status(n){this.code=n;return this;},json(v){this.value=v;return this;}});
 try {
   for(const q of [{lat:'18.94',lon:'-155.68'},{lat:'52.9',lon:'179.4'}]){
    const r=response();
    await meteor({method:'GET',query:{...q,radius:'0'}},r);
    assert.equal(r.code,503,'valid US-area coordinate should reach the NWS failure guard');
   }
 }finally{global.fetch=saved;}
});
test('surrounding compass samples wrap the international date line',()=>{
 const samples=surrounding(52.9,179.8,40);
 assert.equal(samples.length,4);
 assert.ok(samples.every(p=>p.lon<=180&&p.lon>=-180));
 assert.ok(samples.some(p=>p.lon<0),'eastward sample should wrap to western longitude');
});
test('NWS fixture emits near-term and nearby timezone fields without guessed clouds',async()=>{
 const saved=global.fetch, now=Date.now(),start=Math.floor(now/3600000)*3600000;
 let reqs=0;
 global.fetch=async(url)=>{
  reqs++;
  const u=String(url);
  const isPoints=u.includes('/points/');
  const loc=u.split('/points/')[1]||'43,-83';
  const coords=loc.split(',').map(Number);
  const zone=coords[1]<-84?'America/Chicago':'America/Detroit';
  const payload=isPoints?
   {properties:{forecastGridData:'https://api.weather.gov/gridpoints/APX/1,1',timeZone:zone,cwa:'APX'}}:
   {properties:{updateTime:new Date(now).toISOString(),skyCover:{values:[{validTime:new Date(start).toISOString()+'/PT73H',value:20}]}}};
  return {ok:true,json:async()=>payload};
 };
 try{
  const r={setHeader(){},status(code){this.code=code;return this;},json(value){this.value=value;return this;}};
  await meteor({method:'GET',query:{lat:'43.59',lon:'-83.89',radius:'40'}},r);
  assert.equal(r.code,200);
  assert.equal(r.value.forecast.hours.length,72);
  assert.equal(r.value.nearby.length,4);
  assert.ok(r.value.nearby.every(v=>v.available&&v.timeZone));
  assert.ok(r.value.forecast.nearTerm||r.value.forecast.best);
  assert.ok(reqs>=10);
 }finally{global.fetch=saved;}
});

test('published 2027 Quadrantids UTC peak takes precedence over generic seasonal date',()=>{
 const december=showerContext(Date.parse('2026-12-29T12:00:00Z'));
 const q=december.active.find(x=>x.id==='QUA');
 assert.ok(q,'Cross-year Quadrantids should be active');
 assert.equal(q.peakAt,'2027-01-04T03:30:00.000Z');
 assert.equal(december.next.id,'QUA');
 assert.equal(december.next.peakAt,q.peakAt);
 const january=showerContext(Date.parse('2027-01-03T12:00:00Z'));
 assert.equal(january.active.find(x=>x.id==='QUA').peakAt,q.peakAt);
 const other=showerContext(Date.parse('2027-04-21T12:00:00Z'));
 assert.ok(other.active.some(x=>x.id==='LYR'),'Other shower windows remain available');
});
