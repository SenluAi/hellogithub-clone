const fs = require('fs'), path = require('path');
const dir = 'site/assets/avatars';
console.log('--- avatar file sizes ---');
for (const f of fs.readdirSync(dir)) {
  const st = fs.statSync(path.join(dir, f));
  if (st.size < 1024) console.log('SMALL', st.size, f);
}
console.log('total files =', fs.readdirSync(dir).length);
console.log('--- nav/header avatar markup in index.html ---');
const idx = fs.readFileSync('site/index.html', 'utf8');
const re = /<img[^>]*avatar[^>]*>/gi;
let m, n = 0;
while ((m = re.exec(idx))) { n++; if (n <= 6) console.log(m[0].slice(0, 220)); }
console.log('index avatar imgs =', n);
console.log('--- grep avatar in inject-auth.js ---');
const a = fs.readFileSync('inject-auth.js', 'utf8').split(/\r?\n/).filter(l => /avatar/i.test(l));
a.slice(0, 10).forEach(l => console.log(l.trim().slice(0, 200)));
console.log('inject-auth avatar lines =', a.length);
