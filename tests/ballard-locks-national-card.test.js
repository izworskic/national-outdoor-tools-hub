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
