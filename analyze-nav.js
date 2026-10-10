const fs = require('fs');
const h = fs.readFileSync('C:/Users/Mr Li/Desktop/hellogithub-clone/site/index.html', 'utf8');
const hrefs = {};
h.replace(/href="([^"]*)"/g, (m, p) => { hrefs[p] = (hrefs[p] || 0) + 1; return m; });
console.log('--- all hrefs ---');
Object.entries(hrefs).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(v, k));
console.log('--- buttons/spans with cursor-pointer count ---', (h.match(/cursor-pointer/g)||[]).length);
