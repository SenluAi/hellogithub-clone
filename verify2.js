(async () => {
  const base = 'https://hellogithub.senlinlu.cn';
  const idx = await (await fetch(base + '/')).text();
  console.log('首页长度', idx.length);
  console.log('站内详情页链接数:', (idx.match(/href="\.\/repo\//g) || []).length);
  console.log('卡片仍外链 GitHub 数:', (idx.match(/<a[^>]+href="https:\/\/github\.com\//g) || []).length);
  console.log('筛选脚本指向站内:', idx.includes('a[data-card]'));
  const keys = idx.match(/href="\.\/repo\/([^"]+)"/g).slice(0, 3);
  console.log('示例链接:', keys.join(' , '));
  for (const f of ['armory3d__armorpaint.html', 'yang0__handraw-style.html']) {
    const r = await fetch(base + '/repo/' + f);
    const t = await r.text();
    console.log('--- ' + f, r.status, t.length + '字符');
    console.log('   返回首页:', t.includes('返回首页'), '| GitHub按钮:', t.includes('在 GitHub 上查看'), '| 含中文简介:', /[\u4e00-\u9fa5]{6,}/.test(t));
    const sum = (t.match(/class="summary">([^<]{0,60})/) || [])[1] || '';
    console.log('   简介片段:', sum);
  }
})();
