const fs = require('fs');
const p = 'site/login/index.html';
let s = fs.readFileSync(p, 'utf8');

const oldRender = `  function render(user) {
    if (user) {
      authCard.hidden = true;
      userCard.hidden = false;
      document.getElementById('uNick').textContent = user.nickname || user.username;
      document.getElementById('uName').textContent = user.username;
      loadFavs();
    } else {
      authCard.hidden = false;
      userCard.hidden = true;
    }
  }`;

const newRender = `  var avatarImg = document.getElementById('uAvatar');
  function defaultAvatar(user) {
    var nick = String((user && (user.nickname || user.username)) || '?');
    var ch = nick.replace(/^\\s+/, '').charAt(0) || '?';
    var colors = ['#2563eb', '#16a34a', '#db2777', '#f59e0b', '#7c3aed', '#0891b2', '#dc2626', '#0d9488'];
    var k = String((user && user.username) || nick), n = 7;
    for (var i = 0; i < k.length; i++) n = (n * 31 + k.charCodeAt(i)) % 9973;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="' + colors[n % colors.length] + '"/><text x="32" y="43" font-family="-apple-system,Segoe UI,Microsoft YaHei,sans-serif" font-size="30" fill="#ffffff" text-anchor="middle">' + esc(ch) + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function render(user) {
    if (user) {
      authCard.hidden = true;
      userCard.hidden = false;
      document.getElementById('uNick').textContent = user.nickname || user.username;
      document.getElementById('uName').textContent = user.username;
      avatarImg.src = user.avatar || defaultAvatar(user);
      document.getElementById('avatarMsg').textContent = '';
      loadFavs();
    } else {
      authCard.hidden = false;
      userCard.hidden = true;
    }
  }
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

if (s.indexOf(oldRender) === -1) { console.log('FAIL: render 仍未匹配'); process.exit(1); }
s = s.replace(oldRender, newRender);
fs.writeFileSync(p, s);
console.log('OK: 账号页 render 已替换，文件长度', s.length);
