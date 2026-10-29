/* GMN network observations, shared across the Great Lakes, regional and park planners.
   Weather and park-access verdicts are intentionally independent of measured flux. */
(function(){
'use strict';
const host=document.getElementById('gmnObservedNetwork');if(!host)return;
const status=host.querySelector('[data-gmn-status]'),items=host.querySelector('[data-gmn-items]');
const endpoint='https://national-outdoor-tools-hub.vercel.app/api/';
const UNIT='meteors/1000 km2/hour (+6.5 mag)',FRESH_MS=48*3600000;
function isoLocal(s){const d=new Date(s);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZoneName:'short'}).format(d):'time unavailable';}
function recordValid(x,now){
 const when=Date.parse(x?.observedAt||'');return x&&/^[A-Z0-9]{3,8}$/.test(x.iauCode||'')&&
 x.unit===UNIT&&Number.isFinite(x.flux)&&x.flux>=0&&Number.isFinite(when)&&now-when>=-600000&&now-when<=FRESH_MS;
}
function formatRecord(x){
 const flux=x.flux.toFixed(3)+' meteors per 1,000 km² per hour (+6.5 mag)';
 const lo=x.confidenceLow,hi=x.confidenceHigh;
 const interval=Number.isFinite(lo)&&Number.isFinite(hi)&&lo>=0&&lo<=x.flux&&hi>=x.flux
  ?' · GMN 95% confidence interval '+lo.toFixed(3)+'–'+hi.toFixed(3):' · Confidence interval unavailable';
 const count=Number.isInteger(x.meteorCount)&&x.meteorCount>0?' · '+x.meteorCount.toLocaleString('en-US')+' meteors in the GMN sample':'';
 return flux+interval+count+' · approximate GMN observation-bin center '+isoLocal(x.observedAt);
}
function showText(value){status.textContent=value;}
function add(text){const p=document.createElement('p');p.className='small';p.textContent=text;items.appendChild(p);}
async function get(path){const response=await fetch(endpoint+path,{headers:{Accept:'application/json'},cache:'no-cache',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('Source unavailable');return response.json();}
async function run(){
 const [calendar,measured]=await Promise.allSettled([get('meteor-calendar'),get('meteor-flux')]);
 if(calendar.status!=='fulfilled'||calendar.value?.status!=='ok'||!Array.isArray(calendar.value.active)){
  showText('Current shower calendar unavailable; no network activity is assigned. Local sky forecasts remain separate.');return;
 }
 const showers=calendar.value.active;items.replaceChildren();
 if(!showers.length){showText('No major meteor shower currently active in the IMO seasonal calendar. Sporadic meteors remain possible.');return;}
 if(measured.status!=='fulfilled'||!Array.isArray(measured.value?.observations)){
  showText('GMN network activity temporarily unavailable. The local cloud and moon forecast is unaffected.');return;
 }
 const snapshot=measured.value,now=Date.now();
 const byCode=new Map(snapshot.status==='ok'?snapshot.observations.filter(x=>recordValid(x,now)).map(x=>[x.iauCode,x]):[]);
 showText('GMN network-wide optical meteor flux · independent of the local viewing index.');
 for(const shower of showers){
  const row=byCode.get(shower.id);
  add(shower.name+': '+(row?formatRecord(row):'no fresh calibrated GMN observation available.'));
 }
 if(!showers.some(s=>byCode.has(s.id))){
  const last=snapshot.lastGoodAt&&Number.isFinite(Date.parse(snapshot.lastGoodAt))?' Last verified bin: '+isoLocal(snapshot.lastGoodAt)+'.':'';
  add('No current GMN flux can be shown.'+last);
 }
}
run().catch(()=>showText('GMN observation component unavailable. Local forecasts are independent.'));
})();
