# Roseachy v2.10.3 — Offline data safety hardening

Starting archive: `Roseachy_v2_10_2_Analytics_Stock_Adjustment_Cloudflare.zip`.

## Changes

1. **Data safety in Settings**: compact, responsive status for IndexedDB, browser persistence, storage usage/quota, last full-backup download attempt and a 24-hour backup reminder. Buttons can request persistence, verify saved database records, export a full backup or inspect a chosen backup JSON without importing it.
2. **Persistent storage**: check browser status without repeatedly writing metadata; request persistence once on startup and on explicit user action. Browser permission is not guaranteed.
3. **Verified full export**: wait for outstanding database commits; compare saved records to the working copy; take a deep, independent snapshot; compute a SHA-256 checksum; then prepare the backup download. If validation fails, do not claim an export occurred. The checksum detects accidental change or truncation, **not intentional forgery**.
4. **Restore checks**: verify SHA-256 before reading/importing signed backups. Older unsigned Roseachy full backups remain supported through existing structural validation. Pre-import recovery uses a verified safety snapshot and waits for a pre-import download attempt before overwriting records. User can cancel a desktop save picker to cancel import.
5. **Working Stock export**: wait for database writes and verify them before preparing download.
6. **Encrypted Financial Desk export**: its inner full backup receives the same verification; user still needs its original PIN or offline recovery key to restore. Successful download requests are recorded for reminder purposes.
7. **Updates**: do not run “Update now” if unsaved database writes fail. New service worker cannot activate with missing essential offline shell files.
8. **IndexedDB failure**: after Roseachy has marked this device as using IndexedDB, do not silently start a blank localStorage fallback if the database becomes temporarily inaccessible. Show a retry screen instead.
9. **Scope**: preserves existing app data keys, schema version, business logic, UI themes, stock/pack workflow, sales, POS, Market Desk, Financial Desk, Analytics, backup format and Cloudflare root structure.

## Important limitations

- **Save one full backup from the currently installed v2.10.2 before deploying v2.10.3.** Copy it outside the browser before trying a new build. Deploy to the **same Cloudflare site/domain** so it can access existing origin-specific records; switching domains creates distinct browser storage.
- Chrome's site-data clearing, uninstalling or losing the phone can delete an installed PWA's data. Persistence never prevents user-initiated deletion. App-held snapshots and internal recovery copies are **not external backups**.
- An Android browser download is counted as **initiated, not confirmed saved**. Find the JSON file in Files/Downloads, check it with “Check backup file,” and copy it to Drive or another device. Do not assume that exporting creates any cloud backup.
- Browser quota estimates are approximate, not a direct measurement of physical free device storage.
- PWA storage grants depend on the browser and device. Some storage protection states or browser APIs may be unavailable.
- External export and import flows should be exercised on the actual phone using a separate test dataset before relying on this build for live business transactions.
