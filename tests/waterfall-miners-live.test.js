"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const handler=require("../api/national-waterfall-window-v4");
function response(){return{headers:{},code:200,body:null,setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(v){this.body=v;return v}}}
async function inspect(url,label){const r=await fetch(url,{headers:{accept:"application/json, application/geo+json","user-agent":"WaterfallMinersProbe/1.0"}});const body=await r.json().catch(()=>({}));console.log(label,JSON.stringify({status:r.status,numberMatched:body.numberMatched,numberReturned:body.numberReturned,features:(body.features||[]).slice(0,12).map(f=>({id:f?.properties?.monitoring_location_id,name:f?.properties?.monitoring_location_name,parameter:f?.properties?.parameter_code,time:f?.properties?.time,value:f?.properties?.value,coords:f?.geometry?.coordinates,data:f?.properties?.data}))}));return body}
test("Miners Falls produces useful live intelligence without invented flow",async()=>{
  const box="-89.065,44.735,-83.997,48.214";
  await inspect(`https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-continuous/items?f=json&bbox=${box}&parameter_code=00060&site_type_code=ST&limit=250`,"USGS_FILTERED_250");
  for(const id of ["USGS-04057800","USGS-04043016","USGS-04071765"]){
    await inspect(`https://api.waterdata.usgs.gov/statistics/v0/observationNormals?monitoring_location_id=${id}&parameter_code=00060&computation_type=percentile&normal_type=DOY&start_date=09-05&end_date=09-05&page_size=100`,`STATS_${id}`);
  }
  const req={method:"GET",query:{lat:"46.47443",lon:"-86.53122",name:"Miners Falls"}};
  const res=response();
  await handler(req,res);
  console.log("MINERS_LIVE",JSON.stringify({status:res.code,mode:res.body?.evidence_mode,score:res.body?.intelligence?.now?.score,label:res.body?.intelligence?.now?.label,confidence:res.body?.intelligence?.confidence,narrative:res.body?.narrative,regional:res.body?.regional_proxy,observation:res.body?.observation,model:res.body?.model,precipitation:res.body?.precipitation}));
  assert.equal(res.code,200);
  assert.ok(res.body?.narrative?.summary,"Miners Falls should return an explanatory narrative");
});
