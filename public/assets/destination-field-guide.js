/* Progressive enhancement only. Shared park forecast stays the sole data source.
   No API requests, geolocation access, cookies, storage, ads or route manipulation. */
(()=>{
 'use strict';
 const payload=document.getElementById('darkSkyPayload');
 if(!payload)return;
 let p;try{p=JSON.parse(payload.textContent||'{}').place;}catch{return;}
 if(!p||!['newport','voyageurs','bwca'].includes(p.slug))return;
 const $=id=>document.getElementById(id);
 function timeZoneHour(iso,zone){
  const fields=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso));
  return Number(fields.find(x=>x.type==='hour')?.value);
 }
 const show=(iso,zone)=>new Intl.DateTimeFormat('en-US',{timeZone:zone,weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(iso));
 function setText(id,msg){if($(id))$(id).textContent=msg;}
 function newportForecast(detail){
  const box=$('dgNewportWindows');if(!box)return;
  box.textContent='';
  if(!detail||detail.slug!=='newport'||!Array.isArray(detail.hours)){
    setText('dgNewportWindows','Verified NWS forecast unavailable. No access-compatible dark-sky window can be recommended. Published park hours are 6 a.m.–11 p.m.; check the operator before visiting.');return;
  }
  const zone='America/Chicago';
  const valid=detail.hours.filter(h=>h.sky==='dark'&&Number.isFinite(h.score)&&typeof h.time==='string'&&Number.isFinite(new Date(h.time).valueOf()));
  const during=valid.filter(h=>{const hr=timeZoneHour(h.time,zone);return hr>=6&&hr<23;}).sort((a,b)=>b.score-a.score||Date.parse(a.time)-Date.parse(b.time));
  if(!during.length){
   setText('dgNewportWindows','No scored dark-sky hour in this forecast falls within 6 a.m.–11 p.m. Central Time. That does not mean the sky is clear or that nighttime entry is permitted. Recheck the DNR and a later forecast.');return;
  }
  const first=document.createElement('p');first.className='dg-window-caption';first.textContent='Top modeled dark hours within published non-camper visiting times. Not verified park access:';
  box.append(first);
  const list=document.createElement('ol');list.className='dg-window-list';
  during.slice(0,3).forEach(h=>{
   const li=document.createElement('li'),strong=document.createElement('strong'),small=document.createElement('span');
   strong.textContent=show(h.time,zone)+' · '+h.score+'/100 relative sky index';
   small.textContent='NWS forecast clouds: '+(Number.isFinite(h.cloud)?h.cloud+'%':'not reported')+'.';
   li.append(strong,small);list.append(li);
  });
  box.append(list);
  const highest=[...valid].sort((a,b)=>b.score-a.score)[0];
  if(highest&&timeZoneHour(highest.time,zone)>=23||highest&&timeZoneHour(highest.time,zone)<6){
   const warn=document.createElement('p');warn.className='dg-window-caution';warn.textContent='The strongest scored nighttime hour is outside standard visiting hours. Do not interpret the sky score as permission to remain after 11 p.m.';box.append(warn);
  }
 }
 if(p.slug==='newport'){
  window.addEventListener('darksky:forecast',evt=>newportForecast(evt.detail));
  window.addEventListener('darksky:forecast-error',()=>newportForecast(null));
 }
 if(p.slug==='bwca'){
  const date=$('dgPermitDate'),type=$('dgPermitType'),output=$('dgPermitResult');
  if(date&&type&&output){
   const update=()=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date.value)||!type.value){
     output.textContent='A permit is required for every BWCAW visitor. Select an entry date and travel type to see the applicable seasonal permit category.';return;
    }
    const [,month,day]=date.value.split('-').map(Number);
    const seasonalQuota=(month>5&&month<9)||(month===5&&day>=1)||(month===9&&day<=30);
    const quotaTrip=['overnight-paddle','overnight-hike','overnight-motor','motorized-day'].includes(type.value);
    const quota=seasonalQuota&&quotaTrip;
    const category=quota?'Quota permit required':'Self-issued permit required';
    const sentence=quota?
      'May 1–September 30: the official system requires a quota permit for overnight trips and motorized day use. Select the exact entry date and entry point on Recreation.gov; availability is NOT checked here.':
      'This trip falls under the self-issued permit rules. Use the official entry-point kiosk or Forest Service office, and check current entry rules, notices and closures.';
    output.replaceChildren();
    const strong=document.createElement('strong');strong.textContent=category;
    const description=document.createElement('p');description.textContent=sentence;
    const warning=document.createElement('p');warning.className='dg-window-caution';
    warning.textContent='No route, parking, campsite, ice, water, fire restriction, or permit availability has been verified.';
    output.append(strong,description,warning);
   };
   date.addEventListener('change',update);
   type.addEventListener('change',update);
  }
 }
})();