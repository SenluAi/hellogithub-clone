const fs = require('fs');
const path = require('path');
const base = 'C:/Users/Mr Li/Desktop/hellogithub-clone';
const siteDir = path.join(base, 'site');
const tagDir = path.join(siteDir, 'tag');
fs.mkdirSync(tagDir, { recursive: true });
const details = JSON.parse(fs.readFileSync(path.join(base, 'details.json'), 'utf8'));

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fileOf = key => key.replace('/', '__') + '.html';
const asciiSlug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// 1) 收集标签
const tagMap = {}; // name -> {slug, name_en, items:[]}
let n = 0;
const usedSlug = {};
for (const [key, r] of Object.entries(details)) {
  for (const t of (r.tags || [])) {
    if (!tagMap[t.name]) {
      let slug = asciiSlug(t.name_en) || asciiSlug(t.name);
      if (!slug) slug = 'tag-' + String(++n).padStart(2, '0');
      while (usedSlug[slug]) slug = slug + '-2';
      usedSlug[slug] = 1;
      tagMap[t.name] = { slug, name_en: t.name_en || '', items: [] };
    }
    tagMap[t.name].items.push(key);
  }
}
const tagNames = Object.keys(tagMap).sort((a, b) => tagMap[b].items.length - tagMap[a].items.length || a.localeCompare(b, 'zh'));

const css = `*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#1f2430;font:15px/1.75 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:28px 20px 60px}
.back{display:inline-block;margin-bottom:18px;color:#2563eb;text-decoration:none;font-size:14px}
a{color:#2563eb;text-decoration:none}
h1{font-size:24px;margin:0 0 6px}
.sub{color:#6b7280;font-size:14px;margin-bottom:18px}
.item{display:block;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 18px;margin:12px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.item:hover{border-color:#93c5fd}
.item .t{font-size:17px;font-weight:600;color:#111827}
.item .rn{color:#6b7280;font-size:12px;font-family:ui-monospace,Consolas,monospace;margin-top:2px}
.item .d{color:#374151;font-size:14px;margin-top:6px}
.item .m{color:#6b7280;font-size:12px;margin-top:8px}
.grid{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.chip{padding:6px 14px;border-radius:999px;background:#fff;border:1px solid #e5e7eb;color:#1f2937;font-size:14px}
.chip:hover{border-color:#93c5fd}
.chip b{color:#2563eb;font-weight:600}`;

// 2) 每个标签一张标签页
for (const name of tagNames) {
  const t = tagMap[name];
  const items = t.items.map(k => details[k]).sort((a, b) => (b.stars || 0) - (a.stars || 0));
  const list = items.map(r => `  <a class="item" href="../repo/${fileOf(r.full_name)}">
    <div class="t">${esc(r.title || r.name)}</div>
    <div class="rn">${esc(r.full_name)}</div>
    <div class="d">${esc(r.description || r.summary || '')}</div>
    <div class="m">${esc(r.primary_lang || '')} · ★ ${esc(r.stars_str || '')}</div>
  </a>`).join('\n');
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>标签：${esc(name)}（${items.length} 个项目）| HelloGitHub 离线版</title>
<link rel="icon" href="../assets/favicon.svg"/>
<style>${css}</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="../index.html">← 返回首页</a>
  <h1>标签：${esc(name)}${t.name_en ? `（${esc(t.name_en)}）` : ''}</h1>
  <div class="sub">共 ${items.length} 个项目 · <a href="./index.html">全部标签</a></div>
${list}
  <p class="sub" style="margin-top:24px">本页为离线镜像的站内标签页，详细介绍点进项目详情页。</p>
</div>
</body>
</html>`;
  fs.writeFileSync(path.join(tagDir, t.slug + '.html'), html);
}
console.log('生成标签页:', tagNames.length, '| 标签样例:', tagNames.slice(0, 5).map(x => x + '→' + tagMap[x].slug).join(' '));

// 3) 标签索引页
const chips = tagNames.map(name => `  <a class="chip" href="./${tagMap[name].slug}.html">${esc(name)} <b>${tagMap[name].items.length}</b></a>`).join('\n');
fs.writeFileSync(path.join(tagDir, 'index.html'), `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>全部标签 | HelloGitHub 离线版</title>
<link rel="icon" href="../assets/favicon.svg"/>
<style>${css}</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="../index.html">← 返回首页</a>
  <h1>全部标签</h1>
  <div class="sub">共 ${tagNames.length} 个标签，数字是该标签下的项目数</div>
  <div class="grid">
${chips}
  </div>
</div>
</body>
</html>`);
console.log('生成标签索引: tag/index.html');

// 4) 详情页里的标签改为站内标签页
let dFixed = 0, dMiss = [];
for (const key of Object.keys(details)) {
  const f = path.join(siteDir, 'repo', fileOf(key));
  let html = fs.readFileSync(f, 'utf8');
  html = html.replace(/<a href="\.\.\/index\.html">([^<]+)<\/a>/g, (m, name) => {
    const t = tagMap[name.trim()];
    if (t) { dFixed++; return `<a href="../tag/${t.slug}.html">${name}</a>`; }
    dMiss.push(name);
    return m;
  });
  // 标签区后补一个「全部标签」入口
  html = html.replace(/<h2>标签<\/h2>/, '<h2>标签（<a href="../tag/index.html">全部标签</a>）</h2>');
  fs.writeFileSync(f, html);
}
console.log('详情页标签改为站内:', dFixed, '| 未匹配:', dMiss.join(', ') || '无');

// 5) 首页侧栏「热门标签」改指向站内标签页
const idxPath = path.join(siteDir, 'index.html');
let idx = fs.readFileSync(idxPath, 'utf8');
let sFixed = 0, sMiss = [];
idx = idx.replace(/<a([^>]*?)href="#"([^>]*?)data-daisy-tag="1"([^>]*?)><span class="truncate text-sm">([^<]+)<\/span><\/a>/g,
  (m, a, b, c, name) => {
    const t = tagMap[name.trim()];
    if (t) { sFixed++; return `<a${a}href="./tag/${t.slug}.html"${b}data-daisy-tag="1"${c}><span class="truncate text-sm">${name}</span></a>`; }
    sMiss.push(name);
    return m;
  });
idx = idx.replace('<div class="ml-1 font-medium">热门标签</div>', '<a href="./tag/index.html" class="ml-1 font-medium">热门标签 →</a>');
fs.writeFileSync(idxPath, idx);
console.log('首页侧栏标签改站内:', sFixed, '| 未匹配:', sMiss.join(', ') || '无');
