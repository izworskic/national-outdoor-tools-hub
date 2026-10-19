/* Great Lakes Dark-Sky Explorer. Forecast output is an observing index, never a meteor count or open-gate claim. */
(function(){
'use strict';
const node=document.getElementById('darkSkyPayload');if(!node)return;
const cfg=JSON.parse(node.textContent),sites=cfg.places,here=cfg.place||null,parkMode=!!here;
const $=id=>document.getElementById(id),cache=new Map();
const typeNames={international:'International Dark Sky Park',sanctuary:'International Dark Sky Sanctuary',state:'Michigan state-designated preserve',canadian:'Canadian Dark Sky Preserve',community:'International Dark Sky Community'};
const URL_BASE='/national-tools/dark-sky/';
const state={user:null,map:null,sitesLayer:null,focusLayer:null,tiles:null,ready:false,visible:sites,comparing:false};
function text(id,value){const target=$(id);if(target)target.textContent=String(value);}
function element(tag,cl,value){const e=document.createElement(tag);if(cl)e.className=cl;if(value!==undefined)e.textContent=String(value);return e;}
function formatted(iso,tz,opts){try{return new Intl.DateTimeFormat('en-US',{timeZone:tz||'America/Detroit',...opts}).format(new Date(iso));}catch{return 'Time unavailable';}}
const when=(iso,tz)=>formatted(iso,tz,{weekday:'short',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
const short=(iso,tz)=>formatted(iso,tz,{weekday:'short',hour:'numeric'});
function miles(a,b){const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad,c=2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2)));return Math.round(3958.76*c);}
function origin(){return state.user||{lat:43.594,lon:-83.889};}
function distanceNote(p){return '~'+miles(origin(),p)+' mi straight line'+(state.user?' from your approximate location':' from Bay City, MI reference');}
function path(p){return URL_BASE+encodeURIComponent(p.slug)+'/';}
function createAnchor(p,label){const a=element('a','',label);a.href=path(p);return a;}
function visibleSites(){if(parkMode)return sites;const region=$('region')?.value||'all',kind=$('designation')?.value||'all',q=($('searchSites')?.value||'').toLowerCase().trim();return sites.filter(p=>(region==='all'||region===p.state)&&(kind==='all'||kind===p.type)&&(!q||(p.name+' '+p.state+' '+p.intro).toLowerCase().includes(q))).sort((a,b)=>miles(origin(),a)-miles(origin(),b));}
function renderSiteCards(){const out=$('siteCards');if(!out)return;out.textContent='';const places=visibleSites();state.visible=places;text('siteCount',places.length+' destinations · distances are straight line, not routes');
for(const p of places){
 const card=element('article','site');const tag=element('div','tag',typeNames[p.type]+' · '+p.state),h=element('h3');h.append(createAnchor(p,p.name));
 const desc=element('p','',p.intro),small=element('p','small subtle',distanceNote(p));
 const actions=element('div','actions');actions.append(createAnchor(p,'Open viewing planner'));
 const official=element('a','secondary','Official operator ↗');official.href=p.source||p.url;official.target='_blank';official.rel='noopener noreferrer';actions.append(official);
 card.append(tag,h,desc,small,actions);out.append(card);
}
if(!places.length)out.append(element('p','subtle','No matching destinations. Clear filters to show all.'));
updatePins();
}
function nearAlternatives(){if(!parkMode)return;const box=$('siteAlternatives');if(!box)return;box.textContent='';const alt=sites.filter(p=>p.id!==here.id).map(p=>({...p,dist:miles(here,p)})).sort((a,b)=>a.dist-b.dist).slice(0,5);
for(const p of alt){const item=element('div','nextsite'),a=createAnchor(p,p.name+' →');item.append(a,element('p','',p.state+' · about '+p.dist+' miles straight line · '+typeNames[p.type]));box.append(item);}
}
function mapStatus(msg){text('mapStatus',msg);}
function updatePins(){
 if(!state.ready)return;
 state.sitesLayer.clearLayers();
 const points=parkMode?[here,...sites.filter(p=>p.id!==here.id)]:state.visible;
 for(const p of points){
  const chosen=parkMode&&p.id===here.id;
  const color=chosen?'#fac66f':p.type==='international'||p.type==='sanctuary'?'#80d7ac':p.type==='community'?'#b299f9':'#78bded';
  const pin=L.circleMarker([p.lat,p.lon],{radius:chosen?11:7,color:'#fff',weight:chosen?2.5:1,fillColor:color,fillOpacity:1});
  const popup=element('div');const title=element('strong','',p.name+' · '+p.state),desc=element('p','',typeNames[p.type]+'. '+(p.approximateLocation?'Regional reference, not an entrance.':'Location reference; confirm entrance on the official site.'));
  const a=createAnchor(p,'Open park planner →');popup.append(title,desc,a);
  pin.bindPopup(popup,{maxWidth:260}).addTo(state.sitesLayer);
 }
 state.focusLayer.clearLayers();
 if(state.user)L.circleMarker([state.user.lat,state.user.lon],{radius:7,color:'#fff',weight:2,fillColor:'#ffda8c',fillOpacity:1}).bindPopup('Approximate device location; not stored or used as a public viewing place').addTo(state.focusLayer);
 if(parkMode){if(state.user)state.map.fitBounds([[here.lat,here.lon],[state.user.lat,state.user.lon]],{padding:[38,38],maxZoom:9});else state.map.setView([here.lat,here.lon],8);}
 else if(points.length){const bounds=L.latLngBounds(points.map(p=>[p.lat,p.lon]));state.map.fitBounds(bounds,{padding:[35,35],maxZoom:9});}
}
function fallbackMap(){mapStatus('CARTO unavailable here. OpenStreetMap fallback active; destination links and forecasts remain available.');loadTiles('https://tile.openstreetmap.org/{z}/{x}/{y}.png',false);}
function loadTiles(url,carto){
 if(!state.map)return;if(state.tiles)state.map.removeLayer(state.tiles);
 let errs=0,loaded=0;const layer=L.tileLayer(url,{subdomains:carto?'a':'abc',maxZoom:18,keepBuffer:1,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'+(carto?' &copy; <a href="https://carto.com/attributions">CARTO</a>':'')});
 layer.on('tileload',()=>{loaded++;if(carto)mapStatus('CARTO Voyager basemap loaded. Map pins indicate destination areas, not certified parking or entrances.');});
 layer.on('tileerror',()=>{errs++;if(errs>=3&&carto&&state.tiles===layer)fallbackMap();else if(errs>=3&&!carto&&!loaded)mapStatus('Map tiles unavailable. The linked park directory remains available.');});
 state.tiles=layer;layer.addTo(state.map);
}
function initMap(){
 if(!$('darkSkyMap'))return;
 if(typeof L==='undefined'){mapStatus('Map library could not load. All destinations are available in the linked list.');return;}
 try{state.map=L.map('darkSkyMap',{scrollWheelZoom:false,zoomControl:true});state.sitesLayer=L.layerGroup().addTo(state.map);state.focusLayer=L.layerGroup().addTo(state.map);state.ready=true;updatePins();L.control.scale({imperial:true,metric:false}).addTo(state.map);}catch(e){mapStatus('Map unavailable; use the destination links instead.');return;}
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7000);
 fetch('/api/carto-basemap-config',{headers:{Accept:'application/json'},signal:controller.signal}).then(r=>{if(!r.ok)throw Error('CARTO config inaccessible');return r.json();})
 .then(c=>{if(c?.provider!=='CARTO'||typeof c.key!=='string'||!c.key.trim())throw Error('Missing public CARTO key');loadTiles('https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key='+encodeURIComponent(c.key.trim()),true);mapStatus('Connecting to the CARTO Voyager basemap…');})
 .catch(fallbackMap).finally(()=>clearTimeout(timeout));
}
function forecastURL(p){return p.country==='CA'?'/national-tools/dark-sky/_api/forecast?site='+encodeURIComponent(p.id):'/national-tools/meteor-shower/_api/live?lat='+encodeURIComponent(p.lat)+'&lon='+encodeURIComponent(p.lon)+'&radius=0';}
async function forecast(p){
 const key=(p.country||'US')+':'+(p.id||'device')+':'+p.lat.toFixed(2)+','+p.lon.toFixed(2);if(cache.has(key))return cache.get(key);
 const promise=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),13000);try{
 const response=await fetch(forecastURL(p),{headers:{Accept:'application/json'},signal:controller.signal});
 const body=await response.json();if(!response.ok||body.status!=='ok')throw Error(body.error||'Verified sky forecast unavailable');
 return body;
 }finally{clearTimeout(timer);}})();
 cache.set(key,promise);
 try{return await promise;}catch(e){cache.delete(key);throw e;}
}
function explainHour(h,tz){return when(h.time,tz)+' · '+(h.score===null?'No verified score':h.score+'/100 relative observing index')+' · '+(h.cloud===null?'Cloud coverage unavailable':h.cloud+'% predicted cloud cover')+' · Moon '+h.moonIllum+'% illuminated'+(h.moonUp?' above':' below')+' horizon'+(h.radiantAlt===null?'':' · shower radiant ~'+h.radiantAlt+'° high')+'. This is not a meteor count or a visibility guarantee.';}
function showHours(hours,tz){const timeline=$('parkTimeline');if(!timeline)return;timeline.textContent='';const dark=hours.filter(h=>h.sky!=='bright');if(!dark.length){timeline.textContent='No verifiable nighttime hours in this outlook.';return;}
 for(const h of dark){
  const button=element('button','hour');button.type='button';button.title=explainHour(h,tz);
  const bar=element('span','bar'+(h.sky==='twilight'?' dim':''));bar.style.height=(h.score===null?4:Math.max(5,h.score*1.28))+'px';
  const n=element('b','',h.score===null?'—':h.score);const t=element('time','',short(h.time,tz));t.dateTime=h.time;
  button.append(n,bar,t);button.setAttribute('aria-label',explainHour(h,tz));button.addEventListener('click',()=>text('parkHourDetail',explainHour(h,tz)));
  timeline.append(button);
 }}
