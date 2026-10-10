const fs = require('fs');
const path = require('path');

// 1. 看 details.json 字段
try {
  const raw = fs.readFileSync('details.json', 'utf8');
  const d = JSON.parse(raw);
  const arr = Array.isArray(d) ? d : (d.items || d.repos || d.details || []);
  console.log('details count =', arr.length);
  console.log('keys =', Object.keys(arr[0] || {}).join(', '));
  console.log('sample =', JSON.stringify(arr[0]).slice(0, 500));
  const shared = arr.filter(x => x && x.share_user).length;
  console.log('with share_user =', shared);
  if (arr[0] && arr[0].share_user) console.log('share_user sample =', JSON.stringify(arr[0].share_user));
} catch (e) {
  console.log('details.json error: ' + e.message);
}

// 2. 详情页 HTML 里有没有用户主页链接
const dirs = ['detail-raw', 'detail-raw2'];
let found = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html')).slice(0, 3);
  for (const f of files) {
    const h = fs.readFileSync(path.join(dir, f), 'utf8');
    const links = (h.match(/href="[^"]*"/g) || []).filter(u => /user|profile|author|share/i.test(u));
    console.log('FILE', dir + '/' + f, '->', links.slice(0, 6).join(' | ') || 'no user-like link');
    found++;
  }
}
console.log('checked files =', found);

// 3. 站内现有页面类型
for (const d of ['site', 'site/repo', 'site/tag', 'site/rank', 'site/periodical', 'site/article', 'site/list', 'site/page']) {
  try {
    const n = fs.readdirSync(d);
    console.log('DIR', d, 'files =', n.length, n.slice(0, 4).join(','));
  } catch (e) {
    console.log('DIR', d, 'missing');
  }
}
