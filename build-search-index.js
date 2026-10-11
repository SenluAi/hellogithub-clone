/** 重建站内搜索索引（覆盖全部站内项目详情页） */
const fs = require('fs'), path = require('path');
const BASE = __dirname;
const SITE = path.join(BASE, 'site');
const REPO = path.join(SITE, 'repo');
const ym = JSON.parse(fs.readFileSync(path.join(BASE, 'rank-ym-data.json'), 'utf8'));
const all = JSON.parse(fs.readFileSync(path.join(BASE, 'api-all.json'), 'utf8'));
const meta = new Map();
const put = x => { if (x && x.full_name && !meta.has(x.full_name)) meta.set(x.full_name, x); };
all.forEach(put);
Object.values(ym.months).forEach(o => (o.items || []).forEach(put));
Object.values(ym.years).forEach(o => (o.items || []).forEach(put));
const fileOf = k => k.replace('/', '__') + '.html';
const data = [];
for (const f of fs.readdirSync(REPO)) {
  const key = f.replace(/\.html$/, '').replace('__', '/');
  const x = meta.get(key) || {};
  const title = x.title || x.name || key;
  data.push({
    f: 'repo/' + f,
    t: title + ' · ' + key + ' | HelloGitHub',
    h: title,
    s: x.summary || '',
    g: [x.primary_lang || '', key.split('/')[0]].filter(Boolean).join(' '),
  });
}
data.sort((a, b) => a.h.localeCompare(b.h, 'zh'));
const p = path.join(SITE, 'search', 'index.html');
let s = fs.readFileSync(p, 'utf8');
const start = s.indexOf('var DATA = [');
const end = s.indexOf('\n', start);
if (start < 0 || end < 0) throw new Error('未找到 DATA 行');
s = s.slice(0, start) + 'var DATA = ' + JSON.stringify(data) + ';' + s.slice(end);
fs.writeFileSync(p, s);
console.log('搜索索引已重建：' + data.length + ' 个站内详情页，文件 ' + Math.round(s.length / 1024) + ' KB');
