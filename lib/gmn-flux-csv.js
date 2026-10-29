'use strict';
// Global Meteor Network calibrated optical meteor flux (not trajectory counts).
// Sources: https://globalmeteornetwork.org/flux/csv/ and RMS Utils/FluxAuto.py saveBatchFluxCSV.
// GMN publishes Flux@+6.5M in meteors per 1,000 km^2 per hour, with 95% confidence bounds.
// A bin's reported mean solar longitude is in J2000 coordinates. Convert to an
// approximate UTC bin-center time; the file does NOT provide an exact UTC timestamp.
const DAY=86400000, BASE='https://globalmeteornetwork.org/flux/csv/';
const SPECS=Object.freeze({
 STA:[190,230],NTA:[217,241],ORI:[198,225],LEO:[224,245],
 GEM:[256,266],URS:[269,272],QUA:[281,285],LYR:[30,34],
 ETA:[30,66],SDA:[114,145],PER:[123,147],DRA:[192,197]
});
const UNIT='meteors/1000 km2/hour (+6.5 mag)';
function fileUrl(code,year){
 const span=SPECS[code];
 if(!span||!Number.isInteger(year)||year<2020||year>2100)throw Error('Unsupported shower or year');
 return BASE+'flux_'+code+'_sol='+span.map(x=>x.toFixed(2)).join('-')+'_year_'+year+'.csv';
}
function solarLongitudeJ2000(unixMs){
 const jd=unixMs/DAY+2440587.5,t=(jd-2451545)/36525;
 const l0=(280.46646+t*(36000.76983+0.0003032*t))%360;
 const m=(357.52911+t*(35999.05029-0.0001537*t))*Math.PI/180;
 const c=Math.sin(m)*(1.914602-t*(0.004817+0.000014*t))+
  Math.sin(2*m)*(0.019993-0.000101*t)+Math.sin(3*m)*0.000289;
 return (l0+c-1.397*t+360)%360;
}
function solarLongitudeToUtc(sol,year){
 if(!Number.isFinite(sol)||sol<0||sol>=360||!Number.isInteger(year))throw Error('Invalid mean solar longitude');
 // Jan-Feb showers (solar longitude >= 280 degrees) are in the year after equinox.
 const equinoxYear=sol>=280?year-1:year;
 let t=Date.UTC(equinoxYear,2,20,12)+(sol/0.9856)*DAY;
 for(let n=0;n<6;n++){
  const error=((solarLongitudeJ2000(t)-sol+540)%360)-180;
  t-=error/0.9856*DAY;
 }
 return new Date(t).toISOString();
}
function parseFluxCsv(raw,code,year){
 if(typeof raw!=='string'||raw.length<100||raw.length>2_000_000)throw Error('Invalid GMN CSV size');
 const lines=raw.trim().split(/\r?\n/);
 if(!lines.some(x=>new RegExp('^#\\s*Shower\\s*=\\s*'+code+'\\s*$').test(x)))throw Error('Wrong GMN shower in source');
 const header=lines.find(x=>x.startsWith('# Sol bin start (deg),'));
 if(!header||!header.includes('Flux@+6.5M (met / 1000 km^2 h)')||!header.includes('Mean Sol (deg)'))throw Error('Flux CSV column contract changed');
 const columns=header.slice(2).split(',').map(x=>x.trim());
 const idxFlux=columns.indexOf('Flux@+6.5M (met / 1000 km^2 h)');
 const idxMean=columns.indexOf('Mean Sol (deg)');
 const idxLow=columns.indexOf('Flux CI low');
 const idxHigh=columns.indexOf('Flux CI high');
 const idxCount=columns.indexOf('Meteor Count');
 if([idxFlux,idxMean,idxLow,idxHigh,idxCount].some(x=>x<0))throw Error('Missing calibrated flux columns');
 const rows=[];
 for(const line of lines){
  if(!/^\d/.test(line))continue;
  const c=line.split(',').map(x=>x.trim());
  if(c.length!==columns.length)continue;
  const flux=Number(c[idxFlux]),mean=Number(c[idxMean]),low=Number(c[idxLow]),high=Number(c[idxHigh]),count=Number(c[idxCount]);
  if(c[idxFlux]===''||c[idxMean]===''||c[idxLow]===''||c[idxHigh]===''||c[idxCount]==='')continue;
  if(![flux,mean,low,high,count].every(Number.isFinite)||flux<0||low<0||high<flux||low>flux||count<1||count>1e8)continue;
  const observedAt=solarLongitudeToUtc(mean,year);
  rows.push({iauCode:code,flux,unit:UNIT,observedAt,confidenceLow:low,confidenceHigh:high,
    sourceFile:fileUrl(code,year),meteorCount:count,timeBasis:'approximate bin center derived from GMN mean solar longitude (J2000)'});
 }
 rows.sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
 return rows;
}
module.exports={BASE,SPECS,UNIT,fileUrl,solarLongitudeJ2000,solarLongitudeToUtc,parseFluxCsv};
