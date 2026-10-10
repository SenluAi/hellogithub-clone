const fs = require('fs');
const path = require('path');
const root = 'C:/Users/Mr Li/Desktop/hellogithub-clone/site';

const homeScript = '<script id="hg-login-state">\n' +
  '(function(){function paint(u){var a=document.querySelectorAll(\'a[href$="login/index.html"]\');for(var i=0;i<a.length;i++){var el=a[i];if(u){el.textContent=u.nickname+"（已登录）";el.setAttribute("title","已登录："+u.nickname+"，点击查看账号或退出");}else{el.setAttribute("title","登录 / 注册");}}}' +
  'fetch("/api/me",{credentials:"same-origin"}).then(function(r){return r.json();}).then(function(d){paint(d&&d.user);}).catch(function(){});})();\n' +
  '</script>\n';

const favBlock = '' +
  '<div id="hg-fav-box" style="position:fixed;right:16px;bottom:20px;z-index:9998;font:14px/1.5 -apple-system,\'Microsoft YaHei\',sans-serif">\n' +
  '<button id="hg-fav-btn" type="button" title="登录后可跨设备同步收藏" style="cursor:pointer;padding:9px 14px;border-radius:20px;border:1px solid #2563eb;background:#fff;color:#2563eb;font-size:14px;font-family:inherit;box-shadow:0 2px 8px rgba(0,0,0,.12)">☆ 收藏</button>\n' +
  '</div>\n' +
  '<script id="hg-fav-script">\n' +
  '(function(){\n' +
  '  var btn=document.getElementById("hg-fav-btn");\n' +
  '  if(!btn) return;\n' +
  '  var slug=location.pathname;\n' +
  '  var h1=document.querySelector("h1");\n' +
  '  var title=((h1?h1.textContent:document.title)||"").trim().slice(0,120);\n' +
  '  var on=false;\n' +
  '  function paint(){btn.textContent=on?"★ 已收藏":"☆ 收藏";btn.style.background=on?"#2563eb":"#fff";btn.style.color=on?"#fff":"#2563eb";}\n' +
  '  function call(method,data){return fetch("/api/favorites",{method:method,credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify(data)}).then(function(r){return r.json().then(function(j){return {status:r.status,body:j};});});}\n' +
  '  fetch("/api/me",{credentials:"same-origin"}).then(function(r){return r.json();}).then(function(d){\n' +
  '    if(!d||!d.user) return;\n' +
  '    fetch("/api/history",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({slug:slug,title:title,url:location.href})}).catch(function(){});\n' +
  '    return fetch("/api/favorites",{credentials:"same-origin"}).then(function(r){return r.json();}).then(function(j){\n' +
  '      if(j&&j.items){for(var i=0;i<j.items.length;i++){if(j.items[i].slug===slug){on=true;break;}}}\n' +
  '      paint();\n' +
  '    });\n' +
  '  }).catch(function(){});\n' +
  '  btn.addEventListener("click",function(){\n' +
  '    call(on?"DELETE":"POST",{slug:slug,title:title,url:location.href}).then(function(res){\n' +
  '      if(res.status===401){location.href="/login/";return;}\n' +
  '      if(res.body&&res.body.ok){on=!on;paint();}\n' +
  '    }).catch(function(){});\n' +
  '  });\n' +
  '})();\n' +
  '</script>\n';

// 1) 首页：改用服务器端会话状态
const homeFile = path.join(root, 'index.html');
let h = fs.readFileSync(homeFile, 'utf8');
if (h.includes('id="hg-login-state"')) {
  h = h.replace(/<script id="hg-login-state">[\s\S]*?<\/script>\s*/, homeScript);
} else {
  const i = h.lastIndexOf('</body>');
  h = h.slice(0, i) + homeScript + h.slice(i);
}
fs.writeFileSync(homeFile, h);
console.log('home updated, hasApiMe=' + h.includes('/api/me'));

// 2) 项目详情页：加收藏按钮 + 阅读记录
const dir = path.join(root, 'repo');
let n = 0;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
for (const f of files) {
  const p = path.join(dir, f);
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes('id="hg-fav-btn"')) continue;
  const i = t.lastIndexOf('</body>');
  if (i < 0) continue;
  t = t.slice(0, i) + favBlock + t.slice(i);
  fs.writeFileSync(p, t);
  n++;
}
console.log('repo pages injected=' + n + ' / total=' + files.length);

// 3) 语法校验
function extract(html, id) {
  const k = 'id="' + id + '">';
  const i = html.indexOf(k);
  if (i < 0) return null;
  const start = i + k.length;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}
const sample = fs.readFileSync(path.join(dir, files[0]), 'utf8');
try { new Function(extract(sample, 'hg-fav-script')); console.log('fav script syntax OK'); }
catch (e) { console.log('fav syntax ERR ' + e.message); }
try { new Function(extract(fs.readFileSync(homeFile, 'utf8'), 'hg-login-state')); console.log('home script syntax OK'); }
catch (e) { console.log('home syntax ERR ' + e.message); }
