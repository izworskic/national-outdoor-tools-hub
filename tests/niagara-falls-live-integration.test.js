const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const config=JSON.parse(fs.readFileSync(path.join(__dirname,"..","vercel.json"),"utf8"));
const routes=new Map((config.rewrites||[]).map(rule=>[rule.source,rule.destination]));
const redirects=new Map((config.redirects||[]).map(rule=>[rule.source,rule.destination]));
const legacy="/national-tools/waterfalls/niagara-falls-live";
const planner="/national-tools/niagara-falls-rainbow-planner/";
const origin="https://aqua-sharp-digits.replit.app";
const waterfallHtml=fs.readFileSync(path.join(__dirname,"..","public","national-tools","waterfalls","index.html"),"utf8");

test("Standalone Niagara rainbow planner proxies to its dedicated Replit app",()=>{
  assert.equal(routes.get(planner),origin+planner);
  assert.equal(routes.get(planner+":path*"),origin+planner+":path*");
});

test("Old Niagara hub URLs permanently collapse into the standalone planner",()=>{
  assert.equal(redirects.get(legacy),planner);
  assert.equal(redirects.get(legacy+"/"),planner);
  assert.equal(redirects.get(legacy+"/:path*"),planner);
});

test("Standalone planner normalizes to the trailing-slash canonical",()=>{
  assert.equal(redirects.get("/national-tools/niagara-falls-rainbow-planner"),planner);
});

test("No Niagara Falls Live proxy remains",()=>{
  const destinations=(config.rewrites||[]).map(rule=>rule.destination);
  assert.ok(!destinations.some(value=>value.includes("jubilant-lost-bloatware.replit.app")));
});

test("Waterfall Window hands Niagara visitors to the standalone rainbow planner",()=>{
  assert.match(waterfallHtml,/Niagara Falls rainbow planner/i);
  assert.ok(waterfallHtml.includes('href="'+planner+'"'));
  assert.doesNotMatch(waterfallHtml,/full live Niagara hub/i);
});
