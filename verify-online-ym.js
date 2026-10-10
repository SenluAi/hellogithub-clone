const H = { 'user-agent': 'Mozilla/5.0' };
const BASE = 'https://hellogithub.senlinlu.cn';
const urls = [
  '/rank/', '/rank/monthly.html', '/rank/monthly-2017-01.html', '/rank/monthly-2025-09.html',
  '/rank/monthly-2026-09.html', '/rank/yearly.html', '/rank/yearly-2025.html', '/rank/weekly.html',
  '/rank/monthly-2024-04.html', '/repo/judasn__IntelliJ-IDEA-Tutorial.html', '/repo/yang0__handraw-style.html',
  '/search/', '/index.html'
];
(async () => {
  for (const u of urls) {
    try {
      const r = await fetch(BASE + u, { headers: H, redirect: 'follow' });
      const t = await r.text();
      const title = (t.match(/<title>([^<]*)<\/title>/) || [, ''])[1];
      const monthHit = /月度榜|年度榜|周榜|月榜单/.test(t);
      const items = (t.match(/class="item"/g) || []).length;
      console.log(r.status + ' ' + u + ' len=' + t.length + ' items=' + items + ' title=' + title.slice(0, 40) + ' rankWord=' + monthHit);
    } catch (e) { console.log('ERR ' + u + ' ' + e.message); }
  }
})();
