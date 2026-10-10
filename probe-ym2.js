const fs = require('fs');
const H = { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' };
const API = 'https://api.hellogithub.com/v1';
const OUT = 'C:/Users/Mr Li/Desktop/hellogithub-clone/probe-ym-result.json';
const LOG = 'C:/Users/Mr Li/Desktop/hellogithub-clone/probe-ym-result.log';
let res = {};
try { res = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { res = {}; }
const years = process.argv.slice(2).map(Number);
async function get(u, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(u, { headers: H });
      if (r.ok) return await r.json();
    } catch (e) { }
    await new Promise(x => setTimeout(x, 350));
  }
  return null;
}
(async () => {
  for (const y of years) {
    const jobs = [];
    for (let m = 1; m <= 12; m++) jobs.push(m);
    const out = {};
    for (let i = 0; i < jobs.length; i += 6) {
      const chunk = jobs.slice(i, i + 6);
      const rs = await Promise.all(chunk.map(m => get(`${API}/?rank_by=monthly&year=${y}&month=${m}&page=1`).then(j => ({ m, j }))));
      for (const { m, j } of rs) {
        const d = j && j.data;
        out[m] = Array.isArray(d) ? d.length : (j ? 0 : -1);
      }
    }
    const yj = await get(`${API}/?rank_by=yearly&year=${y}&page=1`);
    res[y] = { months: out, yearly: yj && Array.isArray(yj.data) ? yj.data.length : (yj ? 0 : -1) };
    fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
    fs.appendFileSync(LOG, y + ' ' + JSON.stringify(out) + ' yearly=' + res[y].yearly + '\n');
    console.log(y, 'ok', 'yearly=' + res[y].yearly);
  }
  console.log('DONE');
})();
