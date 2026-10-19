'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {normalizeMet,responseFor,CANADIAN}=require('../api/dark-sky-canada.js')._test;
const H=3600000,NOW=Date.parse('2026-10-19T12:15:00Z');
function sample(){
 const base=Math.floor(NOW/H)*H;
 return {type:'Feature',properties:{meta:{updated_at:new Date(NOW-H).toISOString()},timeseries:Array.from({length:90},(_,i)=>({
  time:new Date(base+i*H).toISOString(),data:{instant:{details:{cloud_area_fraction:35+(i%4)*10}}}
 }))}};
}
test('Canadian allowlist includes seven Ontario parks only',()=>{
 assert.equal(CANADIAN.size,7);
 for(const p of CANADIAN.values()){assert.equal(p.country,'CA');assert.match(p.timeZone,/^America\//);}
 assert.ok(!CANADIAN.has('headlands'));
});
test('Recent complete MET forecast feeds same 72-hour astronomical engine',()=>{
 const p=sample(),norm=normalizeMet(p,NOW);
 assert.ok(norm.periods.length>=72);
 const out=responseFor(CANADIAN.get('point-pelee'),p,NOW);
 assert.equal(out.status,'ok');assert.equal(out.forecast.hours.length,72);
 assert.match(out.sources.weather,/MET Norway/);
 assert.match(out.forecast.timeZone,/America\//);
 assert.ok(out.forecast.hours.some(h=>h.cloud!==null));
 assert.equal(out.forecast.office,'MET Norway');
});
test('Null, nonfinite and out-of-range cloud observations remain unscored',()=>{
 const p=sample();
 for(const i of [10,11,12])p.properties.timeseries[i].data.instant.details.cloud_area_fraction=null;
 p.properties.timeseries[13].data.instant.details.cloud_area_fraction=-1;
 p.properties.timeseries[14].data.instant.details.cloud_area_fraction=101;
 const out=responseFor(CANADIAN.get('killarney'),p,NOW);
 assert.equal(out.forecast.hours.filter(h=>h.cloud===null).length>=5,true);
});
test('Stale data, future model time and near-term gaps reject favorable weather claims',()=>{
 const p=sample();p.properties.meta.updated_at=new Date(NOW-20*H).toISOString();
 assert.throws(()=>normalizeMet(p,NOW),/stale/);
 p.properties.meta.updated_at=new Date(NOW+2*H).toISOString();assert.throws(()=>normalizeMet(p,NOW),/stale/);
 p.properties.meta.updated_at=new Date(NOW-H).toISOString();p.properties.timeseries=p.properties.timeseries.slice(22);
 assert.throws(()=>normalizeMet(p,NOW),/near-term/);
});
test('No interpolation of 6-hourly updates into invented hourly data',()=>{
 const p=sample(),base=Math.floor(NOW/H)*H;
 p.properties.timeseries=p.properties.timeseries.filter((_,i)=>i<21||i%6===0);
 const out=responseFor(CANADIAN.get('superior-on'),p,NOW);
 const hour=out.forecast.hours.find(h=>Date.parse(h.time)===base+24*H);
 const missing=out.forecast.hours.find(h=>Date.parse(h.time)===base+25*H);
 assert.ok(hour&&hour.cloud!==null);assert.ok(missing&&missing.cloud===null);
});
