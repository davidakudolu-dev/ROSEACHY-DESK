# Roseachy v2.10.8 — Adaptive navigation and swipe

Built from the uploaded Roseachy v2.10.7 Adjustment History 7 Days Cloudflare PWA ZIP. The original upload and extracted original files are retained unchanged.

## Navigation

The existing Sales → Stock → Reports → Notes → Analytics panel sits at the bottom below 768px and beneath the original header at 768px and above. The three-dot menu, branding, and desk controls keep their original top placement. Market Desk, Financial Desk, and Settings remain in that menu, as requested in the clarification.

Touch swipes follow those five visible tabs: left advances, right returns, and neither boundary wraps. The existing live section follows the finger and its neighbor previews without cloning forms or resetting application state. Cancelled and short gestures return to the starting section. Mouse dragging does not navigate. Keyboard Left/Right/Home/End works in the tab rail.

The original slider uses the current shape and theme settings. Its rounded text mask maintains each palette's contrast while crossing labels. Font-scale and border controls remain live; a narrow rail scrolls the selected tab into view. Animation speed is respected, with no finger tracking in reduced-motion, minimal, or off modes.

Inputs, selection, buttons, sliders, charts, tables, horizontal scrollers, multi-touch, and open overlays are protected. Recognition locks direction before preventing default scrolling. Screen edges are reserved for browser/system gestures. Resize, orientation, backgrounding, and Back cancel a gesture. Safe-area spacing and bottom content clearance are included; the rail hides for a detected keyboard viewport.

## Working state and Financial Desk

Tab taps, swipes, and Back reuse the existing navigation handlers and bounded history. Section scroll positions and unfinished inputs stay in their existing DOM. No business storage schema or inventory/accounting calculations changed. The uploaded version's seven-day adjustment-history behavior remains unchanged.

Changing desks now retains the Financial Desk's unlocked in-memory session and unfinished form. Choose **Lock Financial Desk** in its own menu to clear that session and pending fields explicitly. Refresh or relaunch still requires the PIN because encryption keys are not persisted. Stored bank records keep their original encryption.

## Deploy

Extract the complete ZIP and upload its contents to the existing Cloudflare Pages project, with index.html at the deployment root. No build command or external library is required. HTML, inline CSS/JavaScript, manifest.json, sw.js, js/pwa.js, Cloudflare headers/redirects, and all icons are included.

The service-worker shell version is 2.10.8-adaptive-navigation-swipe. Its existing safe update behavior is retained. Keeping the existing Pages origin retains access to that browser origin's business records; a different origin does not automatically share those records.

See NAVIGATION_TEST_REPORT_v2_10_8.md for checks and unverified device conditions.
