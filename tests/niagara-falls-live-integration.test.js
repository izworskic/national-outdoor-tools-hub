const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const config=JSON.parse(fs.readFileSync(path.join(__dirname,"..","vercel.json"),"utf8"));
const redirects=new Map((config.redirects||[]).map(rule=>[rule.source,rule.destination]));
const legacy="/national-tools/waterfalls/niagara-falls-live";
const oldPlanner="/national-tools/niagara-falls-rainbow-planner";
const predictor="/national-tools/niagara-rainbow/";
const waterfallHtml=fs.readFileSync(path.join(__dirname,"..","public","national-tools","waterfalls","index.html"),"utf8");

test("Niagara routing contains no Replit dependency",()=>{
  const serialized=JSON.stringify(config);
  assert.doesNotMatch(serialized,/replit\.app/i);
  assert.doesNotMatch(serialized,/aqua-sharp-digits/i);
});

test("Old Niagara planner URLs permanently collapse into the Vercel-hosted predictor canonical",()=>{
  assert.equal(redirects.get(oldPlanner),predictor);
  assert.equal(redirects.get(oldPlanner+"/"),predictor);
  assert.equal(redirects.get(oldPlanner+"/:path*"),predictor);
});

test("Old Niagara Falls Live hub URLs permanently collapse into the predictor",()=>{
  assert.equal(redirects.get(legacy),predictor);
  assert.equal(redirects.get(legacy+"/"),predictor);
  assert.equal(redirects.get(legacy+"/:path*"),predictor);
});

test("Waterfall Window can retain its legacy planner handoff because that route permanently redirects",()=>{
  assert.match(waterfallHtml,/Niagara Falls rainbow planner/i);
  assert.ok(waterfallHtml.includes('href="'+oldPlanner+'/"'));
  assert.doesNotMatch(waterfallHtml,/full live Niagara hub/i);
});