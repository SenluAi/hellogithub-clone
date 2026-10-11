// 去掉站点中"镜像站/离线镜像/离线版"等字样，统一改为正常网站口吻
const fs = require('fs');
const p = require('path');
const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'backup', 'detail-raw']);
const EXTS = new Set(['.html', '.js', '.md', '.css', '.json', '.txt', '.svg', '.xml', '.webmanifest']);

const RULES = [
  // 整句替换（最长优先）
  ['# HelloGitHub 镜像站（离线/站内化克隆）', '# HelloGitHub'],
  ['HelloGitHub 镜像站（离线/站内化克隆）', 'HelloGitHub'],
  ['本页内容整理自 HelloGitHub 的公开项目介绍，仅供个人学习与离线翻阅；离线镜像不提供跳转原站的可点链接。', '本页内容整理自 HelloGitHub 的公开项目介绍，仅供学习与浏览。'],
  ['本页内容整理自 HelloGitHub 的公开项目介绍，仅供个人学习与离线翻阅', '本页内容整理自 HelloGitHub 的公开项目介绍，仅供学习与浏览'],
  ['离线镜像不提供外链跳转，请自行复制到浏览器打开', '如需查看源码，请复制地址到浏览器打开'],
  ['本页是离线镜像的站内详情页，介绍内容来自 HelloGitHub 公开页面', '本页介绍内容来自 HelloGitHub 公开页面'],
  ['本页为 HelloGitHub 离线镜像的站内用户主页', '本页为站内用户主页'],
  ['本页为离线镜像的站内标签页', '本页为站内标签页'],
  ['本页为离线镜像的站内详情页', '本页为站内详情页'],
  ['（本页为离线镜像的站内详情页）', '（本页为站内详情页）'],
  ['资料来自 HelloGitHub 公开页面，仅作离线镜像学习使用。', '资料来自 HelloGitHub 公开页面，仅供学习使用。'],
  ['本站复刻的是 HelloGitHub 中文站内容；英文页只保留项目条目索引，条目均指向站内页面。', '本页为英文项目条目索引，条目均指向站内页面。'],
  ['（原站接口按页返回，本站复刻了可获取的部分，其余可在原站查看）', ''],
  ['本站只复刻了原站接口可获取的部分项目，这一期的项目列表没有抓到。', '暂未获取到这一期的项目列表。'],
  ['HelloGitHub 离线镜像的站内用户主页', '站内用户主页'],
  // 通用品牌串
  ['HelloGitHub 镜像站', 'HelloGitHub'],
  ['HelloGitHub 离线镜像', 'HelloGitHub'],
  ['HelloGitHub 离线版', 'HelloGitHub'],
  ['离线镜像站', '本站'],
  ['镜像站', '本站'],
  ['离线镜像', '本站'],
];

const counts = {};
let changedFiles = 0;
const remaining = [];

function hit(rule) { counts[rule] = (counts[rule] || 0) + 1; }

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = p.join(dir, f.name);
    const rel = p.relative(ROOT, fp);
    if (f.isDirectory()) {
      if (SKIP_DIRS.has(f.name)) continue;
      walk(fp);
      continue;
    }
    if (f.name.startsWith('jixiang-hits') || f.name === 'dename-mirror.js') continue;
    if (!EXTS.has(p.extname(f.name).toLowerCase())) continue;
    let text;
    try { text = fs.readFileSync(fp, 'utf8'); } catch (e) { continue; }
    if (!/镜像站|离线镜像|离线版|复刻|原站/.test(text)) continue;
    let out = text;
    for (const [from, to] of RULES) {
      if (!out.includes(from)) continue;
      const n = out.split(from).length - 1;
      for (let i = 0; i < n; i++) hit(from);
      out = out.split(from).join(to);
    }
    if (out !== text) {
      fs.writeFileSync(fp, out);
      changedFiles++;
    }
  }
}

walk(ROOT);

// 复查残留
function scan(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = p.join(dir, f.name);
    if (f.isDirectory()) {
      if (SKIP_DIRS.has(f.name)) continue;
      scan(fp);
      continue;
    }
    if (!EXTS.has(p.extname(f.name).toLowerCase())) continue;
    let text;
    try { text = fs.readFileSync(fp, 'utf8'); } catch (e) { continue; }
    const re = /镜像站|离线镜像|离线版|离线/g;
    text.split(/\r?\n/).forEach((l, i) => {
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(l))) {
        remaining.push(p.relative(ROOT, fp) + ' L' + (i + 1) + ' → ' + l.trim().slice(0, 160));
      }
    });
  }
}
scan(ROOT);

console.log('changedFiles=' + changedFiles);
console.log('--- 命中次数 ---');
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(v + ' x  ' + k.slice(0, 80)));
console.log('--- 残留(前60) ---');
const uniq = [...new Set(remaining.map(r => r.replace(/^(site\\(repo|periodical|article|user|tag|rank|list)\\\S+) L\d+ → /, '$1 → ')))];
console.log('remainingTotal=' + remaining.length + ' uniqSample=' + uniq.length);
uniq.slice(0, 60).forEach(r => console.log(r));
fs.writeFileSync('dename-mirror-report.txt', remaining.join('\n'));
