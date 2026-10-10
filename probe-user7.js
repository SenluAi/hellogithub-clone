const fs = require('fs');

const f1 = fs.readdirSync('.').find(f => f.indexOf('0c428ae2') >= 0);
console.log('=== ' + f1);
console.log(fs.readFileSync(f1, 'utf8'));

const f2 = fs.readdirSync('.').find(f => f.indexOf('chunk-__next_static_chunks_191') >= 0);
const t2 = fs.readFileSync(f2, 'utf8');
console.log('=== ' + f2 + ' len=' + t2.length);
['http', 'md5', '.json', 'share', 'dynamic', 'favorite'].forEach(kw => {
  let i = t2.indexOf(kw), c = 0;
  while (i >= 0 && c < 4) {
    console.log('  [' + kw + '] ...' + t2.slice(Math.max(0, i - 120), i + 140).replace(/\s+/g, ' ') + '...');
    i = t2.indexOf(kw, i + 1); c++;
  }
});
