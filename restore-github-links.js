const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const REPO = path.join(ROOT, 'site', 'repo');

const style = 'style="display:inline-block;padding:8px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-size:14px"';
const mk = (key) =>
  `<p><a class="src" href="https://github.com/${key}" target="_blank" rel="noopener noreferrer" ${style}>在 GitHub 上查看 ${key} ↗</a></p>`;

// 1) 修生成脚本模板
const gen = path.join(ROOT, 'build-repo-all.js');
let g = fs.readFileSync(gen, 'utf8');
const oldLine = '  <p>来源：github.com/${esc(key)}（本页为站内详情页）</p>';
if (g.includes(oldLine)) {
  g = g.replace(oldLine, '  <p><a class="src" href="https://github.com/${esc(key)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-size:14px">在 GitHub 上查看 ${esc(key)} ↗</a></p>');
  fs.writeFileSync(gen, g);
  console.log('生成脚本模板已更新');
} else {
  console.log('生成脚本模板：' + (g.includes('target="_blank"') ? '已含外链版本' : '未找到目标行'));
}

// 2) 存量页面原地修
const re = /<p>来源：github\.com\/([^（<]+)（本页为站内详情页）<\/p>/g;
let files = 0, fixed = 0, left = 0;
for (const f of fs.readdirSync(REPO)) {
  if (!f.endsWith('.html')) continue;
  files++;
  const fp = path.join(REPO, f);
  const t = fs.readFileSync(fp, 'utf8');
  const n = t.replace(re, (m, key) => mk(key.trim()));
  if (n !== t) {
    fs.writeFileSync(fp, n);
    fixed++;
  } else if (/本页为站内详情页/.test(t)) {
    left++;
  }
}
console.log('扫描详情页 ' + files + ' 个，改为 GitHub 链接 ' + fixed + ' 个，未匹配 ' + left + ' 个');

// 3) 抽样校验
const sample = path.join(REPO, '1Panel-dev__1Panel.html');
const s = fs.readFileSync(sample, 'utf8');
console.log('样例：' + (s.match(/<p><a class="src"[^>]*>[^<]*<\/a><\/p>/) || ['未找到'])[0]);
