const base = 'https://hellogithub.senlinlu.cn';
let cookie = '';
async function req(path, method, body) {
  const headers = { 'content-type': 'application/json' };
  if (cookie) headers.cookie = cookie;
  const r = await fetch(base + path, { method: method || 'GET', headers, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : null;
  const raw = sc && sc.length ? sc[0] : r.headers.get('set-cookie');
  if (raw) cookie = raw.split(';')[0];
  let text = '';
  try { text = await r.text(); } catch (e) { text = ''; }
  return { status: r.status, body: text.slice(0, 300) };
}
(async () => {
  console.log('register ->', JSON.stringify(await req('/api/register', 'POST', { username: 'daisytest001', password: 'daisy123456', nickname: 'Daisy测试' })));
  console.log('submit   ->', JSON.stringify(await req('/api/submissions', 'POST', { url: 'https://github.com/HelloGitHub-Team/geese', name: 'geese 项目', category: '工具 / 效率', description: 'HelloGitHub 官方开源项目收集与展示工具，用于验证本站提交入口。' })));
  console.log('dup      ->', JSON.stringify(await req('/api/submissions', 'POST', { url: 'https://github.com/HelloGitHub-Team/geese', name: 'geese 项目', category: '工具 / 效率', description: '重复提交应该被拦截，返回 409 提示已经提交过了。' })));
  console.log('badurl   ->', JSON.stringify(await req('/api/submissions', 'POST', { url: 'not-a-url', name: '坏地址', description: '这是一条用于验证地址校验的测试提交内容。' })));
  console.log('list     ->', JSON.stringify(await req('/api/submissions', 'GET')));
  console.log('me       ->', JSON.stringify(await req('/api/me', 'GET')));
})();
