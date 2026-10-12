# Roseachy v2.10.2 — Stock Adjustment Layout Tests

The upgraded stock adjustment form was tested in headless Chromium at 320, 360, 390, 430, 768 and 1100 CSS-pixel widths.

Checks passed at all six widths: two equal columns, no document-level horizontal overflow, product search and adjustment mode controls aligned, pricing fields side-by-side with equal widths, the packs/loose fields revealed in Set packs mode, the Update pricing controls revealed in pricing mode, and hidden inputs remained hidden when not relevant. No application JavaScript exceptions were observed in these layout harness runs.

Verified that all existing inline JavaScript blocks, the external PWA helper, manifest, Cloudflare headers/redirects, and every icon are byte-for-byte identical to v2.10.1. Only adjustment markup, a scoped CSS layout, shortened product-search placeholder, service-worker cache release string, and this release documentation changed. All current sales/stock/finance/business logic and records were preserved.

**Limits:** Layout checks used a synthetic document in a browser sandbox and did not re-execute the complete business-operation regression suite. No real customer data was processed.
