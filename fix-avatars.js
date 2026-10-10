const fs = require('fs');
const path = require('path');

const base = __dirname;

// 1. 修 build-user-pages.js：头像请求加 referer
let src = fs.readFileSync(path.join(base, 'build-user-pages.js'), 'utf8');
const oldLine = "const r = await fetch(u.avatar, { headers: { 'user-agent': 'Mozilla/5.0' } });";
const newLine = "const r = await fetch(u.avatar, { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' } });";
if (src.indexOf(oldLine) >= 0) {
  src = src.replace(oldLine, newLine);
  fs.writeFileSync(path.join(base, 'build-user-pages.js'), src);
  console.log('patched build-user-pages.js');
} else {
  console.log('patch skipped (pattern not found or already patched)');
}

// 2. 直接下载全部头像
const users = JSON.parse(fs.readFileSync(path.join(base, 'share-users.json'), 'utf8'));
const info = JSON.parse(fs.readFileSync(path.join(base, 'userinfo.json'), 'utf8'));
const avDir = path.join(base, 'site', 'assets', 'avatars');
fs.mkdirSync(avDir, { recursive: true });

(async () => {
  let ok = 0, fail = [];
  for (const uid of Object.keys(users)) {
    const url = (info[uid] && info[uid].userInfo && info[uid].userInfo.avatar) || users[uid].avatar;
    if (!url) { fail.push(uid + '(no url)'); continue; }
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' } });
      if (r.status === 200) {
        const buf = Buffer.from(await r.arrayBuffer());
        const ct = r.headers.get('content-type') || 'image/png';
        const ext = /jpe?g/.test(ct) ? '.jpg' : /webp/.test(ct) ? '.webp' : /gif/.test(ct) ? '.gif' : '.png';
        fs.writeFileSync(path.join(avDir, uid + ext), buf);
        ok++;
      } else {
        fail.push(uid + ' status ' + r.status);
      }
    } catch (e) {
      fail.push(uid + ' ' + e.message);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('avatars ok =', ok, '| failed =', fail.length, fail.join('; '));
  console.log('files in avatars dir =', fs.readdirSync(avDir).length);
})();
