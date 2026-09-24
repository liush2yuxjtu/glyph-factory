def L(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    x,y=sorted([L(a),L(b)],reverse=True); return (x+0.05)/(y+0.05)
T={
'day':dict(bg='#e6dcc0',panel='#f6efd9',sunk='#d8cca8',ink='#1a211b',muted='#4d5645',line='#1a211b',accent='#b8e25a',accentink='#3a6410',lamp='#f0c23b',danger='#a8361f',dangerfill='#f2cdbf',ondanger='#5e1b0e',review='#2c5d9e',reviewfill='#d6e3f5',term='#121814',termink='#b8e25a',termdim='#8aa676',bevlo='#b3a57e'),
'night':dict(bg='#0f1411',panel='#1a231e',sunk='#243029',ink='#eeeed6',muted='#a8b39a',line='#7c9275',accent='#b8e25a',accentink='#b8e25a',lamp='#f0c23b',danger='#ff8a66',dangerfill='#3a1c14',ondanger='#ffc2ad',review='#8cb6f0',reviewfill='#16243a',term='#070a08',termink='#b8e25a',termdim='#8aa676',bevlo='#080b09'),
}
pairs=[('ink','panel'),('ink','bg'),('ink','sunk'),('muted','panel'),('muted','bg'),('muted','sunk'),('ink','accent'),('ink','lamp'),('accentink','panel'),('accentink','bg'),('danger','panel'),('danger','bg'),('ondanger','dangerfill'),('review','panel'),('review','reviewfill'),('ink','reviewfill'),('termink','term'),('termdim','term'),('line','panel'),('line','bg')]
for t,c in T.items():
    for a,b in pairs:
        A=c[a] if a!='ink' or True else None
        # on-accent/on-lamp use dark ink in both themes
        if t=='night' and b in('accent','lamp') and a=='ink': A='#10160f'
        r=cr(A,c[b]); print(t,a,'on',b,round(r,2),'' if r>=4.5 else ('>=3' if r>=3 else 'FAIL'))
