'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const base='public/national-tools/dark-sky/';
const pages=Object.fromEntries(['newport','voyageurs','bwca'].map(slug=>[slug,fs.readFileSync(base+slug+'/index.html','utf8')]));
const source=JSON.parse(fs.readFileSync('data/dark-sky-visit-guides.json','utf8')).places;
const gallery=JSON.parse(fs.readFileSync('data/northern-dark-sky-field-guide-photos.json','utf8')).photos;
const js=fs.readFileSync('public/assets/destination-field-guide.js','utf8');
const runtime=fs.readFileSync('public/assets/great-lakes-dark-sky.js','utf8');
const css=fs.readFileSync('public/assets/destination-field-guide.css','utf8');
test('Three destination guides preserve canonical, NWS timeline, access and map functionality',()=>{
 for(const slug of Object.keys(pages)){
  const html=pages[slug];
  assert.ok(html.includes('<link rel="canonical" href="https://chrisizworski.com/national-tools/dark-sky/'+slug+'/">'));
  assert.ok(html.includes('<body class="destination-field-guide destination-'+slug+'">'));
  for(const id of ['parkDecision','parkVerdict','parkReason','parkTimeline','parkForecastStatus','parkHourDetail','parkTonight','parkBest','parkShower','siteAlternatives','darkSkyPayload','darkSkyMap','myLocation','tripDistance'])
   assert.ok(html.includes('id="'+id+'"'),slug+' missing '+id);
  assert.equal((html.match(/<h1/g)||[]).length,1);
  assert.match(html,/Access not checked live/);
  assert.match(html,/National Weather Service|NWS/);
  assert.match(html,/destination-field-guide\.js/);
  assert.match(html,/destination-field-guide\.css/);
 }
 const data=JSON.parse(fs.readFileSync('data/great-lakes-dark-sky.json','utf8')).places;
 for(const slug of Object.keys(pages)){const p=data.find(p=>p.slug===slug);assert.ok(p);assert.ok(pages[slug].includes(p.intro));assert.ok(pages[slug].includes(p.access));}
});
test('Newport identifies Lot 3, visitor closing hours, winter and construction caveats',()=>{
 const html=pages.newport;
 for(const t of ['dgNewportWindows','6 a.m.–11 p.m.','Lot 3','June 22, 2026','July 17, 2026','vehicle admission sticker','registered campers','weather-sample map pin','DNR hours and fees'])
  assert.ok((html+JSON.stringify(source.newport)+js).toLowerCase().includes(t.toLowerCase()),'Missing Newport detail '+t);
 assert.match(html,/href="https:\/\/www.google.com\/maps\/search\/\?api=1&amp;query=Newport/);
 assert.match(html,/https:\/\/dnr.wisconsin.gov\/topic\/parks\/camping\/rules/);
 assert.match(js,/darksky:forecast/);
 assert.match(js,/hr>=6&&hr<23/);
});
test('Voyageurs exposes NPS-designated mainland choices, no invented precise map location',()=>{
 const html=pages.voyageurs;
 for(const t of ['Rainy Lake Visitor Center upper parking lot','Meadwood Road Day Use Area','1797 Township Road 342','Ash River Visitor Center Road','NPS-designated','not a prediction','regional map pin'])
  assert.ok(html.includes(t)||JSON.stringify(source.voyageurs).includes(t),'Missing NPS detail '+t);
 assert.match(html,/www.nps.gov\/voya\/planyourvisit\/stargazing.htm/);
 assert.match(html,/www.google.com\/maps\/search/);
 assert.doesNotMatch(html,/destination=47\./);
});
test('BWCAW permit guide uses entry date/type, without fake reservation or centroid directions',()=>{
 const html=pages.bwca;
 for(const t of ['dgPermitDate','dgPermitType','dgPermitResult','Overnight paddle','Overnight hiking','Motorized day','Non-motorized day','entry point','nine people and four watercraft','No route, parking'])
  assert.ok((html+js+JSON.stringify(source.bwca)).toLowerCase().includes(t.toLowerCase()),'Missing BWCA '+t);
 assert.match(html,/www.recreation.gov\/permits\/233396/);
 assert.doesNotMatch(html,/maps\/dir\/\?api=1&amp;destination=.*Boundary/);
 assert.match(js,/May 1–September 30/);
 assert.match(js,/Self-issued permit required/);
 assert.match(js,/Quota permit required/);
});
test('Photographs are place-verified archival images, with license and attribution',()=>{
 const imageCount={newport:2,voyageurs:2,bwca:2};
 for(const slug of Object.keys(pages)){
  const html=pages[slug];
  assert.equal((html.match(/<figure class="dg-photo /g)||[]).length,imageCount[slug]);
  const images=[...html.matchAll(/<figure class="dg-photo [\s\S]*?<img src="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(images).size,imageCount[slug],slug+' has repeated lead photograph');
  for(const p of gallery.filter(p=>p.placeId===slug)){
   if(html.includes(p.imageURL.replaceAll('&','&amp;'))){
    assert.ok(html.includes(p.sourceURL.replaceAll('&','&amp;')),p.id);
    assert.ok(html.includes(p.licenseURL.replaceAll('&','&amp;')),p.id);
    assert.ok(html.includes(p.alt),p.id);
   }
  }
  assert.match(html,/Archive ·/);
  assert.match(html,/fetchpriority="high"/);
 }
});
test('Responsive, scoped and noninterfering with existing park pages or weather model',()=>{
 for(const token of ['.destination-field-guide .hero','@media(max-width:850px)','@media(max-width:480px)','focus-visible','prefers-reduced-motion'])
  assert.ok(css.includes(token),token);
 assert.doesNotMatch(css,/adsbygoogle|data-ad-client|display:none!important/);
 assert.doesNotThrow(()=>new Function(js));
 assert.match(runtime,/new CustomEvent\('darksky:forecast'/);
 assert.match(runtime,/new CustomEvent\('darksky:forecast-error'/);
 assert.match(runtime,/Access unverified/);
 for(const slug of ['headlands','keweenaw','port-crescent','michigan','minnesota','midwest','wisconsin']){
  const html=fs.readFileSync(base+slug+'/index.html','utf8');
  assert.doesNotMatch(html,/destination-field-guide\.css|destination-newport|destination-bwca|destination-voyageurs/,slug);
 }
});
function client(slug){
 const callbacks={};const fields={
  darkSkyPayload:{textContent:JSON.stringify({place:{slug}})},
  dgPermitDate:{value:'',addEventListener(n,fn){callbacks.date=fn;}},
  dgPermitType:{value:'',addEventListener(n,fn){callbacks.type=fn;}},
  dgPermitResult:{children:[],textContent:'',replaceChildren(){this.children=[];},append(...n){this.children.push(...n);}},
  dgNewportWindows:{textContent:'',children:[],append(...n){this.children.push(...n);}}
 };
 const document={getElementById:id=>fields[id],createElement:tag=>({tag,textContent:'',className:'',children:[],append(...n){this.children.push(...n);}})};
 const window={addEventListener:(name,fn)=>callbacks[name]=fn};
 vm.runInNewContext(js,{document,window,Intl,Date,Number,String}, {timeout:1500});
 return {fields,callbacks};
}
test('BWCAW helper handles permit categories at seasonal boundaries',()=>{
 const {fields,callbacks}=client('bwca');
 const check=(date,type)=>{fields.dgPermitDate.value=date;fields.dgPermitType.value=type;callbacks.date();return fields.dgPermitResult.children.map(x=>x.textContent).join(' ');};
 assert.match(check('2027-07-18','overnight-paddle'),/Quota permit required/);
 assert.match(check('2027-05-01','motorized-day'),/Quota permit required/);
 assert.match(check('2027-09-30','overnight-hike'),/Quota permit required/);
 assert.match(check('2027-10-01','overnight-hike'),/Self-issued permit required/);
 assert.match(check('2027-04-30','overnight-motor'),/Self-issued permit required/);
 assert.match(check('2027-06-15','nonmotorized-day'),/Self-issued permit required/);
});
test('Newport filters out overnight model scores; fails closed if no forecast',()=>{
 const {fields,callbacks}=client('newport');
 const iso=(d,h)=>'2026-10-'+d+'T'+h+':00:00Z';
 assert.ok(callbacks['darksky:forecast']);
 callbacks['darksky:forecast']({detail:{slug:'newport',hours:[
  {time:iso('28','07'),sky:'dark',score:95,cloud:0},
  {time:iso('28','23'),sky:'dark',score:71,cloud:18},
  {time:iso('29','05'),sky:'dark',score:99,cloud:2}
 ],timeZone:'America/Chicago'}});
 const result=fields.dgNewportWindows;
 assert.ok(result.children.length);
 const listing=JSON.stringify(result.children);
 assert.match(listing,/71\/100/);
 assert.doesNotMatch(listing,/99\/100 relative sky index/);
 assert.match(listing,/outside standard visiting hours/);
 callbacks['darksky:forecast-error']();
 assert.match(result.textContent,/Verified NWS forecast unavailable/);
});
