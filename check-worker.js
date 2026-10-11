const fs=require('fs');
const src='C:/Users/Mr Li/Desktop/hellogithub-clone/src/worker.js';
fs.copyFileSync(src,'C:/Users/Mr Li/Desktop/hellogithub-clone/_wcheck.mjs');
const {execSync}=require('child_process');
try{
  execSync('node --check "C:/Users/Mr Li/Desktop/hellogithub-clone/_wcheck.mjs"',{stdio:'inherit'});
  console.log('SYNTAX OK');
}catch(e){console.log('SYNTAX FAIL');}
