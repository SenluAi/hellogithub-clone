/**
 * 生成站内「月度榜（按月）/ 年度榜（按年）/ 周榜」页面
 * 数据：rank-ym-data.json（抓自 api.hellogithub.com 的 rank_by=monthly&year&month / rank_by=yearly&year）
 */
const fs = require('fs');
const path = require('path');
const BASE = __dirname;
const SITE = path.join(BASE, 'site');
const DIR = path.join(SITE, 'rank');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fileOf = key => key.replace('/', '__') + '.html';
const md = (y, m) => y + '-' + String(m).padStart(2, '0');

const css = `*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#1f2430;font:15px/1.75 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:28px 20px 60px}
.back{display:inline-block;margin-bottom:18px;color:#2563eb;text-decoration:none;font-size:14px}
a{color:#2563eb;text-decoration:none}
h1{font-size:24px;margin:0 0 6px}
h2{font-size:19px;margin:26px 0 10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb}
.sub{color:#6b7280;font-size:14px;margin:6px 0 10px}
.pick{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 4px}
.pick a{padding:4px 12px;border-radius:999px;background:#fff;border:1px solid #e5e7eb;font-size:13px;color:#1f2937}
.pick a:hover{border-color:#93c5fd}
.pick a.on{background:#2563eb;border-color:#2563eb;color:#fff}
.pick a.mute{color:#c3c7cf}
.item{display:block;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 18px;margin:12px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.item:hover{border-color:#93c5fd}
.item .t{font-size:17px;font-weight:600;color:#111827}
.item .rn{color:#6b7280;font-size:12px;font-family:ui-monospace,Consolas,monospace;margin-top:2px}
.item .d{color:#374151;font-size:14px;margin-top:6px}
.item .m{color:#6b7280;font-size:12px;margin-top:8px}
.rank{display:inline-block;min-width:26px;height:26px;line-height:26px;text-align:center;border-radius:8px;background:#eef2ff;color:#4338ca;font-weight:600;font-size:13px;margin-right:8px}
.rank.top3{background:#2563eb;color:#fff}
.grid{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.chip{padding:8px 16px;border-radius:999px;background:#fff;border:1px solid #e5e7eb;color:#1f2937;font-size:14px}
.chip:hover{border-color:#93c5fd}
.chip b{color:#2563eb;font-weight:600}`;

const tabs = on => `  <div class="pick" style="margin-bottom:14px">
    <a href="./monthly.html"${on === 'monthly' ? ' class="on"' : ''}>月度榜</a>
    <a href="./yearly.html"${on === 'yearly' ? ' class="on"' : ''}>年度榜</a>
    <a href="./weekly.html"${on === 'weekly' ? ' class="on"' : ''}>周榜</a>
    <a href="./index.html">榜单总览</a>
  </div>`;

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)} | HelloGitHub 离线版</title>
<link rel="icon" href="../assets/favicon.svg"/>
<style>${css}</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="../index.html">← 返回首页</a>
${body}
</div>
</body>
</html>`;
}

const data = JSON.parse(fs.readFileSync(path.join(BASE, 'rank-ym-data.json'), 'utf8'));
const months = data.months;   // { '2026-09': {count, items} }
const years = data.years;     // { '2026': {count, items} }
const weekly = (JSON.parse(fs.readFileSync(path.join(BASE, 'api-rank.json'), 'utf8')).weekly) || [];
const DETAIL = JSON.parse(fs.readFileSync(path.join(BASE, 'details.json'), 'utf8'));

const mKeys = Object.keys(months).sort();
const yKeys = Object.keys(years).sort();
const latestMonth = mKeys[mKeys.length - 1];
const latestYear = yKeys[yKeys.length - 1];
const monthsOfYear = y => mKeys.filter(k => k.startsWith(y + '-'));
const yearList = y => yKeys;

function card(x, i, label) {
  const key = x.full_name;
  const href = '../repo/' + fileOf(key);
  const meta = [x.primary_lang, x.clicks_total ? x.clicks_total + ' 次浏览' : '', label].filter(Boolean).join(' · ');
  return `  <a class="item" href="${href}">
    <div class="t"><span class="rank${i < 3 ? ' top3' : ''}">${i + 1}</span>${esc(x.title || x.name)}</div>
    <div class="rn">${esc(key)}</div>
    <div class="d">${esc(x.summary || '')}</div>
    <div class="m">${esc(meta)}</div>
  </a>`;
}

/* ---------- 月度榜：主页 + 每月一页 ---------- */
function monthPage(key) {
  const [y, m] = key.split('-');
  const num = Number(m);
  const list = months[key].items;
  const yearChips = yearList().map(yy => {
    const cand = yy + '-' + m;
    const target = months[cand] ? './monthly-' + cand + '.html'
      : (monthsOfYear(yy).length ? './monthly-' + monthsOfYear(yy)[monthsOfYear(yy).length - 1] + '.html' : './monthly.html');
    return `<a href="${target}"${yy === y ? ' class="on"' : ''}>${yy} 年</a>`;
  }).join('');
  const monthChips = monthsOfYear(y).map(k => {
    const label = Number(k.split('-')[1]) + ' 月';
    return `<a href="./monthly-${k}.html"${k === key ? ' class="on"' : ''}>${label}</a>`;
  }).join('');
  const idx = mKeys.indexOf(key);
  const prev = idx > 0 ? mKeys[idx - 1] : null;
  const next = idx < mKeys.length - 1 ? mKeys[idx + 1] : null;
  const nav = [prev ? `<a href="./monthly-${prev}.html">← 上一月（${prev}）</a>` : '', next ? `<a href="./monthly-${next}.html">下一月（${next}）→</a>` : ''].filter(Boolean).join(' ｜ ');
  const body = `${tabs('monthly')}
  <h1>${y} 年 ${num} 月 · 月度榜</h1>
  <div class="sub">共 ${list.length} 个项目 · 数据来自 HelloGitHub 月度榜（${y} 年 ${num} 月）</div>
  <div class="sub">选择年份：</div>
  <div class="pick">${yearChips}</div>
  <div class="sub">选择月份：</div>
  <div class="pick">${monthChips}</div>
  <h2>${y} 年 ${num} 月榜单（${list.length} 个）</h2>
