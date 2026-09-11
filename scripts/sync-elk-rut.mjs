import fs from "node:fs";

const path = "public/national-tools/index.html";
let html = fs.readFileSync(path, "utf8");

const card = `<article class="directory-card" data-search-card data-tool-id="elk-rut" data-personas="trip conditions event" data-tags="rocky mountain national park colorado elk rut bugling moraine park horseshoe park upper beaver meadows kawuneeche harbison wildlife fall september october" data-months="9,10"><div class="card-top"><span class="kind">Live wildlife timing</span><span class="season-label" hidden>In season now</span></div><h3>Rocky Mountain Elk Rut Live</h3><p class="place">Rocky Mountain National Park · Colorado</p><p class="description">Compare tonight's dusk and tomorrow's dawn rut windows using seasonal elk timing, solar geometry, live NWS weather and the park's 2026 timed-entry rules.</p><p class="audience">For wildlife watchers, photographers and fall visitors deciding exactly when and where to go.</p><p class="signals"><strong>Signals:</strong> NPS rut guidance + sunrise/sunset + NWS hourly weather + timed entry + meadow closures</p><div class="card-actions"><a class="primary-action" href="/national-tools/elk-rut/">Best time to see elk in Rocky Mountain National Park &rarr;</a></div></article>`;

if (!html.includes('data-tool-id="elk-rut"')) {
  const anchor = /<article class="directory-card" data-search-card data-tool-id="blue-spring"/;
  if (!anchor.test(html)) throw new Error("Could not find Blue Spring card insertion anchor.");
  html = html.replace(anchor, `${card}\n<article class="directory-card" data-search-card data-tool-id="blue-spring"`);
}

const seasonal = ` Rocky Mountain's elk rut is building toward its mid-September-to-mid-October peak, so the <a href="/national-tools/elk-rut/">elk rut timing tool</a> compares tonight's dusk and tomorrow's dawn windows using live viewing conditions and current access rules.`;
if (!html.includes('href="/national-tools/elk-rut/">elk rut timing tool</a>')) {
  const seasonAnchor = /(<section class="season-now"[\s\S]*?<p>)([\s\S]*?)(<\/p><\/section>)/;
  const match = html.match(seasonAnchor);
  if (!match) throw new Error("Could not find season-now block.");
  html = html.replace(seasonAnchor, `$1${match[2]}${seasonal}$3`);
}

const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!schemaMatch) throw new Error("Directory JSON-LD not found.");
const schema = JSON.parse(schemaMatch[1]);
const list = schema?.["@graph"]?.find(item => item?.["@id"] === "https://chrisizworski.com/national-tools/#toollist");
if (!list || !Array.isArray(list.itemListElement)) throw new Error("Directory ItemList not found.");
const elkUrl = "https://chrisizworski.com/national-tools/elk-rut/";
if (!list.itemListElement.some(item => item.url === elkUrl)) {
  list.itemListElement.push({ "@type": "ListItem", position: list.itemListElement.length + 1, url: elkUrl, name: "Rocky Mountain Elk Rut Live" });
}
list.itemListElement.forEach((item, index) => { item.position = index + 1; });
list.numberOfItems = list.itemListElement.length;
html = html.replace(schemaMatch[0], `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
const visibleCards = [...html.matchAll(/data-tool-id="([^"]+)"/g)].length;
html = html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/, `$1${visibleCards} tools shown$2`);
fs.writeFileSync(path, html);
console.log(`Elk rut discovery synced: cards=${visibleCards}, structuredTools=${list.numberOfItems}`);
