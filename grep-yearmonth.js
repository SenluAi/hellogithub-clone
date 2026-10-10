const fs = require('fs');
const p = 'C:/Users/Mr Li/Desktop/hellogithub-clone/chunk-_app.js';
const s = fs.readFileSync(p, 'utf8');
const keys = ['year', 'month'];
for (const k of keys) {
  let i = s.indexOf(k);
  let n = 0;
  while (i !== -1 && n < 40) {
    console.log('--- [' + k + '] @' + i + ': ' + s.slice(Math.max(0, i - 200), i + 200).replace(/\s+/g, ' '));
    i = s.indexOf(k, i + 1);
    n++;
  }
}
