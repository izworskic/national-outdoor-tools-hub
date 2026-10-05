import fs from 'node:fs';

const file = process.env.NATIONAL_TOOLS_DIRECTORY_FILE || 'public/national-tools/index.html';
const canonical = 'https://chrisizworski.com/chesapeake-bay-bridge-maryland/';
const toolId = 'maryland-bay-bridge';
let html = fs.readFileSync(file, 'utf8');

if (!html.includes(`data-tool-id="${toolId}"`)) {
  const cbbt = '<article class="directory-card" data-search-card data-tool-id="cbbt"';
  const at = html.indexOf(cbbt);
  if (at < 0) throw new Error('Maryland Bay Bridge: CBBT directory anchor missing');
  const card = `<article class="directory-card" data-search-card data-tool-id="${toolId}" data-personas="trip conditions" data-tags="maryland chesapeake bay bridge us 50 301 annapolis eastern shore toll wind restrictions traffic cameras mdta chart mid atlantic appalachia" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">Live bridge crossing decision</span><span class="season-label" hidden>Useful now</span></div><h3>Maryland Chesapeake Bay Bridge Live</h3><p class="place">Maryland · Chesapeake Bay</p><p class="description">Check MDTA wind restrictions, live approach traffic, official CHART cameras, vehicle rules, planned work and eastbound tolls before crossing US 50/301.</p><p class="signals"><strong>Signals:</strong> MDTA operational rules + Maryland CHART + NWS weather context</p><div class="card-actions"><a class="primary-action" href="${canonical}">Open Maryland Bay Bridge Live →</a></div></article>\n`;
  html = html.slice(0, at) + card + html.slice(at);
}

const orderedCards = [...html.matchAll(/<article class="directory-card"[\s\S]*?<\/article>/g)].map(match => match[0]);
const directoryEntries = orderedCards.map((card, index) => {
  const url = card.match(/<a class="primary-action" href="([^"]+)"/)?.[1];
  const name = card.match(/<h3>([\s\S]*?)<\/h3>/)?.[1]?.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&');
  if (!url || !name) throw new Error('Maryland Bay Bridge: directory card missing primary URL or name');
  return {'@type':'ListItem', position:index + 1, url:new URL(url, 'https://chrisizworski.com').href, name};
});
if (new Set(directoryEntries.map(item => item.url)).size !== directoryEntries.length) {
  throw new Error('Maryland Bay Bridge: duplicate directory canonical after injection');
}

const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!schemaMatch) throw new Error('Maryland Bay Bridge: national directory JSON-LD missing');
const schema = JSON.parse(schemaMatch[1]);
const graph = schema?.['@graph'];
const list = graph?.find(node => node?.['@id'] === 'https://chrisizworski.com/national-tools/#toollist');
if (!list) throw new Error('Maryland Bay Bridge: national ItemList missing');
list.itemListElement = directoryEntries;
list.numberOfItems = directoryEntries.length;
const page = graph?.find(node => node?.['@id'] === 'https://chrisizworski.com/national-tools/#page');
if (page) page.dateModified = '2026-10-05';
html = html.replace(schemaMatch[0], `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

const count = orderedCards.length;
html = html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/, `$1${count} tools shown$2`);

if (!html.includes(`data-tool-id="${toolId}"`) || !html.includes(canonical)) {
  throw new Error('Maryland Bay Bridge: directory injection verification failed');
}
if (!list.itemListElement.some(item => item.url === canonical)) {
  throw new Error('Maryland Bay Bridge: structured directory entry missing');
}

fs.writeFileSync(file, html, 'utf8');
console.log(`Maryland Bay Bridge added to National Tools | cards=${count}`);
