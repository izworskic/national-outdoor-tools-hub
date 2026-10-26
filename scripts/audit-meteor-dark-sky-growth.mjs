// Explicit, manual-only 1M impressions quality benchmark for the meteor/dark-sky network.
// Produces an evidence-based 100-point *publication quality* report, NOT a search ranking.
// Run after generate-great-lakes-dark-sky.mjs and generate-midwest-dark-sky.mjs.
import fs from 'node:fs';
import path from 'node:path';

const ROOT='https://chrisizworski.com';
const BASE='/national-tools/dark-sky/';
const content=fs.readFileSync('data/great-lakes-dark-sky.json','utf8');
const places=JSON.parse(content).places;
const regions=['midwest','michigan','wisconsin','minnesota','illinois','indiana','ohio'];
const urls=[BASE,...regions.map(s=>BASE+s+'/'),...places.map(p=>BASE+p.slug+'/'),'/national-tools/meteor-shower/'];
const sitemap=fs.readFileSync('public/national-tools/dark-sky/sitemap.xml','utf8');
const currentDate='2026-10-26';
const all=[];
const titles=new Map();
const failures=[];
for(const u of urls){
 const slug=u===BASE?'hub':u.includes('meteor-shower')?'meteor':u.slice(BASE.length).replace(/\/$/,'');
 const file=u.includes('meteor-shower')?'public/national-tools/meteor-shower/index.html':
    path.join('public',u,'index.html');
 const exists=fs.existsSync(file);
 const html=exists?fs.readFileSync(file,'utf8'):'';
 const canonical=ROOT+u;
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1]||'';
 const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||'';
 const heading=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g,'').trim()||'';
 const ld=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
 let graph=[];try{graph=JSON.parse(ld)['@graph']||[]}catch{}
 const person=graph.find(n=>n['@type']==='Person');
 const entity=graph.find(n=>['WebApplication','WebPage','CollectionPage'].includes(n['@type'])&&n.url===canonical);
 const isMeteor=slug==='meteor';
 const isHub=slug==='hub';
 const isRegion=regions.includes(slug);
 const site=places.find(x=>x.slug===slug);
 const add=(name,ok)=>({name,pass:Boolean(ok)});
 const scorecard=[
  add('Self canonical',html.includes('<link rel="canonical" href="'+canonical+'">')),
  add('Indexability declaration',/name="robots" content="index,follow/.test(html)),
  add('Useful unique title (25–85 characters)',title.length>=25&&title.length<=85&&!titles.has(title)),
  add('Specific meta description (80–180 characters)',description.length>=80&&description.length<=180),
  add('Substantive visible question-led H1',heading.length>=18&&heading.length<=150),
  add('Social sharing metadata',html.includes('property="og:title"')&&html.includes('property="og:url" content="'+canonical+'"')),
  add('Consistent Chris Izworski Person',person?.['@id']===ROOT+'/#person'&&person?.name==='Chris Izworski'),
  add('Structured page or WebApp matches canonical',!!entity),
  add('Readable mobile viewport',/name="viewport"/.test(html)),
  add('Human-visible source/provenance link',isMeteor?html.includes('https://www.imo.net/calendar/')&&html.includes('www.weather.gov'):
     html.includes('https://www.weather.gov')||html.includes('https://darksky.org/')),
  add('Forecast is not presented as a confirmed meteor count',/not (a meteor count|predicted meteor counts|a meteor-per-hour estimate|the probability|a probability)/i.test(html)),
  add('Nighttime access limitations are explicit',/access|parking|gate|entrance/i.test(html)&&/not|check|confirm|verify/i.test(html)),
  add('Live decision hook or honest initial unavailable state',isMeteor?html.includes('id="verdict"')&&html.includes('Forecast pending'):
     isHub||isRegion?html.includes('id="compare4"')&&html.includes('darkSkyPayload'):
     html.includes('id="parkVerdict"')&&html.includes('parkForecastStatus')),
  add('Interactive destination map or link',html.includes('darkSkyMap')||html.includes('id="map"')),
  add('Source-aware map boundary and fallback',isMeteor?html.includes('OpenStreetMap fallback'):
     html.includes('dark-sky-map-inspector.js')&&html.includes('great-lakes-dark-sky.js')),
  add('Crawlable link to another useful tool',html.includes('href="/national-tools/meteor-shower/"')||html.includes('href="/national-tools/dark-sky/')),
  add('Published source states not guaranteed conditions',/not|no viewing|unknown|pending|unverified/i.test(html)),
  add('Destination specificity and selection',isMeteor?html.includes('Headlands Dark Sky Park')&&html.includes('Meteor Chase'):
     isHub?regions.every(region=>html.includes('href="'+BASE+region+'/\"')):
     isRegion?html.includes('id="siteCards"')&&html.includes('href="'+BASE+places.find(x=>x.state===({michigan:'MI',wisconsin:'WI',minnesota:'MN',illinois:'IL',indiana:'IN',ohio:'OH'}[slug]||'MI'))?.slug+'/\"'):
     html.includes(site?.name||'__none__')&&html.includes(site?.access||'__none__')),
  add('Sitemap discovery or canonical tool entry',isMeteor?true:sitemap.includes('<loc>'+canonical+'</loc>')),
  add('No obvious exposed secret',!/GSC_PRIVATE_KEY=|OPENAI_API_KEY=|VERCEL_TOKEN=|CARTO_BASEMAP_PUBLIC_KEY=/.test(html))
 ];
 titles.set(title,slug);
 const points=scorecard.filter(x=>x.pass).length*5;
 const issues=scorecard.filter(x=>!x.pass).map(x=>x.name);
 if(points!==100)failures.push({slug,url:u,points,issues});
 all.push({slug,url:canonical,points,maxPoints:100,failedChecks:issues});
}
const sitemapUrls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
const duplicateSitemaps=sitemapUrls.length!==new Set(sitemapUrls).size;
if(duplicateSitemaps)failures.push({slug:'sitemap',issues:['Duplicate canonical sitemap URLs']});
const result={
 audit:'Meteor Shower + Midwest Dark Sky / Million Impressions quality gate',
 date:currentDate,sourceRepository:'izworskic/national-outdoor-tools-hub',
 strategicTarget:{gscWebImpressions28d:1000000,sitewideCtrPct:5},
 measured:{gscWebImpressions28d:null,gscCtrPct:null,gscClicks28d:null,ga4Engagement:null,adsenseRevenue:null,reason:'GSC, GA4 and AdSense readings not exposed to this code-only audit'},
 pagesAudited:all.length,pass:failures.length===0,failures,
 pages:all,
 limitations:[
  'Static HTML/build checks do not establish Search Console indexing, rankings, clicks, or impressions.',
  'No real-device map interaction, provider access status, park gate status, or forecast freshness can be established in this static run.',
  'A passed score is a publication QA gate, not a prediction of SEO performance.'
 ],
 recommendedNextAction:'Get comparable GSC Web page/query rows for the Meteor Shower, Michigan hub, Headlands and Port Crescent after indexing; prioritize the highest-impression low-CTR URL before extending the page network.'
};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/meteor-dark-sky-million-impressions.json',JSON.stringify(result,null,2)+'\n');
console.log('Meteor/Dark Sky 1M quality gate: '+all.length+' pages; '+(failures.length===0?'PASS':'FAIL')+'; weakest score '+Math.min(...all.map(x=>x.points))+'/100');
for(const x of failures.slice(0,30))console.error(x.slug+': '+(x.points??0)+'/100 - '+x.issues.join('; '));
if(failures.length)process.exitCode=1;
