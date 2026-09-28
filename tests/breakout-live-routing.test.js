const test=require('node:test');
const assert=require('node:assert/strict');
const cfg=require('../vercel.json');
const slugs=['live-decisions','zion-narrows-conditions','old-faithful-next-eruption','going-to-the-sun-road-status','yellowstone-road-status','trail-ridge-road-status','tioga-road-status','cadillac-mountain-sunrise','mount-rainier-road-status','lake-mead-access','lake-powell-ramp-status'];
test('breakout live routing is constrained to the selected portfolio',()=>{const routes=cfg.rewrites.filter(r=>String(r.source).includes(':tool(live-decisions|'));assert.equal(routes.length,2);for(const slug of slugs){assert.ok(routes.every(r=>r.source.includes(slug)),slug);}assert.ok(routes.every(r=>r.destination==='https://national-outdoor-core.vercel.app/national-tools/:tool/index.html'));});
