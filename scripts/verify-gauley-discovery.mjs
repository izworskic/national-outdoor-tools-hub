import fs from 'node:fs';
import assert from 'node:assert/strict';

const landing=fs.readFileSync('public/national-tools/index.html','utf8');
const water=fs.readFileSync('public/national-tools/water/index.html','utf8');
const url='https://chrisizworski.com/national-tools/gauley-release-live/';

assert.equal((landing.match(/data-tool-id="gauley"/g)||[]).length,1,'Gauley must have one catalog card');
assert.match(landing,/private paddlers, raft guests, spectators and photographers/i);
assert.match(landing,/only after live onset is confirmed/i);
assert.match(water,/Gauley Release Live/);
assert.match(water,/observed operations|release pulse/i);
assert.match(landing,/G-Y5D2V2W7HN/,'landing GA4 contract missing');
assert.match(water,/G-Y5D2V2W7HN/,'water hub GA4 contract missing');

const schema=JSON.parse(landing.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const list=schema['@graph'].find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
assert.ok(list.itemListElement.some(item=>item.url===url),'Gauley missing from ItemList');
assert.equal(list.numberOfItems,list.itemListElement.length,'ItemList count mismatch');
assert.ok(water.includes(url),'Gauley missing from water guide');

console.log('Gauley discovery: PASS | one catalog card + water guide handoff');
