const fs = require('fs');
const path = require('path');

const users = {};
const seen = new Set();
['detail-raw', 'detail-raw2'].forEach(dir => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(f => f.endsWith('.html')).forEach(f => {
    const slug = f.replace(/\.html$/, '');
    if (seen.has(slug)) return;
    const h = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = h.match(/"share_user":\{([^}]*)\}/);
    if (!m) return;
    const uid = (m[1].match(/"uid":"([^"]*)"/) || [])[1];
    const nickname = (m[1].match(/"nickname":"([^"]*)"/) || [])[1];
    const avatar = (m[1].match(/"avatar":"([^"]*)"/) || [])[1];
    if (!uid) return;
    seen.add(slug);
    users[uid] = users[uid] || { uid: uid, nickname: nickname, avatar: avatar, items: [] };
    users[uid].items.push({ slug: slug, title: (h.match(/"full_name":"([^"]*)"/) || [])[1] || slug });
  });
});

const uids = Object.keys(users);
console.log('detail files parsed =', [...seen].length);
console.log('unique share users =', uids.length);
uids.forEach(u => console.log('  ', u, users[u].nickname, '->', users[u].items.length));
fs.writeFileSync('share-users.json', JSON.stringify(users, null, 2), 'utf8');
console.log('written share-users.json');
