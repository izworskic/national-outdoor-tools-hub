/* Three destination-level FIELD_GUIDE_V1 visitor journeys. These enrich existing generated
   park URLs without replacing the meteor/NWS engine, map, canonicals, ads or GA4. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT='/national-tools/dark-sky/';
const data=JSON.parse(fs.readFileSync('data/dark-sky-visit-guides.json','utf8')).places;
const photos=JSON.parse(fs.readFileSync('data/northern-dark-sky-field-guide-photos.json','utf8')).photos;
const E=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,label,cls='')=>'<a '+(cls?'class="'+E(cls)+'" ':'')+'href="'+E(url)+'"'+(url.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':'')+'>'+E(label)+'</a>';
const officialLink=(url,label)=>link(url,label+' ↗');
function getPhoto(id,place){
 const p=photos.find(x=>x.id===id);
 if(!p||p.placeId!==place||p.status!=='source-and-license-verified')throw Error('Photo without proven place and rights: '+id);
 for(const key of ['imageURL','sourceURL','licenseURL','licenseName','photographer','alt','width','height','cropPosition','captureDate'])if(!p[key])throw Error('Missing photo field '+id+' '+key);
 const commons=p.imageURL.startsWith('https://upload.wikimedia.org/')&&p.sourceURL.startsWith('https://commons.wikimedia.org/wiki/File:');
 const nps=p.imageURL.startsWith('https://npgallery.nps.gov/GetAsset/')&&p.sourceURL.startsWith('https://npgallery.nps.gov/AssetDetail/');
 if(!commons&&!nps)throw Error('Untrusted photo source '+id);
 return p;
}
function figure(id,place,klass='',hero=false){
 const p=getPhoto(id,place);
 return '<figure class="dg-photo '+E(klass)+'" style="--dg-crop:'+E(p.cropPosition)+'">'+
 '<img src="'+E(p.imageURL)+'" alt="'+E(p.alt)+'" width="'+p.width+'" height="'+p.height+'" loading="'+(hero?'eager':'lazy')+'" decoding="async"'+(hero?' fetchpriority="high"':'')+'>'+
 '<figcaption>Archive · '+link(p.sourceURL,p.photographer)+' · '+link(p.licenseURL,p.licenseName)+' · '+E(p.captureDate.slice(0,4))+' · display crop</figcaption></figure>';
}
function headerHero(html,p){
 const id=p.slug;
 let first={newport:'newport-night',voyageurs:'voyageurs-nps-aurora',bwca:'bwca-sunset'}[id];
 if(!first)throw Error('No reviewed hero '+id);
 const hero='<div class="dg-hero-visual">'+figure(first,id,'dg-hero-photo',true)+
 '<p class="dg-hero-caption">This photograph shows a previous visit, not tonight’s sky or access.</p></div>';
 const pattern=/(<div class="hero-links">[\s\S]*?<\/div>)(<\/div><\/section>)/;
 if(!pattern.test(html))throw Error('Unexpected park hero');
 html=html.replace(pattern,(_m,btn,close)=>btn+hero+close);
 return html;
}
function guideSection(id,heading,body){
 return '<section class="dg-section" id="'+E(id)+'" aria-labelledby="'+E(id)+'-title">'+
 '<p class="dg-eyebrow">Field notes · a real night out</p><h2 id="'+E(id)+'-title">'+E(heading)+'</h2>'+body+'</section>';
}
function arrivalRow(items){
 return '<div class="dg-steps">'+items.map((x,i)=>'<div class="dg-step"><span class="dg-number">0'+(i+1)+'</span><h3>'+E(x.title)+'</h3><p>'+E(x.copy)+'</p></div>').join('')+'</div>';
}
function newport(p){
 const pub=data.newport;
 const photo=figure('newport','newport','dg-inline-photo');
 const facts='<div class="dg-visiting-grid"><div class="dg-visiting-photo">'+photo+
 '<p>Newport’s shoreline is the reason to come. The view above is an archival daytime photograph, not an indication of tonight’s horizon or trail safety.</p></div>'+
 '<div class="dg-visit-cards">'+
 '<article><p class="dg-eyebrow">Arrival · the actual location</p><h3>Dark Sky Viewing Area, near Lot 3</h3><p>Use the named Lot 3 viewing area, not the weather-sample map pin. The DNR has announced construction nearby and says the viewing area remains open in its dated notice. Confirm conditions immediately before travel.</p><p>'+link(pub.arrival.maps,'Find Lot 3 on Google Maps ↗','dg-primary')+' '+officialLink(pub.official[0],'Latest property notices')+'</p></article>'+
 '<article><p class="dg-eyebrow">Hours · non-camping visits</p><h3>6 a.m.–11 p.m. local time</h3><p>Published year-round park hours. A vehicle admission sticker is required. Wisconsin state park rules require ordinary visitors to leave at 11 p.m.; registered campers are subject to separate rules.</p><p>'+officialLink(pub.official[0],'DNR hours and fees')+' · '+officialLink(pub.official[3],'Camping/closing rules')+'</p></article>'+
 '<article><p class="dg-eyebrow">What changed · dated notices</p><h3>Check Lot 3 and trail notices</h3><p><strong>June 22, 2026:</strong> construction near Lot 3; viewing area stated open. <strong>July 17, 2026:</strong> trails reopened following storm damage. Neither statement verifies today’s construction or surface conditions.</p><p>'+officialLink(pub.official[0],'Read current notices')+' · '+officialLink(pub.official[2],'Trail and winter information')+'</p></article>'+
 '</div></div>';
 const overlap='<section class="dg-overlap" aria-labelledby="dg-overlap-title"><div><p class="dg-eyebrow">Live NWS forecast + published park hours</p><h2 id="dg-overlap-title">Which dark hours fit the visiting window?</h2><p>Only hourly forecasts between <strong>6 a.m. and 11 p.m. Central Time</strong> are eligible here. Later skies might be good for registered campers but are not an ordinary-visitor recommendation. Forecast scores indicate modeled sky conditions, not permission, open gates or safe trails.</p></div><div id="dgNewportWindows" class="dg-window-results" role="status" aria-live="polite">Waiting for a verified NWS hourly forecast. Park hours are published guidance, not live access status.</div></section>';
 const body=arrivalRow([
 {title:'Choose the entrance',copy:'Start at Newport State Park’s designated viewing area near Lot 3, not a coordinate on the weather map.'},
 {title:'Check your visit window',copy:'Compare real cloud/moon forecasts against the park’s 11 p.m. closure for non-campers.'},
 {title:'Arrive before it is dark',copy:'Walk and scout the viewing area in daylight. Watch for construction, slippery shorelines, wind and cold.'}
 ])+facts;
 return {intro:guideSection('dg-newport','A shoreline, a real arrival, and a legal viewing window.',body),after:overlap};
}
function voyageurs(){
 const pub=data.voyageurs;
 const arrive=pub.arrival.map((x,i)=>
 '<article class="dg-location"><p class="dg-eyebrow">NPS-designated viewing area · '+(i===0?'Northern approach':'Ash River approach')+'</p><h3>'+E(x.name)+'</h3>'+
 '<p>'+E(x.qualification)+'</p><p class="dg-address">'+E(x.address)+'</p>'+
 '<div class="dg-actions">'+link(x.maps,'Find named location on Google Maps ↗','dg-primary')+' '+officialLink(x.official,'NPS designation')+'</div></article>').join('');
 const contrast='<div class="dg-warning"><strong>Two viewing areas, one regional forecast sample.</strong> The live park forecast below uses the existing Voyageurs reference coordinate. It does not measure clouds at either parking lot, guarantee the lot is accessible or establish road and ice conditions. The NPS lists Voyageurs as open 24 hours generally, while visitor-center buildings have separate seasonal schedules.</div>';
 const body='<div class="dg-scene">'+figure('voyageurs','voyageurs','dg-side-photo')+
 '<div><p class="dg-large-quote">The most useful night-sky map starts with where a person can actually stand.</p><p>Voyageurs is a landscape of water and islands, but the National Park Service specifically identifies two mainland-reachable dark-sky viewpoints. Choose the correct access road before deciding what the weather will be like.</p></div></div>'+
 '<div class="dg-location-grid">'+arrive+'</div>'+contrast+arrivalRow([
 {title:'Pick a named viewing area',copy:'Rainy Lake upper parking lot or Meadwood Road Day Use Area, not the park’s regional map pin.'},
 {title:'Check the sky',copy:'Use the existing NWS park-area forecast as a broad guide, not a prediction at either exact lot.'},
 {title:'Check seasonal access',copy:'Confirm current NPS alerts, visitor-center closures, road conditions, daylight and shoreline hazards.'}
 ]);
 return {intro:guideSection('dg-voyageurs','Two places to stand beneath a big northern sky.',body),after:'<div class="dg-overlap dg-light-handoff"><p class="dg-eyebrow">Your observing decision</p><h2>Forecast first, then confirm the road.</h2><p>A favorable park-area sky score cannot establish safe travel or a legally accessible parking lot. '+officialLink('https://www.nps.gov/voya/planyourvisit/basicinfo.htm','NPS current operating information')+' · '+officialLink('https://www.nps.gov/voya/planyourvisit/conditions.htm','NPS conditions')+'</p></div>'};
}
function bwca(){
 const pub=data.bwca;
 const body='<div class="dg-bwca-story"><div>'+figure('bwca-portage','bwca','dg-side-photo')+
 '<p class="dg-picture-note">An actual BWCA portage approach photographed in 2017. It illustrates the need for legal entry-point and route planning, not a currently open trail.</p></div>'+
 '<div><p class="dg-large-quote">A night-sky trip is a wilderness trip first.</p><p>Choose a real U.S. Forest Service entry point, select the correct permit category, and plan the route and campsite before optimizing for darkness. The weather engine below scores a representative wilderness coordinate, not a campsite or travel corridor.</p>'+
 '<div class="dg-warning"><strong>There is no safe driving link to the BWCA centroid.</strong> Check the official permit’s entry-point description for navigation and any current closures. Travel conditions, ice, water and campsites are not checked by this page.</div></div></div>';
 const permit='<div class="dg-permit-helper" id="dg-bwca-permit" aria-labelledby="dg-bwca-permit-title">'+
 '<div><p class="dg-eyebrow">Planning helper · not a reservation system</p><h3 id="dg-bwca-permit-title">Which permit rules apply to your trip?</h3><p>Enter your intended arrival date and trip type. The result follows the posted Forest Service seasonal rules; it does not check availability, quotas, closures or issue a permit.</p>'+
 '<div class="dg-permit-controls"><label for="dgPermitDate">Entry date<input type="date" id="dgPermitDate"></label>'+
 '<label for="dgPermitType">Travel type<select id="dgPermitType"><option value="">Choose a trip type</option><option value="overnight-paddle">Overnight paddle</option><option value="overnight-hike">Overnight hiking</option><option value="overnight-motor">Overnight motor</option><option value="motorized-day">Motorized day</option><option value="nonmotorized-day">Non-motorized day</option></select></label></div>'+
 '<div id="dgPermitResult" class="dg-permit-result" role="status" aria-live="polite">A BWCAW permit is required for every visitor in every season. Select a date and trip type to see whether the official rules require a quota or self-issued permit.</div></div>'+
 '<div class="dg-permit-actions">'+link(pub.source,'Official permit rules and entry-point choices ↗','dg-primary')+
 officialLink(pub.links[1],'Forest Service trip-planning guide')+
 '<p class="dg-small"><strong>Remember:</strong> a quota permit is specific to the entry date and entry point. One permit per group; maximum nine people and four watercraft. You must check current closures, fire restrictions and route conditions.</p></div></div>';
 const steps=arrivalRow([
 {title:'Choose your route',copy:'Find a named authorized trail or water entry point using the Forest Service permit system; no generic wilderness parking pin.'},
 {title:'Get the right permit',copy:'A permit is required year-round. Quota and self-issued requirements change by trip type and season.'},
 {title:'Protect the night',copy:'Carry a red-light headlamp and sufficient navigation tools. Observe from an authorized campsite or safe route and leave no trace.'}
 ]);
 return {intro:guideSection('dg-bwca','The stars are the reward. Plan the wilderness first.',body+permit+steps),after:'<div class="dg-overlap dg-light-handoff"><p class="dg-eyebrow">About the sky index below</p><h2>One regional model, not a campsite forecast.</h2><p>Hourly cloud and moon information describe a representative Boundary Waters region. It cannot tell you whether an entry trail is clear, whether a lake is safe to cross, whether a permit is available, or whether the selected wilderness route is suitable.</p></div>'};
}
export function applyDestinationGuide(html,p){
 if(!data[p.slug])return html;
 const orig='<section class="panel"><div class="kicker">Decision two · when to look</div>';
 if(!html.includes(orig))throw Error('Missing hourly timeline on '+p.slug);
 const orig3='<div class="two-col"><section class="panel"><div class="kicker">Decision three · access</div>';
 if(!html.includes(orig3))throw Error('Missing existing access panel '+p.slug);
 if(!html.includes('<main class="wrap"><div class="tripline">'))throw Error('Missing park main/tripline');
 html=html.replace('<body>','<body class="destination-field-guide destination-'+E(p.slug)+'">');
 html=html.replace('</head>','<link rel="stylesheet" href="/national-tools/dark-sky/assets/destination-field-guide.css"></head>');
 html=headerHero(html,p);
 const blocks=p.slug==='newport'?newport(p):p.slug==='voyageurs'?voyageurs(p):bwca(p);
 // Give the visitor a compact static arrival guide before the live verdict; do not hide forecast.
 html=html.replace(orig,'<div class="dg-forecast-jump"><a href="#parkDecision">Review live sky verdict ↑</a> · <a href="#dg-guide-more">Explore access and hourly details ↓</a></div>'+orig);
 html=html.replace(orig3,'<div id="dg-guide-more">'+blocks.after+'</div>'+orig3);
 html=html.replace('<section class="panel"><div class="kicker">Decision one · tonight’s conditions</div>',blocks.intro+'<section class="panel"><div class="kicker">Decision one · tonight’s conditions</div>');
 const mark='<script src="/national-tools/dark-sky/assets/dark-sky-map-inspector.js" defer></script>';
 // Original footer uses map-inspector.js in an existing tag. Insert in the same defer sequence.
 if(!html.includes(mark))throw Error('Missing shared map script');
 html=html.replace(mark,mark+'<script src="/national-tools/dark-sky/assets/destination-field-guide.js" defer></script>');
 // Capture current source decision, but do not lose any legacy access, alternatives, NOAA forecast or map.
 for(const key of ['parkVerdict','parkTimeline','parkForecastStatus','parkHourDetail','darkSkyPayload','darkSkyMap','siteAlternatives','myLocation','tripDistance','parkReason'])
  if(!html.includes('id="'+key+'"'))throw Error('Missing existing park functionality '+p.slug+': '+key);
 if(!html.includes('href="https://chrisizworski.com/national-tools/dark-sky/'+p.slug+'/"'))throw Error('Canonical changed '+p.slug);
 if((html.match(/<h1/g)||[]).length!==1)throw Error('Multiple H1 '+p.slug);
 return html;
}
export function copyDestinationAssets(){
 const out='public/national-tools/dark-sky/assets';fs.mkdirSync(out,{recursive:true});
 for(const ext of ['css','js'])fs.copyFileSync('public/assets/destination-field-guide.'+ext,path.join(out,'destination-field-guide.'+ext));
}
