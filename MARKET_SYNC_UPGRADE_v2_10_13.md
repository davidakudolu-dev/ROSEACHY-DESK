# Deploying the Market and Smart Sync repair — v2.10.13

1. Export Full Backup from every participating device and read each saved file back to verify it. Keep external copies.
2. Extract this ZIP at your existing Cloudflare Pages root. No build command is required. Retain the same HTTPS origin so the browser can continue using its existing database.
3. Update every participating device to this build. The service-worker cache version changes to 2.10.13-market-sync-review-20261014. The database stays at schema 8; existing business identities and checkpoints stay intact.
4. Re-export pending sync exchanges after all devices update. New exchange files use protocol 2; earlier files are rejected with an update/re-export message. Both devices still use their own Financial PIN. No shared passphrase is added.
5. Open Smart Sync from Settings or Market Desk. Review incoming changes, resolve genuine conflicts, confirm the merge and exchange acknowledgements. An export alone does not prove receipt or matching state.

The first upgraded start adds previously omitted saved Market sessions, recycle-bin lists, budget and prepared Low Stock work to the permanent sync event stream. If devices have conflicting budgets or drafts, review those differences explicitly. Causal sequencing prevents later received edits from being mistaken for independent concurrent changes; real concurrent disagreements still require a decision.

A funding shortage now appears alongside stock discrepancies. Both valid purchases remain recorded. Verify and correct actual funding; do not add an invented balancing transaction. Supplier overpayments are blocked without a partial merge and need review of the source payment records.

Pending imported files are encrypted locally with the Financial vault key and can resume after PIN authorization. The transferred JSON file itself remains readable, following the uploaded password-free design. Keep that file private. Use Full Backup for recovery and Sync for merging; restoring another device's backup replaces state.

Read MARKET_SYNC_REVIEW_v2_10_13.md and MARKET_SYNC_RESULTS_v2_10_13.json for exact test evidence and limits. Older reports retained in the archive are historical documents, not additional tests of this release.
