# Roseachy v2.10.1 — Offline Product Performance

Built upon the supplied v2.10.0 Inventory, Packs, Pricing & Audit release. The underlying financial, stock, inventory audit, Market Desk and transaction/backup formats have not been rewritten.

## What changed

The existing **Analytics → Product performance** card now has three collapsible, theme-aware panels:

1. **Top Selling Products**: up to ten products by *net individual units per selected calendar day*. Horizontal bars show relative speed. Quantity, units/day, division, and relevant current-stock restocking warnings are shown. It does not rank by revenue.
2. **Rising Products**: up to seven reliable increases compared with the preceding same-length period. Plain percentage and previous/current unit bars, with small daily SVG sparklines when there is enough data.
3. **Declining Products**: same comparison in the other direction. Products with a recorded stockout or insufficient stock-availability evidence are deliberately not labelled as declining.

Historical Top profit, Top volume, slow movers, purchase cost changes and margin changes remain accessible within **Top Selling Products → Other product figures**. No new dashboard or analytics database was created.

Filters: Today, Last 7 Days, Last 30 Days, This Month, retained Last Month and Custom Range. Today compares only transactions with timestamps up to the current time of day on both today and yesterday. Transactions without reliable timestamps do not support same-time trend labels.

## Calculation rules

- Reads existing saved days (including archived days) and the current working day, with the live day taking precedence to avoid double counting.
- Includes valid product sale types; excludes POS transactions, cancelled/reversed/voided entries; offsets unit sales by recorded customer refunds.
- Uses `qty` as the **total individual units recorded** for sales and refunds. Where a pack is sold, `qty` has already incorporated packs × units-per-pack + loose units; it is never multiplied twice.
- Uses net unit count, not amount or revenue. Percent change is unavailable if the previous period is zero or inadequately supported.
- A comparison requires sufficient recorded days in both periods, positive sales in the previous period, two earlier selling days for multi-day filters, and a material change (at least two units and 15%).
- Decline identification additionally requires available current inventory metadata, enough date-specific inventory snapshots, and no recorded opening/closing stockout in the current period. Gaps display **Insufficient Data** rather than fabricating a change.
- Restocking uses currently recorded stock and its configured Medium Stock level; a product with fewer than three days of stock coverage may also be marked **Restock soon**.
- All charts are lightweight inline CSS/SVG. There is no external analytics service, font library or chart package.

## Deployment / compatibility

The ZIP is suitable for upload to the Cloudflare Pages **direct upload** interface: `index.html`, `sw.js`, `manifest.json`, `_headers`, `_redirects`, `/js` and `/icons` are at the ZIP root. The service-worker cache name was changed for release v2.10.1. Existing backups, reports, saved records and IndexedDB schema remain compatible. This upgrade does not migrate or erase business data.

`Roseachy_v2_10_1_Analytics_Preview.html` is also available separately as a single-file browser preview, with optional PWA helpers inlined and web app icons/manifest omitted. For production offline installation, use the ZIP on HTTPS hosting.

## Tests executed in an isolated browser calculation harness

- Two viewport widths (390px and 1100px): correct bar rankings, ascending/declining classifications, no page-width overflow, no application JavaScript exceptions in the analytic test runs.
- 14 saved days: product Malta rising from 35 → 56 net units (+60%), Rice declining from 70 → 14 (−80%), an out-of-stock product not called declining, and a newly introduced product not called rising.
- Void sales and POS transactions with large quantities excluded from product ranking.
- Today: pack/loose 2 × 12 + 4 − refund 4 = **24 net individual units**, not 336; +700% vs comparable earlier transactions yesterday. Late-yesterday transactions excluded from same-clock comparison; missing timestamp causes **Insufficient Data**.
- An archived saved day counted as recorded history; revenue ranking does not replace quantity ranking.
- 7,200 product sale transactions across 60 saved days and 120 products: ten chart entries; calculation and full Analytics render measured at approximately 22ms in this browser test, not a guarantee for all phones.
- Theme-aware layout inherits existing Roseachy surface/text/accent tokens. JavaScript syntax verified with Node.

These are calculation, rendering and integration checks in a controlled browser harness, **not** a claim that every production workflow, device, and legacy data set has undergone a full end-to-end audit. Test data was synthetic and not bundled into the application.
