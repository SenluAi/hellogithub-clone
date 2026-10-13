const fs = require('fs');
const path = require('path');
const BASE = __dirname;
const API = 'https://api.hellogithub.com/v1';
const H = { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' };
const OUT = path.join(BASE, 'rank-ym-data.json');
const LOG = path.join(BASE, 'rank-ym-fetch.log');

async function get(u, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(u, { headers: H });
      if (r.ok) return await r.json();
      if (r.status === 400) return { success: false };
    } catch (e) { }
    await new Promise(x => setTimeout(x, 400));
  }
  return null;
}

(async () => {
  fs.writeFileSync(LOG, '');
  const cov = JSON.parse(fs.readFileSync(path.join(BASE, 'probe-ym-result.json'), 'utf8'));
  let data = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { months: {}, years: {} };
  const jobs = [];
  for (const y of Object.keys(cov)) {
    const months = cov[y].months || {};
    for (const m of Object.keys(months)) {
      if (months[m] > 0) jobs.push({ type: 'month', key: y + '-' + String(m).padStart(2, '0'), y: Number(y), m: Number(m) });
    }
  }
  for (const y of Object.keys(cov)) jobs.push({ type: 'year', key: y, y: Number(y) });

  let done = 0;
  for (let i = 0; i < jobs.length; i += 5) {
    const chunk = jobs.slice(i, i + 5);
    await Promise.all(chunk.map(async j => {
      const store = j.type === 'month' ? data.months : data.years;
      if (store[j.key] && store[j.key].items && store[j.key].items.length) return;
      const items = [];
      let page = 1, more = true;
      while (more && page <= 10) {
        const q = j.type === 'month'
          ? `/?rank_by=monthly&year=${j.y}&month=${j.m}&page=${page}`
          : `/?rank_by=yearly&year=${j.y}&page=${page}`;
        const r = await get(API + q);
        const d = r && r.data;
        if (!Array.isArray(d) || !d.length) break;
        d.forEach(x => items.push(x));
        more = !!(r && r.has_more);
        page++;
        await new Promise(x => setTimeout(x, 200));
      }
      store[j.key] = { count: items.length, items };
      fs.appendFileSync(LOG, j.type + ' ' + j.key + ' -> ' + items.length + '\n');
    }));
    done += chunk.length;
    fs.writeFileSync(OUT, JSON.stringify(data));
    console.log('progress', done + '/' + jobs.length);
  }
  const uniq = new Map();
  Object.values(data.months).forEach(o => o.items.forEach(x => uniq.set(x.full_name, x)));
  Object.values(data.years).forEach(o => o.items.forEach(x => uniq.set(x.full_name, x)));
  const fileOf = k => k.replace('/', '__') + '.html';
  let missing = 0;
  const missingList = [];
  for (const k of uniq.keys()) {
    if (!fs.existsSync(path.join(BASE, 'site', 'repo', fileOf(k)))) { missing++; if (missingList.length < 40) missingList.push(k); }
  }
  const summary = 'months=' + Object.keys(data.months).length + ' years=' + Object.keys(data.years).length + ' uniqueRepos=' + uniq.size + ' missingDetailPages=' + missing + '\nmissing sample:\n' + missingList.join('\n');
  fs.writeFileSync(path.join(BASE, 'rank-ym-summary.txt'), summary);
  console.log(summary);
  console.log('DONE');
})();
