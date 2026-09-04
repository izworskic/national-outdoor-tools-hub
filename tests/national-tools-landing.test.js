const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const html=fs.readFileSync(path.join(__dirname,"..","public","national-tools","index.html"),"utf8");

test("national landing is a specialist tool directory, not a mega location dashboard",()=>{
  assert.doesNotMatch(html,/id="hub-location"/);
  assert.doesNotMatch(html,/id="outdoor-desk"/);
  assert.doesNotMatch(html,/saved-place comparison/i);
  assert.doesNotMatch(html,/build my outdoor desk/i);
  assert.doesNotMatch(html,/data-use-location/);
  assert.match(html,/What are you trying to do\?/);
  assert.match(html,/Find a national tool/);
});

test("national landing keeps each core decision tool directly crawlable",()=>{
  const routes=[
    "/national-tools/aurora/",
    "/national-tools/rivers/",
    "/national-tools/coastal/",
    "/national-tools/snow/",
    "/national-tools/white-christmas/",
    "/national-tools/frost/",
    "/national-tools/planting/",
    "/national-tools/garden-water/",
    "/national-tools/fall-color/"
  ];
  for(const route of routes){
    assert.ok(html.includes('href="'+route+'"'),"missing "+route);
  }
});

test("national landing preserves topic hubs and Michigan handoff",()=>{
  for(const route of [
    "/national-tools/garden/",
    "/national-tools/fall/",
    "/national-tools/water/",
    "/national-tools/night-sky/",
    "/tools/"
  ]){
    assert.ok(html.includes('href="'+route+'"'),"missing "+route);
  }
});

test("landing page finder filters the library but does not synthesize a place readout",()=>{
  assert.match(html,/data-filter="season"/);
  assert.match(html,/data-search-card/);
  assert.match(html,/filter helps you choose a tool; it does not generate a combined location report/i);
  assert.doesNotMatch(html,/NationalDashboard|national-dashboard\.js|N\.bind\(/);
});
