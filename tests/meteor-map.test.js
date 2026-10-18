'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const page=fs.readFileSync('public/national-tools/meteor-shower/index.html','utf8');
test('Meteor Chase basemap does not require a provider API key',()=>{
 assert.match(page,/basemap\.nationalmap\.gov\/arcgis\/rest\/services\/USGSTopo\/MapServer\/tile\/\{z\}\/\{y\}\/\{x\}/);
 assert.doesNotMatch(page,/basemaps\.cartocdn\.com|api\.mapbox\.com|maptiler\.com\/maps\/|YOUR_API_KEY|INSERT_API_KEY/i);
 assert.match(page,/Map data:.*USGS National Map/);
});
test('Meteor Chase map has a bounded keyless tile fallback',()=>{
 assert.match(page,/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/);
 assert.match(page,/loadedTiles===0 && failedTiles>=3/);
 assert.match(page,/OpenStreetMap contributors/);
 assert.match(page,/L\.circleMarker/);
 assert.match(page,/fitBounds/);
});
test('The Meteor Chase map code remains syntactically valid',()=>{
 const script=page.match(/<script>\s*\(function\(\)\{[\s\S]*?<\/script>/)?.[0];
 assert.ok(script,'Inline tool script missing');
 assert.doesNotThrow(()=>new Function(script.replace(/^<script>/,'').replace(/<\/script>$/,'')));
});
