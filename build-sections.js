/**
 * 生成站内栏目页：榜单、全部项目、月刊（目录 + 各期）、文章（列表 + 正文）
 * 数据来自 api-*.json（抓自 api.hellogithub.com）
 */
const fs = require('fs');
const path = require('path');
const BASE = __dirname;
const SITE = path.join(BASE, 'site');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fileOf = key => key.replace('/', '__') + '.html';
const hasRepo = key => fs.existsSync(path.join(SITE, 'repo', fileOf(key)));

const all = JSON.parse(fs.readFileSync(path.join(BASE, 'api-all.json'), 'utf8'));
const rank = JSON.parse(fs.readFileSync(path.join(BASE, 'api-rank.json'), 'utf8'));
const per = JSON.parse(fs.readFileSync(path.join(BASE, 'api-periodical.json'), 'utf8'));
const arts = JSON.parse(fs.readFileSync(path.join(BASE, 'api-article.json'), 'utf8'));
const artDetail = JSON.parse(fs.readFileSync(path.join(BASE, 'api-article-detail.json'), 'utf8'));

const css = `*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#1f2430;font:15px/1.75 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:28px 20px 60px}
.back{display:inline-block;margin-bottom:18px;color:#2563eb;text-decoration:none;font-size:14px}
a{color:#2563eb;text-decoration:none}
h1{font-size:24px;margin:0 0 6px}
h2{font-size:19px;margin:30px 0 10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb}
.sub{color:#6b7280;font-size:14px;margin-bottom:18px}
.item{display:block;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 18px;margin:12px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.item:hover{border-color:#93c5fd}
.item .t{font-size:17px;font-weight:600;color:#111827}
.item .rn{color:#6b7280;font-size:12px;font-family:ui-monospace,Consolas,monospace;margin-top:2px}
.item .d{color:#374151;font-size:14px;margin-top:6px}
.item .m{color:#6b7280;font-size:12px;margin-top:8px}
.grid{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.chip{padding:6px 14px;border-radius:999px;background:#fff;border:1px solid #e5e7eb;color:#1f2937;font-size:14px}
.chip:hover{border-color:#93c5fd}
.chip b{color:#2563eb;font-weight:600}
.tabs{display:flex;gap:8px;margin:14px 0 4px;flex-wrap:wrap}
.tabs a{padding:6px 16px;border-radius:999px;background:#fff;border:1px solid #e5e7eb;font-size:14px}
.tabs a.on{background:#2563eb;border-color:#2563eb;color:#fff}
article.post{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;margin-top:16px}
article.post img{max-width:100%;border-radius:8px}
article.post h2{font-size:19px;margin:24px 0 8px}
article.post h3{font-size:16px;margin:20px 0 6px}
article.post table{border-collapse:collapse;width:100%;margin:12px 0;font-size:14px}
article.post th,article.post td{border:1px solid #e5e7eb;padding:6px 10px;text-align:left}
article.post blockquote{margin:12px 0;padding:8px 14px;border-left:3px solid #93c5fd;background:#f3f7ff;color:#374151}
article.post pre{background:#0f172a;color:#e2e8f0;padding:12px 14px;border-radius:8px;overflow:auto;font-size:13px}
article.post code{background:#eef2f7;padding:1px 5px;border-radius:4px;font-size:13px}`;

function page(title, body, depth) {
  const up = depth === 0 ? './' : '../';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)} | HelloGitHub</title>
<link rel="icon" href="${up}assets/favicon.svg"/>
<style>${css}</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="${up}index.html">← 返回首页</a>
${body}
</div>
</body>
</html>`;
}

function itemHtml(x, up) {
  const local = hasRepo(x.full_name);
  const href = local ? `${up}repo/${fileOf(x.full_name)}` : `https://github.com/${x.full_name}`;
  const target = local ? '' : ' target="_blank" rel="noopener"';
  const meta = [x.primary_lang, (x.clicks_total ? x.clicks_total + ' 次浏览' : ''), local ? '站内详情' : 'GitHub'].filter(Boolean).join(' · ');
  return `  <a class="item" href="${esc(href)}"${target}>
    <div class="t">${esc(x.title || x.name)}</div>
    <div class="rn">${esc(x.full_name)}</div>
    <div class="d">${esc(x.summary || '')}</div>
    <div class="m">${esc(meta)}</div>
  </a>`;
}

