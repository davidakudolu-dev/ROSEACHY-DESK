# Roseachy v2.10.10 — Intensive Simulation & Review

Reviewed 12 October 2026 (Africa/Lagos). **88 browser scenario groups: 80 passed, 8 failed. Ten JavaScript syntax checks passed. The eight failing groups reproduce five distinct defects. The release is not cleared for reliable recovery until the P1 issues below are repaired.**

The uploaded application was extracted unchanged. Its SHA-256 is `4baf164918d4f11dec580cf69c6c310ea199fbd720be9fb63117032d23b08c53`. All 38 application files remain byte-identical. No application rebuild, repair, downgrade, removal or production deployment was performed. All browser data and example credentials used in testing are synthetic; no real business records were accessed.

## Confirmed defects

| ID | Priority | Trigger | Observed result |
| --- | --- | --- | --- |
| R1 | P1 | Save a real business day, export Full Backup without reloading, then import into a fresh profile | Import rolls back with “Restored saved days does not match the backup.” |
| R2 | P1 | Permanent IndexedDB draft write failure during a POS entry or supplier payment | UI says the entry/payment was recorded; reload reveals that it was not persisted. |
| R3 | P1 | Financial vault write fails, storage later recovers, then the app reloads | A movement previously reported “Not saved” appears in the bank ledger. |
| R4 | P2 | A second markup edit occurs while the first save is busy | The second requested markup value is silently dropped. |
| R5 | P2 | Enter an extreme POS service charge such as `1e308` | The entry is accepted, overflow becomes a missing/null fee in serialized data, and Full Backup fails validation. |

### R1 — Saved-day metadata breaks restore

Minimal reproduction uses the normal Stock, Sales and Save day buttons: create a product, sell two units, Save day, export Full Backup, restore on a fresh profile. A larger 308-transaction fixture fails in the same way.

The comparison differs only by `saved[0].businessKey`: storage generates `"roseachy"`, but the warm exported record lacks that derived property. The restore checker compares the complete serialized objects and rejects this harmless metadata addition. Recovery correctly restored the previous target profile; the observed failure is blocked restoration, not destruction of its prior data.

With healthy storage, reloading the source app before exporting produces the derived metadata and the new backup restores successfully. This was verified with the minimal case and the 9,010-transaction dataset. Existing rejected backups were not edited. The permanent repair should normalize generated metadata consistently before comparing restored business records, while continuing to validate all actual business values.

Source: `index.html:3725` (saved-record storage normalization), `index.html:5032` (restore comparison). Evidence: `results/triage-results.json`, `results/intensive-results.json`.

### R2 — POS and supplier payments report false durable success

For POS, inject a permanent failure for writes to the IndexedDB `draft` store, enter ₦25 with a ₦1 charge and press Add. The UI says **“POS transaction recorded”**, clears the amount field, and shows one in-memory transaction while storage reports an error. Reload returns to zero transactions.

For Market Desk, apply a ₦100 supplier-credit purchase, then inject the same draft failure and record a ₦20 payment. The UI says **“Supplier payment recorded”** and the in-memory payable falls to ₦80. Reload shows no payment and restores payable to ₦100.

These handlers mutate the in-memory ledger/Market state and clear or close the form before durable commit. The shared `toast()` helper displays the success message on both resolution and rejection of `RS.whenSaved()`. Repair should commit all related data atomically, retain/restore the form and editing context on failure, and show success only after verified persistence.

Source: `index.html:4365`, `index.html:4572`, `index.html:5652`. Evidence: `results/intensive-results.json`, `results/triage-results.json`.

### R3 — A rejected Financial movement can reappear

Start Financial Desk at ₦50,000. Inject a permanent `financeVault` write failure, then add ₦25 with a reason. The UI says **“Not saved”**; the live private ledger returns to ₦50,000 with zero events. Remove the failure, flush pending writes, reload and unlock: the ledger becomes **₦50,025 with one event**.

