import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const output=new URL('../../../test-results/intent-audit/',import.meta.url);
mkdirSync(output,{recursive:true});
const git=(args)=>spawnSync('git',args,{cwd:root,encoding:'utf8'}).stdout?.trim()||null;
const hash=createHash('sha256');
const inputs=[];
function visit(path) {
  for(const entry of readdirSync(new URL('../../../'+path+'/',import.meta.url),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    if(entry.name==='__pycache__') continue;
    const file=path+'/'+entry.name;
    if(entry.isDirectory()) visit(file);
    else inputs.push(file);
  }
}
// `.github` no longer holds workflows; only the PR template remains, and it is a live part of
// the review contract. It stays an input while it exists, but a missing directory is not an
// error — the hash covers the verification inputs, and an absent one is not one.
for(const path of ['public','src','scripts','tests','.github']) if(existsSync(new URL('../../../'+path,import.meta.url))) visit(path);
inputs.push('aha.md','intent.md','package.json','package-lock.json','vercel.json');
for(const path of inputs.sort()) hash.update(path+'\0').update(readFileSync(new URL('../../../'+path,import.meta.url)));
const report={status:'FAIL',scope:'local production artifact + local review artifact; not a live deployment acceptance',
  commit:git(['rev-parse','HEAD']),dirty:Boolean(git(['status','--porcelain'])),sourceSha256:hash.digest('hex'),
  startedAt:new Date().toISOString(),stages:[]};
const save=()=>writeFileSync(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');
save();
function run(name,command,args,extra={}) {
  console.log(`RUN ${name}`);
  const r=spawnSync(command,args,{cwd:root,encoding:'utf8',env:{...process.env,...extra},maxBuffer:20*1024*1024,timeout:15*60*1000});
  // 先剥掉 ANSI 颜色再读。Node 的 reporter 在多数终端里会给 `ℹ tests 97` 加一层转义，
  // 行首于是不是 `#` 也不是 `ℹ`，下面那些 `^` 锚定的读数全部落空——门禁会在自己刚刚通过
  // 的那一步里中止，报的还是「没有证明成功」。剥颜色只是把看不见的字符去掉，判定不放宽。
  const stripAnsi=(s)=>s.replace(/\u001B\[[0-9;]*m/g,'');
  const text=stripAnsi((r.stdout||'')+(r.stderr||'')+(r.error?'\n'+r.error.message:''));
  writeFileSync(new URL(name+'.log',output),text);
  const stage={name,status:r.status===0?'PASS':'FAIL',exitCode:r.status};
  report.stages.push(stage); save();
  if(r.status!==0) { console.error(text); throw new Error(name+' failed'); }
  console.log(`PASS ${name}`);
  return {stage,text};
}
try {
  const fast=run('fast',process.execPath,['scripts/verify-player.mjs','--fast']);
  // `node --test` prints `ℹ tests 92` on Node >= 20 and `# tests 92` on older reporters.
  // Reading only the older shape made a reporter change look like a failed run: the stage
  // passed, this parser threw, and the audit aborted on stage one while blaming nothing real.
  // Read both shapes, and treat a missing tally as a failure rather than as zero.
  // 这两种形状都要求行首就是 `#`/`ℹ`，所以 `run()` 里那一层 ANSI 剥离不是装饰：Node 的
  // reporter 在多数终端里会给整行套转义，锚点落空之后**两个形状一起读不到**，症状和当初
  // 只认 `#` 时一模一样——门禁在自己刚通过的那一步中止。两个洞是一起堵上的。
  const tally=(name)=>fast.text.match(new RegExp('^(?:#|ℹ) '+name+' (\\d+)$','m'))?.[1];
  const count=Number(tally('tests'));
  if(!(count>0)||tally('fail')!=='0'||tally('skipped')!=='0'||tally('todo')!=='0')
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