function verdict(score){if(score>=65)return{label:'A more promising viewing window',klass:'decision'};if(score>=35)return{label:'Possible, with compromises',klass:'decision caution'};return{label:'Limited viewing conditions',klass:'decision muted'};}
async function parkForecast(){
 if(!here)return;const container=$('parkDecision');if(!container)return;
 text('parkForecastStatus','Requesting fresh hourly cloud-cover and astronomical conditions…');
 try{
  const d=await forecast(here),f=d.forecast||{},tz=f.timeZone||'America/Detroit',near=f.nearTerm,best=f.best;
  if(near&&near.score!==null){const v=verdict(near.score);text('parkVerdict',v.label);container.className=v.klass;
   text('parkReason',when(near.time,tz)+' is the best verified dark hour in the next 18 hours: '+near.score+'/100 index with '+near.cloud+'% forecast clouds. '+(near.score>=65?'Sky conditions may justify planning, but access remains unverified.':'A darker park alone cannot overcome adverse cloud or moon conditions.')+' The index is not an expected meteor count.');
  }else{text('parkVerdict','No verified near-term dark viewing window');text('parkReason','No adequately dark hour with current cloud forecast data could be scored in the next 18 hours. Check the 72-hour outlook.');}
  text('parkTonight',near?.score==null?'Unavailable':near.score+'/100');
  text('parkBest',best?when(best.time,tz)+' · '+best.score+'/100':'No scored window');
  text('parkShower',d.primary?d.primary.name+' active · ideal peak ZHR '+d.primary.idealPeakZhr+' (not local counts)':'No major shower active; sporadic meteors remain possible.');
  const weatherProvider=here.country==='CA'?'MET Norway Locationforecast global model (CC BY 4.0)':'National Weather Service sky-cover grid';
  text('parkForecastStatus',weatherProvider+' · updated '+(f.updated?when(f.updated,tz):'unknown')+' · checked '+when(d.generatedAt,tz)+'. This is a modeled relative viewing index; different weather providers are not directly calibrated. Access not verified.');
  showHours(f.hours||[],tz);if(best)text('parkHourDetail','Best 72-hour period: '+explainHour(best,tz));
 }catch(e){text('parkVerdict','Viewing forecast unavailable');text('parkReason','No fresh and complete cloud-cover forecast was returned for this park. Do not infer a clear or safe viewing night.');text('parkForecastStatus','Forecast unavailable. Recheck later or consult the park operator and '+(here.country==='CA'?'Environment Canada':'NWS')+' for local weather.');text('parkBest','Unavailable');text('parkTonight','Unavailable');text('parkShower','Seasonal meteor shower information: see the national tracker.');$('parkTimeline').textContent='No verified hourly score.';}
}
async function compareHub(){
 const box=$('compareResults');if(!box)return;if(state.comparing)return;
 const candidates=visibleSites().slice(0,4);
 if(!candidates.length){box.textContent='Select destinations to compare viewing forecasts.';return;}
 state.comparing=true;text('compareStatus','Checking up to four selected park reference coordinates; U.S. and Canadian forecasts use different weather providers.');
 box.textContent='';const results=await Promise.all(candidates.map(async p=>{try{return {p,d:await forecast(p)};}catch{return{p,d:null};}}));
 // Do not present cross-model scores as an apples-to-apples ranking.
 results.sort((a,b)=>a.p.country.localeCompare(b.p.country)||(b.d?.forecast?.nearTerm?.score??-1)-(a.d?.forecast?.nearTerm?.score??-1));
 for(const {p,d} of results){
  const hour=d?.forecast?.nearTerm,card=element('div','nextsite');const a=createAnchor(p,p.name+' →');const provider=p.country==='CA'?'MET Norway model':'NWS grid';const desc=element('p','',provider+' · '+(hour?hour.score+'/100 near-term index · '+hour.cloud+'% clouds · '+when(hour.time,d.forecast.timeZone):'Forecast unavailable'));
  card.append(a,desc,element('p','subtle','Access unverified. Weather index does not rank legal park entry.'));box.append(card);
 }
 text('compareStatus','Comparison complete · next 18 hours. Different NWS and MET Norway models must not be treated as a cross-border quality ranking; verify conditions and park access separately.');
 state.comparing=false;
}
function useLocation(){
 const status=parkMode?'myLocationStatus':'locationStatus';
 if(!navigator.geolocation){text(status,'Device location unavailable. Use the destination directory instead.');return;}
 text(status,'Requesting location permission…');navigator.geolocation.getCurrentPosition(pos=>{
  const a={lat:Math.round(pos.coords.latitude*100)/100,lon:Math.round(pos.coords.longitude*100)/100};
  if(!Number.isFinite(a.lat)||!Number.isFinite(a.lon)){text(status,'Location coordinates unavailable.');return;}
  state.user=a;text(status,'Approximate location enabled. Distances are straight-line; coordinates are not stored.');
  if(parkMode){text('tripDistance',distanceNote(here)+' (not driving distance)');updatePins();}else{renderSiteCards();}
 },()=>text(status,'Location not shared. You can continue using the atlas without it.'),{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
}
async function compareMySky(){
 if(!parkMode)return;
 if(!state.user){text('myComparison','Use my location first, then run the comparison.');return;}
 if(here.country!=='US'){text('myComparison','A park-versus-home numerical comparison is not available across different forecast products. The park forecast and official local weather are available above.');return;}
 const out=$('myComparison');out.textContent='Checking your approximate location…';
 try{
 const [home,away]=await Promise.all([forecast({...state.user,country:'US'}),forecast(here)]);
 const a=home.forecast?.nearTerm,b=away.forecast?.nearTerm;
 if(a?.score==null||b?.score==null){out.textContent='Comparable near-term forecasts are incomplete. No advantage can be calculated.';return;}
 const diff=b.score-a.score;
 out.textContent='Your location: '+a.score+'/100 near-term index; park: '+b.score+'/100. '+(diff>0?'Park weather scores '+diff+' points higher.':diff<0?'Your local sky scores '+Math.abs(diff)+' points higher.':'Scores are equal.')+' Each is its own best hour within 18 hours; times may differ. This comparison does not include actual local light pollution or open gates.';
 }catch{out.textContent='Cannot compare both current forecast points. No location advantage is assumed.';}
}
function wire(){
 $('myLocation')?.addEventListener('click',()=>{useLocation();});
 $('compareMySky')?.addEventListener('click',compareMySky);
 $('compare4')?.addEventListener('click',compareHub);
 for(const id of ['region','designation','searchSites'])$(id)?.addEventListener(id==='searchSites'?'input':'change',renderSiteCards);
 $('showAll')?.addEventListener('click',()=>{if($('region'))$('region').value='all';if($('designation'))$('designation').value='all';if($('searchSites'))$('searchSites').value='';renderSiteCards();});
}
wire();renderSiteCards();nearAlternatives();initMap();parkForecast();
})();
