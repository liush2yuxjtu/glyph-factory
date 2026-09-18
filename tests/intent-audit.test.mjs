import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const intent=read('aha.md'), html=read('public/aha.html');

test('canonical Aha Markdown and HTML have exact legacy aliases',()=>{
  assert.equal(read('public/aha.md'),intent,'Public Markdown entry must match the canonical contract');
  assert.equal(read('intent.md'),intent,'Run node scripts/sync-aha-docs.mjs');
  assert.equal(read('public/intent.html'),html,'Run node scripts/sync-aha-docs.mjs');
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
