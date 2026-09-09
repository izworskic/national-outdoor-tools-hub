const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const scriptPath = path.join(root, 'scripts', 'add-melvin-price.mjs');
const sourcePath = path.join(root, 'public', 'national-tools', 'index.html');
const script = fs.readFileSync(scriptPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function count(text, needle) {
  return text.split(needle).length - 1;
}

test('National Tools build adds Melvin Price as a first-class water destination tool', () => {
  assert.match(script, /https:\/\/chrisizworski\.com\/national-tools\/melvin-price-live\//);
  assert.match(script, /Melvin Price Live/);
  assert.match(script, /Time a Melvin Price Locks visit/);
  assert.match(script, /USACE LPMS \+ CWMS stage\/flow \+ AIS \+ NWS \+ museum tours/);
  assert.match(script, /Open Melvin Price Live/);
  assert.match(pkg.scripts['vercel-build'], /add-melvin-price\.mjs/);
});

test('Melvin Price discovery surfaces survive repeated production builds without duplication', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'melvin-hub-'));
  try {
    fs.mkdirSync(path.join(tmp, 'public', 'national-tools'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'scripts'), { recursive: true });
    fs.copyFileSync(sourcePath, path.join(tmp, 'public', 'national-tools', 'index.html'));
    fs.copyFileSync(scriptPath, path.join(tmp, 'scripts', 'add-melvin-price.mjs'));

    for (let i = 0; i < 2; i += 1) {
      execFileSync(process.execPath, ['scripts/add-melvin-price.mjs'], { cwd: tmp, stdio: 'pipe' });
    }

    const html = fs.readFileSync(path.join(tmp, 'public', 'national-tools', 'index.html'), 'utf8');
    assert.equal(count(html, '>Time a Melvin Price Locks visit<'), 1, 'water decision link should appear exactly once');
    assert.equal(count(html, 'data-tags="water river mississippi locks ships vessels tow barges traffic st louis alton tourism museum tours melvin"'), 2, 'featured and library Melvin cards should each survive');
    assert.equal(count(html, '>Melvin Price Live</a></h3>'), 1, 'featured Melvin card should appear exactly once');
    assert.equal(count(html, '>Melvin Price Live: Tows, Locks &amp; River</a>'), 1, 'water library Melvin card should appear exactly once');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
