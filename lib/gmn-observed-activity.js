'use strict';
// Reusable GMN observation boundary. This is a physical-flux series, NOT
// raw camera detections, a modeled ZHR, or an observing-site forecast.
const HOUR=3600000, FRESH_MS=48*HOUR, MAX_FUTURE_MS=10*60000;
const CODE=/^[A-Z0-9]{3,8}$/;
const UNIT='meteors/1000 km2/hour (+6.5 mag)';
const DASHBOARD='https://globalmeteornetwork.org/flux/';
const DATA_PAGE='https://globalmeteornetwork.org/flux/csv/';
function observationTime(v){
 if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(v))return null;
 const t=Date.parse(v);return Number.isFinite(t)?t:null;
}
function normalize(input){
 if(!input||!Array.isArray(input.observations))throw Error('Missing verified GMN flux observations');
 const out=[];
 for(const row of input.observations){
  const code=String(row?.iauCode||'').trim().toUpperCase();
  const t=observationTime(row?.observedAt);
  if(!CODE.test(code)||t===null||typeof row.flux!=='number'||!Number.isFinite(row.flux)||row.flux<0||row.flux>1000||row.unit!==UNIT)continue;
  out.push({iauCode:code,observedAt:new Date(t).toISOString(),flux:row.flux,unit:UNIT,
   confidenceLow:typeof row.confidenceLow==='number'?row.confidenceLow:null,
   confidenceHigh:typeof row.confidenceHigh==='number'?row.confidenceHigh:null,
   sourceFile:typeof row.sourceFile==='string'?row.sourceFile:null,
   timeBasis:row.timeBasis==='approximate bin center derived from GMN mean solar longitude (J2000)'?row.timeBasis:null});
 }
 if(!out.length)throw Error('No valid calibrated flux observations');
 return out;
}
function publishedCache(records,sourceUrl,refreshedAt){
 if(!/^https:\/\/globalmeteornetwork\.org\/flux\/csv\/$/.test(sourceUrl||''))throw Error('Unverified GMN flux data source');
 const obs=normalize({observations:records});
 return {version:1,source:sourceUrl,refreshedAt,lastGoodAt:obs.reduce((latest,r)=>!latest||Date.parse(r.observedAt)>Date.parse(latest)?r.observedAt:latest,null),observations:obs};
}
function view(cache,now=Date.now()){
 const source={dashboard:DASHBOARD,dataPage:DATA_PAGE};
 const candidates=Array.isArray(cache?.observations)?cache.observations:[];
 const valid=candidates.filter(r=>r&&CODE.test(String(r.iauCode||''))&&
    typeof r.flux==='number'&&Number.isFinite(r.flux)&&r.flux>=0&&r.flux<=1000&&
    r.unit===UNIT&&observationTime(r.observedAt)!==null);
 const latest=valid.reduce((a,r)=>Math.max(a,Date.parse(r.observedAt)),0);
 const age=latest?now-latest:Infinity;
 const fresh=cache?.status!=='unavailable'&&latest>0&&age>=-MAX_FUTURE_MS&&age<=FRESH_MS;
 // Require individual measurements to be fresh, not just the newest record overall.
 const observations=fresh?valid.filter(r=>{const delta=now-Date.parse(r.observedAt);return delta>=-MAX_FUTURE_MS&&delta<=FRESH_MS;})
  .sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt)):[];
 const byCode=new Map();for(const row of observations)if(!byCode.has(row.iauCode))byCode.set(row.iauCode,row);
 return {status:byCode.size?'ok':'unavailable',observations:[...byCode.values()],lastGoodAt:latest?new Date(latest).toISOString():cache?.lastGoodAt||null,
  freshnessHours:FRESH_MS/HOUR,
  snapshotUpdatedAt:observationTime(cache?.refreshedAt)!==null?cache.refreshedAt:null,
  sourceHealth:['observed','no-active','no-current-bin','source-unavailable'].includes(cache?.sourceHealth)?cache.sourceHealth:null,
  source};
}
function forActive(viewData,active){
 const showers=Array.isArray(active)?active:[];
 if(!showers.length)return {status:'no-active',items:[],lastGoodAt:viewData?.lastGoodAt||null};
 const byCode=new Map((viewData?.status==='ok'?viewData.observations:[]).map(x=>[x.iauCode,x]));
 const items=showers.map(s=>({id:s.id,name:s.name,observation:byCode.get(s.id)||null}));
 return {status:items.some(s=>s.observation)?'ok':'unavailable',items,lastGoodAt:viewData?.lastGoodAt||null};
}
module.exports={HOUR,FRESH_MS,UNIT,DASHBOARD,DATA_PAGE,normalize,publishedCache,view,forActive};
