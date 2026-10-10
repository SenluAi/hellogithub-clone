const base = 'https://hellogithub.senlinlu.cn';
(async () => {
  const log = (...a) => console.log(...a);
  let r = await fetch(base + '/api/health');
  log('health', r.status, await r.text());

  r = await fetch(base + '/', { headers: { 'Cache-Control': 'no-cache' } });
  const home = await r.text();
  log('home', r.status, 'hasLoginState=' + home.includes('hg-login-state'));

  const u = '1390000' + Math.floor(1000 + Math.random() * 8999);
  r = await fetch(base + '/api/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: u, password: 'test123456', nickname: '联调测试' })
  });
  log('register', r.status, await r.text());
  const setCookies = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get('set-cookie')];
  const cookie = setCookies.filter(Boolean).map((c) => c.split(';')[0]).join('; ');
  log('cookie', cookie);

  r = await fetch(base + '/api/me', { headers: { cookie } });
  log('me', r.status, await r.text());

  r = await fetch(base + '/api/favorites', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ slug: '/repo/86Box__86Box.html', title: '复古 PC 模拟器', url: base + '/repo/86Box__86Box.html' })
  });
  log('fav-add', r.status, await r.text());

  r = await fetch(base + '/api/favorites', { headers: { cookie } });
  log('fav-list', r.status, await r.text());

  r = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: u, password: 'test123456' })
  });
  log('login', r.status, await r.text());

  r = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: u, password: 'wrongpass' })
  });
  log('login-wrong', r.status, await r.text());

  r = await fetch(base + '/api/logout', { method: 'POST', headers: { cookie } });
  log('logout', r.status, await r.text());

  r = await fetch(base + '/api/me', { headers: { cookie } });
  log('me-after-logout', r.status, await r.text());
})();
