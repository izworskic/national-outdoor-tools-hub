import fs from 'node:fs';

const file = 'public/national-tools/index.html';
const url = 'https://chrisizworski.com/national-tools/melvin-price-live/';
const buildMarker = 'melvin-national-card-v2';
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
    const prior = list.itemListElement.find(x => /melvin-price/.test(String(x?.url || '')));
    if (prior) {
      prior.url = url;
      prior.name = 'Melvin Price Live: Tows, Locks & River';
      changed = true;
    } else {
      list.itemListElement.push({ '@type':'ListItem', position:list.itemListElement.length + 1, url, name:'Melvin Price Live: Tows, Locks & River' });
      changed = true;
    }
    list.itemListElement.forEach((x,i) => x.position = i + 1);
    list.numberOfItems = list.itemListElement.length;
    const page = graph.find(x => x?.['@id'] === 'https://chrisizworski.com/national-tools/#page');
    if (page) page.dateModified = '2026-09-09';
    const replacement = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    html = html.slice(0, match.index) + replacement + html.slice(match.index + match[0].length);
    break;
  } catch {}
}

// Remove any stale Melvin cards from an earlier build before inserting the current version.
html = html.replace(/<li><a href="https:\/\/chrisizworski\.com\/melvin-price\/">Time a Melvin Price Locks visit[\s\S]*?<\/li>/g, '');
html = html.replace(/<article class="feature-card"[^>]*data-tags="[^"]*melvin[^"]*"[\s\S]*?<\/article>\s*/gi, '');
html = html.replace(/<article class="tool-card"[^>]*data-tags="[^"]*melvin[^"]*"[\s\S]*?<\/article>/gi, '');

if (!html.includes(`href="${url}"`)) {
  const ballardIntent = '<li><a href="https://chrisizworski.com/ballard-locks/">Time a Ballard Locks visit<span>Live AIS ships, salmon counts, tides, weather, water level and cameras</span></a></li>';
  if (!html.includes(ballardIntent)) throw new Error('Melvin Price discovery: Ballard water-intent anchor missing');
  html = html.replace(ballardIntent, `${ballardIntent}<li><a href="${url}">Time a Melvin Price Locks visit<span>Live tow queue, lock activity, Mississippi flow and stage, AIS vessels, weather, free tour timing and a go-now visitor outlook</span></a></li>`);

  const featureAnchor = '<article class="feature-card" data-tags="water locks ships vessels salmon fish tides seattle tourism camera"';
  const featureIndex = html.indexOf(featureAnchor);
  if (featureIndex < 0) throw new Error('Melvin Price discovery: featured Ballard anchor missing');
  const feature = `<article class="feature-card" data-tags="water river mississippi locks ships vessels tow barges traffic st louis alton tourism museum tours melvin" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="feature-kicker">Mississippi River · Illinois</div><h3><a href="${url}">Melvin Price Live</a></h3><p>Decide whether to go now using current USACE lock activity and pending arrivals, neighboring-lock traffic, Mel Price tailwater stage and flow, AIS vessels, weather and National Great Rivers Museum tour timing.</p><div class="signal-line">USACE LPMS + CWMS stage/flow + AIS + NWS + museum tours</div><a class="tool-cta" href="${url}">Open Melvin Price Live &rarr;</a></article>\n`;
  html = html.slice(0, featureIndex) + feature + html.slice(featureIndex);

  const waterGrid = '<section class="library-group" data-library-group="water"><h2>Water and river tools</h2>';
  const waterStart = html.indexOf(waterGrid);
  if (waterStart < 0) throw new Error('Melvin Price discovery: water library missing');
  const gridStart = html.indexOf('<div class="tool-grid">', waterStart);
  if (gridStart < 0) throw new Error('Melvin Price discovery: water grid missing');
  const insertAt = gridStart + '<div class="tool-grid">'.length;
  const card = `<article class="tool-card" data-search-card data-tags="water river mississippi locks ships vessels tow barges traffic st louis alton tourism museum tours melvin" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="tk">Live destination intelligence<span class="tk-season" hidden> / useful now</span></div><div class="tool-title"><a href="${url}">Melvin Price Live: Tows, Locks &amp; River</a></div><div class="tool-desc">Current USACE lock activity and pending arrivals, neighboring-lock traffic, Mel Price tailwater stage and flow, live AIS vessels, weather, tour timing and a visitor-focused go-now outlook.</div></article>`;
  html = html.slice(0, insertAt) + card + html.slice(insertAt);
  changed = true;
}

fs.writeFileSync(file, html);
console.log(`Melvin Price national discovery ${changed ? 'applied' : 'already present'} (${buildMarker}).`);
