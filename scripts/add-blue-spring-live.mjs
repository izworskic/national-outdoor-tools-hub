import fs from 'node:fs';

const file = 'public/national-tools/index.html';
const url = 'https://chrisizworski.com/national-tools/blue-spring-live/';
const name = 'Blue Spring Live: Manatee Conditions & Best Time to Visit';
let html = fs.readFileSync(file, 'utf8');
let changed = false;

const schemaRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let match;
while ((match = schemaRe.exec(html))) {
  try {
    const data = JSON.parse(match[1]);
    const graph = data?.['@graph'];
    if (!Array.isArray(graph)) continue;
    const list = graph.find(x => x?.['@id'] === 'https://chrisizworski.com/national-tools/#toollist');
    if (!list?.itemListElement) continue;
    const prior = list.itemListElement.find(x => /blue-spring-live/.test(String(x?.url || '')));
    if (prior) {
      prior.url = url;
      prior.name = name;
    } else {
      list.itemListElement.push({ '@type':'ListItem', position:list.itemListElement.length + 1, url, name });
    }
    list.itemListElement.forEach((x,i) => x.position = i + 1);
    list.numberOfItems = list.itemListElement.length;
    const page = graph.find(x => x?.['@id'] === 'https://chrisizworski.com/national-tools/#page');
    if (page) page.dateModified = '2026-09-09';
    const replacement = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    html = html.slice(0, match.index) + replacement + html.slice(match.index + match[0].length);
    changed = true;
    break;
  } catch {}
}

if (!html.includes(`data-blue-spring-intent="true"`)) {
  const niagara = '<li><a href="/national-tools/niagara-rainbow/">Catch a Niagara Falls rainbow<span>See the current daylight opportunity, best upcoming windows and where to look</span></a></li>';
  if (!html.includes(niagara)) throw new Error('Blue Spring discovery: Niagara water-intent anchor missing');
  const item = `<li><a href="${url}" data-blue-spring-intent="true">Time a Blue Spring manatee visit<span>Live spring and river temperatures, manatee outlook, weather, park access and arrival plan</span></a></li>`;
  html = html.replace(niagara, `${niagara}${item}`);
  changed = true;
}

if (!html.includes('data-blue-spring-feature="true"')) {
  const anchor = '<section class="featured-tools"';
  const sectionStart = html.indexOf(anchor);
  if (sectionStart < 0) throw new Error('Blue Spring discovery: featured tools section missing');
  const gridStart = html.indexOf('<div class="feature-grid">', sectionStart);
  if (gridStart < 0) throw new Error('Blue Spring discovery: featured grid missing');
  const insertAt = gridStart + '<div class="feature-grid">'.length;
  const feature = `<article class="feature-card" data-blue-spring-feature="true" data-tags="water manatee wildlife florida spring river park travel destination winter swimming" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="feature-kicker">Blue Spring State Park · Florida</div><h3><a href="${url}">Blue Spring Live</a></h3><p>See whether this is the right time to visit Blue Spring, which morning looks strongest for manatees, what the live spring and St. Johns temperatures are doing, and how to plan the first hour after arrival.</p><div class="signal-line">USGS water + NWS weather + manatee observations + park access</div><a class="tool-cta" href="${url}">Open Blue Spring Live &rarr;</a></article>`;
  html = html.slice(0, insertAt) + feature + html.slice(insertAt);
  changed = true;
}

if (!html.includes('data-blue-spring-card="true"')) {
  const waterGrid = '<section class="library-group" data-library-group="water"><h2>Water and river tools</h2>';
  const waterStart = html.indexOf(waterGrid);
  if (waterStart < 0) throw new Error('Blue Spring discovery: water library missing');
  const gridStart = html.indexOf('<div class="tool-grid">', waterStart);
  if (gridStart < 0) throw new Error('Blue Spring discovery: water grid missing');
  const insertAt = gridStart + '<div class="tool-grid">'.length;
  const card = `<article class="tool-card" data-blue-spring-card="true" data-search-card data-tags="water manatee wildlife florida spring river park travel destination winter swimming" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="tk">Live destination intelligence<span class="tk-season" hidden> / useful now</span></div><div class="tool-title"><a href="${url}">Blue Spring Live: Manatee Conditions &amp; Visit Planner</a></div><div class="tool-desc">Live Blue Spring and St. Johns water temperatures, thermal-refuge signal, weather, manatee visit outlook, park access and a concise arrival plan for Blue Spring State Park.</div></article>`;
  html = html.slice(0, insertAt) + card + html.slice(insertAt);
  changed = true;
}

fs.writeFileSync(file, html);
console.log(`Blue Spring national discovery ${changed ? 'applied' : 'already present'}.`);
