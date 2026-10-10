const fs = require('fs');
const log = [];

/* ---------- 1. 首页导航栏头像 ---------- */
const idxPath = 'site/index.html';
let idx = fs.readFileSync(idxPath, 'utf8');
const idxBefore = idx;

const newScript = `<script id="hg-login-state">
(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function seedOf(s){var n=7;for(var i=0;i<s.length;i++)n=(n*31+s.charCodeAt(i))%9973;return n;}
  function defaultAvatar(u){
    var nick=String(u.nickname||u.username||'?');
    var ch=nick.replace(/^\\s+/,'').charAt(0)||'?';
    var colors=['#2563eb','#16a34a','#db2777','#f59e0b','#7c3aed','#0891b2','#dc2626','#0d9488'];
    var c=colors[seedOf(String(u.username||nick))%colors.length];
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="'+c+'"/><text x="32" y="43" font-family="-apple-system,Segoe UI,Microsoft YaHei,sans-serif" font-size="30" fill="#ffffff" text-anchor="middle">'+esc(ch)+'</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }
  function paint(u){
    var a=document.querySelectorAll('a[href$="login/index.html"]');
    for(var i=0;i<a.length;i++){
      var el=a[i];
      if(u){
        var src=u.avatar||defaultAvatar(u);
        el.innerHTML='<img class="hg-nav-avatar" alt="" style="width:22px;height:22px;border-radius:50%;margin-right:6px;object-fit:cover;vertical-align:middle;display:inline-block" src="'+esc(src)+'">'+esc(u.nickname||u.username)+'（已登录）';
        el.setAttribute("title","已登录："+(u.nickname||u.username)+"，点击查看账号或退出");
      }else{
        el.removeAttribute("title");
        el.setAttribute("title","登录 / 注册");
      }
    }
  }
  fetch("/api/me",{credentials:"same-origin"}).then(function(r){return r.json();}).then(function(d){paint(d&&d.user);}).catch(function(){});
})();
</script>`;

const startTag = '<script id="hg-login-state">';
const s1 = idx.indexOf(startTag);
if (s1 === -1) { log.push('FAIL: 首页未找到 hg-login-state 脚本'); }
else {
  const s2 = idx.indexOf('</script>', s1);
  idx = idx.slice(0, s1) + newScript + idx.slice(s2 + '</script>'.length);
  log.push('OK: 首页登录状态脚本已换成带头像版本');
}
if (idx !== idxBefore) fs.writeFileSync(idxPath, idx);

/* ---------- 2. 账号页：头像 + 更换头像 ---------- */
const loginPath = 'site/login/index.html';
let lg = fs.readFileSync(loginPath, 'utf8');
const lgBefore = lg;

const oldCard = `<div class="card" id="userCard" hidden>
<h2>已登录</h2>
<p>昵称：<b id="uNick"></b>　<span class="note">账号：<span id="uName"></span></span></p>`;
const newCard = `<div class="card" id="userCard" hidden>
<h2>已登录</h2>
<div style="display:flex;align-items:center;gap:12px;margin:6px 0 10px">
<img id="uAvatar" alt="我的头像" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:1px solid #e5e7eb;background:#f3f4f6">
<label class="btn gray" for="avatarFile" style="cursor:pointer;margin:0">更换头像</label>
<input type="file" id="avatarFile" accept="image/*" hidden>
<span class="note" id="avatarMsg"></span>
</div>
<p>昵称：<b id="uNick"></b>　<span class="note">账号：<span id="uName"></span></span></p>`;
if (lg.indexOf(oldCard) === -1) log.push('FAIL: 账号页 userCard 结构未匹配');
else { lg = lg.replace(oldCard, newCard); log.push('OK: 账号页已加入头像与上传控件'); }

const oldRender = `function render(user) { if (user) { authCard.hidden = true; userCard.hidden = false; document.getElementById('uNick').textContent = user.nickname || user.username; document.getElementById('uName').textContent = user.username; loadFavs(); } else { authCard.hidden = false; userCard.hidden = true; } }`;
const newRender = `var avatarImg = document.getElementById('uAvatar');
  function defaultAvatar(user) {
    var nick = String((user && (user.nickname || user.username)) || '?');
    var ch = nick.replace(/^\\s+/, '').charAt(0) || '?';
    var colors = ['#2563eb', '#16a34a', '#db2777', '#f59e0b', '#7c3aed', '#0891b2', '#dc2626', '#0d9488'];
    var k = String((user && user.username) || nick), n = 7;
    for (var i = 0; i < k.length; i++) n = (n * 31 + k.charCodeAt(i)) % 9973;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="' + colors[n % colors.length] + '"/><text x="32" y="43" font-family="-apple-system,Segoe UI,Microsoft YaHei,sans-serif" font-size="30" fill="#ffffff" text-anchor="middle">' + esc(ch) + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function render(user) { if (user) { authCard.hidden = true; userCard.hidden = false; document.getElementById('uNick').textContent = user.nickname || user.username; document.getElementById('uName').textContent = user.username; avatarImg.src = user.avatar || defaultAvatar(user); document.getElementById('avatarMsg').textContent = ''; loadFavs(); } else { authCard.hidden = false; userCard.hidden = true; } }
  (function bindAvatarUpload() {
    var file = document.getElementById('avatarFile');
    var msg = document.getElementById('avatarMsg');
    if (!file) return;
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      if (!/^image\\//.test(f.type)) { msg.textContent = '请选择图片文件'; return; }
      msg.textContent = '正在处理…';
      var reader = new FileReader();
      reader.onload = function () {
        var im = new Image();
        im.onload = function () {
          var size = 256, cv = document.createElement('canvas');
          cv.width = size; cv.height = size;
          var cx = cv.getContext('2d'), side = Math.min(im.width, im.height);
          cx.drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, 0, 0, size, size);
          var data = cv.toDataURL('image/jpeg', 0.85);
          api('/api/avatar', 'POST', { avatar: data }).then(function (res) {
            if (res.body && res.body.ok) { avatarImg.src = data; msg.textContent = '头像已更新'; }
            else { msg.textContent = (res.body && res.body.error) || '上传失败，请重试'; }
          }, function () { msg.textContent = '网络异常，请稍后重试'; });
        };
        im.onerror = function () { msg.textContent = '图片无法读取'; };
        im.src = reader.result;
      };
      reader.readAsDataURL(f);
    });
  })();`;
if (lg.indexOf(oldRender) === -1) log.push('FAIL: 账号页 render 函数未匹配');
else { lg = lg.replace(oldRender, newRender); log.push('OK: 账号页头像渲染与上传逻辑已接入'); }

if (lg !== lgBefore) fs.writeFileSync(loginPath, lg);

console.log(log.join('\n'));
