import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('public/national-tools/index.html','utf8');
const cardCount=html.split('data-search-card').length-1;
const schemaText=html.split('<script type="application/ld+json">')[1]?.split('</script>')[0];

assert.equal(cardCount,24,'directory should render 24 tool cards');
assert.ok(html.includes('data-tool-id="elk-rut"'),'elk rut discovery card missing');
assert.ok(html.includes('data-tool-id="yosemite-firefall"'),'Yosemite Firefall discovery card missing');
assert.ok(html.includes('data-season-toggle'),'season filter missing');
assert.ok(html.includes('national-tools-directory.css'),'directory stylesheet missing');
assert.ok(html.includes('national-tools-directory.js'),'directory script missing');

if(html.includes('id="regional-tools-title"')){
  assert.ok(html.includes('id="national-tools-title"'),'national utilities section missing');
  for(const region of ['northeast-great-lakes','appalachia-ohio-valley','southeast','mississippi-great-plains','rockies','california-sierra','pacific-northwest']){
    assert.ok(html.includes(`id="region-${region}"`),`missing regional collection ${region}`);
  }
}

assert.ok(schemaText,'national ItemList schema missing');
const schema=JSON.parse(schemaText);
const list=schema?.['@graph']?.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
assert.ok(list,'national ItemList missing');
assert.equal(list.numberOfItems,25,'structured tool count drifted');
assert.equal(list.itemListElement.length,25,'structured ItemList length drifted');
assert.equal(new Set(list.itemListElement.map(item=>item.url)).size,25,'ItemList URLs must be unique');
list.itemListElement.forEach((item,index)=>assert.equal(item.position,index+1,'ItemList positions must be contiguous'));

console.log(`National directory: PASS | cards=${cardCount} | structuredTools=${list.numberOfItems}`);
