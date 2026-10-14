/* Roseachy PWA glue: safe service-worker updates, install UI,
   storage-persistence status, multi-window warning, and backup-file saving helpers. */
(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };
  const standalone = function () {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      navigator.standalone === true;
  };

  /* ---------- notice bars ---------- */
  function bar(id, text, buttons) {
    let el = $(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'pwaBar noPrint';
      document.body.appendChild(el);
    }
    el.innerHTML = '';
    const sp = document.createElement('span');
    sp.textContent = text;
    el.appendChild(sp);
    (buttons || []).forEach(function (b) {
      const bt = document.createElement('button');
      bt.type = 'button';
      bt.textContent = b.label;
      bt.onclick = b.onClick;
      el.appendChild(bt);
    });
    el.classList.add('show');
    return el;
  }

  function hideBar(id) {
    const el = $(id);
    if (el) el.classList.remove('show');
  }

  /* ---------- safe service-worker updates ---------- */
  let refreshing = false;
  let updateRequested = false;

  if (!window.AndroidSyncFileBridge && !window.RoseachyPortablePreview && 'serviceWorker' in navigator &&
      (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(function (reg) {
        function offer(worker) {
          if (!worker) return;
          bar('updateBar', 'A Roseachy update is available. Apply when convenient.', [
            {
              label: 'Update now',
              onClick: function () {
                const go = function () {
                  updateRequested = true;
                  worker.postMessage({ type: 'SKIP_WAITING' });
                };
                const savePromise = window.RoseachyStore && window.RoseachyStore.whenSaved
                  ? window.RoseachyStore.whenSaved()
                  : Promise.reject(new Error('Database is not ready'));
                savePromise.then(go).catch(function () {
                  bar('updateBar', 'Update paused: a business record has not been saved. Do not reload. Check storage, then retry.', [
                    { label: 'Retry after saving', onClick: function () { offer(worker); } },
                    { label: 'Later', onClick: function () { hideBar('updateBar'); } }
                  ]);
                });
              }
            },
            { label: 'Later', onClick: function () { hideBar('updateBar'); } }
          ]);
        }

        if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);

        reg.addEventListener('updatefound', function () {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', function () {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
          });
        });

        /* Check immediately, whenever the app comes back into view, and periodically while open. */
        reg.update().catch(function () {});
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') reg.update().catch(function () {});
        });
        setInterval(function () { reg.update().catch(function () {}); }, 60 * 60 * 1000);
      }).catch(function (e) {
        console.warn('Roseachy service worker registration failed:', e);
      });

      navigator.serviceWorker.addEventListener('controllerchange', function () {
        /* Never reload on first install or in the middle of a sale. Reload only after Update now. */
        if (!updateRequested || refreshing) return;
        refreshing = true;
        location.reload();
      });
    });
  }

  /* ---------- install button: Settings only; never nags ---------- */
  let deferred = null;

  function syncInstall() {
    const b = $('installBtn');
    if (b) b.classList.toggle('hidden', !deferred || standalone());
    const n = $('installNote');
    if (n) n.classList.toggle('hidden', !standalone());
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    syncInstall();
  });

  window.addEventListener('appinstalled', function () {
    deferred = null;
    syncInstall();
    if (window.RoseachyStore) {
      if (window.RoseachyStore.persistence) {
        window.RoseachyStore.persistence(true).then(refreshStatus).catch(function () {});
      }
      if (window.RoseachyStore.settings && window.RoseachyStore.settings.set) {
        window.RoseachyStore.settings.set('installedAt', new Date().toISOString()).catch(function () {});
      }
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'installBtn' && deferred) {
      const d = deferred;
      try {
        d.prompt();
        Promise.resolve(d.userChoice).catch(function () {}).finally(function () {
          deferred = null;
          syncInstall();
        });
      } catch (err) {
        deferred = null;
        syncInstall();
      }
    }
  });

  /* ---------- storage status ---------- */
  function fmtBytes(n) {
    if (n == null) return '';
    const u = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (n >= 1024 && i < 3) { n /= 1024; i++; }
    return n.toFixed(i ? 1 : 0) + ' ' + u[i];
  }

  async function refreshStatus() {
    const el = $('storageStatus');
    if (!el || !window.RoseachyStore) return;

    const st = window.RoseachyStore.status();
    let p = { supported: false };
    try { p = await window.RoseachyStore.persistence(false); } catch (e) {}

    let t = st.mode === 'indexeddb'
      ? 'Records are saved to this phone’s IndexedDB database after every change. '
      : '⚠ Database unavailable — using fallback storage. Export a backup now. ';

    if (p.supported) {
      t += p.persisted
        ? 'Persistent storage: granted (reduces automatic eviction, not manual deletion). '
        : 'Persistent storage: not granted (the app still works; keep external backups). ';
    }
    if (p.usage != null) t += 'Using ' + fmtBytes(p.usage) + '.';
    el.textContent = t;

    try {
      const lb = await window.RoseachyStore.meta.get('lastFullBackup');
      const l = $('lastBackupInfo');
      if (l) {
        l.textContent = lb
          ? 'Last full backup download requested: ' + new Date(lb).toLocaleString()
          : 'No full backup download has been recorded on this device.';
      }
    } catch (e) {}
  }

  // The Settings panel reads real browser/storage state; it never labels data "protected"
  // merely because the app is installed. Checking a backup file never imports its records.
  async function updateSafety(p, st, lastBackup) {
    const text = function (id, value) { const el = $(id); if(el) el.textContent = value; };
    text('safetyDbStatus', st.mode === 'indexeddb'
      ? (st.stale ? '⚠ Records changed in another window. Reload before editing.' : st.pending ? '◌ Records still saving. Do not close the app.' : '✓ IndexedDB is available. Records are stored locally.')
      : '⚠ Using fallback storage. Export a full backup and inspect browser storage.');
    text('safetyPersistStatus', !p.supported || !p.persistSupported
      ? '⚠ Storage protection cannot be requested in this browser.'
      : p.persisted ? '✓ Persistent storage granted (automatic eviction resistance).' : '⚠ Standard browser storage. Request protection below.');
    const remain = (p.quota != null && p.usage != null) ? Math.max(0,p.quota-p.usage) : null;
    const ratio = p.quota>0 ? p.usage/p.quota : 0;
    text('safetyUsageStatus', p.usage==null ? 'Browser storage usage unavailable.'
      : 'Browser storage: ' + fmtBytes(p.usage) + ' used' + (remain==null ? '.' : ' · about '+fmtBytes(remain)+' quota remaining.')
        + (ratio>.8 ? ' ⚠ Browser storage quota is nearly full.' : ''));
    const protect = $('safetyProtectBtn');if(protect)protect.disabled=!!p.persisted || !p.persistSupported;
    const age = lastBackup ? Date.now() - new Date(lastBackup).getTime() : Infinity;
    const due = !Number.isFinite(age)||age > 24*60*60*1000;
    text('safetyBackupStatus', !lastBackup
      ? '⚠ No full backup download recorded. Create one and save it outside Chrome.'
      : (due?'⚠ Daily backup overdue. ':'✓ Backup download requested within 24 hours. ')
        + 'Last: '+new Date(lastBackup).toLocaleString()+'. Check the downloaded file.');
  }

  const oldStatus = refreshStatus;
  refreshStatus = async function () {
    await oldStatus();
    if (!$('roseachyDataSafety') || !window.RoseachyStore) return;
    const st=window.RoseachyStore.status();
    let p={supported:false};try{p=await window.RoseachyStore.persistence(false)}catch(e){}
    let date=null;try{date=await window.RoseachyStore.meta.get('lastFullBackup')}catch(e){}
    await updateSafety(p,st,date);
  };
  window.RoseachyRefreshStatus = function () { return refreshStatus(); };
  window.addEventListener('roseachy:ready', function () {
    syncInstall();
    // Request persistence once on startup of the installed PWA. Chrome may deny it.
    if(window.RoseachyStore?.persistence){window.RoseachyStore.persistence(true).then(refreshStatus).catch(refreshStatus);}
    else refreshStatus();
  });

  $('safetyProtectBtn')?.addEventListener('click', async function () {
    const b=this;b.disabled=true;
    try{await window.RoseachyStore.persistence(true);await refreshStatus();}
    catch(e){$('safetyPersistStatus').textContent='Unable to request protection: '+(e.message||e);}
    finally{const st=await window.RoseachyStore.persistence(false);b.disabled=!!st.persisted||!st.persistSupported;}
  });
  $('safetyVerifyBtn')?.addEventListener('click', async function () {
    const b=this;b.disabled=true;const el=$('safetyVerificationStatus');el.textContent='Checking saved records…';
    try {const v=await window.RoseachyStore.verify();el.textContent=v.ok?'✓ Database records match the saved copy. External backup is still essential.':'⚠ Database verification failed: '+v.bad.join(', ');}
    catch(e){el.textContent='⚠ Database check failed: '+(e.message||e);}
    finally{b.disabled=false;}
  });
  // Full Backup buttons are bound directly to the shared controller in index.html.
  $('safetyBackupCheckBtn')?.addEventListener('click',function(){ $('safetyBackupCheckFile')?.click(); });
  $('safetyBackupCheckFile')?.addEventListener('change',async function(){
    const f=this.files?.[0];this.value='';if(!f)return;
    const el=$('safetyFileStatus');el.textContent='Checking '+f.name+'…';
    try{
      if(!window.RoseachyCheckBackupFile)throw Error('Backup checker is not ready.');
      const r=await window.RoseachyCheckBackupFile(f);
      el.textContent='✓ Backup structure valid · '+r.products+' products · '+r.days+' saved days · Financial Desk '+(r.finance?'included':'not configured')+' · '+r.checksum+'. This check does not import anything.';
    }catch(e){el.textContent='⚠ Backup check failed: '+(e?.message||e);}
  });

  /* A stale working copy must reload before editing or saving. */
  function blockStaleWindow() {
    if ($('externalChangeOverlay')) return;
    const app = document.querySelector('.app'); if (app) app.inert = true;
    const overlay = document.createElement('div'); overlay.id = 'externalChangeOverlay';
    overlay.setAttribute('role', 'alertdialog'); overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'externalChangeTitle');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.65)';
    const box = document.createElement('div'); box.style.cssText = 'max-width:420px;padding:24px;border-radius:16px;background:var(--card,#fff);color:var(--navy,#182b24)';
    const title = document.createElement('h2'); title.id = 'externalChangeTitle'; title.textContent = 'Records changed in another window';
    const text = document.createElement('p'); text.textContent = 'Reload to use the latest records before continuing. Editing is paused in this window.';
    const button = document.createElement('button'); button.className = 'primary'; button.textContent = 'Reload'; button.onclick = function () { location.reload(); };
    box.append(title, text, button); overlay.append(box); document.body.append(overlay); button.focus();
  }
  window.addEventListener('roseachy:external-change', blockStaleWindow);
  window.addEventListener('roseachy:ready', function () { if (window.RoseachyStore && RoseachyStore.status().stale) blockStaleWindow(); });

  /* ---------- save backups/files ---------- */
  window.RoseachyFiles = {
    save: async function (blob, name, kind) {
      /* Desktop browsers can use a native save picker. Android uses normal download for reliability. */
      if (kind !== 'plain' && window.showSaveFilePicker && !/Android/i.test(navigator.userAgent)) {
        try {
          const h = await window.showSaveFilePicker({
            suggestedName: name,
            startIn: 'documents',
            types: [{
              description: kind === 'csv' ? 'CSV file' : 'JSON backup',
              accept: kind === 'csv'
                ? { 'text/csv': ['.csv'] }
                : { 'application/json': ['.json'] }
            }]
          });
          const w = await h.createWritable();
          await w.write(blob);
          await w.close();
          return 'picker';
        } catch (e) {
          if (e && e.name === 'AbortError') return 'cancelled';
        }
      }

      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        a.remove();
        URL.revokeObjectURL(u);
      }, 1500);
      return 'download';
    }
  };

  syncInstall();
})();
