# Roseachy v2.10.0 — Inventory, packs, pricing and permanent adjustments

This release upgrades the uploaded v2.9.9 application. Its themes, Sales, Market, Financial Desk, POS, Reports, Analytics, customer records, expiry batches, offline storage and backup formats remain integrated.

## Deploy to Cloudflare Pages

1. Extract this ZIP. `index.html`, `manifest.json`, `sw.js`, `_headers`, `_redirects`, `js/` and `icons/` belong at the deployment root. CSS and most application JavaScript are embedded in `index.html`.
2. Deploy those contents to your existing Cloudflare Pages project and existing application origin. Browser business records stay on that origin; changing the origin does not transfer them automatically.
3. Open Roseachy online once. Use its existing Update action when offered, then reopen. The new service worker caches the upgraded application for offline use.
4. Existing IndexedDB data migrates in place from schema 5 to 6. There is no stock reset. Keep a full or encrypted backup before deployment; older application builds cannot open schema 6 directly.

## Inventory operations

* Total units are the authoritative stock quantity. Packs and loose units are calculated from total units and units per pack. Changing pack size preserves stock quantity.
* Stock addition and Market quantity fields synchronize units, complete packs and loose units. Loose units normalize into complete packs as necessary.
* Stock adjustment offers Increase, Decrease, Damaged, Set exact quantity, Set packs + loose units, Correct packaging and Update pricing. Only relevant fields appear. Exact zero is supported.
* For products with multiple expiry batches, select the affected batch before decreasing or setting a lower count. Correct batches separately when a count discrepancy spans several batches. In Stock Edit, select a batch to correct its expiry date without affecting other batches.
* The latest received unit cost becomes current cost. Entered total purchase cost is divided by newly purchased units; the original entered amount remains the financial amount. Explicit selling prices take precedence over markup; configured markup applies where appropriate, and manual prices otherwise remain stable.
* Batch acquisition costs and completed sale prices/costs remain historical records. Current-cost inventory valuation uses current cost. Pricing and packaging corrections create no cash, bank, supplier or POS movement.
* Stock addition retains its established non-payment stock receipt workflow. Use Market/Sales purchase workflows to record actual purchase payments or supplier debt; changing an inventory number does not invent a payment.
* New sale selections use current prices. An open sale retains its captured price until Refresh current price is used. Held/completed lines keep their snapshots; cancel and add a held line again to adopt a new price.

## Permanent history and backups

* Permanent stock adjustments are independent of editable day records and recycle bins. Entries capture stable product ID, timestamp, sequence, before/after quantity, pack representation, current costs/prices, source, reason, available business context and transaction/batch references.
* There are no Edit or Delete controls for committed history. Correct an incorrect stock adjustment with another adjustment. Its committed ledger entry is also protected from editing/deleting.
* Product removal, archive, recycle-bin purge, new-day cleanup and older backup restores retain history. Full, working-stock and encrypted backups include it. Restores merge permanent history and reject conflicting IDs or malformed quantities/batches before application.
* Older stock records without packaging information remain supported. Existing adjustment transactions are retained. Legacy adjustments with recorded before/after quantities are copied into permanent history using their original timestamp; missing historical quantities are not invented.
* Inventory changes, related transactions and audit entries commit together in IndexedDB. Failed explicit writes roll back together. The localStorage fallback uses an undo journal for interruption recovery. Stale windows remain blocked until reload.

## Practical limits

This is an offline application with local records. Browser/device storage deletion or changes outside the application can still erase or tamper with data; append-only application controls do not provide external tamper-proof storage. Keep regular full/encrypted backups.

The application has no authenticated operator identity. Captured business context is not proof of who made an adjustment. Device-local clock timestamps are displayed in the user's local timezone, with stable sequence IDs for deterministic ordering.

Read `TEST_REPORT.md` for the executed validation and failures corrected.
