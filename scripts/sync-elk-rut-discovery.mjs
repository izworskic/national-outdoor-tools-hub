import fs from 'node:fs';

const path='public/national-tools/index.html';
let html=fs.readFileSync(path,'utf8');

const card=`<article class="directory-card" data-search-card data-tool-id="elk-rut" data-personas="trip conditions event" data-tags="rocky mountain national park colorado elk rut bugling moraine park horseshoe park upper beaver meadows kawuneeche harbison wildlife fall september october" data-months="9,10"><div class="card-top"><span class="kind">Live wildlife timing</span><span class="season-label" hidden>In season now</span></div><h3>Rocky Mountain Elk Rut Live</h3><p class="place">Rocky Mountain National Park · Colorado</p><p class="description">Compare tonight's dusk and tomorrow's dawn rut windows using seasonal elk timing, solar geometry, live NWS weather and the park's 2026 timed-entry rules.</p><p class="audience">For wildlife watchers, photographers and fall visitors deciding exactly when and where to go.</p><p class="signals"><strong>Signals:</strong> NPS rut guidance + sunrise/sunset + NWS hourly weather + timed entry + meadow closures</p><div class="card-actions"><a class="primary-action" href="https://chrisizworski.com/national-tools/elk-rut/">Best time to see and hear elk in RMNP &rarr;</a></div></article>`;

if(!html.includes('data-tool-id="elk-rut"')){
  const marker='<article class="directory-card" data-search-card data-tool-id="ballard-locks"';
  if(!html.includes(marker)) throw new Error('Ballard insertion marker missing');
  html=html.replace(marker,`${card}\n${marker}`);
}

const visibleCards=(html.match(/data-search-card/g)||[]).length;
html=html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+( tools shown<\/p>)/, `$1${visibleCards}$2`);

const schemaRe=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const schemaMatch=html.match(schemaRe);
if(!schemaMatch) throw new Error('National directory JSON-LD missing');
const schema=JSON.parse(schemaMatch[1]);
const list=schema?.['@graph']?.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
if(!list) throw new Error('National directory ItemList missing');

const elkUrl='https://chrisizworski.com/national-tools/elk-rut/';
if(!list.itemListElement.some(item=>item.url===elkUrl)){
  list.itemListElement.push({
    '@type':'ListItem',
    position:list.itemListElement.length+1,
    url:elkUrl,
    name:'Rocky Mountain Elk Rut Live'
  });
}
list.itemListElement.forEach((item,index)=>{ item.position=index+1; });
list.numberOfItems=list.itemListElement.length;
html=html.replace(schemaRe,`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

fs.writeFileSync(path,html,'utf8');
console.log(`Elk rut discovery synchronized | cards=${visibleCards} | structured=${list.numberOfItems}`);
