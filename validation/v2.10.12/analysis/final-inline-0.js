
/* Roseachy storage layer — IndexedDB is authoritative and optimized for long-run use.
   Small state remains in compact key/value stores. Growing collections use record-level stores
   with indexes, so changing one product/day does not rewrite unrelated history. Legacy blob
   stores are preserved for safe migration/recovery but are no longer the daily write path. */
(function (global) {
  'use strict';
  const DB_NAME = 'roseachy_pwa_db';
  const DB_VERSION = 8;
  const REC = 'data';
  const LEGACY_IDB = 'daily_sales_balance_db_v1';

  const STORE_OF = {
    'roseachy_sync_shadow:dsb_stock_v2':'synchronization','roseachy_sync_shadow:dsb_saved_v2':'synchronization','roseachy_sync_shadow:dsb_draft_v2':'synchronization','roseachy_sync_shadow:roseachy_market_v1':'synchronization','roseachy_sync_shadow:dsb_notes_v1':'synchronization','roseachy_sync_shadow:dsb_stock_trash_v2':'synchronization','roseachy_sync_shadow:dsb_tx_trash_v2':'synchronization','roseachy_sync_shadow:roseachy_inventory_audit_v1':'synchronization','roseachy_sync_shadow:roseachy_appearance_v1':'synchronization','roseachy_sync_shadow:roseachy_finance_vault_v1':'synchronization','roseachy_sync_shadow:roseachy_finance_review_v1':'synchronization',roseachy_sync_pending_file_v1:'synchronization',roseachy_sync_session_v1:'synchronization',roseachy_sync_checkpoint_v1:'synchronization',roseachy_sync_state_v1:'synchronization',roseachy_sync_identity_v1:'synchronization',roseachy_sync_events_v1:'synchronization',
    roseachy_inventory_audit_v1: 'metadata',
    dsb_stock_v2: 'stock', dsb_saved_v2: 'savedDays', dsb_draft_v2: 'draft', dsb_hold_v1: 'heldPurchase',
    dsb_notes_v1: 'notes', dsb_stock_trash_v2: 'stockTrash', dsb_tx_trash_v2: 'transactionTrash', dsb_preimport_v1: 'recovery',
    roseachy_market_v1: 'market', roseachy_appearance_v1: 'settings',
    roseachy_finance_vault_v1: 'financeVault', roseachy_finance_review_v1: 'financeReview', roseachy_ui_v1: 'interfaceState', roseachy_working_forms_v1: 'workingForms'
  };
  const KEYS = Object.keys(STORE_OF);
  const storageKey=k=>STORE_OF[k]==='synchronization'?k:REC;
  const OLD_NAMES = ['dsb_stock', 'dsb_saved', 'dsb_stock_trash', 'dsb_tx_trash', 'dsb_draft'];
  const COLLECTIONS = {
    roseachy_sync_events_v1:{store:'syncEventRecords',kind:'syncEvent'},
    roseachy_inventory_audit_v1: { store: 'inventoryAuditRecords', kind: 'audit' },
    dsb_stock_v2: { store: 'stockRecords', kind: 'stock' },
    dsb_saved_v2: { store: 'savedDayRecords', kind: 'saved' },
    dsb_stock_trash_v2: { store: 'stockTrashRecords', kind: 'stockTrash' },
    dsb_tx_trash_v2: { store: 'txTrashRecords', kind: 'txTrash' }
  };
  const COLLECTION_KEYS = Object.keys(COLLECTIONS);

  const MEM = Object.create(null);           // string API compatibility for small state
  const OBJECT_MEM = Object.create(null);    // parsed collection arrays
  const PERSISTED = Object.create(null);     // key -> Map(id -> compact fingerprint)
  let dbp = null, mode = 'indexeddb', loaded = false;
  let pending = new Map(), collectionPending = new Map(), scheduled = false;
  let writeChain = Promise.resolve(), retryTimer = null, consecutiveWriteFailures = 0;
  let errorHandler = null, lastError = null, migrationInfo = { status: 'unknown' };
  const tabId = Math.random().toString(36).slice(2);
  const REVISION_KEY = 'roseachy_data_revision';
  const DB_PRESENT_KEY = 'roseachy_idb_authoritative_v1';
  let dataRevision = null, stale = false;
  function revisionOf(v) { const n = Number(v && typeof v === 'object' ? v.value : v); return Number.isSafeInteger(n) && n >= 0 ? n : 0; }
  function staleError() { const e = new Error('Records changed in another window. Reload before editing.'); e.name = 'StaleWindowError'; return e; }
  function markStale() {
    if (stale) return;
    stale = true; clearTimeout(retryTimer); lastError = staleError();
    global.dispatchEvent(new CustomEvent('roseachy:external-change', { detail: { blocked: true } }));
  }
  let atomicPhase=false, batchDepth=0;
  function assertCurrent() { if (stale) throw staleError(); if(atomicPhase&&batchDepth!==1) throw new Error('An inventory save is in progress. Please wait.'); }
  function announceWrite() { if (bc) try { bc.postMessage({ from: tabId, t: 'wrote', revision: dataRevision }); } catch (e) {} }
  async function checkRevision() {
    const actual = mode === 'localstorage' ? revisionOf(localStorage.getItem(REVISION_KEY)) : revisionOf(await readStoreRec('metadata', 'dataRevision'));
    if (dataRevision !== null && actual !== dataRevision) markStale();
  }
  let bc = null; try { bc = new BroadcastChannel('roseachy-data'); } catch (e) {}

  function createIndex(os, name, path, opts) { if (!os.indexNames.contains(name)) os.createIndex(name, path, opts || {}); }
  const MIGRATIONS = {
    8:function(db){if(!db.objectStoreNames.contains('synchronization'))db.createObjectStore('synchronization');if(!db.objectStoreNames.contains('syncEventRecords')){const os=db.createObjectStore('syncEventRecords',{keyPath:'id'});createIndex(os,'deviceId','deviceId');createIndex(os,'deviceSequence',['deviceId','seq'],{unique:true});}},
    1: function (db) { ['stock','savedDays','draft','heldPurchase','notes','stockTrash','transactionTrash','recovery','settings','metadata'].forEach(function (s) { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s); }); },
    2: function (db) { if (!db.objectStoreNames.contains('market')) db.createObjectStore('market'); },
    3: function (db) {
      if (!db.objectStoreNames.contains('stockRecords')) {
        const os = db.createObjectStore('stockRecords', { keyPath: 'id' });
        createIndex(os,'nameKey','nameKey'); createIndex(os,'division','division'); createIndex(os,'expiryDate','expiryDate'); createIndex(os,'skuRef','skuRef');
      }
      if (!db.objectStoreNames.contains('savedDayRecords')) {
        const os = db.createObjectStore('savedDayRecords', { keyPath: 'id' });
        createIndex(os,'date','date'); createIndex(os,'businessKey','businessKey'); createIndex(os,'archived','archived'); createIndex(os,'savedAt','savedAt'); createIndex(os,'dateBusiness',['date','businessKey']);
      }
      if (!db.objectStoreNames.contains('stockTrashRecords')) db.createObjectStore('stockTrashRecords', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('txTrashRecords')) {
        const os = db.createObjectStore('txTrashRecords', { keyPath: 'id' });
        createIndex(os,'ts','ts'); createIndex(os,'productId','productId'); createIndex(os,'type','type');
      }
    },
    4: function (db) {
      if (!db.objectStoreNames.contains('transactionRecords')) {
        const os = db.createObjectStore('transactionRecords', { keyPath: 'id' });
        createIndex(os,'dayId','dayId'); createIndex(os,'date','date'); createIndex(os,'ts','ts'); createIndex(os,'productId','productId');
        createIndex(os,'division','division'); createIndex(os,'type','type'); createIndex(os,'partyKey','partyKey'); createIndex(os,'paymentType','paymentType');
        createIndex(os,'posType','posType'); createIndex(os,'expiryDate','expiryDate'); createIndex(os,'originalSaleId','originalSaleId'); createIndex(os,'archived','archived');
      }
    },
    6: function(db) { if (!db.objectStoreNames.contains('inventoryAuditRecords')) { const os=db.createObjectStore('inventoryAuditRecords',{keyPath:'id'}); createIndex(os,'productId','productId'); createIndex(os,'timestamp','timestamp'); createIndex(os,'sequence','sequence'); } },
    7: function(db) { for (const store of ['interfaceState','workingForms']) if (!db.objectStoreNames.contains(store)) db.createObjectStore(store); },
    5: function(db) { for (const store of ['financeVault','financeReview']) if (!db.objectStoreNames.contains(store)) db.createObjectStore(store); }
  };

  function encode(v) { try { return JSON.parse(v); } catch (e) { return { __raw: String(v) }; } }
  function decode(rec) { if (rec === undefined || rec === null) return null; if (rec && typeof rec === 'object' && rec.__raw !== undefined && Object.keys(rec).length === 1) return rec.__raw; return JSON.stringify(rec); }
  function canon(s) { try { return JSON.stringify(JSON.parse(s)); } catch (e) { return String(s); } }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function businessKey(v) { return String(v || '').trim().toLowerCase(); }
  function idOf(v, i, prefix) { return v && v.id != null ? String(v.id) : prefix + ':' + i; }
  function stockRecord(v) {
    const x = Object.assign({}, v);
    x.id = String(x.id); x.nameKey = String(x.name || '').trim().toLowerCase(); x.skuRef = String(x.sku || x.reference || x.ref || '').trim().toLowerCase();
    x.division = x.division || null; x.expiryDate = x.expiryDate || null; return x;
  }
  function savedRecord(v) { const x = Object.assign({}, v); x.id = String(x.id); x.businessKey = businessKey(x.business); x.archived = !!x.archived; return x; }
  function txRecord(t, day) {
    const x = Object.assign({}, t); x.id = String(x.id); x.dayId = String(day.id); x.date = day.date || ''; x.archived = !!day.archived;
    x.partyKey = String(x.party || x.person || '').trim().toLowerCase(); x.paymentType = x.paymentType || x.payment || x.type || '';
    x.posType = String(x.type || '').indexOf('pos_') === 0 ? x.type : (x.posType || ''); x.expiryDate = x.batchExpiry || x.expiryDate || null; x.originalSaleId = x.originalSaleId || null; return x;
  }
  function fingerprint(v) {
    // Stable enough for write elision; JSON property order is stable for Roseachy's own records.
    try { return JSON.stringify(v); } catch (e) { return String(v && v.id || ''); }
  }

  function openDb() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve, reject) {
      if (!global.indexedDB) return reject(new Error('IndexedDB not available'));
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (ev) {
        const db = req.result;
        for (let v = (ev.oldVersion || 0) + 1; v <= DB_VERSION; v++) if (MIGRATIONS[v]) MIGRATIONS[v](db, req.transaction);
      };
      req.onsuccess = function () {
        const db = req.result;
        db.onversionchange = function () { db.close(); dbp = null; };
        db.onclose = function () { dbp = null; };
        resolve(db);
      };
      req.onerror = function () { dbp = null; reject(req.error || new Error('IndexedDB open failed')); };
      req.onblocked = function () {};
    });
    return dbp;
  }
  function txDone(t) { return new Promise(function (res, rej) { t.oncomplete = res; t.onabort = function () { rej(t.error || new Error('Transaction aborted')); }; t.onerror = function () { rej(t.error || new Error('Transaction error')); }; }); }
  function newTx(db, stores, mode2) { try { return db.transaction(stores, mode2, { durability: 'strict' }); } catch (e) { return db.transaction(stores, mode2); } }
  function reqP(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  async function readStoreRec(store, key) { const db = await openDb(), t = db.transaction(store, 'readonly'); return reqP(t.objectStore(store).get(key)); }
  async function writeStoreRec(store, key, value) { const db = await openDb(), t = newTx(db, store, 'readwrite'); t.objectStore(store).put(value, key); await txDone(t); }
  async function getAll(store) { const db = await openDb(), t = db.transaction(store, 'readonly'); return reqP(t.objectStore(store).getAll()); }
  async function getAllKeys(store) { const db = await openDb(), t = db.transaction(store, 'readonly'); return reqP(t.objectStore(store).getAllKeys()); }

  function normalizeCollectionForStore(key, values) {
    if (key === 'dsb_stock_v2') return arr(values).map(stockRecord);
    if (key === 'dsb_saved_v2') return arr(values).map(savedRecord);
    return arr(values).map(function (v, i) { const x = Object.assign({}, v); x.id = idOf(x, i, key); return x; });
  }
  function collectionFingerprintMap(key, values) { const m = new Map(); normalizeCollectionForStore(key, values).forEach(function (v) { m.set(String(v.id), fingerprint(v)); }); return m; }

  async function replaceCollectionStore(key, values) {
    const cfg = COLLECTIONS[key], db = await openDb();
    const stores = key === 'dsb_saved_v2' ? [cfg.store, 'transactionRecords'] : [cfg.store];
    const t = newTx(db, stores, 'readwrite'), os = t.objectStore(cfg.store); os.clear();
    if (key === 'dsb_saved_v2') t.objectStore('transactionRecords').clear();
    const normalized = normalizeCollectionForStore(key, values);
    normalized.forEach(function (v) {
      os.put(v);
      if (key === 'dsb_saved_v2') arr(v.tx).forEach(function (txv) { if (txv && txv.id != null) t.objectStore('transactionRecords').put(txRecord(txv, v)); });
    });
    await txDone(t); PERSISTED[key] = collectionFingerprintMap(key, normalized); OBJECT_MEM[key] = normalized; return normalized;
  }

  async function migrateCollectionsIfNeeded(cur) {
    const marker = await readStoreRec('metadata', 'recordCollectionsV1');
    if (marker && marker.schema >= 1) return marker;
    for (const key of COLLECTION_KEYS) {
      let values = [];
      const existing = await getAll(COLLECTIONS[key].store);
      if (existing.length) values = existing;
      else {
        let raw = cur[key];
        if (raw == null) { try { raw = localStorage.getItem(key); } catch (e) {} }
        if (raw != null) { try { values = JSON.parse(raw); } catch (e) { values = []; } }
      }
      await replaceCollectionStore(key, values);
    }
    const info = { schema: 1, completedAt: new Date().toISOString(), dbVersion: DB_VERSION };
    await writeStoreRec('metadata', 'recordCollectionsV1', info); return info;
  }

  async function loadCollections() {
    for (const key of COLLECTION_KEYS) {
      const values = await getAll(COLLECTIONS[key].store);
      if(key==='roseachy_inventory_audit_v1')values.forEach(freezeAudit);
      OBJECT_MEM[key] = values;
      PERSISTED[key] = collectionFingerprintMap(key, values);
      delete MEM[key]; // stringify only on explicit compatibility request
    }
  }

  function normalizeOneForStore(key, v, i) {
    if (key === 'dsb_stock_v2') return stockRecord(v);
    if (key === 'dsb_saved_v2') return savedRecord(v);
    const x = Object.assign({}, v); x.id = idOf(x, i || 0, key); return x;
  }
  function computeCollectionDelta(key, values, changedIds) {
    const source = arr(values), prior = PERSISTED[key] || new Map(), puts = [], deletes = [];
    if (changedIds && changedIds.size) {
      changedIds.forEach(function (id) {
        id = String(id); const i = source.findIndex(function (v) { return v && String(v.id) === id; });
        if (i < 0) deletes.push(id); else puts.push(normalizeOneForStore(key, source[i], i));
      });
      return { normalized: source, puts: puts, deletes: deletes, partial: true };
    }
    const normalized = normalizeCollectionForStore(key, source), byId = new Map(normalized.map(function (v) { return [String(v.id), v]; }));
    byId.forEach(function (v, id) { const fp = fingerprint(v); if (prior.get(id) !== fp) puts.push(v); });
    prior.forEach(function (_, id) { if (!byId.has(id)) deletes.push(id); });
    return { normalized: normalized, puts: puts, deletes: deletes, partial: false };
  }

  let commitObserver=null;
  async function commitAll(blobOps, collOps) {
    if(commitObserver){const extra=commitObserver(blobOps,collOps);if(extra){const key='roseachy_sync_state_v1',raw=JSON.stringify(extra.state);MEM[key]=raw;blobOps.set(key,{v:raw});if(extra.identity){const ik='roseachy_sync_identity_v1',iv=JSON.stringify(extra.identity);MEM[ik]=iv;blobOps.set(ik,{v:iv})}for(const[k,v]of extra.shadowOps||[]){if(v==null){delete MEM[k];blobOps.set(k,{del:true})}else{MEM[k]=v;blobOps.set(k,{v})}}if(extra.stockOverride){const sk='dsb_stock_v2';OBJECT_MEM[sk]=extra.stockOverride;delete MEM[sk];collOps.set(sk,{values:extra.stockOverride,changedIds:null});}if(extra.events.length){const ek='roseachy_sync_events_v1',values=[...(OBJECT_MEM[ek]||[]),...extra.events];OBJECT_MEM[ek]=values;delete MEM[ek];collOps.set(ek,{values,changedIds:new Set(extra.events.map(e=>e.id))});}}}

    if ((!blobOps || !blobOps.size) && (!collOps || !collOps.size)) return;
    if(stale)throw staleError();
    if (mode === 'localstorage') {
      const commit = function () {
        if(stale)throw staleError();
        const recoveryJournal=localStorage.getItem('roseachy_inventory_undo_journal');if(recoveryJournal){const j=JSON.parse(recoveryJournal);for(const[k,v]of j.before){if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}localStorage.setItem(REVISION_KEY,String(j.revision));localStorage.removeItem('roseachy_inventory_undo_journal');}
        const actual = revisionOf(localStorage.getItem(REVISION_KEY));
        if (dataRevision !== null && actual !== dataRevision) { markStale(); throw staleError(); }
        const writes=new Map();if(blobOps)blobOps.forEach((o,k)=>writes.set(k,o.del?null:o.v));if(collOps)collOps.forEach((o,k)=>writes.set(k,JSON.stringify(o.values)));
        const journal={revision:actual,before:[...writes.keys()].map(k=>[k,localStorage.getItem(k)])};
        localStorage.setItem('roseachy_inventory_undo_journal',JSON.stringify(journal));
        try{for(const[k,v]of writes){if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}localStorage.setItem(REVISION_KEY,String(actual+1));localStorage.removeItem('roseachy_inventory_undo_journal');dataRevision=actual+1;announceWrite();}
        catch(e){try{for(const[k,v]of journal.before){if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}localStorage.setItem(REVISION_KEY,String(actual));localStorage.removeItem('roseachy_inventory_undo_journal');}catch(x){}throw e;}
      };
      if (global.navigator && navigator.locks && navigator.locks.request) await navigator.locks.request('roseachy-data-write', commit);
      else commit();
      return;
    }
    let attempt = 0;
    for (;;) {
      try {
        if(stale)throw staleError();
        const db = await openDb(), stores = new Set(['metadata']);
        if (blobOps) blobOps.forEach(function (_, k) { if (STORE_OF[k]) stores.add(STORE_OF[k]); });
        if (collOps) collOps.forEach(function (_, k) { stores.add(COLLECTIONS[k].store); if (k === 'dsb_saved_v2') stores.add('transactionRecords'); });
        const t = newTx(db, Array.from(stores), 'readwrite'), done = txDone(t), results = [];
        let conflict = null, nextRevision = null, writeError = null;
        const check = t.objectStore('metadata').get('dataRevision');
        check.onsuccess = function () {
          const actual = revisionOf(check.result);
          if (stale || (dataRevision !== null && actual !== dataRevision)) {
            conflict = staleError(); markStale(); t.abort(); return;
          }
          try {
            nextRevision = actual + 1;
            t.objectStore('metadata').put({ value: nextRevision }, 'dataRevision');
        if (blobOps) blobOps.forEach(function (o, k) { const os = t.objectStore(STORE_OF[k]); if (o.del) os.delete(storageKey(k)); else os.put(encode(o.v), storageKey(k)); });
        if (collOps) collOps.forEach(function (o, k) {
          const d = computeCollectionDelta(k, o.values, o.changedIds), os = t.objectStore(COLLECTIONS[k].store);
          d.puts.forEach(function (v) {
            os.put(v);
            if (k === 'dsb_saved_v2') {
              const txos = t.objectStore('transactionRecords'), idx = txos.index('dayId'), range = IDBKeyRange.only(String(v.id));
              const cr = idx.openKeyCursor(range);
              cr.onsuccess = function () { const c = cr.result; if (c) { txos.delete(c.primaryKey); c.continue(); } else arr(v.tx).forEach(function (txv) { if (txv && txv.id != null) txos.put(txRecord(txv, v)); }); };
            }
          });
          d.deletes.forEach(function (id) {
            os.delete(id);
            if (k === 'dsb_saved_v2') {
              const txos = t.objectStore('transactionRecords'), idx = txos.index('dayId'), range = IDBKeyRange.only(String(id));
              idx.openKeyCursor(range).onsuccess = function (e) { const c = e.target.result; if (c) { txos.delete(c.primaryKey); c.continue(); } };
            }
          });
          results.push([k, d]);
        });

          } catch (e) { writeError = e; try { t.abort(); } catch (x) {} }
        };
        try { await done; } catch (e) { throw conflict || writeError || e; }
        dataRevision = nextRevision;
        results.forEach(function (pair) {
          const k = pair[0], d = pair[1];
          if (d.partial) {
            const pm = PERSISTED[k] || new Map(); d.puts.forEach(function (v) { pm.set(String(v.id), fingerprint(v)); }); d.deletes.forEach(function (id) { pm.delete(String(id)); }); PERSISTED[k] = pm;
          } else PERSISTED[k] = collectionFingerprintMap(k, d.normalized);
          // A newer queued write may already have replaced the synchronous working copy.
          if (OBJECT_MEM[k] === collOps.get(k).values) { OBJECT_MEM[k] = d.normalized; delete MEM[k]; }
        });
        consecutiveWriteFailures = 0; announceWrite(); return;
      } catch (e) {
        if (e && e.name === 'StaleWindowError') throw e;
        dbp = null; if (++attempt >= 2) throw e;
      }
    }
  }

  function flushPending() {
    scheduled = false;
    if (!pending.size && !collectionPending.size) return writeChain;
    const ops = pending; pending = new Map(); const cops = collectionPending; collectionPending = new Map();
    writeChain = writeChain.then(function () { return commitAll(ops, cops); }).then(function () { lastError = null; }, function (err) {
      lastError = err;
      ops.forEach(function (o, k) { if (!pending.has(k)) pending.set(k, o); });
      cops.forEach(function (o, k) { if (!collectionPending.has(k)) collectionPending.set(k, o); });
      if (errorHandler) try { errorHandler(err); } catch (e) {}
      consecutiveWriteFailures++;
      clearTimeout(retryTimer);
      /* Avoid a runaway 4-second retry loop when Android storage is temporarily unavailable or quota-limited. Retry a few times with backoff; any later user change/explicit save will naturally retry again. */
      const retryDelays=[4000,15000,60000];
      if(!stale && consecutiveWriteFailures<=retryDelays.length){const delay=retryDelays[consecutiveWriteFailures-1];retryTimer=setTimeout(function(){if(pending.size||collectionPending.size)flushPending()},delay)}
    });
    return writeChain;
  }
  function schedule() { if(batchDepth)return; if (!scheduled) { scheduled = true; Promise.resolve().then(flushPending); } }

  function stableText(v){if(Array.isArray(v))return '['+v.map(stableText).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stableText(v[k])).join(',')+'}';return JSON.stringify(v);}
  function freezeAudit(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freezeAudit);Object.freeze(v);}return v;}
  async function atomic(fn){
    if(atomicPhase)throw new Error('An inventory save is already in progress.');
    await whenSaved();
    if(atomicPhase)throw new Error("A business save is already in progress. Please retry.");
    const savedMem=Object.assign({},MEM),savedObjects={};for(const k of Object.keys(OBJECT_MEM))savedObjects[k]=k==='roseachy_inventory_audit_v1'?OBJECT_MEM[k]:JSON.parse(JSON.stringify(OBJECT_MEM[k]));
    atomicPhase=true;batchDepth=1;
    try{
      const result=fn();
      if(result&&typeof result.then==='function')throw new Error('Inventory preparation must be synchronous.');
      const ops=pending,cops=collectionPending;pending=new Map();collectionPending=new Map();scheduled=false;
      // Keep preparation permission inside commitAll, while ordinary UI writes are blocked.
      batchDepth=2;const completion=commitAll(ops,cops);writeChain=completion.catch(function(){});await completion;
      lastError=null;return result;
    }catch(e){
      pending=new Map();collectionPending=new Map();scheduled=false;
      for(const k of Object.keys(MEM))delete MEM[k];Object.assign(MEM,savedMem);
      for(const k of Object.keys(OBJECT_MEM))delete OBJECT_MEM[k];Object.assign(OBJECT_MEM,savedObjects);
      (OBJECT_MEM.roseachy_inventory_audit_v1||[]).forEach(freezeAudit);
      lastError=e;throw e;
    }finally{batchDepth=0;atomicPhase=false;}
  }
  function get(k) {
    if (COLLECTIONS[k] && OBJECT_MEM[k]) {
      if (!Object.prototype.hasOwnProperty.call(MEM, k)) MEM[k] = JSON.stringify(OBJECT_MEM[k]);
      return MEM[k];
    }
    return Object.prototype.hasOwnProperty.call(MEM, k) ? MEM[k] : null;
  }
  function getObject(k) { if (COLLECTIONS[k]) return OBJECT_MEM[k] || []; const raw = get(k); try { return raw == null ? null : JSON.parse(raw); } catch (e) { return null; } }
  function set(k, v) {
    assertCurrent();
    if (COLLECTIONS[k]) { let a; try { a = JSON.parse(String(v)); } catch (e) { a = []; } return setCollection(k, a); }
    v = String(v); MEM[k] = v; if (STORE_OF[k]) { pending.set(k, { v: v }); schedule(); }
  }
  function setCollection(k, values, changedIds) {
    assertCurrent();
    if (!COLLECTIONS[k]) return set(k, JSON.stringify(values));
    const a = arr(values);
    if(k==='roseachy_inventory_audit_v1') {
      const next=new Map(a.map(v=>[String(v.id),v]));
      if(next.size!==a.length)throw new Error('Duplicate inventory audit IDs');
      for(const row of OBJECT_MEM[k]||[]){if(!next.has(String(row.id))){if(!auditInWindow(row))continue;throw new Error('Recent adjustment history cannot be removed.');}if(next.get(String(row.id))!==row&&stableText(next.get(String(row.id)))!==stableText(row))throw new Error('Committed adjustment history cannot be edited.');}
      a.forEach(freezeAudit);
    }
    OBJECT_MEM[k] = a; delete MEM[k];
    const prior = collectionPending.get(k), ids = changedIds ? new Set(Array.from(changedIds, String)) : null;
    if (prior) {
      prior.values = a;
      if (prior.changedIds === null) { /* an earlier full sync already covers this tick */ }
      else if (ids === null) prior.changedIds = null;
      else ids.forEach(function (id) { prior.changedIds.add(id); });
    } else collectionPending.set(k, { values: a, changedIds: ids });
    schedule(); return a;
  }
  function remove(k) {
    assertCurrent();
    if(k==='roseachy_inventory_audit_v1')throw new Error('Inventory history cannot be cleared.');
    delete MEM[k];
    if (COLLECTIONS[k]) { OBJECT_MEM[k] = []; collectionPending.set(k, { values: [], changedIds: null }); schedule(); return; }
    if (STORE_OF[k]) { pending.set(k, { del: true }); schedule(); }
  }
  function whenSaved() { return new Promise(function (r) { setTimeout(r, 0); }).then(function () { flushPending(); return writeChain; }).then(function () { if (stale) throw staleError(); if (pending.size || collectionPending.size) throw lastError || new Error('Some changes are not saved yet'); }); }

  async function readLegacyLocalStorage() {
    const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && (STORE_OF[k] || OLD_NAMES.indexOf(k) >= 0)) o[k] = localStorage.getItem(k); } } catch (e) {} return o;
  }
  function readLegacyIdb() {
    return new Promise(function (resolve) {
      let done = false, created = false; const finish = function (v) { if (!done) { done = true; resolve(v); } };
      try {
        const req = indexedDB.open(LEGACY_IDB);
        req.onupgradeneeded = function () { created = true; try { req.transaction.abort(); } catch (e) {} };
        req.onerror = function () { finish({}); };
        req.onsuccess = function () {
          const db = req.result; try {
            if (created || !db.objectStoreNames.contains('kv')) { db.close(); return finish({}); }
            const out = {}, c = db.transaction('kv', 'readonly').objectStore('kv').openCursor();
            c.onsuccess = function () { const cur = c.result; if (cur) { out[String(cur.key)] = cur.value; cur.continue(); } else { db.close(); finish(out); } };
            c.onerror = function () { db.close(); finish(out); };
          } catch (e) { try { db.close(); } catch (x) {} finish({}); }
        };
      } catch (e) { finish({}); }
    });
  }

  async function load() {
    let db = null; try { db = await openDb(); } catch (e) {
      // Once an IndexedDB installation is known, a temporary IDB failure must NEVER
      // cause a blank localStorage fallback to masquerade as the existing business.
      try { if (localStorage.getItem(DB_PRESENT_KEY)) throw new Error('Your existing Roseachy database is temporarily inaccessible. No data was reset. Free up phone storage or restart Chrome, then tap Retry. Keep your external backups.'); }
      catch (markerError) { if (markerError.message && markerError.message.includes('existing Roseachy database')) throw markerError; }
      mode = 'localstorage'; lastError = e;
    }
    if (mode === 'localstorage') {
      const rawJournal=localStorage.getItem('roseachy_inventory_undo_journal');
      if(rawJournal){const j=JSON.parse(rawJournal);for(const[k,v]of j.before){if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}localStorage.setItem(REVISION_KEY,String(j.revision));localStorage.removeItem('roseachy_inventory_undo_journal');}
      dataRevision = revisionOf(localStorage.getItem(REVISION_KEY));
      KEYS.concat(OLD_NAMES).forEach(function (k) { try { const v = localStorage.getItem(k); if (v != null) { MEM[k] = v; if (COLLECTIONS[k]) { try { OBJECT_MEM[k] = JSON.parse(v); } catch (e) { OBJECT_MEM[k] = []; } } } } catch (x) {} });
      migrationInfo = { status: 'fallback' }; loaded = true; await checkRevision(); return status();
    }
    dataRevision = revisionOf(await readStoreRec('metadata', 'dataRevision'));
    const cur = {};
    for (const k of KEYS) { const v = decode(await readStoreRec(STORE_OF[k], storageKey(k))); if (v != null) cur[k] = v; }
    const meta = await readStoreRec('metadata', 'migration');
    if (meta && meta.status === 'complete') {
      KEYS.forEach(function (k) { if (!COLLECTIONS[k] && cur[k] != null) MEM[k] = cur[k]; });
      for (const k of KEYS) {
        if (COLLECTIONS[k] || cur[k] != null || MEM[k] != null) continue;
        try { const legacy = localStorage.getItem(k); if (legacy != null) { MEM[k] = legacy; pending.set(k, { v: legacy }); } } catch (e) {}
      }
      await migrateCollectionsIfNeeded(cur); await loadCollections(); if (pending.size) await flushPending();
      migrationInfo = Object.assign({}, meta, { schema: DB_VERSION, recordCollections: true }); loaded = true; await checkRevision();
      try { localStorage.setItem(DB_PRESENT_KEY, '1'); } catch (e) {}
      return status();
    }
    const ls = await readLegacyLocalStorage(), li = await readLegacyIdb();
    const migrated = [], srcs = new Set(); let source = 'none';
    KEYS.forEach(function (k) {
      if (cur[k] != null) { MEM[k] = cur[k]; return; }
      const lsFail = !!li['__lsfail:' + k], a = ls[k], b = (typeof li[k] === 'string') ? li[k] : null, v = lsFail ? (b != null ? b : a) : (a != null ? a : b);
      if (typeof v === 'string') { MEM[k] = v; migrated.push(k); srcs.add(v === a ? 'localStorage' : 'legacy-indexeddb'); }
    });
    OLD_NAMES.forEach(function (k) { if (ls[k] != null && MEM[k] == null) { MEM[k] = ls[k]; srcs.add('localStorage(old-keys)'); } });
    if (srcs.size) source = Array.from(srcs).join('+');
    migrated.forEach(function (k) { if (!COLLECTIONS[k]) pending.set(k, { v: MEM[k] }); });
    if (pending.size) await flushPending();
    await migrateCollectionsIfNeeded(Object.assign({}, cur, MEM)); await loadCollections();
    migrationInfo = { status: 'pending', source: source, keys: migrated }; loaded = true; await checkRevision();
    try { localStorage.setItem(DB_PRESENT_KEY, '1'); } catch (e) {}
    return status();
  }

  async function verifyCollection(key) {
    let got;
    if (mode === 'localstorage') {
      try { const raw = localStorage.getItem(key); got = raw == null ? [] : JSON.parse(raw); } catch (e) { return false; }
      if (!Array.isArray(got)) return false;
      got = normalizeCollectionForStore(key, got);
    } else got = await getAll(COLLECTIONS[key].store);
    const want = normalizeCollectionForStore(key, OBJECT_MEM[key] || []);
    if (got.length !== want.length) return false;
    const stable = function (value) {
      if (Array.isArray(value)) return value.map(stable);
      if (value && typeof value === 'object') { const out = {}; Object.keys(value).sort().forEach(function (k) { out[k] = stable(value[k]); }); return out; }
      return value;
    };
    const records = new Map(), wantedIds = new Set();
    for (const row of got) {
      if (!row || row.id == null || records.has(String(row.id))) return false;
      records.set(String(row.id), JSON.stringify(stable(row)));
    }
    for (const row of want) {
      if (!row || row.id == null || wantedIds.has(String(row.id))) return false;
      wantedIds.add(String(row.id));
      if (records.get(String(row.id)) !== JSON.stringify(stable(row))) return false;
    }
    return true;
  }
  async function finalizeMigration() {
    if (mode === 'localstorage' || migrationInfo.status === 'complete') return { ok: true, info: migrationInfo };
    await whenSaved(); const bad = [];
    for (const k of KEYS) {
      if (COLLECTIONS[k]) { if (!(await verifyCollection(k))) bad.push(k); continue; }
      const want = MEM[k] == null ? null : canon(MEM[k]), got = decode(await readStoreRec(STORE_OF[k], storageKey(k))); if ((got == null ? null : canon(got)) !== want) bad.push(k);
    }
    if (bad.length) { migrationInfo = Object.assign({}, migrationInfo, { status: 'failed', bad: bad }); return { ok: false, bad: bad }; }
    const info = { status: 'complete', completedAt: new Date().toISOString(), source: migrationInfo.source || 'none', keys: migrationInfo.keys || [], schema: DB_VERSION, recordCollections: true };
    await writeStoreRec('metadata', 'migration', info); migrationInfo = info; return { ok: true, info: info };
  }
  async function verify() {
    await whenSaved(); const bad = [];
    for (const k of KEYS) {
      if (COLLECTIONS[k]) { if (!(await verifyCollection(k))) bad.push(k); continue; }
      const want = MEM[k] == null ? null : canon(MEM[k]);
      const got = mode === 'localstorage' ? localStorage.getItem(k) : decode(await readStoreRec(STORE_OF[k], storageKey(k)));
      if ((got == null ? null : canon(got)) !== want) bad.push(k);
    }
    return { ok: !bad.length, bad: bad };
  }

  function area(store) {
    return {
      get: async function (k) { if (mode === 'localstorage') { try { return JSON.parse(localStorage.getItem('roseachy_' + store + '_' + k)); } catch (e) { return null; } } const v = await readStoreRec(store, k); return v === undefined ? null : v; },
      set: async function (k, v) { if (mode === 'localstorage') { try { localStorage.setItem('roseachy_' + store + '_' + k, JSON.stringify(v)); } catch (e) {} return; } await writeStoreRec(store, k, v); }
    };
  }
  async function persistence(request = false) {
    const r = { supported: !!(global.navigator && navigator.storage), persistSupported: false, persisted: false, usage: null, quota: null };
    if (!r.supported) return r;
    r.persistSupported = typeof navigator.storage.persist === 'function';
    try { if (navigator.storage.persisted) r.persisted = await navigator.storage.persisted(); } catch (e) {}
    if (request && !r.persisted && r.persistSupported) { try { r.persisted = !!(await navigator.storage.persist()); } catch (e) {} }
    try { if (navigator.storage.estimate) { const e = await navigator.storage.estimate(); r.usage = e.usage; r.quota = e.quota; } } catch (e) {}
    return r;
  }
  function status() { return { mode: mode, loaded: loaded, migration: migrationInfo, dbName: DB_NAME, dbVersion: DB_VERSION, recordCollections: true, revision: dataRevision, stale: stale, pending: pending.size + collectionPending.size, lastError: lastError ? String(lastError.message || lastError) : null }; }

  async function queryTransactions(indexName, value, limit) {
    if (mode !== 'indexeddb') return [];
    const db = await openDb(), t = db.transaction('transactionRecords','readonly'), os=t.objectStore('transactionRecords');
    if (!os.indexNames.contains(indexName)) return [];
    const ix=os.index(indexName), out=[]; return new Promise(function(resolve,reject){
      const r=ix.openCursor(IDBKeyRange.only(value),'prev'); r.onsuccess=function(){const c=r.result;if(c&&(!limit||out.length<limit)){out.push(c.value);c.continue()}else resolve(out)};r.onerror=function(){reject(r.error)};
    });
  }

  if (bc) bc.onmessage = function (ev) {
    if (ev.data && ev.data.from !== tabId && loaded && (ev.data.revision == null || revisionOf(ev.data.revision) > dataRevision)) markStale();
  };
  global.addEventListener('storage', function (ev) { if (mode === 'localstorage' && loaded && ev.key === REVISION_KEY && revisionOf(ev.newValue) !== dataRevision) markStale(); });
  document.addEventListener('visibilitychange', function () { if (loaded && document.visibilityState === 'visible') checkRevision().catch(function () {}); });
  global.addEventListener('pagehide', function () { flushPending(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushPending(); });

  global.RoseachyStore = {
    setCommitObserver:fn=>{commitObserver=fn}, KEYS: KEYS, STORE_OF: STORE_OF, get: get, getObject: getObject, set: set, setCollection: setCollection, remove: remove, load: load, finalizeMigration: finalizeMigration,
    atomic: atomic, whenSaved: whenSaved, verify: verify, persistence: persistence, status: status, queryTransactions: queryTransactions,
    meta: area('metadata'), settings: area('settings'), onError: function (fn) { errorHandler = fn; }
  };
})(window);
