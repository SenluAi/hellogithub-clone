const fs = require('fs');
const path = require('path');

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    if (e.name === 'node_modules' || e.name === '.wrangler' || e.name === 'backup' || e.name === '.git') return;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|mjs)$/.test(e.name)) out.push(p);
  });
  return out;
}

const files = walk('.', []);
console.log('js files =', files.length);
files.forEach(f => {
  const t = fs.readFileSync(f, 'utf8');
  if (t.indexOf('推荐人') >= 0) {
    const lines = t.split('\n');
    lines.forEach((l, i) => {
      if (l.indexOf('推荐人') >= 0) console.log('[推荐人] ' + f + ':' + (i + 1) + ' -> ' + l.trim().slice(0, 300));
    });
  }
});

// 站内详情页里推荐人片段
const p = 'site/repo/xingkongliang__skills-manager.html';
if (fs.existsSync(p)) {
  const h = fs.readFileSync(p, 'utf8');
  const i = h.indexOf('推荐人');
  console.log('--- site page context: ' + h.slice(Math.max(0, i - 300), i + 200).replace(/\s+/g, ' '));
  console.log('--- has avatar img? ', /avatar/.test(h));
}
