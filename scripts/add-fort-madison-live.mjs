import fs from 'node:fs';

const landingFile='public/national-tools/index.html';
const waterFile='public/national-tools/water/index.html';
const url='https://chrisizworski.com/national-tools/fort-madison-live/';
const name='Fort Madison Live: Trains, Barges & Swing Bridge Openings';

let html=fs.readFileSync(landingFile,'utf8');

// Keep the CollectionPage ItemList accurate and give Fort Madison one canonical owner.
const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let match;
while((match=schemaRe.exec(html))){
  try{
    const data=JSON.parse(match[1]);
    const graph=data?.['@graph'];
    if(!Array.isArray(graph)) continue;
    const list=graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
    if(!list?.itemListElement) continue;
    list.itemListElement=list.itemListElement.filter(x=>!String(x?.url||'').includes('/fort-madison-live'));
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

// Rebuild Fort Madison discovery surfaces idempotently on every deploy.
html=html.replace(/<li><a href="[^"]*fort-madison-live[^"]*">[\s\S]*?<\/li>/gi,'');
html=html.replace(/<article class="feature-card"[^>]*data-tags="[^"]*fort madison[^"]*"[\s\S]*?<\/article>\s*/gi,'');
html=html.replace(/<article class="tool-card"[^>]*data-tags="[^"]*fort madison[^"]*"[\s\S]*?<\/article>/gi,'');

const melvinIntent='<li><a href="https://chrisizworski.com/national-tools/melvin-price-live/">Time a Melvin Price Locks visit<span>Live tow queue, lock activity, Mississippi flow and stage, AIS vessels, weather, free tour timing and a go-now visitor outlook</span></a></li>';
if(!html.includes(melvinIntent)) throw new Error('Fort Madison discovery: Melvin water-intent anchor missing');
const intent=`<li><a href="${url}">See what reaches Fort Madison next<span>Identified trains, named Mississippi tows, Southwest Chief timing, river stage and predicted swing-bridge interaction</span></a></li>`;
html=html.replace(melvinIntent,`${melvinIntent}${intent}`);

const featureAnchor='<article class="feature-card" data-tags="water locks ships vessels salmon fish tides seattle tourism camera"';
const featureIndex=html.indexOf(featureAnchor);
if(featureIndex<0) throw new Error('Fort Madison discovery: featured Ballard anchor missing');
const feature=`<article class="feature-card" data-tags="fort madison iowa mississippi river bridge swing bridge trains railroad rail bnsf amtrak southwest chief barges tow vessels transportation railfan" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="feature-kicker">Mississippi River · Iowa</div><h3><a href="${url}">Fort Madison Live</a></h3><p>See what is approaching the Fort Madison swing bridge next. The tool reconciles identified rail movements, named commercial tows, Southwest Chief timing, river stage and modeled bridge-opening windows into one live event view.</p><div class="signal-line">USACE LPMS + NOAA/NWPS + Amtrak + licensed rail observations</div><a class="tool-cta" href="${url}">Open Fort Madison Live &rarr;</a></article>\n`;
html=html.slice(0,featureIndex)+feature+html.slice(featureIndex);

const waterGrid='<section class="library-group" data-library-group="water"><h2>Water and river tools</h2>';
const waterStart=html.indexOf(waterGrid);
if(waterStart<0) throw new Error('Fort Madison discovery: water library missing');
const gridStart=html.indexOf('<div class="tool-grid">',waterStart);
if(gridStart<0) throw new Error('Fort Madison discovery: water grid missing');
const insertAt=gridStart+'<div class="tool-grid">'.length;
const card=`<article class="tool-card" data-search-card data-tags="fort madison iowa mississippi river bridge swing bridge trains railroad rail bnsf amtrak southwest chief barges tow vessels transportation railfan" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="tk">Live crossing intelligence<span class="tk-season" hidden> / useful now</span></div><div class="tool-title"><a href="${url}">Fort Madison Live: Trains, Barges &amp; Swing Bridge Openings</a></div><div class="tool-desc">Track the next rail, tow and bridge event at Fort Madison with named tow candidates, Southwest Chief timing, river stage, truth-labeled freight observations and modeled cross-system interaction.</div></article>`;
html=html.slice(0,insertAt)+card+html.slice(insertAt);
fs.writeFileSync(landingFile,html);

let water=fs.readFileSync(waterFile,'utf8');
water=water.replace(/<a class="card tool-card"[^>]*data-tags="[^"]*fort madison[^"]*"[\s\S]*?<\/a>/gi,'');
water=water.replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/,'"dateModified":"2026-09-10"');
const waterAnchor='<div class="grid">';
if(!water.includes(waterAnchor)) throw new Error('Fort Madison discovery: water hub grid missing');
const waterCard=`<a class="card tool-card" data-tags="fort madison iowa mississippi river swing bridge trains bnsf amtrak barges tows" href="${url}"><div class="tool-kicker">Rail + river convergence · Iowa</div><h3>Fort Madison Live</h3><p>See what reaches the Fort Madison swing bridge next by combining rail identity, Southwest Chief timing, named commercial tows, river stage and predicted bridge-opening windows.</p></a>`;
water=water.replace(waterAnchor,`${waterAnchor}${waterCard}`);
fs.writeFileSync(waterFile,water);

console.log('Fort Madison Live added to national landing and water hub.');
