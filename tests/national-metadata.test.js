import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('public/national-tools');
const pages=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    const rel=path.relative(root,full).split(path.sep);
    if(entry.isDirectory()&&rel.length<3) walk(full);
    else if(entry.isFile()&&entry.name==='index.html'&&rel.length<=3) pages.push(full);
  }
}
walk(root);
function meta(html,key,value){
  const tags=html.match(/<meta\\b[^>]*>/gi)||[];
  const tag=tags.find(t=>new RegExp(key+'=["\\\\\\\\']'+value+'["\\\\\\\\']','i').test(t));
  return tag ? ((tag.match(/content=["']([^"']*)["']/i)||[])[1]||'') : '';
}
for(const file of pages){
  test(path.relative(root,file)+' exposes crawl and share metadata',()=>{
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,/<title[^>]*>[^<]+<\\/title>/i);
    assert.match(html,/<meta\\b[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i);
    assert.match(html,/<link\\b[^>]*rel=["']canonical["'][^>]*href=["']https:\\/\\/chrisizworski\\.com\\//i);
    assert.match(html,/<meta\\b[^>]*name=["']robots["'][^>]*content=["'][^"']*index[^"']*follow/i);
    assert.ok(meta(html,'property','og:title'),'missing og:title');
    assert.ok(meta(html,'property','og:description'),'missing og:description');
    assert.ok(meta(html,'property','og:url'),'missing og:url');
    assert.ok(meta(html,'name','twitter:card'),'missing twitter:card');
    assert.ok(meta(html,'name','twitter:title'),'missing twitter:title');
    assert.ok(meta(html,'name','twitter:description'),'missing twitter:description');
    const ogImage=meta(html,'property','og:image');
    if(ogImage){
      assert.equal(meta(html,'name','twitter:image'),ogImage,'Twitter and Open Graph images differ');
      assert.equal(meta(html,'name','twitter:card'),'summary_large_image');
    }else{
      assert.equal(meta(html,'name','twitter:card'),'summary','large-image cards require a relevant image URL');
    }
  });
}
