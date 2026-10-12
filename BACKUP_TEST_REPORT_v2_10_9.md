# Roseachy v2.10.9 validation

60 automated Chromium scenario groups and 10 JavaScript syntax checks passed. Tests used fresh isolated browser contexts and synthetic business data. No production data or Financial PIN/key is shipped in this package.

- 18 core backup groups: real Stock/Sales/POS/Market handlers; both buttons export identical complete business payloads; checksum verification; full-file import; encrypted unfinished Financial fields; repeated imports; live sale/POS/stock/notes; held purchase identity; unfinished Market editor; corrupt/future/duplicate/incomplete record rejection; malformed JSON; cancelled/failed/concurrent downloads; injected IndexedDB write and post-restore verification failures; supported legacy backup and file checker.
- 13 extended groups: Finance day-review without vault; signed actual bank movement/live work during history; POS edit without duplication; recycle bins; encrypted full export and password import; wrong-password preservation; pre-import undo; persistent unverifiable-recovery dialog; POS save guard; localStorage fallback; actual service-worker offline reload/export/import; actual browser download without file helper; schema 6→7 in-place migration.
- 23 existing navigation groups: responsive layouts, swipes, guards, unfinished sale/hold/POS/Market/Financial work, themes/fonts/borders, reduced motion, bounded Back and reload.
- 6 reliability groups: offline navigation/data, emulated standalone/WebView startup, keyboard viewport, mouse/multitouch/background cancellation and tablet gestures.

Record sets and accounting outputs were compared before/after restore. Imports replace saved stock and transactions rather than applying transactions again. Recovery injections verify that failed restore reports recovered data, or explicitly blocks editing when verification fails. All runtime scripts parsed without error; final browser suites reported no JavaScript page errors.

The package preserves all 32 original files. Runtime changes are confined to index.html, js/pwa.js and sw.js. Existing UI structure and accounting formulas remain; added backup state stores and helpers supply capture, validation, restore and notifications. The deleted-key parsed JSON cache was repaired to prevent removed holds from reappearing.

Physical Android/iOS file pickers, installed-PWA relaunch, hardware Back/keyboard/safe areas, power interruption and budget-device performance remain manual checks. Service-worker offline mode and actual downloads were exercised in Chromium; Cloudflare production deployment was not performed. Historical reports included in the original application describe their own versions. Full machine-readable evidence is in BACKUP_RESULTS_v2_10_9.json.
