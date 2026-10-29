// Daily independent health audit. Refresh job absence/outage opens one GitHub issue.
// GitHub Actions workflow uses this output; no credentials are sent to visitors.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {evaluate}=require('../lib/gmn-health.js');
const snapshot=JSON.parse(await fs.readFile(new URL('../data/gmn-observed-flux.json',import.meta.url),'utf8'));
const token=process.env.GITHUB_TOKEN;
const repository=process.env.GITHUB_REPOSITORY||'izworskic/national-outdoor-tools-hub';
let runs=[],fetchError=null;
try{
 if(!token)throw Error('Missing GitHub Actions read token');
 const endpoint='https://api.github.com/repos/'+repository+'/actions/workflows/refresh-gmn-flux.yml/runs?per_page=30';
 const response=await fetch(endpoint,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('GitHub workflow history HTTP '+response.status);
 runs=(await response.json()).workflow_runs||[];
}catch(e){fetchError='Unable to verify refresh workflow execution: '+e.message;}
const audit=evaluate({snapshot,runs,now:Date.now()});
if(fetchError&&!audit.findings.includes(fetchError)){audit.findings.push(fetchError);audit.status='alert';}
await fs.writeFile('gmn-health-audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify(audit));
if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,
 '### GMN data pipeline health: '+audit.status+'\n'+
 '- Latest successful refresh: '+(audit.latestRun||'none')+'\n'+
 '- Source health: '+audit.sourceHealth+'; current samples: '+audit.freshMeasurements+'\n'+
 (audit.findings.length?audit.findings.map(x=>'- '+x).join('\n'):'- No active alerts')+'\n');
