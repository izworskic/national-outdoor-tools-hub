'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {UNIT,normalize,publishedCache,view,forActive}=require('../lib/gmn-observed-activity');
const now=Date.parse('2026-11-04T12:00:00Z');
const active=[{id:'STA',name:'Southern Taurids'},{id:'ORI',name:'Orionids'}];
const row=(observedAt,flux=0.031)=>({iauCode:'STA',flux,unit:UNIT,observedAt});
test('active Taurids: verified current network flux, explicit timestamp, no local meteors/hour',()=>{
 const record=row('2026-11-04T08:00:00Z');
 const data=view({observations:[record]},now);
 assert.equal(data.status,'ok');assert.equal(data.observations[0].flux,0.031);
 const result=forActive(data,active);
 assert.equal(result.status,'ok');assert.equal(result.items[0].observation.observedAt,record.observedAt);
 assert.equal(result.items[1].observation,null);
});
test('stale observation (49 h) never presented as current, keeps last good timestamp',()=>{
 const data=view({observations:[row('2026-11-02T11:00:00Z')]},now);
 assert.equal(data.status,'unavailable');assert.deepEqual(data.observations,[]);
 assert.equal(data.lastGoodAt,'2026-11-02T11:00:00.000Z');
 assert.equal(forActive(data,active).status,'unavailable');
});
test('bad GMN feed and no-data cache degrade without interfering with independent forecast',()=>{
 assert.deepEqual(view({observations:[]},now).observations,[]);
 assert.equal(forActive(view(null,now),active).status,'unavailable');
 assert.equal(forActive(view(null,now),[]).status,'no-active');
 assert.throws(()=>normalize({observations:[]}));
});
test('source must be an explicitly verified GMN flux file and unit must be calibrated',()=>{
 assert.throws(()=>publishedCache([row('2026-11-04T08:00:00Z')],'https://globalmeteornetwork.org/data/traj_summary_data/daily/',new Date(now).toISOString()));
 assert.equal(publishedCache([row('2026-11-04T08:00:00Z')],'https://globalmeteornetwork.org/flux/csv/',new Date(now).toISOString()).observations.length,1);
 assert.throws(()=>normalize({observations:[{...row('2026-11-04T08:00:00Z'),unit:'counts'}]}));
});
