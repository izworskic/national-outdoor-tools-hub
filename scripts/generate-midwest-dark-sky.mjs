/* Build Midwest and state-level dark-sky pages from the existing verified destination
   registry and the shared Great Lakes forecast/map UI. Never fork the weather engine. */
import fs from 'node:fs';
import path from 'node:path';
import {applyMichiganAfterDark} from './michigan-after-dark.mjs';

const ROOT = 'https://chrisizworski.com';
const BASE = '/national-tools/dark-sky/';
const OUT = 'public/national-tools/dark-sky';
const updated = '2026-10-25';
const dataset = JSON.parse(fs.readFileSync('data/great-lakes-dark-sky.json', 'utf8'));
const all = dataset.places;
const midwestCodes = ['MI', 'WI', 'MN', 'IL', 'IN', 'OH'];
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const replaceRequired = (s, before, after) => {
  if (!s.includes(before)) throw new Error('Dark-sky page template changed: ' + before.slice(0, 75));
  return s.replace(before, after);
};
const src = fs.readFileSync(path.join(OUT,'index.html'), 'utf8');
const definitions = [
  {slug:'midwest',label:'Midwest',name:'Midwest Dark Sky Parks',codes:midwestCodes,
   title:'Midwest Dark Sky Parks: Best Stargazing Tonight',
   desc:'Compare certified and protected dark skies in Michigan, Wisconsin, Minnesota, Illinois, Indiana and Ohio using forecast clouds, moonlight and access guidance.',
   intro:'Start with a protected night sky, then decide whether tonight is actually worth the trip. The Midwest has distinct lake, forest, prairie and urban-fringe observing challenges.',
   context:'Michigan offers a broad network of designated state preserves and internationally recognized parks. Minnesota includes large wilderness and national-park skies; Wisconsin has Newport State Park; Illinois, Indiana and Ohio have distinct designated night-sky destinations. Certification measures protection, not tonight’s cloud cover or public access.',
   access:'Large wilderness areas are not single parking destinations. Lake-effect clouds, lakeshore exposure, event-only gates and seasonal closures vary by location. Choose a named site, then check its operator before traveling.'},
  {slug:'michigan',label:'Michigan',name:'Michigan Dark Sky Parks',codes:['MI'],
   title:'Michigan Dark Sky Parks Tonight | Stargazing Guide',
   desc:'Compare Michigan dark sky parks and preserves, including Headlands, Keweenaw, Port Crescent and Beaver Island, with hourly cloud and moon forecasts.',
   intro:'Michigan has six state-designated dark-sky preserves, three internationally designated parks and the Beaver Island International Dark Sky Sanctuary. Decide which location is practical tonight.',
   context:'For the Thumb, Port Crescent offers Lake Huron sky; Headlands serves the Straits; the Keweenaw looks toward Lake Superior; and Dr. T.K. Lawless serves southwest Michigan. Beaver Island demands island travel planning, not just a sky forecast.',
   access:'Michigan DNR says Thompson’s Harbor and Rockport are plowed in winter. Negwegon and Port Crescent are not winter-plowed; at Port Crescent, visitors can walk from parking to the preserve. Wilderness has no general winter plowing, but the area near park headquarters is plowed. This is not a live road or parking report. Confirm current conditions and the actual nighttime entrance.',
   official:'https://www.michigan.gov/dnr/places/state-parks/dark-sky-events'},
  {slug:'wisconsin',label:'Wisconsin',name:'Wisconsin Dark Sky Parks',codes:['WI'],
   title:'Wisconsin Dark Sky Parks Tonight | Newport',
   desc:'Plan a Wisconsin dark-sky visit to Newport State Park in Door County with cloud and moon forecasts, certified designation and nighttime access notes.',
   intro:'Newport State Park on Door County’s Lake Michigan side is a certified International Dark Sky Park. Use the forecast to choose a night, not to infer trail or park safety.',
   context:'Door County shorelines can be dark yet windy, and lake clouds can differ from an inland forecast. A park-area sample is a starting point, not a guarantee of a clear horizon.',
   access:'Check Wisconsin DNR for parking, trail condition, permits and park rules. Trails, shorelines and winter surfaces may require equipment beyond stargazing gear.',
   official:'https://dnr.wisconsin.gov/topic/parks/newport'},
  {slug:'minnesota',label:'Minnesota',name:'Minnesota Dark Sky Places',codes:['MN'],
   title:'Minnesota Dark Sky Parks Tonight | Voyageurs & BWCA',
   desc:'Compare Minnesota dark sky destinations at Voyageurs National Park and Boundary Waters, with forecast clouds, moonlight, and wilderness access cautions.',
   intro:'Voyageurs National Park and the Boundary Waters Canoe Area Wilderness are major northern Minnesota night-sky destinations, but their large geographic areas require specific access planning.',
   context:'An expansive designation does not mean every shore or trailhead is reachable after dark. Water travel, islands and wilderness routes change the decision completely.',
   access:'Use National Park Service or U.S. Forest Service visitor guidance to choose legal observing sites. Do not navigate to a broad regional map point as a parking location.',
   official:'https://www.nps.gov/voya/index.htm'},
  {slug:'illinois',label:'Illinois',name:'Illinois Dark Sky Parks',codes:['IL'],
   title:'Illinois Dark Sky Parks Tonight | Middle Fork',
   desc:'Visit Middle Fork River Forest Preserve, Illinois dark-sky destination, with meteor-viewing weather context and guidance for checking park access.',
   intro:'Middle Fork River Forest Preserve offers an officially recognized dark-sky escape from Illinois urban light domes. Forecast quality matters, but park operating rules matter equally.',
   context:'Use the site’s own observing-area guidance rather than assuming every trail or parking area remains open overnight.',
   access:'Check the Champaign County Forest Preserve District for current operating hours and permitted night-sky use before traveling.',
   official:'https://www.ccfpd.org/forest-preserves/middle-fork-river'},
  {slug:'indiana',label:'Indiana',name:'Indiana Dark Sky Places',codes:['IN'],
   title:'Indiana Dark Sky Places Tonight | Beverly Shores',
   desc:'Explore Indiana dark skies around the certified Beverly Shores Dark Sky Community, with cloud forecasts and local access guidance.',
   intro:'Beverly Shores is a certified International Dark Sky Community, not a single park or a guarantee of public nighttime parking.',
   context:'Community certification recognizes responsible lighting. For actual observing, choose a lawful public access point and distinguish Lake Michigan shoreline conditions from village streets.',
   access:'Indiana Dunes and municipal beach access rules may vary. Never use the community’s map centroid as an observing-site or overnight parking recommendation.',
   official:'https://darksky.org/places/beverly-shores-indiana-dark-sky-community/'},
  {slug:'ohio',label:'Ohio',name:'Ohio Dark Sky Parks',codes:['OH'],
   title:'Ohio Dark Sky Parks Tonight | Geauga Observatory',
   desc:'Plan a northeast Ohio dark-sky night at the Geauga Observatory Park, with weather, moonlight and operator access context.',
   intro:'Geauga Observatory Park provides a designated astronomy destination east of Cleveland, where local night hours and programs should guide your visit.',
   context:'An observatory site has different entry and programming expectations from a state park or wilderness preserve. Check what is publicly available on your chosen night.',
   access:'Review Geauga Park District programs, evening hours and site notices before driving. A forecast score does not indicate observatory opening.',
   official:'https://www.geaugaparkdistrict.org/park/observatory-park/'}
];

