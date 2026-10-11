const fs = require('fs');
const f = 'C:/Users/Mr Li/Desktop/hellogithub-clone/src/worker.js';
let t = fs.readFileSync(f, 'utf8');
if (t.includes('/api/submissions')) { console.log('already patched'); process.exit(0); }
const marker = "  if (path === '/api/health')";
const idx = t.indexOf(marker);
if (idx < 0) { console.log('MARKER NOT FOUND'); process.exit(1); }
const block = [
"  // 提交项目：用户投稿",
"  if (path === '/api/submissions' && method === 'POST') {",
"    const user = await currentUser(request, env);",
"    if (!user) return json({ ok: false, error: '请先登录后再提交项目' }, 401);",
"    const urlText = clean(body.url, 300);",
"    const name = clean(body.name, 80);",
"    const category = clean(body.category, 40);",
"    const description = clean(body.description, 1000);",
"    if (!/^https?:\\/\\/\\S+$/i.test(urlText)) return json({ ok: false, error: '请填写以 http(s):// 开头的项目地址' }, 400);",
"    if (name.length < 2) return json({ ok: false, error: '请填写项目名称（至少 2 个字）' }, 400);",
"    if (description.length < 10) return json({ ok: false, error: '项目简介至少 10 个字' }, 400);",
"    const dup = await env.DB.prepare('SELECT id FROM submissions WHERE url = ?').bind(urlText).first();",
"    if (dup) return json({ ok: false, error: '该项目已经提交过了，不用重复提交' }, 409);",
"    const now = new Date().toISOString();",
"    const ins = await env.DB.prepare(",
"      'INSERT INTO submissions (user_id, name, url, category, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'",
"    ).bind(user.id, name, urlText, category, description, 'pending', now).run();",
"    return json({ ok: true, item: { id: ins.meta.last_row_id, name: name, url: urlText, category: category, description: description, status: 'pending', created_at: now } });",
"  }",
"",
"  if (path === '/api/submissions' && method === 'GET') {",
"    const user = await currentUser(request, env);",
"    if (!user) return json({ ok: false, error: '请先登录' }, 401);",
"    const rows = await env.DB.prepare(",
"      'SELECT id, name, url, category, description, status, created_at FROM submissions WHERE user_id = ? ORDER BY id DESC LIMIT 100'",
"    ).bind(user.id).all();",
"    return json({ ok: true, items: rows.results || [] });",
"  }",
"",
"  if (path === '/api/submissions' && method === 'DELETE') {",
"    const user = await currentUser(request, env);",
"    if (!user) return json({ ok: false, error: '请先登录' }, 401);",
"    const id = parseInt(body.id || url.searchParams.get('id'), 10);",
"    if (!id) return json({ ok: false, error: '缺少 id' }, 400);",
"    await env.DB.prepare(\"DELETE FROM submissions WHERE id = ? AND user_id = ? AND status = 'pending'\").bind(id, user.id).run();",
"    return json({ ok: true });",
"  }",
"",
""].join('\n');
t = t.slice(0, idx) + block + t.slice(idx);
fs.writeFileSync(f, t);
console.log('patched, hasSubmissions=' + t.includes('/api/submissions'));
