# Roseachy v2.10.8

Adaptive bottom navigation below 768px and top navigation on larger screens, retaining the original header and menu. Touch swipes follow Sales → Stock → Reports → Notes → Analytics. Desk switching stays in the top menu.

Built from the uploaded v2.10.7 Cloudflare PWA application. Unfinished forms, held transactions, selected products, themes, and bounded Back history are preserved. Financial Desk keeps its session during desk navigation and offers an explicit Lock control.

[Download the complete Cloudflare ZIP](exports/Roseachy_v2_10_8_Adaptive_Navigation_Swipe_Cloudflare_PWA.zip) · [Upgrade and deployment notes](NAVIGATION_UPGRADE_v2_10_8.md) · [Validation and device limits](NAVIGATION_TEST_REPORT_v2_10_8.md)

Extract the ZIP and upload its contents to the existing Cloudflare Pages project, with index.html at the root. No build is needed. Manifest, service worker, PWA glue, headers/redirects, and every original icon are included.

29 browser scenario groups and 10 JavaScript syntax checks passed. Offline service-worker reload was verified. Physical Android/PWA installation, hardware Back, keyboard/safe-area behavior, and low-memory device performance remain manual checks. Automated evidence and screenshots are in validation/v2.10.8. Historical earlier-version test documents remain preserved.

This release is on roseachy-v2.10.8-adaptive-navigation. GitHub main, earlier branches/exports, the uploaded ZIP, original extraction, and existing workspace checkout files were preserved.
