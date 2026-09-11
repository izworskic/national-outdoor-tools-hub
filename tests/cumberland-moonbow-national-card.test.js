const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','public','national-tools','index.html'),'utf8');
const moonbowUrl='https://national-cumberland-moonbow-4k27.vercel.app/cumberland-falls-moonbow';

test('Cumberland Falls Moonbow Window is one discoverable specialist card',()=>{
  assert.equal((html.match(/data-tool-id="cumberland-moonbow"/g)||[]).length,1);
  assert.ok(html.includes(`href="${moonbowUrl}"`));
  assert.match(html,/GO\/NO-GO decision, Moonbow Score, best viewing window, arrival time and confidence/);
  assert.match(html,/Local moon geometry \+ NWS clouds \+ GOES nowcast \+ USGS river flow/);
  assert.match(html,/data-tags="[^"]*moonbow[^"]*"/);
  assert.doesNotMatch(html,/moonbow probability/i);
});
