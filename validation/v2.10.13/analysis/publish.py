from pathlib import Path
import os,subprocess,json
r=Path('/workspace/roseachy-v2.10.12-ember-review');repo=Path('/workspace/roseachy-v2.10.0-github');branch='roseachy-v2.10.13-market-sync-review'
index=r/'analysis/publication.index';assert not index.exists()
env=os.environ.copy();env['GIT_INDEX_FILE']=str(index)
env.update({'GIT_AUTHOR_NAME':'Codex','GIT_AUTHOR_EMAIL':'codex@openai.com','GIT_COMMITTER_NAME':'Codex','GIT_COMMITTER_EMAIL':'codex@openai.com'})
def git(*args,input=None,alternate=False):
 q=subprocess.run(['git','-C',str(repo),*args],input=input,text=True,capture_output=True,env=env if alternate else None)
 if q.returncode:raise RuntimeError(q.stderr)
 return q.stdout.strip()
assert not git('status','--porcelain'),'Existing checkout has changes; preserve them.'
parent=git('rev-parse','refs/heads/roseachy-v2.10.12-smart-sync-merge');assert parent=='85f0eb68c9f9a9c585d88b3c4aef2b21056fb168'
assert git('ls-remote','origin','refs/heads/main').split()[0]=='b9c0f62e1f62758203ab654eb138408ef2bb4ef2'
q=subprocess.run(['git','-C',str(repo),'show-ref','--verify','--quiet','refs/heads/'+branch]);assert q.returncode==1,'Branch already exists.'
git('read-tree',parent,alternate=True)
files={p.relative_to(r/'app').as_posix():p for p in (r/'app').rglob('*') if p.is_file()}
archive=Path('/workspace/Roseachy_v2_10_13_Market_Sync_Integrity_Cloudflare_PWA.zip')
files['exports/'+archive.name]=archive
files['exports/SHA256_v2_10_13.txt']=r/'EXPORT_SHA256.txt'
for folder in ['tests','reports','analysis']:
 for p in (r/folder).glob('*'):
  if p.is_file() and (p.suffix in ['.cjs','.inc','.py','.md','.json']) and p.name not in ['publication.json']:
   files['validation/v2.10.13/'+folder+'/'+p.name]=p
readme=r/'analysis/RELEASE_README.md';readme.write_text("""# Roseachy v2.10.13 — Market and Smart Sync integrity repair

This release reviews the uploaded Ember / Smart Sync / Smooth Swipe build and repairs omitted Market records, later edits applied out of order, split merge commits, unflagged shared-advance deficits, PIN-session reentry and plaintext pending imports in local storage. Prepared Low Stock purchase drafts and independently prepared drafts survive exchange and restart. Uploaded Ember styling and smooth-swipe behavior are retained.

[Download complete Cloudflare Pages ZIP](exports/Roseachy_v2_10_13_Market_Sync_Integrity_Cloudflare_PWA.zip) · [Review and test report](MARKET_SYNC_REVIEW_v2_10_13.md) · [Upgrade guide](MARKET_SYNC_UPGRADE_v2_10_13.md)

113 automated browser scenario groups and 11 JavaScript syntax checks pass. A 120-product multi-device run reconciles 720 units purchased and 120 sold to 30,600 units, 91 transactions, retail cash 99,320 and supplier debt 3,220 after repeated exchanges. Additional coverage includes a 500-product Market fixture, 200 prepared items, supplier payments, duplicate/multi-hop import, encrypted pending-file recovery, original database/checkpoint upgrade, atomic failures, fallback-storage retry, backups, offline reload and navigation.

Update all participating devices before exchanging files: the repaired engine uses sync protocol 2 and rejects protocol-1 files with a re-export instruction. Existing Full Backups and schema-8 databases remain supported. Exchange JSON is still intentionally plaintext with a checksum; Financial PINs and local vault encryption remain separate. Actual APK compilation, physical sharing and hardware power cuts were not tested; these are browser simulations with synthetic data.

Extract the complete ZIP at the existing Cloudflare Pages root; no build required. All 51 uploaded files are retained, with index.html/sw.js repaired and three current release documents/results added. Historical documents describe their own releases. This release is on roseachy-v2.10.13-market-sync-review; GitHub main, original uploads and existing checkouts are preserved. The ZIP does not contain your private browser business database.
""");files['README.md']=readme
for name,p in sorted(files.items()):
 oid=git('hash-object','-w','--',str(p));git('update-index','--add','--cacheinfo','100644,'+oid+','+name,alternate=True)
tree=git('write-tree',alternate=True)
commit=git('commit-tree',tree,'-p',parent,input='Repair Market records, causal sync ordering and atomic merge recovery\n\nPreserve the uploaded Ember/swipe build, add regression evidence and the complete v2.10.13 deployment ZIP.\n',alternate=True)
git('update-ref','refs/heads/'+branch,commit,'0'*40)
assert not git('status','--porcelain')
git('push','origin',branch)
assert not git('status','--porcelain')
assert git('ls-remote','origin','refs/heads/main').split()[0]=='b9c0f62e1f62758203ab654eb138408ef2bb4ef2'
assert git('ls-remote','origin','refs/heads/'+branch).split()[0]==commit
(r/'analysis/publication.json').write_text(json.dumps({'branch':branch,'parent':parent,'commit':commit,'tree':tree,'mainPreserved':True,'checkoutFilesUnchanged':True},indent=2))
print((r/'analysis/publication.json').read_text())
