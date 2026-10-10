const fs = require('fs');
const path = require('path');

const H = { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' };
const users = {};
const seen = new Set();

const get = (h, re) => {
  const m = h.match(re);
  return m ? m[1] : '';
};
const unesc = s => {
  try { return JSON.parse('"' + s + '"'); } catch (e) { return s; }
};

['detail-raw', 'detail-raw2'].forEach(dir => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(f => f.endsWith('.html')).forEach(f => {
    const slug = f.replace(/\.html$/, '');
    if (slug === 'sample') return;
    if (seen.has(slug)) return;
    const h = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = h.match(/"share_user":\{([^}]*)\}/);
    if (!m) return;
    const uid = get(m[1], /"uid":"([^"]*)"/);
    if (!uid) return;
    seen.add(slug);
    const nickname = unesc(get(m[1], /"nickname":"([^"]*)"/));
    const avatar = get(m[1], /"avatar":"([^"]*)"/);
    if (!users[uid]) users[uid] = { uid: uid, nickname: nickname, avatar: avatar, items: [] };
    users[uid].items.push({
      slug: slug,
      full_name: unesc(get(h, /"full_name":"([^"]*)"/)),
      title: unesc(get(h, /"title":"([^"]*)"/)),
      description: unesc(get(h, /"description":"([^"]*)"/)).slice(0, 200),
      summary: unesc(get(h, /"summary":"([^"]*)"/)).slice(0, 300),
      primary_lang: unesc(get(h, /"primary_lang":"([^"]*)"/)),
      lang_color: get(h, /"lang_color":"(#[0-9a-fA-F]{3,8})"/),
      stars_str: unesc(get(h, /"stars_str":"([^"]*)"/))
    });
  });
});

console.log('users =', Object.keys(users).length);
const sample = users['8MKvZoxaWt'];
console.log('sample item =', JSON.stringify(sample && sample.items[0]));

// 抓 API
const uids = Object.keys(users);
(async () => {
  const info = {};
  for (const uid of uids) {
    try {
      const r = await fetch('https://api.hellogithub.com/v1/user/' + uid + '/', { headers: H });
      if (r.status === 200) {
        const j = await r.json();
        info[uid] = j;
        console.log('API ok', uid, 'share=' + (j.userInfo && j.userInfo.share_repo_total), 'rank=' + (j.userInfo && j.userInfo.rank), 'level=' + (j.userInfo && j.userInfo.level));
      } else {
        console.log('API fail', uid, r.status);
      }
    } catch (e) {
      console.log('API err', uid, e.message);
    }
    await new Promise(r => setTimeout(r, 320));
  }
  fs.writeFileSync('userinfo.json', JSON.stringify(info, null, 2), 'utf8');
  console.log('saved userinfo.json =', Object.keys(info).length);
})();

fs.writeFileSync('share-users.json', JSON.stringify(users, null, 2), 'utf8');
console.log('saved share-users.json');
