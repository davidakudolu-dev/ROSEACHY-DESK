# Roseachy v2.10.12 — Smart Sync & Merge

Protected offline reconciliation and event-based merging across Sales, Market and Financial desks. Devices agree a verified starting position, preserve old history without replay, retain permanent event identities and require explicit conflict decisions and acknowledgements. Group files use authenticated encryption; Financial PINs stay local.

[Complete Cloudflare Pages ZIP](exports/Roseachy_v2_10_12_Smart_Sync_Merge_Cloudflare_PWA.zip) · [Standalone HTML download](exports/Roseachy_v2_10_12_Smart_Sync_Preview.html) · [Android WebView integration source](exports/Roseachy_v2_10_12_Android_WebView_Integration_Source.zip)

[Usage guide](SMART_SYNC_GUIDE_v2_10_12.md) · [Migration and deduplication](SMART_SYNC_MIGRATION_v2_10_12.md) · [Test report and limitations](SMART_SYNC_TEST_REPORT_v2_10_12.md)

125 synthetic browser scenario groups and 11 JavaScript syntax checks pass. Coverage includes protected initial reconciliation, simultaneous sales/purchases, advances and receipts, repeated/multi-hop import, supplier payments, transaction reversals, encrypted Financial changes, restored installation identity, schema 7-to-8 migration, actual backup download/read-back, offline PWA, existing desks/navigation/contrast, and mocked Android file callbacks. The Kotlin source has not been compiled or tested on a physical APK; native sharing, real power interruption and physical PWA-to-APK exchange remain manual checks.

Extract the complete deployment ZIP at the Cloudflare Pages root; no build required. All 41 original deployment files remain. index.html, sw.js and js/pwa.js are updated, with the optional native file adapter and current guides/results added. Original uploads, existing checkouts and GitHub main are preserved. This release is saved on roseachy-v2.10.12-smart-sync-merge.

The standalone HTML must be downloaded and opened locally; a GitHub source page is not a hosted running preview. It embeds application assets and disables its service worker. Use the complete ZIP for deployed offline operation. Neither application download includes the private business database from your browser; export Full Backup for that data. Production reconciliation requires supervised verified stock and accounts on every participating device.
