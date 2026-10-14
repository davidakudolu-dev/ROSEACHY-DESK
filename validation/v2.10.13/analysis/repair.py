from pathlib import Path
r=Path('/workspace/roseachy-v2.10.12-ember-review');s=(r/'original/index.html').read_text()
def sub(a,b,count=1):
 global s
 assert s.count(a)==count,(a[:120],s.count(a),count)
 s=s.replace(a,b)
def line(prefix,replacement):
 global s
 old=next(x for x in s.splitlines() if x.startswith(prefix));sub(old,replacement)
sub("['suppliers','deletedSuppliers','requests','history','deletedActive','deletedRequests','deletedHistory','deletedLists']", "['suppliers','deletedSuppliers','requests','history','sessions','deletedActiveLists','deletedActive','deletedRequests','deletedHistory','deletedLists']")
sub("  const m=data.market||{};", "  const m=data.market||{};if(own(m,'budget'))put('market.settings','shared',{budget:m.budget});")
sub("['suppliers','deletedSuppliers','requests','history','deletedActive','deletedRequests','deletedHistory','deletedLists','activeLists','marketPurchases']", "['suppliers','deletedSuppliers','requests','history','sessions','deletedActiveLists','deletedActive','deletedRequests','deletedHistory','deletedLists','activeLists','marketPurchases']")
sub("m.active=[];m.supplierPurchases=m.marketPurchases;", "if(rows['market.settings:shared'])m.budget=rows['market.settings:shared'].budget;m.active=[];m.supplierPurchases=m.marketPurchases;")
# Keep operator-prepared work in automatic Low Stock lists; generated alerts remain local.
sub("for(const l of m.activeLists||[]){if(l.systemLowStock)continue;const h=copy(l);delete h.items;delete h.updatedAt;put('market.activeLists',l.id,h);for(const v of l.items||[])put('market.items',v.id,{...v,activeListId:l.id})}", "for(const l of m.activeLists||[]){const items=l.systemLowStock?(l.items||[]).filter(v=>v.purchase||v.customerRequestIds?.length||(!v.autoLow&&v.manualNew)):(l.items||[]);if(l.systemLowStock&&!items.length)continue;const h=copy(l);delete h.items;delete h.updatedAt;put('market.activeLists',l.id,h);for(const v of items)put('market.items',v.id,{...v,activeListId:l.id})}")
line(' const lows=m.activeLists.filter', ''' const lows=m.activeLists.filter(l=>l.systemLowStock&&!l.supplierId);if(lows.length>1){const keep=lows[0],merged=new Set();for(const extra of lows.slice(1)){if(extra.items.some(item=>item.purchase&&keep.items.some(v=>v.productId===item.productId&&v.purchase&&v.id!==item.id)))continue;for(const item of extra.items){const i=item.productId?keep.items.findIndex(v=>v.productId===item.productId):-1;if(i>=0){if(!item.purchase||keep.items[i].purchase)continue;keep.items.splice(i,1)}keep.items.push(item)}merged.add(extra.id);keep.updatedAt=nowIso()}m.activeLists=m.activeLists.filter(l=>!merged.has(l.id))}''')
# Both peers must understand causal events and complete Market records; older readers reject protocol 2.
sub("SHADOW='roseachy_sync_shadow:',PROTOCOL=1;", "SHADOW='roseachy_sync_shadow:',PROTOCOL=2;")
sub("if(f.protocol!==PROTOCOL||!f.payload", "if(f.protocol===1)throw Error('This sync file uses the earlier merge protocol. Update both devices to the Market/Sync repair and re-export. Full Backups remain supported.');if(f.protocol!==PROTOCOL||!f.payload")
# Capture causal predecessors atomically with each new event. Existing event contents/IDs remain unchanged.
sub("checkpoint:s.checkpoint?.id||null,timestamp:nowIso()", "checkpoint:s.checkpoint?.id||null,dependsOn:s.checkpoint?Object.fromEntries(s.members.filter(d=>d!==identity().deviceId).map(d=>[d,Math.max(s.checkpoint.cut[d]||0,...events().filter(e=>e.deviceId===d).map(e=>e.seq))])):{},timestamp:nowIso()")
line(' function sortedEvents(',r''' function sortedEvents(list,cp){
  const accounted=new Set(cp.accountedEventIds),remaining=list.filter(e=>!accounted.has(e.id)),byDevice=new Map(),cursor={...cp.cut};
  for(const e of remaining){if(!byDevice.has(e.deviceId))byDevice.set(e.deviceId,[]);byDevice.get(e.deviceId).push(e);if(e.dependsOn!=null){if(typeof e.dependsOn!=='object'||Array.isArray(e.dependsOn))throw Error('Invalid causal dependencies.');for(const[d,seq]of Object.entries(e.dependsOn))if(!cp.members.includes(d)||!Number.isSafeInteger(seq)||seq<0)throw Error('Invalid causal dependency.');}}
  for(const[d,values]of byDevice){values.sort((a,b)=>a.seq-b.seq);let next=(cp.cut[d]||0)+1;for(const e of values){if(e.seq!==next)throw Error('Missing event dependency from '+d+': sequence '+next);next++}}
  const ordered=[];while(ordered.length<remaining.length){const ready=[...byDevice.values()].map(a=>a[0]).filter(e=>e&&Object.entries(e.dependsOn||{}).every(([d,seq])=>seq<=(cursor[d]||0))).sort((a,b)=>a.seq-b.seq||a.deviceId.localeCompare(b.deviceId));if(!ready.length)throw Error('Missing causal event dependency or cyclic event order. Exchange the preceding updates first.');const e=ready[0];ordered.push(e);cursor[e.deviceId]=e.seq;byDevice.get(e.deviceId).shift()}return ordered;
 }''')
