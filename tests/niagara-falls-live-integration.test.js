const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const config=JSON.parse(fs.readFileSync(path.join(__dirname,"..","vercel.json"),"utf8"));
const routes=new Map((config.rewrites||[]).map(rule=>[rule.source,rule.destination]));
const prefix="/national-tools/waterfalls/niagara-falls-live";
const origin="https://huge-exalted-printablecharacter.replit.app";
const waterfallHtml=fs.readFileSync(path.join(__dirname,"..","public","national-tools","waterfalls","index.html"),"utf8");

test("Niagara Falls Live canonical path proxies to its Replit deployment",()=>{
  assert.equal(routes.get(prefix),origin+"/");
  assert.equal(routes.get(prefix+"/"),origin+"/");
  assert.equal(routes.get(prefix+"/:path*"),origin+"/:path*");
});

test("Niagara proxy rules are more specific than the waterfall utility routes",()=>{
  const sources=(config.rewrites||[]).map(rule=>rule.source);
  assert.ok(sources.indexOf(prefix+"/:path*") < sources.indexOf("/national-tools/waterfalls/_assets/:path*"));
});

test("Waterfall Window hands Niagara visitors into the specialist live hub",()=>{
  assert.match(waterfallHtml,/Niagara Falls specialist/);
  assert.ok(waterfallHtml.includes('href="'+prefix+'/"'));
  assert.match(waterfallHtml,/border waits, Niagara River observations, visibility and mist, Maid of the Mist timing, rainbow conditions/i);
});
