const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('national directory links to the live decisions collection once',()=>{
  const html=fs.readFileSync('public/national-tools/index.html','utf8');
  const idMatches=html.match(/data-tool-id="live-decisions"/g)||[];
  assert.equal(idMatches.length,1,'live decisions discovery card must appear exactly once');
  assert.match(html,/href="\/national-tools\/live-decisions\/"/);
  const schemaText=html.split('<script type="application/ld+json">')[1]?.split('</script>')[0];
  assert.ok(schemaText,'national ItemList schema missing');
  const schema=JSON.parse(schemaText);
  const list=schema?.['@graph']?.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
  assert.ok(list,'national ItemList missing');
  const url='https://chrisizworski.com/national-tools/live-decisions/';
  assert.equal(list.itemListElement.filter(x=>x.url===url).length,1,'live decisions collection must appear once in ItemList');
  assert.equal(list.numberOfItems,list.itemListElement.length,'structured tool count must match ItemList length');
});
