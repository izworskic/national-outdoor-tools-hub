import fs from 'node:fs';

const file='public/national-tools/index.html';
const url='https://chrisizworski.com/national-tools/platte-crane-live';
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
      list.itemListElement.push({'@type':'ListItem',position:list.itemListElement.length+1,url,name:'Platte Crane Live: Nebraska Sandhill Crane Migration Intelligence'});
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

if(!html.includes(`href="${url}"`)){
  const featureAnchor='<section class="featured-tools"';
  const featureIndex=html.indexOf(featureAnchor);
  if(featureIndex<0) throw new Error('Platte Crane discovery: featured section anchor missing');
  const wildlifeIntent=`<article class="intent-card"><div class="intent-kicker">Wildlife</div><h3>Time a major wildlife migration</h3><ul><li><a href="${url}">See Nebraska’s Sandhill Crane migration<span>Official crane surveys, modeled migration state, river conditions, weather, public viewing sites and historical timing</span></a></li></ul></article>\n`;
  html=html.slice(0,featureIndex)+wildlifeIntent+html.slice(featureIndex);

  const featureGrid='<div class="feature-grid">';
  const gridIndex=html.indexOf(featureGrid,featureIndex+wildlifeIntent.length);
  if(gridIndex<0) throw new Error('Platte Crane discovery: feature grid missing');
  const insertFeature=gridIndex+featureGrid.length;
  const feature=`<article class="feature-card" data-tags="wildlife birds birding migration sandhill cranes nebraska platte river kearney grand island gibbon rowe sanctuary weather river tourism" data-months="2,3,4"><div class="feature-kicker">Sandhill Cranes · Nebraska</div><h3><a href="${url}">Platte Crane Live</a></h3><p>Decide whether Nebraska’s Sandhill Crane migration is worth the trip with official Crane Trust surveys, a clearly labeled between-survey model, Platte River conditions, movement weather, public viewing guidance and historical timing.</p><div class="signal-line">Crane Trust + USGS + NOAA/NWS + historical migration climatology</div><a class="tool-cta" href="${url}">Open Platte Crane Live &rarr;</a></article>\n`;
  html=html.slice(0,insertFeature)+feature+html.slice(insertFeature);

  const topicAnchor='<section class="topic-hubs"';
  const topicIndex=html.indexOf(topicAnchor);
  if(topicIndex<0) throw new Error('Platte Crane discovery: topic hubs anchor missing');
  const library=`<section class="library-group" data-library-group="wildlife"><h2>Wildlife and migration tools</h2><p class="group-blurb">Specialist tools for timing major wildlife events using live conditions, official observations and historical seasonal context.</p><div class="tool-grid"><article class="tool-card" data-search-card data-tags="wildlife birds birding migration sandhill cranes nebraska platte river kearney grand island gibbon rowe sanctuary weather river travel tourism" data-months="2,3,4"><div class="tk">Live migration intelligence<span class="tk-season" hidden> / useful now</span></div><div class="tool-title"><a href="${url}">Platte Crane Live: Nebraska Sandhill Crane Migration</a></div><div class="tool-desc">Official surveys first, modeled abundance second, plus river conditions, movement weather, public viewing sites, dawn and dusk planning, and historical peak timing. The model never masquerades as a live bird count.</div></article></div></section>\n`;
  html=html.slice(0,topicIndex)+library+html.slice(topicIndex);
  changed=true;
}

fs.writeFileSync(file,html);
console.log(`Platte Crane national discovery ${changed?'applied':'already present'}.`);
