/**
 * 为榜单/全部项目里的每个仓库生成站内详情页（已存在的不覆盖）
 * 数据：api-all.json + api-rank.json + rank-ym-data.json + details.json
 */
const fs = require('fs');
const path = require('path');
const BASE = __dirname;
const SITE = path.join(BASE, 'site');
const OUT = path.join(SITE, 'repo');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fileOf = k => k.replace('/', '__') + '.html';

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
.note{color:#6b7280;font-size:13px;margin-top:22px}
h2{font-size:16px;margin:26px 0 8px}
.related a{display:inline-block;margin:4px 8px 0 0;padding:4px 12px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:13px;text-decoration:none}`;

const all = JSON.parse(fs.readFileSync(path.join(BASE, 'api-all.json'), 'utf8'));
const rankSimple = JSON.parse(fs.readFileSync(path.join(BASE, 'api-rank.json'), 'utf8'));
const ym = JSON.parse(fs.readFileSync(path.join(BASE, 'rank-ym-data.json'), 'utf8'));
const details = JSON.parse(fs.readFileSync(path.join(BASE, 'details.json'), 'utf8'));

const items = new Map();
function add(x) {
  if (!x || !x.full_name) return;
  const cur = items.get(x.full_name);
  if (!cur) { items.set(x.full_name, x); return; }
  const score = o => ['title', 'summary', 'summary_en', 'primary_lang', 'clicks_total', 'updated_at', 'author'].filter(k => o[k]).length;
  if (score(x) > score(cur)) items.set(x.full_name, Object.assign({}, cur, x));
}
all.forEach(add);
Object.values(ym.months).forEach(o => (o.items || []).forEach(add));
Object.values(ym.years).forEach(o => (o.items || []).forEach(add));
['monthly', 'yearly', 'weekly'].forEach(k => (rankSimple[k] || []).forEach(add));

// full_name -> 月份键 / 年份
const monthOf = {}, yearOf = {};
Object.keys(ym.months).sort().forEach(k => (ym.months[k].items || []).forEach(x => { if (!monthOf[x.full_name]) monthOf[x.full_name] = k; }));
Object.keys(ym.years).sort().forEach(k => (ym.years[k].items || []).forEach(x => { if (!yearOf[x.full_name]) yearOf[x.full_name] = k; }));

fs.mkdirSync(OUT, { recursive: true });
let built = 0, skipped = 0;
for (const [key, x] of items) {
  const file = path.join(OUT, fileOf(key));
  if (fs.existsSync(file)) { skipped++; continue; }
  const d = details[key] || null;
  const title = (d && d.summary ? (x.title || x.name) : (x.title || x.name)) || key;
  const langColor = x.lang_color || (d && d.lang_color) || '#9ca3af';
  const lang = x.primary_lang || (d && d.primary_lang) || '';
  const updated = (x.updated_at || '').slice(0, 10);
  const rel = [];
  if (monthOf[key]) rel.push(`<a href="../rank/monthly-${monthOf[key]}.html">${monthOf[key].slice(0, 4)} 年 ${Number(monthOf[key].slice(5))} 月月度榜</a>`);
  if (yearOf[key]) rel.push(`<a href="../rank/yearly-${yearOf[key]}.html">${yearOf[key]} 年度榜</a>`);
  const body = `  <a class="back" href="../index.html">← 返回首页</a>
  <h1>${esc(title)}</h1>
  <div class="repo">${esc(key)}</div>
  <div class="meta">
    <span>作者 ${esc(x.author || key.split('/')[0])}</span>
    ${lang ? `<span><i style="background:${esc(langColor)}"></i>${esc(lang)}</span>` : ''}
    <span>★ ${esc((d && d.stars_str) || '-')}</span>
    <span>Fork ${esc((d && d.forks_str) || '-')}</span>
    <span>最近更新 ${esc(updated)}</span>
    ${x.clicks_total ? `<span>${esc(x.clicks_total)} 次浏览</span>` : ''}
  </div>
  <div class="card">
    ${(x.summary_en || (d && d.description)) ? `<p class="desc">${esc(x.summary_en || (d && d.description))}</p>` : ''}
    <p class="summary">${esc(x.summary || (d && d.summary) || '暂无中文简介')}</p>
  </div>
${rel.length ? `  <h2>所属榜单</h2>\n  <div class="related">${rel.join('')}</div>\n` : ''}  <h2>项目源码</h2>
  <p><a class="src" href="https://github.com/${esc(key)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-size:14px">在 GitHub 上查看 ${esc(key)} ↗</a></p>
  <p class="note">本页内容整理自 HelloGitHub 的公开项目介绍，仅供学习与浏览。</p>`;
  fs.writeFileSync(file, `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)} · ${esc(key)} | HelloGitHub</title>
<link rel="icon" href="../assets/favicon.svg"/>
<style>${css}</style>
</head>
<body>
<div class="wrap">
${body}
</div>
</body>
</html>`);
  built++;
}
console.log('仓库总数 ' + items.size + '，新生成详情页 ' + built + '，已存在跳过 ' + skipped);
