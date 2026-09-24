import json
def c(name, day, night, usage): return {"name":name,"value":{"day":day,"night":night},"usage":usage}
colors=[
 c("bg","#e6dcc0","#0f1411","Page ground behind every panel (the workbench). Text on it: ink, ink-muted."),
 c("panel","#f6efd9","#1a231e","Panel and button face. Text on it: ink, ink-muted, accent-ink, danger, review."),
 c("sunk","#d8cca8","#243029","Sunken wells: resource chips, disabled buttons, future act segments. Text on it: ink, ink-muted."),
 c("ink","#1a211b","#eeeed6","Primary text and pixel glyphs on bg, panel and sunk (≥10:1 both themes)."),
 c("ink-muted","#4d5645","#a8b39a","Secondary copy: button sub-lines, costs, captions, on bg / panel / sunk (≥4.8:1)."),
 c("outline","#1a211b","#7c9275","The 4px pixel frame around panels and buttons (≥4.7:1 on panel and bg)."),
 c("bevel-hi","#fffaf0","#2f3d35","Top-left inner highlight of a raised pixel button."),
 c("bevel-lo","#b3a57e","#080b09","Bottom-right inner shade of a raised pixel button; also the drop step under frames."),
 c("accent","#b8e25a","#b8e25a","Lamp-green fill: the major verb, done act segments, affordable. Text on it: on-accent only."),
 c("on-accent","#1a211b","#10160f","Text and glyphs on accent and lamp fills (≥10:1)."),
 c("accent-ink","#3a6410","#b8e25a","Green as text: gains (+0.18/s), 'done' labels, on panel and bg (≥5:1)."),
 c("lamp","#f0c23b","#f0c23b","Desk-lamp gold: micro-events (微事件), the live act segment marker, world lights. Text on it: on-accent."),
 c("danger","#a8361f","#ff8a66","Rust text and outlines for irreversible verbs (停止印刷) and noise, on panel and bg (≥4.7:1)."),
 c("danger-fill","#f2cdbf","#3a1c14","Face of a danger button. Text on it: on-danger."),
 c("on-danger","#5e1b0e","#ffc2ad","Label on danger-fill (≥8:1)."),
 c("review","#2c5d9e","#8cb6f0","Director / review surface only: outlines and text on panel and review-fill (≥5:1). Never on the player surface."),
 c("review-fill","#d6e3f5","#16243a","Director panel face. Text on it: ink or review."),
 c("term","#121814","#070a08","Workshop log terminal background (both themes stay dark)."),
 c("term-ink","#b8e25a","#b8e25a","Phosphor text of the newest log line on term (≥12:1)."),
 c("term-dim","#8aa676","#8aa676","Older log lines on term (≥6.6:1)."),
 c("world-sky","#2b3f4a","#101c24","Stage sky band behind the pixel scene."),
 c("world-ground","#5f6f4a","#27331f","Stage ground band."),
 c("world-block","#1c2c30","#0b1416","Scene silhouettes: desk, buildings, machines."),
 c("world-block-2","#36504c","#1d2f2d","Second silhouette depth: far buildings, shelf backs."),
 c("world-light","#eef0d8","#d9dcc0","Lit windows, paper sheets, stars in the scene."),
]
tokens={
 "name":"字工厂 像素","version":1,
 "color":{"themes":[{"id":"day","name":"日班 Day"},{"id":"night","name":"夜班 Night"}],"tokens":colors},
 "type":{
  "fonts":[{"family":"Fusion Pixel SC","file":"fonts/FusionPixel-12px-SC.woff2","weight":"400","style":"normal"},{"family":"Silkscreen","file":"fonts/Silkscreen-400.woff2","weight":"400","style":"normal"}],
  "families":{"pixel":"\"Fusion Pixel SC\", \"PingFang SC\", \"Microsoft YaHei\", monospace","display":"Silkscreen, \"Fusion Pixel SC\", monospace"},
  "groups":[
   {"name":"Display","family":"display","styles":[
     {"name":"display-xl","fontSize":"48px","lineHeight":"48px","fontWeight":400,"sample":"ACT VI","usage":"Act numerals and the ending title's Latin part. Silkscreen at 6× its 8px grid."},
     {"name":"display-num","fontSize":"24px","lineHeight":"24px","fontWeight":400,"sample":"135.6K","usage":"Resource values and rates. Latin digits only."}]},
   {"name":"Pixel CJK","family":"pixel","styles":[
     {"name":"title","fontSize":"36px","lineHeight":"40px","fontWeight":400,"sample":"从增长到沉默","usage":"Act title on the stage. 3× the 12px grid."},
     {"name":"heading","fontSize":"24px","lineHeight":"28px","fontWeight":400,"sample":"工坊日志","usage":"Panel heads, major verb labels. 2×."},
     {"name":"label","fontSize":"24px","lineHeight":"28px","fontWeight":400,"sample":"刻模：木 + 木 → 林","usage":"Every button label. 2× — never 18px or 20px: off-grid sizes blur the glyphs."},
     {"name":"body","fontSize":"12px","lineHeight":"18px","fontWeight":400,"sample":"还差 意义（12 / 30）","usage":"Button sub-lines, costs, captions, log lines. 1×."},
     {"name":"meta","fontSize":"12px","lineHeight":"16px","fontWeight":400,"letterSpacing":"1px","sample":"已自动保存 · 当前浏览器","usage":"Status line, save status, chip labels."}]}]},
 "spacing":{"tokens":[
   {"name":"px","value":"2px","usage":"One chrome pixel. Matches one glyph pixel at the 24px label size."},
   {"name":"space-1","value":"4px","usage":"Frame thickness step; icon-to-label gap."},
   {"name":"space-2","value":"8px","usage":"Inside chips; gap between stacked buttons."},
   {"name":"space-3","value":"12px","usage":"Button padding; gap in the action dock."},
   {"name":"space-4","value":"16px","usage":"Panel padding; page gutter at 390px."},
   {"name":"space-6","value":"24px","usage":"Between panels."},
   {"name":"space-8","value":"32px","usage":"Stage insets; between page sections at 1280px."},
   {"name":"touch","value":"48px","usage":"Minimum button height (above the 44px floor, on the 4px grid)."}]},
 "radius":{"note":"The system has no rounded corners. Corners are notched by the frame shadows instead (one chrome pixel cut from each corner).","tokens":[
   {"name":"radius-0","value":"0","usage":"Every panel, button, chip and segment."}]},
 "shadow":{"note":"Pixel frames are box-shadows, not borders: four 4px offsets leave each corner notched, like NES-era UI. Pressed = bevel inverted, element shifts down 4px.","tokens":[
   {"name":"frame","value":{"day":"0 -4px 0 0 #1a211b, 0 4px 0 0 #1a211b, -4px 0 0 0 #1a211b, 4px 0 0 0 #1a211b","night":"0 -4px 0 0 #7c9275, 0 4px 0 0 #7c9275, -4px 0 0 0 #7c9275, 4px 0 0 0 #7c9275"},"usage":"Notched 4px outline on panels and buttons."},
   {"name":"frame-drop","value":{"day":"0 -4px 0 0 #1a211b, 0 4px 0 0 #1a211b, -4px 0 0 0 #1a211b, 4px 0 0 0 #1a211b, 4px 8px 0 0 #b3a57e","night":"0 -4px 0 0 #7c9275, 0 4px 0 0 #7c9275, -4px 0 0 0 #7c9275, 4px 0 0 0 #7c9275, 4px 8px 0 0 #080b09"},"usage":"Frame plus a one-step hard drop: raised panels and enabled buttons."},
   {"name":"bevel","value":{"day":"inset -4px -4px 0 0 #b3a57e, inset 4px 4px 0 0 #fffaf0","night":"inset -4px -4px 0 0 #080b09, inset 4px 4px 0 0 #2f3d35"},"usage":"Raised face of an enabled button (combine after frame-drop)."},
   {"name":"bevel-press","value":{"day":"inset 4px 4px 0 0 #b3a57e","night":"inset 4px 4px 0 0 #080b09"},"usage":":active face; the drop disappears and the button moves down 4px."}]},
 "motion":None,
 "meta":{"source":"github","repo":"liush2yuxjtu/glyph-factory","ref":"main@b1330e6","paths":{"tokens":["public/design-system/tokens.css","public/play.html"],"screens":["scripts/flows/screens.json","scripts/flows/flows.json"]},"synced":"2026-09-24","note":"Pixel refactor of the v3 paper-and-ink system. Hues carried over (ink, paper, green, rust, blue, gold); values re-cut for a 2-theme pixel palette."}
}
del tokens["motion"]
import os
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(f"{D}/project/tokens.json","w",encoding="utf-8") as fh:
    json.dump(tokens,fh,ensure_ascii=False,indent=1)
