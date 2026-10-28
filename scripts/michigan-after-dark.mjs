/* FIELD_GUIDE_V1 / Michigan After Dark.
   Only enriches the existing Michigan canonical; leaves forecast, map, data ownership,
   site routing, other states, advertising and GA4 unchanged. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT='/national-tools/dark-sky/';
const E=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const photos=JSON.parse(fs.readFileSync('data/michigan-after-dark-photos.json','utf8')).photos;
const getPhoto=id=>{
 const p=photos.find(x=>x.id===id);
 if(!p||p.status!=='verified-original-and-license')throw new Error('Missing verified Field Guide photo: '+id);
 for(const key of ['imageURL','sourceURL','photographer','licenseName','licenseURL','alt','captureDate','cropPosition','width','height'])
  if(!p[key])throw new Error(id+' missing photo field '+key);
 if(!p.imageURL.startsWith('https://upload.wikimedia.org/')||!p.sourceURL.startsWith('https://commons.wikimedia.org/wiki/File:'))throw new Error('Unexpected image origin '+id);
 return p;
};
function figure(id,extra='',eager=false){
 const p=getPhoto(id);
 return '<figure class="ad-photo '+E(extra)+'" style="--ad-position:'+E(p.cropPosition)+'">'+
 '<img src="'+E(p.imageURL)+'" alt="'+E(p.alt)+'" width="'+p.width+'" height="'+p.height+'" loading="'+(eager?'eager':'lazy')+'" decoding="async"'+(eager?' fetchpriority="high"':'')+'>'+
 '<figcaption>Photo: <a href="'+E(p.sourceURL)+'" target="_blank" rel="noopener noreferrer">'+E(p.photographer)+'</a> · <a href="'+E(p.licenseURL)+'" target="_blank" rel="noopener noreferrer">'+E(p.licenseName)+'</a> · '+E(p.captureDate.slice(0,4))+'</figcaption></figure>';
}
function storyCard({slug,title,kicker,description,move,operator,image}){
 return '<article class="ad-story" id="ad-'+E(slug)+'">'+figure(image,'ad-story-photo')+
 '<div class="ad-story-body"><p class="ad-kicker">'+E(kicker)+'</p><h3>'+E(title)+'</h3><p>'+E(description)+'</p>'+
 '<p class="ad-move"><strong>The move</strong> '+E(move)+'</p><div class="ad-story-actions"><a class="ad-go" href="'+ROOT+E(slug)+'/">Check sky and access <span aria-hidden="true">→</span></a>'+
 '<a class="ad-source" href="'+E(operator)+'" target="_blank" rel="noopener noreferrer">Official operator <span aria-hidden="true">↗</span></a></div></div></article>';
}
const official='https://www.michigan.gov/dnr/places/state-parks/dark-sky-events';
export function applyMichiganAfterDark(html,sites){
 const allIds=new Set(sites.map(p=>p.slug));
 for(const id of ['headlands','port-crescent','keweenaw'])if(!allIds.has(id))throw new Error('Missing featured Michigan site '+id);
 if(!html.includes('Michigan Dark Sky Parks: is tonight worth the trip?'))throw new Error('Expected Michigan page H1 missing');
 html=html.replace('<body>','<body class="afterdark-mi">');
 html=html.replace('</head>','<link rel="stylesheet" href="/national-tools/dark-sky/assets/michigan-after-dark.css"></head>');
 html=html.replace('Michigan Dark Sky Parks: is tonight worth the trip?','Michigan after dark: where should you watch the stars?');
 html=html.replace('A living calendar of the night sky','A field guide to Michigan dark sky parks');
 html=html.replace('Michigan has six state-designated dark-sky preserves, three internationally designated parks and the Beaver Island International Dark Sky Sanctuary. Decide which location is practical tonight.',
 'A hush on the Lake Huron shore. A telescope beneath the Straits sky. An evening deep in the Keweenaw woods. Find a place worth the drive, then check tonight’s clouds, moon and lawful access.');
 html=html.replace('href="#siteCards">Explore destination planners ↓','href="#ad-stories">Find your night-sky place ↓');
 const heroPhoto='<div class="ad-hero-media">'+figure('hero-headlands','ad-hero-photo',true)+'</div>';
 const heroEnd=/(<div class="hero-links">[\s\S]*?<\/div>)(<\/div><\/section>)/;
 if(!heroEnd.test(html))throw new Error('Hero structure changed');
 html=html.replace(heroEnd,(_m,links,close)=>links+heroPhoto+close);
 // The old generator duplicated all ten links ahead of another dynamic list.
 // Keep a compact index of ten genuine destination links for crawlers and no-JS visitors.
 const nav=html.match(/<section class="panel" aria-label="Midwest dark-sky state guides">[\s\S]*?<\/section>/)?.[0];
 const context=html.match(/<section class="panel"><div class="kicker">What to know before you go<\/div>[\s\S]*?<\/section>/)?.[0];
 const duplicates=html.match(/<section class="panel"><div class="kicker">Open a destination planner<\/div>[\s\S]*?<\/section>/)?.[0];
 if(!nav||!context||!duplicates)throw new Error('Michigan page context/navigation structures changed');
 html=html.replace(nav,'').replace(context,'').replace(duplicates,'');
 const start='<section class="ad-intro" id="ad-stories"><div><p class="ad-kicker">Michigan, after sunset</p>'+
 '<h2>Three different ways to find the dark.</h2></div>'+
 '<p>Darkness is a place, not a promise of clear skies. Start with the landscape that calls to you. Every story opens the existing live forecast and real park-access notes.</p></section>';
 const stories='<section class="ad-stories" aria-label="Featured Michigan dark sky destinations">'+
 storyCard({slug:'headlands',title:'The Straits, after the lights fade',kicker:'Headlands · Emmet County',
 description:'Stand beneath a northern Michigan sky near Mackinaw City, where the forest opens toward Lake Michigan. A dark-sky designation makes this a destination; the clouds decide what you will actually see.',
 move:'Explore the park’s designated observing areas and programming. Confirm gates and arrival instructions with the county park.',
 operator:sites.find(p=>p.slug==='headlands').source,image:'headlands'})+
 storyCard({slug:'port-crescent',title:'The Thumb, with the lake at your feet',kicker:'Port Crescent · Lake Huron',
 description:'A quiet stretch of the Thumb coastline, with dark sky above Lake Huron. The archival daylight photograph shows the real shoreline, not what tonight’s sky will look like.',
 move:'Michigan DNR identifies Parking Lot D and its nearby viewing platform as the primary observing location. Winter plowing is not provided for the preserve.',
 operator:'https://www.michigan.gov/recsearch/parks/portcrescent',image:'port-crescent'})+
 storyCard({slug:'keweenaw',title:'The peninsula at the edge of Lake Superior',kicker:'Keweenaw · Copper Harbor',
 description:'An old lodge in the northern Keweenaw makes a distinctive base for a dark-sky outing. The historic daytime photograph shows the lodge setting, not a current night-sky forecast.',
 move:'Use the Keweenaw Mountain Lodge as a named planning landmark; confirm its nighttime programs, operating rules and any seasonal road limitations.',
 operator:sites.find(p=>p.slug==='keweenaw').source,image:'keweenaw'})+
 '</section>';
 const other=sites.filter(p=>!['headlands','port-crescent','keweenaw'].includes(p.slug));
 const all='<section class="ad-directory" aria-label="All ten Michigan dark sky destinations"><div class="ad-directory-heading"><h2>All ten protected Michigan skies</h2><p>See a familiar place? Open its park-specific planner. The map and filters below remain available for comparison.</p></div><nav aria-label="Browse all Michigan park guides">'+
 sites.map(p=>'<a href="'+ROOT+E(p.slug)+'/">'+E(p.name)+' <span aria-hidden="true">↗</span></a>').join('')+
 '</nav><p class="ad-note">Ten verified protected locations; each link leads to its own sky forecast and access caveats. These are not all guaranteed nighttime parking locations.</p></section>';
 if(!other.length)throw new Error('Other Michigan parks missing');
 if(!html.includes('<main class="wrap">'))throw new Error('Missing main wrapper');
 html=html.replace('<main class="wrap">','<main class="wrap">'+start+stories+all);
 html=html.replace('<section class="panel"><h2>Method and limits</h2>',context+'<div class="ad-state-nav">'+nav+'</div><section class="panel"><h2>Method and limits</h2>');
 // Preserve original canonical, own forecasts, filtering, map, backend and all old data hooks.
 for(const token of ['id="darkSkyPayload"','id="darkSkyMap"','id="region"','id="siteCards"','id="compare4"','id="myLocation"','id="designation"'])
  if(!html.includes(token))throw new Error('Michigan After Dark lost critical existing hook '+token);
 if((html.match(/<h1/g)||[]).length!==1)throw new Error('Multiple H1 headings');
 return html;
}
