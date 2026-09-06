"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
async function get(url){const r=await fetch(url,{headers:{accept:"application/json,text/html","user-agent":"WaterfallVisitorProdProbe/1.0"}});const text=await r.text();console.log("PROD",JSON.stringify({url,status:r.status,type:r.headers.get("content-type"),head:text.slice(0,350)}));assert.equal(r.status,200);return text}
test("live Waterfall page and Miners recommendation are visitor-first",async()=>{
  const html=await get("https://chrisizworski.com/national-tools/waterfalls/");
  assert.match(html,/Should you go\?/i);
  assert.match(html,/visitVerdict/);
  assert.match(html,/Should I go\?/i);
  const raw=await get("https://chrisizworski.com/national-tools/waterfalls/_api?lat=46.4747247&lon=-86.5314088&name=Miners%20Falls");
  const d=JSON.parse(raw);
  console.log("MINERS_VISITOR",JSON.stringify({methodology:d.methodology_version,score:d.intelligence?.now?.score,label:d.intelligence?.now?.label,verdict:d.visitor_guidance?.verdict,headline:d.visitor_guidance?.headline,conditions:d.visitor_guidance?.conditions,planning:d.visitor_guidance?.planning,confidence:d.visitor_guidance?.confidence}));
  assert.equal(d.methodology_version,"waterfall-window-v1.6.0");
  assert.equal(d.visitor_guidance?.verdict,"Worth it if you're nearby");
  assert.match(d.visitor_guidance?.headline||"",/moderate flow right now/i);
  assert.doesNotMatch(d.visitor_guidance?.headline||"",/gauge|streamgage|proxy|USGS/i);
  assert.doesNotMatch(d.visitor_guidance?.conditions||"",/gauge|streamgage|proxy|USGS/i);
});
