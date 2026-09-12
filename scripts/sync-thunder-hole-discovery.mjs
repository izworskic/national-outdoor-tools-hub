import fs from 'node:fs';

const file=process.env.NATIONAL_TOOLS_DIRECTORY_FILE || 'public/national-tools/index.html';
const url='https://chrisizworski.com/national-tools/thunder-hole-live/';
const name='Thunder Hole Live: Best Time to Hear the Boom';
let html=fs.readFileSync(file,'utf8');

// Keep this transform narrow and idempotent: discovery only, never tool logic.
html=html.replace(/<article class="directory-card"[^>]*data-tool-id="thunder-hole"[\s\S]*?<\/article>\s*/g,'');

const regionMarker='id="region-northeast-great-lakes"';
const regionAt=html.indexOf(regionMarker);
if(regionAt<0)throw new Error('Thunder Hole discovery: Northeast & Great Lakes region missing');
const gridAt=html.indexOf('<div class="catalog-grid">',regionAt);
if(gridAt<0)throw new Error('Thunder Hole discovery: Northeast catalog grid missing');
const insertAt=gridAt+'<div class="catalog-grid">'.length;
const card=`\n<article class="directory-card" data-search-card data-tool-id="thunder-hole" data-personas="trip conditions event" data-tags="thunder hole acadia maine bar harbor northeast great lakes tide high tide ocean waves surf boom spray national park" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">Live ocean timing</span><span class="season-label" hidden>Useful now</span></div><h3>Thunder Hole Live</h3><p class="place">Acadia National Park · Maine</p><p class="description">See when Bar Harbor tide timing and offshore wave energy line up for the best chance of hearing Thunder Hole boom, with confidence and park-safety context kept separate.</p><p class="signals"><strong>Signals:</strong> NOAA tides + NDBC waves + NWS weather and alerts + NPS guidance</p><div class="card-actions"><a class="primary-action" href="${url}">Best time for Thunder Hole today &rarr;</a></div></article>`;
html=html.slice(0,insertAt)+card+html.slice(insertAt);

const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const match=html.match(schemaRe);
if(!match)throw new Error('Thunder Hole discovery: directory JSON-LD missing');
const schema=JSON.parse(match[1]);
const graph=schema?.['@graph'];
const list=graph?.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
if(!list?.itemListElement)throw new Error('Thunder Hole discovery: ItemList missing');
list.itemListElement=list.itemListElement.filter(item=>item.url!==url);
list.itemListElement.push({'@type':'ListItem',position:list.itemListElement.length+1,url,name});
list.itemListElement.forEach((item,index)=>item.position=index+1);
list.numberOfItems=list.itemListElement.length;
const page=graph.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#page');
if(page)page.dateModified='2026-09-12';
html=html.replace(match[0],`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

const cardCount=(html.match(/data-search-card/g)||[]).length;
html=html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/,`$1${cardCount} tools shown$2`);
fs.writeFileSync(file,html,'utf8');
console.log(`Thunder Hole discovery synced | cards=${cardCount} | structured=${list.numberOfItems}`);
