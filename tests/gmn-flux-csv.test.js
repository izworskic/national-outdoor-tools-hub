'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseFluxCsv,solarLongitudeToUtc,solarLongitudeJ2000,fileUrl,UNIT}=require('../lib/gmn-flux-csv.js');
const header='# Sol bin start (deg), Mean Sol (deg), TAP-weighted Sol (deg), Flux@+6.5M no diurnal corr, Flux@+6.5M (met / 1000 km^2 h), Flux CI low, Flux CI high, Flux@+4.59M (met / 1000 km^2 h), Flux CI low, Flux CI high, ZHR, ZHR CI low, ZHR CI high, Meteor Count, Time-area product (corrected to +6.5M) (1000 km^2/h), Meteor LM, Radiant elev (deg), Radiat dist (deg), Ang vel (deg/s)';
const data=['# Shower parameters:','# Shower = STA',header,
'214.47070504,214.55278342,214.55455351,0.589,0.570,0.491,0.658,0.116,0.100,0.134,1.555,1.339,1.796,180,315.901,4.36,57.42,63.20,10.55',
'214.63840199,,,,,,,,,,,,,,,,,'].join('\n');
test('official GMN optical flux CSV is parsed without misreading ZHR/count and incomplete rows',()=>{
 const observations=parseFluxCsv(data,'STA',2026);
 assert.equal(observations.length,1);
 const o=observations[0];
 assert.equal(o.flux,0.570);
 assert.equal(o.unit,UNIT);
 assert.equal(o.confidenceLow,0.491);
 assert.equal(o.confidenceHigh,0.658);
 assert.match(o.timeBasis,/approximate bin center/);
 assert.equal(o.sourceFile,fileUrl('STA',2026));
});
test('J2000 solar-longitude conversion agrees with GMN published reference update to 5 minutes',()=>{
 const published=Date.parse('2026-10-28T08:00:53Z');
 const inferred=Date.parse(solarLongitudeToUtc(214.5427,2026));
 assert.ok(Math.abs(inferred-published)<5*60000,Math.abs(inferred-published)+' ms discrepancy');
 assert.ok(Math.abs(solarLongitudeJ2000(inferred)-214.5427)<0.0001);
});
test('Quadrantids solar longitude 283 resolves to January of named file year',()=>{
 const iso=solarLongitudeToUtc(283,2027);
 assert.match(iso,/^2027-01-0[34]T/);
});
test('GMN source validates exact shower and rejects malformed or count-only CSV',()=>{
 assert.throws(()=>parseFluxCsv(data,'ORI',2026));
 assert.throws(()=>parseFluxCsv(data.replace('Flux@+6.5M (met / 1000 km^2 h)','Meteor counts'),'STA',2026));
 assert.throws(()=>fileUrl('BAD',2026));
});