if (new Set(all.map(x=>x.slug)).size !== all.length) throw new Error('Duplicate dark sky destination slug');
if (definitions.some(d => d.codes.some(c => !all.some(p => p.state === c)))) throw new Error('State without verified destination');
if (definitions.some(d => !d.title || !d.desc || !d.access || !d.context)) throw new Error('Incomplete state detail');

function miHero(def,selected){
 const photo='https://commons.wikimedia.org/wiki/Special:Redirect/file/Milky_Way_Galaxy_Over_North_Manitou_Village_(02d407c9-8929-4e76-b784-3f161060c0bb).jpg?width=1600';
 const source='https://commons.wikimedia.org/wiki/File:Milky_Way_Galaxy_Over_North_Manitou_Village_(02d407c9-8929-4e76-b784-3f161060c0bb).jpg';
 return `<section class="hero mi-hero" aria-labelledby="mi-title"><img class="mi-hero-photo" src="${photo}" width="1600" height="1025" fetchpriority="high" decoding="async" alt="Milky Way above North Manitou Village at Sleeping Bear Dunes National Lakeshore, photographed by the National Park Service"><div class="wrap"><div class="crumb"><a href="/national-tools/">Outdoor tools</a> / <a href="/national-tools/dark-sky/">Great Lakes dark skies</a> / Michigan</div><div class="eyebrow">Michigan After Dark · Field Guide</div><h1 id="mi-title">Michigan dark-sky parks <span>Under a wider sky.</span></h1><p class="lede">There are places in Michigan where the Milky Way still stretches over forests and open water. Explore ${selected.length} designated parks, preserves and a sanctuary, then check hourly clouds, moonlight and winter access before you drive.</p><div class="hero-links"><a href="#sky-finder">Find your dark sky</a><a class="secondary" href="#darkSkyMap">Explore the map</a><a class="secondary" href="/national-tools/meteor-shower/">Meteor showers tonight</a></div><p class="mi-photo-credit">Photographed at North Manitou Island, Sleeping Bear Dunes, September 2013. <a href="${source}" target="_blank" rel="noopener noreferrer">NPS photo · public domain</a>. A historical scene, not tonight’s sky or a photograph of every park listed.</p></div></section><div class="wrap"><ol class="mi-journey" aria-label="Plan a Michigan dark-sky outing"><li><div class="mi-no">01 · Choose a place</div><strong>Follow the darker horizon</strong><span>Search ten named places or explore the map.</span></li><li><div class="mi-no">02 · Check the sky</div><strong>Choose a promising hour</strong><span>Compare predicted cloud cover and moonlight.</span></li><li><div class="mi-no">03 · Check the ground</div><strong>Arrive with a real plan</strong><span>Confirm plowing, entrances and park rules.</span></li></ol></div>`;
}

