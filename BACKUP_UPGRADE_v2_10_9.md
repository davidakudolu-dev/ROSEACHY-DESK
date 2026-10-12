# Roseachy v2.10.9 — Full Backup repair

Sales Desk Full Backup and Settings Full Backup now call the same exporter directly. The export contains stock, saved days, current sales and POS, opening/actual balances, notes and recycle bins, Market lists/purchases/suppliers/payments/history, encrypted Financial vault, review/confirmation metadata, inventory audit, appearance/pricing settings, navigation state, held purchases, and unfinished working forms. Reports and analytics are regenerated from the restored business records.

Both buttons export the same business payload when work is unchanged. Export timestamps/checksums may differ. Private unfinished Financial fields are encrypted using the existing vault key; PINs and encryption keys are excluded. Unlock Financial Desk with its existing PIN to recover those unfinished fields. The existing Encrypted Full Backup also uses this snapshot.

Imports validate the supported format, checksum and domain records before replacing data. Duplicate IDs, invalid amounts, broken references and incomplete current-format backups are rejected. Supported legacy backups remain importable; legacy omissions that would erase existing records are blocked. A verified safety snapshot is retained before import. Restores replace records without replaying inventory/accounting transactions. Failed imports attempt verified recovery and report the result; if recovery cannot be verified, a persistent dialog blocks further edits until reload.

The IndexedDB schema advances from 6 to 7 to store interface and unfinished work records. Existing data is migrated in place. Do not deploy an older application over this database; retain an external Full Backup before upgrading. SHA-256 detects accidental corruption; it is not proof of the file's author.

## Deployment

Extract the complete ZIP and deploy its contents to the root of the existing Cloudflare Pages project, with index.html at the root. No build is required. HTML, embedded CSS/JavaScript, js/pwa.js, manifest.json, sw.js, icons, _headers and _redirects are included. All 32 existing files were retained; only index.html, js/pwa.js and sw.js changed, plus this release's documentation. Earlier test reports are preserved as historical records.

On a device already running the app, retain an external backup, deploy, reload to receive the new service worker, and check the storage status/version before importing. Browser validation uses synthetic data and does not establish a completed Cloudflare production deployment or physical-device installation test.
