'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const data=JSON.parse(fs.readFileSync('data/great-lakes-dark-sky.json','utf8'));
const root='public/national-tools/dark-sky';
const atlas=fs.readFileSync(path.join(root,'index.html'),'utf8');
const runtime=fs.readFileSync('public/assets/great-lakes-dark-sky.js','utf8');
const stylesheet=fs.readFileSync('public/assets/great-lakes-dark-sky.css','utf8');
test('All curated Great Lakes destinations are unique and source-backed',()=>{
 assert.equal(data.places.length,24);
 assert.equal(new Set(data.places.map(p=>p.id)).size,data.places.length);
 assert.equal(new Set(data.places.map(p=>p.slug)).size,data.places.length);
 for(const p of data.places){
  assert.ok(p.name&&p.intro&&p.access&&p.whatToWatch&&p.source,p.id);
  assert.match(p.source,/^https:\/\/(darksky\.org|www\.michigan\.gov|blog\.ontarioparks\.ca|parks\.canada\.ca|www\.ontario\.ca)/,p.id);
  assert.ok(Number.isFinite(p.lat)&&Number.isFinite(p.lon),p.id);
  assert.equal(p.country,p.state==='ON'?'CA':'US');
  assert.equal(p.accessVerifiedLive,false,'do not imply current gate checks');
 }
 assert.equal(data.places.filter(p=>p.state==='MI'&&p.type==='state').length,6);
 assert.equal(data.places.filter(p=>p.state==='MI'&&p.type==='international').length,3);
});
test('Generated pages have distinct canonical URLs, descriptive guidance, safe weather decisions and source links',()=>{
 for(const p of data.places){
  const html=fs.readFileSync(path.join(root,p.slug,'index.html'),'utf8');
  assert.match(html,new RegExp('<link rel="canonical" href="https://chrisizworski.com/national-tools/dark-sky/'+p.slug+'/"'));
  for(const token of [p.name,p.intro,p.access,p.whatToWatch,'parkVerdict','parkTimeline','siteAlternatives','darkSkyPayload','darkSkyMap','Official park'])assert.ok(html.includes(token),p.id+' missing '+token);
  assert.match(html,/Access not checked live/);
  assert.match(html,/weather forecast|weather outlook|forecast/i);
  if(p.country==='CA')assert.match(html,/Environment Canada/);
 }
});
test('Explorer is discoverable, mobile responsive and sitemap URLs match generated destinations',()=>{
 assert.match(atlas,/id="region"/);assert.match(atlas,/id="designation"/);assert.match(atlas,/id="myLocation"/);assert.match(atlas,/id="compare4"/);
 assert.match(stylesheet,/@media\(max-width:800px\)/);
 assert.match(stylesheet,/#darkSkyMap\{height:410px;min-height:0/);
 assert.match(stylesheet,/#darkSkyMap\{height:330px;min-height:0/);
 assert.match(stylesheet,/#darkSkyMap \.leaflet-tile[^\n]*position:absolute!important/);
 assert.match(stylesheet,/#darkSkyMap \.leaflet-pane[^\n]*position:absolute!important/);
 assert.match(stylesheet,/#darkSkyMap \.leaflet-bottom\{bottom:0\}/);
 assert.match(stylesheet,/#darkSkyMap \.leaflet-control-attribution\{/);
 assert.doesNotMatch(stylesheet,/#darkSkyMap\{min-height:410px/);
 const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 assert.equal((sitemap.match(/<url>/g)||[]).length,25);
 assert.match(sitemap,/\/national-tools\/dark-sky\/headlands\/<\/loc>/);
 assert.match(sitemap,/\/national-tools\/dark-sky\/point-pelee\/<\/loc>/);
 assert.match(atlas,/https:\/\/schema.org/);
 assert.match(atlas,/MET Norway/);
});
test('Shared client uses public CARTO credential endpoint, location opt-in and explicit licensed Canadian forecasts',()=>{
 assert.doesNotThrow(()=>new Function(runtime));
 assert.match(runtime,/fetch\('\/api\/carto-basemap-config'/);
 assert.match(runtime,/basemaps\.cartocdn\.com\/rastertiles\/voyager/);
 assert.match(runtime,/https:\/\/a\.basemaps\.cartocdn\.com\/rastertiles\/voyager/);
 assert.doesNotMatch(runtime,/https:\/\/\{s\}\.basemaps\.cartocdn\.com/);
 assert.match(runtime,/tile\.openstreetmap\.org/);
 assert.match(runtime,/navigator\.geolocation\.getCurrentPosition/);
 assert.match(runtime,/Math\.round\(pos\.coords\.latitude\*100\)\/100/);
 assert.match(runtime,/country==='CA'/);
 assert.ok(runtime.includes('/national-tools/dark-sky/_api/forecast'));
 assert.match(runtime,/MET Norway/);
 assert.match(runtime,/Access unverified/);
 assert.match(runtime,/nearTerm/);
 assert.doesNotMatch(runtime,/OPENAI_API_KEY|VERCEL_TOKEN|MAPBOX_KEY|CARTO_BASEMAP_PUBLIC_KEY\s*=/);
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(index,/\/national-tools\/dark-sky\/assets\/great-lakes-dark-sky\.js/);
});


test('Explorer map markers open details, show Google Maps safely, and are touch and keyboard usable',()=>{
 const fn=runtime.match(/function googleMapsUrl\(p\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(fn,'Missing shared safe Google Maps helper');
 const maps=new Function(fn+';return googleMapsUrl;')();
 const headlands=data.places.find(p=>p.id==='headlands');
 const bwca=data.places.find(p=>p.id==='bwca');
 assert.match(maps(headlands),/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
 assert.ok(maps(headlands).includes(encodeURIComponent('Headlands Dark Sky Park, MI, USA')));
 assert.match(maps(bwca),/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
 assert.ok(!maps(bwca).includes('47.95'),'Never route drivers to a wilderness-center pin');
 assert.match(runtime,/L\.divIcon\(\{className:'sky-destination-pin/);
 assert.match(runtime,/iconSize:\[38,38\]/);
 assert.match(runtime,/keyboard:true,interactive:true,riseOnHover:true/);
 assert.match(runtime,/state\.inspector\.selectPark\(p\)/);
 assert.match(runtime,/DarkSkyMapInspector/);
 assert.match(runtime,/getDesignation:p=>typeNames\[p\.type\]/);
 assert.match(runtime,/getMapsUrl:googleMapsUrl/);
 assert.match(stylesheet,/#darkSkyMap \.leaflet-marker-pane \.sky-destination-pin\{pointer-events:auto!important/);
 assert.match(stylesheet,/#darkSkyMap \.leaflet-interactive\{pointer-events:auto!important/);
 const generated=fs.readFileSync('public/national-tools/dark-sky/headlands/index.html','utf8');
 assert.match(generated,/Google Maps directions to named park/);
 const remote=fs.readFileSync('public/national-tools/dark-sky/bwca/index.html','utf8');
 assert.match(remote,/Find a legal access point on Google Maps/);
});


test('User zoom stays fixed across map marker updates, geolocation and forecast refresh',()=>{
 assert.match(runtime,/scrollWheelZoom:true,zoomControl:true,dragging:true,doubleClickZoom:true,touchZoom:true/);
 assert.match(runtime,/\.on\('click',\(\)=>\{if\(state\.inspector\)state\.inspector\.selectPark\(p\);\}\)/);
 const update=runtime.match(/function updatePins\(\)\{[\s\S]*?\n\}\nfunction resetDarkSkyViewport/)?.[0]||'';
 assert.ok(update,'Marker updater must be separate from viewport reset');
 assert.doesNotMatch(update,/\.fitBounds\(|\.setView\(|\.flyTo\(/);
 assert.match(runtime,/function resetDarkSkyViewport\(\)/);
 assert.match(runtime,/\$\('resetDarkSkyMap'\)\?\.addEventListener\('click',resetDarkSkyViewport\)/);
 assert.match(runtime,/state\.map\.setView\(\[p\.lat,p\.lon\],Math\.max\(8,state\.map\.getZoom\(\)\),\{animate:false\}\)/);
 const page=fs.readFileSync('public/national-tools/dark-sky/headlands/index.html','utf8');
 assert.match(page,/id="resetDarkSkyMap"/);
 assert.match(page,/Marker details do not move the map/);
});
