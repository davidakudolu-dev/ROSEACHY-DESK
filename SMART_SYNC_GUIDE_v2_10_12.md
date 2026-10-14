# Roseachy Smart Sync & Merge — password-free update (2026-10-14)

Deploy the entire ZIP at the existing Cloudflare Pages origin (HTTPS) to preserve browser storage. The ZIP contains the PWA code, not your stored business records. Export separate Full Backups on both devices before upgrading.

## Where to find Smart Sync

- Settings → Smart Sync & Merge
- Market Desk → Smart Sync & Merge
- Smart Sync is **no longer available in the Financial Desk menu**.

## Access and files

- **No shared sync passphrase** is created or entered. Sync JSON files are readable and unencrypted. The SHA-256 integrity check detects accidental changes, but it is **not** a sender signature and cannot prevent a person from intentionally changing a file and recalculating its checksum.
- The existing **Financial Desk PIN is still required to unlock protected bank records** used during reconciliation and financial synchronization. This is the bank's existing PIN, not a separate sync passphrase. Financial Desk's own PIN and encrypted storage are unchanged.
- Transfer only between trusted business devices; anyone with a plaintext sync file can read its contents. Review the displayed incoming changes and confirm the sender and business before merging. Do not share sync files publicly.
- Old `roseachy-smart-sync-encrypted` exchange files are incompatible with this password-free format. Re-export offers, checkpoints, updates and acknowledgements using the updated app on **both** devices. Do not use Full Backup restore to merge a device's activities.

## One-time reconciliation

1. Unlock the protected bank records using the *existing* local Financial PIN when requested by the sync screen.
2. On each device export Full Backup and then **read back** the saved file to verify its recovery copy.
3. Exchange reconciliation offers by file transfer. Verify the devices represent the same business and review possible duplicate transactions, stock counts, prices, products and overlapping history.
4. Approve the **verified** starting inventory and account balances, using physical counts and independently checked finance records, not which device has longer history.
5. Exchange approved checkpoint files and acknowledgements. Both devices must confirm the checkpoint. Old movements already included in the opening position are not replayed.

## Routine exchange

Export Updates for the receiving device. On the other device choose Import & Merge, examine the proposal, resolve any conflicts, and Confirm Merge. Exchange acknowledgements and the reverse-direction updates if both devices recorded work. A file export does not prove the other device has received it.

Repeated imports use permanent device/event IDs to avoid applying the same sale or purchase twice. Conflicting amendments, shortages, inconsistent counts and prices require explicit review. Stock received at market should be marked *awaiting receipt* until physically brought to the shop.

Full Backup restore and Smart Sync import are different operations. Full Backup restores a previous state; Smart Sync merges activities. Do not clear browser storage or downgrade without a verified external recovery copy.

## Development and testing note

The previous v2.10.12 simulation report was produced for the original password-protected package and should not be represented as a full test of this changed password-free file format. This update changes the envelope and interface while preserving the reconciliation/merge engine. Test exchange between your installed PWA/APK and a second device before depending on it for live business data.
