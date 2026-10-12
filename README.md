# Roseachy v2.10.10 — Text contrast and Financial Desk locking

Fixes hard-to-read text in Product performance, the Market Desk introduction and Financial Desk. Switching out of Financial Desk clears its authenticated session; every return requires the existing password/PIN. Unfinished entries remain encrypted and return after authentication. Theme palettes, layout and accounting behavior are preserved.

[Download the complete Cloudflare ZIP](exports/Roseachy_v2_10_10_Contrast_Financial_Lock_Cloudflare_PWA.zip) · [Upgrade and deployment](CONTRAST_SECURITY_UPGRADE_v2_10_10.md) · [Validation](CONTRAST_SECURITY_TEST_REPORT_v2_10_10.md)

59 browser scenario groups and 10 JavaScript syntax checks passed. All measured named text surfaces met a 4.5:1 contrast target in both light/dark modes of Midnight & Ember, Midnight Gold and Cobalt. Tests cover repeated/password-gated desk switching, browser Back, encrypted unfinished work, stale unlock requests, reload, Full Backup restoration, failure recovery and offline/navigation regressions. Physical-device installation remains a manual check.

Extract and deploy the full ZIP contents at the existing Cloudflare Pages root; no build is required. Includes every original file, manifest, service worker, embedded CSS/JavaScript, PWA file helper and icons. Historical reports remain intact and describe their own releases.

The release is on roseachy-v2.10.10-contrast-financial-lock. GitHub main, previous releases/exports and all original workspace files are preserved. Test evidence is in validation/v2.10.10.
