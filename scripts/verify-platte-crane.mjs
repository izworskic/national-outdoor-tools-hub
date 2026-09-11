import fs from 'node:fs';

const file='public/national-tools/index.html';
const url='https://chrisizworski.com/national-tools/platte-crane-live';
const html=fs.readFileSync(file,'utf8');

const checks=[
  ['canonical link',html.includes(`href="${url}"`)],
  ['tool name',html.includes('Platte Crane Live')],
  ['single catalog card',(html.match(/data-tool-id="platte-cranes"/g)||[]).length===1],
  ['data-source line',html.includes('Crane Trust + USGS + NOAA/NWS')]
];

const schemaMatch=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
let schemaHasPlatte=false;
if(schemaMatch){
  try{
    const data=JSON.parse(schemaMatch[1]);
    const graph=data?.['@graph'];
    const list=Array.isArray(graph)?graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist'):null;
    schemaHasPlatte=!!list?.itemListElement?.some(x=>x?.url===url);
  }catch{}
}
checks.push(['structured data',schemaHasPlatte]);

const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length){
  throw new Error(`Platte Crane national hub verification failed: ${failed.join(', ')}`);
}
console.log('Platte Crane national hub verification passed.');
