import fs from 'node:fs';

const directoryFile='public/national-tools/index.html';
const appalachiaFile='public/national-tools/appalachia/index.html';
const route='/blue-ridge-parkway/';
const canonical=`https://chrisizworski.com${route}`;
const name='Blue Ridge Parkway Today & Route Planner';
const toolId='blue-ridge-parkway-live';

function updateDirectorySchema(html){
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
      if(page)page.dateModified='2026-09-24';
      return html.slice(0,match.index)+`<script type="application/ld+json">${JSON.stringify(data)}</script>`+html.slice(match.index+match[0].length);
    }catch{}
  }
  throw new Error('Blue Ridge Parkway discovery: structured tool list not found');
}

function addDirectoryCard(html){
  if(html.includes(`data-tool-id="${toolId}"`))return html;
  const seasonalToken='data-tool-id="blue-ridge-fall-color"';
  const seasonalAt=html.indexOf(seasonalToken);
  if(seasonalAt<0)throw new Error('Blue Ridge Parkway discovery: seasonal Blue Ridge anchor missing');
  const insertAt=html.lastIndexOf('<article class="directory-card"',seasonalAt);
  if(insertAt<0)throw new Error('Blue Ridge Parkway discovery: seasonal card start missing');
  const card=`<article class="directory-card" data-search-card data-tool-id="${toolId}" data-personas="trip conditions" data-tags="blue ridge parkway road closures open today scenic drive route planner asheville boone blowing rock roanoke floyd waynesboro cherokee overlooks weather waterfalls hiking photography sunset north carolina virginia appalachia appalachian mountains" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">Live route decision</span><span class="season-label" hidden>Useful now</span></div><h3>${name}</h3><p class="place">Blue Ridge Parkway · Virginia &amp; North Carolina</p><p class="description">Start with where you are and the hours you actually have. The planner checks current NPS road status and mountain weather, removes broken routes, then builds a realistic Parkway drive with stops that earn the time.</p><p class="signals"><strong>Signals:</strong> NPS road status + NWS mountain weather + route-time model</p><div class="card-actions"><a class="primary-action" href="${route}">Which Parkway section is worth driving today? &rarr;</a></div></article>\n`;
  return html.slice(0,insertAt)+card+html.slice(insertAt);
}

function updateFinderCount(html){
  const count=(html.match(/data-tool-id="/g)||[]).length;
  return html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/,`$1${count} tools shown$2`);
}

function updateAppalachiaSchema(html){
  const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  while((match=schemaRe.exec(html))){
    try{
      const data=JSON.parse(match[1]);
      const graph=data?.['@graph'];
      if(!Array.isArray(graph))continue;
      const list=graph.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/appalachia/#tools');
      if(!list?.itemListElement)continue;
      const filtered=list.itemListElement.filter(x=>String(x?.url||'')!==canonical);
      const fallIndex=filtered.findIndex(x=>String(x?.url||'').includes('/fall-color/blue-ridge-parkway/'));
      const item={'@type':'ListItem',position:0,url:canonical,name};
      if(fallIndex>=0)filtered.splice(fallIndex,0,item);else filtered.push(item);
      filtered.forEach((x,i)=>x.position=i+1);
      list.itemListElement=filtered;
      list.numberOfItems=filtered.length;
      const page=graph.find(x=>x?.['@type']==='CollectionPage');
      if(page)page.description='Regional outdoor decision tools for Appalachia and the Ohio Valley, including live Parkway route planning.';
      return html.slice(0,match.index)+`<script type="application/ld+json">${JSON.stringify(data)}</script>`+html.slice(match.index+match[0].length);
    }catch{}
  }
  throw new Error('Blue Ridge Parkway discovery: Appalachia schema not found');
}

function addAppalachiaCard(html){
  if(html.includes('data-blue-ridge-parkway-live="true"'))return html;
  const fallHeading='<h3>Blue Ridge Parkway Fall Color</h3>';
  const fallAt=html.indexOf(fallHeading);
  if(fallAt<0)throw new Error('Blue Ridge Parkway discovery: Appalachia fall-color card missing');
  const insertAt=html.lastIndexOf('<article class="tool-card">',fallAt);
  if(insertAt<0)throw new Error('Blue Ridge Parkway discovery: Appalachia tool-card anchor missing');
  const card=`<article class="tool-card" data-blue-ridge-parkway-live="true"><span class="kind">Live route decision</span><h3>Blue Ridge Parkway Today &amp; Route Planner</h3><p class="place">Blue Ridge Parkway · Virginia &amp; North Carolina</p><p>Choose a gateway, departure time and the hours you have. The planner checks official road status and ridge weather first, removes unusable sections, then builds a drive around stops that fit the day.</p><p class="why"><strong>Best for:</strong> visitors deciding which Parkway section is actually worth driving today instead of starting from a generic list of overlooks.</p><p class="sources">NPS road status + NWS mountain weather + route-time model</p><a class="action" href="${route}">Build a Parkway drive</a></article>\n`;
  return html.slice(0,insertAt)+card+html.slice(insertAt);
}

function updateAppalachiaCopy(html){
  return html
    .replace('Live and seasonal outdoor decision tools for Appalachia and the Ohio Valley: Gauley River releases, Cumberland Falls moonbows and Blue Ridge Parkway fall-color timing.','Live and seasonal outdoor decision tools for Appalachia and the Ohio Valley: Gauley River releases, Cumberland Falls moonbows, Blue Ridge Parkway route planning and fall-color timing.')
    .replace('A regional decision desk for Gauley releases, Cumberland Falls moonbows and Blue Ridge Parkway fall color.','A regional decision desk for Gauley releases, Cumberland Falls moonbows, Blue Ridge Parkway route planning and fall color.')
    .replace('Three very different trips share the same problem: the experience changes dramatically with timing.','Four very different trip decisions share the same problem: the useful answer changes dramatically with timing and conditions.')
    .replace('Gauley whitewater, Cumberland moonbows and mountain fall color each depend on different data.','Gauley whitewater, Cumberland moonbows, Parkway driving and mountain fall color each depend on different data.');
}

let directory=fs.readFileSync(directoryFile,'utf8');
directory=updateDirectorySchema(directory);
directory=addDirectoryCard(directory);
directory=updateFinderCount(directory);
fs.writeFileSync(directoryFile,directory);

let appalachia=fs.readFileSync(appalachiaFile,'utf8');
appalachia=updateAppalachiaSchema(appalachia);
appalachia=addAppalachiaCard(appalachia);
appalachia=updateAppalachiaCopy(appalachia);
fs.writeFileSync(appalachiaFile,appalachia);

const builtDirectory=fs.readFileSync(directoryFile,'utf8');
const builtAppalachia=fs.readFileSync(appalachiaFile,'utf8');
if(!builtDirectory.includes(`data-tool-id="${toolId}"`)||!builtDirectory.includes(`href="${route}"`))throw new Error('Blue Ridge Parkway discovery: year-round directory card not installed');
if(!builtAppalachia.includes('data-blue-ridge-parkway-live="true"')||!builtAppalachia.includes(`href="${route}"`))throw new Error('Blue Ridge Parkway discovery: Appalachia handoff not installed');
console.log('Blue Ridge Parkway year-round planner discovery installed in national directory and Appalachia desk.');
