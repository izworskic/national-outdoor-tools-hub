import fs from 'node:fs';

const DIRECTORY=process.env.NATIONAL_TOOLS_DIRECTORY_FILE || 'public/national-tools/index.html';
const REGION='public/national-tools/northeast-great-lakes/index.html';
const URL='https://chrisizworski.com/duluth-canal-park/';
const NAME='Duluth Ship Schedule Today & Canal Park Live Cams';
const ID='duluth-canal-park';

function patchDirectory(){
  let html=fs.readFileSync(DIRECTORY,'utf8');

  // One canonical card only. This page is a discovery surface, never a duplicate product.
  html=html.replace(new RegExp(`<article class="directory-card"[^>]*data-tool-id="${ID}"[\\s\\S]*?<\\/article>\\s*`,'g'),'');

  const regionMarker='id="region-northeast-great-lakes"';
  const regionAt=html.indexOf(regionMarker);
  if(regionAt<0)throw new Error('Duluth discovery: Northeast & Great Lakes region missing');
  const gridAt=html.indexOf('<div class="catalog-grid">',regionAt);
  if(gridAt<0)throw new Error('Duluth discovery: Northeast & Great Lakes catalog grid missing');
  const insertAt=gridAt+'<div class="catalog-grid">'.length;
  const card=`\n<article class="directory-card" data-search-card data-tool-id="${ID}" data-personas="trip conditions event" data-tags="duluth canal park lake superior minnesota superior wisconsin aerial lift bridge ship schedule ships freighters lakers live ais vessel map webcams cameras boat watching great lakes northeast great lakes" data-months="3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">Live ship watch</span><span class="season-label" hidden>Useful now</span></div><h3>${NAME}</h3><p class="place">Duluth Canal Park · Minnesota</p><p class="description">See which supported ship matters next, its Aerial Lift Bridge passage window, live AIS position, mapped camera network, and the best Canal Park viewing spots.</p><p class="signals"><strong>Signals:</strong> live AIS + supported passage windows + mapped live cameras + visitor viewing guidance</p><div class="card-actions"><a class="primary-action" href="${URL}">Watch Duluth ships live &rarr;</a></div></article>`;
  html=html.slice(0,insertAt)+card+html.slice(insertAt);

  const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const match=html.match(schemaRe);
  if(!match)throw new Error('Duluth discovery: directory JSON-LD missing');
  const schema=JSON.parse(match[1]);
  const graph=schema?.['@graph'];
  const list=graph?.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
  if(!list?.itemListElement)throw new Error('Duluth discovery: directory ItemList missing');
  list.itemListElement=list.itemListElement.filter(item=>item.url!==URL && item.name!==NAME);
  list.itemListElement.push({'@type':'ListItem',position:list.itemListElement.length+1,url:URL,name:NAME});
  list.itemListElement.forEach((item,index)=>item.position=index+1);
  list.numberOfItems=list.itemListElement.length;
  const page=graph.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#page');
  if(page)page.dateModified='2026-09-25';
  html=html.replace(match[0],`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

  const cardCount=(html.match(/data-search-card/g)||[]).length;
  html=html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/,`$1${cardCount} tools shown$2`);
  fs.writeFileSync(DIRECTORY,html,'utf8');
  return {cardCount,structured:list.numberOfItems};
}

function patchRegion(){
  let html=fs.readFileSync(REGION,'utf8');

  html=html.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="Live Great Lakes and Northeast decision tools for Duluth ship watching, Great Lakes levels, Niagara rainbow timing and Thunder Hole conditions.">');
  html=html.replace(/<meta property="og:description" content="[^"]*">/,'<meta property="og:description" content="Live ship watching, shoreline intelligence and short viewing windows from Duluth and the Great Lakes to Niagara Falls and Acadia.">');

  const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const match=html.match(schemaRe);
  if(!match)throw new Error('Duluth discovery: Northeast regional JSON-LD missing');
  const schema=JSON.parse(match[1]);
  const graph=schema?.['@graph'];
  const collection=graph?.find(item=>item?.['@type']==='CollectionPage');
  if(collection)collection.description='Regional outdoor decision tools for Duluth ship watching, Great Lakes shoreline conditions, Niagara Falls viewing geometry and Thunder Hole tide-and-wave timing.';
  const list=graph?.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/northeast-great-lakes/#tools');
  if(!list?.itemListElement)throw new Error('Duluth discovery: Northeast regional ItemList missing');
  list.itemListElement=list.itemListElement.filter(item=>item.url!==URL);
  list.itemListElement.unshift({'@type':'ListItem',position:1,url:URL,name:NAME});
  list.itemListElement.forEach((item,index)=>item.position=index+1);
  list.numberOfItems=list.itemListElement.length;
  html=html.replace(match[0],`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

  html=html.replace(/<p class="hero-lede">[\s\S]*?<\/p>/,'<p class="hero-lede">Four big-water decisions belong together here: when the next Duluth ship may reach the Aerial Lift Bridge, what Great Lakes levels mean for the shoreline, when Niagara\'s sun and mist can make a rainbow, and when tide plus offshore wave energy can make Thunder Hole worth the timing.</p>');
  html=html.replace(/<aside class="hero-aside">[\s\S]*?<\/aside>/,'<aside class="hero-aside"><strong>Big water, different decisions.</strong><p>This page does not average ship movement, lake levels, sunlight and ocean surf into one score. Pick the system you care about, then use the specialist tool for the live decision.</p></aside>');
  html=html.replace(/<div class="now-head">[\s\S]*?<\/div>\s*<div class="signal-grid">/,'<div class="now-head"><div><p class="eyebrow">What to check first</p><h2 id="now-title">Start with the thing that can change the trip.</h2></div><p>Ship movement, water level, sun geometry and tide-wave timing operate on different clocks. The regional desk keeps those clocks separate and gets you to the useful answer quickly.</p></div>\n<div class="signal-grid">');

  html=html.replace(/<div class="signal" data-duluth-national>[\s\S]*?<\/div>\s*/g,'');
  const signalGrid='<div class="signal-grid">';
  const signalAt=html.indexOf(signalGrid);
  if(signalAt<0)throw new Error('Duluth discovery: regional signal grid missing');
  const signal=`\n<div class="signal" data-duluth-national><span class="signal-kicker">Ship-watching decision</span><strong>Duluth ship passage window</strong><p>See the best-supported next vessel watch, where the ship is now, when it may reach the Aerial Lift Bridge, which camera to open, and where to stand in Canal Park.</p><a href="${URL}">Watch Duluth ships live →</a></div>`;
  html=html.slice(0,signalAt+signalGrid.length)+signal+html.slice(signalAt+signalGrid.length);

  html=html.replace(/<article class="tool-card" data-duluth-national>[\s\S]*?<\/article>\s*/g,'');
  const toolGrid='<div class="tool-grid">';
  const toolAt=html.indexOf(toolGrid);
  if(toolAt<0)throw new Error('Duluth discovery: regional tool grid missing');
  const tool=`\n<article class="tool-card" data-duluth-national><span class="kind">Live ship watch</span><h3>${NAME}</h3><p class="place">Duluth Canal Park · Minnesota</p><p>Turn live AIS into a visitor decision: which supported vessel matters next, its likely Aerial Lift Bridge passage window, where it is on the map, which of the mapped cameras can show it, and the best public viewing spots around Canal Park.</p><p class="why"><strong>Best for:</strong> ship watchers and Duluth visitors deciding whether to head to the canal now, wait, or use a live camera instead.</p><p class="sources">Live AIS + deterministic passage support + mapped camera network + Canal Park viewing guidance</p><a class="action" href="${URL}">Open Duluth Canal Park Live</a></article>`;
  html=html.slice(0,toolAt+toolGrid.length)+tool+html.slice(toolAt+toolGrid.length);

  html=html.replace('This network is useful because its three decisions peak for different reasons through the year rather than depending on one short tourism event.','This network is useful because its four decisions peak for different reasons through the year rather than depending on one short tourism event.');
  html=html.replace('Great Lakes wind, seiche and erosion exposure become more consequential as storms strengthen; Niagara daylight shifts lower and Atlantic systems can change Thunder Hole wave energy quickly.','Great Lakes shipping remains active into late fall while stronger wind, seiche and erosion exposure matter more along the shoreline; Niagara daylight shifts lower and Atlantic systems can change Thunder Hole wave energy quickly.');

  fs.writeFileSync(REGION,html,'utf8');
  return {regionItems:list.numberOfItems};
}

const directory=patchDirectory();
const region=patchRegion();
console.log(`Duluth Canal Park national discovery synced | cards=${directory.cardCount} | directoryStructured=${directory.structured} | regionStructured=${region.regionItems}`);
