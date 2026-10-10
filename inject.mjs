import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const BASE = 'https://api.hellogithub.com/v1';
const SITE = 'site';
const ASSETS = path.join(SITE, 'assets');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fmtNum(n) {
  n = Number(n) || 0;
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
}
function fmtTime(t) {
  const d = new Date(t);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return '今天';
  if (days < 30) return days + ' 天前';
  if (days < 365) return Math.floor(days / 30) + ' 个月前';
  return Math.floor(days / 365) + ' 年前';
}
async function saveImg(url) {
  if (!url) return '';
  const ext = path.extname(new URL(url).pathname) || '.png';
  const name = 'avatar-' + crypto.createHash('sha1').update(url).digest('hex').slice(0, 16) + ext;
  const file = path.join(ASSETS, name);
  try { await fs.access(file); return './assets/' + name; } catch {}
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, referer: 'https://hellogithub.com/' } });
    if (!res.ok) return url;
    await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    return './assets/' + name;
  } catch { return url; }
}

const items = [];
for (const page of [1, 2, 3]) {
  const res = await fetch(BASE + '/?sort_by=featured&page=' + page, { headers: { 'user-agent': UA, referer: 'https://hellogithub.com/' } });
  if (!res.ok) { console.log('接口失败 page' + page, res.status); continue; }
  const j = await res.json();
  items.push(...(j.data || []));
  if (!j.has_more) break;
}
console.log('取到项目数:', items.length);

const cards = [];
for (const it of items) {
  const avatar = await saveImg(it.author_avatar);
  const href = 'https://hellogithub.com/repository/' + encodeURIComponent(it.full_name || it.item_id);
  cards.push(`<div class="overflow-hidden"><article class="transform shadow-lg transition-transform hover:scale-105"><a href="${href}" target="_blank" rel="noopener" aria-label="Repository ${esc(it.name)}" class="block"><header class="relative cursor-pointer bg-white px-2.5 py-3 hover:bg-gray-50 hover:text-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 md:px-4">${it.is_hot ? '<div class="absolute top-2 right-0 flex items-center bg-yellow-500 bg-opacity-80 p-1 text-xs font-semibold text-white">推荐</div>' : ''}<div class="flex w-full"><figure class="mr-2.5 hidden md:block"><img width="75" height="75" src="${avatar}" alt="${esc(it.author)} avatar" class="block rounded"/></figure><div class="relative flex w-full flex-col truncate"><div class="flex flex-row pb-0.5"><h2 class="flex w-full items-center"><div class="flex flex-grow items-center truncate text-base leading-snug"><p class="truncate text-sm font-normal md:text-[15px] mr-1 "><span class="font-semibold dark:text-white">${esc(it.name)}</span><span class="mx-0.5 text-gray-500 opacity-40 dark:text-gray-300 md:mx-1">—</span><span class="text-gray-600 dark:text-gray-300">${esc(it.title || '-')}</span></p></div><div class="shrink grow"></div>${it.comment_total > 0 ? `<div class="justify-end"><div class="h-4 whitespace-nowrap rounded-md bg-blue-400 py-0.5 px-2 text-xs font-semibold leading-none text-white dark:text-gray-100">${it.comment_total}</div></div>` : ''}</h2></div><div class="mt-0.5 truncate text-sm text-gray-400">${esc(it.summary || '-')}</div><div class="mt-1 flex items-center"><div class="flex grow items-center text-sm text-gray-400"><img width="16" height="16" src="${avatar}" alt="${esc(it.author)} small avatar" class="mr-1 h-4 w-4 rounded md:hidden"/><div class="flex max-w-[7rem] items-center truncate text-ellipsis md:w-fit md:max-w-[10rem]"><div class="truncate">${esc(it.author)}</div></div><span class="px-1">·</span><span><span style="background-color:${esc(it.lang_color || '#ccc')}" class="relative box-border inline-block h-3 w-3 rounded-full border border-gray-100 align-[-1px] dark:border-gray-500"></span><span class="whitespace-nowrap pl-0.5">${esc((it.primary_lang || '').split(' ')[0])}</span></span><span><span class="px-1">·</span><time>${fmtTime(it.updated_at)}</time></span></div><div class="flex items-center space-x-2"><div class="flex items-center text-sm text-gray-400"><span class="ml-0.5">👁 ${fmtNum(it.clicks_total)}</span></div></div></div></div></div></header></a></article></div>`);
}
const cardsHtml = cards.join('');

let html = await fs.readFile(path.join(SITE, 'index.html'), 'utf8');

html = html.replace(/<script[^>]+src="\.\/assets\/[^"]+\.js"[^>]*><\/script>/g, '');
html = html.replace(/<link rel="preload" href="\.\/assets\/[^"]+\.js"[^>]*\/?>/g, '');

const container = '<div class="divide-y divide-gray-100 overflow-hidden dark:divide-gray-700">';
const ci = html.indexOf(container);
if (ci < 0) throw new Error('没找到列表容器');
let cursor = ci + container.length;
let out = html.slice(0, cursor);
let removed = 0;
while (true) {
  const s = html.indexOf('<div class="relative animate-pulse', cursor);
  if (s < 0) break;
  let depth = 0, i = s;
  while (i < html.length) {
    const open = html.indexOf('<div', i);
    const close = html.indexOf('</div>', i);
    if (close < 0) break;
    if (open >= 0 && open < close) { depth++; i = open + 4; }
    else { depth--; i = close + 6; if (depth === 0) break; }
  }
  out += html.slice(cursor, s);
  cursor = i;
  removed++;
}
out += html.slice(cursor);
html = out.slice(0, ci + container.length) + cardsHtml + out.slice(ci + container.length);
console.log('移除骨架屏块:', removed);

await fs.writeFile(path.join(SITE, 'index.html'), html);
console.log('已注入卡片:', cards.length, '文件大小:', html.length);
