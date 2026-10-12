# Roseachy v2.10.4 — mobile active purchase layout

## Scope
- Presentation-only CSS within `#txEntryCard #retailEntry`, for screens up to 700px.
- Keep the Sales Desk input card in two even columns; Qty / loose units and Total remain side-by-side.
- Top-align field containers, with consistent label and input rows, so the Total field's extra refresh button no longer pushes the Qty field down.
- Keep compact 10px row and column gaps; reduce the refresh control's height.
- No HTML field IDs, JavaScript business logic, persistence, backups, transactions, or themes changed.
- Increment service-worker cache version so installed PWAs get the refreshed CSS.
