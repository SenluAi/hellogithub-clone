const fs=require('fs');
const h=fs.readFileSync('C:/Users/Mr Li/Desktop/hellogithub-clone/verify-submit.html','utf8');
console.log('len='+h.length);
['提交新项目','项目地址','hg-sub-form','我的提交','/api/submissions'].forEach(k=>console.log(k+' -> '+h.includes(k)));
