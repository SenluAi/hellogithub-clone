const fs = require('fs');
const files = ['site/user/8MKvZoxaWt.html', 'site/login/index.html', 'site/list/index.html', 'site/rank/index.html', 'site/repo/index.html'];
for (const f of files) {
  if (!fs.existsSync(f)) { console.log('== ' + f + ' 不存在'); continue; }
  const s = fs.readFileSync(f, 'utf8');
  console.log('\n=== ' + f + ' len=' + s.length);
  let i = s.indexOf('login/index.html');
  while (i !== -1) {
    console.log('  ...' + s.slice(Math.max(0, i - 260), i + 120).replace(/\s+/g, ' '));
    i = s.indexOf('login/index.html', i + 1);
    if (i > 0 && s.slice(0, i).split('login/index.html').length > 4) break;
  }
  const hasState = s.includes('login-state');
  console.log('  含 login-state:', hasState);
  const j = s.indexOf('/api/me');
  if (j !== -1) console.log('  /api/me 上下文: ' + s.slice(Math.max(0, j - 400), j + 400).replace(/\s+/g, ' '));
}
