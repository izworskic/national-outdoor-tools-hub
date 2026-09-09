const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('Platte Crane Live is wired into the national hub build with canonical ChrisIzworski URL',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));
  const script=fs.readFileSync(path.join(__dirname,'..','scripts','add-platte-crane.mjs'),'utf8');
  const verify=fs.readFileSync(path.join(__dirname,'..','scripts','verify-platte-crane.mjs'),'utf8');
  const build=pkg.scripts['vercel-build'];
  assert.match(build,/add-platte-crane\.mjs/);
  assert.match(build,/verify-platte-crane\.mjs/);
  assert.ok(build.indexOf('add-platte-crane.mjs')>build.indexOf('add-melvin-price.mjs'),'Platte injection must run after later hub card mutations');
  assert.ok(build.indexOf('verify-platte-crane.mjs')>build.indexOf('add-platte-crane.mjs'),'Platte verification must run after injection');
  assert.match(script,/https:\/\/chrisizworski\.com\/national-tools\/platte-crane-live/);
  assert.match(script,/Platte Crane Live/);
  assert.match(script,/Wildlife and migration tools/);
  assert.match(script,/Crane Trust \+ USGS \+ NOAA\/NWS/);
  assert.match(verify,/structured data/);
  assert.doesNotMatch(script,/live bird count[^'"`]*=/i);
});
