import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const pkgPath=require.resolve('gauley-release-live/package.json');
const root=path.dirname(pkgPath);
const buildScript=path.join(root,'scripts/build-deploy-bundle.mjs');
const dist=path.join(root,'dist');
const targetDir='public/national-tools/gauley-release-live';
const target=path.join(targetDir,'index.html');
const canonical='https://chrisizworski.com/national-tools/gauley-release-live/';
const sourceCommit='63cec09963093b5aa903245dda90388fc8edc988';

execFileSync(process.execPath,[buildScript],{cwd:root,stdio:'inherit'});
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8')
  .replaceAll("getJSON('./api/live')","getJSON('./api/live')")
  .replaceAll("getJSON('./api/history')","getJSON('./api/history')");

// Preserve upstream crawl policy; an omitted robots tag defaults to index/follow.
// Make that default explicit in the composed public shell for metadata verification.
if(!/<meta[^>]+name=["']robots["']/i.test(html))html=html.replace('</head>','<meta name="robots" content="index,follow,max-image-preview:large">\n</head>');

// Match social snippets to the upstream visible title/description; no invented preview image.
const title=html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
const description=html.match(/<meta property="og:description" content="([^"]+)"/)?.[1];
if(!title||!description)throw new Error('Gauley upstream social metadata missing');
if(!html.includes('name="twitter:title"'))html=html.replace('</head>',`<meta name="twitter:title" content="${title}">\n<meta name="twitter:description" content="${description}">\n</head>`);
if(!html.includes('property="og:image"'))html=html.replace('name="twitter:card" content="summary_large_image"','name="twitter:card" content="summary"');

for(const marker of [canonical,'G-Y5D2V2W7HN','Private paddle','Raft guest','data-persona="watch"','data-persona="photo"','Since your last check','ENVIRONMENTAL CONTEXT INDEX']){
  if(!html.includes(marker)) throw new Error(`Gauley persona build missing ${marker}`);
}
fs.mkdirSync(targetDir,{recursive:true});
fs.writeFileSync(target,html);
fs.mkdirSync('data',{recursive:true});
fs.writeFileSync('data/gauley-persona-source.json',JSON.stringify({repository:'izworskic/gauley-release-live-',commit:sourceCommit,canonical},null,2)+'\n');
console.log(`Gauley persona tool built from ${sourceCommit}.`);
