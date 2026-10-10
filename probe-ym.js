const fs = require('fs');
const API = 'https://api.hellogithub.com/v1';
const H = { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' };
async function get(u, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(u, { headers: H });
      if (r.ok) return await r.json();
      if (r.status === 400) return { success: false, status: 400 };
    } catch (e) { }
    await new Promise(x => setTimeout(x, 400));
  }
  return null;
}
(async () => {
  const res = { monthly: {}, yearly: {} };
  // months
  const years = [];
  for (let y = 2016; y <= 2026; y++) years.push(y);
  for (const y of years) {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const j = await get(`${API}/?rank_by=monthly&year=${y}&month=${m}&page=1`);
      const ok = j && j.success && Array.isArray(j.data) && j.data.length > 0;
      months.push(ok ? j.data.length : 0);
      await new Promise(x => setTimeout(x, 120));
    }
    res.monthly[y] = months;
    console.log('monthly', y, months.join(','));
  }
  for (const y of years) {
    const j = await get(`${API}/?rank_by=yearly&year=${y}&page=1`);
    const ok = j && j.success && Array.isArray(j.data) && j.data.length > 0;
    res.yearly[y] = ok ? j.data.length : 0;
    console.log('yearly', y, res.yearly[y]);
  }
  fs.writeFileSync('C:/Users/Mr Li/Desktop/hellogithub-clone/probe-ym-coverage.json', JSON.stringify(res));
  console.log('DONE');
})();
