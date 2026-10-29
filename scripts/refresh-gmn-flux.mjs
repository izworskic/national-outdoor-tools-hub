// Official GMN calibrated optical flux CSV ingest. Scheduled GitHub Actions job.
// No visitor request contacts GMN. Never derive a flux from raw meteor tally data.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {publishedCache,view,FRESH_MS}=require('../lib/gmn-observed-activity.js');
const {BASE,fileUrl,parseFluxCsv}=require('../lib/gmn-flux-csv.js');
const {showerContext}=require('../api/meteor-viewing.js')._test;
const cacheFile=new URL('../data/gmn-observed-flux.json',import.meta.url);
const USER_AGENT='ChrisIzworskiMeteorFlux/1.0 (https://chrisizworski.com/national-tools/meteor-shower/)';
const LIMIT=2_000_000;
function maxIso(...dates){return dates.filter(x=>x&&Number.isFinite(Date.parse(x))).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||null;}
async function retrieveCsv(code,year,fetcher=fetch){
 const source=fileUrl(code,year);
 const response=await fetcher(source,{headers:{Accept:'text/csv, text/plain, application/octet-stream', 'User-Agent':USER_AGENT},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('GMN HTTP '+response.status+' for '+code);
 const reportedSize=Number(response.headers.get('content-length')||0);
 if(reportedSize>LIMIT)throw Error('GMN flux CSV exceeds 2 MB');
 const text=await response.text();
 if(text.length>LIMIT)throw Error('GMN flux CSV exceeds 2 MB');
 return parseFluxCsv(text,code,year);
}
export async function refresh({now=Date.now(),fetcher=fetch,cachePath=cacheFile}={}){
 // cachePath is injectable so the scheduled import can be regression-tested without editing production data.
 const previous=JSON.parse(await fs.readFile(cachePath,'utf8'));
 const active=showerContext(now).active; // SAME IMO windows as meteor viewing engine.
 const good=[],errors=[];
 let sourceResponses=0;
 for(const s of active){
  const year=new Date(s.peakAt).getUTCFullYear(); // cross-year Quadrantids.
  try{
   const records=await retrieveCsv(s.id,year,fetcher);
   sourceResponses++;
   const recent=records.find(r=>now-Date.parse(r.observedAt)>=-10*60*1000&&now-Date.parse(r.observedAt)<=FRESH_MS);
   if(recent)good.push(recent);
   else errors.push(s.id+': no complete flux bin inside 48-hour freshness window');
  }catch(e){errors.push(s.id+': '+e.message);}
 }
 let next;
 if(good.length){
  next=publishedCache(good,BASE,new Date(now).toISOString());
  next.status='ok';
  next.lastGoodAt=maxIso(previous.lastGoodAt,next.lastGoodAt);
 }else{
  next={version:1,source:BASE,refreshedAt:new Date(now).toISOString(),
   status:active.length?'unavailable':'no-active',
   lastGoodAt:maxIso(previous.lastGoodAt,...(previous.observations||[]).map(x=>x.observedAt)),observations:[]};
 }
 // Source availability and measurement freshness are separate properties.
 next.sourceHealth=!active.length?'no-active':good.length?'observed':sourceResponses?'no-current-bin':'source-unavailable';
 const safeView=view(next,now);
 if(!good.length&&safeView.observations.length)throw Error('Fail-closed invariant: unavailable data exposed');
 const before=JSON.stringify({...previous,refreshedAt:null});
 const after=JSON.stringify({...next,refreshedAt:null});
 if(before!==after)await fs.writeFile(cachePath,JSON.stringify(next,null,2)+'\n');
 console.log('GMN CSV ingest:',active.map(s=>s.id).join(',')||'no active showers',good.length+' fresh flux bins',errors.join('; ')||'no source errors', 'newest '+(safeView.lastGoodAt||'none'));
 // GitHub Actions annotations + summary distinguish GMN downtime from legitimate unpublished shower files.
 if(process.env.GITHUB_STEP_SUMMARY){
  const line='GMN flux: **'+next.sourceHealth+'**; active '+(active.map(s=>s.id).join(', ')||'none')+'; fresh '+good.length+'; last measured '+(safeView.lastGoodAt||'none')+'; source notices: '+(errors.join(' | ')||'none')+'\n';
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,line);
 }
 if(active.length&&!good.length)console.warn('::warning::GMN flux unavailable for currently active showers: '+next.sourceHealth);
 return {active:active.map(s=>s.id),good:good.length,sourceHealth:next.sourceHealth,errors,latest:safeView.lastGoodAt};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 refresh().catch(e=>{console.error('GMN CSV ingest failed safely:',e.message);process.exitCode=1;});
}
