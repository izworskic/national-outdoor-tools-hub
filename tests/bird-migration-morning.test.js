const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../api/bird-migration-morning.js');

const {parseBirdCast,weatherFit,decision}=api._test;

test('parses live BirdCast migration summary',()=>{
  const html=`<html><body><h1>Ohio</h1><p>Tonight, Sep 15</p><div>LIVE DATA FEED Last updated ~17 min. ago</div><h2>Total birds</h2><div>0 152100 Birds have crossed Ohio so far tonight (est.)</div><div>Starting: Tue, Sep 15, 2026, 7:40 PM EDT</div><h2>Live migration traffic</h2><div>409,300 Birds now in flight (est.) High Direction: ESE (East-southeast) Speed: 18 mph Altitude: 4,800 ft Recorded: Wed, Sep 16, 2026, 2:40 AM EDT</div><p>Not all birds may fully cross a region in one night.</p></body></html>`;
  const parsed=parseBirdCast(html,'US-OH');
  assert.equal(parsed.available,true);
  assert.equal(parsed.live,true);
  assert.equal(parsed.high,true);
  assert.equal(parsed.birdsCrossed,152100);
  assert.equal(parsed.birdsInFlight,409300);
  assert.equal(parsed.direction,'ESE');
  assert.equal(parsed.directionName,'East-southeast');
  assert.equal(parsed.speedMph,18);
  assert.equal(parsed.altitudeFt,4800);
});

test('recognizes BirdCast off-season/no-data state',()=>{
  const html='<p>Migration data are not available for this region on this night.</p><p>The live data feed runs from March 1–June 15 during spring migration and from August 1–November 15 during fall migration.</p>';
  const parsed=parseBirdCast(html,'US-MI-017');
  assert.equal(parsed.available,false);
  assert.equal(parsed.offSeason,true);
});

test('classifies morning weather separately from migration',()=>{
  const good=weatherFit([{windSpeed:'7 mph',probabilityOfPrecipitation:{value:10}},{windSpeed:'11 mph',probabilityOfPrecipitation:{value:20}}]);
  const poor=weatherFit([{windSpeed:'22 mph',probabilityOfPrecipitation:{value:10}}]);
  assert.equal(good.rating,'good');
  assert.equal(poor.rating,'poor');
  const d=decision({available:true,offSeason:false,high:true},good);
  assert.equal(d.level,'strong');
  assert.match(d.headline,/Strong migration signal/);
});
