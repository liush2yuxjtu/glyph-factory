// intent.md → public/intent.html。
//
//   node scripts/build-intent.mjs
//
// 为什么用生成而不是手写两份：用户意图这份文档的价值全在「原话照抄」。
// 手写两份 HTML/Markdown 的那一刻起，就一定有一份会先过期，而最先过期的往往是原话。
// 和 aha 那一对的关键区别：aha.md / public/aha.html 是**两份各自维护**的产物
// （HTML 那边有 iframe 评审台，本来就不是 Markdown 能表达的），intent 这一对是
// 同一份内容的两副面孔，所以必须机器同步。
//
// 渲染函数是导出的，所以 `tests/intent-audit.test.mjs` 能拿它当场重算一遍、和入库的
// HTML 逐字节比。**「生成物会不会漂」只能这样守**：只断言「HTML 里有 U7」是守不住的——
// 改完 intent.md 忘了重新生成，那条断言照样绿，而过期的正是读者看到的那一份。
// 同一个道理让 fit-rhythm.mjs 也把函数导出去：能重算的东西就别只做存在性检查。
//
// 支持的 Markdown 子集就是这份文档用到的那几种：标题、引用、粗体、行内码、
// 有序/无序列表、表格、分隔线、链接。不做通用渲染器。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');

export function renderIntent(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2">$2</a>');

  const out = [];
  let para = [], list = null, quote = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote>${quote.map((q) => `<p>${inline(q)}</p>`).join('')}</blockquote>`); quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { flushAll(); continue; }
    if (/^---+$/.test(line)) { flushAll(); out.push('<hr>'); continue; }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { flushAll(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    if (/^>\s?/.test(line)) { flushPara(); flushList(); quote.push(line.replace(/^>\s?/, '')); continue; }
    // 表格：连续以 | 开头的行整块处理
    if (/^\|/.test(line)) {
      flushAll();
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i += 1; }
      i -= 1;
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`
        + `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    const ul = line.match(/^[-*]\s+(.*)$/), ol = line.match(/^\d+\.\s+(.*)$/);
    if (ul || ol) {
      flushPara(); flushQuote();
      const tag = ul ? 'ul' : 'ol';
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push((ul || ol)[1]);
      continue;
    }
    // 缩进的续行属于上一条列表项，不是新段落。没有这一支的话，intent.md 里每一条换行写
    // 的长条目都会被切成「一个单词的列表 + 一段脱离编号的正文」——生成页看上去像坏了，
    // 而所有断言照样全绿。
    if (list && /^\s+\S/.test(line)) { list.items[list.items.length - 1] += ` ${line.trim()}`; continue; }
    flushQuote(); flushList();
    para.push(line.trim());
  }
  flushAll();

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>字工厂 · 用户意图登记表</title>
<meta name="robots" content="noindex,nofollow">
<style>
:root{--ink:#17201a;--paper:#efe9d8;--panel:#fffaf0;--muted:#657064;--line:#bcc4ae;--green:#c8ef70;--rust:#a34e34}
*{box-sizing:border-box}
body{margin:0;background:#cfd4c2;color:var(--ink);font:14px/1.65 system-ui,-apple-system,"PingFang SC",sans-serif}
.page{max-width:860px;margin:auto;min-height:100vh;background:var(--paper);padding:28px clamp(16px,4vw,42px) 72px}
h1{font-size:clamp(26px,5vw,40px);line-height:1.15;margin:.2em 0 .4em}
h2{font-size:19px;margin:34px 0 10px;padding-top:14px;border-top:2px solid var(--ink)}
h3{font-size:15px;margin:20px 0 6px}
p{margin:9px 0}
blockquote{margin:10px 0;padding:10px 14px;background:var(--panel);border-left:4px solid var(--rust);font-style:normal}
blockquote p{margin:2px 0;font-weight:600}
code{background:#e8e3d4;padding:2px 5px;font-size:12.5px}
a{color:var(--rust)}
hr{border:0;border-top:1px solid var(--line);margin:26px 0}
table{width:100%;border-collapse:collapse;font-size:13px;margin:12px 0}
th,td{border:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}
th{background:#e8e3d4;font-size:12px}
ul,ol{margin:8px 0;padding-left:22px}
li{margin:5px 0}
.note{margin:0 0 22px;padding:12px 14px;border:1.5px solid var(--ink);background:var(--green);font-weight:600}
.foot{margin-top:34px;color:var(--muted);font-size:12px;text-align:center}
</style>
</head>
<body><main class="page">
<p class="note">本页由 <code>node scripts/build-intent.mjs</code> 从 <code>intent.md</code> 生成——改需求改 Markdown，不要改这里。</p>
${out.join('\n')}
<p class="foot">用户意图真源：<code>intent.md</code> · 实现契约真源：<code>aha.md</code> · 两者不再互为副本</p>
</main></body></html>
`;
}

// 入口判定用规范化路径比，不比 basename：basename 撞名会误判，而 Windows 上
// `split('/')` 连切都切不开（这个仓库目前只跑 macOS/Linux，但那是运维事实、不是代码契约）。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const html = renderIntent(readFileSync(`${ROOT}/intent.md`, 'utf8'));
  writeFileSync(`${ROOT}/public/intent.html`, html);
  console.log(`written public/intent.html · ${html.length} chars`);
}
