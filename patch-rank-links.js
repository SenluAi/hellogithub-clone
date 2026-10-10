const fs = require('fs'), path = require('path');
const root = 'C:/Users/Mr Li/Desktop/hellogithub-clone/site';
let files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) files.push(p); } })(root);
let changed = 0, hits = 0;
for (const p of files) {
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  s = s.replace(/(\.\.?\/)?rank\/index\.html#monthly/g, (m, pre) => { hits++; return (pre || '') + 'rank/monthly.html'; });
  s = s.replace(/(\.\.?\/)?rank\/index\.html#yearly/g, (m, pre) => { hits++; return (pre || '') + 'rank/yearly.html'; });
  if (s !== before) { fs.writeFileSync(p, s); changed++; console.log('更新 ' + p.replace(root, '')); }
}
console.log('改动文件 ' + changed + ' 个，替换锚点链接 ' + hits + ' 处');
