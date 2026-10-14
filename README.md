# Roseachy v2.10.13 — Market and Smart Sync integrity repair

This release reviews the uploaded Ember / Smart Sync / Smooth Swipe build and repairs omitted Market records, later edits applied out of order, split merge commits, unflagged shared-advance deficits, PIN-session reentry and plaintext pending imports in local storage. Prepared Low Stock purchase drafts and independently prepared drafts survive exchange and restart. Uploaded Ember styling and smooth-swipe behavior are retained.

[Download complete Cloudflare Pages ZIP](exports/Roseachy_v2_10_13_Market_Sync_Integrity_Cloudflare_PWA.zip) · [Review and test report](MARKET_SYNC_REVIEW_v2_10_13.md) · [Upgrade guide](MARKET_SYNC_UPGRADE_v2_10_13.md)

113 automated browser scenario groups and 11 JavaScript syntax checks pass. A 120-product multi-device run reconciles 720 units purchased and 120 sold to 30,600 units, 91 transactions, retail cash 99,320 and supplier debt 3,220 after repeated exchanges. Additional coverage includes a 500-product Market fixture, 200 prepared items, supplier payments, duplicate/multi-hop import, encrypted pending-file recovery, original database/checkpoint upgrade, atomic failures, fallback-storage retry, backups, offline reload and navigation.

Update all participating devices before exchanging files: the repaired engine uses sync protocol 2 and rejects protocol-1 files with a re-export instruction. Existing Full Backups and schema-8 databases remain supported. Exchange JSON is still intentionally plaintext with a checksum; Financial PINs and local vault encryption remain separate. Actual APK compilation, physical sharing and hardware power cuts were not tested; these are browser simulations with synthetic data.

Extract the complete ZIP at the existing Cloudflare Pages root; no build required. All 51 uploaded files are retained, with index.html/sw.js repaired and three current release documents/results added. Historical documents describe their own releases. This release is on roseachy-v2.10.13-market-sync-review; GitHub main, original uploads and existing checkouts are preserved. The ZIP does not contain your private browser business database.
