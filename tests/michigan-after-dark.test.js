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
test('Map and live sky decision appear before the story magazine without losing jump links',()=>{
 const mapAt=html.indexOf('id="darkSkyMap"');
 const storiesAt=html.indexOf('id="ad-stories"');
 const directoryAt=html.indexOf('class="ad-directory"');
 const plannerAt=html.indexOf('id="siteCards"');
 assert.ok(mapAt>0 && storiesAt>mapAt && directoryAt>storiesAt && plannerAt>directoryAt,
  'Map and forecast must come first; stories and crawlable index follow');
 assert.match(html,/href="#darkSkyMap">Explore Michigan dark-sky map/);
 assert.match(html,/href="#ad-stories">Read Michigan field stories/);
 assert.equal((html.match(/id="darkSkyMap"/g)||[]).length,1,'Do not duplicate interactive map');
 assert.equal((html.match(/class="ad-directory"/g)||[]).length,1,'Do not duplicate crawlable directory');
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
 for(const slug of ['wisconsin','minnesota','illinois','indiana','ohio']){
  const x=fs.readFileSync('public/national-tools/dark-sky/'+slug+'/index.html','utf8');
  assert.doesNotMatch(x,/afterdark-mi|michigan-after-dark\.css|afterdark-midwest|midwest-after-dark\.css/,slug);
 }
});


test('Michigan guide offers named park selection without a redundant state selector',()=>{
 assert.match(html,/class="compare-choice"/,'Named comparison checkboxes must render without JavaScript');
 assert.equal((html.match(/class="compare-choice"/g)||[]).length,10);
 assert.match(html,/Compare chosen parks or nearest four/);
 assert.match(html,/id="compareSelectionStatus"/);
 assert.match(html,/id="region" value="all"/);
 assert.doesNotMatch(html,/<select id="region"/,'Do not ask visitors to select Michigan when viewing Michigan');
 assert.match(html,/only; they do not confirm that parks are open or reachable/);
});
test('Ten operator-sourced arrivals distinguish known destinations from unverifiable pins',()=>{
 const all=JSON.parse(fs.readFileSync('data/great-lakes-dark-sky.json','utf8')).places;
 for(const p of all.filter(p=>p.state==='MI')){
  const a=p.arrival;
  assert.ok(a&&a.arrival&&a.source&&a.reviewed,'Arrival guidance missing: '+p.slug);
  assert.equal(a.accessLive,false,'Do not portray published policy as live access: '+p.slug);
  assert.match(a.source,/^https:\/\//);
  assert.ok(['operator-address','search-named-location','operator-only'].includes(a.navigation),'Unknown arrival policy: '+p.slug);
  if(a.navigation==='operator-only')assert.equal(a.place,undefined,'Unverified site must not invent navigable point: '+p.slug);
  else assert.ok(a.place,'Named park needs source-backed destination query: '+p.slug);
  const detail=fs.readFileSync('public/national-tools/dark-sky/'+p.slug+'/index.html','utf8');
  assert.match(detail,/Plan the actual arrival/);
  assert.ok(detail.includes(a.arrival.replace(/&/g,'&amp;').replace(/'/g,'&#39;')) || detail.includes(a.arrival),'Published guidance missing from '+p.slug);
  assert.match(detail,/Compare Michigan dark-sky parks/,'Must navigate from park back to Michigan index');
 }
 const k=all.find(p=>p.slug==='keweenaw');
 assert.match(k.arrival.arrival,/November 15–December 14/);
 assert.match(k.arrival.arrival,/April/);
 const keweenaw=fs.readFileSync('public/national-tools/dark-sky/keweenaw/index.html','utf8');
 assert.match(keweenaw,/Seasonal access warning/);
 const port=all.find(p=>p.slug==='port-crescent');
 assert.match(port.arrival.arrival,/Parking Lot D/);
 assert.match(port.arrival.arrival,/SEPARATE entrances/);
 const rock=all.find(p=>p.slug==='rockport');
 assert.equal(rock.arrival.navigation,'operator-only','Do not route to imagined overnight parking');
 const thompson=all.find(p=>p.slug==='thompsons-harbor');
 assert.match(thompson.arrival.arrival,/winter plowing/);
});
test('Comparison and navigation measurement never includes a device location payload',()=>{
 const js=fs.readFileSync('public/assets/great-lakes-dark-sky.js','utf8');
 assert.match(js,/\.compare-choice:checked/);
 assert.match(js,/selected\.length\?selected:visibleSites\(\)\.slice\(0,4\)/);
 assert.match(js,/selected\.length>=4/);
 assert.match(js,/dark_sky_/);
 assert.match(js,/site_slug/);
 assert.doesNotMatch(js,/gtag\([^;]*\.lat|gtag\([^;]*\.lon/);
});


test('Map directions distinguish operator address, named-place search and unknown parking',()=>{
 const js=fs.readFileSync('public/assets/great-lakes-dark-sky.js','utf8');
 const inspector=fs.readFileSync('public/assets/dark-sky-map-inspector.js','utf8');
 assert.match(js,/p\.arrival\.navigation|a\.navigation/);
 assert.match(js,/operator-address/);
 assert.match(js,/search-named-location/);
 assert.match(js,/parking not verified|access unverified/i);
 assert.match(inspector,/parking not verified/);
 const port=fs.readFileSync('public/national-tools/dark-sky/port-crescent/index.html','utf8');
 assert.match(port,/Search named area on Maps \(verify result\)/);
 assert.match(port,/maps\/search\/\?api=1/);
 const keweenaw=fs.readFileSync('public/national-tools/dark-sky/keweenaw/index.html','utf8');
 assert.match(keweenaw,/Directions to published operator address \(verify entry\)/);
 assert.match(keweenaw,/14252%20US%20Highway%2041/);
 const thompson=fs.readFileSync('public/national-tools/dark-sky/thompsons-harbor/index.html','utf8');
 assert.match(thompson,/Find named park on Maps \(not verified parking\)/);
 assert.match(thompson,/maps\/search\/\?api=1/);
});
