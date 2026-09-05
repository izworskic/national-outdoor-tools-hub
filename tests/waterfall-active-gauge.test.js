"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const api=require("../api/national-waterfall-window-v3")._test;

test("network gauge candidates retain relation and valid USGS IDs",()=>{
  const payload={features:[
    {properties:{identifier:"USGS-04045000",name:"Old gauge"}},
    {properties:{identifier:"USGS-04045500",name:"Active gauge"}},
    {properties:{identifier:"NOT-USGS",name:"Ignore"}}
  ]};
  const rows=api.gaugeCandidates(payload,"downstream-mainstem");
  assert.deepEqual(rows.map(x=>x.site_no),["04045000","04045500"]);
  assert.ok(rows.every(x=>x.relation==="downstream-mainstem"));
});
