const https = require('https');
function get(url) {
  return new Promise(resolve => {
    const req = https.get(url, { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(get(new URL(res.headers.location, url).href));
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', e => resolve({ status: 0, body: '', err: e.message }));
  });
}
(async () => {
  const base = 'https://hellogithub.senlinlu.cn';
  const urls = [
    '/',
    '/rank/index.html',
    '/periodical/index.html',
    '/periodical/126.html',
    '/list/index.html',
    '/article/index.html',
  ];
  for (const u of urls) {
    const r = await get(base + u + (u === '/' ? '?t=' + Date.now() : ''));
    const t = (r.body.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    console.log(u, '->', r.status, (r.body.length + 'B').padEnd(9), t.slice(0, 40), r.err || '');
  }
  const home = await get(base + '/?t=' + Date.now());
  console.log('首页月刊链接:', (home.body.match(/href="\.\/periodical\/index\.html"/g) || []).length,
    '榜单:', (home.body.match(/href="\.\/rank\/index\.html"/g) || []).length,
    '文章:', (home.body.match(/href="\.\/article\/index\.html"/g) || []).length,
    '月度锚点:', (home.body.match(/#monthly/g) || []).length,
    '全部:', (home.body.match(/href="\.\/list\/index\.html"/g) || []).length);
  // 抽样一个文章/项目链接是否存在
  const art = await get(base + '/article/index.html');
  const m = art.body.match(/href="\.\/([0-9a-f]{32})\.html"/);
  if (m) {
    const r = await get(base + '/article/' + m[1] + '.html');
    console.log('文章详情样例', m[1].slice(0, 8), '->', r.status, r.body.length + 'B');
  }
})();
