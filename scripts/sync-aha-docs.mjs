import {copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
await copyFile(new URL('aha.md',root),new URL('intent.md',root));
await copyFile(new URL('public/aha.html',root),new URL('public/intent.html',root));
await copyFile(new URL('aha.md',root),new URL('public/aha.md',root));
console.log('Canonical Aha sources synchronized to legacy Intent aliases.');
