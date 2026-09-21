// aha.md → public/aha.md。
//
//   node scripts/sync-aha-docs.mjs
//
// 2026-09-21 之前这个脚本还把 aha.md 复制成 intent.md、把 aha.html 复制成
// public/intent.html，让它们逐字节一致。用户要求「intent 各自独立」，所以：
//
//   aha.md            ←→ public/aha.html     两份各自维护（HTML 那边有 iframe 评审台，
//                                            本来就不是 Markdown 能表达的）
//   intent.md         →  public/intent.html  同一份内容的两副面孔，由 scripts/build-intent.mjs 生成
//
// 三份也不再互为副本：aha 是 Aha/披露契约（怎么实现），intent 是用户意图（要实现成什么样）。
// 这个脚本现在只剩一件事——把 Aha 契约发到 public/ 供评审页读取。
import {copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
await copyFile(new URL('aha.md',root),new URL('public/aha.md',root));
console.log('aha.md → public/aha.md。intent.md / public/intent.html 已独立，用 node scripts/build-intent.mjs 生成。');
