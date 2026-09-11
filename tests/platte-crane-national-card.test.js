const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('Platte Crane Live is one event-oriented directory card',()=>{
  const root=path.join(__dirname,'..');
  const page=fs.readFileSync(path.join(root,'public','national-tools','index.html'),'utf8');
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.equal((page.match(/data-tool-id="platte-cranes"/g)||[]).length,1);
  assert.ok(page.includes('href="https://chrisizworski.com/national-tools/platte-crane-live"'));
  assert.match(page,/Crane Trust \+ USGS \+ NOAA\/NWS/);
  assert.match(pkg.scripts['vercel-build'],/verify-platte-crane\.mjs/);
  assert.doesNotMatch(pkg.scripts['vercel-build'],/add-platte-crane\.mjs/);
});
