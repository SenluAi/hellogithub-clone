const https = require('https');
const fs = require('fs');
const base = 'https://hellogithub.senlinlu.cn';
const files = fs.readdirSync('site/assets/avatars');
const pages = ['/user/', '/user/8MKvZoxaWt.html', '/user/8adohGgCW07fknL.html'];
function head(p) {
  return new Promise(res => {
    const req = https.request(base + p, { method: 'GET', headers: { 'user-agent': 'Mozilla/5.0' } }, r => {
      let len = 0; r.on('data', c => len += c.length);
      r.on('end', () => res({ p, status: r.statusCode, len, type: r.headers['content-type'] }));
    });
    req.on('error', e => res({ p, status: 'ERR ' + e.message, len: 0 }));
    req.end();
  });
}
(async () => {
  const urls = pages.concat(files.map(f => '/assets/avatars/' + encodeURIComponent(f)));
  const out = [];
  for (const u of urls) out.push(await head(u));
  const bad = out.filter(o => o.status !== 200 || !/image|html/i.test(o.type || ''));
  console.log('checked =', out.length, ' bad =', bad.length);
  bad.forEach(o => console.log(o.status, o.type, o.len, o.p));
  // 抽样打印用户页里头像引用
  const r = await new Promise(res => {
    https.get(base + '/user/8adohGgCW07fknL.html', { headers: { 'user-agent': 'Mozilla/5.0' } }, x => {
      let b = ''; x.on('data', c => b += c); x.on('end', () => res(b));
    });
  });
  const imgs = [...r.matchAll(/<img[^>]*>/gi)].map(m => m[0]).filter(t => /avatar/i.test(t)).slice(0, 4);
  console.log('--- user page avatar imgs ---');
  imgs.forEach(t => console.log(t.slice(0, 200)));
})();
