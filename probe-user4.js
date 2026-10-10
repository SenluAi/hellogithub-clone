const fs = require('fs');

(async () => {
  const h = fs.readFileSync('probe-userpage.html', 'utf8');
  const srcs = [...new Set((h.match(/src="\/_next\/[^"]+"/g) || []).map(s => s.slice(5, -1)))];
  console.log('script count =', srcs.length);
  console.log(srcs.slice(0, 30).join('\n'));

  const hits = new Set();
  let n = 0;
  for (const s of srcs) {
    if (!/\.js$/.test(s)) continue;
    if (n >= 25) break;
    n++;
    try {
      const r = await fetch('https://hellogithub.com' + s, { headers: { 'user-agent': 'Mozilla/5.0' } });
      const t = await r.text();
      const m = t.match(/["'`]\/api\/[A-Za-z0-9_\-\/\[\]{}.:$]*["'`]/g) || [];
      m.forEach(x => hits.add(x.replace(/["'`]/g, '')));
    } catch (e) { }
    await new Promise(r => setTimeout(r, 120));
  }
  console.log('--- api paths found ---');
  console.log([...hits].join('\n') || 'none');
})();
