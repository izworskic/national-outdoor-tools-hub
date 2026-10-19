'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const inspectorJS=fs.readFileSync('public/assets/dark-sky-map-inspector.js','utf8');
const inspectorCSS=fs.readFileSync('public/assets/dark-sky-map-inspector.css','utf8');
const parks=JSON.parse(fs.readFileSync('data/great-lakes-dark-sky.json','utf8')).places;
const meteor=fs.readFileSync('public/national-tools/meteor-shower/index.html','utf8');
const explorer=fs.readFileSync('public/assets/great-lakes-dark-sky.js','utf8');
function fixture(){
 const elements=new Map();
 class Element{
  constructor(tag){this.tagName=tag;this.id='';this.className='';this.href='';this.hidden=false;this.attributes={};this.children=[];this.listeners={};this._text='';}
  set textContent(v){this._text=String(v);this.children=[];}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  append(...nodes){this.children.push(...nodes);}
  appendChild(node){this.children.push(node);return node;}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(name,val){this.attributes[name]=String(val);}
  getAttribute(name){return this.attributes[name];}
  addEventListener(name,handler){this.listeners[name]=handler;}
  click(){this.listeners.click?.();}
  insertAdjacentElement(position,node){assert.equal(position,'afterend');elements.set(node.id,node);this.nextSibling=node;}
 }
 const document={getElementById:id=>elements.get(id)||null,createElement:tag=>new Element(tag)};
 for(const id of ['map','darkSkyMap']){const map=new Element('div');map.id=id;elements.set(id,map);}
 const window={};vm.runInNewContext(inspectorJS,{window,document});
 return {window,document,elements};
}
function allChildren(node){return [node,...(node.children||[]).flatMap(allChildren)];}
function actions(panel){return allChildren(panel).filter(x=>x.tagName==='a'||x.tagName==='button');}
test('One shared inspector instance per map and semantic close control',()=>{
 const {window,document}=fixture();
 const mounted=window.DarkSkyMapInspector.mount({mapId:'map',getDesignation:p=>p.type,getMapsUrl:()=> 'https://www.google.com/maps/search/?api=1&query=Headlands'});
 const el=document.getElementById('map-inspector');
 assert.equal(el.hidden,true);
 assert.equal(el.getAttribute('role'),'region');
 assert.equal(el.getAttribute('aria-labelledby'),'map-inspector-title');
 assert.throws(()=>window.DarkSkyMapInspector.mount({mapId:'map'}),/Only one/);
 mounted.selectPark(parks[0]);assert.equal(el.hidden,false);assert.equal(mounted.selectedId,parks[0].id);
 const close=actions(el).find(x=>x.getAttribute('aria-label')==='Close destination details');
 assert.ok(close);close.click();assert.equal(el.hidden,true);assert.equal(mounted.selectedId,null);
});
test('All 24 park destinations have safe links, no coordinate routing and one detail panel',()=>{
 const {window,document}=fixture();
 const maps=p=>p.approximateLocation?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.name):'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(p.name);
 const selected=[];
 const inspector=window.DarkSkyMapInspector.mount({mapId:'map',getDesignation:p=>p.type,getMapsUrl:maps,onForecast:p=>selected.push(p.id)});
 for(const p of parks){
  inspector.selectPark(p);
  const panel=document.getElementById('map-inspector'),nodes=actions(panel);
  const anchors=nodes.filter(x=>x.tagName==='a'),buttons=nodes.filter(x=>x.tagName==='button');
  assert.equal(inspector.selectedId,p.id);
  assert.ok(panel.textContent.includes(p.name),p.id);
  assert.ok(panel.textContent.includes(p.access),p.id);
  assert.ok(anchors.some(x=>x.href==='/national-tools/dark-sky/'+p.slug+'/'),p.id);
  assert.ok(anchors.some(x=>x.href===p.source),p.id);
  assert.ok(anchors.every(x=>x.href.startsWith('/')||x.href.startsWith('https://')),p.id);
  assert.ok(anchors.filter(x=>x.href.startsWith('https://')).every(x=>x.target==='_blank'&&x.rel==='noopener noreferrer'),p.id);
  const map=anchors.find(x=>x.href.startsWith('https://www.google.com/maps/'));
  assert.ok(map,p.id);
  assert.match(map.href,p.approximateLocation?/\/maps\/search\//:/\/maps\/dir\//,p.id);
  assert.ok(!map.href.includes(String(p.lat)),p.id+' routes by name, never arbitrary weather coordinate');
  assert.equal(buttons.some(x=>x.textContent==='Use this park for my meteor forecast'),p.country==='US',p.id);
 }
 inspector.selectPark(parks[0]);actions(document.getElementById('map-inspector')).find(x=>x.textContent==='Use this park for my meteor forecast').click();
 assert.equal(selected.at(-1),parks[0].id);
});
test('Forecast sample notice has no stale park links; selecting a new park replaces previous',()=>{
 const {window,document}=fixture();
 const m=window.DarkSkyMapInspector.mount({mapId:'darkSkyMap',getDesignation:p=>p.type,getMapsUrl:()=> 'https://www.google.com/maps/search/?api=1&query=test'});
 m.selectPark(parks[0]);m.selectPark(parks[1]);
 assert.ok(document.getElementById('darkSkyMap-inspector').textContent.includes(parks[1].name));
 assert.ok(!document.getElementById('darkSkyMap-inspector').textContent.includes(parks[0].name));
 m.showNotice('Forecast grid reference','Not a park');
 const panel=document.getElementById('darkSkyMap-inspector');
 assert.equal(m.selectedId,'sample');
 assert.equal(actions(panel).filter(x=>x.tagName==='a').length,0);
 assert.ok(panel.textContent.includes('Not a park'));
 m.clear();assert.equal(panel.hidden,true);
});
test('Both maps use the shared inspector instead of any Leaflet popup bubbles',()=>{
 assert.doesNotMatch(meteor,/\.bindPopup\(/);
 assert.doesNotMatch(explorer,/\.bindPopup\(/);
 assert.match(meteor,/dark-sky-map-inspector\.js/);
 assert.match(meteor,/dark-sky-map-inspector\.css/);
 assert.match(meteor,/skyInspector\.selectPark\(p\)/);
 assert.match(explorer,/DarkSkyMapInspector\?\.mount/);
 assert.match(explorer,/state\.inspector\.selectPark\(p\)/);
 assert.match(meteor,/get\('inspect'\)/);
 assert.match(explorer,/get\('inspect'\)/);
});
test('Mobile inspect panels meet structural clipping and target-size contracts',()=>{
 assert.match(inspectorCSS,/max-width:100%/);
 assert.match(inspectorCSS,/overflow-wrap:anywhere/);
 assert.match(inspectorCSS,/grid-template-columns:1fr/);
 assert.match(inspectorCSS,/min-height:44px/);
 assert.match(inspectorCSS,/\.sky-inspector\[hidden\]/);
 assert.match(inspectorCSS,/pointer-events:none/); // Non-interactive status strip, not a popup mask.
 assert.match(inspectorJS,/map\.insertAdjacentElement\('afterend',box\)/);
 assert.match(inspectorJS,/actions\.replaceChildren\(\)/);
 assert.match(inspectorJS,/close\.addEventListener\('click',clear\)/);
});
