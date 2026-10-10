const fs=require('fs'),vm=require('vm');
const s=fs.readFileSync('C:/Users/Mr Li/Desktop/hellogithub-clone/site/index.html','utf8');
const i=s.indexOf('daisy-theme-toggle');
console.log('injected at', i, 'of', s.length);
const st=s.indexOf('>',i)+1, en=s.indexOf('</script>',st);
const code=s.slice(st,en);
try{ new vm.Script(code); console.log('script syntax OK, len', code.length); }catch(e){ console.log('SYNTAX ERROR', e.message); }
console.log('tail:', JSON.stringify(s.slice(en, en+40)));
