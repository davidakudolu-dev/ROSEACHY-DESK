const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert');
const root='/workspace/roseachy-v2.10.12-smart-sync',results=[],errors=[],contrast=[];
const fixture=JSON.parse(fs.readFileSync('/workspace/roseachy-v2.10.9-backup/tests/full-fixture.json','utf8'));
const html=fs.readFileSync(root+'/app/index.html','utf8');let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const hook=`window.__releaseTest={restoreFullBackup,roseachySafeBackup,applyAppearanceSettings,getAppearanceSettings,finShow,switchDesk,calc,finLedger,busy:()=>finBusy,
 pause(v){finBusy=v},wait:()=>backupWorkChain,desk:()=>currentDesk,
 delaySeal(){const seal=finSeal;let once=true;finSeal=async(...args)=>{if(once){once=false;await new Promise(r=>window.releaseSeal=r)}return seal(...args)}},
 setPeriod(){document.getElementById('anaPeriod').value='30';renderAnalytics()}};`;
async function fresh({instrument=true,offline=false}={}){
 const c=await browser.newContext({serviceWorkers:offline?'allow':'block',viewport:{width:1280,height:1000}}),p=await c.newPage();
 p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 if(instrument)await p.route('**/',r=>r.fulfill({contentType:'text/html',body:html.replace('window.__roseachyDebug=',hook+'window.__roseachyDebug=')}));
 await p.goto('http://127.0.0.1:8777/');await p.waitForFunction(()=>window.RoseachyAdaptiveNavigation);
 await stub(p);return{c,p};
}
async function stub(p){await p.evaluate(()=>{window.downloads=[];RoseachyFiles.save=async(blob,name)=>{downloads.push({name,data:JSON.parse(await blob.text())});return 'download'}})}
async function seed(p){assert.equal(await p.evaluate(d=>__releaseTest.restoreFullBackup(d),fixture),true)}
async function desk(p,d){await p.evaluate(d=>document.querySelector('#deskMenu [data-desk="'+d+'"]').click(),d)}
async function unlock(p,pin='1234'){await p.evaluate(pin=>{document.getElementById('finUnlockPass').value=pin;document.getElementById('finUnlockGo').click()},pin);await p.waitForFunction(()=>!RoseachyFinance.locked());await p.waitForFunction(()=>!__releaseTest.busy());}
async function overview(p){await p.evaluate(()=>__releaseTest.finShow('overview'))}
async function records(p){return p.evaluate(()=>({stock:__roseachyDebug.getStock(),tx:RoseachyStore.getObject('dsb_draft_v2').tx,vault:RoseachyStore.getObject('roseachy_finance_vault_v1'),market:RoseachyStore.getObject('roseachy_market_v1'),notes:RoseachyStore.getObject('dsb_notes_v1'),calc:__releaseTest.calc()}))}
async function check(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name)}catch(e){results.push({name,passed:false,error:e.message});throw e}}
// Evaluate rendered text against the background under that text, including
// sliding selection indicators and alpha/opacity compositing.
async function measure(p,selector){return p.evaluate(selector=>{
 const cv=document.createElement('canvas');cv.width=cv.height=1;const cx=cv.getContext('2d');
 const rgba=s=>{cx.clearRect(0,0,1,1);cx.fillStyle=s;cx.fillRect(0,0,1,1);const a=Array.from(cx.getImageData(0,0,1,1).data);a[3]/=255;return a};
 const over=(a,b)=>{const alpha=a[3]+b[3]*(1-a[3]);return [0,1,2].map(i=>(a[i]*a[3]+b[i]*b[3]*(1-a[3]))/alpha).concat(alpha)};
 const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((x,v,i)=>x+v*[.2126,.7152,.0722][i],0);
 const rows=[];
 for(const parent of document.querySelectorAll(selector)){
  const w=document.createTreeWalker(parent,NodeFilter.SHOW_TEXT);
  while(w.nextNode()){
   const node=w.currentNode,e=node.parentElement;if(!node.textContent.trim()||e.closest('script,style,svg'))continue;
   const range=document.createRange();range.selectNodeContents(node);const rect=range.getBoundingClientRect();if(!rect.width||!rect.height||!e.checkVisibility({checkVisibilityCSS:true}))continue;
   let bg=[255,255,255,1],nodes=[],n=e;
   while(n){nodes.unshift(n);n=n.parentElement}for(const n of nodes)bg=over(rgba(getComputedStyle(n).backgroundColor),bg);
   const seg=e.closest('.hasInd'),button=e.closest('button');
   if(seg&&button?.classList.contains('active')){const ind=seg.querySelector('.tabInd');if(ind)bg=over(rgba(getComputedStyle(ind).backgroundColor),bg)}
   const cs=getComputedStyle(e),fg=rgba(cs.webkitTextFillColor||cs.color);let opacity=1;for(const n of nodes)opacity*=Number(getComputedStyle(n).opacity);fg[3]*=opacity;
   const x=lum(over(fg,bg)),y=lum(bg),ratio=(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
   rows.push({text:node.textContent.trim(),class:e.className,id:e.id,color:cs.webkitTextFillColor,background:bg.slice(0,3),ratio});
  }
 }
 return rows;
},selector)}
async function assertContrast(p,selector,label){const rows=await measure(p,selector);assert(rows.length,label+' has no visible text');const bad=rows.filter(x=>x.ratio<4.5-.01);contrast.push({label,textNodes:rows.length,minRatio:Math.min(...rows.map(x=>x.ratio)),bad});assert.deepEqual(bad,[],label+' contrast');}
(async()=>{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const a=await fresh();await seed(a.p);
 await check('Product-performance cards, details and controls have readable rendered text in Ember and Midnight themes, light and dark',async()=>{
  await desk(a.p,'sales');await a.p.evaluate(()=>{document.getElementById('tabBtnAnalytics').click();__releaseTest.setPeriod();document.querySelectorAll('#tabAnalytics details').forEach(e=>e.open=true);document.querySelector('#anaTopProducts [data-ana-product]')?.click()});
  for(const theme of ['ember','midnightgold','cobalt'])for(const colorMode of ['light','dark']){
   await a.p.evaluate(({theme,colorMode})=>__releaseTest.applyAppearanceSettings({...__releaseTest.getAppearanceSettings(),theme,colorMode}),{theme,colorMode});await sleep(350);
   await assertContrast(a.p,'.rsTrendCard,.rsAnaProductDetail',theme+' '+colorMode+' product performance');
   await a.p.locator('#anaFastCard>summary').hover();await assertContrast(a.p,'#anaFastCard>summary',theme+' '+colorMode+' product hover');
  }
 });
 await check('Market Desk introduction uses readable text on the page surface in Ember and Midnight themes',async()=>{
  await desk(a.p,'market');for(const theme of ['ember','midnightgold','cobalt'])for(const colorMode of ['light','dark']){
   await a.p.evaluate(({theme,colorMode})=>__releaseTest.applyAppearanceSettings({...__releaseTest.getAppearanceSettings(),theme,colorMode}),{theme,colorMode});await sleep(350);await assertContrast(a.p,'.marketHero p',theme+' '+colorMode+' market');
  }
 });
 await check('Financial heading, Recent Activity, Remove Money and activity entries are readable in both modes',async()=>{
  await desk(a.p,'financial');await unlock(a.p);await overview(a.p);
  for(const theme of ['ember','midnightgold','cobalt'])for(const colorMode of ['light','dark']){
   await a.p.evaluate(({theme,colorMode})=>__releaseTest.applyAppearanceSettings({...__releaseTest.getAppearanceSettings(),theme,colorMode}),{theme,colorMode});await sleep(350);
   await assertContrast(a.p,'#finMain>.finTitle h2,#finMain>.finTitle .small,#finMenuBtn,.finSubhead,#finRemove,#finRecent',theme+' '+colorMode+' finance');
   await a.p.locator('#finRemove').hover();await assertContrast(a.p,'#finRemove',theme+' '+colorMode+' remove hover');
   await a.p.locator('#finRecent .finTx').first().hover();await assertContrast(a.p,'#finRecent',theme+' '+colorMode+' activity hover');
  }
 });
 await check('Every exit to Sales, Market and Settings locks immediately; every return requires the existing password',async()=>{
  const before=await records(a.p);
  for(const next of ['sales','market','settings','sales','settings']){
   await overview(a.p);await desk(a.p,next);assert(await a.p.evaluate(()=>RoseachyFinance.locked()));
   assert.equal(await a.p.inputValue('#finEditAmount'),'');assert.equal(await a.p.inputValue('#finEditReason'),'');
   await desk(a.p,'financial');assert(await a.p.locator('#finUnlock').isVisible());assert(await a.p.locator('#finMain').evaluate(e=>e.classList.contains('hidden')));assert.equal(await a.p.inputValue('#finUnlockPass'),'');
   await unlock(a.p);
  }
  assert.deepEqual(await records(a.p),before);
 });
 await check('Unfinished Financial amount and reason survive immediate exit encrypted and return only after authentication',async()=>{
  await overview(a.p);await a.p.evaluate(()=>{document.getElementById('finRemove').click();document.getElementById('finEditAmount').value='73';document.getElementById('finEditReason').value='PRIVATE-EXIT-DRAFT'});
  await desk(a.p,'sales');assert(await a.p.evaluate(()=>RoseachyFinance.locked()));
  const saved=await a.p.evaluate(async()=>{await __releaseTest.wait();return RoseachyStore.getObject('roseachy_working_forms_v1')});assert(saved.financial);assert(!JSON.stringify(saved).includes('PRIVATE-EXIT-DRAFT'));
  await desk(a.p,'financial');assert.equal(await a.p.inputValue('#finEditReason'),'');await unlock(a.p);assert.equal(await a.p.inputValue('#finEditAmount'),'73');assert.equal(await a.p.inputValue('#finEditReason'),'PRIVATE-EXIT-DRAFT');
 });
 await check('Incorrect password after returning keeps Financial Desk locked and business records intact',async()=>{
  const before=await records(a.p);await desk(a.p,'market');await desk(a.p,'financial');await a.p.evaluate(()=>{document.getElementById('finUnlockPass').value='9999';document.getElementById('finUnlockGo').click()});await a.p.waitForFunction(()=>document.getElementById('finGateError').textContent.includes('Unable to unlock'));assert(await a.p.evaluate(()=>RoseachyFinance.locked()));assert.deepEqual(await records(a.p),before);await unlock(a.p);
 });
 await check('Browser Back locks on exit and cannot restore an authenticated session from navigation history',async()=>{
  await overview(a.p);await desk(a.p,'sales');await desk(a.p,'financial');await unlock(a.p);await overview(a.p);
  await a.p.evaluate(()=>history.back());await a.p.waitForFunction(()=>__releaseTest.desk()==='sales');assert(await a.p.evaluate(()=>RoseachyFinance.locked()));await desk(a.p,'financial');assert(await a.p.locator('#finUnlock').isVisible());await unlock(a.p);await overview(a.p);
 });
 await check('Navigating during a Financial save or authentication retains the desk until the action finishes',async()=>{
  await a.p.evaluate(()=>__releaseTest.pause(true));await desk(a.p,'market');assert.equal(await a.p.evaluate(()=>__releaseTest.desk()),'financial');assert.match(await a.p.textContent('#toast'),/action is finishing/);await a.p.evaluate(()=>history.back());await sleep(80);assert.equal(await a.p.evaluate(()=>__releaseTest.desk()),'financial');await a.p.evaluate(()=>__releaseTest.pause(false));await desk(a.p,'market');assert(await a.p.evaluate(()=>RoseachyFinance.locked()));await desk(a.p,'financial');await unlock(a.p);
 });
 await check('A delayed password request from an earlier visit cannot unlock a later Financial Desk visit',async()=>{
  await a.p.evaluate(()=>{document.getElementById('finEditReason').value='DELAYED PRIVATE DRAFT';__releaseTest.delaySeal()});await desk(a.p,'sales');await desk(a.p,'financial');await a.p.evaluate(()=>{document.getElementById('finUnlockPass').value='1234';document.getElementById('finUnlockGo').click()});await desk(a.p,'market');await desk(a.p,'financial');await a.p.waitForFunction(()=>typeof releaseSeal==='function');await a.p.evaluate(()=>releaseSeal());await a.p.evaluate(()=>__releaseTest.wait());await sleep(150);assert(await a.p.evaluate(()=>RoseachyFinance.locked()));await unlock(a.p);assert.equal(await a.p.inputValue('#finEditReason'),'DELAYED PRIVATE DRAFT');
 });
 await check('Both backup buttons still agree after automatic locking and private work restores on a fresh profile',async()=>{
  await desk(a.p,'sales');const before=await records(a.p),one=await a.p.evaluate(()=>__releaseTest.roseachySafeBackup());
  for(const id of ['backupBtn','safetyExportBtn']){const n=await a.p.evaluate(()=>downloads.length);await a.p.evaluate(id=>document.getElementById(id).click(),id);await a.p.waitForFunction(n=>downloads.length>n,n);await a.p.waitForFunction(()=>!document.getElementById('backupBtn').disabled)}
  const exports=await a.p.evaluate(()=>downloads.slice(-2).map(x=>{delete x.data.exportedAt;delete x.data.integrity;return x.data}));assert.deepEqual(exports[0],exports[1]);
  const target=await fresh();assert.equal(await target.p.evaluate(d=>__releaseTest.restoreFullBackup(d),one),true);assert.deepEqual(await records(target.p),before);await desk(target.p,'financial');assert(await target.p.locator('#finUnlock').isVisible());await unlock(target.p);assert.equal(await target.p.inputValue('#finEditReason'),'DELAYED PRIVATE DRAFT');await target.c.close();
 });
 await check('Same-desk Financial selection preserves the current session; explicit Lock still requires the password',async()=>{
  await desk(a.p,'financial');await unlock(a.p);await desk(a.p,'financial');assert.equal(await a.p.evaluate(()=>RoseachyFinance.locked()),false);await a.p.evaluate(()=>document.getElementById('finLockDesk').click());assert(await a.p.evaluate(()=>RoseachyFinance.locked()));await unlock(a.p);assert.equal(await a.p.inputValue('#finEditReason'),'');
 });
 await check('Encrypted exit drafts survive reload while Financial Desk starts locked',async()=>{
  await a.p.evaluate(()=>{document.getElementById('finRemove').click();document.getElementById('finEditAmount').value='39';document.getElementById('finEditReason').value='RELOAD PRIVATE DRAFT'});await desk(a.p,'sales');await a.p.evaluate(()=>__releaseTest.wait());await a.p.reload();await a.p.waitForFunction(()=>window.RoseachyAdaptiveNavigation);assert(await a.p.evaluate(()=>RoseachyFinance.locked()));await desk(a.p,'financial');await unlock(a.p);assert.equal(await a.p.inputValue('#finEditReason'),'RELOAD PRIVATE DRAFT');
 });
 await a.p.evaluate(()=>__releaseTest.applyAppearanceSettings({...__releaseTest.getAppearanceSettings(),theme:'ember',colorMode:'light'}));await overview(a.p);await sleep(400);await a.p.screenshot({path:root+'/tests/ember-financial-light.png'});
 await desk(a.p,'sales');await a.p.evaluate(()=>{document.getElementById('tabBtnAnalytics').click();document.querySelectorAll('#tabAnalytics details').forEach(e=>e.open=true);document.getElementById('anaFastCard').scrollIntoView({block:'start',behavior:'instant'})});await sleep(400);await a.p.screenshot({path:root+'/tests/ember-products-light.png'});
 await a.c.close();assert.deepEqual(errors,[]);fs.writeFileSync(root+'/tests/release-results.json',JSON.stringify({results,errors,contrast,passed:results.length},null,2));await browser.close();
})().catch(async e=>{fs.writeFileSync(root+'/tests/release-results.json',JSON.stringify({results,errors,contrast,fatal:e.stack},null,2));console.error(e.stack);if(browser)await browser.close();process.exit(1)});
