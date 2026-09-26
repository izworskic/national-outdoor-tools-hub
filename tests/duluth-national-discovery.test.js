const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Duluth Canal Park is discoverable from the national tools directory',()=>{
  const html=read('public/national-tools/index.html');
  assert.match(html,/data-tool-id="duluth-canal-park"/);
  assert.match(html,/Duluth Ship Schedule Today &amp; Canal Park Live Cams|Duluth Ship Schedule Today & Canal Park Live Cams/);
  assert.match(html,/https:\/\/chrisizworski\.com\/duluth-canal-park\//);
  const regionAt=html.indexOf('id="region-northeast-great-lakes"');
  const nextRegion=html.indexOf('class="catalog-group region-cluster"',regionAt+1);
  const region=html.slice(regionAt,nextRegion>regionAt?nextRegion:html.length);
  assert.match(region,/data-tool-id="duluth-canal-park"/);
});

test('Northeast and Great Lakes regional desk includes Duluth as a live ship-watching decision',()=>{
  const html=read('public/national-tools/northeast-great-lakes/index.html');
  assert.match(html,/data-duluth-national/);
  assert.match(html,/Duluth ship passage window/);
  assert.match(html,/Open Duluth Canal Park Live/);
  assert.match(html,/https:\/\/chrisizworski\.com\/duluth-canal-park\//);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const list=schema['@graph'].find(x=>x['@id']==='https://chrisizworski.com/national-tools/northeast-great-lakes/#tools');
  assert.ok(list.itemListElement.some(x=>x.url==='https://chrisizworski.com/duluth-canal-park/'));
  assert.equal(list.numberOfItems,list.itemListElement.length);
});
