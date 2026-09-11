const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public','national-tools','index.html'),'utf8');
const directoryJs=fs.readFileSync(path.join(root,'public','national-tools','assets','national-tools-directory.js'),'utf8');

function toolListSchema(){
  for(const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
    const data=JSON.parse(match[1]);
    const list=(data?.['@graph']||[]).find(item=>item?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
    if(list)return list;
  }
  return null;
}

test('national landing is one persona-organized specialist directory',()=>{
  for(const filter of ['all','trip','conditions','event','garden'])assert.match(html,new RegExp(`data-filter="${filter}"`));
  assert.match(html,/What do you want to do\?/);
  assert.match(html,/These choices filter one catalog/);
  assert.equal((html.match(/data-tool-id="/g)||[]).length,22);
  assert.equal(new Set([...html.matchAll(/data-tool-id="([^"]+)"/g)].map(match=>match[1])).size,22);
  assert.doesNotMatch(html,/intent-card|feature-card|library-group|decision-network|featured-tools/);
});

test('every core and newly launched tool stays directly crawlable',()=>{
  const routes=['/national-tools/aurora/','/national-tools/rivers/','/national-tools/coastal/','/national-tools/snow/','/national-tools/white-christmas/','/national-tools/frost/','/national-tools/planting/','/national-tools/garden-water/','/national-tools/fall-color/','/national-tools/niagara-rainbow/','/national-tools/waterfalls/'];
  for(const route of routes)assert.ok(html.includes(`href="${route}"`),`missing ${route}`);
  for(const url of ['https://chrisizworski.com/national-tools/gauley-release-live/','https://chrisizworski.com/national-tools/ice-out/','https://chrisizworski.com/national-tools/monarch-migration-live','https://chrisizworski.com/national-tools/platte-crane-live'])assert.ok(html.includes(`href="${url}"`),`missing ${url}`);
});

test('structured directory is complete, unique and contiguous',()=>{
  const list=toolListSchema();
  assert.ok(list);
  assert.equal(list.numberOfItems,23);
  assert.equal(list.numberOfItems,list.itemListElement.length);
  assert.equal(new Set(list.itemListElement.map(item=>item.url)).size,23);
  list.itemListElement.forEach((item,index)=>assert.equal(item.position,index+1));
  assert.ok(list.itemListElement.some(item=>item.name==='Niagara Falls Rainbow Predictor'));
  assert.ok(list.itemListElement.some(item=>item.name==='Lake Ice-Out Forecast'));
});

test('single finder filters existing cards and never synthesizes a location dashboard',()=>{
  assert.match(html,/data-season-toggle/);
  assert.match(html,/data-search-card/);
  assert.match(directoryJs,/personas\.includes\(filter\)/);
  assert.match(directoryJs,/data-search-card/);
  assert.match(html,/filter helps you choose a tool; it does not generate a combined location report/i);
  assert.doesNotMatch(html,/id="hub-location"|id="outdoor-desk"|data-use-location|NationalDashboard|national-dashboard\.js|N\.bind\(/);
});

test('planning guides and Michigan handoff remain available without repeating tool cards',()=>{
  for(const route of ['/national-tools/garden/','/national-tools/fall/','/national-tools/water/','/national-tools/night-sky/','/tools/'])assert.ok(html.includes(`href="${route}"`),`missing ${route}`);
});