The failure handler pops the event from `finPrivate`, but the encrypted vault already placed in the store's memory/pending queue still contains it. Later persistence writes that rejected ciphertext. Repair should atomically roll back the cached encrypted vault, pending operations and private state together; a retry must not create duplicate movements. Financial reviews, password changes and other vault writes should use the same durable transaction mechanism.

Source: `index.html:5885`, `index.html:5935`. Evidence: `results/intensive-results.json`.

### R4 — Markup changes are dropped during busy saves

Normal sequential edits passed: default Pharmacy 10.5% yields ₦110.50 from ₦100 cost, default Essentials 30% yields ₦130; custom ₦155 and manual ₦777 prices remain unchanged. Existing sale amounts, saved days, quantities and accounting outputs remained unchanged.

The overlapping-input simulation failed. A second reproduction uses normal browser fill/change events while an atomic save is delayed by 900 ms: requesting Pharmacy 10.5% and Essentials 30% leaves Pharmacy at 10.5% and **Essentials at its old 20%**. The `inventoryBusy` early return and one shared debounce timer discard the second commit rather than queueing it. Repair should serialize/coalesce pending per-field edits and ensure the last requested value is committed after the current operation.

Source: `index.html:5522`, `index.html:6040`. Evidence: `results/market-settings-results.json`, `results/triage-results.json`. The 900 ms latency is deliberately simulated, not a measured disk-failure duration.

### R5 — POS accepts overflow-producing amounts

Negative/zero amounts, non-finite principal input and a negative fee were rejected. A fee of ₦10,000,000,000,000 was accepted. More decisively, a finite JavaScript input of `1e308` was also accepted; multiplication by 100 during rounding overflows. JSON serialization turns the resulting non-finite fee into null, and export reports **“Backup POS fee in the current day is missing.”**

Repair should validate raw inputs and all derived POS components as finite values with safe monetary bounds before rounding/mutation; apply consistent cent precision and upper limits across POS and cash-movement inputs. A rejected input must retain the working form and leave all ledgers unchanged.

Source: `index.html:4528`, `index.html:4534`, `index.html:4564`, `index.html:5107`. Evidence: `results/intensive-results.json`.

## Simulation coverage and passing results

| Suite | Groups | Passed | Failed |
| --- | ---: | ---: | ---: |
| Theme contrast and Financial exit locking | 12 | 12 | 0 |
| Full Backup regression and recovery | 18 | 18 | 0 |
| Navigation/UI regression | 23 | 23 | 0 |
| Offline/device-mode reliability | 6 | 6 | 0 |
| Native business stress and storage failures | 9 | 5 | 4 |
| Bulk Market purchases, supplier accounting and Settings | 8 | 7 | 1 |
| Large-volume accounting, persistence and UI | 7 | 7 | 0 |
| Focused failure reproductions | 5 | 2 | 3 |
| **Total** | **88** | **80** | **8** |

