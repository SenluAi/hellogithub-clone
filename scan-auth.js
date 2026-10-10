const fs = require('fs'), path = require('path');
let files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
}
walk('site');
const withLoginState = [], withLoginLink = [];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes('hg-login-state')) withLoginState.push(f);
  if (s.includes('login/index.html')) withLoginLink.push(f);
}
console.log('html total =', files.length);
console.log('含 hg-login-state =', withLoginState.length, withLoginState.slice(0, 5).join(' | '));
console.log('含 login/index.html 链接 =', withLoginLink.length);
console.log('根目录结构:', fs.readdirSync('.').filter(x => !/^site$/.test(x)).join(' '));
console.log('site 目录:', fs.readdirSync('site').join(' '));
