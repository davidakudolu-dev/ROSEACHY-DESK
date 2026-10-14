# Roseachy v2.10.12 — Midnight & Ember Smart Sync shortcut and Sales Desk swipe repair

Updated from `Roseachy_v2_10_12_Midnight_Ember_Contrast_Fixed_Cloudflare_PWA.zip`.

## Fixed
- The **Smart Sync & Merge shortcut in Market Desk** has contrast-safe text/background in Midnight & Ember light and dark themes, including hover, touch and focus states. The shortcut is on the outer Market Desk surface, not the dark Smart Sync modal. Dark-mode explicit foreground/background pairing prevents stale palette variables or transitional frames from exposing white text on cream.
- The mobile **Sales Desk horizontal swipe** no longer clears the outgoing panel before the destination tab is activated. The outgoing/incoming panel transition is completed as one navigation step.
- Touch-end updates the final finger position before starting the settle animation, improving visual continuity.
- A tap or ordinary vertical scroll no longer triggers unnecessary tab-indicator redraws; outward swipes at the first/last tab no longer drag the screen. Vertical scrolling retains native gesture handling.
- Existing navigation, five tabs, mobile bottom/desktop top layout, theme settings, offline storage and synchronization logic are unchanged.
- Service worker shell cache version bumped to load the new release on deployment.

## Verification
- JavaScript parser checks passed on all inline scripts and the service worker.
- Headless Chromium (390 × 844 emulated touch viewport) exercised bidirectional swipes, vertical gesture cancellation, eight sequential forward/back swipes, simple touch interactions and checked that no extra/ghost panels remain. Tests use synthetic TouchEvents and a mocked browser storage surface: **not** a real Android device test.
- Headless Chromium verified the Smart Sync shortcut's text fill against its actual background in Ember light/dark; contrast exceeded 13:1 and 15:1 respectively in the tested idle states.

## Safe rollout
- Back up Roseachy data before replacing the installed PWA/APK assets; never clear app/site data to update.
- On Cloudflare, deploy the new ZIP, refresh the page and reopen the installed PWA to let the updated service worker take effect.
- For an Android Studio WebView APK, use the new `index.html` in app assets and rebuild the APK, preserving local app data.
