import fs from 'node:fs';

const file = process.env.NATIONAL_TOOLS_DIRECTORY_FILE || 'public/national-tools/index.html';
let html = fs.readFileSync(file, 'utf8');

const cardMatches = [...html.matchAll(/<article class="directory-card"[\s\S]*?<\/article>/g)];
const cards = new Map();
for (const match of cardMatches) {
  const id = match[0].match(/data-tool-id="([^"]+)"/)?.[1];
  if (!id) continue;
  if (cards.has(id)) throw new Error(`Duplicate directory card: ${id}`);
  cards.set(id, match[0]);
}

const nationalIds = [
  'rivers', 'coastal', 'smoke', 'snow', 'aurora', 'waterfall-window', 'monarch',
  'fall-color', 'ice-out', 'white-christmas', 'frost', 'planting', 'garden-water'
];

const regions = [
  {
    id: 'northeast-great-lakes',
    name: 'Northeast & Great Lakes',
    search: 'northeast great lakes new york niagara',
    description: 'Destination intelligence for major-water trips where local weather, sun, mist and timing can change the experience.',
    ids: ['niagara-rainbow']
  },
  {
    id: 'appalachia-ohio-valley',
    name: 'Appalachia & Ohio Valley',
    search: 'appalachia appalachian ohio valley west virginia kentucky',
    description: 'Release timing and rare viewing windows across a mountain-and-river corridor built around trips that depend on the right moment.',
    ids: ['gauley', 'cumberland-moonbow']
  },
  {
    id: 'southeast',
    name: 'Southeast',
    search: 'southeast florida gulf atlantic',
    description: 'Warm-water wildlife and seasonal destination timing for trips where conditions can change the best day or hour to arrive.',
    ids: ['blue-spring']
  },
  {
    id: 'mississippi-great-plains',
    name: 'Mississippi & Great Plains',
    search: 'mississippi river great plains plains midwest nebraska iowa illinois',
    description: 'River infrastructure, rail-and-river crossings and migration events across the central corridor.',
    ids: ['melvin-price', 'fort-madison', 'platte-cranes']
  },
  {
    id: 'rockies',
    name: 'Rockies',
    search: 'rockies rocky mountains colorado mountain west',
    description: 'Wildlife timing and mountain-season decisions where daylight, weather, access and animal behavior all matter.',
    ids: ['elk-rut']
  },
  {
    id: 'california-sierra',
    name: 'California & Sierra',
    search: 'california sierra yosemite',
    description: 'Short-lived Sierra viewing events where weather, water and sun geometry determine whether the trip is worth making.',
    ids: ['yosemite-firefall']
  },
  {
    id: 'pacific-northwest',
    name: 'Pacific Northwest',
    search: 'pacific northwest pnw washington seattle puget sound columbia river',
    description: 'Locks, salmon, ships, dams and visitor timing across Puget Sound and the Columbia Basin.',
    ids: ['ballard-locks', 'grand-coulee']
  }
];

const baseIds = [
  'gauley', 'niagara-rainbow', 'cumberland-moonbow', 'blue-spring', 'ballard-locks',
  'melvin-price', 'fort-madison', 'grand-coulee', 'waterfall-window', 'rivers', 'coastal',
  'smoke', 'snow', 'aurora', 'monarch', 'platte-cranes', 'fall-color', 'ice-out',
  'white-christmas', 'frost', 'planting', 'garden-water'
];
const missingBase = baseIds.filter(id => !cards.has(id));
if (missingBase.length) throw new Error(`Directory is missing expected cards: ${missingBase.join(', ')}`);

const assignedIds = new Set([...nationalIds, ...regions.flatMap(region => region.ids)]);
const unassigned = [...cards.keys()].filter(id => !assignedIds.has(id));
if (unassigned.length) throw new Error(`New tool cards need a national or regional home: ${unassigned.join(', ')}`);

const renderCards = (ids, extraTags = '') => ids.filter(id => cards.has(id)).map(id => {
  const card = cards.get(id);
  if (!extraTags) return card;
  return card.replace(/data-tags="([^"]*)"/, (_match, tags) => `data-tags="${tags} ${extraTags}"`);
}).join('\n');

