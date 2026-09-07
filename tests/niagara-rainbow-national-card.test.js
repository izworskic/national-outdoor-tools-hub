const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'national-tools', 'index.html'), 'utf8');
const predictor = '/national-tools/niagara-rainbow/';

test('national tools page promotes the live Niagara Falls Rainbow Predictor', () => {
  assert.ok(html.includes(`href="${predictor}"`));
  assert.match(html, /Niagara Falls Rainbow Predictor/);
  assert.match(html, /NWS weather \+ solar geometry \+ wind-shifted mist \+ visibility/);
});

test('national tools page no longer promotes the retired Niagara Falls Live hub or old planner canonical', () => {
  assert.doesNotMatch(html, /Niagara Falls Live/);
  assert.doesNotMatch(html, /href="\/national-tools\/niagara-falls-rainbow-planner\//);
  assert.doesNotMatch(html, /border waits, Niagara River conditions/i);
  assert.doesNotMatch(html, /Maid of the Mist/i);
  assert.doesNotMatch(html, /live river map/i);
});

test('structured tool list points item 11 to the predictor canonical', () => {
  assert.ok(html.includes(`"url":"https://chrisizworski.com${predictor}","name":"Niagara Falls Rainbow Predictor"`));
});