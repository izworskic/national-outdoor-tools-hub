import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('public/national-tools/index.html','utf8');
const css=fs.readFileSync('public/national-tools/assets/national-tools-directory.css','utf8');
const organizer=fs.readFileSync('scripts/organize-regional-directory.mjs','utf8');
const readme=fs.readFileSync('README.md','utf8');

test('House Reality Check is a distinct Everyday Decisions family member',()=>{
  assert.match(html,/class="catalog-group everyday-decisions"/);
  assert.match(html,/id="everyday-tools-title">Use the same decision-engine approach beyond outdoors\./);
  assert.match(html,/data-tool-id="house-fit" data-personas="everyday"/);
  assert.match(html,/Can I Afford This House\? True Monthly Cost/);
  assert.match(html,/https:\/\/chrisizworski\.com\/can-i-afford-this-house\//);
  assert.match(html,/Reality Gap above the mortgage payment/);
  assert.match(html,/data-filter="everyday"/);
  assert.match(html,/Home decisions<span>Buying and ownership cost<\/span>/);
  assert.doesNotMatch(html,/data-tool-id="house-fit" data-personas="(?:trip|conditions|event|garden)/);
});

test('Everyday Decisions stays separate from outdoor national and regional taxonomies',()=>{
  const nationalStart=html.indexOf('class="catalog-group national-utilities"');
  const everydayStart=html.indexOf('class="catalog-group everyday-decisions"');
  const regionalStart=html.indexOf('class="regional-collections"');
  assert.ok(nationalStart>=0);
  assert.ok(everydayStart>nationalStart);
  assert.ok(regionalStart>everydayStart);
  const everydaySlice=html.slice(everydayStart,regionalStart);
  assert.match(everydaySlice,/data-tool-id="house-fit"/);
  assert.doesNotMatch(everydaySlice,/data-tool-id="rivers"/);
  assert.doesNotMatch(everydaySlice,/class="catalog-group region-cluster"/);
  assert.match(html,/Outdoor remains the core\. Everyday Decisions stays separate\./);
});

test('directory build pipeline preserves the new family',()=>{
  assert.match(organizer,/const everydayIds=\['house-fit'\]/);
  assert.match(organizer,/\.\.\.everydayIds/);
  assert.match(organizer,/const everyday=`<section class="catalog-group everyday-decisions"/);
  assert.match(organizer,/html\.slice\(0,start\)\+national\+'\\n\\n'\+everyday\+'\\n\\n'\+regional/);
  assert.match(readme,/## Adjacent Everyday Decisions lane/);
});

test('House Reality Check is in the ordered structured-data catalog exactly once',()=>{
  const schemaText=html.split('<script type="application/ld+json">')[1]?.split('</script>')[0];
  assert.ok(schemaText);
  const schema=JSON.parse(schemaText);
  const list=schema?.['@graph']?.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
  assert.ok(list);
  const matches=list.itemListElement.filter(x=>x.url==='https://chrisizworski.com/can-i-afford-this-house/');
  assert.equal(matches.length,1);
  assert.equal(matches[0].name,'Can I Afford This House? True Monthly Cost');
  assert.equal(list.numberOfItems,list.itemListElement.length);
  assert.match(list.name,/Everyday Decisions/);
});

test('desktop filter layout and Everyday lane styling support the sixth intent',()=>{
  assert.match(css,/\.persona-picks\{display:grid;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(css,/\.everyday-decisions\{/);
  assert.match(css,/\.everyday-decisions \.catalog-grid\{grid-template-columns:minmax\(0,680px\)\}/);
  assert.match(html,/national-tools-directory\.css\?v=20261007-1/);
});
