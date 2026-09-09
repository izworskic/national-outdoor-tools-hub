import fs from 'node:fs';

const file = 'public/national-tools/index.html';
const url = 'https://chrisizworski.com/melvin-price/';
let html = fs.readFileSync(file, 'utf8');
let changed = false;

// Structured data: Melvin Price is a distinct destination decision tool.
const schemaRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let match;
while ((match = schemaRe.exec(html))) {
  try {
    const data = JSON.parse(match[1]);
    const graph = data?.['@graph'];
    if (!Array.isArray(graph)) continue;
    const list = graph.find(x => x?.['@id'] === 'https://chrisizworski.com/national-tools/#toollist');
    if (!list?.itemListElement) continue;
    if (!list.itemListElement.some(x => x?.url === url)) {
      list.itemListElement.push({ '@type':'ListItem', position:list.itemListElement.length + 1, url, name:'Melvin Price Live: Mississippi Tow & Lock Traffic' });
      list.itemListElement.forEach((x,i) => x.position = i + 1);
      list.numberOfItems = list.itemListElement.length;
      const page = graph.find(x => x?.['@id'] === 'https://chrisizworski.com/national-tools/#page');
      if (page) page.dateModified = '2026-09-09';
      const replacement = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
      html = html.slice(0, match.index) + replacement + html.slice(match.index + match[0].length);
      changed = true;
    }
    break;
  } catch {}
}

if (!html.includes(`href="${url}"`)) {
  const ballardIntent = '<li><a href="https://chrisizworski.com/ballard-locks/">Time a Ballard Locks visit<span>Live AIS ships, salmon counts, tides, weather, water level and cameras</span></a></li>';
  if (!html.includes(ballardIntent)) throw new Error('Melvin Price discovery: Ballard water-intent anchor missing');
  html = html.replace(ballardIntent, `${ballardIntent}<li><a href="${url}">Time a Melvin Price Locks visit<span>Live USACE lock traffic, pending arrivals, Mississippi river conditions, AIS vessels and free tour timing</span></a></li>`);

  const featureAnchor = '<article class="feature-card" data-tags="water locks ships vessels salmon fish tides seattle tourism camera"';
  const featureIndex = html.indexOf(featureAnchor);
  if (featureIndex < 0) throw new Error('Melvin Price discovery: featured Ballard anchor missing');
  const feature = `<article class="feature-card" data-tags="water river mississippi locks ships vessels tow barges traffic st louis alton tourism museum tours" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="feature-kicker">Mississippi River · Illinois</div><h3><a href="${url}">Melvin Price Live</a></h3><p>Decide when to visit Melvin Price Locks and Dam using near-real-time USACE lock traffic, pending arrivals, neighboring-lock activity, river stage, NWS weather, AIS vessels and National Great Rivers Museum tour timing.</p><div class="signal-line">USACE LPMS + CWMS river data + AIS + NWS weather + museum tours</div><a class="tool-cta" href="${url}">Check Melvin Price now &rarr;</a></article>\n`;
  html = html.slice(0, featureIndex) + feature + html.slice(featureIndex);

  const waterGrid = '<section class="library-group" data-library-group="water"><h2>Water and river tools</h2>';
  const waterStart = html.indexOf(waterGrid);
  if (waterStart < 0) throw new Error('Melvin Price discovery: water library missing');
  const gridStart = html.indexOf('<div class="tool-grid">', waterStart);
  if (gridStart < 0) throw new Error('Melvin Price discovery: water grid missing');
  const insertAt = gridStart + '<div class="tool-grid">'.length;
  const card = `<article class="tool-card" data-search-card data-tags="water river mississippi locks ships vessels tow barges traffic st louis alton tourism museum tours" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="tk">Live destination intelligence<span class="tk-season" hidden> / useful now</span></div><div class="tool-title"><a href="${url}">Melvin Price Live: Mississippi Tow &amp; Lock Traffic</a></div><div class="tool-desc">A visitor decision screen combining USACE lock status, pending arrivals and delay, neighboring Lock 25/27 traffic, Mississippi river conditions, live AIS, weather and National Great Rivers Museum tour timing.</div></article>`;
  html = html.slice(0, insertAt) + card + html.slice(insertAt);
  changed = true;
}

fs.writeFileSync(file, html);
console.log(`Melvin Price national discovery ${changed ? 'applied' : 'already present'}.`);
