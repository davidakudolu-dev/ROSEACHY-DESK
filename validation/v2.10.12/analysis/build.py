from pathlib import Path
import re
r=Path('/workspace/roseachy-v2.10.12-smart-sync')
s=(r/'original/index.html').read_text()
def sub(a,b,n=1):
 global s
 assert s.count(a)==n,(a[:90],s.count(a),n)
 s=s.replace(a,b)
sub('content="2.10.11"','content="2.10.12"')
sub('const DB_VERSION = 7;','const DB_VERSION = 8;')
shadow_keys=['dsb_stock_v2','dsb_saved_v2','dsb_draft_v2','roseachy_market_v1','dsb_notes_v1','dsb_stock_trash_v2','dsb_tx_trash_v2','roseachy_inventory_audit_v1','roseachy_appearance_v1','roseachy_finance_vault_v1','roseachy_finance_review_v1']
shadow_map=''.join(repr('roseachy_sync_shadow:'+k)+":'synchronization'," for k in shadow_keys)
sub('  const STORE_OF = {',"  const STORE_OF = {\n    "+shadow_map+"roseachy_sync_pending_file_v1:'synchronization',roseachy_sync_session_v1:'synchronization',roseachy_sync_checkpoint_v1:'synchronization',roseachy_sync_state_v1:'synchronization',roseachy_sync_identity_v1:'synchronization',roseachy_sync_events_v1:'synchronization',")
sub('  const COLLECTIONS = {',"  const COLLECTIONS = {\n    roseachy_sync_events_v1:{store:'syncEventRecords',kind:'syncEvent'},")
sub('  const KEYS = Object.keys(STORE_OF);',"  const KEYS = Object.keys(STORE_OF);\n  const storageKey=k=>STORE_OF[k]==='synchronization'?k:REC;")
s=s.replace("readStoreRec(STORE_OF[k], REC)","readStoreRec(STORE_OF[k], storageKey(k))")
sub("if (o.del) os.delete(REC); else os.put(encode(o.v), REC);", "if (o.del) os.delete(storageKey(k)); else os.put(encode(o.v), storageKey(k));")
sub('  const MIGRATIONS = {',"  const MIGRATIONS = {\n    8:function(db){if(!db.objectStoreNames.contains('synchronization'))db.createObjectStore('synchronization');if(!db.objectStoreNames.contains('syncEventRecords')){const os=db.createObjectStore('syncEventRecords',{keyPath:'id'});createIndex(os,'deviceId','deviceId');createIndex(os,'deviceSequence',['deviceId','seq'],{unique:true});}},")
sub('  async function commitAll(blobOps, collOps) {',"""  let commitObserver=null;
  async function commitAll(blobOps, collOps) {
    if(commitObserver){const extra=commitObserver(blobOps,collOps);if(extra){const key='roseachy_sync_state_v1',raw=JSON.stringify(extra.state);MEM[key]=raw;blobOps.set(key,{v:raw});if(extra.identity){const ik='roseachy_sync_identity_v1',iv=JSON.stringify(extra.identity);MEM[ik]=iv;blobOps.set(ik,{v:iv})}for(const[k,v]of extra.shadowOps||[]){if(v==null){delete MEM[k];blobOps.set(k,{del:true})}else{MEM[k]=v;blobOps.set(k,{v})}}if(extra.stockOverride){const sk='dsb_stock_v2';OBJECT_MEM[sk]=extra.stockOverride;delete MEM[sk];collOps.set(sk,{values:extra.stockOverride,changedIds:null});}if(extra.events.length){const ek='roseachy_sync_events_v1',values=[...(OBJECT_MEM[ek]||[]),...extra.events];OBJECT_MEM[ek]=values;delete MEM[ek];collOps.set(ek,{values,changedIds:new Set(extra.events.map(e=>e.id))});}}}
""")
sub('    KEYS: KEYS, STORE_OF:', '    setCommitObserver:fn=>{commitObserver=fn}, KEYS: KEYS, STORE_OF:')
sub("function uid(p){return p+Date.now()+Math.random().toString(36).slice(2,8)}", "function secureUuid(){if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const x=Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');return x.slice(0,8)+'-'+x.slice(8,12)+'-'+x.slice(12,16)+'-'+x.slice(16,20)+'-'+x.slice(20)}\nfunction uid(p){return p+'-'+secureUuid()}")
# Narrow bridge points keep the established accounting engine and UI intact.
sub('r.earnings=r.grossProfit+P.income;return r}', 'r.earnings=r.grossProfit+P.income;return !fields&&typeof SmartSync!=="undefined"?SmartSync.applyBalances(r):r}')
sub('function rebuildStockFromOpening(){auditMuted++;', 'function rebuildStockFromOpening(){const synced=SmartSync.rebuildStock();if(synced!==null)return synced;auditMuted++;')
sub("const ROSEACHY_NAV_OVERLAYS=['dupOverlay'", "const ROSEACHY_NAV_OVERLAYS=['syncOverlay','dupOverlay'")
sub("function switchDesk(d,nav=true){", "function switchDesk(d,nav=true){\n if(typeof SmartSync!=='undefined'&&d!==currentDesk)SmartSync.closeForDeskExit();")
sub("case'purchase_cash':if(t.paymentFunding", "case'market_advance':r.cashOut+=a;break;case'market_advance_return':r.cashIn+=a;break;case'purchase_cash':if(t.paymentFunding")
sub("fin$('finMore').classList.toggle('hidden',(finPage+1)*80>=x.length);}","fin$('finMore').classList.toggle('hidden',(finPage+1)*80>=x.length);SmartSync.renderLegacyFinancialHistory();}")
sub('const TYPES={',"const TYPES={market_advance:{label:'Market advance',cat:'internal'},market_advance_return:{label:'Market advance returned',cat:'internal'},")
sub("meta.vault=await finSeal(finKey,new TextEncoder().encode(JSON.stringify(finPrivate)));await finCommitMeta(meta,review)", "const previousVault=clone(meta.vault);meta.vault=await finSeal(finKey,new TextEncoder().encode(JSON.stringify(finPrivate)));await SmartSync.prepareFinancial(previousVault,meta.vault,finPrivate,finKey);await finCommitMeta(meta,review)")
sub('const result=fn();if(result&&typeof result.then', 'const result=fn();SmartSync.beforeBusiness(previous.tx,source);if(result&&typeof result.then')
sub('finally{inventoryBusy=false;inventoryMessage=null;', 'finally{inventoryBusy=false;SmartSync.endBusiness();inventoryMessage=null;')
sub('function backupObject(){return{', 'function backupObject(){return{smartSync:typeof SmartSync!=="undefined"?SmartSync.backup():null,')
sub("e.closest('#settingsDesk'))return;", "e.closest('#settingsDesk')||e.closest('#syncOverlay'))return;")
sub("validateInventoryBackup(d||{});if(!d", "if(typeof SmartSync!=='undefined')SmartSync.validateBackup(d?.smartSync);validateInventoryBackup(d||{});if(!d")
sub('function applyBackupData(d){validateInventoryBackup(d);', 'function applyBackupData(d){validateInventoryBackup(d);')
sub('updatePreImportButton();if(d.hold)storeSet(KEY.hold,JSON.stringify(d.hold))}', 'updatePreImportButton();if(d.hold)storeSet(KEY.hold,JSON.stringify(d.hold));SmartSync.restoreBackup(d.smartSync||null)}')
sub(" const rows=(actual,expected,label)=>", " if(data.smartSync&&!equalSmartBackup(SmartSync.backup(),data.smartSync))throw Error('Restored synchronization metadata differs from the backup');\n const rows=(actual,expected,label)=>")
sub('function backupCompareStored(data){', "function equalSmartBackup(a,b){const x=clone(a),y=clone(b);for(const v of [x?.state,y?.state])if(v){delete v.seq;delete v.peers;delete v.lastConfirmed;delete v.pending;delete v.recovery;delete v.recoveredDevice;delete v.originStartSeq;delete v.recoveryGaps;delete v.proposal;delete v.pendingImport;}return stableBackupText(x)===stableBackupText(y)}\nfunction backupCompareStored(data){")
sub("return out.filter(x=>x.ms>Date.parse(finPrivate.anchor.asOf)).sort", "return (typeof SmartSync!=='undefined'&&SmartSync.status().checkpointId?SmartSync.financialRows(out):out.filter(x=>x.ms>Date.parse(finPrivate.anchor.asOf))).sort")
sub('/* ---- Initialization ---- */','/* ---- Initialization ---- */',n=0) if False else None
engine=(r/'analysis/smart-sync.js').read_text().replace('/* SMART_SYNC_UI */',(r/'analysis/smart-sync-ui.js').read_text())
sub('async function init(){const t0=',engine+'\nasync function init(){const t0=')
sub("validateSystemIntegrity({repair:true});refreshTypeUI();ensureWeekDefaults();", "validateSystemIntegrity({repair:true});await SmartSync.start();refreshTypeUI();ensureWeekDefaults();")
sub("if(t.paymentFunding==='external')", "if(t.paymentFunding==='external')",n=0) if False else None
sub("(t.paymentFunding==='external'?'<div class=\"stamp\">External Payment Source", "(t.marketAdvanceId?'<div class=\"stamp\">Market advance · paid from purchasing funds</div>':t.paymentFunding==='external'?'<div class=\"stamp\">External Payment Source")
(r/'app/index.html').write_text(s)
pos=s.rfind('</body>');s=s[:pos]+'<script src="/js/android-sync-files.js"></script>'+s[pos:]
assert 'js/android-sync-files.js' in s
(r/'app/index.html').write_text(s)
sw=(r/'original/sw.js').read_text().replace('2.10.11-integrity-recovery','2.10.12-smart-sync').replace("  '/js/pwa.js',", "  '/js/pwa.js',\n  '/js/android-sync-files.js',")
(r/'app/sw.js').write_text(sw)
pwa=(r/'original/js/pwa.js').read_text().replace("if ('serviceWorker' in navigator &&", "if (!window.AndroidSyncFileBridge && !window.RoseachyPortablePreview && 'serviceWorker' in navigator &&")
(r/'app/js/pwa.js').write_text(pwa)
print('Built isolated schema-8 Smart Sync candidate.')
