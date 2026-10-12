# Roseachy v2.10.5 — Notes Recycle Bin validation

## Passed
- All embedded JavaScript blocks pass `node --check`.
- Existing Notes editor saves a new note to the original `dsb_notes_v1` key.
- Deleting a note soft-deletes it in place with a `deletedAt` timestamp rather than removing it.
- Active notes exclude deleted entries; the collapsible Notes Recycle Bin lists deleted entries and displays the count.
- Reopening the app in a fresh browser page with saved storage recovers deleted notes.
- Restore returns the original note without deleting its content or saved timestamp.
- Individual permanent deletion and Empty bin work after confirmation.
- Empty bin does not remove active notes.
- Tested mobile 360px viewport: Notes section does not cause horizontal scrolling.
- No uncaught browser JavaScript errors in tested flows.

## Compatibility and limits
- No IndexedDB schema or key changes. Existing full-backup and restore code already exports and imports the `notes` array, so deleted notes are included in future backup files.
- Browser functional tests used simulated localStorage fallback because this environment blocked browser navigation to local or file test servers. Real-device IndexedDB, Cloudflare deployment, and offline service worker update still require device testing.
- Notes permanently deleted in **earlier releases** cannot be recovered by this update unless contained in an existing backup.
