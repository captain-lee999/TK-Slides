/* TK Slides Kit v1 — 장표 틀(엠블럼·쪽번호), 표지 이미지, 차트(막대·워터폴·일정표), 글자 맞춤, 화면 배율 */
(function () {
  var me = document.currentScript && document.currentScript.src;
  var BASE = me ? me.replace(/[^\/]*$/, '') : '';
  var IMG = function (n) { return BASE + 'img/' + n; };
  var C = {
    prior: '#b7b7b7', target: '#073763', navy: '#4a6fa5', key: '#1f497d', green: '#4b7545', keyg: '#1e5a32',
    up: '#0070c0', down: '#c00000', end: '#404040', ink: '#000', label: '#404040', line: '#a6a6a6', red: '#c0504d'
  };
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (tag === 'img') e.crossOrigin = 'anonymous';
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function parse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function fmt(v) { return typeof v === 'number' ? v.toLocaleString('en-US') : v; }
  var NS = 'http://www.w3.org/2000/svg';
  function sv(tag, a, txt) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    if (txt != null) e.textContent = txt;
    return e;
  }

  /* 막대: data-items='[["’25",2527,"prior"],["’26",2660],["’27(G)",2770,"key","2,770억"]]' data-unit="억" data-dir="h" */
  function bars(box) {
    var items = parse(box.getAttribute('data-items')) || [];
    if (!items.length) return;
    var hz = box.getAttribute('data-dir') === 'h';
    var W = box.clientWidth || 300, H = box.clientHeight || 160;
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none' });
    var max = Math.max.apply(null, items.map(function (i) { return Math.abs(+i[1] || 0); })) || 1;
    var n = items.length;
    items.forEach(function (it, i) {
      var v = +it[1] || 0, kind = it[2] || 'navy', lab = it[3] || fmt(v);
      var col = C[kind] || kind;
      if (hz) {
        var lw = Math.min(110, W * 0.3), bh = (H / n) * 0.62, y = (H / n) * i + (H / n - bh) / 2;
        var bw = (W - lw - 70) * Math.abs(v) / max;
        svg.appendChild(sv('text', { x: lw - 6, y: y + bh / 2 + 4, 'text-anchor': 'end', 'font-size': 11, fill: C.ink, 'font-family': 'Noto Sans KR' }, it[0]));
        svg.appendChild(sv('rect', { x: lw, y: y, width: Math.max(2, bw), height: bh, fill: col }));
        svg.appendChild(sv('text', { x: lw + bw + 5, y: y + bh / 2 + 4, 'font-size': 12, 'font-weight': 700, fill: kind === 'down' || v < 0 ? C.down : C.ink }, lab));
      } else {
        var top = 18, bottom = 18, slot = W / n, bw2 = Math.min(56, slot * 0.55);
        var h = (H - top - bottom) * Math.abs(v) / max, x = slot * i + (slot - bw2) / 2, y2 = H - bottom - h;
        svg.appendChild(sv('rect', { x: x, y: y2, width: bw2, height: Math.max(2, h), fill: col }));
        svg.appendChild(sv('text', { x: x + bw2 / 2, y: y2 - 4, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: v < 0 ? C.down : C.ink }, lab));
        svg.appendChild(sv('text', { x: x + bw2 / 2, y: H - 4, 'text-anchor': 'middle', 'font-size': 11, fill: C.label, 'font-family': 'Noto Sans KR' }, it[0]));
      }
    });
    if (!hz) svg.appendChild(sv('line', { x1: 0, x2: W, y1: H - 18, y2: H - 18, stroke: C.line, 'stroke-width': 1 }));
    box.innerHTML = ''; box.appendChild(svg);
  }

  /* 워터폴: data-steps='[["’26 실적",2660,"base"],["단가",-30],["물량",110],["’27 목표",null,"end"]]' data-floor="2400" */
  function waterfall(box) {
    var steps = parse(box.getAttribute('data-steps')) || [];
    if (!steps.length) return;
    var floor = +(box.getAttribute('data-floor') || 0);
    var W = box.clientWidth || 360, H = box.clientHeight || 170, top = 20, bottom = 20;
    var lv = 0, sp = steps.map(function (s) {
      var v = s[1], k = s[2] || (v < 0 ? 'down' : 'up'), a, b;
      if (k === 'base' || k === 'end') { a = floor; b = v == null ? lv : +v; lv = b; }
      else if (k === 'down' || v < 0) { k = 'down'; a = lv - Math.abs(v); b = lv; lv = a; }
      else { a = lv; b = lv + Math.abs(v); lv = b; }
      return { a: a, b: b, k: k, s: s };
    });
    var mx = Math.max.apply(null, sp.map(function (x) { return x.b; })) * 1.06;
    function y(v) { return top + (H - top - bottom) * (1 - (v - floor) / (mx - floor)); }
    var n = sp.length, slot = W / n, bw = Math.min(54, slot * 0.58);
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none' });
    sp.forEach(function (x, i) {
      var cx = slot * i + (slot - bw) / 2, col = x.k === 'up' ? C.up : x.k === 'down' ? C.down : x.k === 'end' ? C.end : C.prior;
      svg.appendChild(sv('rect', { x: cx, y: y(x.b), width: bw, height: Math.max(2, y(x.a) - y(x.b)), fill: col }));
      var txt = x.s[3] || (x.k === 'up' ? '+' + fmt(Math.abs(x.s[1])) : x.k === 'down' ? '-' + fmt(Math.abs(x.s[1])) : fmt(x.b));
      svg.appendChild(sv('text', { x: cx + bw / 2, y: y(x.b) - 5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: x.k === 'up' ? C.up : x.k === 'down' ? C.down : C.ink }, txt));
      svg.appendChild(sv('text', { x: cx + bw / 2, y: H - 5, 'text-anchor': 'middle', 'font-size': 11, fill: C.label, 'font-family': 'Noto Sans KR' }, x.s[0]));
      if (i < n - 1) {
        var lvl = x.k === 'down' ? x.a : x.b;
        svg.appendChild(sv('line', { x1: cx + bw, x2: cx + slot, y1: y(lvl), y2: y(lvl), stroke: C.line, 'stroke-dasharray': '3 2' }));
      }
    });
    svg.appendChild(sv('line', { x1: 0, x2: W, y1: H - bottom, y2: H - bottom, stroke: C.line }));
    box.innerHTML = ''; box.appendChild(svg);
  }

  /* 일정표: <div class="tk-gantt" data-periods="1Q,2Q,3Q,4Q"><div data-from="1" data-to="2" data-task="과제">설명</div>…</div> */
  function gantt(box) {
    var per = (box.getAttribute('data-periods') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var tasks = Array.prototype.slice.call(box.children);
    if (!per.length) return;
    var lw = box.getAttribute('data-label') || '150px';
    box.style.gridTemplateColumns = lw + ' repeat(' + per.length + ', 1fr)';
    box.innerHTML = '';
    box.appendChild(el('div', { class: 'tk-gh' }, '과 제'));
    per.forEach(function (p) { box.appendChild(el('div', { class: 'tk-gh' }, p)); });
    tasks.forEach(function (t, r) {
      var row = r + 2, f = +(t.getAttribute('data-from') || 1), to = +(t.getAttribute('data-to') || f);
      var tt = el('div', { class: 'tk-gt' }, t.getAttribute('data-task') || '');
      tt.style.gridRow = row; tt.style.gridColumn = 1; box.appendChild(tt);
      for (var c = 0; c < per.length; c++) { var g = el('div', { class: 'tk-gc' }); g.style.gridRow = row; g.style.gridColumn = c + 2; box.appendChild(g); }
      var b = el('div', { class: 'tk-gb ' + (t.className || '') }, t.innerHTML);
      b.style.gridRow = row; b.style.gridColumn = (f + 1) + ' / ' + (to + 2); box.appendChild(b);
    });
  }

  function overflowing(body) {
    if (body.scrollHeight > body.clientHeight + 2) return true;
    var all = body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.scrollHeight > e.clientHeight + 3 && e.clientHeight > 0) {
        var ov = getComputedStyle(e).overflowY;
        if (ov === 'hidden' || ov === 'auto' || ov === 'clip') return true;
      }
      if (e.getBoundingClientRect().bottom > body.getBoundingClientRect().bottom + 2) return true;
    }
    return false;
  }
  function fit(slide) {
    var body = slide.querySelector('.tk-body');
    if (!body) return;
    var fs = 12;
    slide.removeAttribute('data-overflow');
    slide.style.setProperty('--fs', fs + 'px');
    slide.style.setProperty('--gap', '8px');
    while (overflowing(body) && fs > 9.5) {
      fs -= 0.5;
      slide.style.setProperty('--fs', fs + 'px');
      slide.style.setProperty('--gap', Math.max(4, Math.round(fs * 0.6)) + 'px');
    }
    slide.setAttribute('data-fs', fs);
    if (overflowing(body)) slide.setAttribute('data-overflow', 'yes');
  }

  function frame(slide, page) {
    if (!slide.querySelector('.tk-emblem')) slide.appendChild(el('img', { class: 'tk-emblem', src: IMG('veggiegarden-emblem.png'), alt: '' }));
    if (!slide.querySelector('.tk-page')) slide.appendChild(el('span', { class: 'tk-page' }, String(page)));
    var lead = slide.querySelector('.tk-lead');
    if (lead) {
      var bottom = lead.offsetTop + lead.offsetHeight + 8;
      slide.style.setProperty('--body-top', Math.max(122, bottom) + 'px');
    }
  }
  function cover(c) {
    if (!c.querySelector('.tk-tree-img')) c.insertBefore(el('img', { class: 'tk-tree-img', src: IMG('cover-tree.png'), alt: '' }), c.firstChild);
    if (c.getAttribute('data-wordmark') !== 'no' && !c.querySelector('.tk-mark')) c.appendChild(el('img', { class: 'tk-mark', src: IMG('nongshimtaekyung-wordmark.png'), alt: '농심태경' }));
    if (!c.querySelector('.tk-logos')) c.appendChild(el('div', { class: 'tk-logos' },
      '<img crossorigin="anonymous" src="' + IMG('qtaste-emblem.png') + '" alt="Qtaste"><img crossorigin="anonymous" src="' + IMG('borntaste-emblem.png') + '" alt="BORN TASTE"><img crossorigin="anonymous" src="' + IMG('veggiegarden-emblem.png') + '" alt="베지가든" style="height:58px">'));
    if (!c.querySelector('.tk-tagline')) c.appendChild(el('p', { class: 'tk-tagline' }, 'Global Agility &amp; Growth'));
  }
  /* 장식 요소를 실제 요소로 넣음 — 화면과 PPT 내보내기가 같은 모양을 쓰게 */
  function decorate() {
    document.querySelectorAll('.tk-slide, .tk-toc').forEach(function (s) {
      if (!s.querySelector(':scope > .tk-rule')) s.insertBefore(el('div', { class: 'tk-rule' }), s.firstChild);
    });
    document.querySelectorAll('.tk-shift').forEach(function (s) {
      if (!s.querySelector(':scope > .tk-tri')) s.appendChild(el('div', { class: 'tk-tri', 'data-shape': 'tri-r' }));
    });
    document.querySelectorAll('.tk-chain > .tk-node + .tk-node').forEach(function (n) {
      if (!n.querySelector(':scope > .tk-arrow')) n.appendChild(el('div', { class: 'tk-arrow', 'data-shape': 'tri-r' }));
    });
    document.querySelectorAll('.tk-tree').forEach(function (t) {
      if (!t.querySelector(':scope > .tk-tree-link')) t.appendChild(el('div', { class: 'tk-tree-link' }));
      var br = t.querySelector(':scope > .tk-branches');
      if (br && !br.querySelector(':scope > .tk-vline')) br.insertBefore(el('div', { class: 'tk-vline' }), br.firstChild);
      t.querySelectorAll('.tk-branch').forEach(function (b) {
        if (!b.querySelector(':scope > .tk-hline')) b.appendChild(el('div', { class: 'tk-hline' }));
      });
    });
    document.querySelectorAll('.tk-matrix').forEach(function (m) {
      if (!m.querySelector(':scope > .tk-axis-y')) m.appendChild(el('div', { class: 'tk-axis-y' }, m.getAttribute('data-y') || ''));
      if (!m.querySelector(':scope > .tk-axis-x')) m.appendChild(el('div', { class: 'tk-axis-x' }, m.getAttribute('data-x') || ''));
    });
    document.querySelectorAll('.tk-steps > li > .tk-h').forEach(function (h, i) {
      h.setAttribute('data-shape', h.parentNode === h.parentNode.parentNode.firstElementChild ? 'homePlate' : 'chevron');
    });
    document.querySelectorAll('.tk-roof').forEach(function (r) { r.setAttribute('data-shape', 'trapezoid'); });
    document.querySelectorAll('.tk-funnel > li > b').forEach(function (b) { b.setAttribute('data-shape', 'trapezoid-down'); });
  }

  /* ── PPT 내보내기: 화면의 상자·글자·도식을 편집 가능한 도형으로 옮김 (PptxGenJS) ── */
  var PPTX_SRC = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
  function loadLib(cb) {
    if (window.PptxGenJS) return cb();
    var s = document.createElement('script');
    s.src = window.TK_PPTX_SRC || PPTX_SRC;
    s.onload = cb;
    s.onerror = function () { alert('PPT 변환 도구를 불러오지 못했습니다. 인터넷 연결을 확인해 주십시오.'); };
    document.head.appendChild(s);
  }
  function hex(c) {
    var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || '');
    if (!m) return null;
    if (m[4] !== undefined && +m[4] === 0) return null;
    return [m[1], m[2], m[3]].map(function (v) { var h = Math.round(+v).toString(16); return h.length < 2 ? '0' + h : h; }).join('').toUpperCase();
  }
  function pxf(v) { return parseFloat(v) || 0; }
  var INLINE = { B: 1, STRONG: 1, EM: 1, I: 1, SPAN: 1, SMALL: 1, A: 1, BR: 1, SUP: 1, SUB: 1, U: 1 };
  function pseudoText(e, which) {
    var c = getComputedStyle(e, which).content;
    if (!c || c === 'none' || c === 'normal') return '';
    if (/counter\(/.test(c)) {
      var li = e.closest('li'), i = 1, n = li;
      while (n && (n = n.previousElementSibling)) i++;
      var tail = /"([^"]*)"\s*$/.exec(c);
      return i + (tail ? tail[1] : '');
    }
    var q = /^"(.*)"$/.exec(c);
    return q ? q[1].replace(/\\"/g, '"') : '';
  }
  function runsOf(node) {
    var runs = [], nodes = [];
    function style(e) {
      var cs = getComputedStyle(e);
      return { color: hex(cs.color) || '000000', bold: (+cs.fontWeight || 400) >= 600, fontSize: Math.round(pxf(cs.fontSize) * 2) / 2,
        italic: false, fontFace: /Arial/.test(cs.fontFamily.split(',')[0]) ? 'Arial' : 'Noto Sans KR' };
    }
    var pre = pseudoText(node, '::before');
    if (pre) {
      var ps = getComputedStyle(node, '::before');
      var o = style(node); o.color = hex(ps.color) || o.color;
      runs.push({ text: pre + (/\s$/.test(pre) ? '' : ' '), options: o });
    }
    (function walk(n) {
      Array.prototype.forEach.call(n.childNodes, function (c) {
        if (c.nodeType === 3) {
          var tx = c.nodeValue.replace(/\s+/g, ' ');
          if (tx.trim() || (runs.length && tx === ' ')) { runs.push({ text: tx, options: style(n) }); if (tx.trim()) nodes.push(c); }
        } else if (c.nodeType === 1 && INLINE[c.tagName] && getComputedStyle(c).display.indexOf('inline') === 0) {
          if (c.tagName === 'BR') runs.push({ text: '', options: { breakLine: true } });
          else walk(c);
        }
      });
    })(node);
    if (runs.length) { runs[0].text = runs[0].text.replace(/^\s+/, ''); runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, ''); }
    runs = runs.filter(function (r) { return r.text !== '' || (r.options && r.options.breakLine); });
    runs.nodes = nodes;
    return runs;
  }
  function textRect(nodes) {
    var u = null, rg = document.createRange();
    nodes.forEach(function (n) {
      rg.selectNodeContents(n);
      Array.prototype.forEach.call(rg.getClientRects(), function (q) {
        if (q.width < 0.5 && q.height < 0.5) return;
        if (!u) u = { left: q.left, top: q.top, right: q.right, bottom: q.bottom };
        else { u.left = Math.min(u.left, q.left); u.top = Math.min(u.top, q.top); u.right = Math.max(u.right, q.right); u.bottom = Math.max(u.bottom, q.bottom); }
      });
    });
    return u;
  }
  function exportPPT(btn) {
    btn.disabled = true; btn.textContent = 'PPT 만드는 중…';
    loadLib(function () {
      var deck = document.querySelector('.tk-deck'), oldZoom = deck.style.zoom;
      deck.style.zoom = '';
      try {
        var P = new window.PptxGenJS();
        P.defineLayout({ name: 'A4L', width: 11.693, height: 8.268 });
        P.layout = 'A4L';
        P.title = document.title;
        var K = 11.693 / 842, S = P.ShapeType || P.shapes;
        document.querySelectorAll('.tk-cover, .tk-toc, .tk-slide').forEach(function (sl) {
          var slide = P.addSlide(), B = sl.getBoundingClientRect();
          function box(r) { return { x: (r.left - B.left) * K, y: (r.top - B.top) * K, w: Math.max(0.01, r.width * K), h: Math.max(0.01, r.height * K) }; }
          function inside(r) { return r.width > 0.5 && r.height > 0.2 && r.right > B.left && r.left < B.right && r.bottom > B.top && r.top < B.bottom; }
          function shape(kind, b, opt) {
            var o = Object.assign({}, b, opt);
            if (kind === 'tri-r') { var cx = o.x + o.w / 2, cy = o.y + o.h / 2, w = o.w, h = o.h; o.w = h; o.h = w; o.x = cx - h / 2; o.y = cy - w / 2; o.rotate = 90; kind = S.triangle; }
            else if (kind === 'trapezoid-down') { kind = S.trapezoid; o.flipV = true; }
            else if (kind === 'trapezoid') kind = S.trapezoid;
            else if (kind === 'chevron') kind = S.chevron;
            else if (kind === 'homePlate') kind = S.homePlate;
            else if (kind === 'line') kind = S.line;
            else kind = S.rect;
            slide.addShape(kind, o);
          }
          function svg(sv) {
            sv.querySelectorAll('rect, line, text').forEach(function (g) {
              var r = g.getBoundingClientRect(); if (!inside(r) && g.tagName !== 'line') return;
              var b = box(r);
              if (g.tagName === 'rect') shape('rect', b, { fill: { color: hex(getComputedStyle(g).fill) || 'BFBFBF' }, line: { type: 'none' } });
              else if (g.tagName === 'line') {
                var dash = g.getAttribute('stroke-dasharray');
                shape('line', b, { line: { color: hex(getComputedStyle(g).stroke) || 'A6A6A6', width: 0.75, dashType: dash ? 'dash' : 'solid' } });
              } else {
                var cs = getComputedStyle(g), pad = 0.08;
                slide.addText(g.textContent, { x: b.x - pad, y: b.y - 0.02, w: b.w + pad * 2, h: b.h + 0.04, margin: 0, align: 'center', valign: 'middle',
                  fontFace: 'Arial', fontSize: pxf(g.getAttribute('font-size')) || 11, bold: (g.getAttribute('font-weight') || '') === '700', color: hex(cs.fill) || '000000', fit: 'none' });
              }
            });
          }
          (function visit(e) {
            if (e.nodeType !== 1) return;
            var cs = getComputedStyle(e);
            if (cs.display === 'none' || cs.visibility === 'hidden') return;
            if (e.tagName === 'svg') return svg(e);
            var r = e.getBoundingClientRect();
            if (e.tagName === 'IMG') {
              if (inside(r) && e.src) {
                var o = box(r);
                if (cs.objectFit === 'cover' && e.naturalWidth) o.sizing = { type: 'cover', w: o.w, h: o.h };
                else if (e.naturalWidth) { var ar = e.naturalWidth / e.naturalHeight, bw = o.w, bh = o.h; if (bw / bh > ar) { o.w = bh * ar; o.x += (bw - o.w) / 2; } else { o.h = bw / ar; o.y += (bh - o.h) / 2; } }
                var data = null;
                try { var cv = document.createElement('canvas'); cv.width = e.naturalWidth; cv.height = e.naturalHeight; cv.getContext('2d').drawImage(e, 0, 0); data = cv.toDataURL('image/png'); } catch (x) { data = null; }
                if (data) { o.data = data; slide.addImage(o); }
              }
              return;
            }
            if (inside(r) || e === sl) {
              var b = box(r), fill = hex(cs.backgroundColor), kind = e.getAttribute('data-shape');
              var bw = ['Top', 'Right', 'Bottom', 'Left'].map(function (s) { return cs['border' + s + 'Style'] !== 'none' ? pxf(cs['border' + s + 'Width']) : 0; });
              var bc = ['Top', 'Right', 'Bottom', 'Left'].map(function (s) { return hex(cs['border' + s + 'Color']); });
              var uniform = bw[0] > 0 && bw.every(function (v) { return v === bw[0]; }) && bc.every(function (v) { return v === bc[0]; });
              var outline = cs.outlineStyle !== 'none' && pxf(cs.outlineWidth) > 0 ? { color: hex(cs.outlineColor), width: pxf(cs.outlineWidth) } : null;
              if (e !== sl && (fill || uniform || outline)) {
                shape(kind || 'rect', b, { fill: fill ? { color: fill } : { type: 'none' },
                  line: outline ? outline : uniform ? { color: bc[0] || 'BFBFBF', width: bw[0] } : { type: 'none' } });
              }
              if (!uniform) {
                var t = (r.top - B.top) * K, l = (r.left - B.left) * K;
                if (bw[0]) shape('rect', { x: l, y: t, w: b.w, h: bw[0] * K }, { fill: { color: bc[0] || 'BFBFBF' }, line: { type: 'none' } });
                if (bw[2]) shape('rect', { x: l, y: t + b.h - bw[2] * K, w: b.w, h: bw[2] * K }, { fill: { color: bc[2] || 'BFBFBF' }, line: { type: 'none' } });
                if (bw[3]) shape('rect', { x: l, y: t, w: bw[3] * K, h: b.h }, { fill: { color: bc[3] || 'BFBFBF' }, line: { type: 'none' } });
                if (bw[1]) shape('rect', { x: l + b.w - bw[1] * K, y: t, w: bw[1] * K, h: b.h }, { fill: { color: bc[1] || 'BFBFBF' }, line: { type: 'none' } });
              }
              var runs = runsOf(e);
              if (runs.length) {
                var vert = cs.writingMode.indexOf('vertical') === 0;
                var ctr = cs.textAlign === 'center' || (cs.display.indexOf('flex') >= 0 && (cs.flexDirection.indexOf('column') === 0 ? cs.alignItems === 'center' : cs.justifyContent === 'center'));
                var right = cs.textAlign === 'right';
                var lh = pxf(cs.lineHeight);
                var o2 = { margin: 0, valign: 'top', align: ctr ? 'center' : right ? 'right' : 'left', fit: 'none', wrap: true, paraSpaceBefore: 0, paraSpaceAfter: 0 };
                if (lh) o2.lineSpacing = lh;
                var u = textRect(runs.nodes);
                if (vert || !u) {
                  var cx2 = b.x + b.w / 2, cy2 = b.y + b.h / 2;
                  Object.assign(o2, vert ? { w: b.h, h: b.w, x: cx2 - b.h / 2, y: cy2 - b.w / 2, rotate: 270, align: 'center', valign: 'middle' } : b);
                } else {
                  if (pseudoText(e, '::before')) {
                    var ps2 = getComputedStyle(e, '::before');
                    var start = ps2.position === 'absolute' ? r.left : r.left + pxf(cs.paddingLeft) + Math.min(0, pxf(cs.textIndent));
                    if (cs.display.indexOf('flex') >= 0) start = r.left + pxf(cs.paddingLeft);
                    u.left = Math.min(u.left, start);
                  }
                  var w = u.right - u.left, slack = Math.max(6, w * 0.06);
                  var x = u.left - B.left, wid = w + slack;
                  if (ctr) x -= slack / 2; else if (right) x -= slack;
                  var lineFix = lh && pxf(cs.fontSize) ? Math.max(0, (lh - pxf(cs.fontSize) * 1.2) / 2) : 0;
                  Object.assign(o2, { x: x * K, y: (u.top - B.top - lineFix) * K, w: wid * K, h: Math.max(0.12, (u.bottom - u.top + lineFix * 2) * K) });
                  if ((u.bottom - u.top) < (lh || pxf(cs.fontSize) * 1.4) * 1.5) o2.wrap = false;
                }
                slide.addText(runs, o2);
              }
            }
            Array.prototype.forEach.call(e.children, function (c) {
              if (INLINE[c.tagName] && getComputedStyle(c).display.indexOf('inline') === 0) return;
              visit(c);
            });
          })(sl);
        });
        P.write({ outputType: 'blob' }).then(function (blob) {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = (document.title || 'TK 장표') + '.pptx';
          document.body.appendChild(a); a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
          done2();
        }, function (er) { alert('PPT 저장 중 오류: ' + er); done2(); });
      } catch (err) { console.error(err); alert('PPT 변환 중 오류: ' + err.message); done2(); }
      function done2() { deck.style.zoom = oldZoom; btn.disabled = false; btn.textContent = 'PPT 내보내기'; }
    });
  }
  window.TKExportPPT = function () { exportPPT(document.querySelector('.tk-export') || { set disabled(v) {}, set textContent(v) {} }); };

  function zoom() {
    if (window.matchMedia && window.matchMedia('print').matches) return;
    var deck = document.querySelector('.tk-deck');
    if (!deck) return;
    var z = Math.min(1, (window.innerWidth - 16) / 842);
    deck.style.zoom = z < 1 ? z : '';
  }
  function run() {
    var slides = document.querySelectorAll('.tk-slide, .tk-cover, .tk-toc');
    if (!slides.length) return;
    var deck = document.querySelector('.tk-deck');
    if (!deck) {
      deck = el('main', { class: 'tk-deck' });
      slides[0].parentNode.insertBefore(deck, slides[0]);
      Array.prototype.forEach.call(slides, function (s) { deck.appendChild(s); });
    }
    decorate();
    if (!document.querySelector('.tk-export') && document.body.getAttribute('data-export') !== 'no') {
      var bt = el('button', { class: 'tk-export', type: 'button' }, 'PPT 내보내기');
      bt.addEventListener('click', function () { exportPPT(bt); });
      document.body.appendChild(bt);
    }
    Array.prototype.forEach.call(slides, function (s, i) {
      if (s.classList.contains('tk-cover')) cover(s);
      else frame(s, i + 1);
    });
    document.querySelectorAll('.tk-bars').forEach(bars);
    document.querySelectorAll('.tk-wf').forEach(waterfall);
    document.querySelectorAll('.tk-gantt').forEach(gantt);
    document.querySelectorAll('.tk-slide').forEach(fit);
    document.querySelectorAll('.tk-bars').forEach(bars);
    document.querySelectorAll('.tk-wf').forEach(waterfall);
    zoom();
    window.addEventListener('resize', zoom);
    setTimeout(function () {
      document.querySelectorAll('.tk-slide').forEach(fit);
      document.querySelectorAll('.tk-bars').forEach(bars);
      document.querySelectorAll('.tk-wf').forEach(waterfall);
      window.TK_SLIDES_READY = true;
    }, 350);
  }
  var done = false;
  function go() { if (done) return; done = true; run(); }
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
})();