const renderRegion = region => {
  const present = region.ids.filter(id => cards.has(id));
  if (!present.length) return '';
  return `<section class="catalog-group region-cluster" data-catalog-group id="region-${region.id}" aria-labelledby="region-${region.id}-title"><div class="catalog-head"><div><p class="eyebrow">Regional collection</p><h2 id="region-${region.id}-title">${region.name}</h2></div><p>${region.description}</p></div><div class="catalog-grid">
${renderCards(present, region.search)}
</div></section>`;
};

const nationalSection = `<section class="catalog-group national-utilities" data-catalog-group aria-labelledby="national-tools-title"><div class="catalog-head"><div><p class="eyebrow">National tools</p><h2 id="national-tools-title">Use these anywhere in the U.S.</h2></div><p>These tools travel with you. Enter a place for local conditions, or follow a phenomenon that spans many states.</p></div><div class="catalog-grid">
${renderCards(nationalIds)}
</div></section>`;

const visibleRegions = regions.filter(region => region.ids.some(id => cards.has(id)));
const regionalSection = `<section class="regional-collections" data-catalog-group aria-labelledby="regional-tools-title"><div class="catalog-head"><div><p class="eyebrow">Regional collections</p><h2 id="regional-tools-title">Start with where you're going.</h2></div><p>Destination tools stay regional because the useful signals, trip decisions and nearby opportunities are different from one part of the country to another.</p></div>
${visibleRegions.map(renderRegion).join('\n')}
</section>`;

const catalogStart = html.indexOf('<section class="catalog-group" data-catalog-group aria-labelledby="destinations-title">');
const catalogEnd = html.indexOf('<p class="empty" id="no-results">', catalogStart);
if (catalogStart < 0 || catalogEnd < 0) throw new Error('Existing catalog block markers were not found');
html = html.slice(0, catalogStart) + nationalSection + '\n\n' + regionalSection + '\n\n' + html.slice(catalogEnd);

html = html.replace(
  '<p class="hero-lede">Start with what you want to do. Every result opens the focused tool that owns that decision, its live sources and its limits.</p>',
  '<p class="hero-lede">Some tools work anywhere in the country. Others are built around a specific place. Start with the decision you need, or browse by region.</p>'
);
html = html.replace(
  '<p class="hero-note"><strong>The directory is the front door.</strong>It helps you choose; it does not blend river, sky, wildlife, air and garden data into one vague score.</p>',
  '<p class="hero-note"><strong>National when it should be. Regional when it matters.</strong>Use nationwide tools for conditions and seasonal timing; use regional collections for destination-specific decisions.</p>'
);
html = html.replace(
  '<p class="finder-hint">These choices filter one catalog. A tool is listed once, even when it helps more than one kind of visitor.</p>',
  '<p class="finder-hint">Filter every tool by intent, then browse national tools or the regional collection that fits your trip. Each tool is still listed once.</p>'
);
html = html.replace(
  'placeholder="Search by place, activity or signal — for example Gauley, manatee, smoke or frost"',
  'placeholder="Search by place, region, activity or signal — for example Rockies, Gauley, smoke or frost"'
);

const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!schemaMatch) throw new Error('National directory JSON-LD missing');
const schema = JSON.parse(schemaMatch[1]);
const collection = schema?.['@graph']?.find(item => item?.['@id'] === 'https://chrisizworski.com/national-tools/#page');
if (collection) {
  collection.description = 'A directory of U.S.-wide outdoor utilities and regional destination intelligence tools, organized by decision and geography.';
  collection.dateModified = '2026-09-12';
}
const list = schema?.['@graph']?.find(item => item?.['@id'] === 'https://chrisizworski.com/national-tools/#toollist');
if (list) list.name = 'U.S. Outdoor Tools: National Utilities and Regional Collections';
html = html.replace(schemaMatch[0], `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

html = html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/, `$1${cards.size} tools shown$2`);

fs.writeFileSync(file, html, 'utf8');
console.log(`National directory organized | cards=${cards.size} | regions=${visibleRegions.length}`);
