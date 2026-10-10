const fs = require('fs');
const path = require('path');

const base = __dirname;
const users = JSON.parse(fs.readFileSync(path.join(base, 'share-users.json'), 'utf8'));
const info = JSON.parse(fs.readFileSync(path.join(base, 'userinfo.json'), 'utf8'));
const repoDir = path.join(base, 'site', 'repo');
const userDir = path.join(base, 'site', 'user');
const avDir = path.join(base, 'site', 'assets', 'avatars');
fs.mkdirSync(userDir, { recursive: true });
fs.mkdirSync(avDir, { recursive: true });

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const css = `*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#1f2430;font:15px/1.75 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:28px 20px 60px}
.back{display:inline-block;margin-bottom:18px;color:#2563eb;text-decoration:none;font-size:14px}
.back:hover{text-decoration:underline}
h1{font-size:24px;line-height:1.35;margin:0 0 6px}
.profile{display:flex;align-items:center;gap:16px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px 20px;margin-bottom:8px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.avatar{width:72px;height:72px;border-radius:50%;object-fit:cover;background:#e5e7eb;flex:0 0 auto}
.avatar.txt{display:flex;align-items:center;justify-content:center;font-size:26px;color:#6b7280;font-weight:600}
.pname{font-size:19px;font-weight:700}
.puid{color:#9ca3af;font-size:12px;font-family:ui-monospace,Consolas,monospace}
.meta{margin:14px 0 20px;display:flex;flex-wrap:wrap;gap:8px 16px;color:#4b5563;font-size:13px}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:12px}
.item{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 18px;margin:12px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.item a.t{font-size:16px;font-weight:600;color:#1f2430;text-decoration:none}
.item a.t:hover{color:#2563eb}
.item .repo{color:#6b7280;font-size:13px;font-family:ui-monospace,Consolas,monospace;margin:2px 0 8px}
.item p{margin:0 0 6px;color:#374151}
.item .sm{color:#4b5563;font-size:14px}
.tags{color:#6b7280;font-size:12px;margin-top:6px}
h2{font-size:16px;margin:26px 0 8px}
.note{color:#6b7280;font-size:13px;margin-top:22px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}`;

