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
const sourceCommit='c124a15a0d1a260fe4dd883a3adf830e3bb26c28';

execFileSync(process.execPath,[buildScript],{cwd:root,stdio:'inherit'});
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8')
  .replaceAll("getJSON('./api/live')","getJSON('./api/live')")
  .replaceAll("getJSON('./api/history')","getJSON('./api/history')");

for(const marker of [canonical,'G-Y5D2V2W7HN','Private paddle','Raft guest','data-persona="watch"','data-persona="photo"','Since your last check','ENVIRONMENTAL CONTEXT INDEX']){
  if(!html.includes(marker)) throw new Error(`Gauley persona build missing ${marker}`);
}
fs.mkdirSync(targetDir,{recursive:true});
fs.writeFileSync(target,html);
fs.mkdirSync('data',{recursive:true});
fs.writeFileSync('data/gauley-persona-source.json',JSON.stringify({repository:'izworskic/gauley-release-live-',commit:sourceCommit,canonical},null,2)+'\n');
console.log(`Gauley persona tool built from ${sourceCommit}.`);
