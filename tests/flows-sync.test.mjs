// 流程表是生成的，那就必须断言「入库的那份 == 现在生成出来的那份」。
//
// 只断言「里面有 F01…F06」是守不住的：改完引擎忘了重跑，页面照旧印着旧数字，而所有断言全绿。
// 这已经发生过一次——重排之后表里还留着「viral-word 送 750 读者」和「map-city 是第二章的出口」，
// 两条都不是真的了，页面照旧印着。
//
// 同一个形状这一支里已经写过三次（intent.html、门禁自己、这里）：**生成物与真源的同步只能靠
// 当场重算逐字节比**，存在性断言守不住任何东西。
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the committed flow tables are exactly what the engine generates right now', () => {
  const generated = execFileSync(process.execPath, [new URL('../scripts/flows/flows.mjs', import.meta.url).pathname],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: new URL('../', import.meta.url).pathname });
  assert.equal(read('scripts/flows/flows.json'), generated,
    'flows.json 与生成器输出不一致：跑 node scripts/flows/flows.mjs > scripts/flows/flows.json');
});

test('every flow shows the two new action surfaces the engine says that act has', () => {
  // 这一轮加的两类动作如果没有出现在流程表里，说明表是从旧读数生成的——
  // 那正是这次要修的东西，所以让它变成一条会红的前提，而不是一句注释。
  const flows = JSON.parse(read('scripts/flows/flows.json'));
  const E = new Function(`${read('public/glyph-engine-v3.js')}\nreturn GlyphEngineV3;`)();
  for (const flow of flows) {
    if (flow.act === 1) {
      assert.equal(E.ACT_VERBS[1], undefined, '第一章本来就不该有推钟动词');
      continue;
    }
    const cmds = flow.steps.map((s) => s.cmd);
    assert.ok(cmds.includes('push-clock'), `F${flow.act} 少了推钟动词`);
    assert.ok(cmds.includes('take-event'), `F${flow.act} 少了微事件`);
    const verb = flow.steps.find((s) => s.cmd === 'push-clock');
    assert.equal(verb.label, `${E.ACT_VERBS[flow.act].name} · 推钟`, `F${flow.act} 的推钟动词名字取错了幕`);
    assert.equal(flow.exit.join(' / '), E.ACT_GATES[flow.act].map((c) => `${c.label} ${c.need}`).join(' / '),
      `F${flow.act} 的出口条件与引擎不一致`);
  }
});
