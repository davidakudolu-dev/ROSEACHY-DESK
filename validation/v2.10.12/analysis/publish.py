from pathlib import Path
import os,subprocess,json
r=Path('/workspace/roseachy-v2.10.12-smart-sync');repo=Path('/workspace/roseachy-v2.10.0-github');branch='roseachy-v2.10.12-smart-sync-merge'
index=r/'analysis/publication.index';assert not index.exists()
env=os.environ.copy();env['GIT_INDEX_FILE']=str(index)
env.update({'GIT_AUTHOR_NAME':'Codex','GIT_AUTHOR_EMAIL':'codex@openai.com','GIT_COMMITTER_NAME':'Codex','GIT_COMMITTER_EMAIL':'codex@openai.com'})
def git(*args,input=None,alternate=False):
 q=subprocess.run(['git','-C',str(repo),*args],input=input,text=True,capture_output=True,env=env if alternate else None)
 if q.returncode:raise RuntimeError(q.stderr)
 return q.stdout.strip()
assert not git('status','--porcelain'),'Existing checkout has changes; preserve them.'
parent=git('rev-parse','refs/heads/roseachy-v2.10.11-integrity-repair');assert parent=='e33463a10fe66a543a85dbb636f42d2077c9254b'
assert git('ls-remote','origin','refs/heads/main').split()[0]=='b9c0f62e1f62758203ab654eb138408ef2bb4ef2'
q=subprocess.run(['git','-C',str(repo),'show-ref','--verify','--quiet','refs/heads/'+branch]);assert q.returncode==1,'Branch already exists.'
git('read-tree',parent,alternate=True)
files={p.relative_to(r/'app').as_posix():p for p in (r/'app').rglob('*') if p.is_file()}
for name in ['Roseachy_v2_10_12_Smart_Sync_Merge_Cloudflare_PWA.zip','Roseachy_v2_10_12_Smart_Sync_Preview.html','Roseachy_v2_10_12_Android_WebView_Integration_Source.zip']:
 files['exports/'+name]=Path('/workspace')/name
files['exports/SHA256_v2_10_12.txt']=r/'EXPORT_SHA256.txt'
for folder in ['tests','reports','analysis','android-source']:
 for p in (r/folder).glob('*'):
  if p.is_file() and (p.suffix in ['.cjs','.inc','.js','.py','.kt','.md','.json']):
   if p.name in ['publication.json']:continue
   files['validation/v2.10.12/'+folder+'/'+p.name]=p
for n in ['smart-sync-ui.png','portable-preview.png']:
 files['exports/'+n]=r/'tests'/n
readme=r/'analysis/RELEASE_README.md';readme.write_text("""# Roseachy v2.10.12 — Smart Sync & Merge

Protected offline reconciliation and event-based merging across Sales, Market and Financial desks. Devices agree a verified starting position, preserve old history without replay, retain permanent event identities and require explicit conflict decisions and acknowledgements. Group files use authenticated encryption; Financial PINs stay local.

[Complete Cloudflare Pages ZIP](exports/Roseachy_v2_10_12_Smart_Sync_Merge_Cloudflare_PWA.zip) · [Standalone HTML download](exports/Roseachy_v2_10_12_Smart_Sync_Preview.html) · [Android WebView integration source](exports/Roseachy_v2_10_12_Android_WebView_Integration_Source.zip)

[Usage guide](SMART_SYNC_GUIDE_v2_10_12.md) · [Migration and deduplication](SMART_SYNC_MIGRATION_v2_10_12.md) · [Test report and limitations](SMART_SYNC_TEST_REPORT_v2_10_12.md)

125 synthetic browser scenario groups and 11 JavaScript syntax checks pass. Coverage includes protected initial reconciliation, simultaneous sales/purchases, advances and receipts, repeated/multi-hop import, supplier payments, transaction reversals, encrypted Financial changes, restored installation identity, schema 7-to-8 migration, actual backup download/read-back, offline PWA, existing desks/navigation/contrast, and mocked Android file callbacks. The Kotlin source has not been compiled or tested on a physical APK; native sharing, real power interruption and physical PWA-to-APK exchange remain manual checks.

Extract the complete deployment ZIP at the Cloudflare Pages root; no build required. All 41 original deployment files remain. index.html, sw.js and js/pwa.js are updated, with the optional native file adapter and current guides/results added. Original uploads, existing checkouts and GitHub main are preserved. This release is saved on roseachy-v2.10.12-smart-sync-merge.

The standalone HTML must be downloaded and opened locally; a GitHub source page is not a hosted running preview. It embeds application assets and disables its service worker. Use the complete ZIP for deployed offline operation. Neither application download includes the private business database from your browser; export Full Backup for that data. Production reconciliation requires supervised verified stock and accounts on every participating device.
""");files['README.md']=readme
for name,p in sorted(files.items()):
 oid=git('hash-object','-w','--',str(p));git('update-index','--add','--cacheinfo','100644,'+oid+','+name,alternate=True)
tree=git('write-tree',alternate=True)
commit=git('commit-tree',tree,'-p',parent,input='Implement protected offline Smart Sync and Merge for Roseachy\n\nInclude full deployment, portable preview, Android integration source and 125 passing browser scenario groups; preserve originals and main.\n',alternate=True)
git('update-ref','refs/heads/'+branch,commit,'0'*40)
assert not git('status','--porcelain')
git('push','origin',branch)
assert not git('status','--porcelain')
assert git('ls-remote','origin','refs/heads/main').split()[0]=='b9c0f62e1f62758203ab654eb138408ef2bb4ef2'
assert git('ls-remote','origin','refs/heads/'+branch).split()[0]==commit
(r/'analysis/publication.json').write_text(json.dumps({'branch':branch,'parent':parent,'commit':commit,'tree':tree,'mainPreserved':True,'checkoutFilesUnchanged':True},indent=2))
print((r/'analysis/publication.json').read_text())
