const BASE = 'https://hellogithub.senlinlu.cn';
const user = 'avatartest' + Date.now().toString().slice(-6);
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';
let cookie = '';
const out = [];
const log = (k, v) => { out.push(k + ' => ' + v); };

async function call(path, method, body) {
  const r = await fetch(BASE + path, {
    method: method || 'GET',
    headers: Object.assign({ 'content-type': 'application/json' }, cookie ? { cookie } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const sc = r.headers.get('set-cookie');
  if (sc) cookie = sc.split(';')[0];
  let j = {};
  try { j = await r.json(); } catch (e) {}
  return { status: r.status, body: j };
}

(async () => {
  const reg = await call('/api/register', 'POST', { username: user, password: 'test123456', nickname: '头像测试' });
  log('注册', reg.status + ' avatar=' + JSON.stringify(reg.body.user && reg.body.user.avatar));

  const me1 = await call('/api/me');
  log('/api/me(初始)', me1.status + ' nickname=' + (me1.body.user && me1.body.user.nickname) + ' avatar=' + JSON.stringify(me1.body.user && me1.body.user.avatar));

  const set = await call('/api/avatar', 'POST', { avatar: PNG });
  log('设置头像', set.status + ' ' + JSON.stringify(set.body));

  const me2 = await call('/api/me');
  log('/api/me(设置后)', me2.status + ' avatar 前缀=' + String(me2.body.user && me2.body.user.avatar).slice(0, 30));

  const bad = await call('/api/avatar', 'POST', { avatar: 'javascript:alert(1)' });
  log('非法头像应被拒', bad.status + ' ' + JSON.stringify(bad.body));

  const clr = await call('/api/avatar', 'POST', { avatar: '' });
  const me3 = await call('/api/me');
  log('清除后', clr.status + ' avatar=' + JSON.stringify(me3.body.user && me3.body.user.avatar));

  const home = await fetch(BASE + '/');
  const html = await home.text();
  log('首页状态', home.status);
  log('首页含 hg-nav-avatar', html.includes('hg-nav-avatar'));
  log('首页含 defaultAvatar', html.includes('defaultAvatar'));
  const lg = await fetch(BASE + '/login/');
  const lh = await lg.text();
  log('账号页状态', lg.status + ' 含 uAvatar=' + lh.includes('uAvatar') + ' 含 /api/avatar=' + lh.includes('/api/avatar'));

  const bad2 = await fetch(BASE + '/api/avatar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ avatar: PNG }) });
  log('未登录设头像应 401', bad2.status);

  console.log(out.join('\n'));
  console.log('TEST_USER=' + user);
})();
