import fs from 'node:fs';

const directoryFile='public/national-tools/index.html';
const route='/national-tools/bird-migration/';
const canonical=`https://chrisizworski.com${route}`;
const name='Bird Migration Morning Index';

function updateSchema(html){
  const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  while((match=schemaRe.exec(html))){
    try{
      const data=JSON.parse(match[1]);
      const graph=data?.['@graph'];
      if(!Array.isArray(graph))continue;
      const list=graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
      if(!list?.itemListElement)continue;
      const prior=list.itemListElement.find(x=>String(x?.url||'')===canonical);
      if(prior)prior.name=name;
      else list.itemListElement.push({'@type':'ListItem',position:list.itemListElement.length+1,url:canonical,name});
      list.itemListElement.forEach((x,i)=>x.position=i+1);
      list.numberOfItems=list.itemListElement.length;
      const page=graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#page');
      if(page)page.dateModified='2026-09-16';
      return html.slice(0,match.index)+`<script type="application/ld+json">${JSON.stringify(data)}</script>`+html.slice(match.index+match[0].length);
    }catch{}
  }
  throw new Error('Bird migration discovery: structured tool list not found');
}

function addCard(html){
  if(html.includes('data-tool-id="bird-migration"'))return html;
  const anchor='data-tool-id="monarch"';
  const start=html.indexOf(anchor);
  if(start<0)throw new Error('Bird migration discovery: Monarch anchor missing');
  const end=html.indexOf('</article>',start);
  if(end<0)throw new Error('Bird migration discovery: Monarch card end missing');
  const at=end+'</article>'.length;
  const card=`\n<article class="directory-card" data-search-card data-tool-id="bird-migration" data-personas="conditions event trip" data-tags="bird birds birding migration birdcast ebird radar nocturnal morning fallout warblers thrushes sparrows hotspot sightings weather near me united states" data-months="3,4,5,6,8,9,10,11"><div class="card-top"><span class="kind">Live bird migration</span><span class="season-label" hidden>In season now</span></div><h3>Bird Migration Morning Index</h3><p class="place">United States</p><p class="description">See whether birds moved over your area overnight, what species have recent local reports, where reporting is active and whether the morning weather is workable.</p><p class="signals"><strong>Signals:</strong> BirdCast radar + eBird recent reports when available + NWS hourly weather</p><div class="card-actions"><a class="primary-action" href="${route}">Bird migration near me &rarr;</a></div></article>`;
  return html.slice(0,at)+card+html.slice(at);
}

function updateFinderCount(html){
  const count=(html.match(/data-tool-id="/g)||[]).length;
  return html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/,`$1${count} tools shown$2`);
}

let html=fs.readFileSync(directoryFile,'utf8');
html=updateSchema(html);
html=addCard(html);
html=updateFinderCount(html);
fs.writeFileSync(directoryFile,html,'utf8');

const built=fs.readFileSync(directoryFile,'utf8');
if(!built.includes('data-tool-id="bird-migration"')||!built.includes(`href="${route}"`))throw new Error('Bird migration discovery card not installed');
console.log('Bird Migration Morning Index discovery installed in national directory.');
