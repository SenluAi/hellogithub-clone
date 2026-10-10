const fs = require('fs');
const f = 'src/worker.js';
let s = fs.readFileSync(f, 'utf8');
const before = s;
const reps = [];

function rep(oldStr, newStr, label) {
  if (s.indexOf(oldStr) === -1) { reps.push('FAIL(未找到): ' + label); return; }
  s = s.replace(oldStr, newStr);
  reps.push('OK: ' + label);
}

// 1. currentUser 查询头像
rep(
  "u.username AS username, u.nickname AS nickname FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?",
  "u.username AS username, u.nickname AS nickname, u.avatar AS avatar FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?",
  'currentUser SELECT'
);
rep(
  "return { id: row.id, username: row.username, nickname: row.nickname, token: row.token };",
  "return { id: row.id, username: row.username, nickname: row.nickname, avatar: row.avatar || '', token: row.token };",
  'currentUser return'
);

// 2. /api/me 返回头像
rep(
  "return json({ ok: true, user: { username: user.username, nickname: user.nickname }, favorites: favCount ? favCount.c : 0 });",
  "return json({ ok: true, user: { username: user.username, nickname: user.nickname, avatar: user.avatar || '' }, favorites: favCount ? favCount.c : 0 });",
  '/api/me 返回 avatar'
);

// 3. 登录返回头像
rep(
  "if (path === '/api/login' && method === 'POST') {\n    const username = clean(body.username, 32);\n    const password = typeof body.password === 'string' ? body.password : '';\n    const row = await env.DB.prepare('SELECT id, username, nickname, salt, hash FROM users WHERE username = ?').bind(username).first();",
  "if (path === '/api/login' && method === 'POST') {\n    const username = clean(body.username, 32);\n    const password = typeof body.password === 'string' ? body.password : '';\n    const row = await env.DB.prepare('SELECT id, username, nickname, avatar, salt, hash FROM users WHERE username = ?').bind(username).first();",
  'login 查询 avatar'
);
rep(
  "return json({ ok: true, user: { username: row.username, nickname: row.nickname } }, 200, {\n      'set-cookie': sessionCookie(token, TTL),\n    });",
  "return json({ ok: true, user: { username: row.username, nickname: row.nickname, avatar: row.avatar || '' } }, 200, {\n      'set-cookie': sessionCookie(token, TTL),\n    });",
  'login 返回 avatar'
);

// 4. 注册返回头像（默认空）
rep(
  "return json({ ok: true, user: { username, nickname, createdAt: now } }, 200, {",
  "return json({ ok: true, user: { username, nickname, avatar: '', createdAt: now } }, 200, {",
  'register 返回 avatar'
);

// 5. 新增 /api/avatar 接口（放在 /api/health 之前）
const avatarApi = `  // 设置 / 清除头像
  if (path === '/api/avatar' && method === 'POST') {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: '请先登录' }, 401);
    const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : '';
    if (avatar) {
      const isData = /^data:image\\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(avatar);
      const isUrl = /^https:\\/\\/[^\\s"'<>]+$/.test(avatar);
      if (!isData && !isUrl) return json({ ok: false, error: '头像格式不支持，请选择图片文件' }, 400);
      if (avatar.length > 400000) return json({ ok: false, error: '头像太大，请换一张小一点的图片' }, 413);
    }
    await env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(avatar || null, user.id).run();
    return json({ ok: true, avatar: avatar || '' });
  }

  if (path === '/api/health') return json({ ok: true, service: 'hellogithub-clone-api' });`;
rep(
  "  if (path === '/api/health') return json({ ok: true, service: 'hellogithub-clone-api' });",
  avatarApi,
  '新增 /api/avatar'
);

if (s === before) { console.log('没有改动'); process.exit(1); }
fs.writeFileSync(f, s);
fs.writeFileSync('worker.js.bak', before);
console.log(reps.join('\n'));
console.log('写入完成，字节数', before.length, '->', s.length);
