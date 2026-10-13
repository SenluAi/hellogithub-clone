const fs = require('fs');
const path = require('path');
const rawDir = path.join(__dirname, 'detail-raw');
const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.html'));
const out = {};
let firstKeys = null;
for (const f of files) {
  const t = fs.readFileSync(path.join(rawDir, f), 'utf8');
  const m = t.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) { console.log('无数据:', f); continue; }
  let d;
  try { d = JSON.parse(m[1]); } catch (e) { console.log('解析失败:', f); continue; }
  const repo = d.props && d.props.pageProps && d.props.pageProps.repo;
  if (!repo) { console.log('无 repo:', f); continue; }
  if (!firstKeys) firstKeys = Object.keys(repo);
  out[repo.full_name || f.replace('.html', '').replace('__', '/')] = {
    name: repo.name, full_name: repo.full_name, url: repo.url,
    author: repo.author, description: repo.description, summary: repo.summary,
    primary_lang: repo.primary_lang, lang_color: repo.lang_color,
    stars_str: repo.stars_str, tags: repo.tags || repo.categories || null,
    share_user: repo.share_user ? repo.share_user.nickname : null,
    title: repo.title || repo.display_name || null
  };
}
fs.writeFileSync(path.join(__dirname, 'details.json'), JSON.stringify(out, null, 1));
console.log('raw 文件', files.length, '| 提取到', Object.keys(out).length);
console.log('repo 字段:', (firstKeys || []).join(', '));
const k = Object.keys(out)[1] || Object.keys(out)[0];
console.log('样本:', JSON.stringify(out[k]).slice(0, 600));