/* 1) 榜单页 */
(function buildRank() {
  const dir = path.join(SITE, 'rank');
  fs.mkdirSync(dir, { recursive: true });
  const sections = [
    ['monthly', '月度榜', '最近一个月最受欢迎的开源项目'],
    ['yearly', '年度榜', '最近一年最受欢迎的开源项目'],
    ['weekly', '周榜', '最近一周最受欢迎的开源项目'],
  ];
  const body = sections.map(([key, name, desc]) => {
    const list = rank[key] || [];
    return `  <h2 id="${key}">${name} <span class="sub" style="font-weight:400">（${list.length} 个）</span></h2>
  <div class="sub">${desc}</div>
${list.map(x => itemHtml(x, '../')).join('\n')}`;
  }).join('\n');
  fs.writeFileSync(path.join(dir, 'index.html'), page('榜单', `  <h1>HelloGitHub 榜单</h1>
  <div class="sub">月度榜 / 年度榜 / 周榜 · 数据来源于公开榜单</div>
  <div class="tabs"><a class="on" href="#monthly">月度</a><a href="#yearly">年度</a><a href="#weekly">周榜</a></div>
${body}`, 1));
  console.log('生成 rank/index.html：月度 ' + (rank.monthly || []).length + ' 年度 ' + (rank.yearly || []).length + ' 周榜 ' + (rank.weekly || []).length);
})();

/* 2) 全部项目页 */
(function buildList() {
  const dir = path.join(SITE, 'list');
  fs.mkdirSync(dir, { recursive: true });
  const list = all.slice().sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  fs.writeFileSync(path.join(dir, 'index.html'), page('全部项目', `  <h1>全部开源项目</h1>
  <div class="sub">共 ${list.length} 个</div>
${list.map(x => itemHtml(x, '../')).join('\n')}`, 1));
  console.log('生成 list/index.html：' + list.length + ' 个项目');
})();

/* 3) 月刊目录 + 各期 */
(function buildPeriodical() {
  const dir = path.join(SITE, 'periodical');
  fs.mkdirSync(dir, { recursive: true });
  const volumes = (per.volumes || []).slice().sort((a, b) => b.num - a.num);
  const byDate = {};
  all.forEach(x => {
    const d = (x.updated_at || '').slice(0, 10);
    if (!d) return;
    (byDate[d] = byDate[d] || []).push(x);
  });
  let withData = 0;
  const rows = volumes.map(v => {
    const date = (v.lastmod || '').slice(0, 10);
    const items = (byDate[date] || []).sort((a, b) => (b.clicks_total || 0) - (a.clicks_total || 0));
    if (items.length) withData++;
    const itemHtmls = items.map(x => itemHtml(x, '../')).join('\n');
    const body = `  <h1>HelloGitHub 月刊 第 ${v.num} 期</h1>
  <div class="sub">发布日期：${esc(date)}${items.length ? ` · 本期收录 ${items.length} 个项目` : ''}</div>
${items.length ? itemHtmls : `  <p class="sub">暂未获取到这一期的项目列表。</p>
  <p><a href="https://hellogithub.com/periodical/${v.num}" target="_blank" rel="noopener">查看第 ${v.num} 期 →</a></p>`}`;
    fs.writeFileSync(path.join(dir, v.num + '.html'), page(`月刊 第 ${v.num} 期`, body, 1));
    return `  <a class="chip" href="./${v.num}.html">第 ${v.num} 期 <b>${esc(date.slice(0, 7))}</b></a>`;
  }).join('\n');
  fs.writeFileSync(path.join(dir, 'index.html'), page('月刊', `  <h1>HelloGitHub 月刊</h1>
  <div class="sub">共 ${volumes.length} 期，每月 28 日发布最新一期${withData ? `（其中最近 ${withData} 期有完整项目列表）` : ''}</div>
  <div class="grid">
${rows}
  </div>`, 1));
  console.log('生成 periodical：' + volumes.length + ' 期目录，其中 ' + withData + ' 期有项目数据');
})();

