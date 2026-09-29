const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cfg=require('../vercel.json');
const pkg=require('../package.json');
const slugs=['live-decisions','zion-narrows-conditions','grand-canyon-access','going-to-the-sun-road-status','haleakala-sunrise','yellowstone-road-status','tioga-road-status','cadillac-mountain-sunrise','mount-rainier-road-status','lake-mead-access','lake-powell-ramp-status'];

test('breakout live pages are materialized as hub static output',()=>{
  assert.equal(cfg.rewrites.some(r=>String(r.source).includes(':tool(live-decisions|')),false,'breakout pages must not depend on a second-hop rewrite');
  assert.match(pkg.dependencies['@izworskic/national-outdoor-core'],/#[0-9a-f]{40}$/,'core dependency must be pinned to an immutable commit SHA');
  for(const slug of slugs){
    const file=`public/national-tools/${slug}/index.html`;
    assert.ok(fs.existsSync(file),`${slug} must exist in hub static output`);
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,new RegExp(`https://chrisizworski\\.com/national-tools/${slug}/`),`${slug} canonical must stay on chrisizworski.com`);
  }
});

test('rejected duplicate slugs redirect to existing canonical owners',()=>{
  const redirects=cfg.redirects;
  for(const source of ['/national-tools/old-faithful-next-eruption','/national-tools/old-faithful-next-eruption/']){
    const r=redirects.find(x=>x.source===source);
    assert.equal(r?.destination,'/national-tools/yellowstone-geysers/');
    assert.equal(r?.permanent,true);
  }
  for(const source of ['/national-tools/trail-ridge-road-status','/national-tools/trail-ridge-road-status/']){
    const r=redirects.find(x=>x.source===source);
    assert.equal(r?.destination,'/national-tools/trail-ridge-road/');
    assert.equal(r?.permanent,true);
  }
});
