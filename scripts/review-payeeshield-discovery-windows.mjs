// Local-only static artifact review, installed Edge, fresh temporary profile.
// Run from ATG root with PAYEESHIELD_REVIEW_ROOT pointing at the separate repair worktree.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, writeFile, copyFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, sep, extname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

assert.equal(process.platform, 'win32');
assert.ok(process.env.PAYEESHIELD_REVIEW_ROOT, 'Set PAYEESHIELD_REVIEW_ROOT to the repair worktree');
const atgRoot = process.cwd(), payeeRoot = await realpath(process.env.PAYEESHIELD_REVIEW_ROOT);
const artifact = join(payeeRoot, '.review/artifact');
await mkdir(artifact, { recursive:true });
// Exactly the selected standalone workflow artifact; no scripts/tests/reports are served.
for (const file of ['index.html','Audit.html','thanks.html','site.css','site.js']) await copyFile(join(payeeRoot,file),join(artifact,file));
const outputs = { atg:join(atgRoot,'reports/mission-05-buyer-discovery/browser'), standalone:join(payeeRoot,'reports/mission-05-claims-review/browser') };
for (const path of Object.values(outputs)) await mkdir(path,{recursive:true});
const profile = await mkdtemp(join(tmpdir(),'atg-payeeshield-discovery-edge-'));
const evidence = { profile, runtime:process.version, views:[], pageErrors:[], failedRequests:[], externalPageRequests:[], links:[] };
const servers = [];
let socket, child, nextId = 0;
const pending = new Map();
function call(method,params={},sessionId) {
  return new Promise((accept,reject)=>{
    const id=++nextId, timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},15000);
    pending.set(id,{accept,reject,timer});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
  });
}
async function serve(root, extra={}) {
  const server=createServer(async(req,res)=>{
    try {
      const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const file=extra[path] || resolve(root,'.'+(path.endsWith('/')?path+'index.html':path));
      if (!(file.startsWith(resolve(root)+sep)||Object.values(extra).includes(file))) {res.writeHead(403).end();return;}
      const data=await readFile(file);
      const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.xml':'application/xml','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain','.tgz':'application/octet-stream'};
      res.writeHead(200,{'content-type':(types[extname(file)]||'application/octet-stream'),'cache-control':'no-store'}).end(data);
    } catch {res.writeHead(404).end('Not found');}
  });
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));servers.push(server);
  return 'http://127.0.0.1:'+server.address().port;
}
try {
  const atgBase=await serve(join(atgRoot,'discovery-site'),Object.fromEntries(['llms.txt','agent-trust-gate.discovery.json','agent-trust-gate.agent-card.json','agent-trust-gate.manifest.json','agent-trust-gate.agent-review-invitation.json'].map(p=>['/'+p,join(atgRoot,p)])));
  const payeeBase=await serve(artifact);
  const origins=[atgBase,payeeBase];
  child=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','about:blank'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  let launchError;child.on('error',e=>{launchError=e;});
  let portFile;
  for(let i=0;i<80;i++){if(launchError)throw launchError;try{portFile=await readFile(join(profile,'DevToolsActivePort'),'utf8');break;}catch{await delay(250);}}
  assert.ok(portFile,'Edge starts');const [port,wsPath]=portFile.trim().split(/\r?\n/);
  socket=new WebSocket('ws://127.0.0.1:'+port+wsPath);
  await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});});
  socket.addEventListener('message',e=>{
    const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.accept(m.result);}
    if(m.method==='Runtime.exceptionThrown')evidence.pageErrors.push(m.params.exceptionDetails);
    if(m.method==='Network.responseReceived'&&m.params.response.status>=400&&!m.params.response.url.endsWith('/favicon.ico'))evidence.failedRequests.push({url:m.params.response.url,status:m.params.response.status});
    if(m.method==='Fetch.requestPaused'){
      const allowed=origins.includes(new URL(m.params.request.url).origin);
      if(!allowed)evidence.externalPageRequests.push(m.params.request.url);
      call(allowed?'Fetch.continueRequest':'Fetch.failRequest',{requestId:m.params.requestId,...(allowed?{}:{errorReason:'BlockedByClient'})},m.sessionId).catch(err=>evidence.pageErrors.push(String(err)));
    }
  });
  evidence.browser=await call('Browser.getVersion');
  const {targetId}=await call('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
  const cdp=(method,params)=>call(method,params,sessionId);
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');await cdp('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(35);}throw Error('Timed out: '+expression);};
  const key=async key=>{const event={key,code:key,windowsVirtualKeyCode:{Tab:9,Enter:13,Escape:27,ArrowDown:40,ArrowRight:39,Home:36}[key]};await cdp('Input.dispatchKeyEvent',{type:'keyDown',...event,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await cdp('Input.dispatchKeyEvent',{type:'keyUp',...event});};
  const navigate=async url=>{await cdp('Page.navigate',{url});await wait(`location.href===${JSON.stringify(url)}&&document.readyState==='complete'`);await evaluate('document.fonts.ready');};
  const cases=[['atg',atgBase,['/payeeshield.html','/index.html','/plugin.html','/solutions.html']],['standalone',payeeBase,['/index.html','/Audit.html','/thanks.html']]];
  for(const [site,base,pages]of cases)for(const path of pages)for(const width of [1440,390,320]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width!==1440});
    await navigate(base+path);
    const view={site,path,width,checks:[]};
    const layout=await evaluate(`({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth,h1:document.querySelectorAll('h1').length,unlabelled:[...document.querySelectorAll('input,textarea,select')].filter(e=>!e.labels?.length).map(e=>e.id)})`);
    assert.equal(layout.width,width);assert.equal(layout.document<=width,true,JSON.stringify({site,path,width,layout}));assert.equal(layout.body<=width,true);assert.equal(layout.h1,1);assert.deepEqual(layout.unlabelled,[]);view.layout=layout;
    const text=await evaluate('document.body.innerText');
    if(site==='atg'&&path==='/payeeshield.html')for(const phrase of ['Synthetic demonstration only','public fixture signing keys','GitHub Pages does not run the Node server','same process','local.7 archive','remain unchanged','gareth@agenttrustgate.com'])assert.ok(text.includes(phrase),phrase);
    if(site==='standalone')assert.ok(text.includes('SYNTHETIC DEMONSTRATION'));
    if(site==='standalone'&&path==='/Audit.html'){
      assert.ok(text.includes('opens your email application and may send the supplied information'));
      assert.equal(await evaluate("document.querySelector('form').checkValidity()"),false);
      await evaluate("document.getElementById('scenario-note').value='Fictional fixture evaluation';document.getElementById('consent').checked=true");
      assert.equal(await evaluate("document.querySelector('form').checkValidity()"),true);
      view.checks.push('mailto action inspected; required fields/consent work; no email sent');
    }
    // First native Tab exposes the skip link; Enter moves focus to the main landmark.
    await key('Tab');assert.equal(await evaluate("document.activeElement.classList.contains('skip-link')"),true);
    await key('Enter');await wait("document.activeElement.id==='main'");view.checks.push('keyboard skip link');
    if(site==='atg'&&width<760){
      await evaluate("document.querySelector('[data-menu-toggle]').focus()");await key('Enter');
      await wait("document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded')==='true'");
      assert.equal(await evaluate("document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded')"),'true');
      assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-nav-links]')).display!=='none'"),true);
      await key('Escape');assert.equal(await evaluate("document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded')"),'false');
      assert.equal(await evaluate("document.activeElement===document.querySelector('[data-menu-toggle]')"),true);view.checks.push('keyboard menu open/Escape/focus restoration');
    }
    if(site==='standalone'&&path==='/index.html'){
      await evaluate("document.getElementById('scenario').focus()");await key('Home');await key('ArrowDown');await key('Enter');
      await wait("document.getElementById('result').textContent.startsWith('Illustrative refusal')");
      await key('ArrowDown');await key('Enter');await wait("document.getElementById('result').textContent.startsWith('Illustrative UNKNOWN')");
      assert.ok(await evaluate("document.getElementById('result').textContent.includes('no destination record or reconciliation service')"));view.checks.push('native keyboard fixture selection');
    }
    await evaluate('scrollTo(0,0);document.activeElement.blur()');
    const metrics=await cdp('Page.getLayoutMetrics');
    const png=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.ceil(metrics.cssContentSize.height),scale:1}});
    const filename=path.slice(1).replace('.html','')+'-'+width+'.png';
    await writeFile(join(outputs[site],filename),Buffer.from(png.data,'base64'));view.screenshot=filename;evidence.views.push(view);
    if(width===1440){
      const links=await evaluate("[...document.querySelectorAll('a[href],link[rel=stylesheet],script[src]')].map(e=>e.getAttribute('href')||e.getAttribute('src')).filter(h=>h&&!/^(https?:|mailto:)/.test(h))");
      for(const link of new Set(links)){
        const url=new URL(link,base+path), response=await fetch(url);assert.equal(response.status,200,`${path}: ${link}`);
        if(url.hash)assert.ok((await response.text()).includes(`id="${url.hash.slice(1)}"`),`${path}: ${link}`);
        evidence.links.push({site,page:path,link,status:response.status});
      }
    }
  }
  // Token-like URLs must leave status information unchanged and mint no credentials.
  await navigate(payeeBase+'/thanks.html');const plain=await evaluate('document.body.innerText');
  await navigate(payeeBase+'/thanks.html?token=UNVERIFIED_FIXTURE&PayerID=UNVERIFIED_FIXTURE');
  assert.equal(await evaluate('document.body.innerText'),plain);assert.equal(await evaluate('document.scripts.length'),0);
  evidence.paymentQueryIgnored=true;
  // Follow contextual navigation on both artifacts; mailto and external sites remain untouched.
  await navigate(atgBase+'/payeeshield.html');await evaluate("document.querySelector('a[href=\"./plugin.html\"]').click()");await wait(`location.pathname==='/plugin.html'`);
  await navigate(payeeBase+'/index.html');await evaluate("document.querySelector('a[href=\"./Audit.html\"]').click()");await wait(`location.pathname==='/Audit.html'`);
  evidence.contextualNavigation=true;
  assert.deepEqual(evidence.pageErrors,[]);assert.deepEqual(evidence.failedRequests,[]);assert.deepEqual(evidence.externalPageRequests,[]);
  evidence.passed=true;
}catch(error){evidence.failure=String(error.stack);throw error;}
finally{
  for(const [site,output]of Object.entries(outputs))await writeFile(join(output,'results.json'),JSON.stringify({...evidence,views:evidence.views.filter(v=>v.site===site),links:evidence.links.filter(v=>v.site===site)},null,2)+'\n');
  if(socket?.readyState===WebSocket.OPEN){await call('Browser.close').catch(()=>{});socket.close();}
  if(child?.exitCode===null)child.kill();
  for(const server of servers){server.closeAllConnections();await new Promise(ok=>server.close(ok));}
  console.log(JSON.stringify({passed:evidence.passed,views:evidence.views.length,pageErrors:evidence.pageErrors.length,failedRequests:evidence.failedRequests,externalPageRequests:evidence.externalPageRequests,failure:evidence.failure}));
}
