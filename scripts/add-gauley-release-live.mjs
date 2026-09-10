import fs from 'node:fs';

const landingFile='public/national-tools/index.html';
const waterFile='public/national-tools/water/index.html';
const url='https://chrisizworski.com/national-tools/gauley-release-live/';
const name='Gauley Release Live: Follow the Summersville Dam Release';

let html=fs.readFileSync(landingFile,'utf8');

// Keep the CollectionPage ItemList accurate and give Gauley one canonical owner.
const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let match;
while((match=schemaRe.exec(html))){
  try{
    const data=JSON.parse(match[1]);
    const graph=data?.['@graph'];
    if(!Array.isArray(graph)) continue;
    const list=graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
    if(!list?.itemListElement) continue;
    list.itemListElement=list.itemListElement.filter(x=>!String(x?.url||'').includes('/gauley-release-live'));
    list.itemListElement.push({'@type':'ListItem',position:list.itemListElement.length+1,url,name});
    list.itemListElement.forEach((x,i)=>x.position=i+1);
    list.numberOfItems=list.itemListElement.length;
    const page=graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#page');
    if(page) page.dateModified='2026-09-10';
    const replacement=`<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    html=html.slice(0,match.index)+replacement+html.slice(match.index+match[0].length);
    break;
  }catch{}
}

// Rebuild all Gauley discovery surfaces idempotently.
html=html.replace(/<li><a href="[^"]*gauley-release-live[^"]*">[\s\S]*?<\/li>/gi,'');
html=html.replace(/<article class="feature-card"[^>]*data-tags="[^"]*gauley[^"]*"[\s\S]*?<\/article>\s*/gi,'');
html=html.replace(/<article class="tool-card"[^>]*data-tags="[^"]*gauley[^"]*"[\s\S]*?<\/article>/gi,'');

const melvinIntent='<li><a href="https://chrisizworski.com/national-tools/melvin-price-live/">Time a Melvin Price Locks visit<span>Live tow queue, lock activity, Mississippi flow and stage, AIS vessels, weather, free tour timing and a go-now visitor outlook</span></a></li>';
if(!html.includes(melvinIntent)) throw new Error('Gauley discovery: Melvin water-intent anchor missing');
const intent=`<li><a href="${url}">Follow a Gauley dam release<span>Track the Summersville Dam release pulse, modeled rapid arrival windows, effective flow, weather, access and Gauley Fest context</span></a></li>`;
html=html.replace(melvinIntent,`${melvinIntent}${intent}`);

const featureAnchor='<article class="feature-card" data-tags="water locks ships vessels salmon fish tides seattle tourism camera"';
const featureIndex=html.indexOf(featureAnchor);
if(featureIndex<0) throw new Error('Gauley discovery: featured Ballard anchor missing');
const feature=`<article class="feature-card" data-tags="gauley west virginia water river whitewater rafting release summersville dam rapids pillow rock lost paddle gauley fest" data-months="9,10"><div class="feature-kicker">Gauley River · West Virginia</div><h3><a href="${url}">Gauley Release Live</a></h3><p>Follow the controlled release from Summersville Dam through the Gauley Gorge. See release status, modeled arrival windows at major rapids, effective flow, weather and current-season access context.</p><div class="signal-line">USACE + USGS + NWS + release-wave model</div><a class="tool-cta" href="${url}">Open Gauley Release Live &rarr;</a></article>\n`;
html=html.slice(0,featureIndex)+feature+html.slice(featureIndex);

const waterGrid='<section class="library-group" data-library-group="water"><h2>Water and river tools</h2>';
const waterStart=html.indexOf(waterGrid);
if(waterStart<0) throw new Error('Gauley discovery: water library missing');
const gridStart=html.indexOf('<div class="tool-grid">',waterStart);
if(gridStart<0) throw new Error('Gauley discovery: water grid missing');
const insertAt=gridStart+'<div class="tool-grid">'.length;
const card=`<article class="tool-card" data-search-card data-tags="gauley west virginia water river whitewater rafting release summersville dam rapids pillow rock lost paddle gauley fest" data-months="9,10"><div class="tk">Live release intelligence<span class="tk-season" hidden> / Gauley season</span></div><div class="tool-title"><a href="${url}">Gauley Release Live: Follow the Water</a></div><div class="tool-desc">Track the Summersville Dam release pulse downstream with observed hydrology, modeled rapid arrival windows, effective-flow context, weather and official access information.</div></article>`;
html=html.slice(0,insertAt)+card+html.slice(insertAt);
fs.writeFileSync(landingFile,html);

let water=fs.readFileSync(waterFile,'utf8');
water=water.replace(/<a class="card tool-card"[^>]*data-tags="[^"]*gauley[^"]*"[\s\S]*?<\/a>/gi,'');
water=water.replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/,'"dateModified":"2026-09-10"');
const waterAnchor='<div class="grid">';
if(!water.includes(waterAnchor)) throw new Error('Gauley discovery: water hub grid missing');
const waterCard=`<a class="card tool-card" data-tags="gauley west virginia whitewater rafting release summersville dam" href="${url}"><div class="tool-kicker">Controlled river release · West Virginia</div><h3>Gauley Release Live</h3><p>Follow the release pulse from Summersville Dam downstream. Combine observed USGS/USACE hydrology with modeled arrival windows at major rapids, weather, flow context and official access information.</p></a>`;
water=water.replace(waterAnchor,`${waterAnchor}${waterCard}`);
fs.writeFileSync(waterFile,water);

console.log('Gauley Release Live added to national landing and water hub.');
