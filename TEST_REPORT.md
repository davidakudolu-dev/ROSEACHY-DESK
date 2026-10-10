# Roseachy v2.10.0 executed validation

Baseline: uploaded Roseachy v2.9.9 Ember/New List Contrast Cloudflare ZIP. Original uploaded files are preserved separately in the workspace. Production application uses no testing hooks or new network dependency.

## Changes and integration reviewed

Reviewed product normalization, expiry-batch acquisition costs, current pricing, stock addition/edit/duplicate/bulk paths, exact/pack/metadata corrections, Market working lists and purchase application, supplier debts/payments, sale/hold snapshots, returns, transaction replay, POS/cash movements, Financial Desk encrypted vault/owner review, Reports/Analytics valuation, full/working/encrypted backups, storage migration, stale-window protection, service worker and themes.

Total units remain authoritative. Current prices use latest valid received cost and explicit selling price, with existing markup behavior. Original purchases, batch costs and sale costs remain separate historical information. Permanent audit records are indexed independently of day records. Quantity corrections and metadata edits remain financially neutral. Backups merge history and validate quantities, pack arithmetic and batch totals.

## Executed tests

**44 successful scenario groups**, with Playwright/Chromium against the application, plus the deterministic long-run simulation below. Real UI flows exercise Stock, Market review/apply, Sales, adjustments, duplicate and bulk restocking, held items, encrypted backup and theme controls. Private test instrumentation exposes existing application functions only in a separate test document; it is absent from deployment files.

| Simulation measure | Actual result |
|---|---:|
| Products | 300 |
| Mixed operations | 3600 |
| Sales / restocks / corrections / pack edits / price edits | 720 each |
| Expected new audit records | 2880 |
| Actual new audit records | 2880 |
| Quantity / current-price / batch mismatches | 0 |
| Sales total | NGN 228,834.00 |
| Purchase bank outflow | NGN 254,863.80 |
| Units sold / purchased | 1,440 / 2,160 |
| Unexpected purchase cash outflow | 0 |
| Duplicate audit IDs | 0 |
| Commit latency, 95th percentile | 50.1 ms |
| Maximum measured commit latency | 76.7 ms |

The independent oracle checks cumulative quantities, current prices, batch sums, derived packs, transaction counts and monetary movements. Backup validation and restart/database verification also passed. Timing describes this headless workspace, not every phone.

Measured contrast for new history text and adjustment inputs passed at least 4.5:1 in all eight tested theme/mode combinations: Ember, Midnight Gold, Green and Pearl, each light/dark. Mobile overflow checks passed and screenshots were inspected.

## Failures found and corrected

* Current purchase cost could become a weighted batch average; current pricing now retains the latest supplied cost while batch acquisition cost stays historical.
* Physical pack fields did not automatically express total units. Product and batch representations now derive from their units; fields do not add separate stock.
* Stock correction history depended on editable/removable ledgers. Independent append-only history persists through product removal, cleanup and backup restores.
* Transaction replay regenerated batch IDs and could invalidate later selected-batch corrections. Existing receipt/return batch IDs are retained during replay; targeted correction plus sale/purchase editing passed.
* Historical markup snapshots could be recalculated using current defaults. Reading historical snapshots now preserves stored selling prices.
* Stock duplicate restocks could encode total units again as loose units; transaction pack arithmetic and batch representations now match base units, and full backup validation passed.
* Bulk restocking could update cost without adopting an explicit new selling price. It now updates both current prices on the existing product.
* Changing themes could animate a field background while immediately changing text, briefly yielding poor contrast. Affected correction fields switch foreground/background together, using existing contrast-guarded theme tokens. Measured checks passed.
* Explicit inventory operations previously lacked an all-or-nothing failure path. Injected IndexedDB and localStorage failures now preserve stock, prices, transactions and audit together; localStorage interruption journal recovery passed.

