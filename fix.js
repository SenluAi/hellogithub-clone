const fs = require('fs');
const p = 'C:/Users/Mr Li/Desktop/hellogithub-clone/site/index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

// 1) 修复 GitHub 链接里残留的 %2F
let fixed = 0;
h = h.replace(/https:\/\/github\.com\/([^"'\s%]+)%2F([^"'\s]+)/g, function (m, a, b) { fixed++; return 'https://github.com/' + a + '/' + b; });

// 2) RSS 图标改为站内不可跳转（本地没有 RSS 源）
h = h.replace(/<a class="cursor-pointer hover:text-blue-500 hover:text-orange-500" target="_blank" href="https:\/\/hellogithub\.com\/rss" aria-label="footer-link">([\s\S]*?)<\/a>/, function (m, inner) {
  return '<span class="cursor-pointer hover:text-blue-500 hover:text-orange-500" title="RSS">' + inner + '</span>';
});

// 3) 热门标签改为站内客户端筛选
let tags = 0;
h = h.replace(/<a href="https:\/\/hellogithub\.com\/tag\/[^"]+" target="_blank" rel="noopener"/g, function () { tags++; return '<a href="#" rel="noopener" data-daisy-tag="1"'; });

// 4) 注入筛选脚本
const script = `<script>(function(){function cards(){return Array.prototype.slice.call(document.querySelectorAll('a[href^="https://github.com/"]')).filter(function(a){return a.textContent.trim().length>30;});}function bar(t,hit,clear){var b=document.getElementById('daisy-filter-bar');if(!b){b=document.createElement('div');b.id='daisy-filter-bar';b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:8px;z-index:9999;background:#2563eb;color:#fff;padding:6px 14px;border-radius:999px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.25)';document.body.appendChild(b);}b.textContent='已按标签筛选：'+t+'（'+hit+' 个）';var c=document.createElement('a');c.href='#';c.textContent=' 清除';c.style.color='#fff';c.style.marginLeft='6px';c.onclick=function(e){e.preventDefault();clear();b.remove();};b.appendChild(c);}document.addEventListener('click',function(e){var a=e.target.closest?e.target.closest('a[data-daisy-tag]'):null;if(!a)return;e.preventDefault();var label=a.textContent.trim();var list=cards();var hit=0;list.forEach(function(x){var ok=x.textContent.indexOf(label)!==-1;x.style.display=ok?'':'none';if(ok)hit++;});bar(label,hit,function(){list.forEach(function(x){x.style.display='';});});window.scrollTo({top:0,behavior:'smooth'});});})();</script>`;
h = h.replace(/<\/body>/, script + '</body>');

fs.writeFileSync(p, h);
console.log('长度', before, '->', h.length, '| 修复github链接', fixed, '| 标签', tags);
console.log('残留 %2F:', (h.match(/github\.com\/[^"']*%2F/g) || []).length);
console.log('残留 tag 外链:', (h.match(/hellogithub\.com\/tag\//g) || []).length);
console.log('残留 rss 外链:', (h.match(/hellogithub\.com\/rss/g) || []).length);
console.log('中文ok:', h.includes('有趣的开源社区'), '| github链接数:', (h.match(/https:\/\/github\.com\//g) || []).length);
