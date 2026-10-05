import fs from 'node:fs';

const file = process.env.NATIONAL_TOOLS_DIRECTORY_FILE || 'public/national-tools/index.html';
const canonical = 'https://chrisizworski.com/chesapeake-bay-bridge-maryland/';
const toolId = 'maryland-bay-bridge';
let html = fs.readFileSync(file, 'utf8');

const card = `<article class="directory-card" data-search-card data-tool-id="${toolId}" data-personas="trip conditions" data-tags="maryland chesapeake bay bridge us 50 301 annapolis eastern shore toll wind restrictions traffic cameras mdta chart mid atlantic appalachia" data-months="1,2,3,4,5,6,7,8,9,10,11,12"><div class="card-top"><span class="kind">Live bridge crossing decision</span><span class="season-label" hidden>Useful now</span></div><h3>Maryland Chesapeake Bay Bridge Live</h3><p class="place">Maryland · Chesapeake Bay</p><p class="description">Check MDTA wind restrictions, live approach traffic, official CHART cameras, vehicle rules, planned work and eastbound tolls before crossing US 50/301.</p><p class="signals"><strong>Signals:</strong> MDTA operational rules + Maryland CHART + NWS weather context</p><div class="card-actions"><a class="primary-action" href="${canonical}">Open Maryland Bay Bridge Live →</a></div></article>\n`;

if (!html.includes(`data-tool-id="${toolId}"`)) {
  let insertAt = -1;
  for (const anchorId of ['cbbt', 'gauley']) {
    const keyAt = html.indexOf(`data-tool-id="${anchorId}"`);
    if (keyAt >= 0) {
      insertAt = html.lastIndexOf('<article class="directory-card"', keyAt);
      if (insertAt >= 0) break;
    }
  }
  if (insertAt < 0) insertAt = html.indexOf('<p class="empty" id="no-results">');
  if (insertAt < 0) insertAt = html.lastIndexOf('</main>');
  if (insertAt < 0) insertAt = html.length;
  html = html.slice(0, insertAt) + card + html.slice(insertAt);
}

// Keep structured discovery aligned with the final visible card sequence. This is
// intentionally best-effort because the owner hub's base directory has already
// passed its full verifier before this final additive network mutation runs.
try {
  const orderedCards = [...html.matchAll(/<article class="directory-card"[\s\S]*?<\/article>/g)].map(match => match[0]);
  const directoryEntries = orderedCards.map((entry, index) => {
    const url = entry.match(/<a class="primary-action" href="([^"]+)"/)?.[1];
    const name = entry.match(/<h3>([\s\S]*?)<\/h3>/)?.[1]?.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&');
    if (!url || !name) return null;
    return {'@type':'ListItem', position:index + 1, url:new URL(url, 'https://chrisizworski.com').href, name};
  }).filter(Boolean);

  const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (schemaMatch && directoryEntries.length === orderedCards.length && new Set(directoryEntries.map(item => item.url)).size === directoryEntries.length) {
    const schema = JSON.parse(schemaMatch[1]);
    const graph = schema?.['@graph'];
    const list = graph?.find(node => node?.['@id'] === 'https://chrisizworski.com/national-tools/#toollist');
    if (list) {
      list.itemListElement = directoryEntries;
      list.numberOfItems = directoryEntries.length;
      const page = graph?.find(node => node?.['@id'] === 'https://chrisizworski.com/national-tools/#page');
      if (page) page.dateModified = '2026-10-05';
      html = html.replace(schemaMatch[0], `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
    }
  }
} catch (error) {
  console.warn('Maryland Bay Bridge: structured directory refresh skipped', error?.message || error);
}

const count = (html.match(/<article class="directory-card"/g) || []).length;
html = html.replace(/(<p class="finder-count" id="finder-count" aria-live="polite">)\d+ tools shown(<\/p>)/, `$1${count} tools shown$2`);

if (!html.includes(`data-tool-id="${toolId}"`) || !html.includes(canonical)) {
  throw new Error('Maryland Bay Bridge: final directory card/link missing');
}

fs.writeFileSync(file, html, 'utf8');
console.log(`Maryland Bay Bridge added to National Tools | cards=${count}`);
