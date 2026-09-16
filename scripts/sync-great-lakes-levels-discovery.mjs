import fs from 'node:fs';

const file=process.env.NATIONAL_TOOLS_DIRECTORY_FILE || 'public/national-tools/index.html';
const url='https://greatlakeslevels.org/';
const name='Great Lakes Levels';
let html=fs.readFileSync(file,'utf8');

// Keep this transform narrow and idempotent: discovery only, never tool logic.
html=html.replace(/<article class="directory-card"[^>]*data-tool-id="great-lakes-levels"[\s\S]*?<\/article>\s*/g,'');

const regionMarker='id="region-northeast-great-lakes"';
const regionAt=html.indexOf(regionMarker);
if(regionAt<0)throw new Error('Great Lakes Levels discovery: Northeast & Great Lakes region missing');
const gridAt=html.indexOf('<div class="catalog-grid">',regionAt);
if(gridAt<0)throw new Error('Great Lakes Levels discovery: Northeast catalog grid missing');
const insertAt=gridAt+'<div class="catalog-grid">'.length;
const card=`\n<article class="directory-card" data-search-card data-tool-id="great-lakes-levels" data-personas="conditions trip" data-tags="great lakes lake superior michigan huron erie ontario water level shoreline erosion ohwm ordinary high water mark seiche storm property owner riparian northeast great lakes" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">Live lake intelligence</span><span class="season-label" hidden>Useful now</span></div><h3>Great Lakes Levels</h3><p class="place">Great Lakes shoreline · U.S. &amp; Canada</p><p class="description">Read current lake levels against long-term context, then check shoreline erosion exposure, OHWM context, storm and seiche risk, and the six-month outlook for the five Great Lakes and supported sub-regions.</p><p class="signals"><strong>Signals:</strong> NOAA water levels + USACE/GLERL historical context + shoreline guidance</p><div class="card-actions"><a class="primary-action" href="${url}">Great Lakes water levels and shoreline outlook &rarr;</a></div></article>`;
html=html.slice(0,insertAt)+card+html.slice(insertAt);

const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const match=html.match(schemaRe);
if(!match)throw new Error('Great Lakes Levels discovery: directory JSON-LD missing');
const schema=JSON.parse(match[1]);
const graph=schema?.['@graph'];
const list=graph?.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
if(!list?.itemListElement)throw new Error('Great Lakes Levels discovery: ItemList missing');
list.itemListElement=list.itemListElement.filter(item=>item.url!==url);
list.itemListElement.push({'@type':'ListItem',position:list.itemListElement.length+1,url,name});
list.itemListElement.forEach((item,index)=>item.position=index+1);
list.numberOfItems=list.itemListElement.length;
const page=graph.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#page');
if(page)page.dateModified='2026-09-16';
html=html.replace(match[0],`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

const cardCount=(html.match(/data-search-card/g)||[]).length;
html=html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/,`$1${cardCount} tools shown$2`);
fs.writeFileSync(file,html,'utf8');
console.log(`Great Lakes Levels discovery synced | cards=${cardCount} | structured=${list.numberOfItems}`);
