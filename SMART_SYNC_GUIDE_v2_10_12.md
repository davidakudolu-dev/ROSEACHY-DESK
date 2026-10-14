# Roseachy v2.10.12 — Smart Sync & Merge guide

Extract this complete ZIP to the Cloudflare Pages site root. No build command is needed. Deploy on the existing HTTPS origin to retain browser storage. Keep external Full Backups before upgrading. The ZIP contains the application, not your browser's private business database.

## Protected first-time reconciliation

1. Set up Financial Desk on each device. Each device keeps its own Financial PIN and recovery key. Open Smart Sync from Settings, Market Desk or Financial Desk and authorize with that device's Financial PIN.
2. Choose a separate shared sync passphrase of at least 12 characters. Share it securely with the intended operators. It protects offline JSON files with authenticated encryption; it is not a recovery key for a forgotten Financial PIN.
3. On BOTH devices, export a new recovery Full Backup to Files/Downloads, preserve it outside the app, then select that saved file in “Read back saved Full Backup”. An export alone is not verified recovery. Never exchange a Full Backup as an ordinary merge file.
4. Confirm the same business and responsible person. Exchange the protected reconciliation offer by Files/Share, Quick Share, Bluetooth or another trusted transport. Import it through Smart Sync. Review similar products, pack sizes, pricing, overlapping transactions and historical conflicts explicitly. Identical-looking independent sales must remain separate unless an authorized operator verifies that they represent the same transaction.
5. Approve shared stock and accounts using a physical count or verified reconstruction. The balances must refer to the frozen recovery snapshots. Pause trading for a count, or document and separate movements occurring after those snapshots. Never add, average, or select balances based on which phone has more history. Review retail cash, POS cash, POS electronic, bank, customer debt, supplier liabilities and outstanding market advances individually, with source and discrepancy explanation.
6. Create the shared checkpoint, export it, and have the other device review and confirm it. Both devices must then exchange acknowledgements. Historical records are retained for audit and already accounted in the opening position; their old movements are not replayed.

## Routine exchange

Export Updates for the receiving device. The receiver selects Import & Merge, enters the shared passphrase, reviews the preview and any conflicts, then selects Confirm Merge. Send its acknowledgement back; exchange the reverse updates and acknowledgement when both devices traded. A download, file selection or one-sided import does not prove that all devices are current. Check confirmed status on every participating device.

Duplicate files, renamed files, repeated imports and multi-hop transfers retain event identifiers and apply accepted effects once. Device time does not choose the winning business record. Price, pack, absolute-count and incompatible amendment conflicts need an explicit decision. Shortages retain the transactions and the raw stock discrepancy; available stock is capped at zero until reconciled. Later movements continue after an approved stock correction.

Close & Lock, leaving the desk, backgrounding or session expiry requires fresh authorization. Keep the sync passphrase private; anyone holding it can decrypt shared financial data and construct authenticated files. Confirm recipients and business membership before sharing. Routine sync requires no server or Internet.

## Market money and receipt

Record a cash advance when cash leaves the shop for purchasing. Choose that advance as funding for the next Market cash purchase: the purchase is still recorded, but retail cash is not deducted twice. Record the unspent return against the same advance. Review advances that existed before reconciliation as part of the approved opening position.

Clear “Purchased stock is physically received immediately” when goods have not arrived. They remain unavailable until Record received. Repeated receipt imports apply once. An advance is funding, not profit; receipt is physical stock, not a second expense.

## Adding or recovering a device

A restored Full Backup preserves business/checkpoint/events but does not clone the installation DeviceID. A new or recovered installation must complete explicit enrollment with a read-back backup and shared checkpoint. Existing members review the membership exchange before accepting its ordinary updates. Restoring an older backup can create missing-event gaps; do not regard a matching balance or successful export as complete recovery. Recover missing events from a peer or external backup and compare acknowledgements.

Sync files are separate from Full Backup restore. Keep original backups, especially before conflict decisions. Do not clear browser storage, change the origin or downgrade schema 8 without a tested recovery copy. Sync cannot reconstruct records that no surviving device or backup contains.
