// HelloGitHub 离线镜像 · 账号与数据后端（Cloudflare Worker + D1）
const COOKIE = 'hg_session';
const TTL = 60 * 60 * 24 * 30; // 30 天

const json = (data, status, extra) =>
  new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign(
      { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      extra || {}
    ),
  });

const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s) => {
  const a = new Uint8Array(s.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return a;
};
const randomHex = (n) => {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return hex(a);
};

async function hashPwd(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: unhex(saltHex), iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  return hex(bits);
}

function readCookie(req, name) {
  const c = req.headers.get('Cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

function sessionCookie(token, maxAge) {
  return COOKIE + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + maxAge;
}

async function currentUser(req, env) {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const row = await env.DB.prepare(
    'SELECT s.token AS token, s.expires_at AS expires_at, u.id AS id, u.username AS username, u.nickname AS nickname, u.avatar AS avatar FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?'
  ).bind(token).first();
  if (!row) return null;
  if (row.expires_at < Math.floor(Date.now() / 1000)) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }
  return { id: row.id, username: row.username, nickname: row.nickname, avatar: row.avatar || '', token: row.token };
}

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max || 200) : '');

async function handleApi(request, env, url) {
  const path = url.pathname.replace(/\/+$/, '') || '/api';
  const method = request.method.toUpperCase();
  let body = {};
  if (method === 'POST' || method === 'DELETE' || method === 'PUT') {
    try { body = (await request.json()) || {}; } catch (e) { body = {}; }
  }

  // 注册
  if (path === '/api/register' && method === 'POST') {
    const username = clean(body.username, 32);
    const password = typeof body.password === 'string' ? body.password : '';
    const nickname = clean(body.nickname, 24) || username;
    if (!/^1\d{10}$/.test(username) && !/^[A-Za-z0-9_.@-]{4,32}$/.test(username)) {
      return json({ ok: false, error: '账号需为 11 位手机号，或 4-32 位字母/数字/_ . @ -' }, 400);
    }
    if (password.length < 6 || password.length > 64) {
      return json({ ok: false, error: '密码长度需为 6-64 位' }, 400);
    }
    const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (exists) return json({ ok: false, error: '该账号已注册，请直接登录' }, 409);
    const salt = randomHex(16);
    const hash = await hashPwd(password, salt);
    const now = new Date().toISOString();
    const res = await env.DB.prepare(
      'INSERT INTO users (username, nickname, salt, hash, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(username, nickname, salt, hash, now).run();
    const userId = res.meta.last_row_id;
    const token = randomHex(32);
    await env.DB.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(token, userId, now, Math.floor(Date.now() / 1000) + TTL)
      .run();
    return json({ ok: true, user: { username, nickname, avatar: '', createdAt: now } }, 200, {
      'set-cookie': sessionCookie(token, TTL),
    });
  }

  // 登录
  if (path === '/api/login' && method === 'POST') {
    const username = clean(body.username, 32);
    const password = typeof body.password === 'string' ? body.password : '';
    const row = await env.DB.prepare('SELECT id, username, nickname, avatar, salt, hash FROM users WHERE username = ?').bind(username).first();
    if (!row) return json({ ok: false, error: '账号不存在' }, 404);
    const hash = await hashPwd(password, row.salt);
    if (hash !== row.hash) return json({ ok: false, error: '密码不正确' }, 403);
    const token = randomHex(32);
    const now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(token, row.id, now, Math.floor(Date.now() / 1000) + TTL)
      .run();
    return json({ ok: true, user: { username: row.username, nickname: row.nickname, avatar: row.avatar || '' } }, 200, {
      'set-cookie': sessionCookie(token, TTL),
    });
  }

  // 退出
  if (path === '/api/logout' && method === 'POST') {
    const user = await currentUser(request, env);
    if (user) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(user.token).run();
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  }

  // 当前用户
  if (path === '/api/me' && method === 'GET') {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: true, user: null });
    const favCount = await env.DB.prepare('SELECT COUNT(*) AS c FROM favorites WHERE user_id = ?').bind(user.id).first();
    return json({ ok: true, user: { username: user.username, nickname: user.nickname, avatar: user.avatar || '' }, favorites: favCount ? favCount.c : 0 });
  }

  // 收藏 / 历史
  if (path === '/api/favorites' && method === 'GET') {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: '请先登录' }, 401);
    const rows = await env.DB.prepare('SELECT slug, title, url, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all();
    return json({ ok: true, items: rows.results || [] });
  }

  if (path === '/api/favorites' && method === 'POST') {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: '请先登录' }, 401);
    const slug = clean(body.slug, 200);
    if (!slug) return json({ ok: false, error: '缺少 slug' }, 400);
    await env.DB.prepare('INSERT OR REPLACE INTO favorites (user_id, slug, title, url, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(user.id, slug, clean(body.title, 200), clean(body.url, 300), new Date().toISOString())
      .run();
    const c = await env.DB.prepare('SELECT COUNT(*) AS c FROM favorites WHERE user_id = ?').bind(user.id).first();
    return json({ ok: true, favorited: true, count: c ? c.c : 0 });
  }

  if (path === '/api/favorites' && method === 'DELETE') {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: '请先登录' }, 401);
    const slug = clean(body.slug, 200) || clean(url.searchParams.get('slug'), 200);
    if (!slug) return json({ ok: false, error: '缺少 slug' }, 400);
    await env.DB.prepare('DELETE FROM favorites WHERE user_id = ? AND slug = ?').bind(user.id, slug).run();
    return json({ ok: true, favorited: false });
  }

  if (path === '/api/history' && method === 'GET') {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: '请先登录' }, 401);
    const rows = await env.DB.prepare('SELECT slug, title, url, visited_at FROM history WHERE user_id = ? ORDER BY visited_at DESC LIMIT 100').bind(user.id).all();
    return json({ ok: true, items: rows.results || [] });
  }

  if (path === '/api/history' && method === 'POST') {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: '请先登录' }, 401);
    const slug = clean(body.slug, 200);
    if (!slug) return json({ ok: false, error: '缺少 slug' }, 400);
    await env.DB.prepare('INSERT OR REPLACE INTO history (user_id, slug, title, url, visited_at) VALUES (?, ?, ?, ?, ?)')
      .bind(user.id, slug, clean(body.title, 200), clean(body.url, 300), new Date().toISOString())
      .run();
    return json({ ok: true });
  }

  // 设置 / 清除头像
  if (path === '/api/avatar' && method === 'POST') {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: '请先登录' }, 401);
    const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : '';
    if (avatar) {
      const isData = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(avatar);
      const isUrl = /^https:\/\/[^\s"'<>]+$/.test(avatar);
      if (!isData && !isUrl) return json({ ok: false, error: '头像格式不支持，请选择图片文件' }, 400);
      if (avatar.length > 400000) return json({ ok: false, error: '头像太大，请换一张小一点的图片' }, 413);
    }
    await env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(avatar || null, user.id).run();
    return json({ ok: true, avatar: avatar || '' });
  }

  if (path === '/api/health') return json({ ok: true, service: 'hellogithub-clone-api' });

  return json({ ok: false, error: '接口不存在' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url);
      } catch (e) {
        return json({ ok: false, error: '服务器错误：' + (e && e.message ? e.message : 'unknown') }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
