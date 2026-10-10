const fs = require('fs');

(async () => {
  const list = [
    '/_next/static/chunks/pages/user/%5Buid%5D-d2bcfd40490179cc.js',
    '/_next/static/chunks/99-8cf250e065d6ea99.js',
    '/_next/static/chunks/191-2e207c98643a09fe.js',
    '/_next/static/chunks/468-aa79e2a07007d313.js',
    '/_next/static/chunks/0c428ae2-9675b5d9b4aaba4a.js'
  ];
  for (const p of list) {
    const r = await fetch('https://hellogithub.com' + p, { headers: { 'user-agent': 'Mozilla/5.0' } });
    const t = await r.text();
    console.log('=== ' + p + ' len=' + t.length);
    const re = /((?:fetch|axios|get|post)\s*\(\s*[^)]{0,120})|(["'`][^"'`]{0,60}(?:api|user)[^"'`]{0,60}["'`])/gi;
    const found = new Set();
    let m;
    while ((m = re.exec(t)) !== null) {
      const s = m[0].replace(/\s+/g, ' ');
      if (s.length < 8) continue;
      found.add(s.slice(0, 130));
      if (found.size > 25) break;
    }
    console.log([...found].slice(0, 25).join('\n'));
    fs.writeFileSync('chunk-' + p.replace(/[^A-Za-z0-9]/g, '_') + '.js', t);
    await new Promise(r => setTimeout(r, 200));
  }
})();
