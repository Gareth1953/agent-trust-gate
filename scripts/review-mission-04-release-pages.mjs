import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, writeFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

// Uses installed Edge, built-in Node APIs and an isolated, disposable profile.
// No installation, normal-profile access, persistent settings, or public bind.
assert.equal(process.platform, 'win32');
const captureOnly=process.argv.length===3&&process.argv[2]==='--capture-only';
assert.ok(process.argv.length===2||captureOnly, 'Use no arguments or --capture-only; no profile paths accepted');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = await realpath(join(root, 'discovery-site'));
const reportParent = join(root, 'reports/mission-04-buyer-release/website');
await mkdir(reportParent, { recursive: true });
const output = await mkdtemp(join(reportParent, 'edge-'));
const scratch = await mkdtemp(join(tmpdir(), 'atg-local6-edge-'));
const profile = join(scratch, 'fresh-profile');
await mkdir(profile);
const evidence = { captureOnly, output, scratch, profile, startedAt: new Date().toISOString(), checks: [], viewports: [], consoleErrors: [], requests: [] };
const save = () => writeFile(join(output, 'results.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log('Evidence: ' + output);
let child, socket;
let sequence = 0;
const pending = new Map();
function call(method, params = {}, sessionId) {
  return new Promise((accept, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 15000);
    pending.set(id, { accept, reject, timeout });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET') { res.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = resolve(site, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!target.startsWith(site + sep) || (!['.html', '.css', '.js', '.svg', '.png', '.jpg', '.ico', '.json', '.tgz'].includes(extname(target)) && !target.endsWith(sep + 'SHA256SUMS'))) {
      res.writeHead(403).end(); return;
    }
    const actual = await realpath(target);
    if (!actual.startsWith(site + sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(actual);
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.tgz':'application/octet-stream', '':'text/plain' };
    res.writeHead(200, { 'Content-Type': types[extname(actual)] + (['.html', '.css', '.js', '.json'].includes(extname(actual)) ? '; charset=utf-8' : ''), 'Cache-Control': 'no-store' }).end(body);
    evidence.requests.push({ path: pathname, status: 200 });
  } catch (error) { evidence.requests.push({ path: req.url, status: 404 }); res.writeHead(404).end('Not found'); }
});

try {
  await new Promise(accept => server.listen(0, '127.0.0.1', accept));
  const base = 'http://127.0.0.1:' + server.address().port;
  evidence.preview = base;
  const args = ['--headless=new', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank'];
  evidence.edgeArguments = args;
  child = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  evidence.browserPid = child.pid;
  let browserLog = '';
  child.stdout.on('data', data => { browserLog += data; });
  child.stderr.on('data', data => { browserLog += data; });
  let launchError;
  child.on('error', error => { launchError = error; });
  let portFile;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (launchError) throw launchError;
    try { portFile = await readFile(join(profile, 'DevToolsActivePort'), 'utf8'); break; } catch { /* wait for owned process */ }
    if (child.exitCode !== null) break;
    await delay(250);
  }
  await writeFile(join(output, 'edge-startup.log'), browserLog);
  if (!portFile) throw Error('Edge did not expose DevToolsActivePort within 20 seconds; exit=' + child.exitCode + '; stderr=' + browserLog);
  const [port, wsPath] = portFile.trim().split(/\r?\n/);
  socket = new WebSocket('ws://127.0.0.1:' + port + wsPath);
  await new Promise((accept, reject) => { socket.addEventListener('open', accept, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id); pending.delete(message.id); clearTimeout(item.timeout);
      if (message.error) item.reject(Error(JSON.stringify(message.error))); else item.accept(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') evidence.consoleErrors.push(message.params.exceptionDetails);
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') evidence.consoleErrors.push(message.params.entry);
  });
  evidence.browser = await call('Browser.getVersion');
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params) => call(method, params, sessionId);
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Log.enable');
  // Keep page traffic local. External links are inspected, never opened.
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs', { urls: ['https://*'] });
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 80; i++) { if (await evaluate(expression)) return; await delay(50); }
    throw Error('Page condition timed out: ' + expression);
  };
  const go = async path => {
    await cdp('Page.navigate', { url: base + path });
    await waitFor("location.href === " + JSON.stringify(base + path) + " && document.readyState === 'complete'");
    await evaluate('document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))');
  };
  const click = async (selector, index = 0) => {
    // A wrapped inline link's union box includes non-clickable whitespace.
    // Choose an actual rendered client rect, then verify the pointer hit.
    const point = await evaluate(`(() => {const e=document.querySelectorAll(${JSON.stringify(selector)})[${index}]; if(!e)throw Error('Missing element');e.scrollIntoView({block:'center',behavior:'instant'}); for(const r of e.getClientRects()){if(!r.width||!r.height)continue;const x=r.left+r.width/2,y=r.top+r.height/2; const hit=document.elementFromPoint(x,y); if(hit&&(hit===e||e.contains(hit)))return {x,y};}throw Error('No unobscured rendered click rect: '+e.textContent);})()`);
    await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  };
  const menu = () => evaluate("({expanded:document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'),visible:getComputedStyle(document.querySelector('[data-nav-links]')).display!=='none',focused:document.activeElement===document.querySelector('[data-menu-toggle]')})");
  const capture = async (name, width, y = 0, height) => {
    const metrics = await cdp('Page.getLayoutMetrics');
    const fullHeight = Math.ceil(metrics.cssContentSize.height);
    const png = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width, height: height ?? fullHeight, scale: 1 } });
    await writeFile(join(output, name + '.png'), Buffer.from(png.data, 'base64'));
    return { file: name + '.png', width, height: height ?? fullHeight, y };
  };
  for (const page of ['/security.html','/plugin.html','/index.html']) {
  const pageName = page.slice(1).replace('.html','');
  for (const width of [1440, 390, 320]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 900 : 844, deviceScaleFactor: 1, mobile: width !== 1440 });
    await go(page);
    const observed = await evaluate(`(() => { const width=innerWidth; const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};return {width,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,bodyFont:getComputedStyle(document.body).fontSize,overflow:[...document.querySelectorAll('body *')].filter(visible).map(e=>({tag:e.tagName,class:e.className,text:e.innerText?.slice(0,90),rect:e.getBoundingClientRect().toJSON()})).filter(e=>e.rect.right>width+1||e.rect.left < -1),clipped:[...document.querySelectorAll('p,h1,h2,h3,.notice,a')].filter(visible).filter(e=>['hidden','clip'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1).map(e=>e.innerText),links:[...document.querySelectorAll('a[href]')].map(e=>({text:e.innerText,href:e.getAttribute('href')})),limitations:[...document.querySelectorAll('p,.notice')].filter(visible).map(e=>({text:e.innerText,font:getComputedStyle(e).fontSize,rect:e.getBoundingClientRect().toJSON()})).filter(e=>/not encrypted|No security certification|local.5 download|NTFS|Human and operator|Ordinary email|No production version/.test(e.text))};})()`);
    const view = { page, requestedWidth: width, ...observed, screenshots: [] };
    view.releaseCopy = await evaluate('document.body.innerText');
    view.scrollableBlocks = await evaluate("[...document.querySelectorAll('pre')].map(e=>({text:e.innerText,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,overflowX:getComputedStyle(e).overflowX}))");
    evidence.viewports.push(view);
    view.screenshots.push(await capture(pageName + '-' + width + '-full', width));
    assert.equal(view.width, width, 'Layout viewport must not auto-expand beyond the requested width');
    assert.equal(view.scrollWidth, view.clientWidth, 'No page-level horizontal overflow');
    view.uncontainedOverflow = await evaluate("[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||r.right<=document.documentElement.clientWidth+1&&r.left>=-1)return false;const scroller=e.closest('pre,.table-scroll');return !scroller||!['auto','scroll'].includes(getComputedStyle(scroller).overflowX);}).map(e=>({tag:e.tagName,text:e.innerText?.slice(0,90)}))");
    assert.deepEqual(view.uncontainedOverflow, [], 'Out-of-viewport content must be contained in an intentional scroll block');
    const regions=page==='/security.html'?['.surface','main .section:last-child .surface','.site-footer']:page==='/plugin.html'?['#mission-04','#install','.site-footer']:['#plugin','.site-footer'];
    for(const [regionIndex,selector] of regions.entries()){const rect=await evaluate('(()=>{const r=document.querySelector('+JSON.stringify(selector)+').getBoundingClientRect();return {y:Math.max(0,Math.floor(r.top+scrollY)),height:Math.ceil(r.height)+1};})()');view.screenshots.push(await capture(pageName+'-'+width+'-detail-'+regionIndex,width,rect.y,Math.min(rect.height,view.height-rect.y)));}
    if(captureOnly){view.documentOverflow=false;await save();console.log('Detail captures '+page+' '+width+'px');continue;}
    if (width !== 1440) {
      assert.equal((await menu()).expanded, 'false');
      await click('[data-menu-toggle]');
      view.menuOpened = await menu(); assert.equal(view.menuOpened.expanded, 'true'); assert.equal(view.menuOpened.visible, true);
      view.screenshots.push(await capture(pageName + '-' + width + '-menu-open', width, 0, 844));
      await click('[data-menu-toggle]'); view.menuButtonClosed = await menu(); assert.equal(view.menuButtonClosed.expanded, 'false'); assert.equal(view.menuButtonClosed.visible, false);
      await click('[data-menu-toggle]');
      await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      view.menuEscapeClosed = await menu(); assert.equal(view.menuEscapeClosed.expanded, 'false'); assert.equal(view.menuEscapeClosed.visible, false); assert.equal(view.menuEscapeClosed.focused, true);
      await click('[data-menu-toggle]');
    }
    await click('.nav-links a[href="./technology.html"]');
    await waitFor("location.pathname === '/technology.html' && document.readyState === 'complete'");
    view.headerNavigation = await evaluate('({path:location.pathname,title:document.title,menuExpanded:document.querySelector("[data-menu-toggle]").getAttribute("aria-expanded")})');
    await go(page);
    await click('.site-footer a[href="./privacy.html"]');
    await waitFor("location.pathname === '/privacy.html' && document.readyState === 'complete'");
    view.footerNavigation = await evaluate('({path:location.pathname,title:document.title})');
    await go(page);
    await click('.site-header .brand');
    await waitFor("location.pathname === '/' && document.readyState === 'complete'");
    view.homeNavigation = await evaluate('({path:location.pathname,title:document.title})');
    await go(page);
    view.linkResponses = [];
    for (const href of new Set(view.links.map(link => link.href).filter(href => href.startsWith('./')))) {
      const response = await fetch(new URL(href, base + page));
      const bytes=Buffer.from(await response.arrayBuffer());
      view.linkResponses.push({ href, status: response.status, size:bytes.length, sha256:createHash('sha256').update(bytes).digest('hex') }); assert.equal(response.status, 200);
    }
    view.clickedLocalLinks = [];
    for (const [index, link] of view.links.entries()) {
      if (link.href === '#main' || !(link.href.startsWith('./')||link.href.startsWith('#')) || /\.tgz$|SHA256SUMS$/.test(link.href)) continue;
      await go(page);
      const inMenu = await evaluate(`Boolean(document.querySelectorAll('a[href]')[${index}].closest('[data-nav-links]'))`);
      if (width !== 1440 && inMenu) await click('[data-menu-toggle]');
      await click('a[href]', index);
      const expected = new URL(link.href, base + page).href;
      await waitFor('location.href === ' + JSON.stringify(expected) + " && document.readyState === 'complete'");
      view.clickedLocalLinks.push({ ...link, index, path: new URL(expected).pathname, passed: true });
    }
    // Exercise the visible keyboard skip link as well as pointer navigation.
    await go(page);
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    view.skipLinkFocused = await evaluate("document.activeElement.matches('.skip-link') && document.activeElement.getBoundingClientRect().top >= 0");
    assert.equal(view.skipLinkFocused, true);
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await waitFor("location.hash === '#main'");
    view.skipLinkActivated = true;
    assert.match(view.releaseCopy, /unpublished[\s\S]{0,60}local\.6|local\.6[\s\S]{0,60}unpublished/i);
    assert.match(view.releaseCopy, /local\.5/);
    assert.match(view.releaseCopy, /not encrypted by ATG/);
    assert.match(view.releaseCopy, /NTFS/);
    const sealed=JSON.parse(await readFile(join(root,'reports/mission-04-buyer-release/archive.json'),'utf8'));
    for(const link of view.linkResponses.filter(link=>link.href.endsWith(sealed.filename)))assert.equal(link.sha256,sealed.sha256);
    view.documentOverflow = view.scrollWidth > view.clientWidth;
    await save();
    console.log('Captured/tested '+page+' ' + width + 'px; document overflow=' + view.documentOverflow + '; out-of-viewport elements=' + view.overflow.length);
  }
  }
  evidence.completed = true;
  evidence.visualInspection = 'Pending direct inspection of captured screenshots; DOM checks alone are not a visual pass.';
} catch (error) {
  evidence.completed = false;
  evidence.blocker = error.stack ?? String(error);
  process.exitCode = 1;
  console.error(evidence.blocker);
} finally {
  if (socket?.readyState === WebSocket.OPEN) { try { await call('Browser.close'); } catch { /* owned browser may close transport first */ } socket.close(); }
  if (child && child.exitCode === null) { await delay(500); if (child.exitCode === null) child.kill(); }
  server.closeAllConnections();
  await new Promise(accept => server.close(accept));
  evidence.finishedAt = new Date().toISOString();
  evidence.cleanup = 'Local preview server closed. Only the owned fresh-profile Edge process was closed; temporary profile and evidence retained.';
  await save();
}
