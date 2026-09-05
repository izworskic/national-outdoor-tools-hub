"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
async function probe(url){const r=await fetch(url,{headers:{accept:"text/html,application/json","user-agent":"WaterfallProductionProbe/1.0"}});const body=await r.text();console.log("PROBE",JSON.stringify({url,status:r.status,type:r.headers.get("content-type"),body:body.slice(0,300).replace(/\s+/g," ")}));return{r,body};}
test("Waterfall Window production is live and produces Tahquamenon intelligence",async()=>{
  const page=await probe("https://chrisizworski.com/national-tools/waterfalls/");
  assert.equal(page.r.status,200);
  assert.match(page.body,/Waterfall Window/);
  const search=await probe("https://chrisizworski.com/national-tools/waterfalls/_search?q=Tahquamenon%20Falls");
  assert.equal(search.r.status,200);
  const searchData=JSON.parse(search.body);
  const item=searchData.results?.[0];
  assert.ok(item?.latitude&&item?.longitude);
  const apiUrl=`https://chrisizworski.com/national-tools/waterfalls/_api?lat=${encodeURIComponent(item.latitude)}&lon=${encodeURIComponent(item.longitude)}&name=${encodeURIComponent(item.name)}`;
  const analysis=await probe(apiUrl);
  assert.equal(analysis.r.status,200);
  const result=JSON.parse(analysis.body);
  console.log("TAHQUAMENON_FINAL",JSON.stringify({name:result.waterfall?.name,methodology:result.methodology_version,comid:result.hydrologic_link?.comid,score:result.intelligence?.now?.score,label:result.intelligence?.now?.label,confidence:result.intelligence?.confidence?.label,degraded:result.degraded,gauge_id:result.observation?.gauge_id,gauge:result.observation?.gauge_name,flow_cfs:result.observation?.flow_cfs,model_now_cfs:result.model?.current_cfs,seasonal:result.seasonal}));
  assert.ok(Number.isFinite(result.intelligence?.now?.score),"production should return a numerical spectacle score");
  assert.ok(result.seasonal?.p25!=null&&result.seasonal?.p50!=null&&result.seasonal?.p75!=null&&result.seasonal?.p90!=null,"production should return seasonal percentile context");
});
