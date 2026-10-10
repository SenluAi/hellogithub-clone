const fs = require('fs');
for (const f of fs.readdirSync('C:/Users/Mr Li/Desktop/hellogithub-clone').filter(x => x.startsWith('chunk-'))) {
  const s = fs.readFileSync('C:/Users/Mr Li/Desktop/hellogithub-clone/' + f, 'utf8');
  ['rank_by', 'sort_by', 'montly', 'monthly'].forEach(k => {
    let i = s.indexOf(k);
    while (i !== -1) {
      console.log(f + ' [' + k + '] ' + s.slice(Math.max(0, i - 150), i + 150).replace(/\s+/g, ' '));
      i = s.indexOf(k, i + 1);
    }
  });
}
