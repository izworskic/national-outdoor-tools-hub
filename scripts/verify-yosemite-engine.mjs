import assert from 'node:assert/strict';
import handler from '../api/yosemite-firefall.js';

const req = { method: 'GET' };
let statusCode = 200;
let body;
const headers = new Map();
const res = {
  setHeader(name, value) { headers.set(String(name).toLowerCase(), value); },
  status(code) { statusCode = code; return this; },
  json(value) { body = value; return this; },
  end() { return this; },
};

await Promise.race([
  handler(req, res),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Yosemite engine smoke test timed out')), 45000)),
]);

assert.equal(statusCode, 200, `Yosemite engine returned ${statusCode}: ${JSON.stringify(body)}`);
assert.ok(body && ['preseason','season','postseason'].includes(body.mode), 'snapshot mode missing');
assert.ok(Number.isInteger(body.seasonYear), 'season year missing');
assert.ok(Array.isArray(body.days) && body.days.length >= 1, 'forecast days missing');
assert.ok(Array.isArray(body.sources) && body.sources.length >= 1, 'source provenance missing');
assert.ok(body.methodologyVersion, 'methodology version missing');
console.log(`Yosemite Firefall API: PASS | mode=${body.mode} | season=${body.seasonYear} | days=${body.days.length} | sources=${body.sources.length}`);
