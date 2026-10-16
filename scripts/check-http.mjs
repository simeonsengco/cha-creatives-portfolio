import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const base = 'http://127.0.0.1:8000';
const projects = runInNewContext(readFileSync(new URL('../portfolio-data.js', import.meta.url), 'utf8') + '; PORTFOLIO');
const proofs = runInNewContext(readFileSync(new URL('../trust-data.js', import.meta.url), 'utf8') + '; [...TESTIMONIALS, ...CERTIFICATES]');
const paths = new Set(['index.html', 'style.css', 'main.js', 'portfolio-data.js', 'trust-data.js', 'src/CC Resume.pdf', 'assets/previews/cc-profile.jpg']);
for (const project of projects) for (const path of [project.image, project.source, ...(project.images || [])].filter(Boolean)) paths.add(path);
for (const proof of proofs) for (const path of [proof.image, proof.source].filter(Boolean)) paths.add(path);
for (const path of paths) {
  const response = await fetch(`${base}/${path.split('/').map(encodeURIComponent).join('/')}`, { method: 'HEAD' });
  assert.equal(response.status, 200, path);
  assert(Number(response.headers.get('content-length')) > 0, `Empty asset: ${path}`);
}
for (const project of projects.filter(p => p.type === 'video')) {
  const response = await fetch(`${base}/${project.source.split('/').map(encodeURIComponent).join('/')}`, { headers: { Range: 'bytes=0-1023' } });
  assert.equal(response.status, 206, project.id);
  assert.equal(response.headers.get('content-type'), 'video/mp4');
  assert.equal((await response.arrayBuffer()).byteLength, 1024);
}
assert.equal((await fetch(`${base}/missing-file.jpg`)).status, 404);
assert.equal((await fetch(`${base}/.env`)).status, 403);
console.log(`HTTP checks passed: ${paths.size} files, byte-range streaming for all ${projects.filter(p => p.type === 'video').length} videos, and missing/hidden file handling.`);
