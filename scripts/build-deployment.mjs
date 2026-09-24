import {spawnSync} from 'node:child_process';
import {cp,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
function run(script) {
  const result=spawnSync(process.execPath,[script],{cwd:fileURLToPath(root),stdio:'inherit',env:process.env});
  if(result.status!==0) throw new Error(`${script} failed: ${result.error?.message||result.status}`);
}
run('scripts/build-static.mjs');
// Fail closed: unset/local/production environments all emit only the player allowlist.
if(process.env.VERCEL_ENV==='preview') {
  run('scripts/build-aha-review.mjs');
  await cp(new URL('review-dist/',root),new URL('dist/',root),{recursive:true});
  const manifest=JSON.parse(await readFile(new URL('dist/build.json',root),'utf8'));
  manifest.audience='preview';
  manifest.internalReviewArtifactsDeployed=true;
  manifest.reviewEntry='aha.html';
  await writeFile(new URL('dist/build.json',root),JSON.stringify(manifest,null,2)+'\n');
}
