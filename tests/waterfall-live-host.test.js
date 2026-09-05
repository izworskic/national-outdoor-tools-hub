"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const scoring=require("../lib/waterfall-window");
const search=require("../api/national-waterfall-search");
const api=require("../api/national-waterfall-window");

test("Waterfall modules load in the deployed hub",()=>{
  assert.equal(typeof search,"function");
  assert.equal(typeof api,"function");
  assert.equal(typeof scoring.buildWaterfallWindow,"function");
});

test("score is withheld without seasonal evidence",()=>{
  const result=scoring.buildWaterfallWindow({current_flow_cfs:200,nwm_peak_24h_cfs:250,nwm_peak_72h_cfs:300,seasonal:{},has_reach:true,has_nwm:true,has_precip:true});
  assert.equal(result.now.score,null);
  assert.equal(result.now.label,"Limited evidence");
  assert.equal(result.confidence.label,"Low");
});

test("score rises as modeled flow rises against the same baseline",()=>{
  const result=scoring.buildWaterfallWindow({current_flow_cfs:100,nwm_peak_24h_cfs:180,nwm_peak_72h_cfs:260,seasonal:{p25:50,p50:100,p75:180,p90:300},has_reach:true,has_nwm:true,has_gauge:true,has_seasonal:true,has_precip:true,gauge_relation:"upstream-mainstem"});
  assert.ok(result.next_24h.score>result.now.score);
  assert.ok(result.next_3d.score>result.next_24h.score);
  assert.equal(result.confidence.label,"High");
});

test("NWS rainfall does not directly boost an identical modeled flow score",()=>{
  const base={current_flow_cfs:100,nwm_peak_24h_cfs:150,nwm_peak_72h_cfs:150,seasonal:{p25:50,p50:100,p75:180,p90:300},has_reach:true,has_nwm:true,has_gauge:true,has_seasonal:true,gauge_relation:"upstream-mainstem"};
  const dry=scoring.buildWaterfallWindow({...base,qpf_72h_in:0,has_precip:true});
  const wet=scoring.buildWaterfallWindow({...base,qpf_72h_in:3,has_precip:true});
  assert.equal(dry.next_3d.score,wet.next_3d.score);
});

test("NLDI and NWM parsers accept expected response shapes",()=>{
  assert.equal(api._test.comid({features:[{properties:{nhdplus_comid:12345}}]}),"12345");
  assert.deepEqual(api._test.nwmPoints({shortRange:{series:{data:[{validTime:"2026-09-05T12:00:00Z",flow:123}]}}}),[{time:"2026-09-05T12:00:00Z",flow:123}]);
});
