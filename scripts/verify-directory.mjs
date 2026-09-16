import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('public/national-tools/index.html','utf8');
const cardCount=html.split('data-search-card').length-1;
const toolIds=[...html.matchAll(/data-tool-id="([^"]+)"/g)].map(match=>match[1]);
const schemaText=html.split('<script type="application/ld+json">')[1]?.split('</script>')[0];
const thunderUrl='https://chrisizworski.com/national-tools/coastal/thunder-hole-live/';
const columbiaUrl='https://chrisizworski.com/national-tools/columbia-salmon-run/';
const birdUrl='https://chrisizworski.com/national-tools/bird-migration/';

assert.ok(cardCount>=28,`directory should render at least 28 specialist cards; found ${cardCount}`);
assert.equal(new Set(toolIds).size,toolIds.length,'directory tool ids must be unique');
assert.ok(html.includes('data-tool-id="elk-rut"'),'elk rut discovery card missing');
assert.ok(html.includes('data-tool-id="yosemite-firefall"'),'Yosemite Firefall discovery card missing');
assert.ok(html.includes('data-tool-id="thunder-hole"'),'Thunder Hole discovery card missing');
assert.ok(html.includes('data-tool-id="columbia-salmon"'),'Columbia Salmon Run discovery card missing');
assert.ok(html.includes('data-tool-id="bird-migration"'),'Bird Migration Morning Index discovery card missing');
assert.ok(html.includes(`href="${thunderUrl}"`),'Thunder Hole direct coastal discovery link missing');
assert.ok(html.includes(`href="/national-tools/columbia-salmon-run/"`),'Columbia Salmon Run direct discovery link missing');
assert.ok(html.includes(`href="/national-tools/bird-migration/"`),'Bird Migration Morning Index direct discovery link missing');
assert.ok(html.includes('id="region-northeast-great-lakes"'),'Northeast & Great Lakes collection missing');
assert.ok(html.includes('data-season-toggle'),'season filter missing');
assert.ok(html.includes('national-tools-directory.css'),'directory stylesheet missing');
assert.ok(html.includes('national-tools-directory.js'),'directory script missing');

if(html.includes('id="regional-tools-title"')){
  assert.ok(html.includes('id="national-tools-title"'),'national utilities section missing');
  for(const region of ['northeast-great-lakes','appalachia-ohio-valley','southeast','mississippi-great-plains','rockies','california-sierra','pacific-northwest']){
    assert.ok(html.includes(`id="region-${region}"`),`missing regional collection ${region}`);
  }
  for(const hub of ['/national-tools/appalachia/','/national-tools/great-plains/','/national-tools/pacific-northwest/']){
    assert.ok(html.includes(`href="${hub}"`),`missing regional decision-hub link ${hub}`);
  }
}

assert.ok(schemaText,'national ItemList schema missing');
const schema=JSON.parse(schemaText);
const list=schema?.['@graph']?.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
assert.ok(list,'national ItemList missing');
assert.equal(list.numberOfItems,list.itemListElement.length,'structured tool count drifted from ItemList length');
assert.equal(new Set(list.itemListElement.map(item=>item.url)).size,list.itemListElement.length,'ItemList URLs must be unique');
assert.ok(list.itemListElement.some(item=>item.url===thunderUrl),'Thunder Hole missing from ItemList');
assert.ok(list.itemListElement.some(item=>item.url===columbiaUrl),'Columbia Salmon Run missing from ItemList');
assert.ok(list.itemListElement.some(item=>item.url===birdUrl),'Bird Migration Morning Index missing from ItemList');
assert.ok(list.itemListElement.some(item=>item.url==='https://chrisizworski.com/national-tools/fall-color/blue-ridge-parkway/'),'Blue Ridge fall-color tool missing from ItemList');
assert.ok(!list.itemListElement.some(item=>item.url==='https://chrisizworski.com/national-tools/thunder-hole-live/'),'retired Thunder Hole canonical still in ItemList');
list.itemListElement.forEach((item,index)=>assert.equal(item.position,index+1,'ItemList positions must be contiguous'));

console.log(`National directory: PASS | cards=${cardCount} | structuredTools=${list.numberOfItems}`);