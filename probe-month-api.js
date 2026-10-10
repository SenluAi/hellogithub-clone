const out = [];
async function probe(path) {
  try {
    const r = await fetch('https://api.hellogithub.com/v1' + path, { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' } });
    const t = await r.text();
    let j = null;
    try { j = JSON.parse(t); } catch (e) { }
    const d = j && j.data;
    out.push('### ' + path + ' status=' + r.status + ' len=' + t.length + ' keys=' + (j ? Object.keys(j).join(',') : 'n/a') + ' count=' + (Array.isArray(d) ? d.length : '-'));
    if (Array.isArray(d) && d[0]) out.push('   item keys: ' + Object.keys(d[0]).join(','));
    if (Array.isArray(d) && d[0]) out.push('   first: ' + JSON.stringify(d[0]).slice(0, 600));
    if (!Array.isArray(d)) out.push('   raw: ' + t.slice(0, 400));
  } catch (e) { out.push('### ' + path + ' ERR ' + e.message); }
}
(async () => {
  for (const p of ['/?sort_by=monthly&page=1', '/?sort_by=newest&page=1', '/?rank_by=yearly&page=1', '/?rank_by=weekly&page=1', '/rank/', '/rank/monthly', '/periodical/', '/?sort_by=all&page=1']) {
    await probe(p);
  }
  console.log(out.join('\n'));
})();
