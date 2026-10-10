const fs = require('fs');

(async () => {
  const uid = '8MKvZoxaWt';
  const urls = [
    'https://hellogithub.com/user/' + uid,
    'https://hellogithub.com/api/user/' + uid,
    'https://hellogithub.com/api/user/' + uid + '/repos',
    'https://hellogithub.com/api/users/' + uid
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
      const t = await r.text();
      console.log('=== ' + u + ' -> ' + r.status + ' len=' + t.length);
      if (r.status === 200 && u.indexOf('/user/' + uid) > 0) {
        fs.writeFileSync('probe-userpage.html', t);
        const m = t.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (m) {
          console.log('NEXT_DATA len =', m[1].length);
          try {
            const j = JSON.parse(m[1]);
            console.log('pageProps keys =', Object.keys(j.props && j.props.pageProps || {}).join(','));
            console.log('pageProps sample =', JSON.stringify(j.props.pageProps).slice(0, 900));
          } catch (e) { console.log('parse err ' + e.message); }
        } else {
          console.log('no __NEXT_DATA__, body head =', t.slice(0, 300).replace(/\s+/g, ' '));
        }
      } else if (r.status === 200) {
        console.log('body head =', t.slice(0, 300).replace(/\s+/g, ' '));
      }
    } catch (e) {
      console.log('=== ' + u + ' ERR ' + e.message);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  // 站内详情页里推荐人的展示方式
  const p = 'site/repo/xingkongliang__skills-manager.html';
  if (fs.existsSync(p)) {
    const h = fs.readFileSync(p, 'utf8');
    const i = h.indexOf('推荐');
    console.log('--- site repo page 推荐 context:', i >= 0 ? h.slice(Math.max(0, i - 200), i + 260).replace(/\s+/g, ' ') : 'not found');
  } else {
    console.log('site repo sample missing');
    const n = fs.readdirSync('site/repo').slice(0, 3);
    console.log('repo files', n.join(','));
  }
})();
