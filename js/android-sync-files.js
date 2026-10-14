/* Optional bridge for the existing Android WebView project. Browser/PWA use
   the existing File API. No remote file upload or storage permission is used. */
(() => {
  'use strict';
  if (!window.AndroidSyncFileBridge?.requestSave) return;
  const pending = new Map();
  const encode = text => {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  };
  window.RoseachyAndroid = {
    saveSyncFile(name, text) {
      if (new TextEncoder().encode(text).length > 32 * 1024 * 1024) return Promise.reject(new Error('File exceeds 32 MB.'));
      if (!/^[\w .-]+\.json$/i.test(name)) return Promise.reject(new Error('Invalid sync filename.'));
      const id = window.crypto.randomUUID ? crypto.randomUUID() : 'save-' + crypto.getRandomValues(new Uint32Array(4)).join('-');
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(id); reject(new Error('Android file save did not finish. Check Files and retry.')); }, 5 * 60 * 1000);
        pending.set(id, {resolve,reject,timer});
        try { AndroidSyncFileBridge.requestSave(id, name, encode(text)); }
        catch (error) { clearTimeout(timer);pending.delete(id);reject(error); }
      });
    },
    onSaved(id, status) {
      const request = pending.get(id);
      if (!request) return;
      pending.delete(id);clearTimeout(request.timer);
      if (status === 'saved') request.resolve('android');
      else request.reject(new Error(status === 'cancelled' ? 'Android file save cancelled.' : 'Android could not save this file.'));
    }
  };
  function hookExistingBackups() {
    if (!window.RoseachyFiles?.save) return;
    const original = RoseachyFiles.save;
    RoseachyFiles.save = async (blob, name) => {
      if (/\.json$/i.test(name)) {
        await RoseachyAndroid.saveSyncFile(name, await blob.text());
        // The existing backup recorder recognizes a completed file-picker save.
        return 'picker';
      }
      return original(blob, name);
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hookExistingBackups, {once:true});
  else hookExistingBackups();
})();