function miIntro(){
 return `<div class="mi-intro"><div class="mi-intro-copy"><div class="kicker">Find your next clear night</div><h2>Choose a place worth staying up for.</h2><p>Start with the map and the named destinations below. A dark-sky designation protects the setting, but clouds and moonlight decide what you might see. A forecast never certifies a gate or a winter road.</p></div><a href="#mi-winter-access">Read winter access guidance ↓</a></div>`;
}

function miMoments(selected){
 const cards=[
 ['headlands','The Straits · Emmet County','Find a sky near the Straits','A recognized dark-sky park near Mackinaw City. Nighttime rules and the weather outlook are both part of the plan.'],
 ['thompsons-harbor','Lake Huron · Presque Isle County','Explore a quieter shoreline','An undeveloped stretch of Lake Huron country. DNR lists winter plowing, not live road conditions.'],
 ['keweenaw','Upper Peninsula · Keweenaw','Go north for bigger skies','Lake Superior country and an international dark-sky park. Verify the lodge’s access details before leaving.']
 ];
 return `<section class="mi-moments" aria-labelledby="mi-moments-title"><div class="kicker">Three places to begin</div><h2 id="mi-moments-title">Every dark sky has its own sense of place.</h2><div class="mi-moments-grid">`+cards.map(([slug,tag,title,description])=>{let p=selected.find(x=>x.slug===slug);if(!p)throw Error('Michigan featured destination absent: '+slug);return `<a class="mi-moment" href="${link(p.slug)}"><span class="mi-eyebrow">${escapeHTML(tag)}</span><strong>${escapeHTML(title)}</strong><span>${escapeHTML(description)}</span><b>Explore ${escapeHTML(p.name)} →</b></a>`}).join('')+`</div></section>`;
}

