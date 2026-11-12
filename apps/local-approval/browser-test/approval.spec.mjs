// Chromium's virtual authenticator is a SOFTWARE FIXTURE, not a human ceremony.
import { test,expect } from '@playwright/test';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setupApprovalApp,openApprovalApp } from '../server.mjs';
import { DatabaseSync } from 'node:sqlite';
test('browser enrollment, separate sign-in, exact-action approval, logout, retained outcome',async({page,context},testInfo)=>{
  const base=mkdtempSync(join(tmpdir(),'atg-browser-')),root=join(base,'private');setupApprovalApp(root);const app=openApprovalApp(root);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await new Promise(r=>app.server.listen(app.port,'127.0.0.1',r));const cdp=await context.newCDPSession(page);await cdp.send('WebAuthn.enable');
    await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
    await page.goto(app.origin);await expect(page.getByRole('button',{name:'Unlock registration'})).toBeVisible();
    await page.getByLabel('One-time enrollment code').fill(readFileSync(join(root,'enrollment-code.txt'),'utf8').trim());await page.getByRole('button',{name:'Unlock registration'}).click();
    await page.getByRole('button',{name:'Create my local passkey'}).click();await expect(page.getByRole('button',{name:'Sign in with passkey'})).toBeVisible();
    await page.getByRole('button',{name:'Sign in with passkey'}).click();await expect(page.getByRole('button',{name:'Show exact approval request'})).toBeVisible();
    await page.getByRole('button',{name:'Show exact approval request'}).click();await expect(page.locator('#summary')).toContainText('GBP 4000.00');
    await expect(page.locator('#summary')).toContainText('fixture-bank-A');await expect(page.locator('#binding')).toContainText('Action digest:');
    // Screenshot excludes bootstrap, private keys and raw authenticator data.
    await page.screenshot({path:testInfo.outputPath('synthetic-review-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:testInfo.outputPath('synthetic-review-mobile.png'),fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole('button',{name:'Approve this fictional change with passkey'}).click();await expect(page.locator('#outcome')).toContainText('EXECUTED');
    await expect(page.getByRole('button',{name:'Approve this fictional change with passkey'})).toBeHidden();
    await page.getByRole('button',{name:'Check recorded outcome — do not resubmit'}).click();await expect(page.locator('#outcome')).toContainText('AUTHORITATIVE_SYNTHETIC_RECORD');
    await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByRole('button',{name:'Sign in with passkey'})).toBeVisible();
    await page.getByRole('button',{name:'Sign in with passkey'}).click();await expect(page.locator('#outcome')).toContainText('EXECUTED');
    const d=new DatabaseSync(join(root,'witness.sqlite'),{readOnly:true});try{expect(d.prepare('SELECT version FROM resource').get().version).toBe(2);expect(d.prepare('SELECT count(*) AS n FROM approval_audit').get().n).toBe(1);}finally{d.close();}
    expect(errors).toEqual([]);
  }finally{await context.clearCookies();await app.close();rmSync(base,{recursive:true,force:true});}
});
