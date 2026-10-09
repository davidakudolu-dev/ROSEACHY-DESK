# Roseachy 2.9.4 — integrity fixes

This Cloudflare-ready build updates the uploaded Roseachy 2.9.3 application.

- Sales: validates whole-unit quantities and payment values; protects linked refunds, cumulative refund amounts, batch expiry, cash-out funding, transaction edits and recycle-bin restoration.
- Market: blocks purchases from saved-day views; preserves supplier/group links through edits and reversals; repairs request removal/merging, payment choices, exact purchase costs, calculator totals and canceled/update-only items.
- Financial: includes retained banked customer change, uses the complete active bank ledger when browsing history, blocks historical writes, updates review status and retains previously loaded history rows.
- Backups: verifies records independently of array order, supports localStorage fallback, validates imported transactions and prevents Working Stock restores that would break Market purchase links. Existing full and encrypted backup formats remain supported.
- Concurrent tabs: pauses stale windows and checks the saved-data revision before writing, protecting completed records from stale overwrites.
- PWA: updates the service-worker cache to 2.9.4.

## Cloudflare upload

Upload the contents of this ZIP to the existing Cloudflare Pages project. `index.html`, `_headers`, `_redirects`, `sw.js`, `manifest.json`, `js/`, and `icons/` belong at the deployment root. No build command or server backend is required.

Use the same site address to retain its browser-stored records. When the installed app offers the update, use Update now and reload. This build keeps the existing database name and encryption formats; it does not clear or reset records.

A Working Stock restore that would leave completed Market purchases inconsistent is now rejected before replacing records. Use a matching Full Backup to restore the complete linked dataset.

The supplied fixes are preventive. Existing inconsistent records from the older build are not silently rewritten.
