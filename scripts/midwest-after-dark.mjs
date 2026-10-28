/* FIELD_GUIDE_V1: Midwest After Dark, composed as a regional route into six distinct state guides.
   No duplicate forecasts, existing public canonical and engine unchanged. */
import fs from 'node:fs';
const base='/national-tools/dark-sky/';
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const photos=JSON.parse(fs.readFileSync('data/midwest-after-dark-photos.json','utf8')).photos;
function photo(id,cls='',eager=false){
 const p=photos.find(x=>x.id===id);
 if(!p||p.status!=='verified-source-and-license')throw Error('Unverified Midwest photo '+id);
 for(const k of ['imageURL','sourceURL','photographer','licenseURL','licenseName','alt','cropPosition','captureDate','width','height'])if(!p[k])throw Error(id+' missing photo metadata '+k);
 if(!p.imageURL.startsWith('https://upload.wikimedia.org/wikipedia/commons/thumb/')||!p.sourceURL.startsWith('https://commons.wikimedia.org/wiki/File:'))throw Error('Untrusted image origin '+id);
 return '<figure class="mw-photo '+E(cls)+'" style="--mw-crop:'+E(p.cropPosition)+'">'+
 '<img src="'+E(p.imageURL)+'" width="'+p.width+'" height="'+p.height+'" alt="'+E(p.alt)+'" loading="'+(eager?'eager':'lazy')+'" decoding="async"'+(eager?' fetchpriority="high"':'')+'>'+
 '<figcaption>Archival photo: <a href="'+E(p.sourceURL)+'" target="_blank" rel="noopener noreferrer">'+E(p.photographer)+'</a> · <a href="'+E(p.licenseURL)+'" target="_blank" rel="noopener noreferrer">'+E(p.licenseName)+'</a> · '+E(p.captureDate.slice(0,4))+(p.licenseName.includes('CC BY')?' · display crop':'')+'</figcaption></figure>';
}
const states=[
 {code:'MI',slug:'michigan',name:'Michigan',label:'The Great Lakes shore',why:'Headlands, Port Crescent and the Keweenaw offer very different horizon and winter-access decisions.',site:'headlands'},
 {code:'MN',slug:'minnesota',name:'Minnesota',label:'Island and wilderness skies',why:'Voyageurs and Boundary Waters require a named public access point, not a wilderness-area centroid.',site:'voyageurs'},
 {code:'WI',slug:'wisconsin',name:'Wisconsin',label:'The Door County coast',why:'At Newport, Lake Michigan shore conditions and the park’s trail rules matter as much as darkness.',site:'newport'},
 {code:'IL',slug:'illinois',name:'Illinois',label:'Prairie and river darkness',why:'Middle Fork offers an officially recognized dark-sky landscape; check overnight use and the preserve’s current rules.',site:'middlefork'},
 {code:'IN',slug:'indiana',name:'Indiana',label:'A community protecting darkness',why:'Beverly Shores is a Dark Sky Community, not a guaranteed public observing or overnight parking location.',site:'beverly'},
 {code:'OH',slug:'ohio',name:'Ohio',label:'Observatory evenings',why:'Geauga Observatory Park is a program-led visit. Check event calendars and gate hours before driving.',site:'geauga'}
];
function featured(id,eyebrow,headline,description,move,sites){
 const p=sites.find(x=>x.slug===id);if(!p)throw Error('Missing destination '+id);
 return '<article class="mw-feature">'+photo(id)+
 '<div class="mw-feature-copy"><p class="mw-overline">'+E(eyebrow)+'</p><h3>'+E(headline)+'</h3><p>'+E(description)+'</p><p class="mw-field-move"><strong>The field move</strong>'+E(move)+'</p>'+
 '<div class="mw-actions"><a class="mw-primary" href="'+base+E(id)+'/">Check this park’s sky and access →</a><a href="'+E(p.source)+'" target="_blank" rel="noopener noreferrer">Official designation ↗</a></div></div></article>';
}
export function applyMidwestAfterDark(html,sites){
 if(sites.length!==16)throw Error('Expected sixteen Midwest places');
 for(const s of states)if(!sites.some(p=>p.slug===s.site&&p.state===s.code))throw Error('Missing state example '+s.slug);
 if(!html.includes('Midwest Dark Sky Parks: is tonight worth the trip?'))throw Error('Midwest source heading changed');
 if(!html.includes('<main class="wrap">'))throw Error('Midwest main missing');
 html=html.replace('<body>','<body class="afterdark-midwest">');
 html=html.replace('"dateModified":"2026-10-25"','"dateModified":"2026-10-28"');
 html=html.replace('</head>','<link rel="stylesheet" href="/national-tools/dark-sky/assets/midwest-after-dark.css"></head>');
 html=html.replace('Midwest Dark Sky Parks: is tonight worth the trip?','Midwest dark sky parks: find your place after sunset');
 html=html.replace('A living calendar of the night sky','Field notes from six Midwest night skies');
 html=html.replace('Start with a protected night sky, then decide whether tonight is actually worth the trip. The Midwest has distinct lake, forest, prairie and urban-fringe observing challenges.',
 'A lake falls quiet in Minnesota. The Door County shore turns dark. An Illinois river slips through the prairie. Choose a landscape, then let real clouds, moonlight and access rules decide the night.');
 html=html.replace('href="#siteCards">Explore destination planners ↓','href="#mw-states">Choose a state ↓');
 const hero='<a class="mw-hero-image" href="'+base+'voyageurs/" aria-label="Explore the Voyageurs National Park stargazing planner">'+photo('voyageurs','mw-hero-photo',true)+
 '<span class="mw-hero-label">Northern Minnesota · Voyageurs National Park<br><strong>Follow the last light across Rainy Lake</strong></span></a>';
 const heroPattern=/(<div class="hero-links">[\s\S]*?<\/div>)(<\/div><\/section>)/;
 if(!heroPattern.test(html))throw Error('Midwest hero layout changed');
 html=html.replace(heroPattern,(_m,links,close)=>links+hero+close);
 const region=html.match(/<section class="panel"><div class="kicker">What to know before you go<\/div>[\s\S]*?<\/section>/)?.[0];
 const nav=html.match(/<section class="panel" aria-label="Midwest dark-sky state guides">[\s\S]*?<\/section>/)?.[0];
 const duplicate=html.match(/<section class="panel"><div class="kicker">Open a destination planner<\/div>[\s\S]*?<\/section>/)?.[0];
 if(!region||!nav||!duplicate)throw Error('Expected pre-redesign state context blocks');
 html=html.replace(region,'').replace(nav,'').replace(duplicate,'');
 const stateIntro='<section class="mw-region-switch" id="mw-states" aria-label="Choose a Midwest state">'+
 '<div class="mw-section-head"><div><p class="mw-overline">Where will you go after sunset?</p><h2>Six regions, six different nights.</h2></div><p>Each state guide opens a curated landscape and real conditions. No single forecast represents a whole state.</p></div>'+
 '<div class="mw-state-strip">'+states.map(s=>'<a href="'+base+s.slug+'/"><span>'+s.code+'</span><strong>'+s.name+'</strong><small>'+E(s.label)+'</small></a>').join('')+'</div></section>';
 const intro='<section class="mw-editorial" aria-labelledby="mw-feature-heading"><div class="mw-section-head"><div><p class="mw-overline">The places that make the night worth the drive</p><h2 id="mw-feature-heading">Start with the feeling of a place.</h2></div><p>These are genuine archive photographs of the named destinations, not a live view of tonight’s sky. Open the park planner to check a dated forecast and the operator’s access advice.</p></div>'+
 '<div class="mw-feature-grid">'+
 featured('newport','Wisconsin · Door County','The lake that holds the evening','Newport State Park puts the broad Lake Michigan horizon at the end of a wooded walk. Daytime shoreline imagery shows the actual landscape; the dark-sky designation does not guarantee a clear or accessible night.',
 'Select a lawful parking area, check Wisconsin DNR trail conditions, and compare moonlight and clouds before leaving.',sites)+
 featured('middlefork','Illinois · Champaign County','A river corridor under quiet skies','At Middle Fork River Forest Preserve, the Vermilion River bends through fields and timber. A designated dark-sky place closer to central Illinois, but after-hours access is governed by the preserve.',
 'Confirm the forest preserve’s overnight observing rules before choosing where to stop.',sites)+
 '</div></section>';
 const handoff='<section class="mw-handoff" aria-label="Pick your night-sky purpose"><p class="mw-overline">The next decision</p><div><div><h2>Where is the sky worth going to?</h2><p>Use the interactive map and live comparison below for selected park-area forecasts, not driving times or guaranteed gates.</p></div><a href="#mw-forecast" class="mw-forecast-link">Compare skies and map ↓</a><a href="/national-tools/meteor-shower/" class="mw-text-link">Meteor shower tonight ↗</a></div></section>';
 html=html.replace('<main class="wrap">','<main class="wrap">'+stateIntro+intro+handoff);
 // Keep filtering, map, forecast and all sixteen dynamic cards unchanged.
 html=html.replace('<div class="two-col"><div>','<div class="two-col" id="mw-forecast"><div>');
 const index='<section class="mw-index"><details><summary>Browse all 16 Midwest dark-sky destination planners <span aria-hidden="true">+</span></summary><div class="mw-index-grid">'+states.map(s=>
 '<div><h3>'+E(s.name)+'</h3>'+sites.filter(p=>p.state===s.code).map(p=>'<a href="'+base+E(p.slug)+'/">'+E(p.name)+'</a>').join('')+'</div>').join('')+
 '</div></details><p class="mw-index-note">These links also work without JavaScript. Each destination opens its separate sky forecast and source-backed access notes.</p></section>';
 // Place the compact static index after existing live-filter cards, rather than repeating sixteen cards above the map.
 const endCards='<section class="panel"><h2>Method and limits</h2>';
 if(!html.includes(endCards))throw Error('Missing method insertion anchor');
 html=html.replace(endCards,index+region+endCards);
 const guide='<p class="mw-method">Field Guide v1: documentary photography, official designations and a separate live observing decision. Park map pins are area references, not verified entrance or parking coordinates. Photographs show earlier landscapes, not current weather.</p>';
 html=html.replace('<section class="panel"><h2>Method and limits</h2>',guide+'<section class="panel"><h2>Method and limits</h2>');
 for(const hook of ['id="darkSkyPayload"','id="darkSkyMap"','id="region"','id="siteCards"','id="compare4"','id="myLocation"','id="designation"'])
  if(!html.includes(hook))throw Error('Lost live sky hook: '+hook);
 if((html.match(/<h1/g)||[]).length!==1)throw Error('Multiple H1s');
 return html;
}