function miAccess(def){
 return `<section class="panel mi-access-guide" id="mi-winter-access" aria-labelledby="mi-access-heading"><div class="kicker">Before you head out</div><h2 id="mi-access-heading">A clear sky does not mean a clear road.</h2><p class="mi-access-intro">The Michigan DNR specifies different winter plowing policies for its state-designated dark-sky preserves. These are published policies, not live reports of roads, lots, ice or trails.</p><div class="mi-access-grid"><div class="mi-access-unit"><div class="mi-access-label">DNR lists winter plowing</div><p><a href="${link('thompsons-harbor')}">Thompson’s Harbor State Park</a> and <a href="${link('rockport')}">Rockport Recreation Area</a>. Check current conditions before traveling.</p></div><div class="mi-access-unit"><div class="mi-access-label">Not winter-plowed</div><p><a href="${link('negwegon')}">Negwegon State Park</a> and <a href="${link('port-crescent')}">Port Crescent State Park</a>. At Port Crescent, the DNR says visitors can hike from parking to the preserve.</p></div><div class="mi-access-unit"><div class="mi-access-label">Limited plowing</div><p><a href="${link('wilderness')}">Wilderness State Park</a> has no general winter plowing; the area near headquarters is plowed.</p></div></div><p class="mi-access-note">${escapeHTML(def.access)} The DNR summary does not specify plowing at Lake Hudson. County and other managed sites have different access rules. Do not mistake a forecast score for safe arrival conditions.</p><p class="mi-access-source"><a href="${escapeHTML(def.official)}" target="_blank" rel="noopener noreferrer">Official Michigan DNR dark-sky and access guidance →</a></p></section>`;
}