${list.map((x, i) => card(x, i, `${y} 年 ${num} 月月度榜`)).join('\n')}
  <div class="sub" style="margin-top:22px">${nav}</div>`;
  fs.writeFileSync(path.join(DIR, 'monthly-' + key + '.html'), page(`${y} 年 ${num} 月月度榜`, body));
  return key;
}

function monthlyHome() {
  const key = latestMonth;
  const [y, m] = key.split('-');
  const yearChips = yearList().map(yy => {
    const ms = monthsOfYear(yy);
    const target = ms.length ? './monthly-' + ms[ms.length - 1] + '.html' : './monthly.html';
    return `<a href="${target}"${yy === y ? ' class="on"' : ''}>${yy} 年</a>`;
  }).join('');
  const list = months[key].items;
  const monthChips = monthsOfYear(y).map(k => `<a href="./monthly-${k}.html"${k === key ? ' class="on"' : ''}>${Number(k.split('-')[1])} 月</a>`).join('');
  const body = `${tabs('monthly')}
  <h1>HelloGitHub 月度榜</h1>
  <div class="sub">按月排列，共 ${mKeys.length} 个月的榜单（${mKeys[0]} ~ ${latestMonth}）· 当前显示 ${y} 年 ${Number(m)} 月</div>
  <div class="sub">选择年份：</div>
  <div class="pick">${yearChips}</div>
  <div class="sub">选择月份：</div>
  <div class="pick">${monthChips}</div>
  <div class="sub">全部月份索引：</div>
  <div class="grid">${mKeys.map(k => `<a class="chip" href="./monthly-${k}.html">${k.slice(0, 4)} 年 ${Number(k.slice(5))} 月 <b>${months[k].items.length}</b></a>`).join('')}</div>
  <h2>${y} 年 ${Number(m)} 月榜单（${list.length} 个）</h2>
${list.map((x, i) => card(x, i, `${y} 年 ${Number(m)} 月月度榜`)).join('\n')}`;
  fs.writeFileSync(path.join(DIR, 'monthly.html'), page('月度榜', body));
}

/* ---------- 年度榜：主页 + 每年一页 ---------- */
function yearPage(y) {
  const list = years[y].items;
  const yearChips = yKeys.map(yy => `<a href="./yearly-${yy}.html"${yy === y ? ' class="on"' : ''}>${yy} 年</a>`).join('');
  const ms = monthsOfYear(y);
  const monthChips = ms.map(k => `<a href="./monthly-${k}.html">${y} 年 ${Number(k.split('-')[1])} 月</a>`).join('');
  const idx = yKeys.indexOf(y);
  const prev = idx > 0 ? yKeys[idx - 1] : null;
  const next = idx < yKeys.length - 1 ? yKeys[idx + 1] : null;
  const nav = [prev ? `<a href="./yearly-${prev}.html">← ${prev} 年度榜</a>` : '', next ? `<a href="./yearly-${next}.html">${next} 年度榜 →</a>` : ''].filter(Boolean).join(' ｜ ');
  const body = `${tabs('yearly')}
  <h1>${y} 年度榜</h1>
  <div class="sub">共 ${list.length} 个项目 · 数据来自 HelloGitHub 年度榜（${y} 年）</div>
  <div class="sub">选择年份：</div>
  <div class="pick">${yearChips}</div>
  <div class="sub">该年各月份度榜单：</div>
  <div class="grid">${monthChips || '<span class="sub">该年暂无月度榜数据</span>'}</div>
  <h2>${y} 年度榜单（${list.length} 个）</h2>
