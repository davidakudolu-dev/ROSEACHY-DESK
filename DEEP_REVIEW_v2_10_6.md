# Roseachy v2.10.6 — 30-Day Deep Review and Corrections

**Source:** Roseachy v2.10.5 Notes Recycle Bin Cloudflare PWA.  
**Scope:** stock adjustments, Market Desk, Settings and themes, offline analytics, full and working-stock backups, Notes and mobile UI.

## Changes to the application

1. **Working-stock restore: validate before touching permanent stock history.** Previously, the incoming inventory audit was merged *before* the file was validated. Invalid/corrupt stock-only backups could pollute immutable history. The restore operation now validates first, then merges only inside an atomic business-data commit.
2. **Working-stock restore: external safety export before mutation.** A verified full business backup must be exported first. When Chrome starts a standard download, the operator must confirm locating the file in Downloads/Files. Canceling or failing an export prevents the restore. Detects records changing during the backup process.
3. **Market Desk: all-or-nothing batch purchases.** An error in the second line of a multi-product purchase no longer risks leaving the first line committed; the error propagates to the atomic transaction handler. Invalid purchases roll back inventory, ledger, and audit together.
4. **Restore-pre-import action: transaction rollback.** Damaged backups now fail validation and cannot be silently swallowed within an atomic restore.
5. **Full backup import: safer recovery confirmation.** Unlike the previous code, an unrecognized result from the safety export does not permit importing. A Chrome download requires user confirmation. The app checks for concurrent business-data changes before replacing current records.
6. **Stock history redraw:** avoid rebuilding the expanding audit list after each inventory operation when Stock is not the visible desk.
7. **Offline PWA shell:** the service worker avoids launching unnecessary background network requests when cached offline assets already exist. Navigation remains network-first with offline fallback; new worker version forces shell refresh.
8. **Notes / Settings theme legibility:** neutral, readable disabled-state action; corrected disabled 'Empty recycle bin' in Ember light mode. Other existing interface layouts and color themes remain.

## 30-day tests (real application business functions, synthetic data)

| Measurement | Baseline | Larger stress |
|---|---:|---:|
| Days modeled | 30 | 30 |
| Different stock products | 120 | 350 |
| Sale transactions | 1,650 | 4,500 |
| Units sold | 3,282 | 9,056 |
| Restocks | 240 | 960 |
| Units received | 2,994 | 11,727 |
| Stock adjustments | 120 | 360 |
| Pack-size corrections | 60 | 120 |
| Price changes | 60 | 120 |
| Atomic transaction batches | 270 | 270 |
| Saved-day ledger records | 2,010 | 5,820 |
| Immutable inventory audit entries at finish | 532 | 1,773 |
| Inventory quantity / batch / pack discrepancies | **0** | **0** |
| Full-backup saved-day ledger discrepancies | **0** | **0** |
| Uncaught application JS errors in month simulation | **0** | **0** |

In both simulations, the test compared every product's final units against an independent running stock balance after each day, verified expiry-batch totals and derived pack/loose quantities, and confirmed all saved-day transactions appeared in a valid full-backup snapshot. No synthetic demo records are included in the distributed app.

### Targeted regressions

**21/21 passed after corrections:** exact counts, pack conversions (24 units / 12 per pack, then 6 per pack), fractional quantity rejection, Market Desk restock pricing, historical batch purchase cost, failed multi-item purchase atomic rollback, full-backup coverage for deleted Notes/Market/Settings/current purchase, rejection of malformed stock imports without contaminating permanent audit, and repeated Settings theme changes without altering business records.

### Interface review

- 15 tab/viewport checks at 320, 360, 390, 480 and 768 pixels found **no document-level horizontal overflow** in the baseline 120-product simulation.
- Additional 350-product stress checked Stock and Analytics at 360 pixels with no horizontal overflow.
- 8 themes × light/dark × representative input/button/note/analytics selectors: 176 samples with opaque direct backgrounds passed **4.5:1 foreground/background contrast** after fixing the Ember Notes disabled action. Transparent samples require ancestor compositing and were excluded from this measurement.
- Analytics in the simulator produced fastest-selling, rising and declining product summaries. Market's normal low-stock synchronization updates the Market working list when rendered; no unrelated stock, sales, audit, Notes or saved-day data changed.

## Verification boundaries and remaining risk

- Business flows were exercised in **headless Chromium with a mocked, in-memory localStorage fallback**, because the isolated browser runner blocks a secure local web origin. This does **not** validate real Android Chrome IndexedDB write durability, IndexedDB migrations, service-worker offline installation/update behavior, or browser-level storage eviction.
- The test scenarios are simulated operations, **not 30 actual days of deployment**. They do not prove hardware reliability, every possible workflow, or backup success on the owner's phone.
- Safe backup downloads are requested by the browser. A click/download event **cannot guarantee a file physically exists**, so a confirmation step was added; always locate the file and, ideally, test it on a separate profile before destructive restores.
- No live users, bank balances, printers, cloud connectivity or actual phone storage were accessed. Live-device acceptance testing remains necessary before relying on Roseachy as the sole source of business records.
- Don't clear Chrome site data or uninstall the installed PWA without an externally stored and verified backup.

## How to deploy safely

1. In the currently installed app (v2.10.5), export a **Full Backup** and verify the JSON exists in Downloads/Files. Copy it to an independent location (Drive, another device).
2. Deploy the ZIP's **contents** to the **same Cloudflare Pages project and website address**. Do not deploy onto a new origin if you expect the old PWA's local data to remain visible.
3. Open the installed PWA online once to allow new cached shell assets, then reopen offline and verify stock, daily sales, Notes, Market, Settings, analytics, backup export and restore-preview.
4. Do a small test sale, a stock adjustment, and a backup on the actual device. Reconcile stock totals and report against the records before regular use.

