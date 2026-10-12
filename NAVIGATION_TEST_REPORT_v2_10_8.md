# Roseachy v2.10.8 — Navigation validation

Final validation: **29 browser scenario groups passed**, with no page-script errors, plus **10 JavaScript syntax checks passed**. Tested the production HTML directly, using fresh Chromium contexts and synthetic business fixtures. No test-only application instrumentation was shipped.

## Browser coverage

23 navigation groups cover 320/360/390/430px phones, 667px landscape, the 767/768 breakpoint, 820/1024px tablets, and 1440px desktop; scrolling and content clearance; finger tracking and a live inert neighbor; cancellation, distance thresholds, boundaries, vertical/diagonal gestures, form/table/overlay protection, mixed taps and Back, keyboard tab controls, per-section scroll positions, repeated left/right swipes, and 150 rapid tab changes.

Business checks created a product through the existing Stock UI and preserved its identity, stock, selected sale, quantity/price, POS input, held transaction, stock adjustment fields, filters, unfinished Market purchase, and unfinished Financial movement. Financial session retention and explicit Lock were checked. Repeated navigation did not change authoritative stock, inventory audit, or encrypted bank records.

All eight themes were checked in light and dark mode (16 combinations), with active/inactive label contrast at least 4.5:1. All four existing rounding choices, five font scales, and border levels 0/5/100 were checked. Selected tabs remain visible on a 320px screen. Reduced motion and animations off disable finger tracking.

6 reliability groups cover an actual cached service-worker offline reload with a persisted opening balance, emulated standalone PWA and Android WebView startup/orientation, a controlled keyboard viewport change, ordinary desktop mouse dragging, multi-touch and visibility cancellation, and touch-enabled tablet swipes with the rail at the top.

## Limits of the evidence

These are automated Chromium browser checks, not physical-device certification. The short velocity-based flick was checked with script-generated TouchEvents because automation scheduling makes precise native flick velocity unreliable. Other committed/cancelled/vertical/boundary/repeated gestures use Chromium's native touch dispatch. Keyboard geometry, standalone mode, WebView user agent, and backgrounding are emulated where stated in the result names.

Actual Android system gesture/button safe areas, onscreen keyboards, Android hardware Back/exit behavior, PWA installation/relaunch, low-memory process eviction, and budget-device frame rate require manual device testing. Browser history.back was checked for mixed navigation and overlay priority. Offline reload was checked with a real active service worker. A refresh requires a new Financial unlock and does not promise restoration of every unsaved field across process death.

The uploaded v2.10.7 reports are preserved as historical files; their older stress results are not presented as new runs of v2.10.8. This upgrade did not rerun the older month-long accounting stress suites.

## Preservation and deployment

Only index.html and the service-worker version changed among the original application's files. All original icons, manifest, PWA glue, deployment headers/redirects, and historical documents match the upload byte for byte. New navigation documentation and result JSON were added. The original ZIP and original extraction remain intact. Existing workspace checkouts and GitHub main remain untouched.

## Manual device checks

1. Install the release at the existing Cloudflare origin; check portrait/landscape, gesture/button navigation areas, and a tablet's top rail.
2. Swipe both directions while a sale or adjustment is unfinished; return and check values and selected products.
3. Open the keyboard, horizontal table, sliders, menu, and confirmation dialog; verify their own interactions take priority.
4. Mix swipes, taps, menus, and Android Back; check overlay dismissal, Home, and exit without loops.
5. Reopen offline and inspect stored records; test a low-memory/budget Android device's scrolling and animation.
