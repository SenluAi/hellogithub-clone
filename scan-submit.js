const fs=require('fs'),path=require('path');
const root=__dirname;
const files=fs.readdirSync(root).filter(f=>/\.(js|html)$/.test(f));
const pats=[/submit/gi,/提交项目/g,/投稿/g];
for(const f of files){
  let t;try{t=fs.readFileSync(path.join(root,f),'utf8')}catch(e){continue}
  for(const p of pats){
    let m;const re=new RegExp(p.source,'g');
    while((m=re.exec(t))){
      const s=Math.max(0,m.index-120),e=Math.min(t.length,m.index+180);
      console.log('=== '+f+' @'+m.index+' ['+p.source+']');
      console.log(t.slice(s,e).replace(/\s+/g,' '));
      if(re.lastIndex>m.index){break}
    }
  }
}
console.log('DONE');
