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
function metaContent(html,key,value){
  const tags=html.match(/<meta\b[^>]*>/gi)||[];
  const tag=tags.find(t=>t.includes(key+'="'+value+'"')||t.includes(key+"='"+value+"'"));
  return tag ? ((tag.match(/content=["']([^"']*)["']/i)||[])[1]||'') : '';
}
for(const file of pages){
  test(path.relative(root,file)+' exposes crawl and share metadata',()=>{
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,/<title[^>]*>[^<]+<\/title>/i);
    assert.ok(metaContent(html,'name','description'),'missing description');
    assert.ok(metaContent(html,'name','robots').includes('index'),'page must remain indexable');
    assert.ok(metaContent(html,'name','robots').includes('follow'),'page must allow link crawling');
    const canonicalTags=html.match(/<link\b[^>]*>/gi)||[];
    const canonical=canonicalTags.find(t=>t.includes('rel="canonical"')||t.includes("rel='canonical'"));
    assert.ok(canonical&&/href=["']https:\/\/chrisizworski\.com\//i.test(canonical),'missing canonical URL');
    assert.ok(metaContent(html,'property','og:title'),'missing og:title');
    assert.ok(metaContent(html,'property','og:description'),'missing og:description');
    assert.ok(metaContent(html,'property','og:url'),'missing og:url');
    assert.ok(metaContent(html,'name','twitter:card'),'missing twitter:card');
    assert.ok(metaContent(html,'name','twitter:title'),'missing twitter:title');
    assert.ok(metaContent(html,'name','twitter:description'),'missing twitter:description');
    const ogImage=metaContent(html,'property','og:image');
    if(ogImage){
      assert.equal(metaContent(html,'name','twitter:image'),ogImage,'Twitter and Open Graph images differ');
      assert.equal(metaContent(html,'name','twitter:card'),'summary_large_image');
    }else{
      assert.equal(metaContent(html,'name','twitter:card'),'summary','large-image cards require a relevant image URL');
    }
  });
}
