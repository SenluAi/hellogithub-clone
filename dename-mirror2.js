// 第二遍：清理"复刻/原站/非官方站点/静态复刻"等暗示镜像的措辞
const fs = require('fs');
const p = require('path');
const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'backup', 'detail-raw', 'detail-raw2']);
const EXTS = new Set(['.html', '.js', '.md', '.css', '.json', '.txt', '.svg', '.xml', '.webmanifest']);

const RULES = [
  ['本页为个人学习用的静态复刻，内容来源：', '内容来源：'],
  ['本站为 HelloGitHub 首页的静态复刻练习，数据与内容版权归 HelloGitHub 所有，非官方站点。', '本站内容与数据版权归 HelloGitHub 所有。'],
  ['静态复刻', '静态页面'],
  ['已复刻正文', '已收录正文'],
  ['数据抓自原站接口', '数据来源于公开榜单'],
  ['· 原站正文', '· 完整正文'],
  ['在原站查看第', '查看第'],
  ['在原站查看', '查看'],
  ['（本页为离线镜像的站内详情页）', '（本页为站内详情页）'],
  ['复刻站原先是纯静态站', '本站原先是纯静态站'],
  ['复刻的 HTML 页面', '静态 HTML 页面'],
  ['更新流程：抓原站列表', '更新流程：抓官方列表'],
  ['原站：https://hellogithub.com/', '官方站点：https://hellogithub.com/'],
];

const counts = {};
let changed = 0;
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = p.join(dir, f.name);
    if (f.isDirectory()) { if (!SKIP_DIRS.has(f.name)) walk(fp); continue; }
    if (f.name === 'dename-mirror.js' || f.name === 'dename-mirror2.js') continue;
    if (!EXTS.has(p.extname(f.name).toLowerCase())) continue;
    let text;
    try { text = fs.readFileSync(fp, 'utf8'); } catch (e) { continue; }
    let out = text;
    for (const [from, to] of RULES) {
      if (!out.includes(from)) continue;
      counts[from] = (counts[from] || 0) + (out.split(from).length - 1);
      out = out.split(from).join(to);
    }
    if (out !== text) { fs.writeFileSync(fp, out); changed++; }
  }
}
walk(ROOT);
console.log('changedFiles=' + changed);
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(v + ' x  ' + k));
