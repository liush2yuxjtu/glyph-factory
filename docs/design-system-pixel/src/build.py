import json,re,os
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src=open(f'{D}/src/bundle.src.js',encoding='utf-8').read().replace('__DATA__',open(f'{D}/src/data.json',encoding='utf-8').read())
assert '</script' not in src.lower() and '<!--' not in src
open(f'{D}/project/components/bundle.js','w',encoding='utf-8').write(src)
