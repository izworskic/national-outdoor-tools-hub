import fs from 'node:fs';

const directory=fs.readFileSync('public/national-tools/index.html','utf8');
const region=fs.readFileSync('public/national-tools/northeast-great-lakes/index.html','utf8');
const url='https://chrisizworski.com/duluth-canal-park/';

const regionAt=directory.indexOf('id="region-northeast-great-lakes"');
const nextRegion=directory.indexOf('class="catalog-group region-cluster"',regionAt+1);
const regionSlice=directory.slice(regionAt,nextRegion>regionAt?nextRegion:directory.length);
const checks=[
  ['directory card',directory.includes('data-tool-id="duluth-canal-park"')],
  ['correct regional placement',regionSlice.includes('data-tool-id="duluth-canal-park"')],
  ['canonical href',directory.includes(url)],
  ['regional decision card',region.includes('data-duluth-national') && region.includes('Duluth ship passage window')],
  ['regional canonical handoff',region.includes(url)]
];

for(const [label,pass] of checks){if(!pass)throw new Error(`Duluth national discovery failed: ${label}`);}

const dirSchema=JSON.parse(directory.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const dirList=dirSchema['@graph'].find(x=>x['@id']==='https://chrisizworski.com/national-tools/#toollist');
if(!dirList?.itemListElement?.some(x=>x.url===url))throw new Error('Duluth missing from national ItemList');
if(dirList.numberOfItems!==dirList.itemListElement.length)throw new Error('National ItemList count mismatch');

const regionSchema=JSON.parse(region.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const regionList=regionSchema['@graph'].find(x=>x['@id']==='https://chrisizworski.com/national-tools/northeast-great-lakes/#tools');
if(!regionList?.itemListElement?.some(x=>x.url===url))throw new Error('Duluth missing from Northeast Great Lakes ItemList');
if(regionList.numberOfItems!==regionList.itemListElement.length)throw new Error('Regional ItemList count mismatch');

console.log('Duluth national discovery verified.');
