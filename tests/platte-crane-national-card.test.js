const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('Platte Crane Live is wired into the national hub build with canonical ChrisIzworski URL',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));
  const script=fs.readFileSync(path.join(__dirname,'..','scripts','add-platte-crane.mjs'),'utf8');
  assert.match(pkg.scripts['vercel-build'],/add-platte-crane\.mjs/);
  assert.match(script,/https:\/\/chrisizworski\.com\/national-tools\/platte-crane-live/);
  assert.match(script,/Platte Crane Live/);
  assert.match(script,/Wildlife and migration tools/);
  assert.match(script,/Crane Trust \+ USGS \+ NOAA\/NWS/);
  assert.doesNotMatch(script,/live bird count[^'"`]*=/i);
});
