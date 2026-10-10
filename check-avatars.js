const fs = require('fs'), path = require('path');
const root = 'site';
let missing = new Map(), external = new Map(), files = 0, total = 0;
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) {
      files++;
      const s = fs.readFileSync(p, 'utf8');
      const re = /<img[^>]*>/g;
      let m;
      while ((m = re.exec(s))) {
        const tag = m[0];
        const srcM = tag.match(/src="([^"]*)"/);
        const altM = tag.match(/alt="([^"]*)"/);
        const src = srcM ? srcM[1] : '';
        const alt = altM ? altM[1] : '';
        const cls = (tag.match(/class="([^"]*)"/) || ['', ''])[1];
        const looksAvatar = /avatar|gravatar|assets\/avatars/i.test(tag) || /avatar/i.test(cls) || /\u5934\u50cf/.test(alt);
        if (!looksAvatar) continue;
        total++;
        if (!src) { missing.set('EMPTY_SRC ' + p + ' alt=' + alt, 1); continue; }
        if (/^https?:/i.test(src)) { external.set(src.split('?')[0], (external.get(src.split('?')[0]) || 0) + 1); continue; }
        let local = decodeURIComponent(src.split('?')[0].split('#')[0]);
        if (local.startsWith('/')) local = path.join(root, local);
        else if (local.startsWith('http')) { external.set(local, 1); continue; }
        else local = path.resolve(path.dirname(p), local);
        if (!fs.existsSync(local)) missing.set(src + '  <- ' + p, 1);
      }
    }
  }
}
walk(root);
console.log('html files =', files, ' avatar img tags =', total);
console.log('--- 外链头像 ---');
[...external.entries()].forEach(([k, v]) => console.log(v, k));
console.log('--- 本地缺失/空 src (' + missing.size + ') ---');
[...missing.keys()].forEach(k => console.log(k));
