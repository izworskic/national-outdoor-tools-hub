/* Shared, map-independent inspector for Meteor Shower and Dark Sky Explorer.
   Deliberately does not use Leaflet Popup: never pans a map, clips a map edge,
   or depends on Leaflet's popup styling being loaded from a third-party CDN. */
(function(window,document){
'use strict';
function make(tag,cls,value){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(value!==undefined)el.textContent=String(value);
 return el;
}
function externalLink(text,url){
 if(!/^https:\/\//.test(String(url||'')))return null;
 const a=make('a','sky-inspector-action',text);
 a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function mount(opts){
 const map=document.getElementById(opts.mapId);
 if(!map)throw Error('Dark sky map missing: '+opts.mapId);
 const id=opts.mapId+'-inspector';
 const existing=document.getElementById(id);
 if(existing)throw Error('Only one destination inspector per map');
 const box=make('section','sky-inspector');box.id=id;box.hidden=true;
 box.setAttribute('role','region');box.setAttribute('aria-labelledby',id+'-title');
 const header=make('div','sky-inspector-head');
 const titles=make('div','sky-inspector-titles');
 const eyebrow=make('span','sky-inspector-eyebrow','SELECTED MAP DESTINATION');
 const title=make('h3','sky-inspector-title','');title.id=id+'-title';
 titles.append(eyebrow,title);
 const close=make('button','sky-inspector-close','Close details ×');close.type='button';close.setAttribute('aria-label','Close destination details');
 header.append(titles,close);
 const designation=make('p','sky-inspector-designation');
 const note=make('p','sky-inspector-summary');
 const access=make('p','sky-inspector-access');
 const actions=make('div','sky-inspector-actions');actions.setAttribute('aria-label','Destination links');
 box.append(header,designation,note,access,actions);
 map.insertAdjacentElement('afterend',box);
 // Immediate visible feedback without a huge popup covering the cartography.
 const toast=make('div','sky-inspector-toast');toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
 map.appendChild(toast);
 let selectedId=null;
 function clear(){
  box.hidden=true;toast.hidden=true;selectedId=null;actions.replaceChildren();
 }
 close.addEventListener('click',clear);
 function begin(idValue,name,label,summary,warning){
  selectedId=idValue;
  box.hidden=false;toast.hidden=false;title.textContent=name;
  designation.textContent=label;note.textContent=summary;access.textContent=warning;
  toast.textContent=name+' selected · Details and links below map ↓';
  actions.replaceChildren();
 }
 function appendExternal(label,url){
  const a=externalLink(label,url);if(a)actions.appendChild(a);
 }
 function selectPark(p){
  const isRegional=!!p.approximateLocation||p.type==='community';
  const desc=typeof opts.getDesignation==='function'?opts.getDesignation(p):p.type;
  const accessNote=p.access||'Check the park operator for current access and opening rules.';
  const caution=isRegional
   ?'Regional reference only — NOT a verified entrance, parking area or safe viewing route. '+accessNote
   :'Park-area reference, NOT verified parking or a legal nighttime entrance. '+accessNote;
  begin(String(p.id||p.slug),p.name,desc+' · '+p.state,p.note||p.intro||'',caution);
  const planner=make('a','sky-inspector-action sky-inspector-primary','Open park viewing planner →');
  planner.href='/national-tools/dark-sky/'+encodeURIComponent(p.slug||p.id)+'/';
  actions.appendChild(planner);
  appendExternal('Official park information ↗',p.source||p.url);
  if(typeof opts.getMapsUrl==='function'){
   appendExternal(isRegional?'Find legal access on Google Maps ↗':'Google Maps directions ↗',opts.getMapsUrl(p));
  }
  if(typeof opts.onForecast==='function'&&p.country!=='CA'&&p.state!=='ON'){
   const b=make('button','sky-inspector-action sky-inspector-secondary','Use this park for my meteor forecast');
   b.type='button';b.addEventListener('click',()=>opts.onForecast(p));actions.appendChild(b);
  }
  return selectedId;
 }
 function showNotice(name,message){
  begin('sample',name,'Forecast sample · Not a park destination',message,'These coordinates are weather samples, not verified public viewing locations. Use a named park marker for visitor details and directions.');
  return selectedId;
 }
 return {selectPark,showNotice,clear,get selectedId(){return selectedId;},element:box};
}
window.DarkSkyMapInspector={mount};
})(window,document);
