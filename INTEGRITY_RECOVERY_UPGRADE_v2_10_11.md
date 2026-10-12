# Roseachy v2.10.11 — Integrity and recovery repair

Use this complete application release to replace v2.10.10 at the existing Cloudflare Pages site root. It preserves all existing features and UI structures, including Midnight/Ember contrast fixes, the existing Sales → Stock → Reports → Notes → Analytics swipe order, and password/PIN authentication every time you return to Financial Desk after leaving it.

The data schema remains 7 and Full Backup format remains 28. Existing supported backups remain compatible. The repairs improve durable saves, restoration verification, pricing-event serialization, POS validation and fallback-storage recovery. Existing records and accounting rules are retained.

## Deployment

1. Export and retain an external Full Backup from your current app.
2. Extract the entire ZIP. Deploy its contents with index.html directly at the Pages root, including manifest.json, sw.js, js/, icons/, _headers and _redirects. CSS and the main JavaScript are embedded in index.html. No build command or backend is needed.
3. Open the existing site online once to load the new service-worker cache. Reload the app and check version 2.10.11. Keep the existing origin to retain local business data; a new hostname has separate browser storage and needs backup import.
4. Check your records and retain the original backup. If moving devices, import Full Backup and wait for the verified success notification. Financial Desk uses its existing PIN/password and recovery key.

The service-worker cache is versioned 2.10.11-integrity-recovery. Historical reports in this package describe their original releases; consult INTEGRITY_RECOVERY_TEST_REPORT_v2_10_11.md and INTEGRITY_RECOVERY_RESULTS_v2_10_11.json for current validation.

All original uploads, earlier applications and v2.9.4 are preserved separately. This ZIP contains application files, not your browser's private business database; use Full Backup to transfer business data.
