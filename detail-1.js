const fs = require('fs');
const path = require('path');

const idx = fs.readFileSync('C:/Users/Mr Li/Desktop/hellogithub-clone/site/index.html', 'utf8');
// 提取卡片：github 链接 + 标题
const re = /<a[^>]+href="https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)"[^>]*>([\s\S]*?)<\/a>/g;
let m, repos = [], seen = {};
while ((m = re.exec(idx))) {
  const owner = m[1], name = m[2];
  if (m[3].trim().length < 30) continue;
  const key = owner + '/' + name;
  if (seen[key]) continue;
  seen[key] = 1;
  const h3 = (m[3].match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || '';
  const title = h3.replace(/<[^>]+>/g, '').trim();
  repos.push({ owner, name, title, key });
}
console.log('卡片仓库数:', repos.length);
console.log(repos.slice(0, 3).map(r => r.key + ' | ' + r.title).join('\n'));
fs.writeFileSync('C:/Users/Mr Li/Desktop/hellogithub-clone/repos.json', JSON.stringify(repos, null, 1));

// 先抓一个详情页做样本
(async () => {
  const test = repos[1] || repos[0];
  const url = 'https://hellogithub.com/repository/' + test.key;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const t = await r.text();
  const dir = 'C:/Users/Mr Li/Desktop/hellogithub-clone/detail-raw';
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'sample.html'), t);
  console.log('\n样本:', url, r.status, '长度', t.length);
  console.log('__NEXT_DATA__:', t.includes('__NEXT_DATA__'));
  console.log('含 readme 关键字:', /readme/i.test(t));
  const apis = [...new Set((t.match(/https?:\/\/[^"'\\ ]*\/api\/[^"'\\ ]*/g) || []).concat(t.match(/\/api\/[a-zA-Z0-9\-\/_.?=&]+/g) || []))].slice(0, 12);
  console.log('API 线索:', apis.join(' , '));
  console.log('中文样本:', t.includes(test.title.slice(0, 4)) ? '标题可命中 ' + test.title : '标题未直接命中');
})();
