import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.mov': 'video/quicktime' };
const server = createServer(async (req, res) => {
  const reply = (status, text) => { res.writeHead(status, { 'Content-Type': 'text/plain' }); res.end(text); };
  if (!['GET', 'HEAD'].includes(req.method)) return reply(405, 'Method not allowed');
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const requested = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!requested.startsWith(root + sep) || pathname.split('/').some(part => part.startsWith('.'))) return reply(403, 'Forbidden');
    const path = await realpath(requested);
    if (!path.startsWith(root + sep)) return reply(403, 'Forbidden');
    const info = await stat(path);
    if (!info.isFile()) return reply(404, 'Not found');
    res.setHeader('Content-Type', types[extname(path).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    let start = 0, end = info.size - 1;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.setHeader('Content-Range', `bytes */${info.size}`); return reply(416, 'Invalid range'); }
      if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      if (start > end || start >= info.size) { res.setHeader('Content-Range', `bytes */${info.size}`); return reply(416, 'Invalid range'); }
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
    }
    res.setHeader('Content-Length', Math.max(0, end - start + 1));
    if (req.method === 'HEAD' || info.size === 0) return res.end();
    const stream = createReadStream(path, { start, end });
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch (error) { reply(error instanceof URIError ? 400 : 404, 'File not found'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(Number(process.env.PORT || 8000), '127.0.0.1', () => console.log(`Portfolio preview: http://localhost:${server.address().port}`));
