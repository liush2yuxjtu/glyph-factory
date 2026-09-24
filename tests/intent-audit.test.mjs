import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {renderIntent} from '../scripts/build-intent.mjs';
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
  // 意图编号从文档里**取**，不写死。写死的那份是 `['U1'…'U6']`，而 U7 加进来的时候
  // 它一声不响地少守了一条——「清单漏了一项」正是这类断言最容易的坏法。
  const ids=[...intentMd.matchAll(/^## (U\d+) · /gm)].map((m)=>m[1]);
  assert.ok(ids.length>=6,`只解析出 ${ids.length} 条意图，解析器本身可能坏了`);
  for(const id of ids)
    for(const [name,source] of [['intent.md',intentMd],['public/intent.html',intentHtml]])
      assert.match(source,new RegExp(`\\b${id}\\b`),`${id} is missing from ${name}`);
  // 每条意图都要能被验：原话（用户怎么说）+ 怎么验（证据在哪）+ 状态（做没做）。
  // 断言必须**逐条**下：只数全篇的话，新加的 U8 可以一条字段都不写而全绿——U1…U7 已经
  // 把全局下限占满了。这类「下限被前面的条目填满」的写法，是这个文件里第三次出现同一个坏法。
  const sections=intentMd.split(/^## /m).slice(1).filter((block)=>/^U\d+ · /.test(block));
  assert.ok(sections.length>=6,`只切出 ${sections.length} 条意图，切分本身可能坏了`);
  for(const block of sections){
    const id=block.match(/^(U\d+) · /)[1];
    assert.match(block,/> .+/m,`${id} 缺「原话」引用块——用户怎么说的一句都不能少`);
    assert.match(block,/\*\*怎么验。\*\*/,`${id} 没写「怎么验」`);
    assert.match(block,/\*\*状态。\*\*/,`${id} 没写「状态」`);
  }
  // HTML 是生成物，别手改
  assert.match(intentHtml,/build-intent\.mjs/,'生成的 HTML 要写明它是从哪来的');
});

// 生成物会漂：改完 intent.md 忘了重新生成，上面每一条断言**照样全绿**，而过期的正是
// 读者看到的那一份。所以这里把渲染器当场重算一遍，逐字节比。这是唯一能守住「生成物
// 与真源同步」的形状——存在性断言守不住同步，只守得住「没被删掉」。
test('the published intent page is the generator’s current output, byte for byte',()=>{
  const rendered=renderIntent(read('intent.md'));
  assert.equal(read('public/intent.html'),rendered,
    'public/intent.html 与生成器输出不一致：跑 node scripts/build-intent.mjs 重新生成');
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
