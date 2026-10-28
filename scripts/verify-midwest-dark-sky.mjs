import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const base = 'public/national-tools/dark-sky';
const slugs = ['midwest','michigan','wisconsin','minnesota','illinois','indiana','ohio'];
const data = JSON.parse(fs.readFileSync('data/great-lakes-dark-sky.json','utf8'));
const byState = {michigan:'MI',wisconsin:'WI',minnesota:'MN',illinois:'IL',indiana:'IN',ohio:'OH'};
const sitemap=fs.readFileSync(path.join(base,'sitemap.xml'),'utf8');
const listings=new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]));
assert.equal(listings.size, [...sitemap.matchAll(/<loc>/g)].length, 'No duplicate sitemap URLs');
for (const slug of slugs) {
 const url='https://chrisizworski.com/national-tools/dark-sky/'+slug+'/';
 const file=path.join(base,slug,'index.html');
 assert.ok(fs.existsSync(file),'Missing generated '+file);
 const html=fs.readFileSync(file,'utf8');
 assert.ok(html.includes('<link rel="canonical" href="'+url+'">'),'Wrong canonical '+slug);
 assert.ok(html.includes('<meta name="description"'),'Missing description');
 assert.ok(html.includes('darkSkyPayload'),'Shared map/forecast payload missing');
 assert.ok(html.includes('darkSkyMap'),'Shared map missing');
 assert.ok(html.includes('siteCards'),'Destination selector missing');
 assert.ok(html.includes('https://www.michigan.gov')||slug!=='michigan','Michigan DNR source missing');
 const match=html.match(/<script type="application\/json" id="darkSkyPayload">([\s\S]*?)<\/script>/);
 assert.ok(match,'No data payload '+slug);
 const payload=JSON.parse(match[1]);
 assert.equal(payload.mode,'index','Region must be an index view');
 assert.ok(payload.places.length,'Empty destination list '+slug);
 if(slug!=='midwest')assert.ok(payload.places.every(p=>p.state===byState[slug]),'Cross-state contamination '+slug);
 for(const p of payload.places)assert.ok(html.includes('href="/national-tools/dark-sky/'+p.slug+'/"'), 'No crawlable destination link '+p.slug);
 assert.ok(listings.has(url),'Missing sitemap '+slug);
 const ld=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
 assert.ok(ld,'Structured data missing '+slug);
 const graph=JSON.parse(ld[1])['@graph'];
 assert.ok(graph.some(n=>n['@type']==='CollectionPage'&&n.url===url),'Wrong CollectionPage '+slug);
 assert.ok(graph.some(n=>n['@type']==='ItemList'&&n.numberOfItems===payload.places.length),'Wrong ItemList '+slug);
}
for(const p of data.places)assert.ok(fs.existsSync(path.join(base,p.slug,'index.html')),'Lost original destination '+p.slug);
const home=fs.readFileSync(path.join(base,'index.html'),'utf8');
for(const slug of slugs)assert.ok(home.includes('href="/national-tools/dark-sky/'+slug+'/"'),'Main hub link missing '+slug);

const michiganHtml=fs.readFileSync(path.join(base,'michigan','index.html'),'utf8');
const thompsons=data.places.find(p=>p.id==='thompsons-harbor');
assert.ok(thompsons,'Thompson’s Harbor registry entry missing');
assert.match(thompsons.note,/DNR lists winter plowing/,'Thompson’s Harbor summary must match official DNR winter guidance');
assert.match(thompsons.access,/DNR currently lists winter plowing/,'Thompson’s Harbor detailed access must remain correct');
assert.doesNotMatch(thompsons.note,/no winter plowing|not winter-plowed/i,'Thompson’s Harbor must not be mislabeled');
assert.match(michiganHtml,/Thompson’s Harbor and Rockport are plowed in winter/,'Michigan guide must identify both plowed DNR preserves');
assert.match(michiganHtml,/Negwegon and Port Crescent are not winter-plowed/,'Michigan guide must distinguish unplowed preserves');
assert.match(michiganHtml,/area near park headquarters is plowed/,'Wilderness plowing exception must be preserved');
assert.doesNotMatch(michiganHtml,/Thompson’s Harbor are not/,'Outdated Michigan summary must not return');
const thompsonHtml=fs.readFileSync(path.join(base,'thompsons-harbor','index.html'),'utf8');
assert.match(thompsonHtml,/DNR lists winter plowing/,'Individual Thompson’s Harbor page must reflect current DNR plowing guidance');
assert.doesNotMatch(thompsonHtml,/<p>State preserve; no winter plowing\.<\/p>/,'Individual Thompson’s Harbor access copy must not contradict detailed guidance');


assert.match(michiganHtml,/<body class="mi-darksky">/,'Michigan design must be isolated to the state guide');
assert.match(michiganHtml,/<h1 id="mi-title">Michigan dark-sky parks/,'Michigan heading must retain search intent');
assert.match(michiganHtml,/mi-hero-photo[^>]+North_Manitou_Village_/,'Photo-led Michigan hero must retain real Michigan NPS location');
assert.match(michiganHtml,/NPS photo · public domain/,'Visible historic image provenance must remain');
assert.match(michiganHtml,/michigan-dark-sky\.css\?v=20261028/,'Michigan state stylesheet must be loaded');
assert.ok(fs.existsSync(path.join(base,'assets','michigan-dark-sky.css')),'Generated Michigan CSS asset missing');
const miCss=fs.readFileSync(path.join(base,'assets','michigan-dark-sky.css'),'utf8');
assert.match(miCss,/\.mi-darksky \.mi-hero/,'Styles must remain page-scoped');
assert.match(miCss,/@media\(max-width:650px\)/,'Mobile design override missing');
assert.match(miCss, /prefers-reduced-motion/,'Reduced motion support missing');
for(const id of ['sky-finder','darkSkyMap','compare4','compareResults','siteCards','myLocation','designation','searchSites','mi-winter-access']){
 assert.ok(michiganHtml.includes('id="'+id+'"'),'Michigan redesign lost interactive element '+id);
}
assert.equal((michiganHtml.match(/id="darkSkyMap"/g)||[]).length,1,'Duplicate Michigan map container');
assert.ok(!michiganHtml.includes('id="region"'),'Redundant single-state filter should not take space');
assert.match(michiganHtml,/The DNR summary does not specify plowing at Lake Hudson/,'Unverified Lake Hudson plowing must not be inferred');
assert.match(michiganHtml,/Thompson’s Harbor State Park/,'Thompson’s Harbor winter status must remain visible');
assert.match(michiganHtml,/Rockport Recreation Area/,'Rockport winter status must remain visible');
const miEntries=data.places.filter(p=>p.state==='MI');
for(const p of miEntries)assert.ok(michiganHtml.includes('href="/national-tools/dark-sky/'+p.slug+'/"'),'Michigan site must remain linked without JavaScript: '+p.slug);
assert.match(michiganHtml,/not tonight’s sky/,'Historic photography must never imply a live view');

console.log('Midwest dark-sky verified: 7 hubs, 24 preserved destination pages, map and forecast payloads, canonical, schema, sitemap, crawlable links.');
