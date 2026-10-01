import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const core=path.join(root,'node_modules','@izworskic','national-outdoor-core');
if(!fs.existsSync(path.join(core,'package.json'))) throw new Error('Breakout sync: pinned national-outdoor-core dependency is missing');

execFileSync(process.execPath,[path.join(core,'scripts','generate-breakout-live-pages.mjs')],{cwd:core,stdio:'inherit'});
// Haleakala owns a purpose-built page (evidence engine UI) that replaces the generic template; generate it before analytics injection.
execFileSync(process.execPath,[path.join(core,'scripts','generate-haleakala-sunrise-page.mjs')],{cwd:core,stdio:'inherit'});
execFileSync(process.execPath,[path.join(core,'scripts','inject-network-analytics.js')],{cwd:core,stdio:'inherit'});

const config=JSON.parse(fs.readFileSync(path.join(core,'config','breakout-live-pages.json'),'utf8'));
const slugs=['live-decisions',...Object.keys(config)];
if(slugs.length!==11) throw new Error(`Breakout sync: expected 10 tools + hub; found ${slugs.length}`);
for(const slug of slugs){
  const src=path.join(core,'public','national-tools',slug,'index.html');
  const destDir=path.join(root,'public','national-tools',slug);
  if(!fs.existsSync(src)) throw new Error(`Breakout sync: generated page missing for ${slug}`);
  const html=fs.readFileSync(src,'utf8');
  const canonical=`https://chrisizworski.com/national-tools/${slug}/`;
  if(!html.includes(canonical)) throw new Error(`Breakout sync: canonical mismatch for ${slug}`);
  fs.mkdirSync(destDir,{recursive:true});
  fs.writeFileSync(path.join(destDir,'index.html'),html,'utf8');
}
console.log(`Breakout pages materialized from pinned core | pages=${slugs.length}`);
