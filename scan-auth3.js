const fs = require('fs'), path = require('path');
let files = [];
function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) files.push(p); } }
walk('site');
const groups = {};
const list = [];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const has = s.includes('login/index.html');
  const hasMe = s.includes('/api/me');
  const hasLoginLinkWithText = /登录 \/ 注册|登录\/注册|登录<\/a>/.test(s);
  if (has || hasMe) list.push(f + ' login=' + has + ' apiMe=' + hasMe);
  const dir = path.dirname(f).split(path.sep).slice(0, 2).join('/');
  if (has) groups[dir] = (groups[dir] || 0) + 1;
}
console.log('按目录统计 login 入口:', JSON.stringify(groups, null, 1));
console.log('总文件列表数:', list.length);
console.log(list.slice(0, 15).join('\n'));
// 检查每个 html 的导航栏是否含"登录"字样
let nav = {};
for (const f of files) { const s = fs.readFileSync(f, 'utf8'); const m = s.match(/登录[^<]{0,12}/g); const dir = path.dirname(f).split(path.sep).slice(0, 2).join('/'); nav[dir] = nav[dir] || new Set(); (m || []).forEach(x => nav[dir].add(x.slice(0, 8))); }
console.log('各目录"登录"文案:', JSON.stringify(Object.fromEntries(Object.entries(nav).map(([k, v]) => [k, [...v].slice(0, 5)])), null, 1));
