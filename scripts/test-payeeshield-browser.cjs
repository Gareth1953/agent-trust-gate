// Optional UI check. Supply a locally installed Playwright module; no runtime dependency is added.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const { createPayeeShieldDemoServer } = require('../dist/src/payeeshield-demo-server.js');
const output=path.resolve(process.env.ATG_BROWSER_OUTPUT || 'reports/mission-05/browser'); fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});const results=[];
 try{for(const width of [1440,390,320]){
  const server=createPayeeShieldDemoServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const seen=[]; page.on('request',r=>seen.push(r.url()));
  try{
   await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('#evaluate').waitFor({state:'visible'});await page.waitForFunction(()=>!document.getElementById('evaluate').disabled);
   assert.equal(await page.locator('#scenario option').count(),16);
   assert.match(await page.locator('.banner').innerText(),/No bank verification/);
   await page.locator('#amount').fill('45000');await page.locator('#evaluate').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('AMOUNT_ABOVE_DEMO_LIMIT'));assert.equal(await page.locator('#execute').isDisabled(),true);
   await page.locator('#amount').fill('20000');await page.locator('#evaluate').click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('REVIEW'));assert.equal(await page.locator('#execute').isDisabled(),true);
   await page.locator('#amount').fill('8500');await page.locator('#evaluate').click();await page.waitForFunction(()=>!document.getElementById('execute').disabled);
   await page.locator('#amount').fill('8501');assert.equal(await page.locator('#execute').isDisabled(),true);assert.match(await page.locator('#status').innerText(),/stale/);
   await page.locator('#amount').fill('8500');await page.locator('#scenario').selectOption('missing_independent_verification');await page.locator('#evaluate').click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('BLOCK'));assert.equal(await page.locator('#execute').isDisabled(),true);
   await page.locator('#scenario').selectOption('valid_exact_change');await page.locator('#evaluate').click();await page.waitForFunction(()=>!document.getElementById('execute').disabled);
   assert.ok(await page.locator('#checks .pass').count()>5);await page.screenshot({path:path.join(output,`payeeshield-${width}-approved.png`),fullPage:true});
   await page.locator('#fault').selectOption('lost_ack');await page.locator('#execute').click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('UNKNOWN'));assert.equal(await page.locator('#execute').isDisabled(),true);
   // Reconciliation must survive form edits without enabling another execution.
   await page.locator('#amount').fill('8501');assert.equal(await page.locator('#reconcile').isDisabled(),false);await page.locator('#reconcile').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('SAME_PROCESS_SYNTHETIC_RECORD_CONFIRMED'));assert.equal(await page.locator('#execute').isDisabled(),true);
   const evidence=JSON.parse(await page.locator('#evidence').innerText());assert.equal(evidence.independentDestinationEvidence,false);assert.equal(evidence.snapshot.state.version,2);assert.equal(await page.locator('#old').inputValue(),'7319');
   const overflow=await page.evaluate(()=>({document:document.documentElement.scrollWidth>innerWidth,body:document.body.scrollWidth>innerWidth}));assert.deepEqual(overflow,{document:false,body:false});
   assert.deepEqual(errors,[]);assert.ok(seen.every(u=>u.startsWith('http://127.0.0.1:')));
   await page.screenshot({path:path.join(output,`payeeshield-${width}-reconciled.png`),fullPage:true});results.push({width,pass:true,overflow,scenarios:16,scriptErrors:errors,externalRequests:0});
  }finally{await context.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({browser:'Chromium via Playwright',results},null,2)+'\n');console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exitCode=1;});
