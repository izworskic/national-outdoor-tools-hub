'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/assets/gmn-observed-component.js','utf8');
const now=Date.parse('2026-10-29T00:14:12Z');
const showers=[{id:'STA',name:'Southern Taurids'},{id:'ORI',name:'Orionids'}];
const record=(id,flux,count,time)=>({iauCode:id,observedAt:new Date(time).toISOString(),flux,
 unit:'meteors/1000 km2/hour (+6.5 mag)',confidenceLow:flux*0.8,confidenceHigh:flux*1.2,meteorCount:count});
async function display(calendar,measurements){
 const status={textContent:''},items={children:[],replaceChildren(){this.children=[];},appendChild(p){this.children.push(p);}};
 const host={querySelector(x){return x==='[data-gmn-status]'?status:items;}};
 const document={getElementById(id){return id==='gmnObservedNetwork'?host:null;},createElement(){return {className:'',textContent:''};}};
 const FakeDate=class extends Date {static now(){return now;}};
 const fetch=async url=>{
  const data=url.endsWith('meteor-calendar')?calendar:measurements;
  if(data==='failed')return {ok:false,status:503,json:async()=>({})};
  return {ok:true,json:async()=>data};
 };
 vm.runInNewContext(source,{document,fetch,Date:FakeDate,Intl,AbortSignal:{timeout:()=>null}});
 await new Promise(resolve=>setImmediate(resolve));
 return {status:status.textContent,lines:items.children.map(c=>c.textContent)};
}
test('shared park component prints source 95% intervals, counts, approximate local bin times',async()=>{
 const s=await display({status:'ok',active:showers},{status:'ok',observations:[record('STA',.57,180,now-3*3600000),record('ORI',3.841,235,now-4*3600000)]});
 assert.match(s.status,/independent of the local viewing index/);
 assert.equal(s.lines.length,2);
 assert.match(s.lines[0],/95% confidence interval/);
 assert.match(s.lines[0],/180 meteors/);
 assert.match(s.lines[1],/235 meteors/);
 assert.match(s.lines[0],/approximate GMN observation-bin center/);
});
test('shared park component suppresses stale 49h measurement and preserves last-good context',async()=>{
 const s=await display({status:'ok',active:showers},{status:'unavailable',observations:[record('STA',.57,180,now-49*3600000)],lastGoodAt:new Date(now-49*3600000).toISOString()});
 assert.ok(s.lines.every(x=>!x.includes('0.570')));
 assert.match(s.lines.join(' '),/No current GMN flux/);
 assert.match(s.lines.join(' '),/Last verified bin/);
});
test('shared park component degrades without requiring GMN or NWS forecasts',async()=>{
 const s=await display({status:'ok',active:showers},'failed');
 assert.match(s.status,/temporarily unavailable/);
 assert.equal(s.lines.length,0);
 const noActive=await display({status:'ok',active:[]},'failed');
 assert.match(noActive.status,/No major meteor shower/);
 const noCalendar=await display('failed',{status:'ok',observations:[]});
 assert.match(noCalendar.status,/calendar unavailable/);
});
