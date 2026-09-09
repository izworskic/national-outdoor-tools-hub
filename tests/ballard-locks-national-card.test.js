const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(path.join(__dirname, '..', 'public', 'national-tools', 'index.html'), 'utf8');

test('National Tools exposes Ballard Locks Live as a first-class tool', () => {
  assert.ok(page.includes('https://chrisizworski.com/ballard-locks/'), 'missing canonical Ballard URL');
  assert.ok(page.includes('Ballard Locks Live'), 'missing Ballard title');
  assert.ok(page.includes('Time a Ballard Locks visit'), 'missing Ballard decision intent');
  assert.ok(page.includes('AIS + WDFW salmon + NOAA tides + NWS weather + USACE operations'), 'missing Ballard live-signal summary');
});

test('National Tools exposes the Ballard interactive tour as a distinct tool', () => {
  const tour = 'https://chrisizworski.com/ballard-locks/tour/';
  assert.ok(page.includes(tour), 'missing Ballard tour canonical URL');
  assert.ok(page.includes('Walk the Ballard Locks'), 'missing Ballard tour decision intent');
  assert.ok(page.includes('Ballard Locks Interactive Tour'), 'missing Ballard tour featured card');
  assert.ok(page.includes('Ballard Locks Interactive Tour &amp; Live AIS Map'), 'missing Ballard tour library card');
  assert.ok(page.includes('Live AIS map + 12 stops + route presets + WDFW fish + live camera'), 'missing Ballard tour signal summary');
  assert.ok(page.includes('20-, 45- and 75-minute self-guided routes'), 'missing Ballard route-presets description');
});
