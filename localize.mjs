import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const BASE = 'https://hellogithub.com';
const RAW = path.join(ROOT, 'raw.html');
const SITE = path.join(ROOT, 'site');
const ASSETS = path.join(SITE, 'assets');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';

const SKIP = /(google-analytics|googletagmanager|gtag\/js|hm\.baidu\.com|sentry|umami|clarity\.ms|hotjar|doubleclick)/i;
const EXT_BY_TYPE = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'image/avif': '.avif', 'font/woff2': '.woff2', 'font/woff': '.woff', 'text/css': '.css', 'application/javascript': '.js', 'text/javascript': '.js' };

let html = await fs.readFile(RAW, 'utf8');
await fs.mkdir(ASSETS, { recursive: true });

const map = new Map();
const downloaded = new Map();
const used = new Set();
let fail = 0, ok = 0;

function rawToAbs(raw) {
  if (/^(data:|blob:|mailto:|tel:|javascript:|#)/i.test(raw)) return null;
  if (raw.startsWith('//')) return 'https:' + raw;
  if (raw.startsWith('/')) return BASE + raw;
  if (/^https?:/i.test(raw)) return raw;
  return BASE + '/' + raw;
}

function localName(absUrl, contentType) {
  const u = new URL(absUrl);
  if (/\/_next\/image/.test(u.pathname)) {
    const inner = u.searchParams.get('url') || '';
    const ext = path.extname(inner) || EXT_BY_TYPE[contentType] || '.jpg';
    return 'img-' + crypto.createHash('sha1').update(absUrl).digest('hex').slice(0, 12) + ext;
  }
  let ext = path.extname(u.pathname);
  if (!ext || ext.length > 6) ext = EXT_BY_TYPE[contentType] || '';
  let base = path.basename(u.pathname, path.extname(u.pathname)) || 'file';
  base = base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 60);
  let name = base + ext;
  if (used.has(name)) name = base + '-' + crypto.createHash('sha1').update(absUrl).digest('hex').slice(0, 8) + ext;
  return name;
}

async function download(absUrl, depth) {
  depth = depth || 0;
  if (downloaded.has(absUrl)) return downloaded.get(absUrl);
  if (SKIP.test(absUrl)) { downloaded.set(absUrl, null); return null; }
  try {
    const res = await fetch(absUrl, { headers: { 'user-agent': UA, referer: BASE + '/' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const ct = (res.headers.get('content-type') || '').split(';')[0].trim();
    const buf = Buffer.from(await res.arrayBuffer());
    const name = localName(absUrl, ct);
    used.add(name);
    const file = path.join(ASSETS, name);
    await fs.writeFile(file, buf);
    downloaded.set(absUrl, './assets/' + name);
    ok++;
    if (ct.includes('text/css') && depth < 2) {
      let css = buf.toString('utf8');
      const urls = [...css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map(m => m[1]);
      for (const u of urls) {
        if (/^(data:|#)/i.test(u)) continue;
        const abs = new URL(u, absUrl).href;
        const rep = await download(abs, depth + 1);
        if (rep) css = css.split(u).join(rep.replace('./assets/', './'));
      }
      await fs.writeFile(file, css);
    }
    return './assets/' + name;
  } catch (e) {
    fail++;
    console.log('  下载失败:', absUrl, e.message);
    downloaded.set(absUrl, null);
    return null;
  }
}

const patterns = [
  /<link[^>]+href="([^"]+)"/g,
  /<script[^>]+src="([^"]+)"/g,
  /<img[^>]+src="([^"]+)"/g,
  /<source[^>]+src="([^"]+)"/g,
  /srcset="([^"]+)"/g
];
const found = new Set();
for (const re of patterns) {
  for (const m of html.matchAll(re)) {
    if (re.source.includes('srcset')) {
      m[1].split(',').forEach(part => { const u = part.trim().split(/\s+/)[0]; if (u) found.add(u); });
    } else found.add(m[1]);
  }
}
for (const m of html.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) found.add(m[1]);

for (const raw of found) {
  const abs = rawToAbs(raw);
  if (!abs) continue;
  const isAsset = /\.(css|js|png|jpe?g|svg|webp|gif|ico|woff2?|json|avif|mp4|webm)($|\?)/i.test(abs) || abs.includes('_next/image') || abs.includes('/favicon/');
  if (!isAsset) { map.set(raw, abs); continue; }
  const rep = await download(abs);
  map.set(raw, rep || '');
}

const keys = [...map.keys()].sort((a, b) => b.length - a.length);
for (const k of keys) html = html.split(k).join(map.get(k));

html = html.replace(/<script[^>]+src=""[^>]*><\/script>/g, '');
html = html.replace(/<link[^>]+href=""/g, '');
html = html.replace(/<script[^>]+(google-analytics|googletagmanager|hm\.baidu|sentry)[^>]*><\/script>/gi, '');
html = html.replace(/<script[^>]+src="\.\/assets\/[^"]*(chunks|_buildManifest|_ssgManifest|polyfills)[^"]*"[^>]*><\/script>/g, '');
html = html.replace(/<\/body>/, '<footer style="text-align:center;padding:16px;font-size:12px;color:#888">本页为个人学习用的静态复刻，内容来源：<a href="https://hellogithub.com/">HelloGitHub</a></footer></body>');

await fs.writeFile(path.join(SITE, 'index.html'), html);
console.log('完成：成功下载 ' + ok + ' 个资源，失败 ' + fail + ' 个，改写引用 ' + map.size + ' 处');
