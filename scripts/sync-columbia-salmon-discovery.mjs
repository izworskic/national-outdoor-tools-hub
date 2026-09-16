import fs from 'node:fs';

const directoryFile='public/national-tools/index.html';
const route='/national-tools/columbia-salmon-run/';
const canonical=`https://chrisizworski.com${route}`;
const name='Columbia Salmon Run Live';

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
  throw new Error('Columbia salmon discovery: structured tool list not found');
}

function addCard(html){
  if(html.includes('data-tool-id="columbia-salmon"'))return html;
  const anchor='data-tool-id="grand-coulee"';
  const start=html.indexOf(anchor);
  if(start<0)throw new Error('Columbia salmon discovery: Grand Coulee anchor missing');
  const end=html.indexOf('</article>',start);
  if(end<0)throw new Error('Columbia salmon discovery: Grand Coulee card end missing');
  const at=end+'</article>'.length;
  const card=`\n<article class="directory-card" data-search-card data-tool-id="columbia-salmon" data-personas="trip conditions event" data-tags="columbia river salmon fish counts bonneville the dalles john day mcnary fall chinook coho steelhead migration fish ladder pacific northwest pnw washington oregon" data-months="3,4,5,6,7,8,9,10,11"><div class="card-top"><span class="kind">Live salmon migration</span><span class="season-label" hidden>In season now</span></div><h3>Columbia Salmon Run Live</h3><p class="place">Columbia River · Oregon &amp; Washington</p><p class="description">See current adult salmon counts at Bonneville, The Dalles, John Day and McNary, then read the seven-day Chinook, Coho and steelhead direction without turning the run into a fake probability.</p><p class="signals"><strong>Signals:</strong> Fish Passage Center daily counts + USACE fish-count methods and run timing</p><div class="card-actions"><a class="primary-action" href="${route}">Columbia River salmon counts today &rarr;</a></div></article>`;
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
if(!built.includes('data-tool-id="columbia-salmon"')||!built.includes(`href="${route}"`))throw new Error('Columbia salmon discovery card not installed');
console.log('Columbia Salmon Run Live discovery installed in national directory.');
