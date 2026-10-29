'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {solarLongitudeJ2000}=require('../lib/gmn-flux-csv.js');
const {view}=require('../lib/gmn-observed-activity.js');
const GMN_HEADER='# Sol bin start (deg), Mean Sol (deg), TAP-weighted Sol (deg), Flux@+6.5M no diurnal corr, Flux@+6.5M (met / 1000 km^2 h), Flux CI low, Flux CI high, Flux@+4.59M (met / 1000 km^2 h), Flux CI low, Flux CI high, ZHR, ZHR CI low, ZHR CI high, Meteor Count, Time-area product (corrected to +6.5M) (1000 km^2/h), Meteor LM, Radiant elev (deg), Radiat dist (deg), Ang vel (deg/s)';
const now=Date.parse('2026-11-04T12:00:00Z');
function csvAt(utc,code='STA'){
 const sol=solarLongitudeJ2000(utc).toFixed(7);
 return ['# Shower parameters:','# Shower = '+code,GMN_HEADER,
 [sol,sol,sol,'0.540','0.570','0.491','0.658','0.116','0.100','0.134','1.555','1.339','1.796','180','315.901','4.36','57.42','63.20','10.55'].join(',')].join('\n');
}
function goodResponse(body){return {ok:true,headers:{get:()=>null},text:async()=>body};}
async function tempCache(fn){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'gmn-flux-test-')),cachePath=path.join(dir,'snapshot.json');
 try{
  await fs.writeFile(cachePath,JSON.stringify({version:1,source:null,observations:[],lastGoodAt:null}));
  return await fn(cachePath);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
}
test('scheduled ingest: partial upstream success keeps only real current flux and records health',async()=>{
 const {refresh}=await import('../scripts/refresh-gmn-flux.mjs');
 await tempCache(async cachePath=>{
  const fake=async url=>url.includes('flux_STA_')?goodResponse(csvAt(now-8*3600000)):Promise.reject(new Error('network unavailable'));
  const result=await refresh({now,cachePath,fetcher:fake});
  assert.ok(result.active.includes('STA'));
  assert.equal(result.good,1);
  assert.equal(result.sourceHealth,'observed');
  const snapshot=JSON.parse(await fs.readFile(cachePath,'utf8'));
  assert.equal(snapshot.status,'ok');
  assert.equal(snapshot.sourceHealth,'observed');
  assert.deepEqual(snapshot.observations.map(x=>x.iauCode),['STA']);
  assert.equal(snapshot.observations[0].flux,0.570);
  assert.equal(view(snapshot,now).status,'ok');
 });
});
test('scheduled ingest: total upstream outage hides all values and retains last good timestamp',async()=>{
 const {refresh}=await import('../scripts/refresh-gmn-flux.mjs');
 await tempCache(async cachePath=>{
  const fake=async url=>url.includes('flux_STA_')?goodResponse(csvAt(now-8*3600000)):Promise.reject(new Error('404 unpublished'));
  await refresh({now,cachePath,fetcher:fake});
  const lastGood=JSON.parse(await fs.readFile(cachePath,'utf8')).lastGoodAt;
  const result=await refresh({now:now+3600000,cachePath,fetcher:async()=>{throw Error('GMN down');}});
  assert.equal(result.good,0);
  assert.equal(result.sourceHealth,'source-unavailable');
  const unavailable=JSON.parse(await fs.readFile(cachePath,'utf8'));
  assert.deepEqual(unavailable.observations,[]);
  assert.equal(unavailable.lastGoodAt,lastGood);
  assert.equal(view(unavailable,now+3600000).status,'unavailable');
  assert.equal(view(unavailable,now+3600000).sourceHealth,'source-unavailable');
  const recovery=await refresh({now:now+2*3600000,cachePath,fetcher:fake});
  assert.equal(recovery.good,1);
  assert.equal(view(JSON.parse(await fs.readFile(cachePath,'utf8')),now+2*3600000).status,'ok');
 });
});
test('scheduled ingest: incomplete files and stale bins do not become measured activity',async()=>{
 const {refresh}=await import('../scripts/refresh-gmn-flux.mjs');
 await tempCache(async cachePath=>{
  const stale=csvAt(now-49*3600000);
  const result=await refresh({now,cachePath,fetcher:async()=>goodResponse(stale)});
  assert.equal(result.good,0);
  assert.equal(result.sourceHealth,'no-current-bin');
  assert.equal(view(JSON.parse(await fs.readFile(cachePath,'utf8')),now).status,'unavailable');
 });
});
test('scheduled ingest: quiet season does not poll GMN or invent observations',async()=>{
 const {refresh}=await import('../scripts/refresh-gmn-flux.mjs');
 await tempCache(async cachePath=>{
  const result=await refresh({now:Date.parse('2026-03-01T12:00:00Z'),cachePath,fetcher:()=>{throw Error('should not poll');}});
  assert.equal(result.active.length,0);
  assert.equal(result.sourceHealth,'no-active');
  assert.deepEqual(JSON.parse(await fs.readFile(cachePath,'utf8')).observations,[]);
 });
});