Test harness issues corrected during validation included pushing the same returned Market transaction twice, dispatching a selling-price event after a preview had recalculated its value, allowing service workers to replace the instrumented test document, and parsing CSS `color(srgb ...)` values as 0–255 RGB. These were test harness errors; successful reruns are reflected below.

## Successful scenarios

### regression

- Stock creation through existing UI — passed.
- 1 Existing units -> packs with no quantity or financial movement — passed.
- 2 Loose units / 3 Packaging correction remains financially neutral — passed.
- 4 Bidirectional inputs and loose-unit normalization — passed.
- 5 Exact quantity -> one coherent permanent -13 event — passed.
- 6 & 7 Market total cost / latest prices / original acquisition costs — passed.
- 8 Cross-desk consistency and current-cost valuation — passed.
- 9 Retail sale deducts five base units exactly once — passed.
- 7 Historical sale cost and price remain unchanged after repricing — passed.
- 10 Stock correction does not affect cash, bank, supplier or POS — passed.
- 11 Audit append-only protections and correction retention — passed.
- 12 Full/working backups roundtrip without duplicating units or losing newer audit — passed.
- 14 Repeated restocks adopt latest prices and retain purchase amounts — passed.
- 16 Invalid inputs, batch selection, corrupted and conflicting backups — passed.
- 16 Storage failure rolls back quantity, pricing, ledger and audit together — passed.
- 16 Double submission yields exactly one committed adjustment — passed.
- Theme contrast and mobile layout, new history and form states — passed.

### extended

- Batch-specific removal preserves other expiry quantities and original costs — passed.
- Batch correction rejects unidentified or insufficient affected batch — passed.
- Open sale keeps captured price until explicit refresh — passed.
- Held items retain prices and reserve units across corrections — passed.
- Stock duplicate receipt with changed pack size keeps one product and latest prices — passed.
- Fractional pack inputs remain invalid instead of silently truncating — passed.
- Old full backup merges permanent audit; conflicts and malformed relationships rejected — passed.
- Archive/remove and recycle-bin purge preserve permanent adjustment history — passed.
- 15 Long-term stress independent quantity / price / batch / financial oracle — passed.
- 3,600-operation data survives restart and verifies against IndexedDB — passed.

### persistence

- Migration from actual v2.9.9 database preserves transactions and batch costs — passed.
- Financial PIN vault, day setup and owner review survive neutral corrections — passed.
- Encrypted full backup contains stock, pack configuration, audit and Financial Desk — passed.
- 13 Production service worker caches upgraded application and reopens offline — passed.
- LocalStorage fallback interrupted-save journal and audit rollback — passed.

### final-edges

- Historical markup snapshot prices remain stored after global defaults change — passed.
- Batch-specific correction survives unrelated sale edit and purchase replay — passed.
- Purchase edit keeps permanent adjustment record and emits correction audit — passed.
- Malformed batch setStock aborts before any irreversible history or quantity change — passed.
- Stock edit targets a selected expiry batch and retains stable IDs after rename — passed.

### ui-precision

- Stock pack-size representation and exact entered cost / new quantity divisor — passed.
- Measured text contrast >= 4.5:1 for history and correction inputs in eight theme/mode combinations — passed.
- Exact zero stock supported with neutral finances and complete -24 audit — passed.

### integration-matrix

- Bulk duplicate restock updates latest unit cost and explicit selling price — passed.
- Stock duplicate packs use a consistent transaction representation in full backups — passed.
- Supplier credit and bank payment are counted once; corrections preserve them and POS — passed.
- Quantity pricing, returns, report costs and prices retain original snapshots — passed.

## Remaining limits

Application controls preserve committed audit records; offline browser storage is not externally tamper-proof and can be deleted outside the application. Legacy adjustments without original before/after quantities cannot be reconstructed exactly; those transaction records remain intact. Business context is captured where available; the application has no authenticated operator identity. Use the existing deployment origin to retain browser data and keep full/encrypted backups. Working-stock restores retain the existing safeguards for matching current-day and completed Market context.
