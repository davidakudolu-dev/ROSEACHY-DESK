# Roseachy v2.10.10 — Contrast and Financial Desk locking

Product performance now uses readable foregrounds on its actual panel backgrounds, including product names, figures, rankings, badges, empty states, explanatory text, slow-mover/price-change details and product detail panels. The Market Desk introduction and Financial Desk title, Business Bank subtitle, Recent Activity, activity descriptions/dates/amounts, View all, Remove Money and options button use their actual page/input surfaces. Theme colors, layouts, controls and accounting formulas are retained. Midnight & Ember, Midnight Gold and Cobalt (the legacy Midnight mapping) were checked in light and dark modes. Dark-mode page text no longer inherits an earlier light-mode token.

Financial Desk locks immediately when you switch to Sales, Market or Settings, including navigation by browser Back. Returning shows the existing password/PIN gate. Financial Desk clears its decrypted session and visible private inputs; unfinished entries are captured and saved encrypted before they can be restored by a subsequent authenticated visit. Automatic locking does not record a transaction or change balances. Selecting Financial Desk while already there keeps the current session. Explicit Lock retains its previous behavior.

If a Financial Desk action is still running, navigation is briefly retained on that desk with a clear message; switch again after the save/authentication completes. This protects in-flight operations. A pending password request from an earlier visit cannot unlock a later visit. Standard/encrypted Financial storage and Full Backup remain compatible with v2.10.9; there is no additional database schema migration in this release.

## Deploy

Keep an external Full Backup before upgrading. Extract the complete ZIP and deploy its contents at the existing Cloudflare Pages site root, with index.html at the root. No build is needed. Embedded CSS/JavaScript, js/pwa.js, manifest.json, sw.js, every icon and Cloudflare headers/redirects are included. Reload the installed app to receive the updated service worker.

All 35 v2.10.9 project files were retained. Only index.html and sw.js changed, plus three new release-documentation files. Earlier exports, branches, original uploads/extractions and existing checkouts remain preserved. The new release is published separately; GitHub main was not changed. Historical reports in the ZIP describe their own versions; this document supersedes earlier notes about retaining an unlocked Financial session across desk switches.
