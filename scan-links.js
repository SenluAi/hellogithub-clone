const fs = require('fs');
const path = require('path');
const SITE = path.join(__dirname, 'site');

const otherExt = {};      // 非 GitHub 外链（可点）
let ghAnchors = 0;
let ghPlainPages = [];
let total = 0;

function domainOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; }
}
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) { walk(fp); continue; }
    if (!f.name.endsWith('.html')) continue;
    total++;
    const t = fs.readFileSync(fp, 'utf8');
    // 所有 a 标签
    for (const m of t.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)) {
      const u = m[1];
      if (/^(#|mailto:|javascript:|\/|\.\/|\.\.\/)/i.test(u) || u.startsWith('https://hellogithub.senlinlu.cn') || u.startsWith('http://127.0.0.1')) continue;
      if (/^https?:\/\//i.test(u)) {
        const d = domainOf(u);
        if (/github\.com$/i.test(d) || /githubusercontent\.com$/i.test(d) || d === 'github.io') ghAnchors++;
        else otherExt[d] = (otherExt[d] || 0) + 1;
      }
    }
    // 去掉所有 a 标签后再找裸露的 github.com 文本
    const stripped = t.replace(/<a\b[\s\S]*?<\/a>/gi, ' ');
    if (/github\.com\//i.test(stripped)) ghPlainPages.push(path.relative(SITE, fp));
  }
}
walk(SITE);
console.log('HTML 总数 ' + total);
console.log('可点 GitHub 链接 ' + ghAnchors + ' 条');
console.log('非 GitHub 可点外链：' + (Object.keys(otherExt).length ? JSON.stringify(otherExt) : '无'));
console.log('仍为纯文字的 GitHub 地址页面 ' + ghPlainPages.length + ' 个');
ghPlainPages.slice(0, 10).forEach(x => console.log('  ' + x));