# Promote previously omitted Market data to ordinary events on the first upgraded start.
sub('  RS.setCommitObserver(prepareCommit);initialized=true;installUI();', '''  RS.setCommitObserver(prepareCommit);initialized=true;
  if(state().marketCoverageVersion!==3){const upgrade=copy(state()),current=copy(getMarketState());if(upgrade.checkpoint){const shadow=copy(upgrade.shadows[KEY.market]||{});shadow.sessions=[];shadow.deletedActiveLists=[];shadow.activeLists=(shadow.activeLists||[]).filter(l=>!l.systemLowStock);delete shadow.budget;upgrade.shadows[KEY.market]=shadow;}upgrade.marketCoverageVersion=3;if(upgrade.checkpoint)await RS.atomic(()=>{persist(upgrade);setMarketState(current)});else await write(()=>persist(upgrade));}
  installUI();''')
# Funding deficits remain visible while valid purchases merge once.
insert=r''' function fundingShortages(rows,cp){const funds=new Map();if(cp.unallocatedMarketAdvance)funds.set('baseline-advance:'+cp.id,Number(cp.unallocatedMarketAdvance));for(const[k,r]of Object.entries(rows)){if(!k.startsWith('tx:'))continue;const t=r.value,id=t.marketAdvanceId;if(!id)continue;const delta=t.type==='market_advance'?Number(t.amount):t.type==='market_advance_return'||['purchase_cash','supplier_pay_cash'].includes(t.type)?-Number(t.amount):0;funds.set(id,r2((funds.get(id)||0)+delta));}return [...funds].filter(([,v])=>v<-.004).map(([id,v])=>({key:'advance-shortage:'+id,type:'market-advance-shortage',advanceId:id,missing:r2(-v),help:'Recorded payments exceed this market advance. Both purchases remain recorded. Verify the actual funding and correct the linked payments before spending further from this advance.'}));}
 function isDiscrepancy(c){return ['stock-shortage','market-advance-shortage'].includes(c.type);}
'''
sub(' function projection(cp,list,resolutions={}){',insert+' function projection(cp,list,resolutions={}){')
sub('  return {stock,rows,financeRows,conflicts,applied,openingDeltas};', '  conflicts.push(...fundingShortages(rows,cp));return {stock,rows,financeRows,conflicts,applied,openingDeltas};')
sub("pr.conflicts.filter(x=>x.type!=='stock-shortage')", "pr.conflicts.filter(x=>!isDiscrepancy(x))")
sub("s.shortages=pr.conflicts.filter(x=>x.type==='stock-shortage');", "s.shortages=pr.conflicts.filter(isDiscrepancy);")
sub("if(added.length){s.status='Local Changes Pending';accountCache=null}", "if(s.checkpoint)s.shortages=[...(s.shortages||[]).filter(c=>c.type!=='market-advance-shortage'),...fundingShortages(flatten(after),s.checkpoint)];if(added.length){s.status='Local Changes Pending';accountCache=null}")
sub("if(c.type==='stock-shortage'){html+=", "if(c.type==='market-advance-shortage'){html+='<p>Funding shortage: '+esc(fmt(c.missing))+'. Purchases and payments will stay recorded for review.</p>'}else if(c.type==='stock-shortage'){html+=")
sub("+' stock discrepancies'", "+' stock/funding discrepancies'")
sub("+' stock discrepancies. Export an acknowledgement", "+' stock/funding discrepancies. Export an acknowledgement")
# Save peer receipt metadata and accounting in the same durable transaction.
line(' async function merge(',''' async function merge(p,resolutions=null){return guard(async()=>{const plan=await planUpdates(p,resolutions),s=copy(state());s.peers[p.sender.deviceId]={known:copy(p.known),label:p.sender.label,lastReceived:nowIso(),enrolledAt:nowIso(),awaitingConfirmation:true};s.imports[p.exportId]={sender:p.sender.deviceId,appliedAt:nowIso(),newEvents:plan.summary.newEvents};if(Object.keys(s.imports).length>1000){const ids=Object.keys(s.imports);for(const id of ids.slice(0,ids.length-1000))delete s.imports[id]}return await applyProjection(plan.checkpoint,plan.all,plan.resolutions,s,{newEvents:plan.summary.newEvents,duplicates:plan.summary.duplicates})})}''')
sub("if($('syncPanel'))$('syncPanel').classList.add('hidden');}", "if($('syncPanel'))$('syncPanel').classList.add('hidden');if($('syncGate'))$('syncGate').classList.remove('hidden');}")
# A pending imported plaintext file must not leave bank records unencrypted in local recovery storage.
sub("imported=await unprotect(syncFile);await write(()=>{", "requireAuth();imported=await unprotect(syncFile);const pendingBox=await finSeal(requireAuth().key,new TextEncoder().encode(JSON.stringify(syncFile)));await write(()=>{")
sub("s.pendingImport={file:syncFile,receivedAt:nowIso(),name:file.name};", "s.pendingImport={sealedFile:pendingBox,receivedAt:nowIso(),name:file.name};")
sub("const text=JSON.stringify(p.file);await importFile", "const text=JSON.stringify(p.sealedFile?await privateData(p.sealedFile):p.file);await importFile")
# Old pending plaintext files are sealed on successful PIN authorization, without changing exchange format.
sub("auth={key,privateData,initialFinance:null,expires:Date.now()+5*60*1000};", "auth={key,privateData,initialFinance:null,expires:Date.now()+5*60*1000};if(state().pendingImport?.file){const s=copy(state()),p=s.pendingImport;p.sealedFile=await finSeal(key,new TextEncoder().encode(JSON.stringify(p.file)));delete p.file;await write(()=>persist(s));}")
(r/'app/index.html').write_text(s)
sw=(r/'original/sw.js').read_text().replace("2.10.12-ember-shortcut-swipe-repair-20261014","2.10.13-market-sync-review-20261014");(r/'app/sw.js').write_text(sw)
print('Applied targeted Market/Smart Sync repairs; retained uploaded themes and swipe code.')
