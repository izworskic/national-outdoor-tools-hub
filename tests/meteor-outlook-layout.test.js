'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('public/national-tools/meteor-shower/index.html','utf8');
function at(mark){const i=html.indexOf(mark);assert.ok(i>=0,'Missing '+mark);assert.equal(html.indexOf(mark,i+1),-1,'Duplicated '+mark);return i;}
test('Meteor results and hourly decisions appear ahead of the park finder on desktop and mobile DOM order',()=>{
 const loc=at('id="locationForm"');
 const verdict=at('id="meteorOutlook"');
 const observed=at('id="observedActivity"');
 const hourly=at('id="hourlyForecast"');
 const calendar=at('id="meteor-calendar"');
 const chase=at('id="nearbySky"');
 const parks=at('id="darkSkyAtlas"');
 const sources=at('aria-labelledby="method"');
 assert.ok(loc<verdict&&verdict<observed&&observed<hourly&&hourly<calendar&&calendar<chase&&chase<parks&&parks<sources);
 assert.match(html,/id="meteor-outlook-heading">Tonight’s meteor outlook/);
 assert.match(html,/href="#darkSkyAtlas">Find dark-sky parks/);
 assert.match(html,/dark-sky destination map below/);
});
test('Move retains unique map, filters, original meteor interactions and live data containers',()=>{
 for(const marker of ['id="map"','id="skyRegion"','id="skyType"','id="skyPlaces"','id="mapLocate"','id="mapAll"','id="locationForm"','id="place"','id="radius"','id="verdict"','id="observedSignal"','id="observedActivity"','id="shower"','id="timeline"','id="spots"']){
  at(marker);
 }
 assert.match(html,/loadShowerCalendar\(\);\s*loadObservedActivity\(\);/);
 assert.match(html,/id="meteor-calendar-title"/);
 assert.match(html,/navigator\.geolocation\.getCurrentPosition/);
 assert.match(html,/skyInspector\.selectPark/);
});
test('The existing inline JavaScript still parses and all custom headings have a target',()=>{
 const source=html.match(/<script>\s*\(function\(\)\{[\s\S]*?<\/script>/)?.[0]||'';
 assert.ok(source,'Missing the original executable meteor UI');
 assert.doesNotThrow(()=>new Function(source.replace(/^<script>/,'').replace(/<\/script>$/,'')));
 for(const target of ['meteor-outlook-heading','hours-title','meteor-calendar-title','chase-title','dark-sky-title']){
  assert.ok(html.includes('id="'+target+'"'),'Missing heading for '+target);
 }
});
