const https = require('https');
function get(u) {
  return new Promise((resolve, reject) => {
    const req = https.get(u, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}
(async () => {
  const r = await get('https://api.hellogithub.com/v1/?sort_by=all&page=1');
  console.log('keys:', Object.keys(r).join(','));
  console.log('page:', r.page, 'items:', (r.data || []).length);
  console.log(JSON.stringify(r).slice(-400));
})();
