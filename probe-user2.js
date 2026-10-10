const fs = require('fs');
const path = require('path');

const d = JSON.parse(fs.readFileSync('details.json', 'utf8'));
console.log('json type =', Array.isArray(d) ? 'array' : typeof d);
console.log('top keys =', Object.keys(d).slice(0, 20).join(','));
const s = JSON.stringify(d);
console.log('json len =', s.length);
console.log('head =', s.slice(0, 400));
const arr = Array.isArray(d) ? d : Object.values(d).find(v => Array.isArray(v));
if (arr && arr[0]) {
  console.log('item count =', arr.length);
  console.log('item keys =', Object.keys(arr[0]).join(','));
  console.log('item sample =', JSON.stringify(arr[0]).slice(0, 600));
}

// 在原始详情页 HTML 里找人物/用户相关片段
const dir = 'detail-raw';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const f0 = files[0];
const h = fs.readFileSync(path.join(dir, f0), 'utf8');
console.log('--- file', f0, 'len', h.length);
['share_user', 'shareUser', '推荐人', '推荐', 'user/', '作者', '投稿'].forEach(kw => {
  let idx = h.indexOf(kw);
  if (idx >= 0) {
    console.log('[' + kw + '] ...' + h.slice(Math.max(0, idx - 120), idx + 160).replace(/\s+/g, ' ') + '...');
  } else {
    console.log('[' + kw + '] not found');
  }
});

// 原站是否有用户主页路由
(async () => {
  for (const u of ['https://hellogithub.com/user/xingkongliang', 'https://hellogithub.com/users/xingkongliang', 'https://hellogithub.com/profile/xingkongliang']) {
    try {
      const r = await fetch(u, { method: 'GET', headers: { 'user-agent': 'Mozilla/5.0' }, redirect: 'manual' });
      console.log('PROBE', u, '->', r.status);
    } catch (e) {
      console.log('PROBE', u, 'ERR', e.message);
    }
  }
})();
