import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const html = read('index.html');
const projects = runInNewContext(read('portfolio-data.js') + '; PORTFOLIO');
const { testimonials, certificates } = runInNewContext(read('trust-data.js') + '; ({ testimonials: TESTIMONIALS, certificates: CERTIFICATES })');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML IDs must be unique');
const localAssets = new Set();
for (const [, path] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (path.startsWith('#')) { assert(ids.includes(path.slice(1)), `Missing anchor: ${path}`); continue; }
  if (!/^(https?:|mailto:|data:)/.test(path)) localAssets.add(decodeURIComponent(path));
}
assert(projects.length > 0, 'Portfolio must contain projects');
assert.equal(new Set(projects.map(p => p.id)).size, projects.length, 'Project IDs must be unique');
for (const project of projects) {
  for (const key of ['id', 'title', 'category', 'format', 'image', 'alt', 'description']) assert(project[key], `${project.id}: missing ${key}`);
  assert(['image', 'gallery', 'video', 'pdf'].includes(project.type), `${project.id}: invalid type`);
  if (project.type === 'gallery') assert(project.images?.length > 1, 'Gallery needs multiple images');
  else assert(project.source, `${project.id}: missing source`);
  for (const path of [project.image, project.source, ...(project.images || [])].filter(Boolean)) localAssets.add(path);
}
for (const [group, entries] of [['testimonials', testimonials], ['certificates', certificates]]) {
  assert(entries.length > 0, `${group} must contain entries`);
  assert.equal(new Set(entries.map(item => item.id)).size, entries.length, `${group}: IDs must be unique`);
  for (const item of entries) {
    for (const key of ['id', 'title', 'image', 'alt', ...(group === 'testimonials' ? ['quote', 'attribution'] : ['issuer', 'date', 'description', 'source'])]) assert(item[key], `${item.id}: missing ${key}`);
    localAssets.add(item.image);
    if (item.source) localAssets.add(item.source);
  }
}
for (const path of localAssets) assert(existsSync(resolve(root, path)), `Missing asset: ${path}`);
assert(!/placeholder|coming soon|css\/style\.css|js\/main\.js/i.test(html), 'Remove unfinished content and stale paths');
console.log(`Verified ${projects.length} projects, ${testimonials.length} testimonials, ${certificates.length} certificates, ${localAssets.size} local asset paths, unique IDs, navigation anchors, and JavaScript syntax.`);
