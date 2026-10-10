const fs = require('fs'), path = require('path');
const root = 'C:/Users/Mr Li/Desktop/hellogithub-clone/site';
let files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (f.endsWith('.html')) files.push(p); } })(root);
const ext = {}, missing = {}, anchors = {};
let extCount = 0, missingCount = 0, anchorCount = 0, internalCount = 0;
function exists(target) {
  try { if (fs.statSync(target).isFile()) return true; if (fs.statSync(target).isDirectory()) return fs.existsSync(path.join(target, 'index.html')); } catch (e) { }
  return false;
}
for (const p of files) {
  const s = fs.readFileSync(p, 'utf8');
  const re = /(?:href|src)="([^"]+)"/g;
  let m;
  while ((m = re.exec(s))) {
    const u = m[1].trim();
    const rel = p.replace(root, '');
    if (/^(https?:)?\/\//i.test(u)) {
      if (/senlinlu\.cn|hellogithub\.(com|senlinlu)/i.test(u) && !/github\.com\/[^"]*$/i.test(u)) { }
      extCount++;
      const host = (u.match(/^https?:\/\/([^/]+)/) || [, u])[1];
      ext[host] = (ext[host] || 0) + 1;
      if (!ext._sample) ext._sample = [];
      if (ext._sample.length < 12) ext._sample.push(rel + ' -> ' + u.slice(0, 90));
      continue;
    }
    if (u.startsWith('#')) { anchorCount++; anchors[rel] = (anchors[rel] || 0) + 1; continue; }
    if (/^(mailto:|javascript:|data:)/i.test(u)) { anchorCount++; continue; }
    internalCount++;
    const clean = u.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = path.resolve(path.dirname(p), clean);
    if (!exists(target)) {
      missingCount++;
      const key = rel + ' -> ' + u;
      missing[key] = (missing[key] || 0) + 1;
    }
  }
}
console.log('HTML 文件 ' + files.length + ' 个');
console.log('站内相对链接 ' + internalCount + ' 条，目标缺失 ' + missingCount + ' 条');
console.log('站外链接 ' + extCount + ' 条：', Object.keys(ext).filter(k => k !== '_sample').map(k => k + '=' + ext[k]).join(', '));
console.log('样例外链：\n' + (ext._sample || []).join('\n'));
const mk = Object.keys(missing);
console.log('缺失目标（前 20）：\n' + mk.slice(0, 20).join('\n'));
console.log('缺失目标文件数 ' + new Set(mk.map(k => k.split(' -> ')[0])).size);
console.log('href="#" 等 ' + anchorCount + ' 条');
