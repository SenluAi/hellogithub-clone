const https = require('https');
const fs = require('fs');
const url = process.argv[2];
const out = process.argv[3];
function get(u) {
  return new Promise((resolve, reject) => {
    const req = https.get(u, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(get(new URL(res.headers.location, u).href));
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
  });
}
(async () => {
  try {
    const r = await get(url);
    fs.writeFileSync(out, r.body);
    const m = r.body.match(/<title>([^<]*)<\/title>/);
    fs.appendFileSync('probe-all.log', `${url} -> ${r.status} len=${r.body.length} title=${m ? m[1].slice(0, 60) : ''}\n`);
    console.log(`${url} -> ${r.status} len=${r.body.length} title=${m ? m[1].slice(0, 60) : ''}`);
  } catch (e) {
    fs.appendFileSync('probe-all.log', `${url} ERR ${e.message}\n`);
    console.log(url + ' ERR ' + e.message);
  }
})();
