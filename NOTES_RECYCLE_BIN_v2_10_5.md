# Roseachy v2.10.5 — Notes Recycle Bin

## Scope
- Notes tab gains a collapsible Recycle Bin with count.
- Delete marks each note `deletedAt` (ISO timestamp), rather than erasing it.
- Restore removes the deletion marker and preserves original content and saved date.
- Delete permanently and Empty recycle bin require confirmation.
- Existing notes storage key `dsb_notes_v1` and DB version remain unchanged; notes and their deletion markers are included in existing Full Backups and checksum verification.
- Backup restoration preserves deleted notes from new backups and accepts older backups without deletion markers.
- Uses the existing atomic IndexedDB writing mechanism. No changes to stock, sales, finance, Market Desk, charts, themes, or mobile purchase alignment.

## Data safety
Deleted notes cannot be recovered after permanent deletion except from a prior external Full Backup.
Export a verified Full Backup before updating your live app.