/* 4) 文章列表 + 正文 */
function mdToHtml(md) {
  let s = String(md || '');
  const blocks = [];
  s = s.replace(/```([\s\S]*?)```/g, (m, code) => {
    blocks.push('<pre><code>' + esc(code.replace(/^\w*\n/, '')) + '</code></pre>');
    return '\u0000BLOCK' + (blocks.length - 1) + '\u0000';
  });
  const inline = t => esc(t)
    .replace(/!\[[^\]]*\]\(([^)\s]+)\)/g, '<img src="$1" alt=""/>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  const out = [];
  const lines = s.split(/\r?\n/);
  let table = [];
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.filter(r => !/^\s*\|?[\s:|-]+\|?\s*$/.test(r));
    const cells = r => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
    let html = '<table>';
    rows.forEach((r, i) => {
      const tag = i === 0 ? 'th' : 'td';
      html += '<tr>' + cells(r).map(c => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>';
    });
    html += '</table>';
    out.push(html);
    table = [];
  };
  for (const line of lines) {
    if (/^\s*\|.*\|\s*$/.test(line)) { table.push(line); continue; }
    flushTable();
    const t = line.trim();
    if (!t) continue;
    if (/^\u0000BLOCK\d+\u0000$/.test(t)) { out.push(t); continue; }
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(t)) { out.push(inline(t)); continue; }
    if (/^###\s+/.test(t)) { out.push('<h3>' + inline(t.replace(/^###\s+/, '')) + '</h3>'); continue; }
    if (/^##\s+/.test(t)) { out.push('<h2>' + inline(t.replace(/^##\s+/, '')) + '</h2>'); continue; }
    if (/^#\s+/.test(t)) { out.push('<h2>' + inline(t.replace(/^#\s+/, '')) + '</h2>'); continue; }
    if (/^>\s?/.test(t)) { out.push('<blockquote>' + inline(t.replace(/^>\s?/, '')) + '</blockquote>'); continue; }
    if (/^[-*]\s+/.test(t)) { out.push('<p>· ' + inline(t.replace(/^[-*]\s+/, '')) + '</p>'); continue; }
    out.push('<p>' + inline(t) + '</p>');
  }
  flushTable();
  return out.join('\n').replace(/\u0000BLOCK(\d+)\u0000/g, (m, i) => blocks[Number(i)]);
}

(function buildArticle() {
  const dir = path.join(SITE, 'article');
  fs.mkdirSync(dir, { recursive: true });
  let built = 0;
  const cards = arts.map(a => {
    const detail = artDetail[a.aid];
    const local = !!detail;
    const href = local ? `./${a.aid}.html` : `https://hellogithub.com/article/${a.aid}`;
    const target = local ? '' : ' target="_blank" rel="noopener"';
    if (local) {
      const body = `  <h1>${esc(detail.title || a.title)}</h1>
  <div class="sub">${esc(a.author || '')} · ${esc((a.publish_at || '').slice(0, 10))} · 阅读 ${esc(a.clicks_count || 0)}</div>
<article class="post">
${mdToHtml(detail.content || a.desc || '')}
</article>`;
      fs.writeFileSync(path.join(dir, a.aid + '.html'), page(detail.title || a.title, body, 1));
      built++;
    }
    return `  <a class="item" href="${esc(href)}"${target}>
    <div class="t">${esc(a.title)}</div>
    <div class="d">${esc(a.desc || '')}</div>
    <div class="m">${esc(a.author || '')} · ${esc((a.publish_at || '').slice(0, 10))} · 阅读 ${esc(a.clicks_count || 0)}${local ? ' · 站内正文' : ' · 完整正文'}</div>
  </a>`;
  }).join('\n');
  fs.writeFileSync(path.join(dir, 'index.html'), page('文章', `  <h1>HelloGitHub 文章</h1>
  <div class="sub">共 ${arts.length} 篇（其中 ${built} 篇已收录正文）</div>
${cards}`, 1));
  console.log(`生成 article：${arts.length} 篇列表，${built} 篇正文`);
})();
