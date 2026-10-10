const H = { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' };
const API = 'https://api.hellogithub.com/v1';
(async () => {
  const list = process.argv.slice(2);
  for (const p of list) {
    try {
      const r = await fetch(API + p, { headers: H });
      const j = await r.json();
      const d = j && j.data;
      console.log(p, 'status=' + r.status, 'count=' + (Array.isArray(d) ? d.length : '-'), 'first=' + (Array.isArray(d) && d[0] ? d[0].full_name : (j && j.message) || ''));
    } catch (e) { console.log(p, 'ERR', e.message); }
  }
})();
