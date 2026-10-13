const fs = require('fs');
const path = require('path');
const start = parseInt(process.argv[2] || '0', 10);
const count = parseInt(process.argv[3] || '20', 10);
const repos = JSON.parse(fs.readFileSync(path.join(__dirname, 'repos.json'), 'utf8'));
const rawDir = path.join(__dirname, 'detail-raw');
fs.mkdirSync(rawDir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const slice = repos.slice(start, start + count);
  let ok = 0, skip = 0, fail = [];
  for (const r of slice) {
    const file = path.join(rawDir, r.owner + '__' + r.name + '.html');
    if (fs.existsSync(file) && fs.statSync(file).size > 5000) { skip++; continue; }
    let done = false;
    for (let attempt = 0; attempt < 2 && !done; attempt++) {
      try {
        const res = await fetch('https://hellogithub.com/repository/' + r.key, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        const t = await res.text();
        if (res.status === 200 && t.includes('__NEXT_DATA__')) { fs.writeFileSync(file, t); ok++; done = true; }
        else fail.push(r.key + ':' + res.status);
      } catch (e) { fail.push(r.key + ':' + e.message); }
      await sleep(500);
    }
    await sleep(700);
  }
  console.log('本批 ' + start + '-' + (start + slice.length - 1) + ' | 新抓 ' + ok + ' | 跳过 ' + skip + ' | 失败 ' + fail.length);
  if (fail.length) console.log(fail.join(' ; '));
  console.log('raw 目录文件数:', fs.readdirSync(rawDir).length);
})();
