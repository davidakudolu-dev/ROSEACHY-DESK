# Roseachy v2.10.7 — Adjustment History 7-day retention

- Renamed “Permanent stock adjustments” to **Adjustment History**.
- Rolling seven-day retention: each adjustment history detail expires after 168 hours; no calendar-week mass deletion.
- Expired audit detail entries are physically removed from IndexedDB when the app opens, returns to the foreground, or stays open for an hourly retention check. A PWA cannot run cleanup while it is fully closed.
- Does NOT erase or change live stock totals, recorded sales, saved-day adjustment transactions, Product History, Finance Desk, Notes, or Market Desk.
- Previously exported backups remain unchanged; imported historical audit entries older than seven days are ignored so they cannot reappear.
- Legacy correction backfill includes only entries within the seven-day window, avoiding old history being regenerated after deletion.
- Stock correction transactions remain immutable even after their audit detail expires.
- New full and stock working-state exports include only unexpired adjustment detail entries.
- Recent adjustment records remain append-only; deleting or editing unexpired records is still prohibited.

**Caution:** Audit detail older than seven days will no longer be accessible inside Adjustment History, including after updating from earlier versions. Export a backup before updating if old detail matters. Backup files made before the upgrade are not modified; the transaction ledger continues to retain stock corrections.
