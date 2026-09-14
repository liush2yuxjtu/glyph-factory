import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// 直接测试实际交付 HTML 内的引擎，避免另一个测试副本与线上逻辑分叉。
const html = readFileSync(new URL('../public/play.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, '游戏必须包含完整脚本');
const engineSource = script.split('/* 浏览器界面；')[0];
const E = new Function(engineSource + '\nreturn Engine;')();
const t = 1789387200000;
const newGame = () => E.fresh(t);
const doIt = (g, type, props = {}) => E.act(g, { type, ...props }, g.updatedAt);
test('新游戏资源为零，不可提前通关', () => { const g = newGame(); assert.equal(g.glyphs, 0); assert.equal(E.rate(g), 0); assert.equal(E.canFinish(g), false); });
test('印字、出售与首次自动化可达', () => { let g = newGame(); for(let i=0;i<10;i++) g=doIt(g,'print'); g=doIt(g,'sell'); assert.equal(g.credits,5); g=doIt(g,'buy',{id:'keyboards'}); assert.equal(g.keyboards,1); assert.equal(g.credits,0); assert.equal(E.rate(g),0.5); });
test('余额不足不能购买，也不会写虚假成功日志', () => { const g=newGame(); const h=doIt(g,'buy',{id:'presses'}); assert.deepEqual(h,g); });
test('阶段未解锁不能越级购买', () => { const g={...newGame(),credits:1000}; assert.equal(doIt(g,'buy',{id:'presses'}).presses,0); });
test('购入设备后价格递增，资金不会变为负数', () => { let g={...newGame(),credits:5}; g=doIt(g,'buy',{id:'keyboards'}); assert.ok(E.cost(g,'keyboards')>5); assert.equal(doIt(g,'buy',{id:'keyboards'}).credits,0); });
test('真实时间自动结算，不依赖定时器触发次数', () => { const g={...newGame(),keyboards:2}; const h=E.advance(g,t+10000); assert.equal(h.glyphs,10); assert.equal(h.lifetimeGlyphs,10); });
test('离线生产最多结算八小时', () => { const g={...newGame(),keyboards:2}; const h=E.restore(JSON.stringify(g),t+24*3600000); assert.equal(h.glyphs,28800); });
test('时钟倒退不会重复发放资源', () => { const g={...newGame(),keyboards:2}; assert.deepEqual(E.advance(g,t-1000),g); });
test('损坏存档与非法类型不会导致异常', () => { for(const raw of ['{broken','null','[]','false','"hello"']) assert.equal(E.restore(raw,t).glyphs,0); const g=E.restore({glyphs:-1,credits:'Infinity',keyboards:NaN,log:[null,{}]},t); assert.equal(g.glyphs,0); assert.equal(g.credits,0); assert.equal(g.keyboards,0); assert.ok(Array.isArray(g.log)); });
test('旧版存档迁移保留资源', () => { const g=E.restore(JSON.stringify({glyphs:12,credits:8,keyboards:1,typists:0,presses:0,lifetimeGlyphs:20,log:['ENGLISH']}),t); assert.equal(g.glyphs,12); assert.equal(g.credits,8); assert.equal(g.version,2); assert.ok(!g.log.includes('ENGLISH')); });
test('委托消耗的是库存，且只能领取一次', () => { let g={...newGame(),glyphs:20,lifetimeGlyphs:20}; g=doIt(g,'contract'); assert.equal(g.glyphs,0); assert.equal(g.credits,20); assert.equal(g.contracts,1); assert.deepEqual(doIt(g,'contract'),g); });
test('复写纸只扣款一次且手动产量变四倍', () => { let g={...newGame(),lifetimeGlyphs:150,credits:90}; g=doIt(g,'boost'); assert.equal(g.credits,45); g=doIt(g,'boost'); assert.equal(g.credits,45); assert.equal(doIt(g,'print').glyphs,4); });
test('自动出售需要研发，并可暂停积累库存', () => { let g={...newGame(),lifetimeGlyphs:300,credits:60,keyboards:2}; assert.equal(doIt(g,'toggle-auto').autoSell,false); g=doIt(g,'research-auto'); g=doIt(g,'toggle-auto'); g=E.advance(g,t+10000); assert.equal(g.credits,5); assert.equal(g.glyphs,0); g=doIt(g,'toggle-auto'); g=E.advance(g,t+20000); assert.equal(g.glyphs,10); });
test('小数库存出售不丢失', () => { const g=doIt({...newGame(),glyphs:1.75},'sell'); assert.equal(g.glyphs,0.75); assert.equal(g.credits,0.5); });
test('通关必须满足所有条件且奖励不可重复消费', () => { let g={...newGame(),lifetimeGlyphs:5000,glyphs:200,credits:300,presses:1}; assert.ok(E.canFinish(g)); g=doIt(g,'publish'); assert.ok(g.finished); assert.equal(g.glyphs,0); assert.equal(g.credits,0); assert.deepEqual(doIt(g,'publish'),g); });
test('从零按合法动作模拟到通关，不注入资源', () => {
  let g=newGame(), completedAt=0;
  for(let seconds=0;seconds<3600;seconds++) {
    for(let i=0;i<4;i++) g=doIt(g,'print');
    if(g.contracts<3) g=doIt(g,'contract');
    if(E.canFinish(g)){g=doIt(g,'publish');completedAt=seconds;break;}
    if(g.lifetimeGlyphs<5000 || g.credits<300) g=doIt(g,'sell');
    if(g.lifetimeGlyphs>=150 && !g.manualBoost) g=doIt(g,'boost');
    if(g.lifetimeGlyphs<4500) for(const id of ['presses','typists','keyboards']) g=doIt(g,'buy',{id});
    g=E.advance(g,g.updatedAt+1000);
  }
  assert.ok(g.finished,JSON.stringify(g)); assert.ok(completedAt<3600); console.log(`合法动作模拟通关：${completedAt} 个模拟秒（每秒手动 4 次，不代表真实用户时长）`);
});
