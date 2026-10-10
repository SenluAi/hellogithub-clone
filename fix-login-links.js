const fs = require('fs');
const path = require('path');

const siteRoot = path.resolve(__dirname, 'site');

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  });
  return out;
}

const files = walk(siteRoot, []);
let changed = 0, refs = 0;

files.forEach(f => {
  let h = fs.readFileSync(f, 'utf8');
  if (h.indexOf('"/login/"') < 0) return;
  let rel = path.relative(path.dirname(f), siteRoot).split(path.sep).join('/');
  rel = rel === '' ? './' : rel + '/';
  const before = (h.match(/"\/login\/"/g) || []).length;
  h = h.split('"/login/"').join('"' + rel + 'login/index.html"');
  fs.writeFileSync(f, h);
  refs += before;
  changed++;
});

console.log('files changed =', changed, '| /login/ refs replaced =', refs);
