const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'national-tools', 'index.html'), 'utf8');
const planner = '/national-tools/niagara-falls-rainbow-planner/';

test('national tools page promotes the standalone Niagara Falls Rainbow Planner', () => {
  assert.ok(html.includes(`href="${planner}"`));
  assert.match(html, /Niagara Falls Rainbow Planner/);
  assert.match(html, /Daylight \+ solar geometry \+ cloud cover \+ precipitation \+ visibility/);
});

test('national tools page no longer promotes the retired Niagara Falls Live hub', () => {
  assert.doesNotMatch(html, /Niagara Falls Live/);
  assert.doesNotMatch(html, /border waits, Niagara River conditions/i);
  assert.doesNotMatch(html, /Maid of the Mist/i);
  assert.doesNotMatch(html, /live river map/i);
});

test('structured tool list points item 11 to the rainbow planner canonical', () => {
  assert.ok(html.includes(`"url":"https://chrisizworski.com${planner}","name":"Niagara Falls Rainbow Planner"`));
});
