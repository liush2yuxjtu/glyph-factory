import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=new URL('../test-results/intent-audit/',import.meta.url);
mkdirSync(output,{recursive:true});
const git=(args)=>spawnSync('git',args,{cwd:root,encoding:'utf8'}).stdout?.trim()||null;
const hash=createHash('sha256');
const inputs=[];
function visit(path) {
  for(const entry of readdirSync(new URL('../'+path+'/',import.meta.url),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    if(entry.name==='__pycache__') continue;
    const file=path+'/'+entry.name;
    if(entry.isDirectory()) visit(file);
    else inputs.push(file);
  }
}
// `.github` no longer holds workflows; only the PR template remains, and it is a live part of
// the review contract. It stays an input while it exists, but a missing directory is not an
// error — the hash covers the verification inputs, and an absent one is not one.
for(const path of ['public','src','scripts','tests','.github']) if(existsSync(new URL('../'+path,import.meta.url))) visit(path);
inputs.push('aha.md','intent.md','package.json','package-lock.json','vercel.json');
for(const path of inputs.sort()) hash.update(path+'\0').update(readFileSync(new URL('../'+path,import.meta.url)));
const report={status:'FAIL',scope:'local production artifact + local review artifact; not a live deployment acceptance',
  commit:git(['rev-parse','HEAD']),dirty:Boolean(git(['status','--porcelain'])),sourceSha256:hash.digest('hex'),
  startedAt:new Date().toISOString(),stages:[]};
const save=()=>writeFileSync(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');
save();
function run(name,command,args,extra={}) {
  console.log(`RUN ${name}`);
  const r=spawnSync(command,args,{cwd:root,encoding:'utf8',env:{...process.env,...extra},maxBuffer:20*1024*1024,timeout:15*60*1000});
  const text=(r.stdout||'')+(r.stderr||'')+(r.error?'\n'+r.error.message:'');
  writeFileSync(new URL(name+'.log',output),text);
  const stage={name,status:r.status===0?'PASS':'FAIL',exitCode:r.status};
  report.stages.push(stage); save();
  if(r.status!==0) { console.error(text); throw new Error(name+' failed'); }
  console.log(`PASS ${name}`);
  return {stage,text};
}
try {
  const fast=run('fast',process.execPath,['scripts/verify-player.mjs','--fast']);
  const count=Number(fast.text.match(/^# tests (\d+)$/m)?.[1]);
  if(!(count>0)||!/^# fail 0$/m.test(fast.text)||!/^# skipped 0$/m.test(fast.text)||!/^# todo 0$/m.test(fast.text))
    throw new Error('Fast gate did not prove nonempty, unskipped success');
  fast.stage.tests=count;
  run('review-build',process.execPath,['scripts/build-aha-review.mjs']);
  for(const browser of ['chromium','webkit']) for(const suite of ['player','aha']) {
    const name=suite+'-'+browser;
    const {stage}=run(name,process.env.PYTHON||'python3',['scripts/run-browser-contracts.py',suite],{GLYPH_BROWSER:browser});
    const detail=JSON.parse(readFileSync(new URL(name+'.json',output),'utf8'));
    if(detail.status!=='PASS') throw new Error('Browser report disagrees with process status');
    stage.tests=detail.run; stage.skipped=detail.skipped;
  }
  run('diff-check','git',['diff','--check']);
  report.totalTests=report.stages.reduce((n,s)=>n+(s.tests||0),0);
  report.status='PASS';
} catch(error) {
  report.status='FAIL'; report.error=error.message; process.exitCode=1;
} finally {
  report.completedAt=new Date().toISOString(); save();
  console.log(JSON.stringify(report,null,2));
}
