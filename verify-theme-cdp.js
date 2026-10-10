const { spawn } = require('child_process');
const os = require('os'), path = require('path'), fs = require('fs');

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
].find(p => fs.existsSync(p));

const PORT = 9333;
const profile = path.join(os.tmpdir(), 'daisy-theme-verify');
const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  let target = null;
  for (let i = 0; i < 30 && !target; i++) {
    await sleep(400);
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find(t => t.type === 'page');
    } catch (e) {}
  }
  if (!target) { console.log('无法连接无头浏览器'); child.kill(); process.exit(1); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Page.navigate', { url: 'https://hellogithub.senlinlu.cn/' });
  await sleep(6000);

  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result && r.result.result ? r.result.result.value : r.result;
  };

  console.log('按钮存在:', await evalJs(`!!document.querySelector('button[aria-label="Toggle theme"]')`));
  console.log('脚本已注入:', await evalJs(`!!document.getElementById('daisy-theme-toggle')`));
  console.log('点击前 html.class =', JSON.stringify(await evalJs(`document.documentElement.className`)));
  console.log('点击前 body背景 =', await evalJs(`getComputedStyle(document.body).backgroundColor`));

  await evalJs(`document.querySelector('button[aria-label="Toggle theme"]').click()`);
  await sleep(800);

  console.log('--- 第一次点击后 ---');
  console.log('html.class =', JSON.stringify(await evalJs(`document.documentElement.className`)));
  console.log('body背景 =', await evalJs(`getComputedStyle(document.body).backgroundColor`));
  console.log('localStorage.theme =', JSON.stringify(await evalJs(`localStorage.getItem('theme')`)));

  await evalJs(`document.querySelector('button[aria-label="Toggle theme"]').click()`);
  await sleep(800);
  console.log('--- 第二次点击后 ---');
  console.log('html.class =', JSON.stringify(await evalJs(`document.documentElement.className`)));
  console.log('localStorage.theme =', JSON.stringify(await evalJs(`localStorage.getItem('theme')`)));
  console.log('URL =', await evalJs(`location.pathname`));

  ws.close(); child.kill();
  process.exit(0);
})();
