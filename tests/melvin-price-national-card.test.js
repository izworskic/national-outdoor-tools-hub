const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'add-melvin-price.mjs'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

test('National Tools build adds Melvin Price as a first-class water destination tool', () => {
  assert.match(script, /https:\/\/chrisizworski\.com\/national-tools\/melvin-price-live\//);
  assert.match(script, /Melvin Price Live/);
  assert.match(script, /Time a Melvin Price Locks visit/);
  assert.match(script, /USACE LPMS \+ CWMS stage\/flow \+ AIS \+ NWS \+ museum tours/);
  assert.match(script, /Open Melvin Price Live/);
  assert.match(pkg.scripts['vercel-build'], /add-melvin-price\.mjs/);
});
