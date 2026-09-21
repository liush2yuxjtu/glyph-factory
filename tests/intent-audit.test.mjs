import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const intent=read('aha.md'), html=read('public/aha.html');

test('canonical Aha Markdown is published byte-for-byte next to the review page',()=>{
  assert.equal(read('public/aha.md'),intent,'Public Markdown entry must match the canonical contract');
});

// 2026-09-21 之前 intent.md 与 public/intent.html 是 aha.md / public/aha.html 的逐字节副本，
// 上面那条断言原本还守着它们相等。用户要求「each intent separate」，所以这条线反过来了：
// 现在要守的是**它们不相等**——aha 回答「怎么实现」，intent 回答「要实现成什么样」。
// 真正会腐烂的正是「原话」：手写两份的那天起，就一定有一份先过期。
test('user intent is its own document, and it is verifiable intent by intent',()=>{
  const intentMd=read('intent.md'), intentHtml=read('public/intent.html');
  assert.notEqual(intentMd,intent,'intent.md must not be a copy of the Aha contract');
  assert.notEqual(intentHtml,html,'public/intent.html must not be a copy of the Aha page');
  for(const id of ['U1','U2','U3','U4','U5','U6'])
    for(const [name,source] of [['intent.md',intentMd],['public/intent.html',intentHtml]])
      assert.match(source,new RegExp(`\\b${id}\\b`),`${id} is missing from ${name}`);
  // 每条意图都要能被验：原话（用户怎么说）+ 怎么验（证据在哪）+ 状态（做没做）
  assert.ok((intentMd.match(/\*\*怎么验。\*\*/g)||[]).length>=6,'每条意图都要写清怎么验');
  assert.ok((intentMd.match(/\*\*状态。\*\*/g)||[]).length>=6,'每条意图都要写清状态');
  assert.match(intentMd,/> .+\n/,'原话要留引用块，不许改写成转述');
  // HTML 是生成物，别手改
  assert.match(intentHtml,/build-intent\.mjs/,'生成的 HTML 要写明它是从哪来的');
});

test('both documents specify the same disclosure rule, every flow and every screen',()=>{
  for(const source of [intent,html]) {
    assert.match(source,/hidden → discovered → persistent → intentionally replaced/);
    for(const id of ['F01','F02','F03','S01','S02','S03','S10','S11','S12','S20','S21','S22'])
      assert.match(source,new RegExp(`\\b${id}\\b`),`${id} is missing`);
  }
  assert.match(intent,/Hidden means absent/);
  assert.match(intent,/Runtime Surface Completeness/);
  assert.match(html,/Screens \+ Flows/);
});

test('review uses the real player and real Director, not the previous independent demo',()=>{
  assert.match(html,/id="player-frame"[^>]*src="\/play\.html"/);
  assert.match(html,/id="review-frame"[^>]*src="\/play\.html\?director=1"/);
  assert.doesNotMatch(html,/let n=0|money>=3|sellRevealed|setInterval\(\(\)=>\{n\+\+/);
  assert.match(html,/npm run intent-audit/);
});

test('runtime collapses undiscovered surfaces including nested resource and action grids',()=>{
  const play=read('public/play.html'),controller=read('public/glyph-game-v3.js');
  assert.match(play,/hero\.single/);
  assert.match(play,/below\.single/);
  assert.match(play,/id="systems-panel"/);
  assert.match(controller,/hero-layout/);
  assert.match(controller,/systemsPanel\.hidden/);
  for(const selector of ['metrics','primary-actions','machines'])
    assert.match(play,new RegExp(`\\.${selector}\\{grid-template-columns:repeat\\(auto-fit`));
});

test('all review scripts parse and all local script references have real source files',()=>{
  for(const match of html.matchAll(/<script src="\/([^"]+)"/g))
    new vm.Script(read(`public/${match[1]}`),{filename:match[1]});
  assert.match(read('public/glyph-game-v3.js'),/GlyphReview = Object\.freeze/);
  assert.match(read('public/glyph-game-v3.js'),/dataset\.audience === 'player'\) return null/);
});
