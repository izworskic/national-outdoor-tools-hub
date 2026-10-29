// Safe, scheduled snapshot import. Enable ONLY after verifying an official GMN
// machine-readable file whose columns are calibrated optical flux measurements.
// The public GMN camera_tally.txt files contain counts/exposure, not flux.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {publishedCache,view}=require('../lib/gmn-observed-activity.js');
const file=new URL('../data/gmn-observed-flux.json',import.meta.url);
const source=process.env.GMN_FLUX_SOURCE_URL||'';
if(!source){console.log('GMN measured-flux source not verified: import disabled; keeping unavailable cache');process.exit(0);}
if(!/^https:\/\/globalmeteornetwork\.org\/flux\/.+\.json(?:\?.*)?$/.test(source)){
 console.error('Refusing unverified GMN source: require official HTTPS flux JSON file');
 process.exitCode=1;
}else{
 try{
  const response=await fetch(source,{headers:{Accept:'application/json','User-Agent':'ChrisIzworskiMeteorTool/1.0 (https://chrisizworski.com/national-tools/meteor-shower/)'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('GMN HTTP '+response.status);
  const size=Number(response.headers.get('content-length')||0);
  if(size>2000000)throw Error('GMN source exceeds 2 MB limit');
  const raw=await response.text();if(raw.length>2000000)throw Error('GMN source exceeds 2 MB limit');
  const incoming=JSON.parse(raw);
  const next=publishedCache(incoming.observations,source,new Date().toISOString());
  const status=view(next,Date.now());
  if(status.status!=='ok')throw Error('No current calibrated GMN flux values, preserving last good cache');
  await fs.writeFile(file,JSON.stringify(next,null,2)+'\n');
  console.log('GMN calibrated flux cache refreshed:',status.observations.length,'active records, newest',status.lastGoodAt);
 }catch(e){console.error('GMN refresh failed; preserving previous cache:',e.message);process.exitCode=1;}
}
