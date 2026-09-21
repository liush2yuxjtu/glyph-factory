import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const ctx=vm.createContext({});
// 引擎在浏览器里把自己挂到 window.GlyphEngineV3；vm 上下文里没有 window，所以这里显式挂上
// 同一个名字——评审契约读的是它，两个名字不一致的话契约会拿到 undefined（而且是在评审页上
// 才炸，测试里看不见）。
vm.runInContext(read('public/glyph-engine-v3.js')+';globalThis.GlyphEngineV3=GlyphEngineV3;globalThis.engine=GlyphEngineV3;',ctx);
vm.runInContext(read('public/aha-review-contract.js'),ctx);
const E=ctx.engine, audit=ctx.GlyphAhaAudit;
const expected=Array.from({length:28},(_,i)=>`A${String(i+1).padStart(2,'0')}`);

test('shared Aha catalog is exactly the full ordered engine catalog, not a copied title list',()=>{
  assert.deepEqual(Array.from(audit.ids),expected);
  assert.deepEqual(Array.from(E.AHAS,a=>a.id),expected);
  assert.match(read('public/aha-review-ui.js'),/for\(const item of E\.AHAS\)/);
});
for(const id of expected) {
  test(`${id}: independent state invariant accepts the real snapshot and rejects its corruption`,()=>{
    const state=E.directorState(id,1000);
    assert.equal(audit.stateErrors(id,{id,state}).length,0);
    const [,key,minimum]=audit.rules.find(r=>r[0]===id);
    const broken={...state,[key]:typeof minimum==='boolean'?false:minimum-1};
    assert.ok(audit.stateErrors(id,{id,state:broken}).length>0,`${id} missing invariant was silently accepted`);
    assert.ok(audit.stateErrors(id,{id:'invalid',state}).length>0);
    assert.ok(audit.stateErrors(id,{id,state:{...state,ahaSeen:[]}}).length>0);
    assert.ok(audit.stateErrors(id,null).length>0);
  });
}

test('action-effect detector rejects no-op clicks for every supported action',()=>{
  for(const [name,predicate] of Object.entries(audit.transitions)) {
    const state=E.directorState('A27',1000);
    assert.equal(predicate(state,{...state}),false,name);
  }
});

test('Next Aha Lab delegates to the canonical browser-tested page',()=>{
  const client=read('src/app/aha-lab/AhaLabClient.tsx');
  assert.match(client,/src="\/aha\.html"/);
  assert.doesNotMatch(client,/const AHAS|actions > 0|28 \/ 28 已通过/);
  const html=read('public/aha.html');
  assert.match(html,/id="review-frame"/);
  assert.match(html,/id="verify-all"[^>]*disabled/);
  assert.match(html,/aha-review-contract\.js/);
  assert.match(html,/aha-review-ui\.js/);
  assert.match(read('public/aha-review-ui.js'),/audit\.exercise\(trigger\(id\),id\)/);
});

test('Aha Lab route remains preview-only and non-indexable',()=>{
  const route=read('src/app/aha-lab/page.tsx');
  assert.match(route,/process\.env\.VERCEL_ENV === "production"/);
  assert.match(route,/notFound\(\)/);
  assert.match(route,/index: false/);
  assert.match(read('public/aha.html'),/name="robots" content="noindex,nofollow"/);
});