const link = (slug) => BASE + slug + '/';
function relatedNav(def) {
  const links = definitions.filter(x=>x.slug!==def.slug).map(x=>'<a href="'+link(x.slug)+'">'+escapeHTML(x.label)+'</a>').join(' · ');
  return '<section class="panel" aria-label="Midwest dark-sky state guides"><div class="kicker">Explore by state</div><h2>Midwest dark-sky guides</h2><p><a href="'+link('midwest')+'">Midwest overview</a> · '+links+'</p><p class="small subtle">The guides share one forecast engine and one verified destination registry. Single-site states are presented as specific places, not invented statewide weather measurements.</p></section>';
}
function staticPlaces(places) {
  return '<section class="panel"><div class="kicker">Open a destination planner</div><h2>Explore actual protected skies</h2><div class="list">'+
   places.map(p=>'<article class="site"><h3><a href="'+link(p.slug)+'">'+escapeHTML(p.name)+'</a></h3><p class="small">'+escapeHTML(p.state+' · '+p.intro)+'</p><p><a href="'+link(p.slug)+'">Open live sky planner</a> · <a href="'+escapeHTML(p.source)+'" rel="noopener noreferrer" target="_blank">Official designation or operator</a></p></article>').join('')+
   '</div></section>';
}
function make(def) {
  const selected = all.filter(p => def.codes.includes(p.state));
  const isMichigan = def.slug === 'michigan';
  if (!selected.length) throw new Error('No sites selected for ' + def.slug);
  const url = ROOT + link(def.slug);
  let html = src;
  html = html.replace(/<title>[^<]*<\/title>/, '<title>'+escapeHTML(def.title)+'</title>');
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="'+escapeHTML(def.desc)+'">');
  html = html.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="'+url+'">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="'+escapeHTML(def.title)+'">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="'+escapeHTML(def.desc)+'">');
  html = html.replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="'+url+'">');
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="'+escapeHTML(def.title)+'">');
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="'+escapeHTML(def.desc)+'">');
  const schema = {'@context':'https://schema.org','@graph':[
   {'@type':'Person','@id':ROOT+'/#person',name:'Chris Izworski',url:ROOT+'/'},
   {'@type':'CollectionPage','@id':url+'#page',url,name:def.name,description:def.desc,dateModified:(isMichigan?'2026-10-28':updated),author:{'@id':ROOT+'/#person'}},
   {'@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:'Outdoor tools',item:ROOT+'/national-tools/'},
    {'@type':'ListItem',position:2,name:'Great Lakes dark skies',item:ROOT+BASE},
    {'@type':'ListItem',position:3,name:def.name,item:url}]},
   {'@type':'ItemList',numberOfItems:selected.length,itemListElement:selected.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:ROOT+link(p.slug)}))}
  ]};
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>');
  html = replaceRequired(html,'Where is the best dark sky to visit tonight?',def.name+': is tonight worth the trip?');
  html = replaceRequired(html,'Compare officially designated parks and preserves, then look for the best real observing window. Even a remarkably dark park can be cloudy, moonlit or inaccessible.',def.intro);
  html = html.replace(/<label>State or province<select id="region">[\s\S]*?<\/select><\/label>/,
    '<label>State<select id="region"><option value="all">All listed states</option>'+def.codes.map(c=>'<option value="'+c+'">'+c+'</option>').join('')+'</select></label>');
  html = replaceRequired(html, 'Great Lakes stargazing',def.name+' · destination finder');
  html = replaceRequired(html, 'Great Lakes dark-sky destinations</h2>',def.name+' · destination map</h2>');
  html = replaceRequired(html, 'Explore '+all.length+' Great Lakes night-sky destinations','Explore '+selected.length+' '+def.name.toLowerCase()+' destinations');
  html = replaceRequired(html, all.length+' destinations</p>',selected.length+' destinations</p>');
  const oldPayload = /<script type="application\/json" id="darkSkyPayload">[\s\S]*?<\/script>/;
  if (!oldPayload.test(html)) throw new Error('Missing live sky payload');
  html = html.replace(oldPayload, '<script type="application/json" id="darkSkyPayload">'+JSON.stringify({mode:'index',place:null,places:selected}).replace(/</g,'\\u003c')+'</script>');
  const regionContext = '<section class="panel"><div class="kicker">What to know before you go</div><h2>'+escapeHTML(def.name)+' night-sky decisions</h2><p>'+escapeHTML(def.context)+'</p><p><strong>Night access:</strong> '+escapeHTML(def.access)+'</p>'+
    (def.official?'<p><a href="'+escapeHTML(def.official)+'" target="_blank" rel="noopener noreferrer">Official park and access information ↗</a></p>':'')+
    '<p class="small subtle">Official designation is not a real-time access or clear-sky report. Forecasts load only after data arrive. A numerical observing index is not a probability of seeing a meteor.</p></section>';
  html = replaceRequired(html, '<main class="wrap"><section class="panel">', '<main class="wrap">'+(isMichigan?miIntro():relatedNav(def)+regionContext+staticPlaces(selected))+'<section class="panel">');
  html = html.replace(/<section class="panel"><h2>Method and limits<\/h2>[\s\S]*?<\/section>/,
    '<section class="panel"><h2>Method and limits</h2><p>For U.S. sites, the shared meteor-viewing engine uses hourly National Weather Service sky-cover forecasts, astronomical darkness and moonlight. These are forecasts at representative coordinates, not on-site observations, verified entrances or measured meteor rates. Sites may be inaccessible even during promising sky conditions. Check each operator for current gates, roads, parking and regulations.</p></section>');
  if (def.slug === 'michigan') {
    html = applyMichiganAfterDark(html,selected);
    fs.mkdirSync(path.join(OUT,'assets'),{recursive:true});
    fs.copyFileSync('public/assets/michigan-after-dark.css',path.join(OUT,'assets','michigan-after-dark.css'));
  }
  if(isMichigan){
    html=replaceRequired(html,'<body>','<body class="mi-darksky">');
    html=replaceRequired(html,'</head>','<link rel="stylesheet" href="/national-tools/dark-sky/assets/michigan-dark-sky.css?v=20261028"></head>');
    const heroPattern=/<section class="hero">[\s\S]*?<\/section>(?=\s*<main class="wrap">)/g;
    if((html.match(heroPattern)||[]).length!==1)throw Error('Michigan original hero not unique');
    html=html.replace(heroPattern,miHero(def,selected));
    html=replaceRequired(html,'Choose a dark-sky destination','Find a Michigan dark-sky park');
    html=replaceRequired(html,'<section class="panel"><div class="kicker">'+escapeHTML(def.name+' · destination finder')+'</div>',
       '<section class="panel" id="sky-finder"><div class="kicker">Pick your viewing place</div>');
    const stateSelect=/<label>State<select id="region">[\s\S]*?<\/select><\/label>/;
    if(!stateSelect.test(html))throw Error('Missing Michigan-only state filter');
    html=html.replace(stateSelect,'');
    html=replaceRequired(html,'<div class="two-col"><div><section class="panel" aria-labelledby="map-title">',
       '<div class="two-col mi-map-layout"><div class="mi-map-col"><section class="panel" aria-labelledby="map-title">');
    html=replaceRequired(html,'</div><div><section class="panel"><div class="kicker">Forecast comparison</div>',
       '</div><div class="mi-compare-col"><section class="panel"><div class="kicker">Forecast comparison</div>');
    html=replaceRequired(html,'Explore '+selected.length+' '+def.name.toLowerCase()+' destinations',
       'Explore all '+selected.length+' Michigan dark-sky destinations');
    html=replaceRequired(html,'<section class="panel"><div class="kicker">Individual destination planners</div>',
       miMoments(selected)+miAccess(def)+'<section class="panel"><div class="kicker">Individual destination planners</div>');
    html=replaceRequired(html,'<section class="panel"><h2>Method and limits</h2>',
       '<div class="mi-browse-other">'+relatedNav(def)+'</div><section class="panel"><h2>Method and limits</h2>');
    if(!html.includes('id="sky-finder"') || !html.includes('id="mi-winter-access"')) throw Error('Michigan page missing redesigned sections');
  }
  const dir = path.join(OUT,def.slug);fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'), html);
  if(!html.includes('href="'+url+'"') || !html.includes('id="darkSkyPayload"')) throw new Error('Generated region missing required signals');
  return url;
}
fs.copyFileSync('public/assets/michigan-dark-sky.css',path.join(OUT,'assets','michigan-dark-sky.css'));
const urls = definitions.map(make);
let parent = src;
const choices = '<section class="panel"><div class="kicker">Choose your region</div><h2>Midwest dark sky pages</h2><p>For a state-specific decision, start with a verified destination. No single statewide forecast stands in for its observing sites.</p><div class="site-recommendations">'+definitions.map(d=>'<a class="btn secondary" href="'+link(d.slug)+'">'+escapeHTML(d.label)+' dark skies</a>').join(' ')+'</div></section>';
parent = replaceRequired(parent,'<main class="wrap"><section class="panel">','<main class="wrap">'+choices+'<section class="panel">');
parent = replaceRequired(parent,'<section class="panel"><div class="kicker">Individual destination planners</div>',staticPlaces(all)+'<section class="panel"><div class="kicker">Individual destination planners</div>');
fs.writeFileSync(path.join(OUT,'index.html'),parent);

const sitemapPath = path.join(OUT,'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath,'utf8');
for(const url of urls){
 if(sitemap.includes('<loc>'+url+'</loc>'))throw new Error('Duplicate sitemap region: '+url);
 sitemap=sitemap.replace('</urlset>','  <url><loc>'+url+'</loc><lastmod>'+(url.endsWith('/michigan/')?'2026-10-28':updated)+'</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>\n</urlset>');
}
sitemap=sitemap.replace(/(<loc>https:\/\/chrisizworski.com\/national-tools\/dark-sky\/<\/loc><lastmod>)[^<]+/, '$1'+updated);
fs.writeFileSync(sitemapPath,sitemap);
console.log('Midwest dark sky: '+urls.length+' region and state pages, '+all.length+' existing park pages preserved.');
