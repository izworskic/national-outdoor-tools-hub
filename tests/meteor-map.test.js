'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const page=fs.readFileSync('public/national-tools/meteor-shower/index.html','utf8');
const script=page.match(/<script>\s*\(function\(\)\{[\s\S]*?<\/script>/)?.[0]||'';
test('Meteor Chase uses the existing Vercel CARTO public basemap config, never hardcodes a key',()=>{
 assert.match(page,/fetch\('\/api\/carto-basemap-config'/);
 assert.match(page,/rastertiles\/voyager\/\{z\}\/\{x\}\/\{y\}\{r\}\.png\?key=/);
 assert.match(page,/encodeURIComponent\(cfg\.key\.trim\(\)\)/);
 assert.doesNotMatch(page,/YOUR_API_KEY|INSERT_API_KEY|CARTO_BASEMAP_PUBLIC_KEY\s*=\s*['"]/i);
 assert.match(page,/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/);
 assert.match(page,/errors>=3/);
 assert.match(page,/OpenStreetMap contributors/);
 assert.match(page,/CARTO/);
 assert.match(page,/#map \.leaflet-tile[^\n]*position:absolute!important/);
 assert.match(page,/#map \.leaflet-bottom\{bottom:0\}/);
 assert.match(page,/#map \.leaflet-control-attribution\{/);
 assert.match(page,/https:\/\/a\.basemaps\.cartocdn\.com\/rastertiles\/voyager/);
 assert.doesNotMatch(page,/https:\/\/\{s\}\.basemaps\.cartocdn\.com/);
});
test('Great Lakes atlas exposes destination selection, location opt-in and official source links',()=>{
 assert.match(page,/id="skyRegion"/);
 assert.match(page,/id="skyType"/);
 assert.match(page,/id="mapLocate"/);
 assert.match(page,/id="skyPlaces"/);
 assert.match(page,/mapLocate'\)\.addEventListener\('click'/);
 assert.match(page,/navigator\.geolocation\.getCurrentPosition/);
 assert.match(page,/Math\.round\(lat\*100\)\/100/);
 assert.match(page,/Official details/);
 assert.match(page,/SKY_NAMES/);
 assert.match(page,/fitBounds/);
 assert.match(page,/dark-sky-map-inspector\.css/);
});
test('International, sanctuary, state, Canadian preserves and community are distinguished',()=>{
 for(const id of ['headlands','lawless','keweenaw','beaver','lake-hudson','negwegon','port-crescent','rockport','thompsons-harbor','wilderness','newport','voyageurs','bwca','middlefork','geauga','beverly','cherry','quetico','superior-on','killarney','point-pelee','bruce','fathom','torrance'])assert.ok(page.includes('"'+id+'"'),id);
 assert.match(page,/state==='ON'/);
 assert.match(page,/uses Canadian forecast data/);
 assert.match(page,/Pins represent areas/);
 assert.match(page,/winter plowing|winter-plowed/);
});
test('Client code is syntactically valid',()=>{
 assert.ok(script,'Meteor UI script missing');
 assert.doesNotThrow(()=>new Function(script.replace(/^<script>/,'').replace(/<\/script>$/,'')));
});


test('Device coordinates remain the source of truth after Check the sky is pressed',()=>{
 const label="Your approximate location";
 const source=script.match(/function resolveDeviceQuery\(query, deviceLocation\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(source,'Missing a dedicated device query resolver');
 const resolve=new Function("const DEVICE_LOCATION_LABEL="+JSON.stringify(label)+";"+source+";return resolveDeviceQuery;")();
 const device={lat:43.59,lon:-83.89};
 assert.deepEqual(resolve(label,device),device);
 assert.equal(resolve('Bay City, MI',device),null,'Manual city lookup must still use geocoding');
 assert.equal(resolve('48631',device),null,'ZIP lookup must still use geocoding');
 assert.throws(()=>resolve(label,null),/Use the location button/,'Never geocode the device-label placeholder');
 assert.match(page,/const device=resolveDeviceQuery\(query,state\.deviceLocation\);if\(device\)\{/);
 assert.match(page,/state\.deviceLocation=\{lat:Math\.round\(lat\*100\)\/100,lon:Math\.round\(lon\*100\)\/100\}/);
 assert.match(page,/\$\('place'\)\.value=DEVICE_LOCATION_LABEL;refresh\(\)/);
 assert.match(page,/\$\('place'\)\.addEventListener\('input'/);
 assert.match(page,/id="locate"[^>]*|id="locate"/);
 assert.match(page,/type="button" id="locate"/,'Geolocation must not submit the search form by itself');
 assert.match(page,/id="mapLocate" type="button"/,'Map location control must not submit a form');
 assert.match(page,/if\(request!==lookupSeq\)return/,'Stale location responses must be ignored');
});


test('Named Great Lakes dark-sky sites bypass city-only geocoder using curated coordinates',()=>{
 const catalogMatch=page.match(/const SKY_PLACES=(\[[\s\S]*?\]);\s*const SKY_NAMES/);
 assert.ok(catalogMatch,'Curated map catalog must remain available to the search');
 const parks=JSON.parse(catalogMatch[1]);
 const funcs=script.match(/const SKY_STATE_NAMES=[\s\S]*?(?=for\(const site of SKY_PLACES\.filter)/)?.[0];
 assert.ok(funcs,'Park alias index must be available before geocoding');
 const {resolveParkQuery,normalizeParkName}=new Function('SKY_PLACES',funcs+';return {resolveParkQuery,normalizeParkName};')(parks);
 for(const query of ['Headlands State Park','headlands state park, mi','Headlands International Dark Sky Park','HEADLANDS','Headlands Dark Sky Park, Michigan','Headlands County Park']){
  const result=resolveParkQuery(query);
  assert.equal(result?.id,'headlands',query);
  assert.equal(result?.name,'Headlands Dark Sky Park');
  assert.equal(result?.state,'MI');
  assert.ok(Number.isFinite(result?.lat)&&Number.isFinite(result?.lon));
 }
 for(const park of parks){
  assert.equal(resolveParkQuery(park.name+', '+park.state)?.id,park.id,park.name);
 }
 assert.equal(resolveParkQuery('Bay City, MI'),null,'Cities continue to use geocoding');
 assert.equal(resolveParkQuery('48631'),null,'ZIP codes continue to use geocoding');
 assert.equal(resolveParkQuery('Headlands State Park, California'),null,'No incorrect cross-state match');
 assert.equal(normalizeParkName('Dr. T.K. Lawless County Park'),'dr t k lawless county park');
 assert.match(page,/id="place" list="parkSuggestions"/);
 assert.match(page,/const park=resolveParkQuery\(query\);if\(park\)\{/);
 assert.match(page,/selectParkForecast\(park\);return/);
 assert.match(page,/state\.lat=site\.lat;state\.lon=site\.lon/);
 assert.match(page,/state\.label=site\.name\+' \('\+site\.state\+' park-area reference\)'/);
 assert.match(page,/site\.state==='ON'/);
 assert.match(page,/Open '\+site\.name\+' forecast →'/);
 assert.match(page,/\/api\/national-geocode\?q=/,'Unknown city and ZIP queries still use geocoder');
});


test('CARTO dark-sky pins are large tappable destinations with park details and Google Maps',()=>{
 const body=script.replace(/^<script>/,'').replace(/<\/script>$/,'');
 const urlFn=body.match(/function skyGoogleMapsUrl\(p\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(urlFn,'The park navigator helper must exist');
 const maps=new Function(urlFn+';return skyGoogleMapsUrl;')();
 const headlands={id:'headlands',name:'Headlands Dark Sky Park',state:'MI',type:'international',approximateLocation:false};
 const remote={id:'bwca',name:'Boundary Waters Canoe Area Wilderness',state:'MN',type:'sanctuary',approximateLocation:true};
 const ontario={id:'fathom',name:'Fathom Five National Marine Park',state:'ON',type:'canadian',approximateLocation:true};
 assert.match(maps(headlands),/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
 assert.match(maps(headlands),/travelmode=driving/);
 assert.ok(maps(headlands).includes(encodeURIComponent('Headlands Dark Sky Park, MI, USA')));
 assert.match(maps(remote),/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
 assert.match(maps(ontario),/Canada/);
 assert.ok(!maps(remote).includes('47.95'),'Regional marker must not be interpreted as an entrance');
 assert.match(page,/L\.divIcon\(\{className:'sky-park-marker/);
 assert.match(page,/iconSize:\[44,44\]/);
 assert.match(page,/keyboard:true,riseOnHover:true,interactive:true/);
 assert.match(page,/skyMarkers\.set\(p\.id,marker\)/);
 assert.match(page,/Show on map/);
 assert.match(page,/skyInspector\.selectPark\(p\)/);
 assert.match(page,/dark-sky-map-inspector\.js/);
 assert.match(page,/Google Maps directions/);
 assert.match(page,/#map \.leaflet-marker-pane \.sky-park-marker\{pointer-events:auto!important/);
 assert.match(page,/#map \.leaflet-interactive\{pointer-events:auto!important/);
 assert.match(page,/Gold = selected forecast coordinate; small cyan dots = NWS weather samples/);
});


test('Map zoom does not trigger involuntary Leaflet autopan',()=>{
 assert.match(page,/scrollWheelZoom:true,zoomControl:true,worldCopyJump:false,dragging:true,doubleClickZoom:true,touchZoom:true/);
 assert.match(page,/\.on\('click',\(\)=>\{if\(skyInspector\)skyInspector\.selectPark\(p\);\}\)/);
 assert.match(page,/Weather sampling coordinates represent model grid observations/);
 assert.doesNotMatch(page,/\.bindPopup\(/);
 assert.doesNotMatch(page,/map\.flyTo\(/);
 const display=script.match(/function renderSkyPlaces\(\)\{[\s\S]*?\n\}\nfunction showMap/)?.[0]||'';
 assert.ok(display,'Park marker refresh code exists');
 assert.doesNotMatch(display,/fitBounds\(|setView\(|flyTo\(/);
 const samples=script.match(/function showMap\(loc,near\)\{[\s\S]*?\n\}\nfunction skyAllBounds/)?.[0]||'';
 assert.ok(samples,'Weather samples redraw code exists');
 assert.doesNotMatch(samples,/fitBounds\(|setView\(|flyTo\(/);
 assert.match(page,/state\.map\.setView\(\[p\.lat,p\.lon\],Math\.max\(8,state\.map\.getZoom\(\)\),\{animate:false\}\)/);
});
