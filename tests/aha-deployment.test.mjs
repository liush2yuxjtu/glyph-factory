import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const internal=['aha.html','aha.md','intent.html','aha-lab/index.html','review/play.html','aha-review-contract.js','aha-review-ui.js'];
test('actual preview deployment includes working review routes; production rebuild removes them',()=>{
  const dir=mkdtempSync(join(tmpdir(),'glyph-intent-deploy-'));
  try {
    for(const path of ['public','scripts','aha.md']) cpSync(join(root,path),join(dir,path),{recursive:true});
    const build=(mode)=>{
      const result=spawnSync(process.execPath,['scripts/build-deployment.mjs'],{cwd:dir,env:{...process.env,VERCEL_ENV:mode},encoding:'utf8'});
      assert.equal(result.status,0,result.stderr+result.stdout);
    };
    build('production');
    for(const path of internal) assert.equal(existsSync(join(dir,'dist',path)),false,path);
    const player=readFileSync(join(dir,'dist/play.html'),'utf8');
    build('preview');
    for(const path of internal) assert.ok(existsSync(join(dir,'dist',path)),path);
    assert.equal(readFileSync(join(dir,'dist/play.html'),'utf8'),player,'preview player must be byte-identical to the production player');
    assert.match(readFileSync(join(dir,'dist/aha.html'),'utf8'),/src="\/review\/play\.html\?director=1"/);
    assert.equal(JSON.parse(readFileSync(join(dir,'dist/build.json'))).internalReviewArtifactsDeployed,true);
    build('production');
    for(const path of internal) assert.equal(existsSync(join(dir,'dist',path)),false,path+' leaked from stale preview');
    assert.equal(JSON.parse(readFileSync(join(dir,'dist/build.json'))).internalReviewArtifactsDeployed,false);
    const rejected=spawnSync(process.execPath,['scripts/build-aha-review.mjs'],{cwd:dir,env:{...process.env,VERCEL_ENV:'production'},encoding:'utf8'});
    assert.notEqual(rejected.status,0,'review builder must reject production');
    build('');
    for(const path of internal) assert.equal(existsSync(join(dir,'dist',path)),false,'unset environment leaked '+path);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
