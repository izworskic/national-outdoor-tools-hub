'use strict';
// Meteor Viewing Engine: forecasts are conditions, NOT meteor counts or sighting probabilities.
// National Weather Service /points -> forecastGridData (skyCover), IMO seasonal shower calendar.
const RAD=Math.PI/180, HOUR=3600000, DAY=86400000;
const SHOWER=[
 {id:'ORI',name:'Orionids',from:[10,2],to:[11,7],peak:[10,21],ra:95,dec:16,zhr:20,window:3},
 {id:'STA',name:'Southern Taurids',from:[9,20],to:[11,20],peak:[11,5],ra:52,dec:15,zhr:7,window:9},
 {id:'NTA',name:'Northern Taurids',from:[10,20],to:[12,10],peak:[11,12],ra:58,dec:22,zhr:5,window:9},
 {id:'LEO',name:'Leonids',from:[11,6],to:[11,30],peak:[11,17],ra:152,dec:22,zhr:15,window:3},
 {id:'GEM',name:'Geminids',from:[12,4],to:[12,20],peak:[12,14],ra:112,dec:33,zhr:150,window:3},
 {id:'URS',name:'Ursids',from:[12,17],to:[12,26],peak:[12,22],ra:217,dec:76,zhr:10,window:2},
 {id:'QUA',name:'Quadrantids',from:[12,28],to:[1,12],peak:[1,3],ra:230,dec:49,zhr:80,window:1},
 {id:'LYR',name:'Lyrids',from:[4,14],to:[4,30],peak:[4,22],ra:271,dec:34,zhr:18,window:3},
 {id:'ETA',name:'Eta Aquariids',from:[4,19],to:[5,28],peak:[5,6],ra:338,dec:-1,zhr:50,window:6},
 {id:'SDA',name:'Southern Delta Aquariids',from:[7,12],to:[8,23],peak:[7,31],ra:340,dec:-16,zhr:25,window:7},
 {id:'PER',name:'Perseids',from:[7,17],to:[8,24],peak:[8,12],ra:48,dec:58,zhr:100,window:4},
 {id:'DRA',name:'Draconids',from:[10,6],to:[10,10],peak:[10,9],ra:262,dec:54,zhr:5,window:1}
];
function dateFor(year,md){return Date.UTC(year,md[0]-1,md[1],12);}
function instances(shower,year){
 return [year-1,year,year+1].map(y=>{
  let start=dateFor(y,shower.from),end=dateFor(y,shower.to),peak=dateFor(y,shower.peak);
  if(end<start)end=dateFor(y+1,shower.to);
  if(peak<start)peak=dateFor(y+1,shower.peak);
  return {start,end,peak,shower};
 });
}
function showerContext(at){
 const year=new Date(at).getUTCFullYear();
 const current=[],upcoming=[];
 for(const shower of SHOWER){
  for(const i of instances(shower,year)){
   if(at>=i.start && at<=i.end)current.push({...shower,peakAt:new Date(i.peak).toISOString(),daysFromPeak:Math.abs(at-i.peak)/DAY,daysUntilPeak:(i.peak-at)/DAY});
   if(i.peak>=at-12*HOUR)upcoming.push({...shower,peakAt:new Date(i.peak).toISOString(),daysUntilPeak:(i.peak-at)/DAY});
  }
 }
 current.sort((a,b)=> (a.daysFromPeak/a.window)-(b.daysFromPeak/b.window) || b.zhr-a.zhr);
 upcoming.sort((a,b)=>a.daysUntilPeak-b.daysUntilPeak);
 return {active:current,primary:current[0]||null,next:upcoming[0]||null};
}
function parsePeriod(s){
 const parts=String(s||'').split('/'), start=Date.parse(parts[0]);
 if(!Number.isFinite(start))return null;
 const m=/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(parts[1]||'');
 if(!m)return null;
 const ms=(Number(m[1]||0)*24+Number(m[2]||0))*HOUR+Number(m[3]||0)*60000;
 return ms>0?{start,end:start+ms}:null;
}
function normalizeSky(values){
 return (Array.isArray(values)?values:[]).map(v=>{
  const p=parsePeriod(v.validTime), n=v.value;
  return p&&typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100?{...p,cloud:n}:null;
 }).filter(Boolean).sort((a,b)=>a.start-b.start);
}
function skyAt(t,periods){const p=periods.find(v=>t>=v.start&&t<v.end);return p?p.cloud:null;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function radians(v){return v*RAD;}
function solarMoon(at,lat,lon){
 // Low-precision sun/moon positions based on standard astronomical mean elements.
 // Adequate for approximate darkness and moon-interference bands, not ephemeris/navigation.
 const d=at/DAY-0.5+2440588-2451545,phi=radians(lat),lw=-radians(lon),obliquity=radians(23.4397);
 const ra=(l,b)=>Math.atan2(Math.sin(l)*Math.cos(obliquity)-Math.tan(b)*Math.sin(obliquity),Math.cos(l));
 const dec=(l,b)=>Math.asin(Math.sin(b)*Math.cos(obliquity)+Math.cos(b)*Math.sin(obliquity)*Math.sin(l));
 const sid=radians(280.16+360.9856235*d)-lw;
 const altitude=(r,de)=>Math.asin(Math.sin(phi)*Math.sin(de)+Math.cos(phi)*Math.cos(de)*Math.cos(sid-r))/RAD;
 const M=radians(357.5291+0.98560028*d);
 const C=radians(1.9148)*Math.sin(M)+radians(0.02)*Math.sin(2*M)+radians(0.0003)*Math.sin(3*M);
 const L=M+C+radians(102.9372)+Math.PI;
 const sunAlt=altitude(ra(L,0),dec(L,0));
 const lm=radians(218.316+13.176396*d),mm=radians(134.963+13.064993*d),f=radians(93.272+13.22935*d);
 const ml=lm+radians(6.289)*Math.sin(mm),mb=radians(5.128)*Math.sin(f);
 const moonAlt=altitude(ra(ml,mb),dec(ml,mb));
 const elong=Math.acos(clamp(Math.cos(mb)*Math.cos(ml-L),-1,1));
 const moonIllum=(1-Math.cos(elong))/2;
 return {sunAlt,moonAlt,moonIllum,sid,altitude};
}
function radiantAlt(at,lat,lon,shower){
 if(!shower)return null;
 const a=solarMoon(at,lat,lon);
 return a.altitude(radians(shower.ra),radians(shower.dec));
}
function gradeHour(time,cloud,lat,lon,context){
 const astro=solarMoon(time,lat,lon);
 const active=showerContext(time).primary||context.primary;
 const radiant=active?radiantAlt(time,lat,lon,active):null;
 const dark=astro.sunAlt<=-18?'dark':astro.sunAlt<=-12?'twilight':'bright';
 // Decision index ranks potential observing hours. It is NOT a probability or predicted meteor count.
 // Never score absent weather or daylight as a valid dark-sky opportunity.
 let score=null;
 if(cloud!==null&&dark!=='bright'){
  const cloudFactor=(1-cloud/100);
  const darkness=dark==='dark'?1:0.55;
  const moonFactor=astro.moonAlt>0?1-0.48*astro.moonIllum:1;
  const radiantFactor=radiant==null?0.65:0.3+0.7*clamp(Math.sin(radians(Math.max(0,radiant))),0,1);
  score=Math.round(100*cloudFactor*darkness*moonFactor*radiantFactor);
 }
 return {time:new Date(time).toISOString(),cloud,sky:dark,moonIllum:Math.round(astro.moonIllum*100),moonUp:astro.moonAlt>0,radiantAlt:radiant==null?null:Math.round(radiant),score};
}
function bestWindow(hours){
 const valid=hours.filter(x=>x.score!==null&&x.sky==='dark');
 return valid.sort((a,b)=>b.score-a.score)[0]||null;
}
function forecastWindows(periods,lat,lon,now){
 const start=Math.ceil(now/HOUR)*HOUR,context=showerContext(now);
 const hours=[];
 for(let n=0;n<72;n++){let t=start+n*HOUR;hours.push(gradeHour(t,skyAt(t,periods),lat,lon,context));}
 return {hours,best:bestWindow(hours),nearTerm:bestWindow(hours.filter(h=>Date.parse(h.time)<now+18*HOUR))};
}
const UA='ChrisIzworskiMeteorViewing/1.0 (https://chrisizworski.com/national-tools/meteor-shower/)';
async function loadJson(url){
 const response=await fetch(url,{headers:{'User-Agent':UA,Accept:'application/geo+json, application/json'},signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error('NWS '+response.status);
 return response.json();
}
async function nwsSky(lat,lon,now){
 const points=await loadJson('https://api.weather.gov/points/'+lat.toFixed(3)+','+lon.toFixed(3));
 const grid=points&&points.properties&&points.properties.forecastGridData;
 if(!grid||!/^https:\/\/api\.weather\.gov\/gridpoints\//.test(grid))throw new Error('NWS grid unavailable at this coordinate');
 const data=await loadJson(grid);
 const p=data&&data.properties;
 const updated=Date.parse(p?.updateTime||p?.validTimes?.split('/')?.[0]||'');
 const periods=normalizeSky(p?.skyCover?.values);
 // A stale, empty or inaccessible sky forecast must not be treated as clear.
 if(!periods.length||!Number.isFinite(updated)||now-updated>18*HOUR||updated>now+HOUR)
  throw new Error('NWS cloud forecast unavailable or stale');
 return {periods,updated:new Date(updated).toISOString(),timeZone:points.properties.timeZone||'UTC',office:points.properties.cwa||null};
}
function surrounding(lat,lon,miles){
 if(!miles)return [];
 const km=miles*1.609344,shift=km/111.2;
 return [{label:'North sample',lat:lat+shift,lon},{label:'East sample',lat,lon:lon+shift/Math.max(.2,Math.cos(radians(lat)))},
 {label:'South sample',lat:lat-shift,lon},{label:'West sample',lat,lon:lon-shift/Math.max(.2,Math.cos(radians(lat)))}]
 .filter(x=>x.lat>19&&x.lat<72&&x.lon>-180&&x.lon<-60).map(x=>({...x,lat:+x.lat.toFixed(3),lon:+x.lon.toFixed(3),miles}));
}
async function sample(loc,now){
 try{
  const source=await nwsSky(loc.lat,loc.lon,now);
  const forecast=forecastWindows(source.periods,loc.lat,loc.lon,now);
  return {...loc,available:true,updated:source.updated,timeZone:source.timeZone,office:source.office,best:forecast.best,nearTerm:forecast.nearTerm,hours:forecast.hours};
 }catch(e){return {...loc,available:false,reason:'Forecast unavailable (or outside NWS land grid)',best:null,hours:[]};}
}
async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=1200, stale-while-revalidate=600');
 res.setHeader('Access-Control-Allow-Origin','*');
 if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');return res.status(204).end();}
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 const lat=Number(req.query?.lat),lon=Number(req.query?.lon),radius=Number(req.query?.radius||0);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<19||lat>72||lon< -180||lon> -60||![0,40,80].includes(radius))
  return res.status(400).json({error:'Valid US coordinates and radius 0, 40, or 80 required'});
 const now=Date.now(),center={label:'Your forecast area',lat:+lat.toFixed(2),lon:+lon.toFixed(2)};
 const base=await sample(center,now);
 if(!base.available)return res.status(503).json({status:'unavailable',error:'A current NWS sky-cover forecast is not available here. No viewing verdict can be issued.',location:center,generatedAt:new Date(now).toISOString()});
 const near=radius?await Promise.all(surrounding(center.lat,center.lon,radius).map(p=>sample(p,now))):[];
 const shower=showerContext(now);
 return res.status(200).json({
  status:'ok',generatedAt:new Date(now).toISOString(),location:center,
  primary:shower.primary&&{name:shower.primary.name,id:shower.primary.id,idealPeakZhr:shower.primary.zhr,peakAt:shower.primary.peakAt},
  active:shower.active.map(s=>({name:s.name,id:s.id,idealPeakZhr:s.zhr,peakAt:s.peakAt})),
  upcoming:shower.next&&{name:shower.next.name,id:shower.next.id,peakAt:shower.next.peakAt,idealPeakZhr:shower.next.zhr},
  forecast:{updated:base.updated,office:base.office,timeZone:base.timeZone,hours:base.hours,best:base.best,nearTerm:base.nearTerm},
  nearby:near.map(x=>({label:x.label,lat:x.lat,lon:x.lon,miles:x.miles,available:x.available,updated:x.updated||null,best:x.best})),
  sources:{weather:'National Weather Service forecastGridData skyCover',shower:'International Meteor Organization visual meteor shower working list (seasonal reference)',astronomy:'Approximate solar, lunar and radiant geometry'},
  notes:['Sky score is a relative observing-conditions index, not a chance of seeing a meteor or predicted hourly count.','Nearby compass points sample NWS forecast grids, NOT legal viewing destinations or driving distances.','ZHR refers to ideal dark clear skies with the radiant at the zenith, not a local observation.','After 2026 peak dates represent approximate annual timing; meteor-shower maxima vary by year.']
 });
}
module.exports=handler;
module.exports._test={parsePeriod,normalizeSky,skyAt,showerContext,gradeHour,forecastWindows,surrounding,solarMoon};
