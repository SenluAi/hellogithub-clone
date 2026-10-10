/**
 * 拉取榜单 / 全部项目 / 月刊卷列表 / 文章列表 + 文章详情
 * 输出：api-all.json、api-rank.json、api-periodical.json、api-article.json、api-article-detail.json
 */
const fs = require('fs');
const path = require('path');
const BASE = __dirname;
const API = 'https://api.hellogithub.com/v1';
const LOGF = path.join(BASE, 'fetch-all.log');

async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' }, signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise(r => setTimeout(r, 600));
    }
  }
}
const log = m => { fs.appendFileSync(LOGF, m + '\n'); };

(async () => {
  fs.writeFileSync(LOGF, '');
  log('开始抓取 ' + new Date().toISOString());

  // 1) 全部项目：并发分批
  const all = [];
  let page = 1, done = false;
  while (!done && page <= 400) {
    const batch = [];
    for (let i = 0; i < 8; i++) batch.push(page + i);
    const results = await Promise.all(batch.map(p =>
      getJson(`${API}/?sort_by=all&page=${p}`).then(r => ({ p, r })).catch(e => ({ p, err: e.message }))
    ));
    results.sort((a, b) => a.p - b.p);
    for (const it of results) {
      if (it.err) { log(`  第 ${it.p} 页失败：${it.err}`); continue; }
      (it.r.data || []).forEach(x => all.push(x));
      if (!it.r.has_more) done = true;
    }
    page += 8;
    if (page % 40 === 1) log(`  全部项目进度：${all.length} 个（到第 ${page - 1} 页）`);
  }
  fs.writeFileSync(path.join(BASE, 'api-all.json'), JSON.stringify(all, null, 0));
  log(`全部项目 ${all.length} 个`);

  // 2) 榜单
  const rank = {};
  for (const by of ['monthly', 'yearly', 'weekly']) {
    try {
      const r = await getJson(`${API}/?rank_by=${by}&page=1`);
      rank[by] = r.data || [];
      log(`榜单 ${by}：${rank[by].length} 个`);
    } catch (e) { log(`榜单 ${by} 失败：${e.message}`); }
  }
  fs.writeFileSync(path.join(BASE, 'api-rank.json'), JSON.stringify(rank, null, 0));

  // 3) 月刊卷列表
  try {
    const per = await getJson(`${API}/periodical/`);
    fs.writeFileSync(path.join(BASE, 'api-periodical.json'), JSON.stringify(per, null, 0));
    log(`月刊卷列表 ${(per.volumes || []).length} 期`);
  } catch (e) { log('月刊卷列表失败：' + e.message); }

  // 4) 文章列表
  const arts = [];
  let ap = 1, am = true;
  while (am && ap <= 60) {
    const r = await getJson(`${API}/article/?page=${ap}`);
    (r.data || []).forEach(x => arts.push(x));
    am = !!r.has_more;
    ap++;
  }
  fs.writeFileSync(path.join(BASE, 'api-article.json'), JSON.stringify(arts, null, 0));
  log(`文章列表 ${arts.length} 篇`);

  // 5) 文章详情（并发 5）
  const detail = {};
  const queue = arts.slice(0, 60);
  for (let i = 0; i < queue.length; i += 5) {
    const chunk = queue.slice(i, i + 5);
    const rs = await Promise.all(chunk.map(a =>
      getJson(`${API}/article/${a.aid}`).then(r => ({ a, r })).catch(() => null)
    ));
    rs.forEach(x => { if (x && x.r && x.r.success && x.r.data) detail[x.a.aid] = x.r.data; });
  }
  fs.writeFileSync(path.join(BASE, 'api-article-detail.json'), JSON.stringify(detail, null, 0));
  log(`文章详情 ${Object.keys(detail).length} 篇`);
  log('完成 ' + new Date().toISOString());
})().catch(e => log('致命错误：' + e.message));
