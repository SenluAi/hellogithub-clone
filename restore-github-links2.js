const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'site');
const spanRe = /<span([^>]*)class="ext-link"([^>]*)>([\s\S]*?)<\/span>/g;

let pages = 0, fixedPages = 0, fixedLinks = 0, skipped = 0;
const skipKinds = {};

function hrefFor(text, repoKey) {
  const t = text.replace(/&nbsp;/g, ' ').trim();
  let m = t.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9._\-]+(?:\/[A-Za-z0-9._\-]+)?)/);
  if (m) return { url: 'https://github.com/' + m[1], label: t };
  if (/github\.com/i.test(t) && repoKey) return { url: 'https://github.com/' + repoKey, label: t };
  if (repoKey && /在 ?GitHub ?上查看/.test(t)) return { url: 'https://github.com/' + repoKey, label: t };
  return null;
}

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) { walk(fp); continue; }
    if (!f.name.endsWith('.html')) continue;
    pages++;
    const t = fs.readFileSync(fp, 'utf8');
    if (!t.includes('ext-link')) continue;
    const rk = (t.match(/<div class="repo">([^<]+)<\/div>/) || [])[1];
    let n = 0;
    const out = t.replace(spanRe, (all, a, b, inner) => {
      const hit = hrefFor(inner, rk);
      if (!hit) { skipped++; skipKinds[inner.replace(/\s+/g, ' ').trim().slice(0, 30)] = (skipKinds[inner.replace(/\s+/g, ' ').trim().slice(0, 30)] || 0) + 1; return all; }
      n++;
      return `<a${a}class="ext-link" href="${hit.url}" target="_blank" rel="noopener noreferrer"${b}>${inner}</a>`;
    });
    if (n) { fs.writeFileSync(fp, out); fixedPages++; fixedLinks += n; }
  }
}
walk(SITE);
console.log('扫描 HTML ' + pages + ' 个，改写 ' + fixedPages + ' 个页面，恢复 GitHub 链接 ' + fixedLinks + ' 条，跳过 ' + skipped + ' 条');
const top = Object.entries(skipKinds).sort((x, y) => y[1] - x[1]).slice(0, 8);
if (top.length) { console.log('跳过示例：'); top.forEach(([k, v]) => console.log('  ' + k + ' ×' + v)); }
