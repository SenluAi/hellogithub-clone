const fs = require('fs');
const path = require('path');
const base = 'C:/Users/Mr Li/Desktop/hellogithub-clone';
const details = JSON.parse(fs.readFileSync(path.join(base, 'details.json'), 'utf8'));
const siteDir = path.join(base, 'site');
const repoDir = path.join(siteDir, 'repo');
fs.mkdirSync(repoDir, { recursive: true });

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fileOf = key => key.replace('/', '__') + '.html';

const slug2uid = {};
try {
  const su = JSON.parse(fs.readFileSync(path.join(base, 'share-users.json'), 'utf8'));
  Object.keys(su).forEach(u => (su[u].items || []).forEach(it => { slug2uid[it.slug] = u; }));
} catch (e) { }


const css = `*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#1f2430;font:15px/1.75 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:28px 20px 60px}
.back{display:inline-block;margin-bottom:18px;color:#2563eb;text-decoration:none;font-size:14px}
.back:hover{text-decoration:underline}
h1{font-size:26px;line-height:1.35;margin:0 0 6px}
.repo{color:#6b7280;font-size:14px;font-family:ui-monospace,Consolas,monospace}
.meta{margin:16px 0 20px;display:flex;flex-wrap:wrap;gap:8px 16px;color:#4b5563;font-size:13px}
.meta i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:middle}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px 20px;margin:16px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.desc{font-weight:600;margin:0 0 10px;color:#111827}
.summary{margin:0;color:#374151}
.tags a{display:inline-block;margin:4px 8px 0 0;padding:2px 10px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:12px;text-decoration:none}
.btn{display:inline-block;padding:10px 20px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600}
.btn:hover{background:#1d4ed8}
.note{color:#6b7280;font-size:13px;margin-top:22px}
h2{font-size:16px;margin:26px 0 8px}`;

let built = 0;
const made = {};
for (const [key, r] of Object.entries(details)) {
  const tags = (r.tags || []).map(t => `<a href="../index.html">${esc(t.name)}</a>`).join('');
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(r.title || r.name)} · ${esc(r.full_name)} | HelloGitHub</title>
<link rel="icon" href="../assets/favicon.svg"/>
<style>${css}</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="../index.html">← 返回首页</a>
  <h1>${esc(r.title || r.name)}</h1>
  <div class="repo">${esc(r.full_name)}</div>
  <div class="meta">
    <span>作者 ${esc(r.author)}</span>
    <span><i style="background:${esc(r.lang_color || '#999')}"></i>${esc(r.primary_lang)}</span>
    <span>★ ${esc(r.stars_str)}</span>
    <span>Fork ${esc(r.forks || '-')}</span>
    <span>最近更新 ${esc((r.updated_at || '').slice(0, 10))}</span>
    ${r.share_user ? (() => { const suObj = (typeof r.share_user === 'object') ? r.share_user : null; const nm = suObj ? suObj.nickname : r.share_user; const u = (suObj && suObj.uid) || slug2uid[key]; return u ? `<span>推荐人 <a href="../user/${u}.html" style="color:#2563eb;text-decoration:none">${esc(nm)}</a></span>` : `<span>推荐人 ${esc(nm)}</span>`; })() : ''}
  </div>
  <div class="card">
    <p class="desc">${esc(r.description || '')}</p>
    <p class="summary">${esc(r.summary || '暂无中文介绍')}</p>
  </div>
  ${tags ? `<h2>标签</h2><div class="tags">${tags}</div>` : ''}
  <h2>项目源码</h2>
  <p><a class="btn" href="${esc(r.url)}" target="_blank" rel="noopener">在 GitHub 上查看 ↗</a></p>
  <p class="note">本页介绍内容来自 HelloGitHub 公开页面；README 与源码请点上方按钮前往 GitHub 查看。</p>
</div>
</body>
</html>`;
  fs.writeFileSync(path.join(repoDir, fileOf(key)), html);
  made[key] = fileOf(key);
  built++;
}
console.log('生成详情页:', built);

const idxPath = path.join(siteDir, 'index.html');
let idx = fs.readFileSync(idxPath, 'utf8');
let linked = 0, missed = [];
idx = idx.replace(/<a([^>]*?)href="(https:\/\/github\.com\/[^"]+)"/g, function (m, pre, url) {
  const key = url.replace('https://github.com/', '').replace(/\/$/, '');
  if (made[key]) {
    if (made[key]) { linked++; return '<a' + pre + 'href="./repo/' + made[key] + '" data-card="1"'; }
  }
  missed.push(key);
  return m;
});
idx = idx.replace(/a\[href\^="https:\/\/github\.com\/"\]/g, 'a[data-card]');
fs.writeFileSync(idxPath, idx);
console.log('卡片改为站内详情页:', linked, '| 未匹配(保留原样):', missed.length, missed.join(', '));
console.log('筛选脚本已指向站内卡片:', idx.includes('a[data-card]'));
