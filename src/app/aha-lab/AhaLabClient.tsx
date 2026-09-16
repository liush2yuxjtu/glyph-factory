"use client";

import { useRef, useState } from "react";

const AHAS = [
  ["A01", "机器替我按按钮"], ["A02", "员工组成编辑部"],
  ["A03", "木 + 木 → 林"], ["A04", "规则自动运行"], ["A05", "意义比字数值钱"],
  ["A06", "报纸制造需求"], ["A07", "读者开始回信"], ["A08", "读者自己造新词"],
  ["A09", "一个词突然传播"], ["A10", "纸张危机：少写"], ["A11", "删字第一次更值钱"],
  ["A12", "街区长出方言"], ["A13", "概念改变城市"], ["A14", "城市地图出现"],
  ["A15", "地图缩到世界"], ["A16", "记者 Agent 自己选题"], ["A17", "编辑第一次说“不”"],
  ["A18", "Agent 创造 Agent"], ["A19", "醒来已有八万篇"], ["A20", "数字出版：库存消失"],
  ["A21", "档案变机器记忆"], ["A22", "出现一个你没造过的字"], ["A23", "机器有自己的语言"],
  ["A24", "万亿文字 → 一个符号"], ["A25", "语言成为社会操作系统"], ["A26", "新资源：歧义"],
  ["A27", "目标从生产变删除"], ["A28", "最后按钮：停止印刷"],
] as const;

const style = {
  page: { minHeight: "100vh", background: "#d6d8c8", color: "#17201a", padding: "24px", fontFamily: "system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif" },
  shell: { maxWidth: "1500px", margin: "0 auto" },
  title: { fontSize: "clamp(34px,6vw,70px)", lineHeight: 1, margin: "8px 0 14px" },
  note: { maxWidth: "900px", lineHeight: 1.65, color: "#455047" },
  toolbar: { display: "flex", flexWrap: "wrap" as const, gap: "10px", margin: "18px 0" },
  button: { border: "2px solid #17201a", background: "#fffaf0", color: "#17201a", padding: "10px 13px", minHeight: "44px", fontWeight: 800, cursor: "pointer", boxShadow: "3px 3px 0 #17201a" },
  primary: { border: "2px solid #17201a", background: "#17201a", color: "#c8ef70", padding: "10px 14px", minHeight: "44px", fontWeight: 900, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "minmax(280px,380px) minmax(0,1fr)", gap: "18px", alignItems: "start" },
  catalog: { background: "#efe9d8", border: "2px solid #17201a", padding: "12px", maxHeight: "82vh", overflow: "auto" },
  item: { width: "100%", textAlign: "left" as const, border: "1px solid #98a28f", background: "#fffaf0", color: "#17201a", padding: "10px", marginBottom: "7px", cursor: "pointer" },
  active: { width: "100%", textAlign: "left" as const, border: "2px solid #17201a", background: "#c8ef70", color: "#17201a", padding: "10px", marginBottom: "7px", cursor: "pointer" },
  frameWrap: { background: "#17201a", border: "3px solid #17201a", boxShadow: "7px 7px 0 #87917e" },
  frame: { display: "block", width: "100%", height: "82vh", border: 0, background: "white" },
  status: { fontWeight: 800, margin: "10px 0 0" },
};

export default function AhaLabClient() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [selected, setSelected] = useState("A01");
  const [status, setStatus] = useState("等待游戏载入…");
  const [ready, setReady] = useState(false);

  function trigger(id: string, quiet = false) {
    const doc = frameRef.current?.contentDocument;
    const select = doc?.getElementById("director-select") as HTMLSelectElement | null;
    const preview = doc?.getElementById("director-preview") as HTMLButtonElement | null;
    const main = doc?.getElementById("main-game");
    if (!doc || !select || !preview || !main) {
      if (!quiet) setStatus("触发失败：真实游戏 Director 控件尚未就绪。");
      return false;
    }
    select.value = id;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    preview.click();
    setSelected(id);
    const actions = doc.querySelectorAll("#primary-actions button").length;
    if (!quiet) setStatus(`${id} 已触发 · 真实游戏已生成对应状态 · 当前可操作按钮 ${actions} 个`);
    return select.value === id && actions > 0;
  }

  async function verifyAll() {
    if (!ready) {
      setStatus("游戏还没载入完成，无法验证。");
      return;
    }
    setStatus("正在逐个验证 A01–A28…");
    const failed: string[] = [];
    for (const [id] of AHAS) {
      if (!trigger(id, true)) failed.push(id);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    trigger("A01", true);
    setSelected("A01");
    setStatus(failed.length ? `验证失败：${failed.join("、")}` : "28 / 28 已通过：每个 Aha 都能驱动真实游戏生成可操作状态。");
  }

  return (
    <main style={style.page}>
      <div style={style.shell}>
        <p style={{ fontWeight: 900, letterSpacing: ".14em", margin: 0 }}>INTERNAL · PREVIEW ONLY · 不进生产</p>
        <h1 style={style.title}>Aha Lab · 28 个可触发状态</h1>
        <p style={style.note}>这是设计与验收工具，不是玩家页面。左侧每个按钮都会驱动右侧真实游戏的 Director 状态；不是截图，也不是伪造的静态 mock-up。可以单点检查，也可以一次验证全部 28 个状态。生产环境会直接返回 404，避免把未来机制剧透给玩家。</p>
        <div style={style.toolbar}>
          <button type="button" style={style.primary} onClick={verifyAll}>验证全部 28 个 Aha</button>
          <button type="button" style={style.button} onClick={() => trigger(selected)}>重新触发 {selected}</button>
          <a href="/play.html" style={{ ...style.button, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>打开正常玩家版</a>
        </div>
        <p role="status" aria-live="polite" style={style.status}>{status}</p>
        <div style={style.grid}>
          <section style={style.catalog} aria-label="Aha 触发器">
            {AHAS.map(([id, title]) => (
              <button key={id} type="button" data-aha={id} style={selected === id ? style.active : style.item} onClick={() => trigger(id)}>
                <strong>{id}</strong> · {title}
              </button>
            ))}
          </section>
          <section style={style.frameWrap}>
            <iframe
              ref={frameRef}
              title="字工厂真实游戏 Aha 状态预览"
              src="/play.html?director=1"
              style={style.frame}
              onLoad={() => { setReady(true); setStatus("真实游戏已载入。选择左侧任意 Aha 开始检查。"); trigger("A01", true); }}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
