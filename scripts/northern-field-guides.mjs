/* FIELD_GUIDE_V1 state experiences: distinct Wisconsin and Minnesota compositions.
   Existing 16-site state/region and individual destination forecast engines unchanged. */
import fs from 'node:fs';

const ROOT='/national-tools/dark-sky/';
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const photos=JSON.parse(fs.readFileSync('data/northern-dark-sky-field-guide-photos.json','utf8')).photos;
const findPhoto=id=>{
 const p=photos.find(x=>x.id===id);
 if(!p||p.status!=='source-and-license-verified')throw Error('Missing reviewed photograph '+id);
 for(const key of ['placeId','imageURL','sourceURL','photographer','licenseURL','licenseName','alt','cropPosition','captureDate','width','height'])
  if(!p[key])throw Error('Incomplete photo '+id+': '+key);
 const commons=p.imageURL.startsWith('https://upload.wikimedia.org/wikipedia/commons/')&&p.sourceURL.startsWith('https://commons.wikimedia.org/wiki/File:')&&p.licenseURL.startsWith('https://creativecommons.org/');
 const nps=p.imageURL.startsWith('https://npgallery.nps.gov/GetAsset/')&&p.sourceURL.startsWith('https://npgallery.nps.gov/AssetDetail/')&&p.licenseURL===p.sourceURL&&p.licenseName.includes('NPS public domain');
 if(!commons&&!nps)throw Error('Invalid photo source/rights URL '+id);
 return p;
};
function picture(id,klass,eager=false){
 const p=findPhoto(id);
 return '<figure class="ng-photo '+E(klass)+'" style="--ng-crop:'+E(p.cropPosition)+'">'+
 '<img src="'+E(p.imageURL)+'" width="'+p.width+'" height="'+p.height+'" alt="'+E(p.alt)+'" loading="'+(eager?'eager':'lazy')+'" decoding="async"'+(eager?' fetchpriority="high"':'')+'>'+
 '<figcaption>Archival image: <a href="'+E(p.sourceURL)+'" target="_blank" rel="noopener noreferrer">'+E(p.photographer)+'</a> · <a href="'+E(p.licenseURL)+'" target="_blank" rel="noopener noreferrer">'+E(p.licenseName)+'</a> · '+p.captureDate.slice(0,4)+' · display crop</figcaption></figure>';
}
const L=(url,label)=>'<a href="'+E(url)+'" target="_blank" rel="noopener noreferrer">'+E(label)+'</a>';
const directions=name=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name);
const sources={
 wi:'https://dnr.wisconsin.gov/topic/parks/newport',
 wiDark:'https://dnr.wisconsin.gov/topic/parks/newport/darksky',
 wiInfo:'https://dnr.wisconsin.gov/topic/parks/newport/info',
 wiRecreation:'https://dnr.wisconsin.gov/topic/parks/newport/recreation',
 mn:'https://www.nps.gov/voya/planyourvisit/stargazing.htm',
 mnVisit:'https://www.nps.gov/voya/planyourvisit/basicinfo.htm',
 bwca:'https://www.recreation.gov/permits/233396'
};
function take(html){
 const nav=html.match(/<section class="panel" aria-label="Midwest dark-sky state guides">[\s\S]*?<\/section>/)?.[0];
 const context=html.match(/<section class="panel"><div class="kicker">What to know before you go<\/div>[\s\S]*?<\/section>/)?.[0];
 const duplicate=html.match(/<section class="panel"><div class="kicker">Open a destination planner<\/div>[\s\S]*?<\/section>/)?.[0];
 if(!nav||!context||!duplicate)throw Error('Unexpected original state guide layout');
 return {nav,context,duplicate};
}
function finish(html,sections,links,mode){
 for(const original of [sections.nav,sections.context,sections.duplicate])html=html.replace(original,'');
 const original='<section class="panel"><h2>Method and limits</h2>';
 if(!html.includes(original))throw Error('Missing method boundary');
 html=html.replace(original,
 '<section class="ng-after-map" aria-label="Additional state guides">'+links+'<div class="ng-original-access">'+sections.context+'</div></section>'+original);
 for(const id of ['darkSkyPayload','darkSkyMap','compare4','region','myLocation','searchSites','designation','siteCards','mapStatus'])
  if(!html.includes('id="'+id+'"'))throw Error('Lost shared hook '+id);
 if((html.match(/<h1/g)||[]).length!==1)throw Error('Page has wrong number of H1');
 if(html.includes('<div class="kicker">Open a destination planner</div>'))throw Error('Duplicate old catalog');
 if(!html.includes('<link rel="canonical" href="https://chrisizworski.com/national-tools/dark-sky/'+mode+'/">'))throw Error('Unexpected canonical');
 return html;
}
function updateMeta(html,originalHeading,newHeading,originalIntro,intro,klass){
 if(!html.includes(originalHeading)||!html.includes(originalIntro))throw Error('Expected source heading/lede missing');
 html=html.replace('<body>','<body class="northern-field-guide '+klass+'">');
 html=html.replace('"dateModified":"2026-10-25"','"dateModified":"2026-10-28"');
 html=html.replace('</head>','<link rel="stylesheet" href="/national-tools/dark-sky/assets/northern-field-guides.css"></head>');
 html=html.replace(originalHeading,newHeading).replace(originalIntro,intro);
 html=html.replace('A living calendar of the night sky','Field guide · Lake and wilderness skies');
 return html;
}
function putHeroImage(html,image,caption){
 const pattern=/(<div class="hero-links">[\s\S]*?<\/div>)(<\/div><\/section>)/;
 if(!pattern.test(html))throw Error('Hero DOM changed');
 return html.replace(pattern,(_m,buttons,close)=>buttons+'<div class="ng-hero-visual">'+image+'<p class="ng-image-sense">'+E(caption)+'</p></div>'+close);
}
function intro(html,content){
 if(!html.includes('<main class="wrap">'))throw Error('Missing main region');
 return html.replace('<main class="wrap">','<main class="wrap">'+content);
}
const back='<a class="ng-back" href="'+ROOT+'midwest/">← All six Midwest dark-sky guides</a>';
export function applyWisconsinNight(html,sites){
 if(sites.length!==1||sites[0].slug!=='newport')throw Error('Wisconsin must remain Newport-only');
 html=updateMeta(html,
 'Wisconsin Dark Sky Parks: is tonight worth the trip?',
 'Newport State Park after dark: Wisconsin stargazing guide',
 'Newport State Park on Door County’s Lake Michigan side is a certified International Dark Sky Park. Use the forecast to choose a night, not to infer trail or park safety.',
 'At the far tip of Door County, Lake Michigan opens a dark horizon beyond the trees. Choose the right viewing area and time, then check the live clouds and moon before you drive.',
 'northern-wi');
 html=html.replace('href="#siteCards">Explore destination planners ↓','href="#ng-wisconsin-visit">Plan Newport after dark ↓');
 html=putHeroImage(html,picture('newport-night','ng-primary-photo',true),'Milky Way over Newport State Park in 2016. A long exposure, not tonight’s sky.');
 const panel='<section class="ng-wi-plan" id="ng-wisconsin-visit">'+
 '<div class="ng-heading"><p class="ng-kicker">One park, one distinct night</p><h2>Walk toward a wide, dark Lake Michigan horizon.</h2><p>Newport is an International Dark Sky Park, but certification describes its light protection, not current clouds or permission to remain after hours. Arrive in daylight to identify the viewing area, as Wisconsin DNR advises.</p></div>'+
 '<div class="ng-wi-columns"><div class="ng-wi-note">'+picture('newport','ng-secondary-photo')+
 '<h3>What is this place?</h3><p>A quiet stretch of shoreline, woodland and the chance to see a much larger sky. The daylight photo shows the actual park landscape; it cannot show whether tonight is clear.</p>'+
 '<a href="'+ROOT+'newport/" class="ng-primary">Check Newport’s current sky →</a></div>'+
 '<div class="ng-wi-facts" aria-label="Verified Newport visitor facts">'+
 '<div class="ng-fact"><span>01 · When</span><h3>Park hours are 6 a.m.–11 p.m.</h3><p>Wisconsin DNR lists these as regular year-round park hours. A weather window after 11 p.m. is not an access authorization. A vehicle admission sticker is required.</p>'+L(sources.wiInfo,'Wisconsin DNR hours and fees ↗')+'</div>'+
 '<div class="ng-fact"><span>02 · Where</span><h3>Dark Sky Viewing Area near Lot 3</h3><p>Wisconsin DNR’s June 22, 2026 notice says the viewing area remains open during nearby construction. This is a dated notice, not a live construction or parking report.</p>'+L(sources.wi,'DNR property notices ↗')+' · '+L(directions('Newport State Park Parking Lot 3 Ellison Bay WI'),'Find Lot 3 on Google Maps ↗')+'</div>'+
 '<div class="ng-fact"><span>03 · On the ground</span><h3>Learn the terrain before dark</h3><p>The DNR recommends a daylight scouting visit. The July 17, 2026 update says trails reopened after 2025 storm damage, but check current trail conditions and winter surfaces before leaving.</p>'+L(sources.wiDark,'DNR night-sky guidance ↗')+' · '+L(sources.wiRecreation,'Trails and winter activities ↗')+'</div>'+
 '</div></div></section>';
 const handoff='<div class="ng-handoff" id="ng-wi-check"><div><p class="ng-kicker">Before you travel</p><h2>How good is Newport’s sky tonight?</h2><p>The map and forecast comparison below use a park-area weather sample, not a confirmed open gate or an exact viewing-platform observation.</p></div><a class="ng-primary" href="#darkSkyMap">Explore map & weather ↓</a></div>';
 html=intro(html,back+panel+handoff);
 const sections=take(html);
 return finish(html,sections,'<a href="'+ROOT+'newport/">Newport live park planner →</a> · <a href="'+ROOT+'michigan/">Michigan After Dark →</a>', 'wisconsin');
}
export function applyMinnesotaNight(html,sites){
 if(sites.length!==2||!sites.some(s=>s.slug==='voyageurs')||!sites.some(s=>s.slug==='bwca'))throw Error('Minnesota source must contain Voyageurs and BWCA');
 html=updateMeta(html,
 'Minnesota Dark Sky Places: is tonight worth the trip?',
 'Minnesota after dark: Voyageurs or Boundary Waters?',
 'Voyageurs National Park and the Boundary Waters Canoe Area Wilderness are major northern Minnesota night-sky destinations, but their large geographic areas require specific access planning.',
 'Two magnificent northern landscapes, two very different journeys. Find a mainland-accessible dark-sky stop at Voyageurs, or plan a permitted wilderness night in the Boundary Waters. Then check the clouds.',
 'northern-mn');
 html=html.replace('href="#siteCards">Explore destination planners ↓','href="#ng-minnesota-choice">Choose your night-sky route ↓');
 html=putHeroImage(html,picture('voyageurs','ng-primary-photo',true),'Rainy Lake, Voyageurs National Park. Archival landscape; the sky forecast is separate.');
 const panel='<section class="ng-mn-choice" id="ng-minnesota-choice"><div class="ng-heading"><p class="ng-kicker">Two ways into the North</p><h2>A roadside vantage point, or a wilderness expedition?</h2><p>Both are International Dark Sky destinations, but do not mistake a forecast-point marker for a trailhead or a park entrance. Choose the type of trip before you choose the night.</p></div>'+
 '<div class="ng-mn-routes"><article class="ng-mn-main">'+
 '<div class="ng-mn-route-image">'+picture('voyageurs-nps-aurora','ng-route-photo')+'</div>'+
 '<div class="ng-mn-route-content"><p class="ng-kicker">Voyageurs National Park · Mainland-accessible choices</p><h3>Start with Rainy Lake or the Ash River road.</h3>'+
 '<p>National Park Service lists the <strong>upper parking lot at Rainy Lake Visitor Center</strong> and the <strong>Meadwood Road Day Use Area</strong> off Ash River Visitor Center Road as two designated dark-sky viewing areas. Use an identified land access rather than a lakewide marker. The archival aurora photograph is not a prediction for tonight. Park services may be limited outside visitor-center hours.</p>'+
 '<div class="ng-route-links"><a class="ng-primary" href="'+ROOT+'voyageurs/">Check Voyageurs viewing conditions →</a>'+L(sources.mn,'NPS designated viewing areas ↗')+
 L(directions('Rainy Lake Visitor Center 1797 Township Road 342 International Falls MN'),'Find Rainy Lake Visitor Center ↗')+
 L(directions('Meadwood Road Day Use Area Ash River Minnesota'),'Find Meadwood Road viewing area ↗')+'</div>'+
 '<p class="ng-fine">Open 24 hours according to NPS basic information, but services and local conditions vary. Roads, water access, lake ice and individual parking areas are not verified live. '+L(sources.mnVisit,'NPS operating information ↗')+'</p></div></article>'+
 '<article class="ng-mn-secondary">'+picture('bwca-sunset','ng-route-photo')+
 '<div class="ng-mn-route-content"><p class="ng-kicker">Boundary Waters · Permit-required wilderness</p><h3>Stay for the sky, but plan the journey.</h3>'+
 '<p>A campsite sunset is the beginning of a very different night. The BWCAW is a large wilderness with numerous separate entry points, not one public viewing car park. Overnight paddling and hiking involve permit rules, route selection, water conditions and self-reliance.</p>'+
 '<p class="ng-permit"><strong>Permit required year-round.</strong> From October 1–April 30, self-issued permits apply; quota permits are required for overnight visits May 1–September 30. Non-motorized day use requires a self-issued permit year-round. Check the current rules for the exact trip type.</p>'+
 '<div class="ng-route-links"><a class="ng-primary" href="'+ROOT+'bwca/">Check BWCA region’s sky outlook →</a>'+L(sources.bwca,'Official BWCAW permits and entry points ↗')+'</div>'+
 '<p class="ng-fine">Do not use the BWCAW reference map pin for driving directions. Confirm an authorized entry point and trail or water route. The sky forecast cannot evaluate wilderness safety.</p></div></article></div></section>';
 const handoff='<div class="ng-handoff"><div><p class="ng-kicker">Now the weather decision</p><h2>Which Northern Minnesota sky looks better?</h2><p>Compare two geographic forecast samples below. This is not a score for access, boat travel, lake ice or wilderness permits.</p></div><a class="ng-primary" href="#darkSkyMap">Compare map & forecast ↓</a></div>';
 html=intro(html,back+panel+handoff);
 const sections=take(html);
 return finish(html,sections,'<a href="'+ROOT+'voyageurs/">Voyageurs sky planner →</a> · <a href="'+ROOT+'bwca/">Boundary Waters sky planner →</a> · <a href="'+ROOT+'wisconsin/">Wisconsin night sky →</a>', 'minnesota');
}
