"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const api=require("../api/national-waterfall-window-v4")._test;

test("regional runoff percentile maps monotonically to spectacle score",()=>{
  assert.ok(api.proxyBaseScore(20)<api.proxyBaseScore(50));
  assert.ok(api.proxyBaseScore(50)<api.proxyBaseScore(90));
});

test("local model trend changes future proxy score without inventing waterfall cfs",()=>{
  const result={
    model:{current_cfs:20,peak_24h_cfs:30,peak_72h_cfs:36,peak_24h_time:"2026-09-06T12:00:00Z",peak_72h_time:"2026-09-07T12:00:00Z"},
    precipitation:{qpf_72h_in:.7},
    intelligence:{caution:{level:"normal",message:"Not a safety rating."}}
  };
  const regional={percentile:70,gauge_count:3};
  const intel=api.proxyIntelligence(result,regional);
  assert.equal(intel.now.flow_cfs,null);
  assert.equal(intel.next_24h.peak_flow_cfs,null);
  assert.ok(intel.next_24h.score>intel.now.score);
  assert.equal(intel.confidence.label,"Moderate");
});

test("proxy narrative plainly says no live gauge at the falls",()=>{
  const result={
    waterfall:{name:"Miners Falls"},
    evidence_mode:"regional-proxy",
    regional_proxy:{percentile:72,gauge_count:3},
    intelligence:{now:{score:74,label:"Very good"},next_24h:{score:78,label:"Very good"},next_3d:{score:81,label:"Excellent"}},
    model:{current_cfs:10,peak_24h_cfs:12,peak_72h_cfs:16},
    precipitation:{qpf_72h_in:.4}
  };
  const n=api.narrative(result);
  assert.match(n.summary,/not a useful live streamgage/i);
  assert.match(n.summary,/does not assign another river's flow rate/i);
  assert.match(n.note,/inferred waterfall-volume signal/i);
});

test("regional gauge parser rejects stale and non-streamflow observations",()=>{
  const now=new Date().toISOString();
  const payload={features:[
    {geometry:{coordinates:[-86.5,46.5]},properties:{monitoring_location_id:"USGS-04000001",monitoring_location_name:"A",parameter_code:"00060",site_type_code:"ST",time:now,value:"100"}},
    {geometry:{coordinates:[-86.4,46.4]},properties:{monitoring_location_id:"USGS-04000002",monitoring_location_name:"B",parameter_code:"00065",site_type_code:"ST",time:now,value:"3"}},
    {geometry:{coordinates:[-86.3,46.3]},properties:{monitoring_location_id:"USGS-04000003",monitoring_location_name:"C",parameter_code:"00060",site_type_code:"LK",time:now,value:"100"}}
  ]};
  const rows=api.latestGaugeRows(payload,46.45,-86.55);
  assert.equal(rows.length,1);
  assert.equal(rows[0].id,"USGS-04000001");
});

test("flow percentile uses the gauge's own seasonal distribution",()=>{
  const stats={p25:100,p50:200,p75:300,p90:400};
  assert.equal(api.flowPercentile(200,stats),50);
  assert.equal(api.flowPercentile(300,stats),75);
  assert.equal(api.flowPercentile(400,stats),90);
});
