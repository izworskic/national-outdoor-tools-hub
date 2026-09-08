const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const html=fs.readFileSync(path.join(__dirname,"..","public","national-tools","index.html"),"utf8");
const moonbowUrl="https://national-cumberland-moonbow-4k27.vercel.app/cumberland-falls-moonbow";

test("Cumberland Falls Moonbow Window is discoverable as a live single-purpose tool",()=>{
  assert.ok(html.split(`href="${moonbowUrl}"`).length-1>=3,"moonbow tool needs decision, featured and library links");
  assert.match(html,/"position":13[^\n]+"name":"Cumberland Falls Moonbow Window"/);
  assert.match(html,/GO\/NO-GO decision, Moonbow Score, best viewing window, arrival time, confidence/);
  assert.match(html,/Local moon geometry \+ NWS clouds \+ GOES nowcast \+ USGS river flow/);
  assert.match(html,/data-tags="[^"]*moonbow[^"]*"/);
  assert.doesNotMatch(html,/moonbow probability/i);
});
