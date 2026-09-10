import fs from 'node:fs';

const cards = [
  {state:'Alaska',slug:'alaska',desc:'Can you see them tonight? Check the live viewing score, clearest dark window and regional outlook for Fairbanks, Denali, Anchorage and more.'},
  {state:'Minnesota',slug:'minnesota',desc:"See tonight's viewing score, cloud cover and best window for Duluth, Grand Marais, Ely, Voyageurs and northern Minnesota."},
  {state:'North Dakota',slug:'north-dakota',desc:"See whether tonight is worth going out, with live conditions for Fargo, Bismarck, the Turtle Mountains and North Dakota's dark prairie skies."},
  {state:'Montana',slug:'montana',desc:"Check tonight's viewing score, clearest hours and regional outlook for Glacier, Whitefish, the Hi-Line, Bozeman and Billings."},
  {state:'Maine',slug:'maine',desc:"Check tonight's aurora conditions, cloud cover and best viewing window for Aroostook, Bangor, Acadia and northern Maine."}
];

function patchMain(html, card){
  const url=`https://chrisizworski.com/national-tools/aurora/${card.slug}/`;
  const articleRe=new RegExp(`<article class="tool-card"[^>]*data-aurora-state="${card.slug}"[\\s\\S]*?</article>`,'g');
  html=html.replace(articleRe,block=>block
    .replace(/<div class="tk">[\s\S]*?<span class="tk-season"/, '<div class="tk">Northern lights tonight<span class="tk-season"')
    .replace(/<div class="tool-desc">[\s\S]*?<\/div>/,`<div class="tool-desc">${card.desc}</div>`));
  const intentRe=new RegExp(`<li><a href="${url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}">Check ${card.state} northern lights<span>[\\s\\S]*?</span></a></li>`,'g');
  return html.replace(intentRe,`<li><a href="${url}">Check ${card.state} northern lights tonight<span>${card.desc}</span></a></li>`);
}

function patchNightSky(html, card){
  const href=`/national-tools/aurora/${card.slug}/`;
  const escaped=href.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(`<a class="card tool-card" href="${escaped}">[\\s\\S]*?</a>`,'g');
  return html.replace(re,block=>block
    .replace(/<div class="tool-kicker">[\s\S]*?<\/div>/,'<div class="tool-kicker">Northern lights tonight</div>')
    .replace(/<p>[\s\S]*?<\/p>/,`<p>${card.desc}</p>`));
}

const targets=[
  ['public/national-tools/index.html',patchMain],
  ['public/national-tools/night-sky/index.html',patchNightSky]
];
for(const [file,patcher] of targets){
  if(!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8');
  for(const card of cards) html=patcher(html,card);
  fs.writeFileSync(file,html);
}
console.log('Optimized state aurora discovery copy for tonight/where/when intent.');
