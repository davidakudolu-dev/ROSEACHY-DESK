# Roseachy v2.10.11 — Integrity and recovery repair

Repairs Full Backup restoration immediately after Save Day; makes POS, cash moves and supplier payments durable before reporting success; rolls back rejected Financial entries and credential changes; queues overlapping markup edits; rejects unsafe POS amounts and fees; and recovers unfinished fallback-storage rollback journals before later saves.

[Download the complete Cloudflare Pages ZIP](exports/Roseachy_v2_10_11_Integrity_Recovery_Repair_Cloudflare_PWA.zip) · [Deployment instructions](INTEGRITY_RECOVERY_UPGRADE_v2_10_11.md) · [Validation report](INTEGRITY_RECOVERY_TEST_REPORT_v2_10_11.md)

All 95 browser scenario groups and 10 JavaScript syntax checks passed using synthetic data. Coverage includes Sales/POS accounting, Market supplier payments and packed purchases, encrypted Financial recovery, Settings, responsive navigation, affected Midnight/Ember contrast, password/PIN on every returning Financial Desk visit, full/legacy backups, duplicate/corruption rejection, working-form recovery and actual service-worker offline reload. Physical-device installation and real power interruption remain manual checks.

This release retains all 38 original application files. Only index.html and sw.js change; three current release documents/results are added. Historical reports and previous release archives are preserved. The ZIP includes HTML, embedded CSS/JavaScript, manifest, service worker, PWA helper, icons and Cloudflare deployment configuration. Extract it at the existing Pages root; no build is required. Schema 7 and backup format 28 remain compatible.

The release is saved on roseachy-v2.10.11-integrity-repair. GitHub main, v2.9.4, original uploads and existing workspace checkouts remain unchanged. Validation and reproducible harnesses are in validation/v2.10.11; historical documents describe their own release. The app ZIP does not contain your browser's private business database; use Full Backup to transfer that data.
