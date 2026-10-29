'use strict';
// The refresh workflow and the on-site forecast have different health contracts.
// A completed GitHub Action is not proof that GMN published a fresh optical-flux bin.
const {showerContext}=require('../api/meteor-viewing.js')._test;
const MAX_RUN_AGE_HOURS=15,MAX_OBS_AGE_HOURS=72;
function evaluate({snapshot,runs,now=Date.now()}={}){
 const active=showerContext(now).active,findings=[];
 const good=(Array.isArray(runs)?runs:[]).filter(x=>x.status==='completed'&&x.conclusion==='success'&&
  ['schedule','workflow_dispatch'].includes(x.event)&&x.head_branch==='main')
  .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0];
 const runMs=Date.parse(good?.created_at||'');
 if(!Number.isFinite(runMs))findings.push('No completed successful scheduled/manual GMN refresh is recorded.');
 else if(now-runMs>MAX_RUN_AGE_HOURS*3600000) findings.push('GMN refresh workflow has not completed successfully in '+MAX_RUN_AGE_HOURS+' hours.');
 const currentCodes=new Set(active.map(x=>x.id));
 const records=Array.isArray(snapshot?.observations)?snapshot.observations:[];
 const current=records.filter(x=>currentCodes.has(x.iauCode)&&Number.isFinite(Date.parse(x.observedAt))&&
  now-Date.parse(x.observedAt)>=-600000&&now-Date.parse(x.observedAt)<=48*3600000);
 if(active.length){
  if(snapshot?.sourceHealth==='source-unavailable')findings.push('Last GMN ingest classified its source as unavailable (network, upstream, or format).');
  if(snapshot?.sourceHealth==='observed'&&!current.length){
   const last=Date.parse(snapshot?.lastGoodAt||'');
   if(!Number.isFinite(last)||now-last>MAX_OBS_AGE_HOURS*3600000)
    findings.push('Active shower has no GMN measurements within '+MAX_OBS_AGE_HOURS+' hours despite prior observed status.');
  }
  // A published shower can have no complete new bins. Do not call an unpublished
  // source file or a valid quiet observing period an infrastructure failure.
 }
 return {status:findings.length?'alert':'ok',findings,active:active.map(x=>x.id),
  latestRun:good?.created_at||null,sourceHealth:snapshot?.sourceHealth||'unknown',
  freshMeasurements:current.length,lastGoodAt:snapshot?.lastGoodAt||null};
}
module.exports={evaluate,MAX_RUN_AGE_HOURS,MAX_OBS_AGE_HOURS};
