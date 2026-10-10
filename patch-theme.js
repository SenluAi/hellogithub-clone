const fs = require('fs'), path = require('path');

const SITE = path.join(__dirname, 'site');
const MOON = 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z';

const SCRIPT = `<script id="daisy-theme-toggle">(function(){
  var KEY='theme';
  var MOON='M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z';
  var SUN='M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4L7 17M17 7l1.4-1.4';
  function isDark(){return document.documentElement.classList.contains('dark');}
  function apply(dark){
    document.documentElement.classList.toggle('dark', dark);
    try{localStorage.setItem(KEY, dark?'dark':'light');}catch(e){}
    paint();
  }
  function paint(){
    var dark=isDark();
    document.querySelectorAll('button[aria-label="Toggle theme"]').forEach(function(b){
      var svg=b.querySelector('svg'); if(!svg) return;
      var isMoonOnly=false;
      svg.innerHTML = dark
        ? '<circle cx="12" cy="12" r="4"></circle>'+SUN.split('M').filter(Boolean).map(function(d){return '<path d="M'+d+'"></path>';}).join('')
        : '<path d="'+MOON+'"></path>';
    });
  }
  document.addEventListener('click', function(e){
    var t=e.target;
    var btn=t && t.closest ? t.closest('button[aria-label="Toggle theme"]') : null;
    if(!btn) return;
    e.preventDefault();
    apply(!isDark());
  }, true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', paint); else paint();
})();</script>`;

let patched = 0, skipped = 0;
(function walk(dir){
  fs.readdirSync(dir).forEach(function(f){
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) return walk(p);
    if (!f.endsWith('.html')) return;
    let s = fs.readFileSync(p, 'utf8');
    if (s.includes('daisy-theme-toggle')) { skipped++; return; }
    if (!s.includes('Toggle theme') && !s.includes(MOON)) { skipped++; return; }
    if (s.includes('</body>')) {
      s = s.replace(/<\/body>(?![\s\S]*<\/body>)/, SCRIPT + '</body>');
    } else {
      s = s + SCRIPT;
    }
    fs.writeFileSync(p, s, 'utf8');
    patched++;
  });
})(SITE);
console.log('patched:', patched, 'skipped:', skipped);
