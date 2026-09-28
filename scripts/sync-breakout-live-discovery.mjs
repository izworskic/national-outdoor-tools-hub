import fs from 'node:fs';

const file=process.env.NATIONAL_TOOLS_DIRECTORY_FILE||'public/national-tools/index.html';
let html=fs.readFileSync(file,'utf8');

const id='live-decisions';
const url='https://chrisizworski.com/national-tools/live-decisions/';
const name='Live Trip Decisions';
const card=`<article class="directory-card" data-search-card data-tool-id="${id}" data-personas="trip conditions event" data-tags="live trip decisions national parks road status sunrise river lake access current conditions zion glacier yellowstone yosemite rainier grand canyon haleakala acadia lake mead lake powell" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">Live decision collection</span><span class="season-label" hidden>Useful now</span></div><h3>${name}</h3><p class="place">Ten destination decisions · United States</p><p class="description">Roads close, rivers rise, clouds erase sunrises and low water changes access. Open the destination-specific live tool that answers the decision before you commit the drive.</p><p class="signals"><strong>Signals:</strong> NPS + USGS + NWS + Bureau of Reclamation source-backed checks</p><div class="card-actions"><a class="primary-action" href="/national-tools/live-decisions/">Open live trip decisions &rarr;</a></div></article>`;

html=html.replace(new RegExp(`<article class="directory-card"[^>]*data-tool-id="${id}"[\\s\\S]*?<\\/article>\\s*`,'g'),'');
const section=html.indexOf('<section class="catalog-group national-utilities"');
if(section<0) throw new Error('Live decisions discovery: national utilities section missing');
const grid=html.indexOf('<div class="catalog-grid">',section);
if(grid<0) throw new Error('Live decisions discovery: national utilities grid missing');
const insert=grid+'<div class="catalog-grid">'.length;
html=html.slice(0,insert)+'\n'+card+html.slice(insert);

const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const match=html.match(schemaRe);
if(!match) throw new Error('Live decisions discovery: JSON-LD missing');
const schema=JSON.parse(match[1]);
const graph=schema?.['@graph'];
const list=graph?.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
if(!list?.itemListElement) throw new Error('Live decisions discovery: ItemList missing');
list.itemListElement=list.itemListElement.filter(x=>x.url!==url);
list.itemListElement.unshift({'@type':'ListItem',position:1,url,name});
list.itemListElement.forEach((x,i)=>x.position=i+1);
list.numberOfItems=list.itemListElement.length;
const page=graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#page');
if(page) page.dateModified='2026-09-28';
html=html.replace(match[0],`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
const count=(html.match(/data-search-card/g)||[]).length;
html=html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/,`$1${count} tools shown$2`);
fs.writeFileSync(file,html,'utf8');
console.log(`Live decisions discovery synced | cards=${count} | structured=${list.numberOfItems}`);
