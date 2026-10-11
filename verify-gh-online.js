const fs = require('fs');
const base = 'https://hellogithub.senlinlu.cn';
const targets = [
  '/repo/1Panel-dev__1Panel.html',
  '/repo/86Box__86Box.html',
  '/repo/flet-dev__flet.html',
  '/repo/abue-ammar__tinycast.html',
  '/article/0ca2b2d2153548898b4bbab9e4c68a7c.html',
];
(async () => {
  for (const t of targets) {
    try {
      const r = await fetch(base + t, { headers: { 'user-agent': 'Mozilla/5.0' } });
      const h = await r.text();
      const gh = (h.match(/href="https:\/\/github\.com\/[^"]+"/g) || []);
      console.log(t + ' -> ' + r.status + ' | GitHub跳转链接 ' + gh.length + ' 条' + (gh[0] ? ' | 例:' + gh[0].slice(0, 70) : '') + ' | 残留复制提示=' + h.includes('复制地址到浏览器打开'));
    } catch (e) {
      console.log(t + ' 请求失败 ' + e.message);
    }
  }
})();
