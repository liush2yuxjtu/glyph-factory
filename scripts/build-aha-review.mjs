import {cp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url), output=new URL('review-dist/',root);
if(process.env.VERCEL_ENV==='production') throw new Error('Refusing to build internal Aha review in production.');
const manifest=JSON.parse(await readFile(new URL('dist/build.json',root),'utf8'));
if(manifest.playerSpoilers!==false) throw new Error('Build the actual player artifact before the review site.');
await rm(output,{recursive:true,force:true});
await cp(new URL('dist/',root),output,{recursive:true});
await mkdir(new URL('review/',output),{recursive:true});
for(const file of ['glyph-engine-v3.js','glyph-game-v3.js','player-privacy-v3.js'])
  await cp(new URL(`public/${file}`,root),new URL(`review/${file}`,output));
let play=await readFile(new URL('public/play.html',root),'utf8');
play=play.replace('</head>',"<script>document.documentElement.dataset.audience='review'</script></head>")
  .replace(/src="\/(glyph-engine-v3|glyph-game-v3|player-privacy-v3)\.js"/g,'src="/review/$1.js"');
await writeFile(new URL('review/play.html',output),play);
let html=await readFile(new URL('public/aha.html',root),'utf8');
html=html.replace('src="/play.html?director=1"','src="/review/play.html?director=1"')
  .replace('src="/glyph-engine-v3.js"','src="/review/glyph-engine-v3.js"');
for(const file of ['aha.html','intent.html']) await writeFile(new URL(file,output),html);
await mkdir(new URL('aha-lab/',output),{recursive:true});
await writeFile(new URL('aha-lab/index.html',output),html);
for(const file of ['aha-review-contract.js','aha-review-ui.js']) await cp(new URL(`public/${file}`,root),new URL(file,output));
await cp(new URL('aha.md',root),new URL('aha.md',output));
console.log('Internal review site: review-dist/ (production player bytes + separate review runtime)');
