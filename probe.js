const https = require('https');
const fs = require('fs');
const urls = [
  'https://hellogithub.com/periodical',
  'https://hellogithub.com/rank?rank_by=monthly',
  'https://hellogithub.com/article',
];
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(new URL(res.headers.location, url).href));
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', reject);
  });
}
(async () => {
  for (const u of urls) {
    try {
      const r = await get(u);
      const name = u.replace(/[^a-z0-9]+/gi, '_') + '.html';
      fs.writeFileSync('probe-' + name, r.body);
      const hasNext = r.body.includes('__NEXT_DATA__');
      console.log(u, 'status', r.status, 'len', r.body.length, 'nextData', hasNext);
    } catch (e) { console.log(u, 'ERR', e.message); }
  }
})();
