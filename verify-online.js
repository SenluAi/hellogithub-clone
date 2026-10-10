const H = { 'user-agent': 'Mozilla/5.0' };
const base = 'https://hellogithub.senlinlu.cn';

(async () => {
  const urls = [
    '/user/',
    '/user/index.html',
    '/user/8MKvZoxaWt.html',
    '/user/8adohGgCW07fknL.html',
    '/assets/avatars/8MKvZoxaWt.png',
    '/repo/xingkongliang__skills-manager.html',
    '/repo/yang0__handraw-style.html',
    '/login/index.html'
  ];
  for (const u of urls) {
    try {
      const r = await fetch(base + u, { headers: H, redirect: 'follow' });
      const t = await r.text();
      console.log(u, '->', r.status, 'len=' + t.length, /卤蛋|旺德福|推荐人|分享者/.test(t) ? '(含内容)' : '');
      if (u.indexOf('/user/8MKvZoxaWt') >= 0) {
        console.log('   头像引用 =', (t.match(/assets\/avatars\/[^"]+/) || ['none'])[0], '| 项目链接数 =', (t.match(/\.\.\/repo\//g) || []).length);
      }
      if (u.indexOf('/repo/xingkongliang') >= 0) {
        const i = t.indexOf('推荐人');
        console.log('   推荐人片段 =', t.slice(Math.max(0, i), i + 120).replace(/\s+/g, ' '));
      }
    } catch (e) {
      console.log(u, 'ERR', e.message);
    }
    await new Promise(r => setTimeout(r, 250));
  }
})();
