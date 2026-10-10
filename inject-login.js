const fs = require('fs');
const f = 'C:/Users/Mr Li/Desktop/hellogithub-clone/site/index.html';
let t = fs.readFileSync(f, 'utf8');
if (t.includes('id="hg-login-state"')) { console.log('already injected'); process.exit(0); }
const script = `
<script id="hg-login-state">
(function(){try{var u=JSON.parse(localStorage.getItem('hg_user')||'null');if(!u)return;var a=document.querySelectorAll('a[href$="login/index.html"]');for(var i=0;i<a.length;i++){a[i].textContent=u.name+'（已登录）';a[i].setAttribute('title','已登录：'+u.name+'，点击查看账号或退出');}}catch(e){}})();
</script>
`;
const i = t.lastIndexOf('</body>');
if (i < 0) { console.log('no body tag'); process.exit(1); }
t = t.slice(0, i) + script + t.slice(i);
fs.writeFileSync(f, t);
console.log('injected len=' + t.length);
