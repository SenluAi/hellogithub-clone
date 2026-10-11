const fs = require('fs');
const path = require('path');
const SITE = path.join(__dirname, 'site');

const cats = { meta: 0, code: 0, textFull: 0, textTruncated: 0, other: 0 };
const fullPages = [];
const truncPages = [];

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) { walk(fp); continue; }
    if (!f.name.endsWith('.html')) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const rel = path.relative(SITE, fp);
    // 统计 meta/link 中的
    for (const m of t.matchAll(/<(meta|link)\b[^>]*>/gi)) if (/github\.com\//i.test(m[0])) cats.meta++;
    // 去掉 meta/link 与代码块
    let body = t.replace(/<(meta|link)\b[^>]*>/gi, ' ').replace(/<pre\b[\s\S]*?<\/pre>/gi, ' ').replace(/<code\b[\s\S]*?<\/code>/gi, ' ');
    for (const m of body.matchAll(/https?:\/\/github\.com\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._\-/]*)?/g)) {
      const u = m[0];
      const seg = u.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '').split('/');
      if (seg.length >= 2 && seg[1].length > 0) { cats.textFull++; if (!fullPages.includes(rel)) fullPages.push(rel); }
      else { cats.textTruncated++; if (!truncPages.includes(rel)) truncPages.push(rel); }
    }
  }
}
walk(SITE);
console.log(JSON.stringify(cats));
console.log('正文含完整 GitHub 地址的页面 ' + fullPages.length + ' 个：');
fullPages.slice(0, 15).forEach(x => console.log('  ' + x));
console.log('正文含截断 GitHub 地址的页面 ' + truncPages.length + ' 个：');
truncPages.slice(0, 15).forEach(x => console.log('  ' + x));