- **Sales/POS:** 180 normal retail entries across cash, transfer, credit, split and cash-banked sales, plus 120 modern POS entries across withdrawal, transfer and deposit, reconciled against an independent integer-cent model. Stock quantity, COGS, gross profit, customer credit, retail cash, bank movement, POS cash/electronic balances and fee income matched. External expenses affected only the intended accounting categories. Partial refunds and attempted over-refunds/source-sale deletion behaved correctly. Retail/POS cash moves conserved total physical cash. Ten repeated Save day operations produced one saved day and did not double-count Financial records.
- **Market:** 500-product catalog; two independent lists with 200 packed ready purchases. Applying 100 purchases affected only the selected list and exact pack/loose quantities. Supplier credit, initial payments, external payments, business-bank/cash payments and later settlement matched an independent balance calculation. Overpayment and wrong-date payment were rejected. Mixed payment methods required an explicit Paid Via choice. All 200 Market history items, 204 transactions, stock and packs restored correctly in that fixture.
- **Financial:** ordinary bank accounting matched supplier bank payments and Sales records. A larger ledger reconciled 4,505 unique bank-paid sale entries, with no saved/live duplication. Returning to Financial Desk required a password; menu/Back navigation, stale unlock requests, encrypted unfinished forms, reload and explicit Lock passed the regression checks. Storage-recovery defect R3 remains a P1 blocker.
- **UI/Settings:** named Midnight & Ember/Midnight Gold/Cobalt text passed rendered contrast checks in light/dark modes. Eight themes, both color modes, seven large-data viewport sizes and existing responsive/touch/Back/reduced-motion/font/border cases passed. Stock rendered at most 160 initial rows, saved days at most 30 and Financial history at most 80; search located product 0499. Notes data round-tripped with 1,000 records. Literal HTML in names, requests and notes did not execute. Normal Settings changes preserved business records; delayed overlapping markup commits failed as R4.
- **Persistence:** a 500-product, 90-saved-day, 9,010-transaction, 1,000-note dataset survived reload and fresh-profile full restoration. Offline service-worker reload and existing failure/cancel/concurrent export/import cases were exercised. Failed tests remain failures; they are not waived by the passing regression suites.

## Observed cloud timings

These are one-run Chromium/cloud measurements, not physical-device benchmarks.

| Operation | Observed time |
| --- | ---: |
| Apply 100 packed Market purchases | 362 ms |
| Seed large performance dataset | 6,201 ms |
| Aggregate large analytics dataset | 86 ms |
| Read/render 4,505-entry Financial ledger | 26 ms |
| Large Full Backup (4,083,676 bytes) | 1,872 ms |
| Restore large Full Backup | 8,447 ms |

The large history fixture tests record handling and totals; it is seeded and does not claim that all 9,010 transactions were entered manually or that historical inventory was replayed. The separate native workflow fixtures verify stock/accounting effects.

## Reproduction and limits

The included `tests/*.cjs` are the exact review harnesses. They expect the preserved cloud paths: `/workspace/roseachy-v2.10.10-intensive-review/app` and HTTP port 8775. Start Python's HTTP server from that app directory; use installed Node, Playwright and `/usr/bin/chromium`. Run `backup.cjs`, `release.cjs`, `navigation.cjs`, `reliability.cjs`, then the exploratory `intensive.cjs`, `market-settings.cjs`, `volume.cjs` and `triage.cjs`. The baseline focused suite also uses the retained synthetic v2.10.9 fixture path stated in its source. Review scripts continue after individual failed assertions so the remaining scenarios can run: inspect each JSON `passed` flag and `fatal`/`errors`, rather than treating process exit alone as the result. Test hooks are injected into browser responses only; they are absent from the unchanged application.

Synthetic storage exceptions and controlled latency model failure/slow-write behavior. Physical power interruption, Android/iOS installation, hardware Back/keyboard/safe areas, low-memory hardware, live Cloudflare deployment and real production datasets were not tested. No JavaScript page errors or fatal test-runner errors were observed. The ten syntax checks and all 38 original-file hashes passed.

## Application retrieval

The v2.9.4 project was located at `/workspace/ROSEACHY-DESK`. Its existing complete ZIP contains all 13 project files byte for byte: HTML with embedded CSS/JavaScript, `js/pwa.js`, manifest, service worker, six assets/icons, `_headers`, `_redirects` and `FIXES.md`. No project file was missing. A separate workspace copy was made without overwriting an existing file; the GitHub ZIP download was verified against it.

The uploaded v2.10.10 ZIP also remains unchanged and matches the published release. Review evidence is packaged separately. Direct Codex live HTML rendering/file publishing is unavailable here; GitHub raw HTML shows source code. The verified ZIP links provide complete files for Cloudflare Pages deployment; deploying/serving the HTML is what produces a live application. GitHub main and all earlier workspace files/releases were preserved.
