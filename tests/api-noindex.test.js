const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

for(const name of ['columbia-salmon','florida-red-tide','space-coast-launch','trail-ridge-road','yellowstone-geysers']){
  test(`${name} JSON API explicitly blocks search indexing`,()=>{
    const src=fs.readFileSync(path.join(root,'api',`${name}.js`),'utf8');
    assert.match(src,/X-Robots-Tag['"],\s*['"]noindex, nofollow/i);
  });
}
