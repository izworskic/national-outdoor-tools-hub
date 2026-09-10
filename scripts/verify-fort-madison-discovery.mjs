import fs from 'node:fs';

const landing=fs.readFileSync('public/national-tools/index.html','utf8');
const water=fs.readFileSync('public/national-tools/water/index.html','utf8');
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const url='https://chrisizworski.com/national-tools/fort-madison-live/';
const upstream='https://fort-madison-live.vercel.app/';

const failures=[];
const occurrences=(landing.match(/fort-madison-live/g)||[]).length;
if(occurrences<4) failures.push(`expected Fort Madison on multiple landing surfaces, found ${occurrences} references`);
if(!landing.includes('Fort Madison Live: Trains, Barges &amp; Swing Bridge Openings')) failures.push('library card missing');
if(!landing.includes('See what reaches Fort Madison next')) failures.push('decision-intent link missing');
if(!water.includes(url)) failures.push('water hub card missing');

const schemaMatch=landing.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if(!schemaMatch) failures.push('landing structured data missing');
else {
  try {
    const data=JSON.parse(schemaMatch[1]);
    const list=data?.['@graph']?.find(x=>x?.['@id']==='https://chrisizworski.com/national-tools/#toollist');
    if(!list?.itemListElement?.some(x=>x?.url===url)) failures.push('Fort Madison missing from ItemList structured data');
    if(list?.numberOfItems!==list?.itemListElement?.length) failures.push('ItemList numberOfItems mismatch');
  } catch { failures.push('landing structured data is invalid JSON'); }
}

const rewrites=vercel.rewrites||[];
if(!rewrites.some(x=>x.source==='/national-tools/fort-madison-live/'&&x.destination===upstream)) failures.push('Fort Madison root rewrite missing');
if(!rewrites.some(x=>x.source==='/national-tools/fort-madison-live/:path*'&&x.destination==='https://fort-madison-live.vercel.app/:path*')) failures.push('Fort Madison catch-all rewrite missing');

if(failures.length){
  console.error('Fort Madison national discovery verification failed:');
  for(const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Fort Madison national discovery verified.');
