/* Glyph Factory Pixel — window.GlyphPixel. Plain HTML-string helpers (no React): sprites, pixel scenes,
   buttons, chips, and whole-screen renderers in two skins ("pixel" = the refactor, "classic" = v3 as shipped).
   Screen data = scripts/flows/screens.json + flows.json readings from liush2yuxjtu/glyph-factory@b1330e6. */
(function () {
  var DATA = __DATA__;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ── 12×12 sprites. k ink · w panel · b sunk · y lamp · a accent · r danger · . clear ── */
  var SPRITES = {
    glyph: ['kkkkkkkkkkkk', 'kwwwwwwwwwwk', 'kwwwwkkwwwwk', 'kwkkkkkkkkwk', 'kwkwwwwwwkwk', 'kwwwkkkkwwwk',
      'kwwwwwkwwwwk', 'kwkkkkkkkkwk', 'kwwwwwkwwwwk', 'kwwwwkkwwwwk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk'],
    coin: ['...kkkkkk...', '..kyyyyyyk..', '.kyyyyyyyyk.', 'kyyykkkkyyyk', 'kyyyk..kyyyk', 'kyyyk..kyyyk',
      'kyyyk..kyyyk', 'kyyykkkkyyyk', '.kyyyyyyyyk.', '..kyyyyyyk..', '...kkkkkk...', '............'],
    reader: ['............', '............', '....kkkk....', '..kkwwwwkk..', '.kwwwkkwwwk.', 'kwwwkkkkwwwk',
      'kwwwkkkkwwwk', '.kwwwkkwwwk.', '..kkwwwwkk..', '....kkkk....', '............', '............'],
    meaning: ['.....kk.....', '....kaak....', '...kaawak...', '..kaaaawak..', '.kaaaaaaaak.', 'kaaaaaaaaaak',
      '.kaaaaaaaak.', '..kaaaaaak..', '...kaaaak...', '....kaak....', '.....kk.....', '............'],
    noise: ['............', 'r.....r.....', '.r...r.r...r', '..r.r...r.r.', '...r.....r..', '............',
      '.r..r..r..r.', '............', 'r..r..r..r..', '............', '..r..r..r..r', '............'],
    lamp: ['...kkkkkk...', '..kyyyyyyk..', '.kyyyyyyyyk.', 'kkkkkkkkkkkk', '....y..y....', '...y....y...',
      '.....kk.....', '.....kk.....', '.....kk.....', '.....kk.....', '...kkkkkk...', '..kkkkkkkk..'],
    letter: ['............', '............', 'kkkkkkkkkkkk', 'kkwwwwwwwwkk', 'kwkwwwwwwkwk', 'kwwkwwwwkwwk',
      'kwwwkkkkwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '............', '............'],
    press: ['..kkkkkkkk..', '..kbbbbbbk..', '..kbkkkkbk..', 'kkkkkkkkkkkk', 'kwwwwwwwwwwk', 'kwkkwkkwkkwk',
      'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '.k........k.', '.k........k.', 'kkk......kkk', '............'],
    keyboard: ['............', '............', '............', 'kkkkkkkkkkkk', 'kwkwkwkwkwkk', 'kkkkkkkkkkkk',
      'kwkwkwkwkwkk', 'kkkkkkkkkkkk', 'kwkwwwwwwkwk', 'kkkkkkkkkkkk', '............', '............'],
    agent: ['.....kk.....', '.....ak.....', '..kkkkkkkk..', '..kwwwwwwk..', '..kwakkawk..', '..kwwwwwwk..',
      '..kwkkkkwk..', '..kkkkkkkk..', '.kkwwwwwwkk.', '.k.kwwwwk.k.', '...kwwwwk...', '...kk..kk...'],
    clock: ['...kkkkkk...', '..kwwwwwwk..', '.kwwwwkwwwk.', 'kwwwwwkwwwwk', 'kwwwwwkwwwwk', 'kwwwwwkkkwwk',
      'kwwwwwwwwwwk', 'kwwwwwwwwwwk', '.kwwwwwwwwk.', '..kwwwwwwk..', '...kkkkkk...', '............'],
    stop: ['............', '.rrrrrrrrrr.', '.rwwwwwwwwr.', '.rwrrrrrrwr.', '.rwrrrrrrwr.', '.rwrrrrrrwr.',
      '.rwrrrrrrwr.', '.rwrrrrrrwr.', '.rwrrrrrrwr.', '.rwwwwwwwwr.', '.rrrrrrrrrr.', '............'],
    city: ['............', '.......kkk..', '.kkk...kwk..', '.kwk...kkk..', '.kkk.kkkkkkk', 'kkkkkkwkwkwk',
      'kwkwkkkkkkkk', 'kkkkkkwkwkwk', 'kwkwkkkkkkkk', 'kkkkkkwkwkwk', 'kkkkkkkkkkkk', '............'],
    trash: ['....kkkk....', 'kkkkkkkkkkkk', '.kwwwwwwwwk.', '.kwkwkwkwwk.', '.kwkwkwkwwk.', '.kwkwkwkwwk.',
      '.kwkwkwkwwk.', '.kwkwkwkwwk.', '.kwwwwwwwwk.', '..kkkkkkkk..', '............', '............']
  };
  var INK = { k: 'var(--ink)', w: 'var(--panel)', b: 'var(--sunk)', y: 'var(--lamp)', a: 'var(--accent)', r: 'var(--danger)' };

  function spriteRects(rows, map, ox, oy) {
    var out = '';
    for (var y = 0; y < rows.length; y++) {
      var row = rows[y], x = 0;
      while (x < row.length) {
        var ch = row[x];
        if (ch === '.') { x++; continue; }
        var run = 1;
        while (x + run < row.length && row[x + run] === ch) run++;
        out += '<rect x="' + (ox + x) + '" y="' + (oy + y) + '" width="' + run + '" height="1" fill="' + map[ch] + '"/>';
        x += run;
      }
    }
    return out;
  }

  function sprite(name, size, map) {
    var rows = SPRITES[name] || SPRITES.glyph;
    size = size || 24;
    return '<svg class="gp-sprite" viewBox="0 0 12 12" width="' + size + '" height="' + size +
      '" shape-rendering="crispEdges" aria-hidden="true">' + spriteRects(rows, map || INK, 0, 0) + '</svg>';
  }

  /* ── Scenes: a 96×40 pixel stage per world scale ── */
  var SCALE = { '桌面': 'desk', DESK: 'desk', '城市': 'city', CITY: 'city', '传播网络': 'network', NETWORK: 'network',
    '机器语言': 'machine', MACHINE: 'machine', '世界': 'world', WORLD: 'world', '静默': 'silence', SILENCE: 'silence' };
  var W = { k: 'var(--world-block)', w: 'var(--world-light)', b: 'var(--world-block-2)', y: 'var(--lamp)', a: 'var(--accent)', r: 'var(--danger)' };

  function rect(x, y, w, h, fill) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>'; }
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  function scene(scale, opts) {
    opts = opts || {};
    var kind = SCALE[scale] || scale || 'desk', r = rnd(7), g = '';
    var dark = kind === 'silence' || kind === 'machine' || kind === 'network';
    g += rect(0, 0, 96, 30, 'var(--world-sky)');
    g += rect(0, 30, 96, 10, kind === 'machine' ? 'var(--world-block)' : 'var(--world-ground)');
    if (dark) for (var s = 0; s < 18; s++) g += rect(Math.floor(r() * 96), Math.floor(r() * 26), 1, 1, 'var(--world-light)');
    if (kind === 'desk') {
      g += rect(10, 28, 60, 2, 'var(--world-block)') + rect(12, 30, 2, 8, 'var(--world-block)') + rect(66, 30, 2, 8, 'var(--world-block)');
      g += spriteRects(SPRITES.lamp, W, 12, 16);
      g += spriteRects(SPRITES.keyboard, W, 28, 18);
      g += rect(46, 22, 10, 6, 'var(--world-light)') + rect(47, 20, 10, 2, 'var(--world-light)') + rect(48, 18, 8, 2, 'var(--world-light)');
      g += spriteRects(SPRITES.press, W, 74, 18);
    } else if (kind === 'city') {
      var x = 0;
      while (x < 96) {
        var w = 5 + Math.floor(r() * 7), h = 8 + Math.floor(r() * 18), far = r() > 0.5;
        g += rect(x, 30 - h, w, h, far ? 'var(--world-block-2)' : 'var(--world-block)');
        for (var wy = 30 - h + 2; wy < 28; wy += 3) for (var wx = x + 1; wx < x + w - 1; wx += 2) if (r() > 0.55) g += rect(wx, wy, 1, 1, r() > 0.8 ? 'var(--lamp)' : 'var(--world-light)');
        x += w + 1;
      }
      g += rect(44, 24, 6, 6, 'var(--lamp)') + rect(46, 26, 2, 4, 'var(--world-block)');
    } else if (kind === 'network') {
      var pts = [[8, 22], [22, 10], [36, 20], [50, 8], [62, 18], [76, 11], [88, 23], [48, 26]];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], sx = Math.min(a[0], b[0]);
        g += rect(sx, a[1], Math.abs(b[0] - a[0]) + 1, 1, 'var(--world-block-2)') + rect(b[0], Math.min(a[1], b[1]), 1, Math.abs(b[1] - a[1]) + 1, 'var(--world-block-2)');
      }
      pts.forEach(function (p, j) { g += rect(p[0] - 1, p[1] - 1, 3, 3, j % 3 ? 'var(--accent)' : 'var(--lamp)'); });
      g += spriteRects(SPRITES.agent, W, 42, 28 - 12);
    } else if (kind === 'machine') {
      for (var gy = 0; gy < 3; gy++) for (var gx = 0; gx < 9; gx++) {
        var ox = 4 + gx * 10, oy = 4 + gy * 9;
        g += rect(ox, oy, 8, 7, 'var(--world-block)');
        for (var p = 0; p < 9; p++) if (r() > 0.45) g += rect(ox + 1 + (p % 3) * 2, oy + 1 + Math.floor(p / 3) * 2, 2, 1, (gx + gy) % 4 ? 'var(--accent)' : 'var(--world-light)');
      }
    } else if (kind === 'world') {
      var cx = 48, cy = 20, R = 13;
      for (var yy = -R; yy <= R; yy++) {
        var half = Math.floor(Math.sqrt(R * R - yy * yy));
        g += rect(cx - half, cy + yy, half * 2 + 1, 1, 'var(--world-block-2)');
        for (var xx = -half; xx <= half; xx += 2) if (Math.sin(xx * 0.5 + yy * 0.7) > 0.35) g += rect(cx + xx, cy + yy, 2, 1, 'var(--accent)');
      }
      for (var q = 0; q < 10; q++) { var t = q / 10 * Math.PI * 2; g += rect(Math.round(cx + Math.cos(t) * 20) - 1, Math.round(cy + Math.sin(t) * 9) - 1, 2, 2, 'var(--lamp)'); }
    } else if (kind === 'silence') {
      g += rect(10, 28, 60, 2, 'var(--world-block)') + rect(12, 30, 2, 8, 'var(--world-block)') + rect(66, 30, 2, 8, 'var(--world-block)');
      g += spriteRects(SPRITES.lamp, { k: 'var(--world-block)', y: 'var(--world-block-2)', w: 'var(--world-block)' }, 12, 16);
      g += rect(40, 26, 12, 2, 'var(--world-light)');
    }
    return '<svg class="gp-scene" viewBox="0 0 96 40" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" role="img" aria-label="' + esc(scale || '') + '">' + g + '</svg>';
  }

  /* ── Small components ── */
  var RES_ICON = { '库存文字': 'glyph', '工坊资金': 'coin', '读者': 'reader', '意义': 'meaning', '噪音': 'noise' };
  function chip(label, value) {
    return '<div class="gp-chip">' + sprite(RES_ICON[label] || 'glyph', 24) +
      '<span class="gp-chip-v">' + esc(value) + '</span><span class="gp-chip-l">' + esc(label) + '</span></div>';
  }
  function verbIcon(a) {
    var l = a.l;
    if (a.x) return 'stop';
    if (a.e) return 'letter';
    if (/印字/.test(l)) return 'glyph';
    if (/出售|资金/.test(l)) return 'coin';
    if (/删除/.test(l)) return 'trash';
    if (/Agent|智能体|机器|训练/.test(l)) return 'agent';
    if (/城市|地图|告示|方言|概念|街/.test(l)) return 'city';
    if (/发行|推钟|加班|新一期|投产|喂/.test(l)) return 'clock';
    if (/读者|词|来信/.test(l)) return 'reader';
    if (/压缩|意义|刻模|歧义/.test(l)) return 'meaning';
    return 'press';
  }
  function button(a, extra) {
    var cls = 'gp-btn' + (a.m ? ' is-major' : '') + (a.e ? ' is-event' : '') + (a.x ? ' is-danger' : '') + (extra ? ' ' + extra : '');
    return '<button class="' + cls + '"' + (a.d ? ' disabled' : '') + ' type="button">' + sprite(verbIcon(a), 24) +
      '<span class="gp-btn-t"><span class="gp-btn-l">' + esc(a.l) + '</span>' +
      (a.e ? '<span class="gp-tag">微事件</span>' : '') +
      (a.s ? '<span class="gp-btn-s">' + esc(a.s) + '</span>' : '') + '</span></button>';
  }
  function actTrack(states, surface) {
    var names = ['I', 'II', 'III', 'IV', 'V', 'VI'], out = '';
    for (var i = 0; i < 6; i++) {
      var st = states[i];
      if (!st && surface === 'player') continue; // undiscovered acts render nothing at all
      out += '<span class="gp-seg is-' + (st || 'future') + '" title="ACT ' + names[i] + '">' + names[i] + '</span>';
    }
    return '<div class="gp-track" role="list">' + out + '</div>';
  }
  function logTerm(lines, title) {
    return '<div class="gp-log"><div class="gp-log-h">' + esc(title || '工坊日志') + '</div>' +
      lines.map(function (l, i) { return '<p class="' + (i ? '' : 'is-new') + '">' + esc(l) + '</p>'; }).join('') + '</div>';
  }
  function machine(m) {
    var name = m.n, icon = /键盘/.test(name) ? 'keyboard' : /打字员/.test(name) ? 'agent' : 'press';
    return '<div class="gp-machine' + (m.d ? ' is-off' : '') + '">' + sprite(icon, 36) +
      '<div><div class="gp-machine-n">' + esc(name) + '</div><div class="gp-machine-t">' + esc(m.t || '') + '</div></div>' +
      '<button class="gp-btn gp-btn-sm" type="button"' + (m.d ? ' disabled' : '') + '>购买</button></div>';
  }

  /* ── Screen: the pixel refactor ── */
  function pixelScreen(s) {
    var desktop = /^1280/.test(s.viewport), review = s.surface === 'review';
    var acts = s.actions.slice(), primary = null;
    for (var i = 0; i < acts.length; i++) if (acts[i].m && !acts[i].d && !acts[i].x) { primary = acts.splice(i, 1)[0]; break; }
    var events = acts.filter(function (a) { return a.e; });
    var rest = acts.filter(function (a) { return !a.e; });
    var kick = s.actKicker.split('·')[0].trim();
    var hud = '<header class="gp-hud"><span class="gp-stamp">字</span><span class="gp-brand">字工厂</span>' +
      '<span class="gp-status"><i></i>' + esc(s.status.split('·')[0].trim()) + '</span>' +
      '<span class="gp-rate">' + esc(s.rate) + '<small>/s</small></span></header>';
    var director = review ? '<div class="gp-director"><b>导演预览</b><span>' + esc(s.ahaId) + '</span><span>' + esc(s.ahaTitle || '—') +
      '</span><span class="gp-director-n">' + esc(s.ahaCount) + '</span></div>' : '';
    var stage = '<section class="gp-stage">' + scene(s.worldScale) +
      '<div class="gp-stage-t"><span class="gp-kick">' + esc(kick) + '</span><h2>' + esc(s.actTitle) + '</h2></div>' +
      actTrack(s.acts, s.surface) + '</section><p class="gp-copy">' + esc(s.actCopy) + '</p>';
    var res = '<div class="gp-res">' + s.metrics.map(function (m) { return chip(m.l, m.v); }).join('') + '</div>';
    var dock = '<div class="gp-dock">' + (primary ? button(primary, 'is-primary') : '') +
      (events.length ? '<div class="gp-events">' + events.map(function (a) { return button(a); }).join('') + '</div>' : '') +
      '<div class="gp-grid">' + rest.map(function (a) { return button(a); }).join('') + '</div></div>';
    var mach = s.machines_on && s.machines.length ? '<div class="gp-panel"><div class="gp-panel-h">机器</div>' + s.machines.map(machine).join('') + '</div>' : '';
    var world = s.world_on ? '<div class="gp-world">' + s.world.map(function (w) { return '<div><span>' + esc(w[0]) + '</span><b>' + esc(w[1]) + '</b></div>'; }).join('') + '</div>' : '';
    var ending = s.ending ? '<div class="gp-ending"><h3>' + esc(s.endingTitle) + '</h3><p>车间安静下来。去读它。</p></div>' : '';
    var foot = '<footer class="gp-foot">' + esc(s.saveStatus) + '</footer>';
    if (desktop) {
      return '<div class="gp-screen gp-pixel is-desktop">' + hud + director + '<div class="gp-cols"><div>' + stage + res + world + logTerm(s.log) + '</div><div>' + dock + mach + ending + '</div></div>' + foot + '</div>';
    }
    return '<div class="gp-screen gp-pixel">' + hud + director + stage + res + dock + world + mach + logTerm(s.log) + ending + foot + '</div>';
  }

  /* ── Screen: v3 as shipped (comparison skin; mirrors public/play.html structure) ── */
  function classicScreen(s) {
    var review = s.surface === 'review';
    var h = '<div class="gp-screen gp-classic' + (/^1280/.test(s.viewport) ? ' is-desktop' : '') + '">';
    h += '<header class="c-mast"><div><div class="c-eyebrow">GLYPH//FACTORY</div><h1>字工厂</h1></div><span class="c-stamp">字</span></header>';
    h += '<div class="c-status">' + esc(s.status) + ' · ' + esc(s.rate) + '/s · 累计 ' + esc(s.total) + '</div>';
    if (review) h += '<div class="c-director">DIRECTOR · ' + esc(s.ahaId) + ' · ' + esc(s.ahaCount) + '</div>';
    if (review) h += '<div class="c-acts">' + s.acts.map(function (st, i) { return '<span class="c-chip ' + st + '">ACT ' + (i + 1) + '</span>'; }).join('') + '</div>';
    h += '<div class="c-act"><div class="c-kick">' + esc(s.actKicker) + '</div><h2>' + esc(s.actTitle) + '</h2><p>' + esc(s.actCopy) + '</p></div>';
    h += '<div class="c-metrics">' + s.metrics.map(function (m, i) { return '<div class="c-metric' + (i ? '' : ' primary') + '"><span>' + esc(m.l) + '</span><b>' + esc(m.v) + '</b></div>'; }).join('') + '</div>';
    h += '<div class="c-actions">' + s.actions.map(function (a) {
      return '<button type="button" class="' + (a.m ? 'major ' : '') + (a.x ? 'danger' : '') + '"' + (a.d ? ' disabled' : '') + '><b>' + esc(a.l) + '</b><small>' + esc(a.s) + '</small></button>';
    }).join('') + '</div>';
    if (s.world_on) h += '<div class="c-world"><div class="c-world-h">' + esc(s.worldScale) + '</div>' + s.world.map(function (w) { return '<div><span>' + esc(w[0]) + '</span><b>' + esc(w[1]) + '</b></div>'; }).join('') + '</div>';
    if (s.machines_on && s.machines.length) h += '<div class="c-panel"><div class="c-panel-h">系统</div>' + s.machines.map(function (m) { return '<div class="c-machine"><b>' + esc(m.n) + '</b><small>' + esc(m.t) + '</small></div>'; }).join('') + '</div>';
    h += '<div class="c-log">' + s.log.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>';
    if (s.ending) h += '<div class="c-ending">' + esc(s.endingTitle) + '</div>';
    return h + '<footer class="c-foot">' + esc(s.saveStatus) + '</footer></div>';
  }

  function screen(s, skin) { return skin === 'classic' ? classicScreen(s) : pixelScreen(s); }

  /* A scaled, fixed-size thumbnail frame around a rendered screen. */
  function thumb(s, skin, width) {
    var native = /^1280/.test(s.viewport) ? 1280 : 390, k = width / native;
    return '<div class="gp-thumb" style="width:' + width + 'px"><div class="gp-thumb-in" style="width:' + native + 'px;transform:scale(' + k + ')">' + screen(s, skin) + '</div></div>';
  }
  function fitThumbs(root) {
    var list = (root || document).querySelectorAll('.gp-thumb');
    for (var i = 0; i < list.length; i++) {
      var t = list[i], inner = t.firstChild, k = parseFloat(/scale\(([^)]+)\)/.exec(inner.style.transform)[1]);
      t.style.height = Math.ceil(inner.offsetHeight * k) + 'px';
    }
  }

  /* Segmented toggle: opts = [{value,label}], returns HTML; wire with bindToggle. */
  function toggle(name, opts, current) {
    return '<div class="gp-toggle" role="radiogroup" data-toggle="' + esc(name) + '">' + opts.map(function (o) {
      return '<button type="button" role="radio" aria-checked="' + (o.value === current) + '" data-value="' + esc(o.value) + '">' + esc(o.label) + '</button>';
    }).join('') + '</div>';
  }
  function bindToggle(root, onChange) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.gp-toggle button');
      if (!b) return;
      var g = b.parentNode;
      Array.prototype.forEach.call(g.children, function (x) { x.setAttribute('aria-checked', String(x === b)); });
      onChange(g.getAttribute('data-toggle'), b.getAttribute('data-value'));
    });
  }

  window.GlyphPixel = {
    data: DATA, esc: esc, sprites: Object.keys(SPRITES), sprite: sprite, scene: scene,
    chip: chip, button: button, actTrack: actTrack, logTerm: logTerm, machine: machine,
    screen: screen, thumb: thumb, fitThumbs: fitThumbs, toggle: toggle, bindToggle: bindToggle
  };
})();
