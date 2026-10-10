const https = require('https');
const fs = require('fs');
const urls = [
  'https://hellogithub.com/rank',
  'https://hellogithub.com/?rank_by=monthly',
  'https://hellogithub.com/?rank_by=montly',
  'https://hellogithub.com/?sort_by=all',
  'https://hellogithub.com/periodical/',
  'https://hellogithub.com/article/',
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
      const m = r.body.match(/<title>([^<]*)<\/title>/);
      console.log(u, '->', r.status, 'len', r.body.length, 'title:', m ? m[1].slice(0, 60) : '');
    } catch (e) { console.log(u, 'ERR', e.message); }
  }
})();
