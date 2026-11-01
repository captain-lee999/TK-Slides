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
      '<img src="' + IMG('qtaste-emblem.png') + '" alt="Qtaste"><img src="' + IMG('borntaste-emblem.png') + '" alt="BORN TASTE"><img src="' + IMG('veggiegarden-emblem.png') + '" alt="베지가든" style="height:58px">'));
    if (!c.querySelector('.tk-tagline')) c.appendChild(el('p', { class: 'tk-tagline' }, 'Global Agility &amp; Growth'));
  }
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
