import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const upstream = 'https://blue-spring-live-6h8f.vercel.app';
const route = '/national-tools/blue-spring-live';
const targetDir = resolve(projectRoot, 'public', 'national-tools', 'blue-spring-live');

async function fetchText(path) {
  const response = await fetch(`${upstream}${path}`, {
    headers: {
      'user-agent': 'chrisizworski.com national tools build sync',
      accept: path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/html',
    },
  });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.text();
}

function rewriteHtml(html) {
  const canonical = 'https://chrisizworski.com/national-tools/blue-spring-live/';
  let out = html
    .replace(/href="styles\.css"/g, `href="${route}/styles.css"`)
    .replace(/src="app\.js"/g, `src="${route}/app.js"`)
    .replace(/<meta property="og:url"[^>]*>\s*/gi, '')
    .replace(/<link rel="canonical"[^>]*>\s*/gi, '');

  out = out.replace('</head>', `  <link rel="canonical" href="${canonical}" />\n  <meta property="og:url" content="${canonical}" />\n</head>`);
  return out;
}

function rewriteApp(js) {
  return js
    .replace(/fetch\(['"]\/api\/live['"]\)/g, `fetch('${route}/_api/live')`)
    .replace(/fetch\(['"]\/api\/manatee['"]\)/g, `fetch('${route}/_api/manatee')`);
}

async function keepExistingOrThrow(error) {
  try {
    const existing = await readFile(resolve(targetDir, 'index.html'), 'utf8');
    if (existing.trim()) {
      console.warn(`Blue Spring sync failed (${error.message}); keeping existing mirrored route.`);
      return true;
    }
  } catch {}
  throw error;
}

async function main() {
  await mkdir(targetDir, { recursive: true });
  try {
    const [html, css, js] = await Promise.all([
      fetchText('/'),
      fetchText('/styles.css'),
      fetchText('/app.js'),
    ]);
    await Promise.all([
      writeFile(resolve(targetDir, 'index.html'), rewriteHtml(html), 'utf8'),
      writeFile(resolve(targetDir, 'styles.css'), css, 'utf8'),
      writeFile(resolve(targetDir, 'app.js'), rewriteApp(js), 'utf8'),
    ]);
    console.log(`Synced Blue Spring Live -> ${route}/`);
  } catch (error) {
    await keepExistingOrThrow(error);
  }
}

main();
