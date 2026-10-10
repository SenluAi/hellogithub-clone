/**
 * HelloGitHub 镜像站自动更新脚本
 * 流程：抓 API 列表 → 对比本地 details.json 找新增项目 → 抓新详情页 → 重新生成
 *       详情页/标签页 → 首页插入新卡片（站内链接）→ 本地校验 → wrangler 部署 → 线上校验
 * 用法：
 *   node update.js              正常更新并部署
 *   node update.js --no-deploy  只构建不部署（试运行）
 *   node update.js --force      没有新增项目也重新生成并部署
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, execSync } = require('child_process');

const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');
const RAW = path.join(ROOT, 'detail-raw');
const LOG = path.join(ROOT, 'update-log.txt');
const API = 'https://api.hellogithub.com/v1';
const SITE_URL = 'https://hellogithub.senlinlu.cn';
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36', referer: 'https://hellogithub.com/' };
const MAX_PAGES = 3;
const args = process.argv.slice(2);
const NO_DEPLOY = args.includes('--no-deploy');
const FORCE = args.includes('--force');

const sleep = ms => new Promise(r => setTimeout(r, ms));
function log(...a) {
  const line = '[' + new Date().toLocaleString('zh-CN') + '] ' + a.join(' ');
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function node(script) {
  const out = execFileSync(process.execPath, [path.join(ROOT, script)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  out.trim().split('\n').forEach(l => log('   ' + script + ': ' + l.trim()));
  return out;
}
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtNum = n => { n = Number(n) || 0; return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n); };
const fmtTime = t => {
  const days = Math.floor((Date.now() - new Date(t).getTime()) / 86400000);
  if (days < 1) return '今天';
  if (days < 30) return days + ' 天前';
  if (days < 365) return Math.floor(days / 30) + ' 个月前';
  return Math.floor(days / 365) + ' 年前';
};

async function saveImg(url) {
  if (!url) return '';
  const ext = path.extname(new URL(url).pathname) || '.png';
  const name = 'avatar-' + crypto.createHash('sha1').update(url).digest('hex').slice(0, 16) + ext;
  const file = path.join(SITE, 'assets', name);
  if (fs.existsSync(file)) return './assets/' + name;
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return url;
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    return './assets/' + name;
  } catch { return url; }
}

async function cardHtml(it) {
  const avatar = await saveImg(it.author_avatar);
  const href = './repo/' + it.full_name.replace('/', '__') + '.html';
  return `<div class="overflow-hidden"><article class="transform shadow-lg transition-transform hover:scale-105"><a href="${href}" data-card="1" target="_blank" rel="noopener" aria-label="Repository ${esc(it.name)}" class="block"><header class="relative cursor-pointer bg-white px-2.5 py-3 hover:bg-gray-50 hover:text-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 md:px-4">${it.is_hot ? '<div class="absolute top-2 right-0 flex items-center bg-yellow-500 bg-opacity-80 p-1 text-xs font-semibold text-white">推荐</div>' : ''}<div class="flex w-full"><figure class="mr-2.5 hidden md:block"><img width="75" height="75" src="${avatar}" alt="${esc(it.author)} avatar" class="block rounded"/></figure><div class="relative flex w-full flex-col truncate"><div class="flex flex-row pb-0.5"><h2 class="flex w-full items-center"><div class="flex flex-grow items-center truncate text-base leading-snug"><p class="truncate text-sm font-normal md:text-[15px] mr-1 "><span class="font-semibold dark:text-white">${esc(it.name)}</span><span class="mx-0.5 text-gray-500 opacity-40 dark:text-gray-300 md:mx-1">—</span><span class="text-gray-600 dark:text-gray-300">${esc(it.title || '-')}</span></p></div><div class="shrink grow"></div>${it.comment_total > 0 ? `<div class="justify-end"><div class="h-4 whitespace-nowrap rounded-md bg-blue-400 py-0.5 px-2 text-xs font-semibold leading-none text-white dark:text-gray-100">${it.comment_total}</div></div>` : ''}</h2></div><div class="mt-0.5 truncate text-sm text-gray-400">${esc(it.summary || '-')}</div><div class="mt-1 flex items-center"><div class="flex grow items-center text-sm text-gray-400"><img width="16" height="16" src="${avatar}" alt="${esc(it.author)} small avatar" class="mr-1 h-4 w-4 rounded md:hidden"/><div class="flex max-w-[7rem] items-center truncate text-ellipsis md:w-fit md:max-w-[10rem]"><div class="truncate">${esc(it.author)}</div></div><span class="px-1">·</span><span><span style="background-color:${esc(it.lang_color || '#ccc')}" class="relative box-border inline-block h-3 w-3 rounded-full border border-gray-100 align-[-1px] dark:border-gray-500"></span><span class="whitespace-nowrap pl-0.5">${esc((it.primary_lang || '').split(' ')[0])}</span></span><span><span class="px-1">·</span><time>${fmtTime(it.updated_at)}</time></span></div><div class="flex items-center space-x-2"><div class="flex items-center text-sm text-gray-400"><span class="ml-0.5">👁 ${fmtNum(it.clicks_total)}</span></div></div></div></div></div></header></a></article></div>`;
}

(async () => {
  log('===== 开始同步 =====');
  fs.mkdirSync(RAW, { recursive: true });

  // 0) 备份关键文件
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = path.join(ROOT, 'backup', stamp);
  fs.mkdirSync(backup, { recursive: true });
  for (const f of ['details.json', 'site/index.html']) {
    const src = path.join(ROOT, ...f.split('/'));
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(backup, f.replace('site/', 'index-')));
  }
  log('已备份到 backup/' + stamp);

  // 备份目录只保留最近 7 份，避免无限增长
  {
    const bkRoot = path.join(ROOT, 'backup');
    const dirs = fs.readdirSync(bkRoot).filter(d => fs.statSync(path.join(bkRoot, d)).isDirectory()).sort();
    for (const d of dirs.slice(0, Math.max(0, dirs.length - 7))) fs.rmSync(path.join(bkRoot, d), { recursive: true, force: true });
  }

  // 1) 抓取原站最新项目列表
  const items = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(API + '/?sort_by=featured&page=' + page, { headers: UA });
    if (!res.ok) { log('列表接口失败 page' + page + ' status=' + res.status + '，跳过该页'); continue; }
    const j = await res.json();
    items.push(...(j.data || []));
    if (!j.has_more) break;
  }
  log('原站列表取到 ' + items.length + ' 个项目');
  if (!items.length) { log('列表为空，终止（不部署）'); return; }

  // 2) 找出新增项目
  const details = JSON.parse(fs.readFileSync(path.join(ROOT, 'details.json'), 'utf8'));
  const before = Object.keys(details).length;
  const fresh = items.filter(it => !details[it.full_name]);
  log('本地已有 ' + before + ' 个，新增 ' + fresh.length + ' 个' + (fresh.length ? '：' + fresh.map(i => i.full_name).join(', ') : ''));
  if (!fresh.length && !FORCE) { log('没有新增项目，无需更新（用 --force 可强制重建）'); log('===== 结束 ====='); return; }

  // 3) 抓新项目详情页
  let crawled = 0, failed = [];
  for (const it of fresh) {
    const file = path.join(RAW, it.full_name.replace('/', '__') + '.html');
    if (fs.existsSync(file) && fs.statSync(file).size > 5000) { crawled++; continue; }
    let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      try {
        const res = await fetch('https://hellogithub.com/repository/' + it.full_name, { headers: UA });
        const t = await res.text();
        if (res.status === 200 && t.includes('__NEXT_DATA__')) { fs.writeFileSync(file, t); ok = true; crawled++; }
        else log('详情抓取失败 ' + it.full_name + ' status=' + res.status);
      } catch (e) { log('详情抓取异常 ' + it.full_name + ' ' + e.message); }
      await sleep(600);
    }
    if (!ok) failed.push(it.full_name);
    await sleep(600);
  }
  log('新详情页抓取成功 ' + crawled + ' 个' + (failed.length ? '，失败：' + failed.join(', ') : ''));

  // 4) 重新提取详情数据
  if (fresh.length) node('extract.js');
  const details2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'details.json'), 'utf8'));
  log('details.json 条目：' + before + ' → ' + Object.keys(details2).length);

  // 5) 首页插入新卡片（只插入详情页已就绪的项目，保持站内链接）
  const idxPath = path.join(SITE, 'index.html');
  let idx = fs.readFileSync(idxPath, 'utf8');
  const container = '<div class="divide-y divide-gray-100 overflow-hidden dark:divide-gray-700">';
  const ci = idx.indexOf(container);
  if (ci < 0) { log('错误：首页找不到项目列表容器，终止（不部署）'); return; }
  const toAdd = items.filter(it => details2[it.full_name]
    && !idx.includes('/' + it.full_name.replace('/', '__') + '.html')
    && !idx.includes('repository/' + encodeURIComponent(it.full_name)));
  if (toAdd.length) {
    const block = (await Promise.all(toAdd.map(cardHtml))).join('');
    idx = idx.slice(0, ci + container.length) + block + idx.slice(ci + container.length);
    fs.writeFileSync(idxPath, idx);
    log('首页新增卡片 ' + toAdd.length + ' 个：' + toAdd.map(i => i.name).join(', '));
  } else log('首页无需新增卡片');

  // 6) 重建详情页 / 标签页 / 侧栏标签
  node('build-user-data.js');
  node('build-user-pages.js');
  node('build-detail.js');
  node('build-tags.js');
  node('build-tags2.js');

  // 7) 本地校验
  const home = fs.readFileSync(idxPath, 'utf8');
  const checks = [];
  checks.push(['首页卡片数', (home.match(/<div class="overflow-hidden"><article/g) || []).length]);
  checks.push(['首页死链 href="#"', (home.match(/href="#"/g) || []).length]);
  checks.push(['首页站内详情页链接', (home.match(/href="\.\/repo\//g) || []).length]);
  checks.push(['首页侧栏标签链接', (home.match(/href="\.\/tag\//g) || []).length]);
  checks.push(['详情页文件数', fs.readdirSync(path.join(SITE, 'repo')).length]);
  checks.push(['标签页文件数', fs.readdirSync(path.join(SITE, 'tag')).length]);
  const missing = [];
  for (const m of home.matchAll(/href="\.\/repo\/([^"]+)"/g)) if (!fs.existsSync(path.join(SITE, 'repo', m[1]))) missing.push(m[1]);
  checks.push(['首页指向不存在的详情页', missing.length + (missing.length ? '：' + missing.join(', ') : '')]);
  const badTag = [...home.matchAll(/href="\.\/tag\/([^"]+)"/g)].map(m => m[1]).filter(t => !fs.existsSync(path.join(SITE, 'tag', t)));
  checks.push(['侧栏指向不存在的标签页', badTag.length]);
  checks.forEach(([k, v]) => log('校验 · ' + k + '：' + v));
  const okLocal = missing.length === 0 && badTag.length === 0 && /href="#"/.test(home) === false;
  if (!okLocal) { log('本地校验未通过，终止部署（已改文件可从 backup/' + stamp + ' 还原）'); log('===== 结束 ====='); return; }

  if (NO_DEPLOY) { log('已指定 --no-deploy，跳过部署。===== 结束 ====='); return; }

  // 8) 部署
  log('开始部署到 Cloudflare…');
  const NPX = 'C:\\Program Files\\nodejs\\npx.cmd';
  const dep = execSync('"' + NPX + '" wrangler deploy', { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, shell: 'cmd.exe' });
  log('部署输出：' + dep.split('\n').filter(l => /Success|Uploaded|Deployed|error/i.test(l)).slice(-4).join(' | '));

  // 9) 线上校验
  await sleep(4000);
  try {
    const t = await (await fetch(SITE_URL + '/?t=' + Date.now())).text();
    const liveCards = (t.match(/href="\.\/repo\//g) || []).length;
    log('线上首页站内详情页链接：' + liveCards + '，死链 href="#"：' + (t.match(/href="#"/g) || []).length);
    const first = toAdd[0];
    if (first) {
      const u = SITE_URL + '/repo/' + first.full_name.replace('/', '__') + '.html';
      const r = await fetch(u);
      log('线上新详情页 ' + first.full_name + '：' + r.status);
    }
    const r2 = await fetch(SITE_URL + '/tag/index.html');
    log('线上标签索引页：' + r2.status);
  } catch (e) { log('线上校验异常：' + e.message); }

  log('同步完成：新增 ' + toAdd.length + ' 个项目，当前共 ' + checks[4][1] + ' 个详情页');
  log('===== 结束 =====');
})().catch(e => {
  log('运行异常：' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
  log('===== 结束（异常） =====');
  process.exitCode = 1;
});
