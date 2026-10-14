# Roseachy v2.10.13 — Market Desk and Smart Sync review

Reviewed the exact uploaded Ember / Smart Sync / Smooth Swipe v2.10.12 build on 14 October 2026. Its original ZIP and extracted files remain unchanged. Historical test documents inside that upload describe their own releases; this report describes the current review.

**113 automated browser scenario groups and 11 JavaScript syntax checks passed.** Synthetic business data ran in isolated Chromium profiles. The original upload passed the adapted 26 baseline sync groups, but six of eight new adversarial checks failed. A further test reproduced omitted Low Stock purchase work. Targeted repairs were verified with regression, migration, private-data, fallback-storage and load checks. The eight areas repaired are below.

## Findings and fixes

| Area | Confirmed behavior | Repair and verification |
|---|---|---|
| Market recycle bin | Deleted Active Lists and their purchase drafts were absent on another device | Synchronize deleted list records; test delete, exchange, restore and reverse exchange |
| Market sessions and budget | Archived Market sessions and budget changes were not transferred | Include those records in reconciliation and event capture; upgrade existing enrolled devices without resetting their checkpoint |
| Automatic Low Stock purchase work | Entire automatic lists were skipped, including saved operator purchase drafts | Transfer prepared items while keeping generated alerts local; preserve independent prepared drafts when list normalization encounters the same product |
| Cross-device edit order | A later edit on a low-sequence device could be applied before the high-sequence event it had already received | Capture observed device dependencies and order events causally; preserve existing event IDs/content; reject missing/cyclic dependencies |
| Atomic merge receipt | Business/event writes and peer/import receipt metadata used separate durable commits | Store receipt metadata with the same transaction as incoming events and business data; verify the actual IndexedDB transaction |
| Shared market advance | Two offline devices could overspend the same advance without a merge discrepancy | Keep both real purchases, show the funding deficit in preview and status, and retain it after merge; do not invent cash or silently discard payments |
| PIN expiry | An open Sync screen could hide both its content and its PIN form | Show the existing Financial PIN form when the session locks; reauthorization works without leaving the screen |
| Pending bank data | The plaintext imported envelope could remain plaintext in the app's pending-import storage | Seal pending files with the local Financial vault key, resume after reauthorization/restart, and migrate older pending files on successful authorization |

Prepared work omitted by older sync capture is promoted to ordinary events during the first upgraded startup. The migration's marker, shadows and events share one transaction. Existing checkpoint, BusinessID, installation identity and sequence history remain. This cannot recover data already lost from all devices and backups.

## Simulation evidence

- 120 products: 30 supplier-purchase lines add 720 units; 60 independent sales remove 120 units. Repeated bidirectional exchange gives **30,600 total units**, **91 transactions**, **₦99,320 retail cash** and **₦3,220 supplier debt** on both devices.
- 500 products and 200 prepared Market items across two lists: applying one list leaves the other intact; packed quantities, bank/cash/external supplier payments, liabilities and Full Backup restoration reconcile. A separate 500-case quantity-pricing arithmetic check passes.
- Concurrent shared advance: ₦100 issued, then two real purchases of ₦80. Both purchases remain; the **₦60 funding shortage** is flagged. An ordinary purchase exceeding the remaining advance is rejected before partial stock/history/cash changes.
- Duplicate/renamed/restarted imports, filtered recipient exports, three-device hops, 180-versus-60 historical days, 120-sale backlog, stock shortages, price/count conflicts, supplier partial payments, cash-out sales, reversals and post-sync Full Backup all pass.
- IndexedDB abort and fallback-storage write failure preserve prior data; retry and reload apply the purchase once. Incoming event writes and receipt metadata are verified in the same IndexedDB transaction.
- Existing enrolled installations migrate omitted Market sessions, deleted lists and budget into sync without resetting stock or their checkpoint. Two separate prepared Low Stock drafts for the same product survive exchange and restart.
- A plaintext file containing a bank movement is sealed in local pending storage, then resumed after restart; the verified bank balance includes the movement once.
- Full Backup, Financial rollback, offline service-worker reload, Sales/POS load, uploaded navigation/swipe behavior and existing settings checks pass.

## Compatibility and operating limits

**Update every participating device to v2.10.13 before exchanging new files.** Sync protocol 2 prevents older merge engines from accepting files whose causal and Market-record semantics they do not understand. Protocol-1 exchange files are rejected with a re-export instruction. Business databases remain schema 8. Existing Full Backups remain supported; a Full Backup restore is never a substitute for merging another device's activities.

The uploaded password-free design is preserved: exchange files are readable plaintext with a SHA-256 checksum. A checksum detects accidental alteration; it does not authenticate a sender. Local Financial PINs and vault encryption remain separate, and pending imported files are now encrypted at rest. Transfer files only to intended business devices.

Concurrent supplier payments that exceed a purchase's outstanding total are rejected atomically. The original payments remain on their source devices and need operator review; this repair does not create supplier credit or delete a real payment automatically. Shared-advance deficits similarly require verified funding correction rather than automatic balance changes.

Testing used synthetic data in Chromium. Physical Android APK compilation, SAF permissions, Bluetooth/Quick Share, actual PWA-to-APK exchange and hardware power cuts were not tested. Injected storage aborts and browser restarts are the tested interruption model. Real business opening stock, bank/cash, debt and liabilities still require responsible reconciliation against actual records.

The ZIP contains application code and assets, not the private database in your browser. All 51 uploaded files are retained; only index.html and sw.js are changed, with this release's guide/results added. The uploaded Ember styles and smooth-swipe implementation are retained. Reproducible tests and original failure evidence are published in validation/v2.10.13 on the release branch.
