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
 assert.match(page,/leaflet-popup-content|sky-popup/);
});
test('International, sanctuary, state, Canadian preserves and community are distinguished',()=>{
 for(const id of ['headlands','lawless','keweenaw','beaver','lake-hudson','negwegon','port-crescent','rockport','thompsons-harbor','wilderness','newport','voyageurs','bwca','middlefork','geauga','beverly','cherry','quetico','superior-on','killarney','point-pelee','bruce','fathom','torrance'])assert.ok(page.includes('"'+id+'"'),id);
 assert.match(page,/state==='ON'/);
 assert.match(page,/this NWS engine covers U\.S\. locations/);
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
