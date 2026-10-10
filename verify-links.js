const fs = require('fs');
const path = require('path');

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  });
  return out;
}

const files = walk('site', []);
let ext = [], bad = [], missing = [], internal = 0, total = 0;
files.forEach(f => {
  const h = fs.readFileSync(f, 'utf8');
  const re = /(?:href|src)="([^"]+)"/g;
  let m;
  while ((m = re.exec(h)) !== null) {
    const u = m[1];
    total++;
    if (/^(data:|mailto:|tel:)/.test(u)) continue;
    if (/^https?:\/\//i.test(u)) { ext.push(f + ' -> ' + u); continue; }
    if (u.startsWith('#') || /^javascript:/i.test(u)) { bad.push(f + ' -> ' + u); continue; }
    const clean = u.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = path.resolve(path.dirname(f), clean);
    if (!fs.existsSync(target)) missing.push(f + ' -> ' + u);
    else internal++;
  }
});

console.log('html files scanned =', files.length);
console.log('total refs =', total, '| internal ok =', internal);
console.log('external links =', ext.length, ext.slice(0, 5).join(' | '));
console.log('hash/javascript links =', bad.length, bad.slice(0, 5).join(' | '));
console.log('missing targets =', missing.length, missing.slice(0, 8).join(' | '));
console.log('user pages =', fs.readdirSync('site/user').length, '| avatars =', fs.readdirSync('site/assets/avatars').length);

// 抽查一个详情页的推荐人链接
const s = fs.readFileSync('site/repo/xingkongliang__skills-manager.html', 'utf8');
const i = s.indexOf('推荐人');
console.log('detail page recommender:', s.slice(Math.max(0, i - 20), i + 140).replace(/\s+/g, ' '));
const up = fs.readFileSync('site/user/8MKvZoxaWt.html', 'utf8');
console.log('user page size =', up.length, '| avatar ref =', (up.match(/assets\/avatars\/[^"]+/) || ['none'])[0], '| item links =', (up.match(/\.\.\/repo\//g) || []).length);
