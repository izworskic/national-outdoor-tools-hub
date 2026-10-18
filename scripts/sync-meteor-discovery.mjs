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
list.itemListElement=urls.map((url,i)=>({'@type':'ListItem',position:i+1,url,name:names.get(url)||(url.includes('/meteor-shower/')?'Meteor Shower Tonight':'Unnamed tool')}));
if(list.itemListElement.some(v=>v.name==='Unnamed tool'))throw new Error('Unexpected tool name added to ItemList');
list.numberOfItems=urls.length;
html=html.slice(0,a+marker.length)+JSON.stringify(schema)+html.slice(b);
fs.writeFileSync(path,html);
console.log('Meteor tool discovery synchronized: '+urls.length+' tools');
