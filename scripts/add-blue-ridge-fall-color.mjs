import fs from 'node:fs';

const directoryFile = 'public/national-tools/index.html';
const fallHubFile = 'public/national-tools/fall/index.html';
const route = '/national-tools/fall-color/blue-ridge-parkway/';
const canonical = `https://chrisizworski.com${route}`;
const name = 'Blue Ridge Parkway Fall Color Live';

function updateDirectorySchema(html) {
  const schemaRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  while ((match = schemaRe.exec(html))) {
    try {
      const data = JSON.parse(match[1]);
      const graph = data?.['@graph'];
      if (!Array.isArray(graph)) continue;
      const list = graph.find(x => x?.['@id'] === 'https://chrisizworski.com/national-tools/#toollist');
      if (!list?.itemListElement) continue;
      const prior = list.itemListElement.find(x => String(x?.url || '') === canonical);
      if (prior) prior.name = name;
      else list.itemListElement.push({ '@type':'ListItem', position:list.itemListElement.length + 1, url:canonical, name });
      list.itemListElement.forEach((x, i) => x.position = i + 1);
      list.numberOfItems = list.itemListElement.length;
      const page = graph.find(x => x?.['@id'] === 'https://chrisizworski.com/national-tools/#page');
      if (page) page.dateModified = '2026-09-13';
      return html.slice(0, match.index) + `<script type="application/ld+json">${JSON.stringify(data)}</script>` + html.slice(match.index + match[0].length);
    } catch {}
  }
  throw new Error('Blue Ridge discovery: structured tool list not found');
}

function addDirectoryCard(html) {
  if (html.includes('data-tool-id="blue-ridge-fall-color"')) return html;
  const cumberlandId = 'data-tool-id="cumberland-moonbow"';
  const cardStart = html.indexOf(cumberlandId);
  if (cardStart < 0) throw new Error('Blue Ridge discovery: Cumberland Falls regional anchor missing');
  const articleEnd = html.indexOf('</article>', cardStart);
  if (articleEnd < 0) throw new Error('Blue Ridge discovery: Cumberland Falls card end missing');
  const insertAt = articleEnd + '</article>'.length;
  const card = `\n<article class="directory-card" data-search-card data-tool-id="blue-ridge-fall-color" data-personas="trip conditions event" data-tags="blue ridge parkway fall color foliage leaves autumn virginia north carolina appalachia appalachian mountains scenic drive elevation asheville boone craggy gardens linville falls road closures" data-months="9,10,11"><div class="card-top"><span class="kind">Elevation-aware fall color</span><span class="season-label" hidden>In season now</span></div><h3>Blue Ridge Parkway Fall Color Live</h3><p class="place">Blue Ridge Parkway · Virginia &amp; North Carolina</p><p class="description">See which Parkway corridor is the best modeled fall-color bet now, which elevation band is next over seven days, and whether weather stress or road closures change the trip.</p><p class="signals"><strong>Signals:</strong> USA-NPN phenology + current leaf observations + NWS weather + U.S. Drought Monitor + NPS road status</p><div class="card-actions"><a class="primary-action" href="${route}">Best Blue Ridge Parkway fall color now &rarr;</a></div></article>`;
  return html.slice(0, insertAt) + card + html.slice(insertAt);
}

function updateFinderCount(html) {
  const count = (html.match(/data-tool-id="/g) || []).length;
  return html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/, `$1${count} tools shown$2`);
}

function addFallHubHandoff(html) {
  if (!html.includes('data-blue-ridge-fall-color-handoff="true"')) {
    const foliage = '<a class="card tool-card" data-hub-tool="/national-tools/fall-color/" href="/national-tools/fall-color/"><div class="tool-kicker">Foliage</div><h3>Fall Color Timing</h3><p>Historical USA-NPN satellite timing plus separate recent Nature’s Notebook colored-leaf observations and current weather context.</p></a>';
    if (!html.includes(foliage)) throw new Error('Blue Ridge discovery: fall-color hub anchor missing');
    const handoff = `<a class="card tool-card" data-blue-ridge-fall-color-handoff="true" href="${route}"><div class="tool-kicker">Blue Ridge Parkway</div><h3>Which elevation is best now?</h3><p>Compare Parkway mileposts from Virginia to North Carolina for the strongest modeled fall-color corridor now and seven days ahead, with current observations, weather stress, drought and road status kept separate.</p></a>`;
    html = html.replace(foliage, `${foliage}\n${handoff}`);
  }
  return html.replace(/("dateModified":")\d{4}-\d{2}-\d{2}("[^<]*Fall Trip Planning)/, '$12026-09-13$2');
}

let directory = fs.readFileSync(directoryFile, 'utf8');
directory = updateDirectorySchema(directory);
directory = addDirectoryCard(directory);
directory = updateFinderCount(directory);
fs.writeFileSync(directoryFile, directory);

let fallHub = fs.readFileSync(fallHubFile, 'utf8');
fallHub = addFallHubHandoff(fallHub);
fs.writeFileSync(fallHubFile, fallHub);

const builtDirectory = fs.readFileSync(directoryFile, 'utf8');
const builtFallHub = fs.readFileSync(fallHubFile, 'utf8');
if (!builtDirectory.includes('data-tool-id="blue-ridge-fall-color"') || !builtDirectory.includes(`href="${route}"`)) throw new Error('Blue Ridge discovery: regional card not installed');
if (!builtFallHub.includes('data-blue-ridge-fall-color-handoff="true"')) throw new Error('Blue Ridge discovery: fall-planning handoff not installed');
console.log('Blue Ridge Parkway fall-color discovery installed in national directory and fall hub.');
