const test=require("node:test");const assert=require("node:assert/strict");const fs=require("node:fs");const path=require("node:path");
test("garden hub location input remains compact at mobile and desktop",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","public/national-tools/garden/index.html"),"utf8");
 const begin=html.indexOf("<style");const end=html.indexOf("</style>",begin);const css=begin>=0&&end>begin?html.slice(begin,end):null;
 assert.ok(css);
 assert.match(css,/\.locator input\{min-width:0;flex:0 1 290px;width:290px;max-width:100%;height:44px/);
 assert.match(css,/@media\(max-width:760px\)\{\.locator\{flex-direction:column;align-items:stretch\}\.locator input,\.locator button\{flex:0 0 auto;width:100%;height:44px/);
 assert.doesNotMatch(css,/flex:1 1 180px/);
 assert.match(html,/data-national-hub="garden"/);
});
