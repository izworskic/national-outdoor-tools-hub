const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const directory=fs.readFileSync(path.join(root,'public','national-tools','index.html'),'utf8');
const fallHub=fs.readFileSync(path.join(root,'public','national-tools','fall','index.html'),'utf8');
const route='/national-tools/fall-color/blue-ridge-parkway/';

function sectionById(html,id){
  const start=html.indexOf(`id="${id}"`);
  assert.ok(start>=0,`missing section ${id}`);
  const next=html.indexOf('<section class="catalog-group region-cluster"',start+1);
  return html.slice(start,next>=0?next:html.length);
}

test('Blue Ridge is listed once in the Appalachia regional collection',()=>{
  assert.equal((directory.match(/data-tool-id="blue-ridge-fall-color"/g)||[]).length,1);
  const appalachia=sectionById(directory,'region-appalachia-ohio-valley');
  assert.match(appalachia,/Blue Ridge Parkway Fall Color Live/);
  assert.ok(appalachia.includes(`href="${route}"`));
  assert.match(appalachia,/Virginia &amp; North Carolina/);
  assert.match(appalachia,/USA-NPN phenology/);
  assert.match(appalachia,/NPS road status/);
});

test('Blue Ridge discovery stays a single corridor engine, not a set of doorway cards',()=>{
  const cardIds=[...directory.matchAll(/data-tool-id="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(cardIds.filter(id=>id==='blue-ridge-fall-color').length,1);
  assert.doesNotMatch(directory,/data-tool-id="blue-ridge-(?:virginia|north-carolina|asheville|boone|linville|craggy)/i);
});

test('fall planning hub hands off directly to the corridor decision engine',()=>{
  assert.match(fallHub,/data-blue-ridge-fall-color-handoff="true"/);
  assert.ok(fallHub.includes(`href="${route}"`));
  assert.match(fallHub,/Which elevation is best now\?/);
  assert.match(fallHub,/weather stress, drought and road status kept separate/i);
});