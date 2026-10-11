const fs = require('fs');
const dir = 'site/repo';
let n = 0;
const list = [];
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.html')) continue;
  const s = fs.readFileSync(dir + '/' + f, 'utf8');
  if (s.indexOf('https://github.com/') >= 0) continue;
  n++;
  list.push(f);
  if (n <= 3) {
    console.log('=== ' + f);
    const i = s.indexOf('项目源码');
    console.log(i < 0 ? '无“项目源码”段' : s.slice(i - 10, i + 220).replace(/\s+/g, ' '));
  }
}
console.log('共 ' + n + ' 个：' + list.slice(0, 10).join(', '));
