const fs = require('fs'), path = require('path');
const root = 'C:/Users/Mr Li/Desktop/hellogithub-clone/site';
const hits = [];
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (f.endsWith('.html')) {
      const s = fs.readFileSync(p, 'utf8');
      ['月度', '年度', '元旦', '年份'].forEach(k => {
        let i = s.indexOf(k);
        while (i !== -1) {
          hits.push(p.replace(root, '') + ' [' + k + '] ' + s.slice(Math.max(0, i - 60), i + 60).replace(/\s+/g, ' '));
          i = s.indexOf(k, i + 1);
          if (hits.length > 400) return;
        }
      });
    }
  }
}
walk(root);
console.log('total hits', hits.length);
console.log(hits.slice(0, 80).join('\n'));
