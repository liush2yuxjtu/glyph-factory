import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Preserve Act I regression coverage against the exact v3 engine shipped to browsers.
const source = readFileSync(new URL('../public/glyph-engine-v3.js', import.meta.url), 'utf8');
const E = new Function(`${source}\nreturn GlyphEngineV3;`)();
const t = 1789387200000;
const newGame = () => E.fresh(t);
const doIt = (g, type, props = {}) => E.act(g, { type, ...props }, g.updatedAt);

test('新游戏资源为零，不可提前发行《明日》', () => { const g = newGame(); assert.equal(g.glyphs, 0); assert.equal(E.rate(g), 0); assert.equal(E.canPublish(g), false); });
test('印字、出售与首次自动化可达', () => { let g = newGame(); for (let i=0;i<10;i++) g=doIt(g,'print'); g=doIt(g,'sell'); assert.equal(g.credits,5); g=doIt(g,'buy',{id:'keyboards'}); assert.equal(g.keyboards,1); assert.equal(g.credits,0); assert.equal(E.rate(g),0.5); });
test('余额不足不能购买', () => { const g=newGame(); const h=doIt(g,'buy',{id:'presses'}); assert.equal(h.presses,0); assert.equal(h.credits,0); });
test('阶段未解锁不能越级购买', () => { const g={...newGame(),credits:1000}; assert.equal(doIt(g,'buy',{id:'presses'}).presses,0); });
test('购入设备后价格递增，资金不会变负', () => { let g={...newGame(),credits:5,lifetimeGlyphs:10}; g=doIt(g,'buy',{id:'keyboards'}); assert.ok(E.cost(g,'keyboards')>5); assert.equal(g.credits,0); });
test('真实时间自动结算，不依赖定时器次数', () => { const g={...newGame(),keyboards:2}; const h=E.advance(g,t+10000); assert.equal(h.glyphs,10); assert.equal(h.lifetimeGlyphs,10); });
test('离线生产最多结算八小时', () => { const g={...newGame(),keyboards:2}; const h=E.restore(JSON.stringify(g),t+24*3600000); assert.equal(h.glyphs,28800); });
test('时钟倒退不会重复发放资源', () => { const g={...newGame(),keyboards:2}; const h=E.advance(g,t-1000); assert.equal(h.glyphs,0); assert.equal(h.updatedAt,t); });
test('损坏存档与非法类型不会导致异常', () => { for(const raw of ['{broken','null','[]','false','"hello"']) assert.equal(E.restore(raw,t).glyphs,0); const g=E.restore({version:2,glyphs:-1,credits:'Infinity',keyboards:NaN,log:[null,{}]},t); assert.equal(g.glyphs,0); assert.equal(g.credits,0); assert.equal(g.keyboards,0); assert.ok(Array.isArray(g.log)); });
test('v2 存档迁移保留资源并升级到 v3', () => { const g=E.restore({version:2,glyphs:12,credits:8,keyboards:1,typists:0,presses:0,lifetimeGlyphs:20,updatedAt:t,startedAt:t},t); assert.equal(g.glyphs,12); assert.equal(g.credits,8); assert.equal(g.version,3); });
test('委托消耗库存且只能按顺序领取', () => { let g={...newGame(),glyphs:20,lifetimeGlyphs:20}; g=doIt(g,'contract'); assert.equal(g.glyphs,0); assert.equal(g.credits,20); assert.equal(g.contracts,1); const h=doIt(g,'contract'); assert.equal(h.contracts,1); });
test('复写纸只扣款一次且手动产量变四倍', () => { let g={...newGame(),lifetimeGlyphs:150,credits:90}; g=doIt(g,'boost'); assert.equal(g.credits,45); g=doIt(g,'boost'); assert.equal(g.credits,45); assert.equal(doIt(g,'print').glyphs,4); });
test('自动出售需要研发，并可暂停积累库存', () => { let g={...newGame(),lifetimeGlyphs:300,credits:60,keyboards:2}; assert.equal(doIt(g,'toggle-auto').autoSell,false); g=doIt(g,'research-auto'); g=doIt(g,'toggle-auto'); g=E.advance(g,t+10000); assert.equal(g.credits,5); assert.equal(g.glyphs,0); g=doIt(g,'toggle-auto'); g=E.advance(g,t+20000); assert.equal(g.glyphs,10); });
test('小数库存出售不丢失', () => { const g=doIt({...newGame(),glyphs:1.75},'sell'); assert.equal(g.glyphs,0.75); assert.equal(g.credits,0.5); });
test('发行必须满足条件，发行后进入 Act II 且不可重复收费', () => { let g={...newGame(),lifetimeGlyphs:5000,glyphs:200,credits:300,presses:1}; assert.ok(E.canPublish(g)); g=doIt(g,'publish'); assert.ok(g.published); assert.equal(g.act,2); assert.equal(g.glyphs,0); assert.equal(g.credits,0); const h=doIt(g,'publish'); assert.equal(h.published,true); assert.equal(h.credits,0); });
test('从零按合法动作可以进入 Act II，不注入资源', () => {
  let g=newGame(), completedAt=0;
  for(let seconds=0;seconds<3600;seconds++) {
    for(let i=0;i<4;i++) g=doIt(g,'print');
    if(g.contracts<3) g=doIt(g,'contract');
    if(E.canPublish(g)){g=doIt(g,'publish');completedAt=seconds;break;}
    if(g.lifetimeGlyphs<5000||g.credits<300) g=doIt(g,'sell');
    if(g.lifetimeGlyphs>=150&&!g.manualBoost) g=doIt(g,'boost');
    if(g.lifetimeGlyphs<4500) for(const id of ['presses','typists','keyboards']) g=doIt(g,'buy',{id});
    g=E.advance(g,g.updatedAt+1000);
  }
  assert.ok(g.published,JSON.stringify(g)); assert.equal(g.act,2); assert.ok(completedAt<3600);
});
