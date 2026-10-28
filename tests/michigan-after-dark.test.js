'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/national-tools/dark-sky/michigan/index.html','utf8');
const style=fs.readFileSync('public/national-tools/dark-sky/assets/michigan-after-dark.css','utf8');
const pictures=JSON.parse(fs.readFileSync('data/michigan-after-dark-photos.json','utf8')).photos;
const registry=JSON.parse(fs.readFileSync('data/great-lakes-dark-sky.json','utf8')).places.filter(p=>p.state==='MI');

test('Field Guide v1 adaptation stays on original Michigan URL with one useful H1',()=>{
 assert.match(html,/<body class="afterdark-mi">/);
 assert.match(html,/<title>Michigan Dark Sky Parks Tonight \| Stargazing Guide<\/title>/);
 assert.match(html,/<link rel="canonical" href="https:\/\/chrisizworski.com\/national-tools\/dark-sky\/michigan\/">/);
 assert.equal((html.match(/<h1/g)||[]).length,1);
 assert.match(html,/<h1>Michigan after dark:/);
 assert.match(html,/id="ad-stories"/);
 assert.match(html,/class="ad-story"/);
 assert.match(html,/class="ad-directory"/);
 assert.doesNotMatch(html,/Open a destination planner<\/div>/,'Remove repeated generic static list');
 assert.match(html,/What to know before you go/);
 assert.match(html,/Thompson’s Harbor and Rockport are plowed in winter/);
});
test('All ten destination links survive in static HTML without JS',()=>{
 assert.equal(registry.length,10);
 for(const p of registry)assert.ok(html.includes('href="/national-tools/dark-sky/'+p.slug+'/"'),p.slug);
 assert.match(html,/href="#ad-stories"/);
 assert.match(html,/Port Crescent/);
 assert.match(html,/Parking Lot D/);
 assert.match(html,/No single statewide forecast|These are forecasts at representative coordinates/);
});
test('Shared dynamic meteor, map, compare and optional location engines are intact',()=>{
 for(const token of ['id="darkSkyPayload"','id="darkSkyMap"','id="compare4"','id="siteCards"','id="searchSites"','id="designation"','id="region"','id="myLocation"','id="mapStatus"'])
  assert.ok(html.includes(token),token);
 const payload=JSON.parse(html.match(/<script type="application\/json" id="darkSkyPayload">([\s\S]*?)<\/script>/)[1]);
 assert.equal(payload.places.length,10);
 assert.ok(payload.places.every(p=>p.state==='MI'));
 assert.match(html,/great-lakes-dark-sky\.js/);
 assert.match(html,/dark-sky-map-inspector\.js/);
 assert.match(html,/michigan-after-dark\.css/);
 assert.match(html,/NWS sky-cover|National Weather Service sky-cover/);
});
test('Every illustrated story uses a distinct site-specific verified image and linked license',()=>{
 assert.equal(pictures.length,4);
 assert.equal(new Set(pictures.map(p=>p.imageURL)).size,4);
 assert.equal((html.match(/<figure class="ad-photo /g)||[]).length,4);
 for(const p of pictures){
  for(const prop of ['id','placeId','imageURL','sourceURL','photographer','licenseName','licenseURL','alt','cropPosition','captureDate','status'])assert.ok(p[prop],p.id+' missing '+prop);
  assert.equal(p.status,'verified-original-and-license');
  assert.match(p.imageURL,/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\//);
  assert.match(p.sourceURL,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.ok(html.includes(p.imageURL.replace(/&/g,'&amp;')),p.id+' img missing');
  assert.ok(html.includes(p.sourceURL.replace(/&/g,'&amp;')),p.id+' source missing');
  assert.ok(html.includes(p.alt),p.id+' alt missing');
  assert.ok(html.includes(p.licenseURL),p.id+' license missing');
 }
 assert.match(html,/Port Crescent.*daylight photograph shows the real shoreline/s);
 assert.match(html,/historic daytime photograph/);
 assert.match(html,/loading="lazy"/);
 assert.match(html,/fetchpriority="high"/);
});
test('Mobile, crop, contrast and keyboard design pieces are scoped to Michigan only',()=>{
 assert.match(style,/\.afterdark-mi \.hero/);
 assert.match(style,/object-position:var\(--ad-position/);
 assert.match(style,/@media\(max-width:800px\)/);
 assert.match(style,/@media\(max-width:420px\)/);
 assert.match(style,/prefers-reduced-motion/);
 assert.match(style,/:focus-visible/);
 for(const slug of ['midwest','wisconsin','minnesota','illinois','indiana','ohio']){
  const x=fs.readFileSync('public/national-tools/dark-sky/'+slug+'/index.html','utf8');
  assert.doesNotMatch(x,/afterdark-mi|michigan-after-dark\.css/,slug);
 }
});
