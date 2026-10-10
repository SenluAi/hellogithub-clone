const fs = require('fs'), path = require('path');
const root = 'site';
let missing = new Map(), external = new Map(), empty = new Map(), total = 0;
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) {
      const s = fs.readFileSync(p, 'utf8');
      for (const m of s.matchAll(/<img[^>]*>/gi)) {
        const tag = m[0];
        total++;
        const src = (tag.match(/src="([^"]*)"/) || ['', ''])[1];
        const alt = (tag.match(/alt="([^"]*)"/) || ['', ''])[1];
        if (!src) { empty.set(p + ' alt=' + alt, 1); continue; }
        if (/^(https?:)?\/\//i.test(src)) { external.set(src.split('?')[0], (external.get(src.split('?')[0]) || 0) + 1); continue; }
        if (src.startsWith('data:')) continue;
        let local = decodeURIComponent(src.split('?')[0].split('#')[0]);
        if (local.startsWith('/')) local = path.join(root, local);
        else local = path.resolve(path.dirname(p), local);
        if (!fs.existsSync(local)) missing.set(src + '  <- ' + p, 1);
      }
    }
  }
}
walk(root);
console.log('img tags total =', total);
console.log('--- 空 src (' + empty.size + ') ---'); [...empty.keys()].slice(0, 20).forEach(k => console.log(k));
console.log('--- 外链 (' + external.size + ') ---'); [...external.entries()].slice(0, 20).forEach(([k, v]) => console.log(v, k));
console.log('--- 本地缺失 (' + missing.size + ') ---'); [...missing.keys()].slice(0, 30).forEach(k => console.log(k));
