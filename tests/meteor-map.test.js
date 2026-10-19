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
});
test('Great Lakes atlas exposes destination selection, location opt-in and official source links',()=>{
 assert.match(page,/id="skyRegion"/);
 assert.match(page,/id="skyType"/);
 assert.match(page,/id="mapLocate"/);
 assert.match(page,/id="skyPlaces"/);
 assert.match(page,/mapLocate'\)\.addEventListener\('click'/);
 assert.match(page,/navigator\.geolocation\.getCurrentPosition/);
 assert.match(page,/Math\.round\(p\.coords\.latitude\*100\)\/100/);
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
