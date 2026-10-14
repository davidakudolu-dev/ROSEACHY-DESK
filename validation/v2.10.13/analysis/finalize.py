from pathlib import Path
from html.parser import HTMLParser
import json,hashlib,subprocess,zipfile
r=Path('/workspace/roseachy-v2.10.12-ember-review');app=r/'app'
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.active=False;self.data='';self.scripts=[]
 def handle_starttag(self,t,a):
  if t=='script':self.active=not dict(a).get('src');self.data=''
 def handle_data(self,d):
  if self.active:self.data+=d
 def handle_endtag(self,t):
  if t=='script' and self.active:self.scripts.append(self.data);self.active=False
p=Parser();p.feed((app/'index.html').read_text());syntax=[]
for i,data in enumerate(p.scripts):
 f=r/'analysis'/('syntax-'+str(i)+'.js');f.write_text(data);q=subprocess.run(['node','--check',str(f)],capture_output=True,text=True);assert q.returncode==0,q.stderr;syntax.append({'script':'inline '+str(i),'passed':True})
for f in [app/'sw.js',app/'js/pwa.js',app/'js/android-sync-files.js']:
 q=subprocess.run(['node','--check',str(f)],capture_output=True,text=True);assert q.returncode==0,q.stderr;syntax.append({'script':str(f.relative_to(app)),'passed':True})
(r/'reports/SYNTAX_RESULTS.json').write_text(json.dumps(syntax,indent=2))
names=['smart-sync','deep-review','upgrade-private','additional','market-sync-load','market-settings','backup','repair-extra','navigation','reliability','intensive'];suites={}
for n in names:
 d=json.loads((r/'tests'/(n+'-results.json')).read_text());assert d.get('results') and all(x['passed'] for x in d['results']) and not d.get('errors') and not d.get('fatal'),n;suites[n]=d
