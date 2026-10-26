import fs from 'node:fs';
const path='public/national-tools/index.html';
let html=fs.readFileSync(path,'utf8');
const id='data-tool-id="meteor-viewing"';
if(!html.includes(id)){
 const start=html.indexOf('data-tool-id="aurora"');
 const end=start<0?-1:html.indexOf('</article>',start);
 if(end<0)throw new Error('Cannot locate Aurora catalog card; meteor discovery not inserted');
 const card='<article class="directory-card" data-search-card data-tool-id="meteor-viewing" data-personas="conditions event trip" data-tags="meteor shower meteors shooting stars tonight geminids perseids orionids quadrantids moon darkness clouds astrophotography stargazing sky" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">Live sky viewing</span><span class="season-label" hidden>Useful year-round</span></div><h3>Meteor Shower Tonight</h3><p class="place">United States</p><p class="description">Find your best 72-hour meteor viewing window and compare nearby NWS cloud forecasts instead of relying on a shower peak date alone.</p><p class="signals"><strong>Signals:</strong> NWS sky cover + astronomical darkness + moonlight + shower calendar</p><div class="card-actions"><a class="primary-action" href="/national-tools/meteor-shower/">Check meteor skies &rarr;</a></div></article>';
 html=html.slice(0,end+10)+'\n'+card+html.slice(end+10);
}

const skyId='data-tool-id="great-lakes-dark-sky"';
if(!html.includes(skyId)){
 const start=html.indexOf('data-tool-id="meteor-viewing"');
 const end=start<0?-1:html.indexOf('</article>',start);
 if(end<0)throw new Error('Meteor card missing; cannot add Great Lakes dark sky discovery');
 const card='<article class="directory-card" data-search-card data-tool-id="great-lakes-dark-sky" data-personas="trip conditions event" data-tags="dark sky parks dark skies michigan wisconsin minnesota ontario stargazing headlands keweenaw lawless newport voyageurs wilderness preserve milky way orionids meteor shower astronomy" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">Viewing destination planner</span><span class="season-label" hidden>Year-round sky planning</span></div><h3>Great Lakes Dark Sky Explorer</h3><p class="place">Great Lakes · United States and Ontario</p><p class="description">Explore designated dark-sky parks and make an informed go-or-wait decision with hourly clouds, moonlight, local access notes and park-by-park comparisons.</p><p class="signals"><strong>Signals:</strong> NWS hourly sky cover + sun and moon position + meteor season + official access sources</p><div class="card-actions"><a class="primary-action" href="/national-tools/dark-sky/">Explore dark-sky parks &rarr;</a></div></article>';
 html=html.slice(0,end+10)+'\n'+card+html.slice(end+10);
}


const oldDarkSkyAction='<div class="card-actions"><a class="primary-action" href="/national-tools/dark-sky/">Explore dark-sky parks &rarr;</a></div>';
const expandedDarkSkyAction='<div class="card-actions"><a class="primary-action" href="/national-tools/dark-sky/">Explore dark-sky parks &rarr;</a><a href="/national-tools/dark-sky/michigan/">Michigan parks</a><a href="/national-tools/dark-sky/midwest/">Midwest states</a></div>';
if(html.includes(oldDarkSkyAction))html=html.replace(oldDarkSkyAction,expandedDarkSkyAction);
if(!html.includes('href="/national-tools/dark-sky/midwest/"'))throw new Error('State dark-sky discovery missing');

const marker='<script type="application/ld+json">';
const a=html.indexOf(marker),b=a<0?-1:html.indexOf('</script>',a);
if(b<0)throw new Error('Missing structured directory ItemList');
const old=html.slice(a+marker.length,b);
const schema=JSON.parse(old);
const list=schema['@graph'].find(v=>v['@id']==='https://chrisizworski.com/national-tools/#toollist');
if(!list)throw new Error('Missing ItemList');
const names=new Map(list.itemListElement.map(v=>[v.url,v.name]));
const urls=[...html.matchAll(/<a class="primary-action" href="([^"]+)"/g)].map(m=>new URL(m[1],'https://chrisizworski.com').href);
if(new Set(urls).size!==urls.length)throw new Error('Duplicated primary tool URL');
list.itemListElement=urls.map((url,i)=>({'@type':'ListItem',position:i+1,url,name:names.get(url)||(url.includes('/meteor-shower/')?'Meteor Shower Tonight':url.includes('/dark-sky/')?'Great Lakes Dark Sky Explorer':'Unnamed tool')}));
if(list.itemListElement.some(v=>v.name==='Unnamed tool'))throw new Error('Unexpected tool name added to ItemList');
list.numberOfItems=urls.length;
html=html.slice(0,a+marker.length)+JSON.stringify(schema)+html.slice(b);
fs.writeFileSync(path,html);
console.log('Meteor tool discovery synchronized: '+urls.length+' tools');
