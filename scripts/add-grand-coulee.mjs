import fs from 'node:fs';

const file = 'public/national-tools/index.html';
const url = 'https://grand-coulee-live.vercel.app/';
let html = fs.readFileSync(file, 'utf8');
let changed = false;

// Structured data: Grand Coulee Live is a distinct national destination/infrastructure decision tool.
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
      list.itemListElement.push({
        '@type':'ListItem',
        position:list.itemListElement.length + 1,
        url,
        name:'Grand Coulee Live: Lake Roosevelt, Outflow, Tours & Laser Show'
      });
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
  const niagaraIntent = '<li><a href="/national-tools/niagara-rainbow/">Catch a Niagara Falls rainbow<span>See the current daylight opportunity, best upcoming windows and where to look</span></a></li>';
  const intentAnchor = html.includes(ballardIntent) ? ballardIntent : niagaraIntent;
  if (!html.includes(intentAnchor)) throw new Error('Grand Coulee discovery: water intent anchor missing');
  html = html.replace(intentAnchor, `${intentAnchor}<li><a href="${url}">Plan a Grand Coulee Dam visit<span>Lake Roosevelt level, Columbia outflow, spill status, tours, laser show, weather and interactive dam context</span></a></li>`);

  const featureAnchor = '<article class="feature-card" data-tags="water waterfall niagara rainbow weather sun mist photography tourism"';
  const featureIndex = html.indexOf(featureAnchor);
  if (featureIndex < 0) throw new Error('Grand Coulee discovery: featured tools anchor missing');
  const feature = `<article class="feature-card" data-tags="water dam hydropower reservoir lake roosevelt columbia river grand coulee tours laser washington infrastructure tourism" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="feature-kicker">Grand Coulee · Washington</div><h3><a href="${url}">Grand Coulee Live</a></h3><p>See what Grand Coulee Dam is doing now and plan a visit with Lake Roosevelt elevation, Columbia River outflow, source-aware spill and generation status, visitor-center and tour schedules, laser-show timing, weather, history and an interactive dam view.</p><div class="signal-line">USACE CWMS + Bureau of Reclamation + NWS + astronomy + historical operations</div><a class="tool-cta" href="${url}">Open Grand Coulee Live &rarr;</a></article>\n`;
  html = html.slice(0, featureIndex) + feature + html.slice(featureIndex);

  const waterGrid = '<section class="library-group" data-library-group="water"><h2>Water and river tools</h2>';
  const waterStart = html.indexOf(waterGrid);
  if (waterStart < 0) throw new Error('Grand Coulee discovery: water library missing');
  const gridStart = html.indexOf('<div class="tool-grid">', waterStart);
  if (gridStart < 0) throw new Error('Grand Coulee discovery: water grid missing');
  const insertAt = gridStart + '<div class="tool-grid">'.length;
  const card = `<article class="tool-card" data-search-card data-tags="water dam hydropower reservoir lake roosevelt columbia river grand coulee washington tours laser infrastructure travel tourism" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="tk">Live destination intelligence<span class="tk-season" hidden> / useful now</span></div><div class="tool-title"><a href="${url}">Grand Coulee Live: Dam, Lake Roosevelt &amp; Visitor Conditions</a></div><div class="tool-desc">A Grand Coulee visitor and operations screen combining USACE water telemetry, Reclamation lake forecasts and visitor schedules, weather, history and an interactive explanation of the dam. Missing federal telemetry stays explicitly unavailable rather than being inferred.</div></article>`;
  html = html.slice(0, insertAt) + card + html.slice(insertAt);
  changed = true;
}

fs.writeFileSync(file, html);
console.log(`Grand Coulee national discovery ${changed ? 'applied' : 'already present'}.`);
