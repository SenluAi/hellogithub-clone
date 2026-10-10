const fs = require('fs');
const path = require('path');

const base = __dirname;
const d = JSON.parse(fs.readFileSync(path.join(base, 'details.json'), 'utf8'));
const k0 = Object.keys(d)[0];
console.log('details share_user sample =', JSON.stringify(d[k0].share_user));

// 1. 改 build-detail.js：推荐人渲染成站内用户主页链接
let bd = fs.readFileSync(path.join(base, 'build-detail.js'), 'utf8');
if (bd.indexOf('slug2uid') < 0) {
  const oldLink = "${r.share_user ? `<span>推荐人 ${esc(r.share_user)}</span>` : ''}";
  const newLink = "${r.share_user ? (() => { const suObj = (typeof r.share_user === 'object') ? r.share_user : null; const nm = suObj ? suObj.nickname : r.share_user; const u = (suObj && suObj.uid) || slug2uid[key]; return u ? `<span>推荐人 <a href=\"../user/${u}.html\" style=\"color:#2563eb;text-decoration:none\">${esc(nm)}</a></span>` : `<span>推荐人 ${esc(nm)}</span>`; })() : ''}";
  if (bd.indexOf(oldLink) >= 0) {
    bd = bd.replace(oldLink, newLink);
    const anchor = "const fileOf = key => key.replace('/', '__') + '.html';";
    const inject = anchor + "\n\nconst slug2uid = {};\ntry {\n  const su = JSON.parse(fs.readFileSync(path.join(base, 'share-users.json'), 'utf8'));\n  Object.keys(su).forEach(u => (su[u].items || []).forEach(it => { slug2uid[it.slug] = u; }));\n} catch (e) { }\n";
    bd = bd.replace(anchor, inject);
    fs.writeFileSync(path.join(base, 'build-detail.js'), bd);
    console.log('build-detail.js patched: share_user -> user page link');
  } else {
    console.log('build-detail.js pattern not found, skip');
  }
} else {
  console.log('build-detail.js already patched');
}

// 2. 改 update.js：把用户主页生成纳入自动更新流程
let up = fs.readFileSync(path.join(base, 'update.js'), 'utf8');
if (up.indexOf('build-user-data.js') < 0) {
  if (up.indexOf("node('build-detail.js');") >= 0) {
    up = up.replace("node('build-detail.js');", "node('build-user-data.js');\n  node('build-user-pages.js');\n  node('build-detail.js');");
    fs.writeFileSync(path.join(base, 'update.js'), up);
    console.log('update.js patched: build user pages during auto update');
  } else {
    console.log('update.js anchor not found');
  }
} else {
  console.log('update.js already patched');
}
