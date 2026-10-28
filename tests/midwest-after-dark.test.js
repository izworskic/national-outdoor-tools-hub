'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs');
const base='public/national-tools/dark-sky/';
const html=fs.readFileSync(base+'midwest/index.html','utf8');
const css=fs.readFileSync(base+'assets/midwest-after-dark.css','utf8');
const pictures=JSON.parse(fs.readFileSync('data/midwest-after-dark-photos.json','utf8')).photos;
const sites=JSON.parse(fs.readFileSync('data/great-lakes-dark-sky.json','utf8')).places.filter(p=>['MI','MN','WI','IL','IN','OH'].includes(p.state));
test('existing Midwest canonical, unique H1, original sky decisions and all sixteen destinations retained',()=>{
 assert.match(html,/<body class="afterdark-midwest">/);
 assert.match(html,/<title>Midwest Dark Sky Parks: Best Stargazing Tonight<\/title>/);
 assert.match(html,/<link rel="canonical" href="https:\/\/chrisizworski.com\/national-tools\/dark-sky\/midwest\/">/);
 assert.equal((html.match(/<h1/g)||[]).length,1);
 assert.match(html,/<h1>Midwest dark sky parks:/);
 assert.equal(sites.length,16);
 for(const p of sites)assert.ok(html.includes('href="'+base+p.slug+'/"'),p.slug);
 for(const hook of ['id="darkSkyPayload"','id="darkSkyMap"','id="siteCards"','id="compare4"','id="region"','id="designation"','id="myLocation"','id="mapStatus"','id="searchSites"'])
  assert.ok(html.includes(hook),'Missing shared contract '+hook);
 const data=JSON.parse(html.match(/<script type="application\/json" id="darkSkyPayload">([\s\S]*?)<\/script>/)[1]);
 assert.equal(data.places.length,16);
 assert.match(html,/National Weather Service sky-cover/);
 assert.match(html,/great-lakes-dark-sky\.js/);
 assert.match(html,/dark-sky-map-inspector\.js/);
 assert.doesNotMatch(html,/Open a destination planner<\/div>/,'Old duplicated static catalog should be removed');
});
test('Six state choices are explicit unique links rather than clone region cards',()=>{
 for(const state of ['michigan','wisconsin','minnesota','illinois','indiana','ohio'])
  assert.ok(html.includes('href="'+base+state+'/"'),state);
 assert.match(html,/id="mw-states"/);
 assert.match(html,/id="mw-forecast"/);
 assert.match(html,/class="mw-index"/);
 assert.match(html,/Browse all 16 Midwest dark-sky destination planners/);
 assert.match(html,/These links also work without JavaScript/);
 assert.match(html,/Photographs show earlier landscapes, not current weather/);
});
test('Real site photographs, individual source rights, accessible alt and archival truth',()=>{
 assert.equal(pictures.length,3);
 assert.equal(new Set(pictures.map(p=>p.placeId)).size,3);
 assert.equal(new Set(pictures.map(p=>p.imageURL)).size,3);
 assert.equal((html.match(/<figure class="mw-photo /g)||[]).length,3);
 for(const p of pictures){
  assert.equal(p.status,'verified-source-and-license');
  assert.ok(['voyageurs','newport','middlefork'].includes(p.placeId));
  for(const key of ['imageURL','sourceURL','photographer','licenseURL','licenseName','alt','cropPosition','captureDate','width','height'])assert.ok(p[key],p.id+' missing '+key);
  assert.ok(html.includes(p.imageURL.replace(/&/g,'&amp;')));
  assert.ok(html.includes(p.sourceURL));
  assert.ok(html.includes(p.licenseURL));
  assert.ok(html.includes(p.alt));
 }
 assert.match(html,/Archival photo:/);
 assert.match(html,/fetchpriority="high"/);
 assert.match(html,/loading="lazy"/);
 assert.match(html,/alt="Rainy Lake Bay shoreline/);
 assert.match(html,/Official designation/);
});
test('Midwest css is scoped and mobile-first without interfering with Michigan or ad configuration',()=>{
 assert.match(html,/midwest-after-dark\.css/);
 assert.match(css,/\.afterdark-midwest \.hero/);
 assert.match(css,/@media\(max-width:850px\)/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/object-position:var\(--mw-crop/);
 assert.doesNotMatch(css,/adsbygoogle|adsense|data-ad-client|display:none!important/);
 const michigan=fs.readFileSync(base+'michigan/index.html','utf8');
 assert.match(michigan,/michigan-after-dark\.css/);
 assert.doesNotMatch(michigan,/midwest-after-dark\.css/);
 for(const slug of ['wisconsin','minnesota','illinois','indiana','ohio']){
  const other=fs.readFileSync(base+slug+'/index.html','utf8');
  assert.doesNotMatch(other,/midwest-after-dark\.css|afterdark-midwest/);
 }
});
test('Midwest metadata dates and embedded source identities match actual editorial update',()=>{
 assert.match(html,/"dateModified":"2026-10-28"/);
 const sitemap=fs.readFileSync(base+'sitemap.xml','utf8');
 assert.match(sitemap,/<loc>https:\/\/chrisizworski.com\/national-tools\/dark-sky\/midwest\/<\/loc><lastmod>2026-10-28<\/lastmod>/);
 assert.match(html,/"@id":"https:\/\/chrisizworski.com\/#person"/);
});
