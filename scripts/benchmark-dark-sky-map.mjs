import fs from 'node:fs';
const get=p=>fs.readFileSync(p,'utf8');
const inspector=get('public/assets/dark-sky-map-inspector.js'),css=get('public/assets/dark-sky-map-inspector.css'),meteor=get('public/national-tools/meteor-shower/index.html'),explorer=get('public/assets/great-lakes-dark-sky.js'),parks=JSON.parse(get('data/great-lakes-dark-sky.json')).places,index=get('public/national-tools/dark-sky/index.html');
const checks=[
 {id:'clipping',weight:30,pass:css.includes('max-width:100%')&&css.includes('overflow-wrap:anywhere')&&css.includes('grid-template-columns:1fr')&&css.includes('top:9px;right:9px;left:auto;bottom:auto')&&!meteor.includes('.bindPopup(')&&!explorer.includes('.bindPopup(')},
 {id:'touch',weight:20,pass:css.includes('min-height:44px')&&meteor.includes('iconSize:[44,44]')&&explorer.includes('iconSize:[44,44]')},
 {id:'map-jump',weight:20,pass:meteor.includes('skyInspector.selectPark(p)')&&explorer.includes('state.inspector.selectPark(p)')&&!inspector.includes('.setView(')&&!inspector.includes('.fitBounds(')&&!inspector.includes('.flyTo(')},
 {id:'links',weight:15,pass:parks.length===24&&parks.every(p=>p.source?.startsWith('https://')&&p.slug)&&inspector.includes('encodeURIComponent(p.slug||p.id)')&&inspector.includes('noopener noreferrer')&&inspector.includes('getMapsUrl')},
 {id:'accessibility',weight:10,pass:inspector.includes("setAttribute('role','region')")&&inspector.includes('aria-labelledby')&&inspector.includes('aria-live')&&inspector.includes('Close destination details')&&css.includes(':focus-visible')},
 {id:'state',weight:5,pass:inspector.includes('Only one destination inspector per map')&&inspector.includes('actions.replaceChildren()')&&inspector.includes('get selectedId()')&&index.includes('dark-sky-map-inspector.js')}
];
const loss=checks.reduce((acc,c)=>acc+(c.pass?0:c.weight),0);
const outcome={benchmark:'Great Lakes map inspector',destinations:parks.length,maps:2,sampleWidths:[320,360,390,768,1280],contractLoss:loss,maxLoss:100,failedCriteria:checks.filter(c=>!c.pass).map(c=>c.id),status:loss===0?'PASS automated structural gates; visual QA still required':'FAIL automated structural gate'};
console.log(JSON.stringify(outcome,null,2));
if(loss!==0)process.exitCode=1;
