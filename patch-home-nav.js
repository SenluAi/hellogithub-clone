/**
 * 把首页导航（月刊/榜单/文章）和排序（月度/年度/精选/全部）改成站内链接
 */
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'site', 'index.html');
let h = fs.readFileSync(p, 'utf8');
const before = h.length;
const stat = { navBtn: 0, navSpan: 0, rank: 0, misc: 0 };

const LINK = {
  '月刊': './periodical/index.html',
  '榜单': './rank/index.html',
  '文章': './article/index.html',
  '首页': './index.html',
};

// 1) <button ...>月刊</button> / <button ...><span>🏆</span><span>榜单</span></button>
h = h.replace(/<button([^>]*)>([\s\S]*?)<\/button>/g, (m, attrs, inner) => {
  const name = Object.keys(LINK).find(n => {
    const text = inner.replace(/<[^>]*>/g, '').replace(/[🏆📚📝\s]/g, '');
    return text === n;
  });
  if (!name) return m;
  stat.navBtn++;
  return `<a${attrs} href="${LINK[name]}">${inner}</a>`;
});

// 2) 移动端下拉里的 <span class="block cursor-pointer ...">月刊</span>
h = h.replace(/<span class="(block cursor-pointer[^"]*)"(>)(月刊|榜单|文章|首页)<\/span>/g,
  (m, cls, gt, name) => {
    stat.navSpan++;
    return `<a class="${cls}" href="${LINK[name]}">${name}</a>`;
  });

// 3) 排序 / 筛选链接
const rep = [
  [/href="\/\?rank_by=montly"/g, 'href="./rank/index.html#monthly"'],
  [/href="\/\?rank_by=monthly"/g, 'href="./rank/index.html#monthly"'],
  [/href="\/\?rank_by=yearly"/g, 'href="./rank/index.html#yearly"'],
  [/href="\/\?rank_by=weekly"/g, 'href="./rank/index.html#weekly"'],
  [/href="\/\?sort_by=featured"/g, 'href="./index.html"'],
  [/href="\/\?sort_by=all"/g, 'href="./list/index.html"'],
  [/href="\/links"/g, 'href="https://hellogithub.com/links" target="_blank" rel="noopener"'],
  [/href="\/help\/ats"/g, 'href="https://hellogithub.com/help/ats" target="_blank" rel="noopener"'],
  [/href="\/server-sitemap-index\.xml"/g, 'href="https://hellogithub.com/server-sitemap-index.xml" target="_blank" rel="noopener"'],
];
for (const [re, to] of rep) {
  h = h.replace(re, () => { stat.rank++; return to; });
}

fs.writeFileSync(p, h);
console.log('导航按钮改造:', stat.navBtn, '| 下拉/侧栏:', stat.navSpan, '| 排序与其它链接:', stat.rank);
console.log('剩余待修：', {
  '带问号的站根链接': (h.match(/href="\/\?/g) || []).length,
  '<button> 残留': (h.match(/<button/g) || []).length,
  'cursor-pointer 的 span': (h.match(/<span class="[^"]*cursor-pointer[^"]*"/g) || []).length,
});
console.log('长度', before, '->', h.length);