summary={'release':'2.10.13 Market and Smart Sync integrity review','reviewDate':'2026-10-14','sourceUpload':'Roseachy_v2_10_12_Ember_Smart_Sync_and_Smooth_Swipe_Cloudflare_PWA.zip','sourceSHA256':'4cd570dbefa6f0c0507627f3cd99e364351b6f62604cd759e6a215c0183063f4','scenarioGroupsPassed':sum(len(d['results']) for d in suites.values()),'failed':0,'javascriptSyntaxChecksPassed':len(syntax),'syncProtocol':2,'databaseSchema':8,'applicationSHA256':hashlib.sha256((app/'index.html').read_bytes()).hexdigest(),'suites':suites,'limitations':['Synthetic data in Chromium; no user production database was supplied.','Actual Android APK compilation and physical WebView/device sharing were not tested.','Interrupted IndexedDB and fallback writes were injected; real device power loss was not tested.','Plaintext sync files remain readable and use a checksum, not sender authentication.','Concurrent supplier overpayment is rejected without partial writes; operators must review the original payments. Funding deficits preserve purchases and remain flagged until corrected.']}
assert summary['scenarioGroupsPassed']==113 and len(syntax)==11,summary['scenarioGroupsPassed']
report='''# Roseachy v2.10.13 — Market Desk and Smart Sync review

Reviewed the exact uploaded Ember / Smart Sync / Smooth Swipe v2.10.12 build on 14 October 2026. Its original ZIP and extracted files remain unchanged. Historical test documents inside that upload describe their own releases; this report describes the current review.

**113 automated browser scenario groups and 11 JavaScript syntax checks passed.** Synthetic business data ran in isolated Chromium profiles. The original upload passed the adapted 26 baseline sync groups, but six of eight new adversarial checks failed. A further test reproduced omitted Low Stock purchase work. Targeted repairs were verified with regression, migration, private-data, fallback-storage and load checks. The eight areas repaired are below.

## Findings and fixes

| Area | Confirmed behavior | Repair and verification |
|---|---|---|
| Market recycle bin | Deleted Active Lists and their purchase drafts were absent on another device | Synchronize deleted list records; test delete, exchange, restore and reverse exchange |
| Market sessions and budget | Archived Market sessions and budget changes were not transferred | Include those records in reconciliation and event capture; upgrade existing enrolled devices without resetting their checkpoint |
| Automatic Low Stock purchase work | Entire automatic lists were skipped, including saved operator purchase drafts | Transfer prepared items while keeping generated alerts local; preserve independent prepared drafts when list normalization encounters the same product |
| Cross-device edit order | A later edit on a low-sequence device could be applied before the high-sequence event it had already received | Capture observed device dependencies and order events causally; preserve existing event IDs/content; reject missing/cyclic dependencies |
| Atomic merge receipt | Business/event writes and peer/import receipt metadata used separate durable commits | Store receipt metadata with the same transaction as incoming events and business data; verify the actual IndexedDB transaction |
| Shared market advance | Two offline devices could overspend the same advance without a merge discrepancy | Keep both real purchases, show the funding deficit in preview and status, and retain it after merge; do not invent cash or silently discard payments |
| PIN expiry | An open Sync screen could hide both its content and its PIN form | Show the existing Financial PIN form when the session locks; reauthorization works without leaving the screen |
| Pending bank data | The plaintext imported envelope could remain plaintext in the app's pending-import storage | Seal pending files with the local Financial vault key, resume after reauthorization/restart, and migrate older pending files on successful authorization |

Prepared work omitted by older sync capture is promoted to ordinary events during the first upgraded startup. The migration's marker, shadows and events share one transaction. Existing checkpoint, BusinessID, installation identity and sequence history remain. This cannot recover data already lost from all devices and backups.

## Simulation evidence

- 120 products: 30 supplier-purchase lines add 720 units; 60 independent sales remove 120 units. Repeated bidirectional exchange gives **30,600 total units**, **91 transactions**, **₦99,320 retail cash** and **₦3,220 supplier debt** on both devices.
- 500 products and 200 prepared Market items across two lists: applying one list leaves the other intact; packed quantities, bank/cash/external supplier payments, liabilities and Full Backup restoration reconcile. A separate 500-case quantity-pricing arithmetic check passes.
- Concurrent shared advance: ₦100 issued, then two real purchases of ₦80. Both purchases remain; the **₦60 funding shortage** is flagged. An ordinary purchase exceeding the remaining advance is rejected before partial stock/history/cash changes.
- Duplicate/renamed/restarted imports, filtered recipient exports, three-device hops, 180-versus-60 historical days, 120-sale backlog, stock shortages, price/count conflicts, supplier partial payments, cash-out sales, reversals and post-sync Full Backup all pass.
- IndexedDB abort and fallback-storage write failure preserve prior data; retry and reload apply the purchase once. Incoming event writes and receipt metadata are verified in the same IndexedDB transaction.
- Existing enrolled installations migrate omitted Market sessions, deleted lists and budget into sync without resetting stock or their checkpoint. Two separate prepared Low Stock drafts for the same product survive exchange and restart.
- A plaintext file containing a bank movement is sealed in local pending storage, then resumed after restart; the verified bank balance includes the movement once.
- Full Backup, Financial rollback, offline service-worker reload, Sales/POS load, uploaded navigation/swipe behavior and existing settings checks pass.

## Compatibility and operating limits

**Update every participating device to v2.10.13 before exchanging new files.** Sync protocol 2 prevents older merge engines from accepting files whose causal and Market-record semantics they do not understand. Protocol-1 exchange files are rejected with a re-export instruction. Business databases remain schema 8. Existing Full Backups remain supported; a Full Backup restore is never a substitute for merging another device's activities.

The uploaded password-free design is preserved: exchange files are readable plaintext with a SHA-256 checksum. A checksum detects accidental alteration; it does not authenticate a sender. Local Financial PINs and vault encryption remain separate, and pending imported files are now encrypted at rest. Transfer files only to intended business devices.

Concurrent supplier payments that exceed a purchase's outstanding total are rejected atomically. The original payments remain on their source devices and need operator review; this repair does not create supplier credit or delete a real payment automatically. Shared-advance deficits similarly require verified funding correction rather than automatic balance changes.

Testing used synthetic data in Chromium. Physical Android APK compilation, SAF permissions, Bluetooth/Quick Share, actual PWA-to-APK exchange and hardware power cuts were not tested. Injected storage aborts and browser restarts are the tested interruption model. Real business opening stock, bank/cash, debt and liabilities still require responsible reconciliation against actual records.

The ZIP contains application code and assets, not the private database in your browser. All 51 uploaded files are retained; only index.html and sw.js are changed, with this release's guide/results added. The uploaded Ember styles and smooth-swipe implementation are retained. Reproducible tests and original failure evidence are published in validation/v2.10.13 on the release branch.
'''
guide='''# Deploying the Market and Smart Sync repair — v2.10.13

1. Export Full Backup from every participating device and read each saved file back to verify it. Keep external copies.
2. Extract this ZIP at your existing Cloudflare Pages root. No build command is required. Retain the same HTTPS origin so the browser can continue using its existing database.
3. Update every participating device to this build. The service-worker cache version changes to 2.10.13-market-sync-review-20261014. The database stays at schema 8; existing business identities and checkpoints stay intact.
4. Re-export pending sync exchanges after all devices update. New exchange files use protocol 2; earlier files are rejected with an update/re-export message. Both devices still use their own Financial PIN. No shared passphrase is added.
5. Open Smart Sync from Settings or Market Desk. Review incoming changes, resolve genuine conflicts, confirm the merge and exchange acknowledgements. An export alone does not prove receipt or matching state.

The first upgraded start adds previously omitted saved Market sessions, recycle-bin lists, budget and prepared Low Stock work to the permanent sync event stream. If devices have conflicting budgets or drafts, review those differences explicitly. Causal sequencing prevents later received edits from being mistaken for independent concurrent changes; real concurrent disagreements still require a decision.

A funding shortage now appears alongside stock discrepancies. Both valid purchases remain recorded. Verify and correct actual funding; do not add an invented balancing transaction. Supplier overpayments are blocked without a partial merge and need review of the source payment records.

Pending imported files are encrypted locally with the Financial vault key and can resume after PIN authorization. The transferred JSON file itself remains readable, following the uploaded password-free design. Keep that file private. Use Full Backup for recovery and Sync for merging; restoring another device's backup replaces state.

Read MARKET_SYNC_REVIEW_v2_10_13.md and MARKET_SYNC_RESULTS_v2_10_13.json for exact test evidence and limits. Older reports retained in the archive are historical documents, not additional tests of this release.
'''
(app/'MARKET_SYNC_REVIEW_v2_10_13.md').write_text(report);(app/'MARKET_SYNC_UPGRADE_v2_10_13.md').write_text(guide);(app/'MARKET_SYNC_RESULTS_v2_10_13.json').write_text(json.dumps(summary,indent=2));(r/'reports/REVIEW_REPORT.md').write_text(report);(r/'reports/RESULTS.json').write_text(json.dumps(summary,indent=2))
source=Path('/workspace/attachments/37d96441-dfee-47d9-8348-08bb7a0bbf92/Roseachy_v2_10_12_Ember_Smart_Sync_and_Smooth_Swipe_Cloudflare_PWA.zip');assert hashlib.sha256(source.read_bytes()).hexdigest()==summary['sourceSHA256']
originals={str(p.relative_to(r/'original')):p for p in (r/'original').rglob('*') if p.is_file()};assert len(originals)==51
for name,p in originals.items():assert (app/name).is_file()
changed=[n for n,p in originals.items() if p.read_bytes()!=(app/n).read_bytes()];assert set(changed)=={'index.html','sw.js'}
for item in json.loads((app/'manifest.json').read_text())['icons']:assert (app/item['src'].lstrip('/')).is_file()
for n in ['index.html','manifest.json','sw.js','js/pwa.js','js/android-sync-files.js','_headers','_redirects']:assert (app/n).is_file()
files={p.relative_to(app).as_posix():p for p in app.rglob('*') if p.is_file()};out=Path('/workspace/Roseachy_v2_10_13_Market_Sync_Integrity_Cloudflare_PWA.zip');assert not out.exists()
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,p in sorted(files.items()):z.write(p,name)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None and set(z.namelist())==set(files)
 for n,p in files.items():assert z.read(n)==p.read_bytes()
metadata={'filename':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'entries':len(files),'originalFilesRetained':len(originals),'modifiedOriginalFiles':changed,'applicationSHA256':summary['applicationSHA256']};(r/'reports/EXPORT.json').write_text(json.dumps(metadata,indent=2));(r/'EXPORT_SHA256.txt').write_text(metadata['sha256']+'  '+out.name+'\n');print(json.dumps(metadata,indent=2))
