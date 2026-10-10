const https = require('https');
const paths = process.argv.slice(2);
function get(u) {
  return new Promise((resolve, reject) => {
    const req = https.get(u, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}
(async () => {
  for (const p of paths) {
    const u = p.startsWith('http') ? p : 'https://api.hellogithub.com/v1' + p;
    try {
      const r = await get(u);
      console.log('###', u, r.status, 'len=' + r.body.length);
      console.log(r.body.slice(0, 1500).replace(/\s+/g, ' '));
      console.log();
    } catch (e) { console.log('###', u, 'ERR', e.message); }
  }
})();
