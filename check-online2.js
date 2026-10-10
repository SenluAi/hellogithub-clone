const https = require('https');
const base = 'https://hellogithub.senlinlu.cn';
function get(p, depth = 0) {
  return new Promise(res => {
    https.get(base + p, { headers: { 'user-agent': 'Mozilla/5.0' } }, r => {
      if ([301, 302, 307, 308].includes(r.statusCode) && r.headers.location && depth < 5) {
        const loc = r.headers.location;
        r.resume();
        return res(get(loc.startsWith('http') ? loc.replace(base, '') : loc, depth + 1).then(x => ({ ...x, chain: [r.statusCode + ' -> ' + loc].concat(x.chain || []) })));
      }
      let b = ''; r.on('data', c => b += c); r.on('end', () => res({ p, status: r.statusCode, url: p, body: b, chain: [] }));
    }).on('error', e => res({ p, status: 'ERR', body: '', chain: [], err: e.message }));
  });
}
(async () => {
  for (const u of ['/user/8MKvZoxaWt.html', '/user/8adohGgCW07fknL.html', '/user/']) {
    const r = await get(u);
    console.log('==', u, '=>', r.status, 'len', r.body.length, r.chain.join(' | '));
    const imgs = [...r.body.matchAll(/<img[^>]*>/gi)].map(m => m[0]).filter(t => /avatar/i.test(t)).slice(0, 3);
    imgs.forEach(t => console.log('   ', t.slice(0, 180)));
    // 检查头像资源是否可访问（相对最终 URL）
    const first = imgs[0] && (imgs[0].match(/src="([^"]*)"/) || [])[1];
    if (first) {
      const resolved = first.startsWith('http') ? first : new URL(first, base + u).href;
      const rr = await new Promise(res => https.get(resolved, { headers: { 'user-agent': 'Mozilla/5.0' } }, x => { res({ s: x.statusCode, t: x.headers['content-type'] }); x.resume(); }).on('error', e => res({ s: 'ERR', t: e.message })));
      console.log('    avatar', first, '->', resolved, rr.s, rr.t);
    }
  }
})();