${list.map((x, i) => card(x, i, `${y} 年度榜`)).join('\n')}
  <div class="sub" style="margin-top:22px">${nav}</div>`;
  fs.writeFileSync(path.join(DIR, 'yearly-' + y + '.html'), page(`${y} 年度榜`, body));
}

function yearlyHome() {
  const y = latestYear;
  const list = years[y].items;
  const yearChips = yKeys.map(yy => `<a href="./yearly-${yy}.html"${yy === y ? ' class="on"' : ''}>${yy} 年</a>`).join('');
  const body = `${tabs('yearly')}
  <h1>HelloGitHub 年度榜</h1>
  <div class="sub">按年份排列，共 ${yKeys.length} 个年度榜（${yKeys[0]} ~ ${latestYear}）· 当前显示 ${y} 年度榜</div>
  <div class="sub">选择年份：</div>
  <div class="pick">${yearChips}</div>
  <div class="sub">全部年份索引：</div>
  <div class="grid">${yKeys.map(yy => `<a class="chip" href="./yearly-${yy}.html">${yy} 年度榜 <b>${years[yy].items.length}</b></a>`).join('')}</div>
  <h2>${y} 年度榜单（${list.length} 个）</h2>
${list.map((x, i) => card(x, i, `${y} 年度榜`)).join('\n')}`;
  fs.writeFileSync(path.join(DIR, 'yearly.html'), page('年度榜', body));
}

/* ---------- 周榜 ---------- */
function weeklyPage() {
  const body = `${tabs('weekly')}
  <h1>HelloGitHub 周榜</h1>
  <div class="sub">最近一周最受欢迎的开源项目 · 共 ${weekly.length} 个</div>
${weekly.map((x, i) => card(x, i, '周榜')).join('\n')}`;
  fs.writeFileSync(path.join(DIR, 'weekly.html'), page('周榜', body));
}

/* ---------- 榜单总览 ---------- */
function overview() {
  const recentMonths = mKeys.slice(-12).reverse();
  const body = `  <h1>HelloGitHub 榜单</h1>
  <div class="sub">月度榜按每个月份分开（共 ${mKeys.length} 个月）· 年度榜按年份分开（共 ${yKeys.length} 年）· 另有周榜</div>
  <div class="grid">
    <a class="chip" href="./monthly.html">月度榜（${mKeys.length} 个月的榜单）</a>
    <a class="chip" href="./yearly.html">年度榜（${yKeys.length} 个年度）</a>
    <a class="chip" href="./weekly.html">周榜（${weekly.length} 个）</a>
  </div>
  <h2>最近月份度榜单</h2>
  <div class="grid">${recentMonths.map(k => `<a class="chip" href="./monthly-${k}.html">${k.slice(0, 4)} 年 ${Number(k.slice(5))} 月 <b>${months[k].items.length}</b></a>`).join('')}</div>
  <h2>全部年度榜单</h2>
  <div class="grid">${yKeys.map(y => `<a class="chip" href="./yearly-${y}.html">${y} 年度榜 <b>${years[y].items.length}</b></a>`).join('')}</div>
  <h2>全部月份度榜单（按年份）</h2>
${yKeys.map(y => `  <div class="sub">${y} 年（${monthsOfYear(y).length} 个月）</div>
  <div class="grid">${monthsOfYear(y).map(k => `<a class="chip" href="./monthly-${k}.html">${Number(k.slice(5))} 月 <b>${months[k].items.length}</b></a>`).join('')}</div>`).join('\n')}`;
  fs.writeFileSync(path.join(DIR, 'index.html'), page('榜单', body));
}

fs.mkdirSync(DIR, { recursive: true });
mKeys.forEach(monthPage);
monthlyHome();
yKeys.forEach(yearPage);
yearlyHome();
weeklyPage();
overview();
console.log('月度榜页 ' + mKeys.length + ' 个月（' + mKeys[0] + ' ~ ' + latestMonth + '）');
console.log('年度榜页 ' + yKeys.length + ' 个年（' + yKeys[0] + ' ~ ' + latestYear + '）');
console.log('周榜 ' + weekly.length + ' 个；总览页 1 个；月度主页 1 个；年度主页 1 个');
