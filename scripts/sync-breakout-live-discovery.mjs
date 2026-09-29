import fs from 'node:fs';
import path from 'node:path';

const file=process.env.NATIONAL_TOOLS_DIRECTORY_FILE||'public/national-tools/index.html';
let html=fs.readFileSync(file,'utf8');
const core=path.resolve('node_modules','@izworskic','national-outdoor-core');
const geography=JSON.parse(fs.readFileSync(path.join(core,'config','breakout-live-geography.json'),'utf8'));
const pages=JSON.parse(fs.readFileSync(path.join(core,'config','breakout-live-pages.json'),'utf8'));
const portfolio=JSON.parse(fs.readFileSync(path.join(core,'benchmarks','breakout-live-portfolio.json'),'utf8'));
const candidates=new Map(portfolio.candidates.map(x=>[x.id,x]));
const coreIds=geography.regions.flatMap(r=>r.toolIds);
const KILAUEA={
  id:'kilauea-live',name:'Kīlauea Live',place:'Hawaiʻi Volcanoes National Park · Hawaiʻi',kind:'Live volcano decision',
  tags:'kilauea volcano hawaii eruption lava national park live viewing hvo nps weather air quality',
  description:'See what the summit is doing now, whether the view is worth the trip, and which public viewpoint best fits the current conditions.',
  decision:'Is Kīlauea worth going to right now, and which viewpoint fits the conditions?'
};
const ids=[...coreIds,KILAUEA.id];
const urlFor=id=>`https://chrisizworski.com/national-tools/${id}/`;
const nameOf=id=>id===KILAUEA.id?KILAUEA.name:pages[id].title.replace(/ \| Chris Izworski$/,'');

function card(id){
  if(id===KILAUEA.id){
    return `<article class="directory-card" data-search-card data-tool-id="${id}" data-personas="trip conditions" data-tags="live destination decision ${KILAUEA.tags}" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">${KILAUEA.kind}</span><span class="season-label" hidden>Useful now</span></div><h3>${KILAUEA.name}</h3><p class="place">${KILAUEA.place}</p><p class="description">${KILAUEA.description}</p><p class="signals"><strong>Decision:</strong> ${KILAUEA.decision}</p><div class="card-actions"><a class="primary-action" href="/national-tools/${id}/">Open live decision &rarr;</a></div></article>`;
  }
  const p=pages[id], meta=geography.tools[id]||{}, c=candidates.get(id)||{};
  if(!p) throw new Error(`Live decisions discovery: page config missing for ${id}`);
  return `<article class="directory-card" data-search-card data-tool-id="${id}" data-personas="trip conditions" data-tags="live destination decision ${meta.tags||''}" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">${meta.kind||'Live destination decision'}</span><span class="season-label" hidden>Useful now</span></div><h3>${nameOf(id)}</h3><p class="place">${meta.place||'United States'}</p><p class="description">${p.description}</p><p class="signals"><strong>Decision:</strong> ${c.primaryDecision||p.h1}</p><div class="card-actions"><a class="primary-action" href="/national-tools/${id}/">Open live decision &rarr;</a></div></article>`;
}

for(const id of ['live-decisions',...ids]) html=html.replace(new RegExp(`<article class="directory-card"[^>]*data-tool-id="${id}"[\\s\\S]*?<\\/article>\\s*`,'g'),'');
const section=html.indexOf('<section class="catalog-group national-utilities"');
if(section<0) throw new Error('Live decisions discovery: national utilities section missing');
const grid=html.indexOf('<div class="catalog-grid">',section);
if(grid<0) throw new Error('Live decisions discovery: national utilities grid missing');
const insert=grid+'<div class="catalog-grid">'.length;
html=html.slice(0,insert)+'\n'+ids.map(card).join('\n')+html.slice(insert);

const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const match=html.match(schemaRe);
if(!match) throw new Error('Live decisions discovery: JSON-LD missing');
const schema=JSON.parse(match[1]);
const graph=schema?.['@graph'];
const list=graph?.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
if(!list?.itemListElement) throw new Error('Live decisions discovery: ItemList missing');
const liveUrls=new Set(['https://chrisizworski.com/national-tools/live-decisions/',...ids.map(urlFor)]);
list.itemListElement=list.itemListElement.filter(x=>!liveUrls.has(x.url));
for(const id of ids) list.itemListElement.push({'@type':'ListItem',position:0,url:urlFor(id),name:nameOf(id)});
list.itemListElement.forEach((x,i)=>x.position=i+1);
list.numberOfItems=list.itemListElement.length;
const page=graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#page');
if(page) page.dateModified='2026-09-28';
html=html.replace(match[0],`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
const count=(html.match(/data-search-card/g)||[]).length;
html=html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/,`$1${count} tools shown$2`);
fs.writeFileSync(file,html,'utf8');

const collectionFile=path.join('public','national-tools','live-decisions','index.html');
if(!fs.existsSync(collectionFile)) throw new Error('Live decisions discovery: geographic collection page missing');
let collection=fs.readFileSync(collectionFile,'utf8');
const kilaueaCard=`<a class="decision-link-card" href="/national-tools/kilauea-live/"><span>${KILAUEA.place}</span><strong>${KILAUEA.name}</strong><small>${KILAUEA.decision}</small></a>`;
collection=collection.replace(/<a class="decision-link-card" href="\/national-tools\/kilauea-live\/">[\s\S]*?<\/a>/g,'');
const hawaiiRe=/(<section class="decision-region"><div class="decision-region-head"><p class="eyebrow">Hawaii<\/p>[\s\S]*?<div class="decision-link-grid">)([\s\S]*?)(<\/div><\/section>)/;
if(!hawaiiRe.test(collection)) throw new Error('Live decisions discovery: Hawaii region missing from collection page');
collection=collection.replace(hawaiiRe,(_,open,body,close)=>`${open}${body}${kilaueaCard}${close}`);
const collectionSchemaMatch=collection.match(schemaRe);
if(!collectionSchemaMatch) throw new Error('Live decisions discovery: collection JSON-LD missing');
const collectionSchema=JSON.parse(collectionSchemaMatch[1]);
const collectionList=collectionSchema?.['@graph']?.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/live-decisions/#list');
if(!collectionList?.itemListElement) throw new Error('Live decisions discovery: collection ItemList missing');
collectionList.itemListElement=collectionList.itemListElement.filter(x=>x.url!==urlFor(KILAUEA.id));
collectionList.itemListElement.push({'@type':'ListItem',position:0,url:urlFor(KILAUEA.id),name:KILAUEA.name});
collectionList.itemListElement.forEach((x,i)=>x.position=i+1);
collectionList.numberOfItems=collectionList.itemListElement.length;
const collectionPage=collectionSchema?.['@graph']?.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/live-decisions/#page');
if(collectionPage) collectionPage.dateModified='2026-09-28';
collection=collection.replace(collectionSchemaMatch[0],`<script type="application/ld+json">${JSON.stringify(collectionSchema)}</script>`);
if((collection.match(/href="\/national-tools\/kilauea-live\/"/g)||[]).length!==1) throw new Error('Live decisions discovery: Kilauea collection card must be unique');
fs.writeFileSync(collectionFile,collection,'utf8');

console.log(`Live destination discovery synced | destination cards=${ids.length} | directory cards=${count} | structured=${list.numberOfItems} | collection=${collectionList.numberOfItems}`);
