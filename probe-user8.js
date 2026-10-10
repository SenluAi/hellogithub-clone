const fs = require('fs');

(async () => {
  // 1. 下载 _app chunk，寻找 bf 的定义（API base 拼接）
  const r = await fetch('https://hellogithub.com/_next/static/chunks/pages/_app-f7e7cb412abfe138.js', { headers: { 'user-agent': 'Mozilla/5.0' } });
  const t = await r.text();
  fs.writeFileSync('chunk-_app.js', t);
  console.log('app chunk len =', t.length);
  ['bf', 'baseURL', '/api', 'hellogithub.com/', 'fetch('].forEach(kw => {
    let i = t.indexOf(kw), c = 0;
    while (i >= 0 && c < 3) {
      console.log('  [' + kw + '] ...' + t.slice(Math.max(0, i - 150), i + 150).replace(/\s+/g, ' ') + '...');
      i = t.indexOf(kw, i + 1); c++;
    }
  });

  // 2. 候选接口探测
  const uid = '8MKvZoxaWt';
  const cands = [
    'https://hellogithub.com/api/favorite/options/',
    'https://hellogithub.com/api/user/' + uid + '/',
    'https://hellogithub.com/api/user/' + uid + '/share/',
    'https://hellogithub.com/api/user/' + uid + '/favorite/',
    'https://hellogithub.com/api/user/' + uid + '/dynamic/',
    'https://hellogithub.com/api/user/' + uid + '/info/'
  ];
  for (const u of cands) {
    try {
      const rr = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
      const tt = await rr.text();
      console.log('PROBE', u, '->', rr.status, tt.slice(0, 160).replace(/\s+/g, ' '));
    } catch (e) {
      console.log('PROBE', u, 'ERR', e.message);
    }
    await new Promise(r => setTimeout(r, 250));
  }
})();
