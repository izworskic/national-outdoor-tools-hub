import fs from 'node:fs';

const file='public/national-tools/index.html';
const url='https://chrisizworski.com/national-tools/monarch-migration-live';
let html=fs.readFileSync(file,'utf8');
let changed=false;

const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let match;
while((match=schemaRe.exec(html))){
  try{
    const data=JSON.parse(match[1]);
    const graph=data?.['@graph'];
    if(!Array.isArray(graph)) continue;
    const list=graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
    if(!list?.itemListElement) continue;
    if(!list.itemListElement.some(x=>x?.url===url)){
      list.itemListElement.push({'@type':'ListItem',position:list.itemListElement.length+1,url,name:'Monarch Migration Live: Butterfly Migration Intelligence'});
      list.itemListElement.forEach((x,i)=>x.position=i+1);
      list.numberOfItems=list.itemListElement.length;
      const page=graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#page');
      if(page) page.dateModified='2026-09-09';
      const replacement=`<script type="application/ld+json">${JSON.stringify(data)}</script>`;
      html=html.slice(0,match.index)+replacement+html.slice(match.index+match[0].length);
      changed=true;
    }
    break;
  }catch{}
}

const wildlifeIntentStart='<article class="intent-card"><div class="intent-kicker">Wildlife</div><h3>Time a major wildlife migration</h3><ul>';
const wildlifeIntentIndex=html.indexOf(wildlifeIntentStart);
if(wildlifeIntentIndex<0) throw new Error('Monarch discovery: wildlife intent anchor missing');
const wildlifeIntentEnd=html.indexOf('</ul></article>',wildlifeIntentIndex);
if(wildlifeIntentEnd<0) throw new Error('Monarch discovery: wildlife intent end missing');
const wildlifeIntentSlice=html.slice(wildlifeIntentIndex,wildlifeIntentEnd);
if(!wildlifeIntentSlice.includes(url)){
  const item=`<li><a href="${url}">Track the Monarch migration<span>Recent licensed observations, migration timing, flight weather, Great Lakes concentration context and local habitat timing</span></a></li>`;
  html=html.slice(0,wildlifeIntentEnd)+item+html.slice(wildlifeIntentEnd);
  changed=true;
}

if(!html.includes('data-monarch-feature="true"')){
  const featureGrid='<div class="feature-grid">';
  const gridIndex=html.indexOf(featureGrid);
  if(gridIndex<0) throw new Error('Monarch discovery: feature grid missing');
  const insertFeature=gridIndex+featureGrid.length;
  const feature=`<article class="feature-card" data-monarch-feature="true" data-tags="wildlife butterflies butterfly monarch migration pollinators milkweed great lakes michigan fall spring nature travel weather sightings" data-months="3,4,5,6,7,8,9,10,11"><div class="feature-kicker">Monarch Butterflies · North America</div><h3><a href="${url}">Monarch Migration Live</a></h3><p>See whether Monarch migration is active near you, how current sightings compare with recent records, whether flight weather is helping movement, and where Great Lakes shorelines may concentrate southbound butterflies.</p><div class="signal-line">Licensed iNaturalist records + NWS weather + published migration timing + GBIF history</div><a class="tool-cta" href="${url}">Open Monarch Migration Live &rarr;</a></article>\n`;
  html=html.slice(0,insertFeature)+feature+html.slice(insertFeature);
  changed=true;
}

const wildlifeLibraryStart='<section class="library-group" data-library-group="wildlife">';
const wildlifeLibraryIndex=html.indexOf(wildlifeLibraryStart);
if(wildlifeLibraryIndex<0) throw new Error('Monarch discovery: wildlife library anchor missing');
const wildlifeLibraryEnd=html.indexOf('</div></section>',wildlifeLibraryIndex);
if(wildlifeLibraryEnd<0) throw new Error('Monarch discovery: wildlife library end missing');
const wildlifeLibrarySlice=html.slice(wildlifeLibraryIndex,wildlifeLibraryEnd);
if(!wildlifeLibrarySlice.includes(url)){
  const card=`<article class="tool-card" data-search-card data-tags="wildlife butterflies butterfly monarch migration pollinators milkweed great lakes michigan fall spring nature travel weather sightings" data-months="3,4,5,6,7,8,9,10,11"><div class="tk">Live migration intelligence<span class="tk-season" hidden> / useful now</span></div><div class="tool-title"><a href="${url}">Monarch Migration Live: Butterfly Migration Intelligence</a></div><div class="tool-desc">Recent commercially reusable Monarch observations, published northbound and southbound timing, live NWS flight weather, historical occurrence context, Great Lakes concentration context and phase-aware habitat guidance. Observation records and modeled Migration Pulse remain explicitly separate.</div></article>`;
  html=html.slice(0,wildlifeLibraryEnd)+card+html.slice(wildlifeLibraryEnd);
  changed=true;
}

if(!html.includes('data-filter="wildlife"')){
  const autumnChip='<button class="chip" type="button" data-filter="fall">Autumn</button>';
  const chipIndex=html.indexOf(autumnChip);
  if(chipIndex<0) throw new Error('Monarch discovery: filter chip anchor missing');
  const wildlifeChip='<button class="chip" type="button" data-filter="wildlife">Wildlife</button>';
  html=html.slice(0,chipIndex+autumnChip.length)+wildlifeChip+html.slice(chipIndex+autumnChip.length);
  changed=true;
}

fs.writeFileSync(file,html);
console.log(`Monarch national discovery ${changed?'applied':'already present'}.`);
