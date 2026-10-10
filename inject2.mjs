import fs from 'node:fs/promises';

const UA = { 'user-agent': 'Mozilla/5.0', referer: 'https://hellogithub.com/' };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const tags = (await (await fetch('https://api.hellogithub.com/v1/tag/', { headers: UA })).json()).data || [];
const stats = await (await fetch('https://api.hellogithub.com/v1/stats/', { headers: UA })).json();
console.log('标签数:', tags.length, '统计:', JSON.stringify(stats));

const tagHtml = tags.slice(0, 15).map(t =>
  `<a href="https://hellogithub.com/tag/${encodeURIComponent(t.tid)}" target="_blank" rel="noopener" class="flex cursor-pointer flex-row items-center rounded-md py-1.5 pl-1 hover:bg-gray-50 hover:text-blue-400 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400"><span class="truncate text-sm">${esc(t.name)}</span></a>`
).join('');

let html = await fs.readFile('site/index.html', 'utf8');

const tagBlock = /<div class="mt-1 mb-2"><ul class="animate-pulse space-y-2">.*?<\/ul><\/div>/s;
if (!tagBlock.test(html)) throw new Error('没找到标签骨架屏');
html = html.replace(tagBlock, `<div class="mt-1 mb-2">${tagHtml}</div>`);

const pulse = /<div class="mt-1 h-6 w-14 animate-pulse bg-gray-100 dark:bg-gray-700 lg:h-8 lg:w-20"><\/div>/g;
let n = 0;
html = html.replace(pulse, () => {
  n++;
  const v = n === 1 ? stats.user_total : stats.repo_total;
  return `<div class="mt-1 dark:text-gray-200" style="font-size:19px">${esc(v)}</div>`;
});

await fs.writeFile('site/index.html', html);
console.log('替换统计占位:', n, '；文件大小:', html.length);
