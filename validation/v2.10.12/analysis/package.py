from pathlib import Path
import json,hashlib,zipfile
r=Path('/workspace/roseachy-v2.10.12-smart-sync');app=r/'app'
names=['backup','release','navigation','reliability','intensive','market-settings','volume','triage','repair-extra','smart-sync','platform','preview'];suites={}
for n in names:
 d=json.loads((r/'tests'/(n+'-results.json')).read_text());assert d.get('results') and all(x['passed'] for x in d['results']) and not d.get('errors') and not d.get('fatal'),n;suites[n]=d
syntax=json.loads((r/'reports/SYNTAX_RESULTS.json').read_text());assert len(syntax)==11 and all(x['passed'] for x in syntax)
summary={'release':'2.10.12 Smart Sync & Merge','date':'2026-10-14','browserScenarioGroupsPassed':sum(len(d['results']) for d in suites.values()),'failed':0,'javascriptSyntaxChecksPassed':len(syntax),'suites':suites,'limitations':['Kotlin reference not compiled; no existing Android Studio/Gradle project, signing configuration or physical APK was uploaded.','Android file bridge was tested with mocked JavaScript callbacks, not SAF on a physical device.','Real OS power interruption, physical Bluetooth/Quick Share and actual PWA-to-APK exchange were not run.','Portable HTML was rendered in Chromium on a local test origin; opening it through each browser file manager was not tested.','Production stock/account reconciliation requires responsible supervised verification; synthetic tests cannot certify historical business balances.']}
(app/'SMART_SYNC_RESULTS_v2_10_12.json').write_text(json.dumps(summary,indent=2))
report='''# Smart Sync & Merge — v2.10.12 validation

Verified on 14 October 2026 using synthetic isolated browser profiles, Chromium and Playwright. **125 browser scenario groups and 11 JavaScript syntax checks passed**, with no reported page errors. The final backup suite was rerun after restarting a stalled test server. The engine's earlier one failure was an assertion expecting a wrong-business error before the newer enrollment guard; the assertion now checks the precise enrollment rejection and preserves the unchanged-data check. Platform fixtures wait for completed hydration before comparing migrated records.

The complete results and individual scenario evidence are in SMART_SYNC_RESULTS_v2_10_12.json. Reproducible harnesses are published under validation/v2.10.12 on the release branch. Tests used no real customer database.

## Required simulations and evidence

| Requested simulation | Verification |
|---|---|
| 1 Unequal histories | 180 and 60 saved days unite as 180 without replay |
| 2 Market/restock while sales continue | 50 + 30 - 15 = 65; effects applied once |
| 3 Independent simultaneous sales | 50 - 10 - 8 = 32; both transactions retained |
| 4 Restock, sales, damage | 40 + 24 - 12 - 3 = 49 |
| 5 Duplicate import | Renamed/repeated/restarted purchase import remains 74 |
| 6 Repeated exchange | Repeated two-way updates and acknowledgements retain one effect |
| 7 Price conflicts | 700 versus 650 needs approval; prior sale remains 20 |
| 8 Financial reconciliation | Advance 50000, sales 20000, purchase 35000, return 15000 leaves retail cash 85000 |
| 9 Physical counts | Concurrent absolute count conflicts; verified correction permits later sales |
| 10 Thirty-day offline backlog | 120 transactions plus skewed timestamps converge by sequence, not clock |
| 11 Interrupted import | Injected durable event-write failure rolls back all domains; retry once. Real power cut unrun |
| 12 Wrong business | Wrong-business, corrupt, future-format and normal-backup sync files rejected without modification |
| 13 Independent products | Same-name different pack definitions need explicit separate/matched decision |
| 14 Legacy records lacking IDs | Uncertain duplicates require supervised review |
| 15 Sales after backup snapshot | Captured opening positions plus later 3 and 2 sales yield 45 |
| 16 Concurrent insufficient stock | Both sales retained, raw deficit -10, available zero, discrepancy raised |
| 17 Supplier partial payments | Credit 100, paid 30 then 20 and 10 leaves payable 40; cash deducted once |
| 18 Sale + Cash Out | Goods 1100, electronic 1500, cash out 400 retained once |
| 19 PWA/APK exchange | Browser engine and mocked bridge contract verified. Actual APK compilation, SAF and physical exchange NOT RUN |
| 20 Full Backup after sync | Restores checkpoint/events while retaining fresh installation identity and requiring enrollment |
| 21 Legacy migration | Populated schema 7 upgrades to 8 with unchanged stock, notes and transactions |
| 22 Identical-looking independent sales | Two distinct sale IDs retained; 50 - 3 - 3 = 44 |
| 23 Reversal | Native sale deletion retains permanent tombstone and restores stock once; repeated import cannot resurrect it |
| 24 Multi-hop | Three distinct enrolled devices, A2/B3/C4 sales converge to 41 with three transactions |
| 25 Reconciliation recovery | Durable pending proposal survives reload without false full-sync status |

Additional coverage includes purchased-but-unreceived stock (50 then 74 on one receipt), encrypted Financial private movement +25 (bank 50025), wrong PIN rejection, actual browser recovery download/read-back, authorization on reopen, UTF-8 native bridge callbacks with cancellation/failure rejection, and standalone embedded HTML rendering. The prior 95 groups cover Sales/POS, Market, Financial, Settings, backups, responsive navigation, contrast, load, fallback persistence and actual service-worker offline reload.

## Limits and deployment

Android source is an integration reference for the existing WebView project, not a compiled APK. No Gradle project or physical device was supplied; physical sharing, native document permissions, process killing and hardware power loss remain manual checks. Browser atomic-failure/reload simulations are useful evidence but are not a guarantee of recovery from every physical failure.

Production reconciliation must verify real stock, bank, retail/POS cash, receivables, liabilities, market advances and pending receipts. Keep read-back external Full Backups on every device. Group passphrase holders can read shared business financial data; device PIN credentials stay local. Lost records absent from every surviving device/backup cannot be reconstructed.

The Cloudflare ZIP includes every original deployment file plus current sync helper and guides/results. Extract at the Pages root with no build. The application archive does not contain business data from your own browser. Portable HTML embeds its assets and disables its service worker; use the complete ZIP for the deployed offline PWA.
'''
assert summary['browserScenarioGroupsPassed']==125
(app/'SMART_SYNC_TEST_REPORT_v2_10_12.md').write_text(report)
(r/'reports/RESULTS.json').write_text(json.dumps(summary,indent=2));(r/'reports/TEST_REPORT.md').write_text(report)
originals={p.relative_to(r/'original').as_posix():p for p in (r/'original').rglob('*') if p.is_file()}
for name in originals:assert (app/name).is_file(),name
changed=[n for n,p in originals.items() if p.read_bytes()!=(app/n).read_bytes()];assert set(changed)=={'index.html','sw.js','js/pwa.js'},changed
for icon in json.loads((app/'manifest.json').read_text())['icons']:assert (app/icon['src'].lstrip('/')).is_file()
for n in ['index.html','manifest.json','sw.js','js/pwa.js','js/android-sync-files.js','_headers','_redirects']:assert (app/n).is_file()
def archive(path,files):
 assert not path.exists(),path
 with zipfile.ZipFile(path,'x',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for name,p in sorted(files.items()):z.write(p,name)
 with zipfile.ZipFile(path) as z:
  assert z.testzip() is None
  assert set(z.namelist())==set(files)
  for name,p in files.items():assert z.read(name)==p.read_bytes()
 return {'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'entries':len(files)}
files={p.relative_to(app).as_posix():p for p in app.rglob('*') if p.is_file()}
out=[archive(Path('/workspace/Roseachy_v2_10_12_Smart_Sync_Merge_Cloudflare_PWA.zip'),files)]
android={'app/src/main/assets/'+n:p for n,p in files.items()}
for p in (r/'android-source').rglob('*'):
 if p.is_file():android['integration/'+p.relative_to(r/'android-source').as_posix()]=p
out.append(archive(Path('/workspace/Roseachy_v2_10_12_Android_WebView_Integration_Source.zip'),android))
p=Path('/workspace/Roseachy_v2_10_12_Smart_Sync_Preview.html');out.append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(r/'reports/EXPORTS.json').write_text(json.dumps({'exports':out,'allOriginalFilesRetained':len(originals),'modifiedOriginalFiles':changed},indent=2))
(r/'EXPORT_SHA256.txt').write_text(''.join(x['sha256']+'  '+x['file']+'\n' for x in out))
print((r/'reports/EXPORTS.json').read_text())
