const out = [];
async function probe(path) {
  try {
    const r = await fetch('https://api.hellogithub.com/v1' + path, { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' } });
    const t = await r.text();
    let j = null; try { j = JSON.parse(t); } catch (e) { }
    const d = j && j.data;
    out.push('### ' + path + ' status=' + r.status + ' len=' + t.length + ' count=' + (Array.isArray(d) ? d.length : '-'));
    if (Array.isArray(d)) {
      out.push('   first: ' + JSON.stringify(d[0]).slice(0, 500));
      out.push('   last: ' + JSON.stringify(d[d.length - 1]).slice(0, 300));
      out.push('   months: ' + JSON.stringify(d.map(x => (x.updated_at || '').slice(0, 7)).slice(0, 25)));
    } else out.push('   raw: ' + t.slice(0, 300));
  } catch (e) { out.push('### ' + path + ' ERR ' + e.message); }
}
(async () => {
  for (const p of [
    '/?rank_by=monthly&year=2025&month=9&page=1',
    '/?rank_by=monthly&year=2025&month=8&page=1',
    '/?rank_by=monthly&year=2026&month=9&page=1',
    '/?rank_by=yearly&year=2025&page=1',
    '/?rank_by=yearly&year=2024&page=1',
  ]) await probe(p);
  console.log(out.join('\n'));
})();
