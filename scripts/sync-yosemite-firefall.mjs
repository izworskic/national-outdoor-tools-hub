import fs from 'node:fs';

const file = 'public/national-tools/index.html';
let html = fs.readFileSync(file, 'utf8');

const toolPath = '/national-tools/yosemite-firefall-live/';
const toolUrl = 'https://chrisizworski.com/national-tools/yosemite-firefall-live/';
const oldUrl = 'https://yosemite-firefall-live.vercel.app/';
const toolName = 'Yosemite Firefall Live';
const toolId = 'yosemite-firefall';

html = html.replace(`href="${oldUrl}"`, `href="${toolPath}"`);

if (!html.includes(`data-tool-id="${toolId}"`)) {
  const card = `<article class="directory-card" data-search-card data-tool-id="${toolId}" data-personas="trip event conditions" data-tags="yosemite california firefall horsetail fall el capitan waterfall sunset photography snowmelt clouds" data-months="2"><div class="card-top"><span class="kind">Live seasonal viewing intelligence</span><span class="season-label" hidden>In season now</span></div><h3>${toolName}</h3><p class="place">Yosemite National Park · California</p><p class="description">Decide whether Horsetail Fall is worth attempting, when the strongest glow window occurs, how the source-water signal looks, whether the western sun corridor is open and which upcoming night gives a trip the best odds.</p><p class="signals"><strong>Signals:</strong> NWS forecast + GOES-18 cloud mask + CDEC snow water + USGS basin context + solar geometry + NPS access</p><div class="card-actions"><a class="primary-action" href="${toolPath}">Yosemite Firefall forecast and best viewing night &rarr;</a></div></article>\n`;
  const anchor = '<article class="directory-card" data-search-card data-tool-id="blue-spring"';
  const at = html.indexOf(anchor);
  if (at < 0) throw new Error('Yosemite insertion anchor not found');
  html = html.slice(0, at) + card + html.slice(at);
}

const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!schemaMatch) throw new Error('National ItemList schema missing');
const schema = JSON.parse(schemaMatch[1]);
const list = schema?.['@graph']?.find(item => item?.['@id'] === 'https://chrisizworski.com/national-tools/#toollist');
if (!list) throw new Error('National ItemList missing');
let yosemite = list.itemListElement.find(item => item.name === toolName || item.url === oldUrl || item.url === toolUrl);
if (!yosemite) {
  yosemite = { '@type': 'ListItem', position: list.itemListElement.length + 1, url: toolUrl, name: toolName };
  list.itemListElement.push(yosemite);
} else {
  yosemite.url = toolUrl;
  yosemite.name = toolName;
}
list.itemListElement.forEach((item, index) => { item.position = index + 1; });
list.numberOfItems = list.itemListElement.length;
const collection = schema?.['@graph']?.find(item => item?.['@id'] === 'https://chrisizworski.com/national-tools/#page');
if (collection) collection.dateModified = '2026-09-11';
html = html.replace(schemaMatch[0], `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

const visibleCards = [...html.matchAll(/data-tool-id="([^"]+)"/g)].length;
html = html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/, `$1${visibleCards} tools shown$2`);

fs.writeFileSync(file, html);
console.log(`National directory synced: ${toolName} | visibleCards=${visibleCards} | structuredTools=${list.numberOfItems}`);