function repoTitle(slug) {
  const p = path.join(repoDir, slug + '.html');
  if (!fs.existsSync(p)) return '';
  const h = fs.readFileSync(p, 'utf8');
  const m = h.match(/<h1>([\s\S]*?)<\/h1>/);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

(async () => {
  // 1. 下载头像
  const avMap = {};
  for (const uid of Object.keys(users)) {
    const u = users[uid];
    if (!u.avatar) continue;
    try {
      const r = await fetch(u.avatar, { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' } });
      if (r.status === 200) {
        const buf = Buffer.from(await r.arrayBuffer());
        const ct = r.headers.get('content-type') || 'image/png';
        const ext = /jpe?g/.test(ct) ? '.jpg' : /webp/.test(ct) ? '.webp' : /gif/.test(ct) ? '.gif' : '.png';
        fs.writeFileSync(path.join(avDir, uid + ext), buf);
        avMap[uid] = ext;
      }
    } catch (e) { }
    await new Promise(r => setTimeout(r, 150));
  }
  console.log('avatars downloaded =', Object.keys(avMap).length);

  // 2. 生成每个用户主页
  let pages = 0;
  const cards = [];
  for (const uid of Object.keys(users)) {
    const u = users[uid];
    const ui = (info[uid] && info[uid].userInfo) || {};
    const nickname = ui.nickname || u.nickname || uid;
    const ext = avMap[uid];
    const avatarHtml = ext
      ? `<img class="avatar" src="../assets/avatars/${uid}${ext}" alt="${esc(nickname)} 的头像"/>`
      : `<div class="avatar txt">${esc(nickname.slice(0, 1))}</div>`;

    const items = u.items.map(it => {
      const t = repoTitle(it.slug) || it.full_name || it.slug;
      return `<div class="item">
  <a class="t" href="../repo/${it.slug}.html">${esc(t)}</a>
  <div class="repo">${esc(it.full_name)}</div>
  ${it.summary ? `<p class="sm">${esc(it.summary)}</p>` : it.description ? `<p class="sm">${esc(it.description)}</p>` : ''}
  <div class="tags">${esc(it.primary_lang || '')}${it.stars_str ? ' · ★ ' + esc(it.stars_str) : ''}</div>
</div>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(nickname)} 的主页 · HelloGitHub 离线版</title>
<link rel="icon" href="../assets/favicon.svg"/>
<style>${css}</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="../index.html">← 返回首页</a>
  <div class="profile">
    ${avatarHtml}
    <div>
      <div class="pname">${esc(nickname)}</div>
      <div class="puid">uid: ${esc(uid)}</div>
      <div class="meta" style="margin:8px 0 0">
        ${ui.level ? `<span class="badge">Lv.${esc(ui.level)}</span>` : ''}
        ${ui.permission && ui.permission.name ? `<span class="badge">${esc(ui.permission.name)}</span>` : ''}
        ${ui.contribute_total != null ? `<span>贡献值 ${esc(ui.contribute_total)}</span>` : ''}
        ${ui.share_repo_total != null ? `<span>累计分享 ${esc(ui.share_repo_total)} 个项目</span>` : ''}
        ${ui.comment_repo_total != null ? `<span>评论 ${esc(ui.comment_repo_total)}</span>` : ''}
        ${ui.rank ? `<span>站内排名 ${esc(ui.rank)}</span>` : ''}
        ${ui.first_login ? `<span>加入于 ${esc(String(ui.first_login).slice(0, 10))}</span>` : ''}
      </div>
    </div>
  </div>
  <h2>TA 分享的项目（本站收录 ${u.items.length} 个）</h2>
${items}
  <p class="note">本页为 HelloGitHub 离线镜像的站内用户主页，资料来自 HelloGitHub 公开页面（hellogithub.com/user/${esc(uid)}）。</p>
</div>
</body>
</html>`;
    fs.writeFileSync(path.join(userDir, uid + '.html'), html);
    pages++;
    cards.push({ uid: uid, nickname: nickname, count: u.items.length, avatar: ext });
  }
  console.log('user pages built =', pages);

  // 3. 用户索引页
  const listHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>分享者主页 · HelloGitHub 离线版</title>
<link rel="icon" href="../assets/favicon.svg"/>
<style>${css}
.ucard{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;text-decoration:none;color:#1f2430}
.ucard:hover{border-color:#93c5fd}
.ucard .avatar{width:44px;height:44px;font-size:18px}
.ucard .nm{font-weight:600;font-size:14px}
.ucard .ct{color:#6b7280;font-size:12px}</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="../index.html">← 返回首页</a>
  <h1>分享者主页</h1>
  <p class="note" style="margin:6px 0 18px">本站共收录 ${cards.length} 位项目分享者的主页。</p>
  <div class="grid">
${cards.map(c => `    <a class="ucard" href="./${c.uid}.html">
      ${c.avatar ? `<img class="avatar" src="../assets/avatars/${c.uid}${c.avatar}" alt=""/>` : `<div class="avatar txt">${esc(c.nickname.slice(0, 1))}</div>`}
      <div><div class="nm">${esc(c.nickname)}</div><div class="ct">分享 ${c.count} 个项目</div></div>
    </a>`).join('\n')}
  </div>
  <p class="note">资料来自 HelloGitHub 公开页面，仅作离线镜像学习使用。</p>
</div>
</body>
</html>`;
  fs.writeFileSync(path.join(userDir, 'index.html'), listHtml);
  console.log('user index built, users =', cards.length);

  // 4. 把站内详情页里的「推荐人」改成站内链接
  const slug2uid = {};
  Object.keys(users).forEach(uid => users[uid].items.forEach(it => { slug2uid[it.slug] = uid; }));
  let changed = 0, missed = [];
  fs.readdirSync(repoDir).filter(f => f.endsWith('.html')).forEach(f => {
    const slug = f.replace(/\.html$/, '');
    const p = path.join(repoDir, f);
    let h = fs.readFileSync(p, 'utf8');
    const uid = slug2uid[slug];
    const m = h.match(/<span>推荐人 ([^<]+)<\/span>/);
    if (!m) return;
    if (!uid) { missed.push(slug); return; }
    h = h.replace(m[0], `<span>推荐人 <a href="../user/${uid}.html" style="color:#2563eb;text-decoration:none">${m[1]}</a></span>`);
    fs.writeFileSync(p, h);
    changed++;
  });
  console.log('repo pages linked to user page =', changed, '| unlinked =', missed.length, missed.slice(0, 5).join(','));
})();
