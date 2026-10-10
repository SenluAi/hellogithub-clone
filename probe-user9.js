const fs = require('fs');

const H = { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' };

(async () => {
  const uid = '8MKvZoxaWt';
  const cands = [
    'https://api.hellogithub.com/v1/user/' + uid + '/',
    'https://api.hellogithub.com/v1/user/' + uid + '/share/',
    'https://api.hellogithub.com/v1/user/' + uid + '/share/?page=1&page_size=20',
    'https://api.hellogithub.com/v1/user/' + uid + '/dynamic/',
    'https://api.hellogithub.com/v1/user/' + uid + '/favorite/'
  ];
  for (const u of cands) {
    try {
      const r = await fetch(u, { headers: H });
      const t = await r.text();
      console.log('PROBE', u, '->', r.status, 'len=' + t.length);
      console.log('   ', t.slice(0, 500).replace(/\s+/g, ' '));
    } catch (e) {
      console.log('PROBE', u, 'ERR', e.message);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  // 统计 share_user 分布
  const d = JSON.parse(fs.readFileSync('details.json', 'utf8'));
  const keys = Object.keys(d);
  console.log('--- details items =', keys.length);
  const users = {};
  keys.forEach(k => {
    const it = d[k] || {};
    const su = it.share_user;
    if (su && su.uid) {
      users[su.uid] = users[su.uid] || { nickname: su.nickname, avatar: su.avatar, items: [] };
      users[su.uid].items.push(k);
    }
  });
  const uids = Object.keys(users);
  console.log('unique share_user =', uids.length);
  uids.slice(0, 15).forEach(u => console.log('  ', u, users[u].nickname, users[u].items.length));
  fs.writeFileSync('share-users.json', JSON.stringify(users, null, 2), 'utf8');
  // 检查详情页里有哪些字段
  const k0 = keys[0];
  console.log('item keys =', Object.keys(d[k0]).join(','));
})();
