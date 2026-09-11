const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const page=fs.readFileSync(path.join(root,'public','national-tools','index.html'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('Melvin Price has one maintained directory card instead of build-time duplicates',()=>{
  assert.equal((page.match(/data-tool-id="melvin-price"/g)||[]).length,1);
  assert.ok(page.includes('href="https://chrisizworski.com/national-tools/melvin-price-live/"'));
  assert.match(page,/Melvin Price Live/);
  assert.match(page,/USACE LPMS \+ CWMS stage\/flow \+ AIS \+ NWS \+ museum tours/);
  assert.doesNotMatch(pkg.scripts['vercel-build'],/add-melvin-price\.mjs/);
});
