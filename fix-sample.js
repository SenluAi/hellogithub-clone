const fs = require('fs');
const path = require('path');

const base = __dirname;

// 1. 清理 share-users.json 里的样本残留
const p = path.join(base, 'share-users.json');
const users = JSON.parse(fs.readFileSync(p, 'utf8'));
let removed = 0;
Object.keys(users).forEach(uid => {
  const before = users[uid].items.length;
  users[uid].items = users[uid].items.filter(it => it.slug !== 'sample');
  removed += before - users[uid].items.length;
});
fs.writeFileSync(p, JSON.stringify(users, null, 2), 'utf8');
console.log('removed sample items =', removed);

// 2. build-user-data.js 加过滤，避免下次自动更新再带进来
const bdPath = path.join(base, 'build-user-data.js');
let bd = fs.readFileSync(bdPath, 'utf8');
if (bd.indexOf("slug === 'sample'") < 0) {
  bd = bd.replace("    if (seen.has(slug)) return;", "    if (slug === 'sample') return;\n    if (seen.has(slug)) return;");
  fs.writeFileSync(bdPath, bd);
  console.log('build-user-data.js patched with sample filter');
} else {
  console.log('build-user-data.js already filtered');
}
