const fs = require('fs');
const t = fs.readFileSync('C:/Users/Mr Li/Desktop/hellogithub-clone/detail-raw/sample.html', 'utf8');
const m = t.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (!m) { console.log('没有 __NEXT_DATA__'); process.exit(0); }
const data = JSON.parse(m[1]);
function walk(o, p, depth) {
  if (depth > 4 || o === null) return;
  if (Array.isArray(o)) { console.log(p + ' [数组 ' + o.length + ']'); if (o.length) walk(o[0], p + '[0]', depth + 1); return; }
  if (typeof o === 'object') { Object.keys(o).forEach(k => { const v = o[k]; const type = Array.isArray(v) ? 'array' : typeof v; if (type === 'string') console.log(p + '.' + k + ' = ' + JSON.stringify(v.slice(0, 160))); else walk(v, p + '.' + k, depth + 1); }); }
}
walk(data, 'DATA', 0);
