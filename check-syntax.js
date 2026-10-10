const fs = require('fs');
const files = ['site/index.html', 'site/login/index.html'];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, i = 0, bad = 0;
  while ((m = re.exec(s))) {
    i++;
    const code = m[1];
    if (!code.trim()) continue;
    try { new Function(code); } catch (e) { bad++; console.log('语法错误 ' + f + ' 第' + i + '个脚本: ' + e.message); }
  }
  console.log(f + ' 检查脚本 ' + i + ' 个，错误 ' + bad + ' 个');
}
