const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const tools=['zion-narrows-conditions','grand-canyon-access','going-to-the-sun-road-status','haleakala-sunrise','kilauea-live','yellowstone-road-status','tioga-road-status','cadillac-mountain-sunrise','mount-rainier-road-status','lake-mead-access','lake-powell-ramp-status'];

function section(html,id){
  const start=html.indexOf(`id="region-${id}"`);
  assert.ok(start>=0,`missing region ${id}`);
  const next=html.indexOf('<section class="catalog-group region-cluster"',start+1);
  return html.slice(start,next<0?html.length:next);
}

test('national directory seats live destination tools in geographic regions',()=>{
  const html=fs.readFileSync('public/national-tools/index.html','utf8');
  assert.equal((html.match(/data-tool-id="live-decisions"/g)||[]).length,0,'collection page must not masquerade as a national utility card');
  assert.match(html,/href="\/national-tools\/live-decisions\/"/,'cross-region live destination index should remain discoverable');
  for(const id of tools) assert.equal((html.match(new RegExp(`data-tool-id="${id}"`,'g'))||[]).length,1,`${id} must appear exactly once`);

  const southwest=section(html,'southwest-colorado-plateau');
  for(const id of ['zion-narrows-conditions','grand-canyon-access','lake-mead-access','lake-powell-ramp-status']) assert.match(southwest,new RegExp(`data-tool-id="${id}"`));
  const rockies=section(html,'rockies');
  for(const id of ['going-to-the-sun-road-status','yellowstone-road-status']) assert.match(rockies,new RegExp(`data-tool-id="${id}"`));
  assert.match(section(html,'california-sierra'),/data-tool-id="tioga-road-status"/);
  assert.match(section(html,'pacific-northwest'),/data-tool-id="mount-rainier-road-status"/);
  assert.match(section(html,'northeast-great-lakes'),/data-tool-id="cadillac-mountain-sunrise"/);
  const hawaii=section(html,'hawaii');
  assert.match(hawaii,/data-tool-id="haleakala-sunrise"/);
  assert.match(hawaii,/data-tool-id="kilauea-live"/);

  const nationalStart=html.indexOf('aria-labelledby="national-tools-title"');
  const regionalStart=html.indexOf('class="regional-collections"',nationalStart);
  const national=html.slice(nationalStart,regionalStart);
  for(const id of tools) assert.doesNotMatch(national,new RegExp(`data-tool-id="${id}"`),`${id} must not remain in national utilities`);

  const schemaText=html.split('<script type="application/ld+json">')[1]?.split('</script>')[0];
  assert.ok(schemaText,'national ItemList schema missing');
  const schema=JSON.parse(schemaText);
  const list=schema?.['@graph']?.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
  assert.ok(list,'national ItemList missing');
  assert.equal(list.itemListElement.some(x=>x.url==='https://chrisizworski.com/national-tools/live-decisions/'),false,'collection page should not be counted as a tool');
  for(const id of tools) assert.equal(list.itemListElement.filter(x=>x.url===`https://chrisizworski.com/national-tools/${id}/`).length,1,`${id} must appear once in ItemList`);
  assert.equal(list.numberOfItems,list.itemListElement.length,'structured tool count must match ItemList length');
});

test('live destination entry page is geographic and seats Kilauea in Hawaii',()=>{
  const html=fs.readFileSync('public/national-tools/live-decisions/index.html','utf8');
  assert.match(html,/Start with where you're going\./);
  assert.match(html,/Southwest &amp; Colorado Plateau/);
  assert.equal((html.match(/href="\/national-tools\/kilauea-live\/"/g)||[]).length,1,'Kilauea must appear exactly once in collection');
  const hawaiiStart=html.indexOf('<p class="eyebrow">Hawaii</p>');
  assert.ok(hawaiiStart>=0,'collection Hawaii region missing');
  const nextRegion=html.indexOf('<section class="decision-region">',hawaiiStart+1);
  const hawaii=html.slice(hawaiiStart,nextRegion<0?html.length:nextRegion);
  assert.match(hawaii,/href="\/national-tools\/haleakala-sunrise\/"/);
  assert.match(hawaii,/href="\/national-tools\/kilauea-live\/"/);
  const schemaText=html.split('<script type="application/ld+json">')[1]?.split('</script>')[0];
  assert.ok(schemaText,'collection JSON-LD missing');
  const schema=JSON.parse(schemaText);
  const list=schema?.['@graph']?.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/live-decisions/#list');
  assert.ok(list,'collection ItemList missing');
  assert.equal(list.numberOfItems,11);
  assert.equal(list.itemListElement.filter(x=>x.url==='https://chrisizworski.com/national-tools/kilauea-live/').length,1);
  assert.equal(list.numberOfItems,list.itemListElement.length);
});
