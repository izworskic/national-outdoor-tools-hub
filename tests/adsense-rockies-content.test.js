const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const text=html=>html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').replace(/\s+/g,' ').trim();
const words=s=>text(s).split(/\s+/).filter(Boolean).length;

test('Trail Ridge page has substantial publisher-written trip-planning content beyond the live widget',()=>{
  const html=read('public/national-tools/trail-ridge-road/index.html');
  assert.ok(words(html)>=1150,`Trail Ridge static content is too thin: ${words(html)} words`);
  for(const needle of ['Plan the drive, not just the status','How to read the live answer','A practical cross-park drive','Road status is not the same as trip quality','Trail Ridge Road FAQ','How this page is built']) assert.match(html,new RegExp(needle));
  assert.match(html,/1\.5 to 2 hours/i);
  assert.match(html,/48 miles/i);
  assert.match(html,/12,183 feet/i);
  assert.match(html,/Many Parks Curve/i);
  assert.match(html,/Milner Pass/i);
  assert.match(html,/Reviewed against official NPS source material/i);
});

test('Yellowstone page has substantial publisher-written day-planning content beyond prediction replication',()=>{
  const html=read('public/national-tools/yellowstone-geysers/index.html');
  assert.ok(words(html)>=1250,`Yellowstone static content is too thin: ${words(html)} words`);
  for(const needle of ['How to use a geyser prediction window','Choose the geyser that fits your day','Build a geyser day without spending it waiting','Why Yellowstone geyser predictions change','Yellowstone geyser timing FAQ','How this page is built']) assert.match(html,new RegExp(needle));
  for(const geyser of ['Old Faithful','Castle','Daisy','Grand','Riverside','Great Fountain']) assert.match(html,new RegExp(geyser));
  assert.match(html,/Upper Geyser Basin/i);
  assert.match(html,/Lower Geyser Basin/i);
  assert.match(html,/Reviewed against official Yellowstone NPS source material/i);
});

test('both Rockies pages keep clear navigation, internal discovery and primary-source links',()=>{
  for(const file of ['public/national-tools/trail-ridge-road/index.html','public/national-tools/yellowstone-geysers/index.html']){
    const html=read(file);
    assert.match(html,/href="\/national-tools\/rockies\/"/);
    assert.match(html,/href="\/national-tools\/"/);
    assert.match(html,/class="sources"/);
    assert.match(html,/nps\.gov/i);
    assert.match(html,/google-adsense-account/);
  }
});
