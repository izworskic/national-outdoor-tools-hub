"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const handler=require("../api/national-waterfall-window-v5");
function response(){return{headers:{},code:200,body:null,setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(v){this.body=v;return v}}}
test("Miners Falls produces useful live intelligence without invented flow",async()=>{
  const req={method:"GET",query:{lat:"46.47443",lon:"-86.53122",name:"Miners Falls"}};
  const res=response();
  await handler(req,res);
  console.log("MINERS_LIVE",JSON.stringify({status:res.code,methodology:res.body?.methodology_version,mode:res.body?.evidence_mode,score:res.body?.intelligence?.now?.score,label:res.body?.intelligence?.now?.label,confidence:res.body?.intelligence?.confidence,narrative:res.body?.narrative,regional:res.body?.regional_proxy,model:res.body?.model,precipitation:res.body?.precipitation}));
  assert.equal(res.code,200);
  assert.equal(res.body?.evidence_mode,"regional-proxy");
  assert.ok(Number.isFinite(res.body?.intelligence?.now?.score),"Miners Falls should return a numerical waterfall outlook");
  assert.equal(res.body?.intelligence?.now?.flow_cfs,null,"proxy mode must never invent waterfall CFS");
  assert.ok(res.body?.regional_proxy?.gauge_count>=1,"regional proxy should disclose contributing USGS stations");
  assert.ok(res.body?.narrative?.summary,"Miners Falls should return an explanatory narrative");
  assert.match(res.body.narrative.summary,/does not assign another river's flow rate/i);
});
