import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ID = 'G-Y5D2V2W7HN';

async function text(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('national hub keeps GA4 deploy coverage and new-tool contract', async () => {
  const [pkgText, injector, agents, contract] = await Promise.all([
    text('package.json'),
    text('scripts/inject-ga4.mjs'),
    text('AGENTS.md'),
    text('docs/ANALYTICS_CONTRACT.md'),
  ]);

  const pkg = JSON.parse(pkgText);
  assert.match(pkg.scripts?.['vercel-build'] || '', /inject-ga4\.mjs/);
  assert.match(injector, new RegExp(ID.replace(/-/g, '\\-')));
  assert.match(agents, new RegExp(ID.replace(/-/g, '\\-')));
  assert.match(agents, /new standalone repositor/i);
  assert.match(contract, new RegExp(ID.replace(/-/g, '\\-')));
  assert.match(contract, /Freighter View Farms/i);
  assert.match(contract, /WordPress-hosted properties/i);
  assert.doesNotMatch(contract, /Freighter View Farms uses a separate Google Analytics property/i);
  assert.match(contract, /production deployment/i);
});
