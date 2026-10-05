import fs from 'node:fs';

const file = 'public/national-tools/index.html';
const canonical = 'https://chrisizworski.com/chesapeake-bay-bridge-maryland/';
const toolId = 'maryland-bay-bridge';
let html = fs.readFileSync(file, 'utf8');

if (!html.includes(`data-tool-id="${toolId}"`)) {
  const card = `<article class="directory-card" data-search-card data-tool-id="${toolId}" data-personas="trip conditions" data-tags="maryland chesapeake bay bridge us 50 301 annapolis eastern shore toll wind restrictions traffic cameras mdta chart mid atlantic appalachia" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">Live bridge crossing decision</span><span class="season-label" hidden>Useful now</span></div><h3>Maryland Chesapeake Bay Bridge Live</h3><p class="place">Maryland · Chesapeake Bay</p><p class="description">Check MDTA wind restrictions, live approach traffic, official CHART cameras, vehicle rules, planned work and eastbound tolls before crossing US 50/301.</p><p class="signals"><strong>Signals:</strong> MDTA operational rules + Maryland CHART + NWS weather context</p><div class="card-actions"><a class="primary-action" href="${canonical}">Open Maryland Bay Bridge Live →</a></div></article>\n`;
  const cbbtKey = html.indexOf('data-tool-id="cbbt"');
  let insertAt = cbbtKey >= 0 ? html.lastIndexOf('<article class="directory-card"', cbbtKey) : -1;
  if (insertAt < 0) insertAt = html.indexOf('<p class="empty" id="no-results">');
  if (insertAt < 0) insertAt = html.lastIndexOf('</main>');
  if (insertAt < 0) insertAt = html.length;
  html = html.slice(0, insertAt) + card + html.slice(insertAt);
}

const count = (html.match(/data-search-card/g) || []).length;
html = html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/, `$1${count} tools shown$2`);
fs.writeFileSync(file, html, 'utf8');
console.log(`Maryland Bay Bridge National Tools card applied | cards=${count}`);
