'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const dir='public/national-tools/dark-sky/';
const photo=JSON.parse(fs.readFileSync('data/northern-dark-sky-field-guide-photos.json','utf8')).photos;
const all=JSON.parse(fs.readFileSync('data/great-lakes-dark-sky.json','utf8')).places;
const read=slug=>fs.readFileSync(dir+slug+'/index.html','utf8');
const wisconsin=read('wisconsin'),minnesota=read('minnesota');
test('Newport and Minnesota retain canonical, page intent, whole sky/map/compare pipeline and expected destination count',()=>{
 for(const [slug,html,count] of [['wisconsin',wisconsin,1],['minnesota',minnesota,2]]){
  assert.match(html,new RegExp('<link rel="canonical" href="https://chrisizworski.com/national-tools/dark-sky/'+slug+'/"'));
  assert.equal((html.match(/<h1/g)||[]).length,1);
  assert.match(html,/class="northern-field-guide northern-(?:wi|mn)"/);
  assert.match(html,/northern-field-guides\.css/);
  for(const id of ['darkSkyPayload','darkSkyMap','siteCards','compare4','searchSites','designation','region','myLocation','mapStatus']) assert.ok(html.includes('id="'+id+'"'),slug+' missing '+id);
  const payload=JSON.parse(html.match(/<script type="application\/json" id="darkSkyPayload">([\s\S]*?)<\/script>/)[1]);
  assert.equal(payload.places.length,count);
  assert.ok(payload.places.every(p=>p.state===(slug==='wisconsin'?'WI':'MN')));
  assert.match(html,/great-lakes-dark-sky\.js/);
  assert.match(html,/dark-sky-map-inspector\.js/);
  assert.match(html,/These are forecasts at representative coordinates/);
  assert.doesNotMatch(html,/Open a destination planner<\/div>/);
  assert.match(html,/"dateModified":"2026-10-28"/);
 }
 for(const x of ['wisconsin','minnesota'])assert.match(fs.readFileSync(dir+'sitemap.xml','utf8'),new RegExp(x+'/<\\/loc><lastmod>2026-10-28<\\/lastmod>'));
});
test('Wisconsin makes dated access and park rules explicit rather than overclaiming current availability',()=>{
 for(const token of ['6 a.m.–11 p.m.','vehicle admission sticker','June 22, 2026','July 17, 2026','Lot 3','daylight','not a live construction','Newport live park planner','https://dnr.wisconsin.gov/topic/parks/newport/darksky'])
  assert.ok(wisconsin.toLowerCase().includes(token.toLowerCase()),'Missing Wisconsin access truth '+token);
 assert.match(wisconsin,/href="\/national-tools\/dark-sky\/newport\/"/);
 assert.match(wisconsin,/id="ng-wisconsin-visit"/);
 assert.match(wisconsin,/id="darkSkyMap"/);
});
test('Minnesota distinguishes mainland Voyageurs and permitted BWCAW with source-grounded access choices',()=>{
 for(const token of ['upper parking lot','Rainy Lake Visitor Center','Meadwood Road Day Use Area','October 1–April 30','May 1–September 30','Permit required year-round','self-issued permit year-round','not verified live','https://www.recreation.gov/permits/233396','https://www.nps.gov/voya/planyourvisit/stargazing.htm'])
  assert.ok(minnesota.toLowerCase().includes(token.toLowerCase()),'Missing Minnesota access truth '+token);
 for(const slug of ['voyageurs','bwca'])assert.ok(minnesota.includes('href="/national-tools/dark-sky/'+slug+'/"'),slug);
 assert.match(minnesota,/id="ng-minnesota-choice"/);
 assert.doesNotMatch(minnesota,/destination=Boundary Waters/, 'BWCA must not get invented parking route');
});
test('Photographic provenance: original location, commercial licenses, credits and archival warning',()=>{
 assert.equal(photo.length,5);
 assert.equal(new Set(photo.map(x=>x.imageURL)).size,5);
 for(const p of photo){
  assert.equal(p.status,'source-and-license-verified');
  assert.ok(/^https:\/\/commons.wikimedia.org\/wiki\/File:/.test(p.sourceURL)||/^https:\/\/npgallery.nps.gov\/AssetDetail\//.test(p.sourceURL),p.id);
  assert.ok(/^https:\/\/upload.wikimedia.org\/wikipedia\/commons\//.test(p.imageURL)||/^https:\/\/npgallery.nps.gov\/GetAsset\//.test(p.imageURL),p.id);
  for(const key of ['placeId','alt','licenseURL','licenseName','captureDate','photographer','cropPosition'])assert.ok(p[key],p.id+': '+key);
 }
 assert.equal((wisconsin.match(/<figure class="ng-photo /g)||[]).length,2);
 assert.equal((minnesota.match(/<figure class="ng-photo /g)||[]).length,3);
 for(const x of ['newport-night','newport'])assert.ok(wisconsin.includes(photo.find(p=>p.id===x).imageURL));
 for(const x of ['voyageurs','voyageurs-nps-aurora','bwca-sunset'])assert.ok(minnesota.includes(photo.find(p=>p.id===x).imageURL));
 assert.match(wisconsin,/long exposure, not tonight/);
 assert.match(minnesota,/Archival image:/);
 assert.match(minnesota,/archival aurora photograph is not a prediction for tonight/i);
 const minnesotaImages=[...minnesota.matchAll(/<figure class="ng-photo [\s\S]*?<img src="([^"]+)/g)].map(x=>x[1]);
 assert.equal(new Set(minnesotaImages).size,3,'Minnesota must use three distinct photos');
});
test('Field Guide styling is scoped, responsive, accessible and unrelated states stay intact',()=>{
 const css=fs.readFileSync(dir+'assets/northern-field-guides.css','utf8');
 for(const key of ['.northern-field-guide .hero','@media(max-width:850px)','@media(max-width:480px)','prefers-reduced-motion','focus-visible','object-position:var(--ng-crop'])assert.ok(css.includes(key));
 assert.doesNotMatch(css,/adsbygoogle|display:none!important|data-ad-client|CARTO_BASEMAP_PUBLIC_KEY/);
 for(const state of ['midwest','michigan','illinois','indiana','ohio']){
  const html=read(state);
  assert.doesNotMatch(html,/northern-field-guides\.css/);
  assert.doesNotMatch(html,/northern-field-guide northern-/);
 }
 assert.equal(all.filter(p=>p.state==='WI').length,1);
 assert.equal(all.filter(p=>p.state==='MN').length,2);
});
