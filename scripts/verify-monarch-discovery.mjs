import fs from 'node:fs';

const file='public/national-tools/index.html';
const html=fs.readFileSync(file,'utf8');
const routing=fs.readFileSync('vercel.json','utf8');
const url='https://chrisizworski.com/national-tools/monarch-migration-live';
const healthyOrigin='https://monarch-migration-live.vercel.app/national-tools/monarch-migration-live';
const brokenOrigin='monarch-migration-live-k7om.vercel.app';

const checks=[
  ['canonical Monarch URL is present', html.includes(url)],
  ['single Monarch catalog card', (html.match(/data-tool-id="monarch"/g)||[]).length===1],
  ['Event persona filter is present', html.includes('data-filter="event"')],
  ['Monarch directory entry is present', html.includes('Monarch Migration Live')],
  ['Monarch source line is present', html.includes('Licensed iNaturalist records + NWS weather + published migration timing + GBIF history')],
  ['Monarch uses verified healthy Vercel origin', routing.includes(healthyOrigin)],
  ['broken Monarch k7om origin is absent', !routing.includes(brokenOrigin)]
];

const schemaMatch=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
let schemaHasMonarch=false;
if(schemaMatch){
  try{
    const data=JSON.parse(schemaMatch[1]);
    const list=data?.['@graph']?.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
    schemaHasMonarch=Boolean(list?.itemListElement?.some(x=>x?.url===url));
  }catch{}
}
checks.push(['schema includes Monarch',schemaHasMonarch]);

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(failed.length) process.exit(1);
