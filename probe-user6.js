const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.startsWith('chunk-') && f.endsWith('.js'));
const kws = ['uid=', 'fid=', '/api/', 'bf=', 'bf:', 'function bf', 'user_info', 'contribute'];
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  console.log('##### ' + f + ' len=' + t.length);
  for (const kw of kws) {
    let i = t.indexOf(kw);
    let c = 0;
    while (i >= 0 && c < 3) {
      console.log('  [' + kw + '] ...' + t.slice(Math.max(0, i - 130), i + 130).replace(/\s+/g, ' ') + '...');
      i = t.indexOf(kw, i + 1);
      c++;
    }
  }
}
