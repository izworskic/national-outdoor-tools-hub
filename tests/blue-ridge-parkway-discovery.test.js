const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const directory=fs.readFileSync(path.join(root,'public','national-tools','index.html'),'utf8');
const appalachia=fs.readFileSync(path.join(root,'public','national-tools','appalachia','index.html'),'utf8');
const route='/blue-ridge-parkway/';

function sectionById(html,id){
  const start=html.indexOf(`id="${id}"`);
  assert.ok(start>=0,`missing section ${id}`);
  const next=html.indexOf('<section class="catalog-group region-cluster"',start+1);
  return html.slice(start,next>=0?next:html.length);
}

test('year-round Blue Ridge planner is listed once in Appalachia',()=>{
  assert.equal((directory.match(/data-tool-id="blue-ridge-parkway-live"/g)||[]).length,1);
  const appalachiaSection=sectionById(directory,'region-appalachia-ohio-valley');
  assert.match(appalachiaSection,/Blue Ridge Parkway Today &amp; Route Planner/);
  assert.ok(appalachiaSection.includes(`href="${route}"`));
  assert.match(appalachiaSection,/NPS road status \+ NWS mountain weather \+ route-time model/);
  assert.match(appalachiaSection,/data-months="1,2,3,4,5,6,7,8,9,10,11,12"/);
});

test('year-round route planner and fall-color specialist remain distinct decisions',()=>{
  const appalachiaSection=sectionById(directory,'region-appalachia-ohio-valley');
  assert.equal((appalachiaSection.match(/data-tool-id="blue-ridge-parkway-live"/g)||[]).length,1);
  assert.equal((appalachiaSection.match(/data-tool-id="blue-ridge-fall-color"/g)||[]).length,1);
  assert.ok(appalachiaSection.indexOf('data-tool-id="blue-ridge-parkway-live"')<appalachiaSection.indexOf('data-tool-id="blue-ridge-fall-color"'));
});

test('Appalachia desk hands off to the year-round Parkway planner',()=>{
  assert.match(appalachia,/data-blue-ridge-parkway-live="true"/);
  assert.ok(appalachia.includes(`href="${route}"`));
  assert.match(appalachia,/Choose a gateway, departure time and the hours you have/);
  assert.match(appalachia,/instead of starting from a generic list of overlooks/);
});

test('year-round planner discovery does not create gateway doorway cards',()=>{
  assert.doesNotMatch(directory,/data-tool-id="blue-ridge-(?:virginia|north-carolina|asheville|boone|roanoke|cherokee|waynesboro|craggy|linville)"/i);
});
