# Smart Sync & Merge — 2026-10-14 targeted update

- Removed the Smart Sync & Merge shortcut created in the Financial Desk's options menu.
- Retained Smart Sync in Settings and Market Desk.
- Removed the shared sync passphrase field, validation and shared PBKDF2/AES-GCM file password encryption; exchange now uses a readable `roseachy-smart-sync-open` JSON envelope with a SHA-256 digest for accidental corruption detection.
- Maintained duplicate event identifiers, import review/confirmation, account reconciliation and merge checks.
- Preserved the separate Financial Desk PIN and encrypted vault. The existing PIN is required to decrypt the bank records used by the full synchronizer; it is not a sync-specific password.
- Former password-encrypted sync files are rejected with a clear instruction to re-export after both devices upgrade. They must not be passed through Full Backup restore.
- Updated service-worker cache version to prevent an older offline app shell from retaining the obsolete passphrase input.

**Security trade-off**: SHA-256 is not authentication. Plaintext exchange files may contain sensitive bank-related data. Use trusted file transfers, review source/business identity, and keep Full Backups. No automatic Internet-based synchronization is added.
