'use strict';
/**
 * Great Lakes Canada observing forecast, MET Norway Locationforecast 2.0.
 * The free global forecast API explicitly permits commercial reuse with CC BY attribution.
 * Reuses the existing hourly astronomical index; never infers open park gates or meteors/hour.
 * Site-ID allowlist avoids a general-purpose public forecast proxy.
 */
const {places}=require('../data/great-lakes-dark-sky.json');
const {forecastWindows,showerContext}=require('./meteor-viewing.js')._test;
const CANADIAN=new Map(places.filter(p=>p.country==='CA').map(p=>[p.id,p]));
const HOUR=3600000;
const SOURCE='https://api.met.no/weatherapi/locationforecast/2.0/compact';
const UA='ChrisIzworski-GreatLakesDarkSky/1.0 (https://chrisizworski.com/national-tools/dark-sky/; forecast use)';
function normalizeMet(payload,now){
 const updated=Date.parse(payload?.properties?.meta?.updated_at||'');
 if(!Number.isFinite(updated)||updated>now+HOUR||now-updated>18*HOUR)throw Error('MET Norway forecast missing or stale');
 const entries=payload?.properties?.timeseries;
 if(!Array.isArray(entries)||entries.length<18)throw Error('MET Norway has insufficient forecast data');
 const seen=new Set(),periods=[];
 for(const row of entries){
  const start=Date.parse(row?.time),v=row?.data?.instant?.details?.cloud_area_fraction;
  if(!Number.isFinite(start)||start<now-HOUR||start>=now+73*HOUR||seen.has(start))continue;
  seen.add(start);
  if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100)continue;
  // An instantaneous model datum applies only to its own hour, never six hours by interpolation.
  periods.push({start,end:start+HOUR,cloud:v});
 }
 periods.sort((a,b)=>a.start-b.start);
 if(periods.filter(p=>p.start>=now-HOUR&&p.start<=now+19*HOUR).length<10)throw Error('MET Norway has insufficient near-term hourly cloud forecasts');
 return {periods,updated:new Date(updated).toISOString()};
}
function responseFor(site,payload,now){
 const {periods,updated}=normalizeMet(payload,now);
 const f=forecastWindows(periods,site.lat,site.lon,now);
 const context=showerContext(now);
 const timezone=site.timeZone||'America/Toronto';
 return {status:'ok',location:{lat:site.lat,lon:site.lon,label:site.name},
  generatedAt:new Date(now).toISOString(),
  primary:context.primary?{name:context.primary.name,id:context.primary.id,peakAt:context.primary.peakAt,idealPeakZhr:context.primary.zhr}:null,
  active:context.active.map(s=>({name:s.name,id:s.id,peakAt:s.peakAt,idealPeakZhr:s.zhr})),
  upcoming:context.next?{name:context.next.name,id:context.next.id,peakAt:context.next.peakAt}:null,
  forecast:{timeZone:timezone,updated,office:'MET Norway',nearTerm:f.nearTerm,best:f.best,hours:f.hours},
  sources:{weather:'MET Norway Locationforecast 2.0 global forecast, cloud_area_fraction; CC BY 4.0',
   astronomy:'Approximate solar, lunar and meteor radiant geometry from the existing viewing engine',
   shower:'International Meteor Organization seasonal reference'},
  notes:['Canadian predictions are from MET Norway global model data, not a local Environment and Climate Change Canada forecast.',
  'NWS and MET Norway use different models. Cross-provider scores are not strictly equivalent.',
  'No cloud data means no hour score; missing hours are never interpolated.',
  'Weather does not establish open gates, accessible entrances or safe travel.',
  'The relative index is not a meteor-count forecast or sighting probability.']};
}
async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=900');
 res.setHeader('X-Robots-Tag','noindex, nofollow');
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 const site=CANADIAN.get(String(req.query?.site||''));
 if(!site)return res.status(400).json({error:'Select a supported Ontario dark-sky destination.'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
 try{
  const url=SOURCE+'?lat='+site.lat.toFixed(2)+'&lon='+site.lon.toFixed(2);
  const upstream=await fetch(url,{headers:{'User-Agent':UA,'Accept':'application/json'},signal:controller.signal});
  if(!upstream.ok)throw Error('MET Norway HTTP '+upstream.status);
  const data=await upstream.json();
  return res.status(200).json(responseFor(site,data,Date.now()));
 }catch(e){
  res.setHeader('Cache-Control','no-store');
  return res.status(503).json({status:'unavailable',error:'A current, sufficiently complete Canadian cloud forecast could not be verified. No viewing verdict can be issued.',site:site.name,source:'MET Norway'});
 }finally{clearTimeout(timer);}
}
module.exports=handler;
module.exports._test={normalizeMet,responseFor,CANADIAN};
