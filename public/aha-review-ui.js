(() => {
  'use strict';
  const q=(id)=>document.getElementById(id), frame=q('review-frame'), run=q('verify-all');
  const catalog=q('aha-catalog'), status=q('audit-status'), evidence=q('audit-evidence');
  const E=window.GlyphEngineV3, audit=window.GlyphAhaAudit;
  let selected='A01', ready=false, running=false;
  function say(message, result='pending') { status.textContent=message; status.dataset.result=result; }
  function trigger(id) {
    const doc=frame.contentDocument, select=doc?.getElementById('director-select'), button=doc?.getElementById('director-preview');
    if (!ready || !select || !button || !doc.defaultView?.GlyphReview) throw new Error('真实游戏或只读状态证据尚未就绪');
    select.value=id;
    if(select.value!==id) throw new Error(`缺失状态 ${id}`);
    select.dispatchEvent(new Event('change',{bubbles:true}));
    button.click();
    const result=audit.inspect(doc,id);
    if(result.errors.length) throw new Error(`${id}: ${result.errors.join('; ')}`);
    selected=id;
    catalog.querySelectorAll('button').forEach((b)=>b.setAttribute('aria-current',String(b.dataset.aha===id)));
    return doc;
  }
  function progress() {
    const raw=frame.contentWindow.localStorage.getItem(E.SAVE_KEY);
    if(!raw) return null;
    const value=JSON.parse(raw);
    // 玩家那一帧在整个核验过程中一直是活的：它自己的钟在走，每 500ms 存一次档。
    // 「时间自己会改的」字段因此要排掉，否则读到的是玩家在呼吸，而不是评审动了手——
    // `actSeconds`（微事件的调度器）和两个时间戳同属这一类。剩下的任何一处差异，
    // 仍然是「评审改变了真实玩家进度」。
    for(const key of ['updatedAt','startedAt','actSeconds']) delete value[key];
    return JSON.stringify(value);
  }
  for(const item of E.AHAS) {
    const b=document.createElement('button'); b.type='button'; b.dataset.aha=item.id;
    b.textContent=`${item.id} · ${item.title}`; b.disabled=true;
    b.addEventListener('click',()=>{
      try { trigger(item.id); say(`${item.id} 状态已载入；尚未执行全量验收。`); }
      catch(error) { say(`FAIL · ${error.message}`,'fail'); }
    }); catalog.append(b);
  }
  function loaded() {
    ready=Boolean(frame.contentDocument?.defaultView?.GlyphReview);
    run.disabled=!ready;
    catalog.querySelectorAll('button').forEach((b)=>{b.disabled=!ready;});
    if(!ready) { say('FAIL · 真实评审运行时未就绪，不能计为通过。','fail'); return; }
    try { trigger(selected); say('真实运行时已就绪。可逐项操作或验证全部 28 个 Aha。'); }
    catch(error) { say(`FAIL · ${error.message}`,'fail'); }
  }
  frame.addEventListener('load',loaded);
  if(frame.contentDocument?.readyState==='complete') loaded();
  run.addEventListener('click',async()=>{
    if(!ready||running) return;
    running=true; run.disabled=true;
    catalog.querySelectorAll('button').forEach((b)=>{b.disabled=true;});
    const results=[], previous=selected;
    try {
      const saved=progress();
      const revealsKey='glyph-factory-ui-reveals-v3';
      const reveals=frame.contentWindow.localStorage.getItem(revealsKey);
      for(const id of audit.ids) {
        say(`正在核验 ${id}：真实状态 + 动作效果…`);
        try { results.push(audit.exercise(trigger(id),id)); }
        catch(error) { results.push({id,pass:false,errors:[error.message]}); }
        await new Promise((resolve)=>requestAnimationFrame(resolve));
      }
      // 两种隔离各说各的：原来两个条件合成一句「进度或发现记录」，一旦真的坏了，
      // 读的人得自己再跑一遍才知道是哪一个。错误信息的作用就是省掉那一步。
      const saveChanged=progress()!==saved;
      const revealsChanged=frame.contentWindow.localStorage.getItem(revealsKey)!==reveals;
      if(saveChanged||revealsChanged) throw new Error(`评审改变了真实玩家的${saveChanged?'进度':''}${saveChanged&&revealsChanged?'和':''}${revealsChanged?'发现记录':''}`);
      const failed=results.filter((r)=>!r.pass);
      evidence.textContent=JSON.stringify(results,null,2);
      say(failed.length ? `FAIL · ${failed.map((r)=>r.id).join('、')}；详情见逐项证据。` : '28 / 28 PASS · 状态不变量、真实动作效果、终态与存档隔离全部通过。',failed.length?'fail':'pass');
    } catch(error) {
      evidence.textContent=JSON.stringify(results,null,2);
      say(`FAIL · ${error.message}`,'fail');
    } finally {
      try { trigger(previous); } catch(error) { say(`FAIL · ${error.message}`,'fail'); }
      running=false; run.disabled=!ready;
      catalog.querySelectorAll('button').forEach((b)=>{b.disabled=!ready;});
    }
  });
})();
