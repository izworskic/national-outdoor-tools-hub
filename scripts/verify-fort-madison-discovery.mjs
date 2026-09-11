import fs from 'node:fs';
import assert from 'node:assert/strict';

const landing=fs.readFileSync('public/national-tools/index.html','utf8');
const water=fs.readFileSync('public/national-tools/water/index.html','utf8');
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const url='https://chrisizworski.com/national-tools/fort-madison-live/';

assert.equal((landing.match(/data-tool-id="fort-madison"/g)||[]).length,1,'Fort Madison must have one catalog card');
assert.match(landing,/See what reaches Fort Madison next/);
assert.ok(water.includes(url),'Fort Madison missing from water guide');

const schema=JSON.parse(landing.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const list=schema['@graph'].find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
assert.ok(list.itemListElement.some(item=>item.url===url),'Fort Madison missing from ItemList');

const rewrites=vercel.rewrites||[];
assert.ok(rewrites.some(rule=>rule.source==='/national-tools/fort-madison-live/'&&rule.destination==='https://fort-madison-live.vercel.app/'),'Fort Madison root rewrite missing');
assert.ok(rewrites.some(rule=>rule.source==='/national-tools/fort-madison-live/:path*'&&rule.destination==='https://fort-madison-live.vercel.app/:path*'),'Fort Madison catch-all rewrite missing');

console.log('Fort Madison discovery: PASS | one catalog card + water guide handoff');
