import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('public/national-tools/index.html','utf8');
const css=fs.readFileSync('public/national-tools/assets/national-tools-directory.css','utf8');
const js=fs.readFileSync('public/national-tools/assets/national-tools-directory.js','utf8');
const cardIds=[...html.matchAll(/data-tool-id="([^"]+)"/g)].map(match=>match[1]);

assert.equal(cardIds.length,24,'directory should render 24 tool cards');
assert.equal(new Set(cardIds).size,cardIds.length,'every tool card needs one unique ID');
assert.equal((html.match(/data-search-card/g)||[]).length,24,'search index and visible card count drifted');
assert.doesNotMatch(html,/class="(?:[^"]*\s)?(?:intent-card|feature-card|tool-card)(?:\s|\")/,'legacy duplicate-card surface returned');
assert.doesNotMatch(html,/class="(?:[^"]*\s)?(?:decision-network|featured-tools|library-group)(?:\s|\")/,'legacy duplicate section returned');

for(const filter of ['all','trip','conditions','event','garden']){
  assert.match(html,new RegExp(`data-filter="${filter}"`),`missing ${filter} persona filter`);
}
assert.match(html,/data-season-toggle/);
assert.match(html,/national-tools-directory\.css/);
assert.match(html,/national-tools-directory\.js/);
assert.match(css,/\.directory-card/);
assert.match(js,/data-search-card/);
assert.match(html,/id="national-tools-title"/,'national utilities section missing');
assert.match(html,/id="regional-tools-title"/,'regional collections section missing');
for(const region of ['northeast-great-lakes','appalachia-ohio-valley','southeast','mississippi-great-plains','rockies','california-sierra','pacific-northwest']){
  assert.match(html,new RegExp(`id="region-${region}"`),`missing regional collection ${region}`);
}
assert.match(html,/data-tool-id="elk-rut"/,'elk rut discovery card missing');
assert.match(html,/href="https:\/\/chrisizworski\.com\/national-tools\/elk-rut\/"/,'elk rut canonical link missing');
assert.match(html,/data-tool-id="yosemite-firefall"/,'Yosemite Firefall discovery card missing');

const schemaText=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
assert.ok(schemaText,'national ItemList schema missing');
const schema=JSON.parse(schemaText);
const list=schema?.['@graph']?.find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
assert.ok(list,'national ItemList missing');
assert.equal(list.numberOfItems,25,'structured tool count drifted');
assert.equal(list.numberOfItems,list.itemListElement.length,'structured tool count must match ItemList entries');
assert.equal(new Set(list.itemListElement.map(item=>item.url)).size,list.itemListElement.length,'ItemList URLs must be unique');
list.itemListElement.forEach((item,index)=>{
  assert.equal(item.position,index+1,'ItemList positions must be contiguous');
  const path=new URL(item.url).origin==='https://chrisizworski.com'?new URL(item.url).pathname:null;
  assert.ok(html.includes(`href="${item.url}"`)||(path&&html.includes(`href="${path}"`)),`missing crawlable link for ${item.name}`);
});

console.log(`National directory: PASS | cards=${cardIds.length} | structuredTools=${list.numberOfItems}`);
