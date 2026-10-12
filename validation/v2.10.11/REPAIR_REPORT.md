# Roseachy v2.10.11 integrity and recovery validation

Completed 12 October 2026. All 95 browser scenario groups and 10 JavaScript syntax checks passed. No page errors or fatal test failures were reported. Tests use synthetic profiles and data.

## Repairs

- Full Backups made immediately after native Save Day now restore successfully. Verification canonicalizes generated saved-day index metadata on both sides and still compares every business record.
- Native POS entries, POS edits, cash moves and supplier payments commit through the existing atomic business-save system. A failed save restores the original ledger and stock, retains input/edit identity, and does not display payment success. Form clearing and supplier payment completion occur after durable commit.
- Financial vault writes are atomic. Rejected movements cannot reappear from a failed retry queue. PIN/recovery updates and review evidence/public status preserve their previous durable state on failure. Internal bank transfers use atomic business saves.
- Per-field Settings markup changes queue and merge at execution. Independent debounce values are captured before a preceding save renders Settings. Default prices reprice correctly; custom/manual prices and historical accounting snapshots remain unchanged.
- POS inputs reject invalid, non-finite, negative, unsafe or over-limit values before recording; amounts and derived movements are bounded at one trillion.
- In local-storage fallback, an incomplete rollback journal is restored before a later save can replace it. This additional case was reproduced as a failure, then repaired and retested.

## Evidence

| Suite | Passed groups |
|---|---:|
| release | 12 |
| backup | 18 |
| navigation | 23 |
| reliability | 6 |
| intensive | 9 |
| market-settings | 8 |
| volume | 7 |
| triage | 5 |
| repair-extra | 7 |

The simulation reconciled 180 native retail entries and 120 POS entries with independent integer-cent arithmetic. Bulk Market tests applied 200 packed purchases and checked external, cash and bank supplier payments. Five hundred bundle-pricing combinations matched independent arithmetic. Volume tests retained 500 products, 90 saved days, 9,010 transactions and 1,000 notes, with 4,505 unique Financial bank rows.

Other checks cover unified Sales/Settings backup buttons, checksum/corruption rejection, supported legacy imports, duplicate prevention, recovery copies, encrypted unfinished work, notes/reports, desktop/mobile/tablet navigation, all themes and modes, affected contrast, Financial password-on-return behavior, actual service-worker offline reload and storage conflicts.

The final fallback journal change was followed by backup/reliability and all seven additional repair checks. The remaining suite results cover unchanged code paths. Original uploads, v2.9.4, previous releases, historical reports and GitHub main are preserved. All 38 original application files remain present; only index.html and sw.js are modified. Three release documentation/result files are added.

Physical-device installation, real power interruption and production business datasets remain manual checks. The ZIP is deployment-ready static content; exporting it does not deploy Cloudflare.
