"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const api=require("../api/national-waterfall-window-v2")._test;

test("real nested USGS observationNormals response parses for the requested day",()=>{
  const payload={type:"FeatureCollection",features:[{properties:{
    monitoring_location_id:"USGS-04045500",
    monitoring_location_name:"TAHQUAMENON RIVER NEAR PARADISE, MI",
    data:[{
      parameter_code:"00060",
      unit_of_measure:"ft^3/s",
      values:[{
        time_of_year:"09-05",
        time_of_year_type:"day_of_year",
        values:["209.7","232.4","255.5","346.0","569.0","845.0","1109.0"],
        percentiles:["5","10","25","50","75","90","95"],
        sample_count:73,
        approval_status:"approved"
      }]
    }]
  }}]};
  const stats=api.parseStatistics(payload,new Date("2026-09-05T12:00:00Z"));
  assert.deepEqual(stats,{p25:255.5,p50:346,p75:569,p90:845,sample_days:73,window_days:1,month:9,day:5});
});

test("flat percentile rows remain compatible",()=>{
  const payload={features:[{properties:{monitoring_location_id:"USGS-04045500",time_of_year_type:"day_of_year",time_of_year:"09-05",percentiles:[10,25,50,75,90],values:[100,150,225,340,500],sample_count:54}}]};
  const stats=api.parseStatistics(payload,new Date("2026-09-05T12:00:00Z"));
  assert.equal(stats.p50,225);
  assert.equal(stats.p90,500);
});

test("connected gauge climatology scales to the local NWM reach",()=>{
  const scaled=api.scalePercentiles({p25:100,p50:200,p75:300,p90:400,sample_days:50,window_days:1},300,200);
  assert.equal(scaled.scale_factor,1.5);
  assert.equal(scaled.p50,300);
  assert.equal(scaled.p90,600);
  assert.match(scaled.basis,/National Water Model reach/i);
});

test("enriched seasonal evidence produces a real spectacle score",()=>{
  const base={
    hydrologic_link:{comid:"12186603"},
    observation:{flow_cfs:250,trend_percent_24h:10,relation:"upstream-mainstem"},
    model:{current_cfs:300,peak_24h_cfs:350,peak_72h_cfs:420,peak_24h_time:"2026-09-06T12:00:00Z",peak_72h_time:"2026-09-07T12:00:00Z"},
    precipitation:{qpf_24h_in:.2,qpf_72h_in:.4},
    regulation:{detected:false}
  };
  const intelligence=api.recompute(base,{p25:150,p50:225,p75:340,p90:500});
  assert.notEqual(intelligence.now.score,null);
  assert.notEqual(intelligence.next_24h.score,null);
  assert.ok(intelligence.next_24h.score>=intelligence.now.score);
});
