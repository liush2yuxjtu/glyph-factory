/* Independent review assertions, never included in the production player artifact. */
(() => {
  'use strict';
  const rules = [
    ['A01','keyboards',1], ['A02','typists',5], ['A03','published',true],
    ['A04','composed',3], ['A05','meaning',10], ['A06','readers',440],
    ['A07','letters',1], ['A08','organicWords',1], ['A09','viralWords',1],
    ['A10','paperCrisis',true], ['A11','deletedNoise',1], ['A12','districts',2],
    ['A13','concepts',1], ['A14','worldScale',1], ['A15','worldScale',2],
    ['A16','agents',1], ['A17','editorAutonomy',true], ['A18','agentFactories',1],
    ['A19','overnightArticles',1800], ['A20','digital',true], ['A21','archives',1],
    ['A22','machineGlyphs',1], ['A23','machineGlyphUse',11200], ['A24','compressedMeaning',50000],
    ['A25','infrastructure',true], ['A26','ambiguity',1100], ['A27','deletedNoise',1000], ['A28','stopped',true],
  ];
  const acts = [1,1,2,2,2,2,2,2,2,2,2,3,3,3,3,4,4,4,4,4,4,5,5,5,6,6,6,6];
  // 28 个状态里有两种「此刻没有按钮可点」是设计本身：结局，以及几拍必须自己等出来的
  // 发现（机器要先用起来、歧义要先攒够）。这两种不能只写一句「跳过」——等的那一拍要写清楚
  // 在等什么，否则「没有可点的东西」就成了万能挡箭牌。
  const a26Need = rules.find((r) => r[0] === 'A26')[2];
  // Agent 写完一桌稿子需要的时间，就是第四章里两拍之间的那几百篇文章。数字和引擎的
  // AHA_CLOCK.A17 / A18 是同一对刻度。
  const articles = { A17: 140, A18: 280 };
  const clocks = {
    // Agent 上线之后，编辑要读到足够多的稿子才有资格说「不」。这一拍没有按钮可点，
    // 屏幕上那句「还差 夜间文章 …」就是这一拍的全部内容。
    A16: (s) => s.act === 4 && s.agents >= 1 && !s.editorAutonomy && s.overnightArticles < articles.A17,
    A17: (s) => s.act === 4 && s.editorAutonomy === true && !s.agentFactories && s.overnightArticles < articles.A18,
    // 字形刚被发现，一台机器都还没在用它。压缩要等这一步。
    A22: (s) => s.act === 5 && s.machineGlyphs >= 1 && s.machineGlyphUse < rules.find((r) => r[0] === 'A23')[2] && !s.infrastructure,
    // 语言刚接管基础设施，歧义正在自己上涨。删与停机都要等它涨够。
    A25: (s) => s.act === 6 && s.infrastructure === true && s.ambiguity < a26Need && !s.ambiguityResolved,
  };
  function stateErrors(id, snapshot) {
    const index = rules.findIndex((r) => r[0] === id);
    if (index < 0) return ['unknown Aha ID'];
    if (!snapshot || snapshot.id !== id || !snapshot.state) return ['actual preview does not match requested ID'];
    const state = snapshot.state, [, key, threshold] = rules[index], errors = [];
    if (state.act !== acts[index]) errors.push('wrong act');
    if (typeof threshold === 'boolean' ? state[key] !== threshold : !(Number.isFinite(state[key]) && state[key] >= threshold)) errors.push(`${key} invariant failed`);
    if (!Array.isArray(state.ahaSeen) || !state.ahaSeen.includes(id)) errors.push('event was not recorded');
    if (id !== 'A28' && state.stopped) errors.push('nonterminal preview is stopped');
    if (id === 'A04' && !state.ruleActive) errors.push('composition rule inactive');
    if (clocks[id] && !clocks[id](state)) errors.push('the state is meant to be a wait, and it is not');
    return errors;
  }
  const transitions = {
    'print': (a,b) => b.glyphs > a.glyphs && b.lifetimeGlyphs > a.lifetimeGlyphs,
    'discover-dialect': (a,b) => b.districts === a.districts + 1,
    // 交出否决权要花 40 意义和 300 资金，换回的是编辑自己攒下的判断力（+100 意义）。
    // 断言「净赚」而不是写死 +60：数字会调，方向不会。
    'editor-autonomy': (a,b) => b.editorAutonomy && !a.editorAutonomy && b.meaning > a.meaning && b.credits < a.credits,
    'spawn-agents': (a,b) => b.agentFactories === a.agentFactories + 1 && b.agents >= a.agents + 4,
    'digitize': (a,b) => !a.digital && b.digital,
    'train-memory': (a,b) => b.archives === a.archives + 1,
    'compress-language': (a,b) => b.compressedMeaning > a.compressedMeaning && b.meaning < a.meaning,
    'infrastructure': (a,b) => a.act === 5 && b.act === 6 && b.infrastructure,
    'delete-noise': (a,b) => b.noise < a.noise && b.deletedNoise > a.deletedNoise,
    'resolve-ambiguity': (a,b) => b.ambiguity < a.ambiguity && b.deletedNoise > a.deletedNoise,
  };
  function visible(el) { return Boolean(el && !el.hidden && el.getClientRects().length); }
  function inspect(doc, id) {
    const snapshot = doc?.defaultView?.GlyphReview?.snapshot();
    const errors = stateErrors(id, snapshot);
    if (!doc || !visible(doc.getElementById('main-game'))) errors.push('game not visible');
    if (id === 'A28' && doc) {
      if (doc.getElementById('rate')?.textContent !== '0') errors.push('production has not halted');
      if (!visible(doc.getElementById('ending'))) errors.push('ending is not visible');
      if ([...doc.querySelectorAll('#primary-actions button:enabled')].some(visible)) errors.push('terminal actions remain enabled');
    }
    return {id, snapshot, errors};
  }
  function exercise(doc, id) {
    const result = inspect(doc, id);
    if (result.errors.length || id === 'A28' || clocks[id]) {
      return {...result, pass: result.errors.length === 0, command: id === 'A28' ? 'terminal' : (clocks[id] ? 'clock' : null)};
    }
    const button = [...doc.querySelectorAll('#primary-actions button:enabled')].find((b) => visible(b) && transitions[b.dataset.command]);
    if (!button) return {...result, pass:false, errors:['no supported, visible, enabled real action']};
    const command=button.dataset.command, before=result.snapshot.state;
    button.click();
    const after=doc.defaultView.GlyphReview.snapshot();
    if (!after || after.id !== id || !transitions[command](before, after.state)) result.errors.push(`${command} did not produce its required state transition`);
    return {id, command, pass:result.errors.length===0, errors:result.errors};
  }
  globalThis.GlyphAhaAudit = Object.freeze({ids:Object.freeze(rules.map((r)=>r[0])), rules, clocks, stateErrors, transitions, inspect, exercise});
})();
