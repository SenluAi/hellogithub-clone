const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'site');
const style = 'style="display:inline-block;padding:8px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-size:14px"';
const re = /<p class="note">项目源码托管在 GitHub：([^\s（<]+)（如需查看源码，请复制地址到浏览器打开）。<\/p>/g;

let pages = 0, fixed = 0, links = 0, rest = 0;
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) { walk(fp); continue; }
    if (!f.name.endsWith('.html')) continue;
    const t = fs.readFileSync(fp, 'utf8');
    if (!t.includes('复制地址到浏览器打开')) continue;
    pages++;
    let n = 0;
    const out = t.replace(re, (m, key) => {
      const k = key.trim().replace(/^github\.com\//, '');
      n++;
      return `<p><a class="src" href="https://github.com/${k}" target="_blank" rel="noopener noreferrer" ${style}>在 GitHub 上查看 ${k} ↗</a></p>`;
    });
    if (n) { fs.writeFileSync(fp, out); fixed++; links += n; }
    else rest++;
  }
}
walk(SITE);
console.log('含旧提示的页面 ' + pages + ' 个，已改为可点链接 ' + fixed + ' 个（共 ' + links + ' 条），未匹配 ' + rest + ' 个');
