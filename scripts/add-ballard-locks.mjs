import fs from 'node:fs';

const file = 'public/national-tools/index.html';
const url = 'https://chrisizworski.com/ballard-locks/';
const tourUrl = 'https://chrisizworski.com/ballard-locks/tour/';
let html = fs.readFileSync(file, 'utf8');
let changed = false;

// Structured data: Ballard Live and the interactive self-guided tour are distinct tools.
const schemaRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let match;
while ((match = schemaRe.exec(html))) {
  try {
    const data = JSON.parse(match[1]);
    const graph = data?.['@graph'];
    if (!Array.isArray(graph)) continue;
    const list = graph.find(x => x?.['@id'] === 'https://chrisizworski.com/national-tools/#toollist');
    if (!list?.itemListElement) continue;

    let schemaChanged = false;
    if (!list.itemListElement.some(x => x?.url === url)) {
      list.itemListElement.push({ '@type':'ListItem', position:list.itemListElement.length + 1, url, name:'Ballard Locks Live: Ships, Salmon & Tides' });
      schemaChanged = true;
    }
    if (!list.itemListElement.some(x => x?.url === tourUrl)) {
      list.itemListElement.push({ '@type':'ListItem', position:list.itemListElement.length + 1, url:tourUrl, name:'Ballard Locks Interactive Tour & Live AIS Map' });
      schemaChanged = true;
    }

    if (schemaChanged) {
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

// Ballard Live discovery surfaces.
if (!html.includes('href="https://chrisizworski.com/ballard-locks/"')) {
  const niagaraIntent = '<li><a href="/national-tools/niagara-rainbow/">Catch a Niagara Falls rainbow<span>See the current daylight opportunity, best upcoming windows and where to look</span></a></li>';
  if (!html.includes(niagaraIntent)) throw new Error('Ballard discovery: water intent anchor missing');
  html = html.replace(niagaraIntent, `${niagaraIntent}<li><a href="${url}">Time a Ballard Locks visit<span>Live AIS ships, salmon counts, tides, weather, water level and cameras</span></a></li>`);

  const featureAnchor = '<article class="feature-card" data-tags="water waterfall niagara rainbow weather sun mist photography tourism"';
  const featureIndex = html.indexOf(featureAnchor);
  if (featureIndex < 0) throw new Error('Ballard discovery: featured tools anchor missing');
  const feature = `<article class="feature-card" data-tags="water locks ships vessels salmon fish tides seattle tourism camera" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="feature-kicker">Seattle · Washington</div><h3><a href="${url}">Ballard Locks Live</a></h3><p>Decide when to visit the Hiram M. Chittenden Locks using live AIS vessel traffic, dated salmon counts, NOAA tide timing, NWS weather, USACE chamber status and a live camera.</p><div class="signal-line">AIS + WDFW salmon + NOAA tides + NWS weather + USACE operations</div><a class="tool-cta" href="${url}">Check the locks now &rarr;</a></article>\n`;
  html = html.slice(0, featureIndex) + feature + html.slice(featureIndex);

  const waterGrid = '<section class="library-group" data-library-group="water"><h2>Water and river tools</h2>';
  const waterStart = html.indexOf(waterGrid);
  if (waterStart < 0) throw new Error('Ballard discovery: water library missing');
  const gridStart = html.indexOf('<div class="tool-grid">', waterStart);
  if (gridStart < 0) throw new Error('Ballard discovery: water grid missing');
  const insertAt = gridStart + '<div class="tool-grid">'.length;
  const card = `<article class="tool-card" data-search-card data-tags="water locks ships vessels salmon fish tides seattle travel tourism camera" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="tk">Live destination intelligence<span class="tk-season" hidden> / useful now</span></div><div class="tool-title"><a href="${url}">Ballard Locks Live: Ships, Salmon &amp; Tides</a></div><div class="tool-desc">A Seattle visitor decision screen combining live AIS traffic, preliminary WDFW salmon counts with source dates, NOAA tides, NWS weather, USACE chamber and water-level context, and a live camera.</div></article>`;
  html = html.slice(0, insertAt) + card + html.slice(insertAt);
  changed = true;
}

// Interactive Ballard tour discovery surfaces.
if (!html.includes(`href="${tourUrl}"`)) {
  const ballardIntent = `<li><a href="${url}">Time a Ballard Locks visit<span>Live AIS ships, salmon counts, tides, weather, water level and cameras</span></a></li>`;
  if (!html.includes(ballardIntent)) throw new Error('Ballard tour discovery: Ballard Live intent anchor missing');
  const tourIntent = `<li><a href="${tourUrl}">Walk the Ballard Locks<span>Interactive live-AIS map with 20, 45 and 75 minute routes, 12 stops, fish counts and camera</span></a></li>`;
  html = html.replace(ballardIntent, `${ballardIntent}${tourIntent}`);

  const niagaraFeatureAnchor = '<article class="feature-card" data-tags="water waterfall niagara rainbow weather sun mist photography tourism"';
  const featureIndex = html.indexOf(niagaraFeatureAnchor);
  if (featureIndex < 0) throw new Error('Ballard tour discovery: Niagara feature anchor missing');
  const tourFeature = `<article class="feature-card" data-tags="water locks map walking tour ais ships vessels salmon fish seattle tourism camera visitor center" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="feature-kicker">Seattle · Interactive map</div><h3><a href="${tourUrl}">Ballard Locks Interactive Tour</a></h3><p>Walk the Locks with one interactive map combining live AIS vessel positions, 20-, 45- and 75-minute self-guided routes, 12 mapped stops, fish counts and Camera #3.</p><div class="signal-line">Live AIS map + 12 stops + route presets + WDFW fish + live camera</div><a class="tool-cta" href="${tourUrl}">Open interactive tour &rarr;</a></article>\n`;
  html = html.slice(0, featureIndex) + tourFeature + html.slice(featureIndex);

  const waterfallCardAnchor = '<article class="tool-card" data-search-card data-tags="water waterfall hiking flow trip travel"';
  const waterStart = html.indexOf('<section class="library-group" data-library-group="water">');
  const waterfallIndex = html.indexOf(waterfallCardAnchor, waterStart);
  if (waterStart < 0 || waterfallIndex < 0) throw new Error('Ballard tour discovery: water library insertion point missing');
  const tourCard = `<article class="tool-card" data-search-card data-tags="water locks map walking tour ais ships vessels salmon fish seattle travel tourism camera visitor center" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="tk">Interactive destination map<span class="tk-season" hidden> / useful now</span></div><div class="tool-title"><a href="${tourUrl}">Ballard Locks Interactive Tour &amp; Live AIS Map</a></div><div class="tool-desc">A self-guided walking map with live AIS vessels on the same MapLibre surface as 20-, 45- and 75-minute routes, 12 interpretive stops, current salmon context and the live Ship Canal camera.</div></article>`;
  html = html.slice(0, waterfallIndex) + tourCard + html.slice(waterfallIndex);
  changed = true;
}

fs.writeFileSync(file, html);
console.log(`Ballard Locks national discovery ${changed ? 'applied' : 'already present'}.`);
