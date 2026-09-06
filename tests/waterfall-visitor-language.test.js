"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const api=require("../api/national-waterfall-window-v5")._test;

test("moderate waterfall starts with a trip decision, not a data disclaimer",()=>{
  const result={
    waterfall:{name:"Miners Falls"},
    evidence_mode:"regional-proxy",
    regional_proxy:{percentile:47,gauge_count:5},
    intelligence:{
      now:{score:52,label:"Fair"},
      next_24h:{score:52,label:"Fair"},
      next_3d:{score:52,label:"Fair"},
      confidence:{value:.69,label:"Moderate"}
    },
    model:{current_cfs:12,peak_24h_cfs:12,peak_72h_cfs:12},
    precipitation:{qpf_72h_in:.21}
  };
  const g=api.buildVisitorGuidance(result);
  assert.equal(g.verdict,"Worth it if you're nearby");
  assert.match(g.headline,/moderate flow right now/i);
  assert.match(g.conditions,/respectable, moderate waterfall/i);
  assert.match(g.planning,/part of a larger day/i);
  assert.doesNotMatch(g.headline,/gauge|streamgage|proxy|USGS/i);
  assert.doesNotMatch(g.conditions,/gauge|streamgage|proxy|USGS/i);
  assert.match(g.confidence,/local watershed model plus nearby streams/i);
});

test("visitor labels make strong and weak windows immediately actionable",()=>{
  assert.equal(api.visitCall(94).label,"Make it a priority");
  assert.equal(api.visitCall(84).label,"Excellent day to go");
  assert.equal(api.visitCall(72).label,"Good day to go");
  assert.equal(api.visitCall(60).label,"Worth the trip");
  assert.equal(api.visitCall(47).label,"Worth it if you're nearby");
  assert.equal(api.visitCall(30).label,"Go for the place, not peak flow");
  assert.equal(api.visitCall(18).label,"Pick another day if flow is the goal");
});

test("waiting advice changes only when the modeled score change is meaningful",()=>{
  assert.equal(api.trendGuidance({now:{score:50},next_24h:{score:63},next_3d:{score:65}}).direction,"improving");
  assert.equal(api.trendGuidance({now:{score:50},next_24h:{score:52},next_3d:{score:51}}).direction,"steady");
  assert.equal(api.trendGuidance({now:{score:65},next_24h:{score:52},next_3d:{score:50}}).direction,"falling");
});
