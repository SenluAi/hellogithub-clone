const fs = require('fs');
const path = require('path');
const base = 'C:/Users/Mr Li/Desktop/hellogithub-clone';
const idxPath = path.join(base, 'site', 'index.html');
const details = JSON.parse(fs.readFileSync(path.join(base, 'details.json'), 'utf8'));
const asciiSlug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const tagMap = {}; let n = 0; const used = {};
for (const [key, r] of Object.entries(details)) for (const t of (r.tags || [])) {
  if (!tagMap[t.name]) {
    let slug = asciiSlug(t.name_en) || asciiSlug(t.name);
    if (!slug) slug = 'tag-' + String(++n).padStart(2, '0');
    while (used[slug]) slug += '-2';
    used[slug] = 1;
    tagMap[t.name] = { slug, items: [] };
  }
  tagMap[t.name].items.push(key);
}
const names = Object.keys(tagMap).sort((a, b) => tagMap[b].items.length - tagMap[a].items.length || a.localeCompare(b, 'zh'));

let idx = fs.readFileSync(idxPath, 'utf8');
const tagAt = idx.indexOf('data-daisy-tag');
const startTag = idx.lastIndexOf('<div class="mt-1 mb-2">', tagAt);
const endTag = idx.indexOf('</div>', idx.lastIndexOf('</a>', idx.indexOf('</div>', tagAt))) + 6;
console.log('定位: startTag=' + startTag, 'endTag=' + endTag, '片段长度=' + (endTag - startTag));
const block = idx.slice(startTag, endTag);
console.log('原块内锚点数:', (block.match(/data-daisy-tag/g) || []).length);
const firstAnchor = (block.match(/<a[^>]*data-daisy-tag="1"[^>]*><span class="truncate text-sm">[^<]+<\/span><\/a>/) || [])[0];
if (startTag < 0 || !firstAnchor) { console.log('未定位到侧栏标签块，未修改'); process.exit(1); }
const attrs = firstAnchor.replace(/^<a /, '').replace(/href="[^"]*"/, '').replace(/>.*$/, '');

const built = '<div class="mt-1 mb-2">' + names.map(name =>
  `<a ${attrs} href="./tag/${tagMap[name].slug}.html"><span class="truncate text-sm">${name}</span></a>`
).join('') + `<a ${attrs} href="./tag/index.html"><span class="truncate text-sm">全部标签…</span></a>` + '</div>';

idx = idx.slice(0, startTag) + built + idx.slice(endTag);
fs.writeFileSync(idxPath, idx);
console.log('侧栏已重建标签项:', names.length, '个 + 全部标签入口');
console.log('剩余 href="#" 死链:', (idx.match(/href="#"/g) || []).length);
