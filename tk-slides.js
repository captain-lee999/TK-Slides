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
        var maxL = Math.max.apply(null, items.map(function (t) { return String(t[0]).length; }));
        var lw = Math.min(W * 0.45, Math.max(60, maxL * 11.5 + 10)), bh = Math.min(42, (H / n) * 0.62), y = (H / n) * i + (H / n - bh) / 2;
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
      if (t.hasAttribute('data-at')) {
        var at = +t.getAttribute('data-at'), ms = el('div', { class: 'tk-ms', 'data-shape': 'diamond' });
        ms.style.gridRow = row; ms.style.gridColumn = at + 1; box.appendChild(ms);
        var lab = el('div', { class: 'tk-mslab' }, t.innerHTML); lab.style.gridRow = row; lab.style.gridColumn = at + 1; box.appendChild(lab);
        return;
      }
      var b = el('div', { class: 'tk-gb ' + (t.className || '') }, t.innerHTML);
      b.style.gridRow = row; b.style.gridColumn = (f + 1) + ' / ' + (to + 2); box.appendChild(b);
    });
  }

  var BOXOV = '.tk-main, .tk-aux, .tk-card, .tk-list, .tk-sp, .tk-tr > span, .tk-vf, .tk-ccols > div, .tk-rc, .tk-road li, .tk-bf > span, .tk-g2, .tk-tl, .tk-rad, .tk-vc, .tk-cz, .tk-effect, .tk-dc, .tk-pillars > div, .tk-node, .tk-q, .tk-branch, .tk-roles > div, .tk-lc, .tk-sr > span, td, th, .tk-cnode, .tk-spoke, .tk-ev, .tk-steps > li, .tk-case > span, .tk-sum, .tk-facts > div';
  function overflowing(body) {
    if (body.scrollHeight > body.clientHeight + 2) return true;
    var br = body.getBoundingClientRect(), bx = body.querySelectorAll(BOXOV);
    for (var q = 0; q < bx.length; q++) {
      var b = bx[q];
      if (b.scrollHeight > b.clientHeight + 3 && (b.clientHeight > 0 || b.matches('.tk-main, .tk-aux'))) return true;
      var r = b.getBoundingClientRect(); if (r.bottom > br.bottom + 2 || r.right > br.right + 2) return true;
    }
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
    slide.removeAttribute('data-overflow'); slide.classList.remove('tk-slack');
    slide.style.setProperty('--fs', fs + 'px');
    slide.style.setProperty('--gap', '8px');
    slide.style.removeProperty('--lh');
    while (overflowing(body) && fs > 10.5) {
      fs -= 0.5;
      slide.style.setProperty('--fs', fs + 'px');
      slide.style.setProperty('--gap', Math.max(4, Math.round(fs * 0.6)) + 'px');
      slide.style.setProperty('--lh', '1.36');
    }
    /* 사다리 ⓪: 빈 면이 크면 덱당 2장 제한으로 빠진 사실 띠·안 쓴 예비 사실(tk-spare)을 먼저 꺼냄 */
    /* 사다리 ⓪: 빈 면이 크면 덱당 2장 제한으로 빠진 사실 띠·안 쓴 예비 사실을 꺼냄 — 먼저 관련 칸 안의 줄(tk-spli), 다음 아래 패널(tk-spare). 오른쪽 세로 칸은 쓰지 않음 */
    var spl = Array.prototype.slice.call(body.querySelectorAll('.tk-spli')), spare = body.querySelector('.tk-spare');
    var setOn = function (els, on) { els.forEach(function (e) { e.classList.toggle('tk-on', on); }); drawAll(slide); };
    var dyn = body.querySelector('.tk-spare.tk-dyn'); if (dyn) { dyn.remove(); if (spare === dyn) spare = null; }
    if ((spl.length || spare) && slide.getAttribute('data-grow') !== 'no') {
      setOn(spl, false); if (spare) { setOn([spare], false); spare.querySelectorAll('.tk-from-spl').forEach(function (x) { x.remove(); }); }
      var left = [];
      if (spl.length && emptiness(body).empty > 0.06) {
        setOn(spl, true);
        for (var k = spl.length - 1; k >= 0 && overflowing(body); k--) { setOn([spl[k]], false); left.unshift(spl[k]); }
      } else left = spl.slice();
      /* 칸 안에 못 넣은 줄: 이 장에 다른 아래 블록이 없을 때만 아래 패널로 옮겨 봄 */
      /* 아래 패널이 이미 있으면 칸에 못 넣은 줄을 그 패널에 합침 */
      if (left.length && spare && !spare.classList.contains('tk-dyn')) {
        var spr = spare.querySelector('.tk-spr'); spare.querySelectorAll('.tk-from-spl').forEach(function (x) { x.remove(); });
        left.forEach(function (e) { var t = e.cloneNode(true), tg = t.querySelector('.tk-sptag'); if (tg) tg.remove(); var d = el('div', { class: 'tk-from-spl' + (e.classList.contains('tk-spq') ? ' tk-spq' : '') }, '<span>' + t.innerHTML + '</span>'); spr.appendChild(d); });
        left = [];
      }
      if (left.length && !spare && !body.querySelector(':scope > .tk-facts, :scope > .tk-road, :scope > .tk-fchips')) {
        dyn = el('div', { class: 'tk-spare tk-dyn' }, '<p class="tk-spl">참고 사실</p><div class="tk-spr">' + left.map(function (e) { var q = e.classList.contains('tk-spq'), t = e.cloneNode(true); var tg = t.querySelector('.tk-sptag'); if (tg) tg.remove(); return '<div' + (q ? ' class="tk-spq"' : '') + '><span>' + t.innerHTML + '</span></div>'; }).join('') + '</div>');
        var after = body.querySelector(':scope > .tk-mainwrap') || body.lastElementChild; after.parentNode.insertBefore(dyn, after.nextSibling);
        setOn([dyn], true); if (overflowing(body)) { dyn.remove(); drawAll(slide); }
      }
      if (spare) { setOn([spare], true); if (overflowing(body)) setOn([spare], false); }
    }
    /* 빈 면이 많으면 글자를 키워 면을 채움(최대 14px) */
    if (fs === 12 && slide.getAttribute('data-grow') !== 'no') {
      var cap = 14;
      while (fs < cap && emptiness(body).empty > 0.1) {
        fs += 0.5; slide.style.setProperty('--fs', fs + 'px'); slide.style.setProperty('--gap', Math.round(fs * 0.7) + 'px'); slide.style.setProperty('--lh', (1.45 + (fs - 12) * 0.03).toFixed(2));
        if (overflowing(body)) { fs -= 0.5; slide.style.setProperty('--fs', fs + 'px'); slide.style.setProperty('--gap', Math.round(fs * 0.7) + 'px'); slide.style.setProperty('--lh', (1.45 + (fs - 12) * 0.03).toFixed(2)); break; }
      }
    }
    /* 글자는 14까지만 — 그래도 비면 줄 사이·칸 안 여백을 넓혀 고르게 채움(글자 크기 통일 유지) */
    slide.style.removeProperty('--spread');
    if (fs >= 12 && slide.getAttribute('data-grow') !== 'no') {
      var sp = 0;
      while (sp < 14 && emptiness(body).empty > 0.1) {
        sp += 2; slide.style.setProperty('--spread', sp + 'px');
        if (overflowing(body)) { sp -= 2; slide.style.setProperty('--spread', sp + 'px'); break; }
      }
    }
    /* 사다리 ④: 글자는 그대로, 도형만 키움(원·셰브론·번호 점·가운데 원) */
    slide.style.removeProperty('--shape');
    if (slide.getAttribute('data-grow') !== 'no' && body.querySelector('.tk-circ, .tk-chvh, .tk-vdot, .tk-tldot, .tk-radcore, .tk-g2h, .tk-trk')) {
      var sc = 1;
      while (sc < 1.5 && emptiness(body).empty > 0.1) {
        sc = +(sc + 0.1).toFixed(1); slide.style.setProperty('--shape', sc);
        if (overflowing(body)) { sc = +(sc - 0.1).toFixed(1); slide.style.setProperty('--shape', sc); break; }
      }
    }
    /* 그래도 빈 면이 크면: 도식을 늘리지 않고 내용 높이로 줄인 뒤 남는 높이를 바깥 여백으로 */
    if (fs >= 12 && slide.getAttribute('data-grow') !== 'no' && emptiness(body).empty > 0.14) {
      slide.classList.add('tk-slack');
      if (overflowing(body)) slide.classList.remove('tk-slack');
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

  /* ══ v2: 차트 · 순환 · 허브 · 레인 · 배치 탐색 ══════════════════ */
  var PAL = ['#1f497d', '#9dc3e6', '#b7b7b7', '#4b7545', '#7f7f7f'];
  function numv(v) { if (typeof v === 'number') return v; var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }
  function legend(box, series, colorOf) {
    if (series.length < 2) return;
    var lg = el('div', { class: 'tk-legend' });
    series.forEach(function (s, i) { lg.appendChild(el('span', null, '<i style="background:' + colorOf(s, i) + '"></i>' + s.name)); });
    box.parentNode.insertBefore(lg, box);
  }
  /* <div class="tk-chart tk-plot" data-type="group|stack|line|combo" data-cats='["’25","’26"]' data-series='[{"name":"농심","values":[1,2]},{"name":"이익률","values":[3,4],"kind":"line"}]' data-key="1" data-unit="억"> */
  function plot(box) {
    var type = box.getAttribute('data-type') || 'group';
    var cats = parse(box.getAttribute('data-cats')) || [], series = parse(box.getAttribute('data-series')) || [];
    if (!cats.length || !series.length) return;
    var key = box.hasAttribute('data-key') ? +box.getAttribute('data-key') : -1;
    if (type === 'slope') return slope(box, cats, series, key);
    if (type === 'pct') series = series.map(function (s) { return Object.assign({}, s, { values: s.values.map(function (v, ci) { var t = series.reduce(function (a, q) { return a + numv(q.values[ci]); }, 0) || 1; return numv(v) / t * 100; }) }); });
    var prev = box.previousElementSibling; if (prev && prev.classList.contains('tk-legend')) prev.remove();
    var colorOf = function (s, i) { return s.color || (series.length === 1 ? (C.navy) : PAL[i % PAL.length]); };
    legend(box, series, colorOf);
    var W = box.clientWidth || 360, H = box.clientHeight || 180, top = 20, bot = 20, n = cats.length, slot = W / n;
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none' });
    var bars = series.filter(function (s) { return (s.kind || (type === 'line' ? 'line' : 'bar')) === 'bar'; });
    var lines = series.filter(function (s) { return (s.kind || (type === 'line' ? 'line' : 'bar')) === 'line'; });
    var stack = type === 'stack' || type === 'pct';
    var bmax = 0;
    cats.forEach(function (c, ci) {
      var sum = 0; bars.forEach(function (s) { var v = numv(s.values[ci]); sum += v; if (!stack) bmax = Math.max(bmax, v); });
      if (stack) bmax = Math.max(bmax, sum);
    });
    bmax = type === 'pct' ? 100 : (bmax * 1.12 || 1);
    var ph = H - top - bot;
    cats.forEach(function (c, ci) {
      var gw = Math.min(slot * 0.7, stack ? 58 : 34 * Math.max(1, bars.length)), x0 = slot * ci + (slot - gw) / 2;
      var acc = 0;
      bars.forEach(function (s, si) {
        var v = numv(s.values[ci]), h = ph * v / bmax, bw = stack ? gw : gw / bars.length;
        var x = stack ? x0 : x0 + bw * si, y = stack ? H - bot - acc - h : H - bot - h;
        var col = colorOf(s, series.indexOf(s));
        if (key >= 0 && ci !== key && series.length === 1) col = C.prior;
        svg.appendChild(sv('rect', { x: x + (stack ? 0 : 1), y: y, width: Math.max(2, bw - (stack ? 0 : 2)), height: Math.max(1, h), fill: col }));
        var lab = s.labels && s.labels[ci] ? s.labels[ci] : fmt(s.values[ci]);
        if (stack) { if (h > 13) svg.appendChild(sv('text', { x: x + bw / 2, y: y + h / 2 + 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: si === 0 && col === PAL[0] ? '#fff' : C.ink }, lab)); }
        else svg.appendChild(sv('text', { x: x + bw / 2, y: y - 4, 'text-anchor': 'middle', 'font-size': bars.length > 2 ? 10 : 12, 'font-weight': 700, fill: C.ink }, lab));
        acc += h;
      });
      if (stack && type !== 'pct') svg.appendChild(sv('text', { x: x0 + gw / 2, y: H - bot - acc - 5, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.ink }, fmt(bars.reduce(function (a, s) { return a + numv(s.values[ci]); }, 0))));
      svg.appendChild(sv('text', { x: slot * ci + slot / 2, y: H - 5, 'text-anchor': 'middle', 'font-size': 11, fill: ci === key ? C.ink : C.label, 'font-weight': ci === key ? 700 : 400, 'font-family': 'Noto Sans KR' }, c));
    });
    var allL = [].concat.apply([], lines.map(function (s) { return s.values.map(numv); }));
    lines.forEach(function (s, li) {
      var vals = s.values.map(numv), mx = Math.max.apply(null, bars.length ? vals : allL), mn = Math.min.apply(null, bars.length ? vals : allL);
      var zoom = box.getAttribute('data-zoom') === '1' && lines.length === 1;
      var lo = bars.length || zoom ? mn - (mx - mn || Math.abs(mx) * 0.1 || 1) * 0.6 : Math.min(0, mn), hi = mx + (mx - lo) * 0.15 || 1;
      var pts = vals.map(function (v, ci) { return [slot * ci + slot / 2, top + 6 + (ph - 12) * (1 - (v - lo) / (hi - lo || 1))]; });
      var col = s.color || (bars.length ? '#c0504d' : PAL[li % PAL.length]);
      for (var k = 0; k < pts.length - 1; k++) svg.appendChild(sv('line', { x1: pts[k][0], y1: pts[k][1], x2: pts[k + 1][0], y2: pts[k + 1][1], stroke: col, 'stroke-width': 2.2 }));
      pts.forEach(function (p, ci) {
        svg.appendChild(sv('circle', { cx: p[0], cy: p[1], r: 3.6, fill: '#fff', stroke: col, 'stroke-width': 2 }));
        var below = !bars.length && lines.some(function (o) { return o !== s && numv(o.values[ci]) > vals[ci]; });
        svg.appendChild(sv('text', { x: p[0], y: below ? p[1] + 17 : p[1] - 8, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: col }, s.labels && s.labels[ci] ? s.labels[ci] : fmt(s.values[ci])));
      });
    });
    svg.appendChild(sv('line', { x1: 0, x2: W, y1: H - bot, y2: H - bot, stroke: C.line, 'stroke-width': 1 }));
    box.innerHTML = ''; box.appendChild(svg);
  }
  /* 슬로프: 두 시점 값을 선으로 이음 — 오름 남색 · 내림 붉은색 · 강조 녹색, 양쪽 라벨은 겹치지 않게 밀어냄 */
  function spreadY(ys, gap, lo, hi) {
    var o = ys.map(function (y, i) { return { y: y, i: i }; }).sort(function (a, b) { return a.y - b.y; });
    for (var k = 1; k < o.length; k++) if (o[k].y - o[k - 1].y < gap) o[k].y = o[k - 1].y + gap;
    var over = o.length ? o[o.length - 1].y - hi : 0; if (over > 0) o.forEach(function (q) { q.y -= over; });
    for (k = o.length - 2; k >= 0; k--) if (o[k + 1].y - o[k].y < gap) o[k].y = o[k + 1].y - gap;
    var r = []; o.forEach(function (q) { r[q.i] = Math.max(lo, q.y); }); return r;
  }
  function slope(box, cats, series, key) {
    var W = box.clientWidth || 360, H = box.clientHeight || 200, top = 30, bot = 14;
    var all = [].concat.apply([], series.map(function (s) { return s.values.map(numv); })), mx = Math.max.apply(null, all), mn = Math.min.apply(null, all);
    var pad = (mx - mn || 1) * 0.08, y = function (v) { return top + (H - top - bot) * (1 - (v - mn + pad) / (mx - mn + pad * 2)); };
    var maxN = Math.max.apply(null, series.map(function (s) { return String(s.name).length; }));
    var lw = Math.min(W * 0.3, maxN * 12 + 50), x1 = lw + 6, x2 = W - lw - 6;
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none' });
    [x1, x2].forEach(function (x, i) {
      svg.appendChild(sv('line', { x1: x, x2: x, y1: top - 6, y2: H - bot + 4, stroke: C.line, 'stroke-width': 1 }));
      svg.appendChild(sv('text', { x: x, y: 14, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.label, 'font-family': 'Noto Sans KR' }, cats[i]));
    });
    var col = function (s, i) { var a = numv(s.values[0]), b = numv(s.values[1]); return i === key ? C.keyg : b < a ? C.red : C.key; };
    var yl = spreadY(series.map(function (s) { return y(numv(s.values[0])); }), 15, top, H - bot), yr = spreadY(series.map(function (s) { return y(numv(s.values[1])); }), 15, top, H - bot);
    series.forEach(function (s, i) {
      var c = col(s, i), a = y(numv(s.values[0])), b = y(numv(s.values[1])), lab = s.labels || [];
      svg.appendChild(sv('line', { x1: x1, y1: a, x2: x2, y2: b, stroke: c, 'stroke-width': i === key ? 3.2 : 2, opacity: key >= 0 && i !== key ? 0.75 : 1 }));
      svg.appendChild(sv('circle', { cx: x1, cy: a, r: 4, fill: '#fff', stroke: c, 'stroke-width': 2 }));
      svg.appendChild(sv('circle', { cx: x2, cy: b, r: 4, fill: c, stroke: c, 'stroke-width': 2 }));
      svg.appendChild(sv('text', { x: x1 - 10, y: yl[i] + 4, 'text-anchor': 'end', 'font-size': 12, 'font-weight': i === key ? 700 : 400, fill: c, 'font-family': 'Noto Sans KR' }, s.name + '  ' + (lab[0] || fmt(s.values[0]))));
      svg.appendChild(sv('text', { x: x2 + 10, y: yr[i] + 4, 'text-anchor': 'start', 'font-size': 12, 'font-weight': 700, fill: c, 'font-family': 'Noto Sans KR' }, (lab[1] || fmt(s.values[1])) + '  ' + s.name));
    });
    box.innerHTML = ''; box.appendChild(svg);
  }
  /* 덤벨: 항목마다 두 시점 값을 점 두 개와 선으로 — 앞 시점 회색, 뒤 시점 남색(줄면 붉은색, 강조는 녹색) */
  function dumbbell(box) {
    var cats = parse(box.getAttribute('data-cats')) || [], series = parse(box.getAttribute('data-series')) || [], key = +(box.getAttribute('data-key') || -1);
    if (cats.length < 2 || !series.length) return;
    var W = box.clientWidth || 360, H = box.clientHeight || 200, top = 26, k = series.length, rh = (H - top) / k;
    var all = [].concat.apply([], series.map(function (s) { return s.values.slice(0, 2).map(numv); })), mx = Math.max.apply(null, all), mn = Math.min.apply(null, all);
    var lo = Math.max(0, mn - (mx - mn) * 0.25), hi = mx + (mx - mn) * 0.12 || 1;
    var maxN = Math.max.apply(null, series.map(function (s) { return String(s.name).length; })), lw = Math.min(W * 0.28, maxN * 12 + 16);
    var x = function (v) { return lw + 34 + (W - lw - 80) * (v - lo) / (hi - lo || 1); };
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none' });
    svg.appendChild(sv('circle', { cx: W - 150, cy: 9, r: 5, fill: C.prior }));
    svg.appendChild(sv('text', { x: W - 141, y: 13, 'font-size': 11, fill: C.label, 'font-family': 'Noto Sans KR' }, cats[0]));
    svg.appendChild(sv('circle', { cx: W - 80, cy: 9, r: 5, fill: C.key }));
    svg.appendChild(sv('text', { x: W - 71, y: 13, 'font-size': 11, fill: C.label, 'font-family': 'Noto Sans KR' }, cats[1]));
    series.forEach(function (s, i) {
      var cy = top + rh * i + rh / 2, a = numv(s.values[0]), b = numv(s.values[1]), lab = s.labels || [];
      var c = i === key ? C.keyg : b < a ? C.red : C.key, xa = x(a), xb = x(b);
      svg.appendChild(sv('line', { x1: lw + 10, x2: W - 10, y1: cy, y2: cy, stroke: '#e3e3e3', 'stroke-width': 1 }));
      svg.appendChild(sv('text', { x: lw, y: cy + 4, 'text-anchor': 'end', 'font-size': 12, 'font-weight': i === key ? 700 : 400, fill: C.ink, 'font-family': 'Noto Sans KR' }, s.name));
      svg.appendChild(sv('line', { x1: Math.min(xa, xb), x2: Math.max(xa, xb), y1: cy, y2: cy, stroke: c, 'stroke-width': 4, opacity: 0.45 }));
      svg.appendChild(sv('circle', { cx: xa, cy: cy, r: 6.5, fill: C.prior }));
      svg.appendChild(sv('circle', { cx: xb, cy: cy, r: 7, fill: c }));
      var lft = xa <= xb;
      svg.appendChild(sv('text', { x: xa + (lft ? -11 : 11), y: cy + 4, 'text-anchor': lft ? 'end' : 'start', 'font-size': 11, fill: C.label }, lab[0] || fmt(a)));
      svg.appendChild(sv('text', { x: xb + (lft ? 11 : -11), y: cy + 4, 'text-anchor': lft ? 'start' : 'end', 'font-size': 12, 'font-weight': 700, fill: c }, lab[1] || fmt(b)));
    });
    box.innerHTML = ''; box.appendChild(svg);
  }
  /* 순환 고리: <div class="tk-cycle"><div class="tk-cnode"><b>이름</b><span>설명</span></div>…</div> */
  function ring(box, hub) {
    var nodes = Array.prototype.slice.call(box.querySelectorAll(hub ? ':scope > .tk-spoke' : ':scope > .tk-cnode'));
    var center = box.querySelector(':scope > .tk-ccenter');
    if (!nodes.length) return;
    var W = box.clientWidth, H = box.clientHeight, n = nodes.length;
    var nw = Math.min(170, W / (n > 4 ? 3 : 2.6)), nh = Math.min(80, H / (n > 4 ? 3.4 : 3));
    nodes.forEach(function (nd) { nd.style.width = nw + 'px'; nd.style.minHeight = nh + 'px'; });
    var rx = (W - nw) / 2, ry = (H - nh) / 2 - 2, cx = W / 2, cy = H / 2;
    var pos = nodes.map(function (nd, i) {
      var a = -Math.PI / 2 + 2 * Math.PI * i / n, h = nd.offsetHeight;
      var x = cx + rx * Math.cos(a) - nw / 2, y = cy + ry * Math.sin(a) - h / 2;
      nd.style.left = x + 'px'; nd.style.top = Math.max(0, Math.min(H - h, y)) + 'px';
      return { x: x + nw / 2, y: Math.max(0, Math.min(H - h, y)) + h / 2, w: nw, h: h };
    });
    if (center) { var cs = Math.min(W, H) * (hub ? 0.34 : 0.3); center.style.width = center.style.height = cs + 'px'; center.style.left = (cx - cs / 2) + 'px'; center.style.top = (cy - cs / 2) + 'px'; }
    var old = box.querySelector(':scope > svg'); if (old) old.remove();
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H });
    function edge(p, q, r) { var dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1; return [p.x + dx / d * r, p.y + dy / d * r]; }
    pos.forEach(function (p, i) {
      if (hub) {
        var cr = center ? center.offsetWidth / 2 : 0, a = edge({ x: cx, y: cy }, p, cr + 2), b = edge(p, { x: cx, y: cy }, Math.min(p.w, p.h) / 2 + 4);
        svg.appendChild(sv('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C.line, 'stroke-width': 2 }));
      } else {
        var q = pos[(i + 1) % n], s1 = edge(p, q, Math.min(p.w, p.h) / 2 + 10), s2 = edge(q, p, Math.min(q.w, q.h) / 2 + 12);
        svg.appendChild(sv('line', { x1: s1[0], y1: s1[1], x2: s2[0], y2: s2[1], stroke: C.green, 'stroke-width': 2.4, 'data-arrow': '1' }));
        var ang = Math.atan2(s2[1] - s1[1], s2[0] - s1[0]), L = 9;
        svg.appendChild(sv('polygon', { 'data-ah': '1', points: [s2[0], s2[1], s2[0] - L * Math.cos(ang - 0.45), s2[1] - L * Math.sin(ang - 0.45), s2[0] - L * Math.cos(ang + 0.45), s2[1] - L * Math.sin(ang + 0.45)].join(','), fill: C.green }));
      }
    });
    box.insertBefore(svg, box.firstChild);
  }
  /* 수영 레인: <div class="tk-lanes" data-steps="요구 인지,선택 평가,승인"><div data-actor="영업팀">활동|활동|-</div>…</div> */
  function lanes(box) {
    if (box.getAttribute('data-built')) return;
    var steps = (box.getAttribute('data-steps') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var rows = Array.prototype.slice.call(box.children);
    box.style.gridTemplateColumns = (box.getAttribute('data-label') || '96px') + ' repeat(' + steps.length + ', 1fr)';
    box.style.gridTemplateRows = 'auto repeat(' + rows.length + ', 1fr)';
    box.innerHTML = '';
    box.appendChild(el('div', { class: 'tk-lh' }, ''));
    steps.forEach(function (s) { box.appendChild(el('div', { class: 'tk-lh' }, s)); });
    rows.forEach(function (r) {
      box.appendChild(el('div', { class: 'tk-la' }, r.getAttribute('data-actor') || ''));
      var cells = r.innerHTML.split('|');
      for (var i = 0; i < steps.length; i++) {
        var c = (cells[i] || '').trim(), key = /^\*/.test(c);
        box.appendChild(el('div', { class: 'tk-lc' + (!c || c === '-' ? ' tk-empty' : '') + (key ? ' tk-key' : '') }, c === '-' ? '' : c.replace(/^\*/, '')));
      }
    });
    box.setAttribute('data-built', '1');
  }
  var ICONS = {"users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/> <circle cx=\"9\" cy=\"7\" r=\"4\"/> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/> <path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>", "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\"/> <circle cx=\"12\" cy=\"7\" r=\"4\"/>", "user-check": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/> <circle cx=\"9\" cy=\"7\" r=\"4\"/> <polyline points=\"16 11 18 13 22 9\"/>", "user-x": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/> <circle cx=\"9\" cy=\"7\" r=\"4\"/> <line x1=\"17\" x2=\"22\" y1=\"8\" y2=\"13\"/> <line x1=\"22\" x2=\"17\" y1=\"8\" y2=\"13\"/>", "handshake": "<path d=\"m11 17 2 2a1 1 0 1 0 3-3\"/> <path d=\"m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4\"/> <path d=\"m21 3 1 11h-2\"/> <path d=\"M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3\"/> <path d=\"M3 4h8\"/>", "target": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <circle cx=\"12\" cy=\"12\" r=\"6\"/> <circle cx=\"12\" cy=\"12\" r=\"2\"/>", "crosshair": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <line x1=\"22\" x2=\"18\" y1=\"12\" y2=\"12\"/> <line x1=\"6\" x2=\"2\" y1=\"12\" y2=\"12\"/> <line x1=\"12\" x2=\"12\" y1=\"6\" y2=\"2\"/> <line x1=\"12\" x2=\"12\" y1=\"22\" y2=\"18\"/>", "trending-up": "<polyline points=\"22 7 13.5 15.5 8.5 10.5 2 17\"/> <polyline points=\"16 7 22 7 22 13\"/>", "trending-down": "<polyline points=\"22 17 13.5 8.5 8.5 13.5 2 7\"/> <polyline points=\"16 17 22 17 22 11\"/>", "chart-column": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\"/> <path d=\"M18 17V9\"/> <path d=\"M13 17V5\"/> <path d=\"M8 17v-3\"/>", "chart-line": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\"/> <path d=\"m19 9-5 5-4-4-3 3\"/>", "chart-pie": "<path d=\"M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z\"/> <path d=\"M21.21 15.89A10 10 0 1 1 8 2.83\"/>", "database": "<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"/> <path d=\"M3 5V19A9 3 0 0 0 21 19V5\"/> <path d=\"M3 12A9 3 0 0 0 21 12\"/>", "search": "<circle cx=\"11\" cy=\"11\" r=\"8\"/> <path d=\"m21 21-4.3-4.3\"/>", "lightbulb": "<path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\"/> <path d=\"M9 18h6\"/> <path d=\"M10 22h4\"/>", "megaphone": "<path d=\"m3 11 18-5v12L3 14v-3z\"/> <path d=\"M11.6 16.8a3 3 0 1 1-5.8-1.6\"/>", "messages-square": "<path d=\"M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z\"/> <path d=\"M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1\"/>", "message-circle": "<path d=\"M7.9 20A9 9 0 1 0 4 16.1L2 22Z\"/>", "shopping-cart": "<circle cx=\"8\" cy=\"21\" r=\"1\"/> <circle cx=\"19\" cy=\"21\" r=\"1\"/> <path d=\"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12\"/>", "package": "<path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\"/> <path d=\"M12 22V12\"/> <path d=\"m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7\"/> <path d=\"m7.5 4.27 9 5.15\"/>", "truck": "<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\"/> <path d=\"M15 18H9\"/> <path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14\"/> <circle cx=\"17\" cy=\"18\" r=\"2\"/> <circle cx=\"7\" cy=\"18\" r=\"2\"/>", "factory": "<path d=\"M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z\"/> <path d=\"M17 18h1\"/> <path d=\"M12 18h1\"/> <path d=\"M7 18h1\"/>", "building-2": "<path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\"/> <path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\"/> <path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\"/> <path d=\"M10 6h4\"/> <path d=\"M10 10h4\"/> <path d=\"M10 14h4\"/> <path d=\"M10 18h4\"/>", "store": "<path d=\"m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7\"/> <path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\"/> <path d=\"M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4\"/> <path d=\"M2 7h20\"/> <path d=\"M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7\"/>", "wallet": "<path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\"/> <path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\"/>", "banknote": "<rect width=\"20\" height=\"12\" x=\"2\" y=\"6\" rx=\"2\"/> <circle cx=\"12\" cy=\"12\" r=\"2\"/> <path d=\"M6 12h.01M18 12h.01\"/>", "coins": "<circle cx=\"8\" cy=\"8\" r=\"6\"/> <path d=\"M18.09 10.37A6 6 0 1 1 10.34 18\"/> <path d=\"M7 6h1v4\"/> <path d=\"m16.71 13.88.7.71-2.82 2.82\"/>", "piggy-bank": "<path d=\"M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z\"/> <path d=\"M2 9v1c0 1.1.9 2 2 2h1\"/> <path d=\"M16 11h.01\"/>", "receipt": "<path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\"/> <path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8\"/> <path d=\"M12 17.5v-11\"/>", "percent": "<line x1=\"19\" x2=\"5\" y1=\"5\" y2=\"19\"/> <circle cx=\"6.5\" cy=\"6.5\" r=\"2.5\"/> <circle cx=\"17.5\" cy=\"17.5\" r=\"2.5\"/>", "tag": "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\"/> <circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"/>", "scale": "<path d=\"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\"/> <path d=\"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\"/> <path d=\"M7 21h10\"/> <path d=\"M12 3v18\"/> <path d=\"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2\"/>", "shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/>", "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/> <path d=\"m9 12 2 2 4-4\"/>", "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"/> <path d=\"M12 9v4\"/> <path d=\"M12 17h.01\"/>", "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <polyline points=\"12 6 12 12 16 14\"/>", "calendar": "<path d=\"M8 2v4\"/> <path d=\"M16 2v4\"/> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"/> <path d=\"M3 10h18\"/>", "flag": "<path d=\"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z\"/> <line x1=\"4\" x2=\"4\" y1=\"22\" y2=\"15\"/>", "rocket": "<path d=\"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z\"/> <path d=\"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z\"/> <path d=\"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0\"/> <path d=\"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5\"/>", "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\"/> <circle cx=\"12\" cy=\"12\" r=\"3\"/>", "wrench": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/>", "layers": "<path d=\"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z\"/> <path d=\"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65\"/> <path d=\"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65\"/>", "git-branch": "<line x1=\"6\" x2=\"6\" y1=\"3\" y2=\"15\"/> <circle cx=\"18\" cy=\"6\" r=\"3\"/> <circle cx=\"6\" cy=\"18\" r=\"3\"/> <path d=\"M18 9a9 9 0 0 1-9 9\"/>", "network": "<rect x=\"16\" y=\"16\" width=\"6\" height=\"6\" rx=\"1\"/> <rect x=\"2\" y=\"16\" width=\"6\" height=\"6\" rx=\"1\"/> <rect x=\"9\" y=\"2\" width=\"6\" height=\"6\" rx=\"1\"/> <path d=\"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3\"/> <path d=\"M12 12V8\"/>", "workflow": "<rect width=\"8\" height=\"8\" x=\"3\" y=\"3\" rx=\"2\"/> <path d=\"M7 11v4a2 2 0 0 0 2 2h4\"/> <rect width=\"8\" height=\"8\" x=\"13\" y=\"13\" rx=\"2\"/>", "route": "<circle cx=\"6\" cy=\"19\" r=\"3\"/> <path d=\"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15\"/> <circle cx=\"18\" cy=\"5\" r=\"3\"/>", "map": "<path d=\"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z\"/> <path d=\"M15 5.764v15\"/> <path d=\"M9 3.236v15\"/>", "compass": "<path d=\"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z\"/> <circle cx=\"12\" cy=\"12\" r=\"10\"/>", "book-open": "<path d=\"M12 7v14\"/> <path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\"/>", "graduation-cap": "<path d=\"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z\"/> <path d=\"M22 10v6\"/> <path d=\"M6 12.5V16a6 3 0 0 0 12 0v-3.5\"/>", "clipboard-check": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\"/> <path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"/> <path d=\"m9 14 2 2 4-4\"/>", "list-checks": "<path d=\"m3 17 2 2 4-4\"/> <path d=\"m3 7 2 2 4-4\"/> <path d=\"M13 6h8\"/> <path d=\"M13 12h8\"/> <path d=\"M13 18h8\"/>", "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"/> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/> <path d=\"M10 9H8\"/> <path d=\"M16 13H8\"/> <path d=\"M16 17H8\"/>", "gavel": "<path d=\"m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8\"/> <path d=\"m16 16 6-6\"/> <path d=\"m8 8 6-6\"/> <path d=\"m9 7 8 8\"/> <path d=\"m21 11-8-8\"/>", "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\"/> <path d=\"M2 12h20\"/>", "leaf": "<path d=\"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z\"/> <path d=\"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12\"/>", "sprout": "<path d=\"M7 20h10\"/> <path d=\"M10 20c5.5-2.5.8-6.4 3-10\"/> <path d=\"M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z\"/> <path d=\"M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z\"/>", "flask-conical": "<path d=\"M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2\"/> <path d=\"M8.5 2h7\"/> <path d=\"M7 16h10\"/>", "award": "<path d=\"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526\"/> <circle cx=\"12\" cy=\"8\" r=\"6\"/>", "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\"/>", "zap": "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\"/>", "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/> <path d=\"M21 3v5h-5\"/> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/> <path d=\"M8 16H3v5\"/>", "filter": "<polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\"/>", "puzzle": "<path d=\"M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z\"/>", "link": "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"/> <path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"/>", "key": "<path d=\"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4\"/> <path d=\"m21 2-9.6 9.6\"/> <circle cx=\"7.5\" cy=\"15.5\" r=\"5.5\"/>", "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/>", "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\"/> <circle cx=\"12\" cy=\"12\" r=\"3\"/>", "brain": "<path d=\"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z\"/> <path d=\"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z\"/> <path d=\"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4\"/> <path d=\"M17.599 6.5a3 3 0 0 0 .399-1.375\"/> <path d=\"M6.003 5.125A3 3 0 0 0 6.401 6.5\"/> <path d=\"M3.477 10.896a4 4 0 0 1 .585-.396\"/> <path d=\"M19.938 10.5a4 4 0 0 1 .585.396\"/> <path d=\"M6 18a4 4 0 0 1-1.967-.516\"/> <path d=\"M19.967 17.484A4 4 0 0 1 18 18\"/>", "heart-handshake": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\"/> <path d=\"M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66\"/> <path d=\"m18 15-2-2\"/> <path d=\"m15 18-2-2\"/>", "briefcase": "<path d=\"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\"/> <rect width=\"20\" height=\"14\" x=\"2\" y=\"6\" rx=\"2\"/>", "landmark": "<line x1=\"3\" x2=\"21\" y1=\"22\" y2=\"22\"/> <line x1=\"6\" x2=\"6\" y1=\"18\" y2=\"11\"/> <line x1=\"10\" x2=\"10\" y1=\"18\" y2=\"11\"/> <line x1=\"14\" x2=\"14\" y1=\"18\" y2=\"11\"/> <line x1=\"18\" x2=\"18\" y1=\"18\" y2=\"11\"/> <polygon points=\"12 2 20 7 4 7\"/>", "presentation": "<path d=\"M2 3h20\"/> <path d=\"M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3\"/> <path d=\"m7 21 5-5 5 5\"/>", "phone": "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"/>", "laptop": "<path d=\"M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16\"/>", "cpu": "<rect width=\"16\" height=\"16\" x=\"4\" y=\"4\" rx=\"2\"/> <rect width=\"6\" height=\"6\" x=\"9\" y=\"9\" rx=\"1\"/> <path d=\"M15 2v2\"/> <path d=\"M15 20v2\"/> <path d=\"M2 15h2\"/> <path d=\"M2 9h2\"/> <path d=\"M20 15h2\"/> <path d=\"M20 9h2\"/> <path d=\"M9 2v2\"/> <path d=\"M9 20v2\"/>", "recycle": "<path d=\"M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5\"/> <path d=\"M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12\"/> <path d=\"m14 16-3 3 3 3\"/> <path d=\"M8.293 13.596 7.196 9.5 3.1 10.598\"/> <path d=\"m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843\"/> <path d=\"m13.378 9.633 4.096 1.098 1.097-4.096\"/>", "thumbs-up": "<path d=\"M7 10v12\"/> <path d=\"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z\"/>", "circle-x": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"m15 9-6 6\"/> <path d=\"m9 9 6 6\"/>", "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"m9 12 2 2 4-4\"/>", "gauge": "<path d=\"m12 14 4-4\"/> <path d=\"M3.34 19a10 10 0 1 1 17.32 0\"/>", "hourglass": "<path d=\"M5 22h14\"/> <path d=\"M5 2h14\"/> <path d=\"M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22\"/> <path d=\"M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2\"/>", "boxes": "<path d=\"M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z\"/> <path d=\"m7 16.5-4.74-2.85\"/> <path d=\"m7 16.5 5-3\"/> <path d=\"M7 16.5v5.17\"/> <path d=\"M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z\"/> <path d=\"m17 16.5-5-3\"/> <path d=\"m17 16.5 4.74-2.85\"/> <path d=\"M17 16.5v5.17\"/> <path d=\"M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z\"/> <path d=\"M12 8 7.26 5.15\"/> <path d=\"m12 8 4.74-2.85\"/> <path d=\"M12 13.5V8\"/>", "chef-hat": "<path d=\"M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z\"/> <path d=\"M6 17h12\"/>", "wheat": "<path d=\"M2 22 16 8\"/> <path d=\"M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"/> <path d=\"M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"/> <path d=\"M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"/> <path d=\"M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z\"/> <path d=\"M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"/> <path d=\"M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"/> <path d=\"M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"/>", "milk": "<path d=\"M8 2h8\"/> <path d=\"M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2\"/> <path d=\"M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0\"/>", "utensils": "<path d=\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\"/> <path d=\"M7 2v20\"/> <path d=\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\"/>", "ban": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"m4.9 4.9 14.2 14.2\"/>", "arrow-right-left": "<path d=\"m16 3 4 4-4 4\"/> <path d=\"M20 7H4\"/> <path d=\"m8 21-4-4 4-4\"/> <path d=\"M4 17h16\"/>", "split": "<path d=\"M16 3h5v5\"/> <path d=\"M8 3H3v5\"/> <path d=\"M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3\"/> <path d=\"m15 9 6-6\"/>", "merge": "<path d=\"m8 6 4-4 4 4\"/> <path d=\"M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22\"/> <path d=\"m20 22-5-5\"/>", "goal": "<path d=\"M12 13V2l8 4-8 4\"/> <path d=\"M20.561 10.222a9 9 0 1 1-12.55-5.29\"/> <path d=\"M8.002 9.997a5 5 0 1 0 8.9 2.02\"/>", "medal": "<path d=\"M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15\"/> <path d=\"M11 12 5.12 2.2\"/> <path d=\"m13 12 5.88-9.8\"/> <path d=\"M8 7h8\"/> <circle cx=\"12\" cy=\"17\" r=\"5\"/> <path d=\"M12 18v-2h-.5\"/>", "radar": "<path d=\"M19.07 4.93A10 10 0 0 0 6.99 3.34\"/> <path d=\"M4 6h.01\"/> <path d=\"M2.29 9.62A10 10 0 1 0 21.31 8.35\"/> <path d=\"M16.24 7.76A6 6 0 1 0 8.23 16.67\"/> <path d=\"M12 18h.01\"/> <path d=\"M17.99 11.66A6 6 0 0 1 15.77 16.67\"/> <circle cx=\"12\" cy=\"12\" r=\"2\"/> <path d=\"m13.41 10.59 5.66-5.66\"/>"};
  /* 묶음 이름 → 아이콘 (Lucide, ISC 라이선스) */
  var ICOMAP = [
    [/위험|리스크|경고|마찰|위기|불만|골칫/, 'triangle-alert'], [/배제|금지|중단|폐기|방해/, 'ban'], [/실패|탈락|제외/, 'circle-x'],
    [/성장|확대|증가|상승|개선/, 'trending-up'], [/감소|하락|축소|악화|약화/, 'trending-down'],
    [/동원자|협력|파트너|제휴|합의/, 'heart-handshake'], [/고객|소비자|구매자|이해관계자|수다쟁이/, 'users'], [/인재|사원|영업사원|인력|채용|담당/, 'user-check'],
    [/조직|본부|부서|체계|구조/, 'network'], [/교육|코칭|티칭|육성|학습|훈련/, 'graduation-cap'], [/통찰|아이디어|발굴|혁신|창의/, 'lightbulb'],
    [/데이터|정보|분석|자산화|DB/, 'database'], [/조사|연구|탐색|진단|발견/, 'search'], [/목표|타깃|공략|표적|선별/, 'target'],
    [/전략|방향|로드맵|경로/, 'compass'], [/프로세스|절차|단계|흐름|여정/, 'workflow'], [/구매|조달|발주|주문/, 'shopping-cart'],
    [/가격|단가|원가|비용|마진|손익|매출|수익/, 'coins'], [/투자|예산|재무|자금/, 'wallet'], [/제품|상품|원료|소재|품목/, 'package'],
    [/물류|배송|공급망|운송/, 'truck'], [/생산|공장|제조|설비/, 'factory'], [/유통|채널|매장|편의점|리테일/, 'store'],
    [/규제|법|제도|정책|준수/, 'gavel'], [/품질|안전|검증|인증|점검/, 'shield-check'], [/평가|득점|지표|측정|KPI/, 'gauge'],
    [/일정|기간|시점|분기|연도/, 'calendar'], [/속도|민첩|신속|즉시/, 'zap'], [/변화|전환|이행|교체/, 'refresh-cw'],
    [/글로벌|해외|수출|시장/, 'globe'], [/친환경|지속|ESG|식물|대체/, 'sprout'], [/연구개발|R&D|기술|개발/, 'flask-conical'],
    [/대화|소통|커뮤니케이션|발언|질문/, 'messages-square'], [/홍보|마케팅|광고|캠페인/, 'megaphone'], [/계약|협상|거래/, 'handshake'],
    [/성과|실적|달성|수주|우수|스타/, 'award'], [/문서|보고|지침|가이드|매뉴얼/, 'file-text'], [/실행|추진|과제|착수/, 'rocket'],
    [/도구|키트|툴|시스템|플랫폼/, 'wrench'], [/선택|결정|승인|판별/, 'list-checks'], [/통합|결합|연계/, 'merge'], [/비교|대비/, 'arrow-right-left'],
    [/기반|토대|인프라|층/, 'layers'], [/식품|외식|메뉴|레시피/, 'utensils'], [/곡물|농산|밀|쌀/, 'wheat'], [/기성|전통|기존|현행|일반/, 'boxes']
  ];
  function icoFor(t) { for (var i = 0; i < ICOMAP.length; i++) if (ICOMAP[i][0].test(t)) return ICOMAP[i][1]; return null; }
  function icoSrc(name, color) {
    var p = ICONS[name]; if (!p) return null;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>');
  }
  /* 묶음 머리에 아이콘 붙임: data-ico="이름|no" 로 바꾸거나 끔 */
  function icons(scope) {
    if (document.body.getAttribute('data-icons') !== 'on') return; /* TK: 아이콘 세트 없음 — 켜려면 body data-icons="on" */
    scope.querySelectorAll('.tk-card>.tk-h, .tk-pillars>div>.tk-h, .tk-chain>.tk-node>.tk-h, .tk-steps:not(.tk-hdr)>li>.tk-h, .tk-roles>div>b, .tk-layers>div>b, .tk-branch>b, .tk-q>b:first-child, .tk-spoke>b, .tk-cnode>b').forEach(function (h) {
      if (h.querySelector('.tk-ico') || h.closest('[data-icons="no"]')) return;
      var nm = h.getAttribute('data-ico') || icoFor(h.textContent);
      if (!nm || nm === 'no') return;
      var bg = getComputedStyle(h).backgroundColor, m = /(\d+),\s*(\d+),\s*(\d+)/.exec(bg), dark = m && (+m[1] * 0.3 + +m[2] * 0.59 + +m[3] * 0.11) < 140 && !/rgba\(.*,\s*0\)/.test(bg);
      var col = dark ? '#ffffff' : (h.closest('.tk-red') ? '#c0504d' : h.closest('.tk-roles,.tk-q,.tk-branch') ? '#1f3864' : '#1e5631');
      var img = el('img', { class: 'tk-ico', src: icoSrc(nm, col), alt: '' });
      h.insertBefore(img, h.firstChild);
    });
  }
  /* 가장 작은 글자에서도 넘치면 근거 도식을 다음 장 「(계속)」으로 나눔 */
  function splitOver() {
    var made = false;
    document.querySelectorAll('.tk-slide[data-overflow="yes"]').forEach(function (s) {
      var aux = s.querySelector('.tk-mainwrap > .tk-aux');
      if (!aux || !aux.children.length || s.classList.contains('tk-cont')) return;
      var c = s.cloneNode(true);
      c.classList.add('tk-cont'); c.removeAttribute('data-overflow'); c.removeAttribute('data-layout');
      var t = c.querySelector('.tk-title'); if (t) t.textContent = t.textContent + ' (계속)';
      c.querySelectorAll('.tk-mainwrap > .tk-main, .tk-facts').forEach(function (x) { x.remove(); });
      c.querySelectorAll('.tk-page').forEach(function (x) { x.remove(); });
      s.querySelectorAll('.tk-mainwrap > .tk-aux, .tk-band').forEach(function (x) { x.remove(); });
      s.removeAttribute('data-overflow');
      s.parentNode.insertBefore(c, s.nextSibling); made = true;
    });
    if (!made) return;
    var all = document.querySelectorAll('.tk-cover, .tk-toc, .tk-slide');
    all.forEach(function (s, i) { var p = s.querySelector('.tk-page'); if (s.classList.contains('tk-cover')) return; if (!p) { p = el('span', { class: 'tk-page' }); s.appendChild(p); } p.textContent = String(i + 1); });
    var main = Array.prototype.filter.call(all, function (s) { return s.classList.contains('tk-slide') && !s.classList.contains('tk-cont'); });
    var us = document.querySelectorAll('.tk-toc li > u');
    if (us.length === main.length) us.forEach(function (u, i) { u.textContent = String(Array.prototype.indexOf.call(all, main[i]) + 1); });
    document.querySelectorAll('.tk-slide').forEach(function (s) { drawAll(s); layout(s); });
  }
  /* TK v4.2: 진한 면(진녹·진남)은 한 장에 1곳 — 결론(tk-key)·지붕을 남기고 나머지는 중간톤으로 */
  var DARK = { 'rgb(30, 90, 50)': 'g', 'rgb(31, 73, 125)': 'n' };
  function oneDark(slide) {
    var body = slide.querySelector('.tk-body'); if (!body || slide.getAttribute('data-dark') === 'free') return;
    var faces = [];
    body.querySelectorAll('*').forEach(function (e) { var k = DARK[getComputedStyle(e).backgroundColor]; if (k && e.getBoundingClientRect().width > 30) faces.push({ e: e, k: k }); });
    if (faces.length < 2) return;
    var keep = faces.find(function (f) { return f.e.matches('.tk-roof, .tk-key, .tk-key *'); }) || faces[faces.length - 1];
    faces.forEach(function (f) { if (f !== keep) { f.e.classList.add('tk-dim'); if (f.k === 'n') f.e.classList.add('tk-navyface'); } });
  }
  function drawAll(scope) {
    scope.querySelectorAll('.tk-bars').forEach(bars);
    scope.querySelectorAll('.tk-wf').forEach(waterfall);
    scope.querySelectorAll('.tk-plot').forEach(plot);
    scope.querySelectorAll('.tk-dumb').forEach(dumbbell);
    scope.querySelectorAll('.tk-cycle').forEach(function (b) { ring(b, false); });
    scope.querySelectorAll('.tk-hub').forEach(function (b) { ring(b, true); });
  }
  /* 배치 탐색: 주 도식 · 근거 도식 배치 후보를 그려 보고 넘침 · 빈 칸이 가장 적은 것을 고름 */
  var LAYOUTS = [
    { dir: 'column', m: '1 1 auto', a: '0 0 auto' },
    { dir: 'column', m: '0 0 auto', a: '1 1 auto' },
    { dir: 'column', m: '1 1 0', a: '1 1 0' },
    { dir: 'row', m: '0 0 60%', a: '1 1 0' },
    { dir: 'row', m: '0 0 50%', a: '1 1 0' },
    { dir: 'row', m: '0 0 40%', a: '1 1 0' },
    { dir: 'row-reverse', m: '1 1 0', a: '0 0 32%' },
    { dir: 'row-reverse', m: '1 1 0', a: '0 0 26%' }
  ];
  var prevDir = null;
  var BOXES = '.tk-track > .tk-tr:not(.tk-th), .tk-vf, .tk-sp, .tk-tr > span, .tk-bf > span, .tk-scr, .tk-g2, .tk-tl > .tk-list, .tk-rad, .tk-vc, .tk-cz, .tk-effect, .tk-dc, .tk-list, .tk-ev, .tk-q, .tk-node, td, .tk-cnode, .tk-spoke, .tk-from, .tk-to, .tk-lc, .tk-branch > b, .tk-sr > span, .tk-ccols > div, .tk-rfrom, .tk-rto, .tk-sp, .tk-chvb > div, .tk-acr, .tk-udc, .tk-card, .tk-pillars > div';
  function emptiness(body) {
    var br = body.getBoundingClientRect(), area = br.width * br.height, rg = document.createRange(), empty = 0, cramp = 0;
    body.querySelectorAll(BOXES).forEach(function (b) {
      var r = b.getBoundingClientRect(); if (r.height < 8 || r.width < 8) return;
      rg.selectNodeContents(b); var c = rg.getBoundingClientRect();
      var used = Math.min(1, (c.height || 0) / r.height);
      var bcs = getComputedStyle(b);
      if (bcs.display.indexOf('flex') >= 0 && bcs.flexDirection === 'column' && b.children.length > 1) { var hs = 0; for (var q = 0; q < b.children.length; q++) hs += b.children[q].getBoundingClientRect().height; used = Math.min(1, (hs + pxf(bcs.paddingTop) + pxf(bcs.paddingBottom)) / r.height); }
      if (!b.closest('.tk-list') || b.classList.contains('tk-list')) empty += (1 - used) * r.width * r.height / area;
    });
    body.querySelectorAll('.tk-bars').forEach(function (c) {
      var r = c.getBoundingClientRect(), k = c.querySelectorAll('rect').length || (JSON.parse(c.getAttribute('data-items') || '[]').length);
      if (k && k < 5) empty += (r.width * r.height / area) * (5 - k) / 6;
    });
    body.querySelectorAll('.tk-list > li, td, .tk-sr > span, .tk-from, .tk-to').forEach(function (e) {
      var r = e.getBoundingClientRect(), lh = parseFloat(getComputedStyle(e).lineHeight) || 16;
      if (r.width < 120 && r.height > lh * 3.2) cramp += 1;
    });
    return { empty: empty, cramp: cramp };
  }
  function layout(slide) {
    if (slide === document.querySelector('.tk-slide')) prevDir = null;
    var body = slide.querySelector('.tk-body.tk-auto'), wrap = body && body.querySelector('.tk-mainwrap');
    if (!wrap || !wrap.querySelector('.tk-aux')) { fit(slide); return; }
    var fixed = body.getAttribute('data-layout'), best = null, cands = [];
    LAYOUTS.forEach(function (L, i) {
      if (fixed != null && +fixed !== i) return;
      var ax = wrap.querySelector('.tk-aux'); if (ax && ax.children.length === 1 && ax.querySelector(':scope > .tk-evidence') && L.dir === 'column' && L.a !== '0 0 auto') return;
      wrap.style.setProperty('--dir', L.dir); wrap.style.setProperty('--mflex', L.m); wrap.style.setProperty('--aflex', L.a);
      drawAll(slide); fit(slide);
      var fs = +slide.getAttribute('data-fs'), ov = slide.getAttribute('data-overflow') === 'yes';
      var em = emptiness(body);
      var score = (ov ? 1e6 : 0) + Math.max(0, 12 - fs) * 60 + em.empty * 100 + em.cramp * 6 + i * 0.5;
      cands.push({ s: score, i: i, ov: ov });
      if (!best || score < best.s) best = { s: score, i: i };
    });
    /* 장 구성 다양화: 거의 같은 점수면 바로 앞 장과 다른 방향(위아래 ↔ 좌우 ↔ 왼쪽 받침)을 고름 */
    var dirOf = function (k) { return LAYOUTS[k].dir; };
    if (fixed == null && prevDir) {
      var compact = !!wrap.querySelector('.tk-aux > .tk-factcol, .tk-aux > .tk-evidence, .tk-aux > .tk-bars, .tk-aux > .tk-plot, .tk-aux > .tk-funnel');
      var alt = cands.filter(function (c) { return !c.ov && c.s <= best.s + 18 && dirOf(c.i) !== prevDir && (dirOf(c.i) === 'column' || compact); }).sort(function (a, b) { return a.s - b.s; })[0];
      if (alt && dirOf(best.i) === prevDir) best = alt;
    }
    prevDir = dirOf(best.i);
    var L = LAYOUTS[best.i];
    wrap.style.setProperty('--dir', L.dir); wrap.style.setProperty('--mflex', L.m); wrap.style.setProperty('--aflex', L.a);
    slide.setAttribute('data-layout', best.i);
    drawAll(slide); fit(slide); drawAll(slide);
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
    var pcs = getComputedStyle(e, which), c = pcs.content;
    if (!c || c === 'none' || c === 'normal' || pcs.display === 'none') return '';
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
        italic: false, fontFace: 'Noto Sans KR' };
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
        } else if (c.nodeType === 1 && c.classList && c.classList.contains('tk-mk')) {
          var mo = style(n); mo.color = hex(getComputedStyle(c).backgroundColor) || hex(getComputedStyle(c).color) || mo.color; mo.bold = true;
          var g = c.textContent.trim(); runs.push({ text: (g === '!' ? '❗' : g) + ' ', options: mo }); nodes.push(c.firstChild || c);
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
            else if (kind === 'tri-d') { kind = S.triangle; o.flipV = true; }
            else if (kind === 'trapezoid-down') { kind = S.trapezoid; o.flipV = true; }
            else if (kind === 'trapezoid') kind = S.trapezoid;
            else if (kind === 'chevron') kind = S.chevron;
            else if (kind === 'homePlate') kind = S.homePlate;
            else if (kind === 'line') kind = S.line;
            else if (kind === 'ellipse') kind = S.ellipse;
            else if (kind === 'diamond') kind = S.diamond;
            else kind = S.rect;
            slide.addShape(kind, o);
          }
          function svg(svEl) {
            var sr = svEl.getBoundingClientRect(), vb = (svEl.getAttribute('viewBox') || '0 0 ' + sr.width + ' ' + sr.height).split(/\s+/).map(Number);
            var kx = sr.width / (vb[2] || sr.width), ky = sr.height / (vb[3] || sr.height);
            function px(x) { return (sr.left - B.left + (x - vb[0]) * kx) * K; }
            function py(y) { return (sr.top - B.top + (y - vb[1]) * ky) * K; }
            svEl.querySelectorAll('rect, line, text, circle').forEach(function (g) {
              var r = g.getBoundingClientRect(), cs = getComputedStyle(g);
              if (g.tagName === 'line') {
                var x1 = +g.getAttribute('x1'), y1 = +g.getAttribute('y1'), x2 = +g.getAttribute('x2'), y2 = +g.getAttribute('y2');
                var o = { x: px(Math.min(x1, x2)), y: py(Math.min(y1, y2)), w: Math.max(0.001, Math.abs(x2 - x1) * kx * K), h: Math.max(0.001, Math.abs(y2 - y1) * ky * K),
                  line: { color: hex(cs.stroke) || 'A6A6A6', width: Math.max(0.5, pxf(g.getAttribute('stroke-width')) || 1), dashType: g.getAttribute('stroke-dasharray') ? 'dash' : 'solid' } };
                if (x2 < x1) o.flipH = true; if (y2 < y1) o.flipV = true;
                if (g.getAttribute('data-arrow')) o.line.endArrowType = 'triangle';
                slide.addShape(S.line, o); return;
              }
              if (!inside(r)) return;
              var b = box(r);
              if (g.tagName === 'rect') shape('rect', b, { fill: { color: hex(cs.fill) || 'BFBFBF' }, line: { type: 'none' } });
              else if (g.tagName === 'circle') slide.addShape(S.ellipse, Object.assign(b, { fill: { color: hex(cs.fill) || 'FFFFFF' }, line: { color: hex(cs.stroke) || 'A6A6A6', width: pxf(g.getAttribute('stroke-width')) || 1 } }));
              else {
                var pad = 0.08;
                slide.addText(g.textContent, { x: b.x - pad, y: b.y - 0.02, w: b.w + pad * 2, h: b.h + 0.04, margin: 0, align: 'center', valign: 'middle', wrap: false,
                  fontFace: 'Noto Sans KR', fontSize: pxf(g.getAttribute('font-size')) || 11, bold: (g.getAttribute('font-weight') || '') === '700', color: hex(cs.fill) || '000000', fit: 'none' });
              }
            });
          }
          (function visit(e) {
            if (e.nodeType !== 1) return;
            if (e.classList && e.classList.contains('tk-mk')) return;
            if (e.classList && e.classList.contains('tk-legend') && window.TK_NATIVE_CHART !== false && e.parentNode && e.parentNode.querySelector('.tk-plot')) return;
            var cs = getComputedStyle(e);
            if (cs.display === 'none' || cs.visibility === 'hidden') return;
            if (e.tagName === 'svg' || e.tagName === 'SVG') return svg(e);
            var r = e.getBoundingClientRect();
            /* 막대·묶음·누적·꺾은선·복합 차트는 PPT 기본 차트로 (편집 가능) */
            if (e.classList && (e.classList.contains('tk-bars') || e.classList.contains('tk-plot')) && window.TK_NATIVE_CHART !== false) {
              var cr = e.getBoundingClientRect(); if (!inside(cr)) return;
              var cb = box(cr), CT = P.ChartType || P.charts, hx = function (c) { return (c || '#1f497d').replace('#', '').toUpperCase(); };
              var base = { x: cb.x, y: cb.y, w: cb.w, h: cb.h, showLegend: false, showValue: true, dataLabelFontSize: 10, dataLabelFontFace: 'Noto Sans KR', dataLabelColor: '000000',
                catAxisLabelFontSize: 9, catAxisLabelFontFace: 'Noto Sans KR', catAxisLabelColor: '404040', valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
                catAxisLineShow: true, catAxisLineColor: 'A6A6A6', showTitle: false };
              try {
                if (e.classList.contains('tk-bars')) {
                  var its = parse(e.getAttribute('data-items')) || [], labs = its.map(function (x) { return String(x[0]); });
                  var ser = its.map(function (x, i) { return { name: String(x[0]), labels: labs, values: its.map(function (y, k) { return k === i ? (+x[1] || 0) : null; }) }; });
                  slide.addChart(CT.bar, ser, Object.assign(base, { barDir: e.getAttribute('data-dir') === 'h' ? 'bar' : 'col', barGrouping: 'stacked', overlap: 100, barGapWidthPct: 60,
                    chartColors: its.map(function (x) { return hx(C[x[2] || 'navy'] || x[2]); }), dataLabelPosition: 'inEnd', dataLabelColor: 'FFFFFF' }));
                } else {
                  var cats = parse(e.getAttribute('data-cats')) || [], sers = parse(e.getAttribute('data-series')) || [], ty = e.getAttribute('data-type') || 'group';
                  var num = function (v) { return typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.\-]/g, '')) || 0; };
                  var mk = function (s) { return { name: s.name, labels: cats, values: (s.values || []).map(num) }; };
                  var dec = Math.min(2, Math.max.apply(null, [0].concat([].concat.apply([], sers.map(function (s) { return (s.values || []).map(function (v) { var m = /\.(\d+)/.exec(String(v).replace(/,/g, '')); return m ? m[1].length : 0; }); })))));
                  base.dataLabelFormatCode = dec ? '#,##0.' + '0'.repeat(dec) : '#,##0';
                  var bars = sers.filter(function (s) { return s.kind !== 'line'; }), lines = sers.filter(function (s) { return s.kind === 'line'; });
                  var cols = sers.map(function (s, i) { return hx(PAL[i % PAL.length]); });
                  Object.assign(base, { showLegend: sers.length > 1, legendPos: 't', legendFontSize: 9, legendFontFace: 'Noto Sans KR' });
                  if (ty === 'slope') { var kz = +(e.getAttribute('data-key') || -1); cols = sers.map(function (s, i) { var v = (s.values || []).map(num); return i === kz ? '1E5A32' : v[1] < v[0] ? 'C0504D' : '1F497D'; }); Object.assign(base, { showLegend: true, legendPos: 'r' }); }
                  var zv = null; if (e.getAttribute('data-zoom') === '1') { var av = [].concat.apply([], sers.map(function (s) { return (s.values || []).map(num); })), zmx = Math.max.apply(null, av), zmn = Math.min.apply(null, av); zv = zmn - (zmx - zmn || Math.abs(zmx) * 0.1 || 1) * 0.6; var p10 = Math.pow(10, Math.floor(Math.log10(Math.abs(zmx - zmn) || 1))); zv = Math.floor(zv / p10) * p10; }
                  if (ty === 'line' || ty === 'slope') slide.addChart(CT.line, sers.map(mk), Object.assign(base, { chartColors: cols, lineSize: 2, lineDataSymbol: 'circle', lineDataSymbolSize: 6, dataLabelPosition: 't' }, zv != null ? { valAxisMinVal: zv } : {}));
                  else if (lines.length && bars.length) slide.addChart([{ type: CT.bar, data: bars.map(mk), options: { barGrouping: ty === 'stack' ? 'stacked' : 'clustered', chartColors: cols.slice(0, bars.length) } },
                    { type: CT.line, data: lines.map(mk), options: { chartColors: cols.slice(bars.length), secondaryValAxis: true, secondaryCatAxis: true, lineDataSymbol: 'circle' } }],
                    Object.assign(base, { valAxes: [{ showValAxisTitle: false, valAxisHidden: true }, { showValAxisTitle: false, valAxisHidden: true, valGridLine: { style: 'none' } }], catAxes: [{ catAxisTitle: '' }, { catAxisHidden: true }] }));
                  else slide.addChart(CT.bar, bars.map(mk), Object.assign(base, { barDir: 'col', barGrouping: ty === 'pct' ? 'percentStacked' : ty === 'stack' ? 'stacked' : 'clustered', chartColors: cols, dataLabelPosition: ty === 'stack' || ty === 'pct' ? 'ctr' : 'outEnd' }));
                }
                return;
              } catch (x) { /* 기본 차트 실패 시 도형으로 그림 */ }
            }
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
              var rad = cs.borderTopLeftRadius;
              if (!kind && (/%/.test(rad) ? parseFloat(rad) >= 45 : pxf(rad) >= Math.min(r.width, r.height) * 0.45)) kind = 'ellipse';
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
                  if ((u.bottom - u.top) < (lh || pxf(cs.fontSize) * 1.4) * 1.5) {
                    /* 한 줄 글: 받는 PC 글꼴이 더 넓어도 상자 밖으로 나가지 않게, 상자 오른쪽 끝까지 폭을 주고 줄바꿈 허용 */
                    if (e.matches('.tk-big, .tk-big *, .tk-stat > b, .tk-mlh > b, .tk-prdot') || (e.textContent || '').trim().length <= 6) { o2.wrap = false; o2.w = Math.max(o2.w, (u.right - u.left) * K * 1.25); }
                    else if (!ctr && !right && !vert) { var edge = r.right - pxf(cs.paddingRight) - B.left; o2.w = Math.max(o2.w, (edge - (u.left - B.left)) * K); o2.wrap = true; }
                    else o2.wrap = false;
                  }
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
    icons(document);
    if (!document.querySelector('.tk-export') && document.body.getAttribute('data-export') !== 'no') {
      var bar = el('div', { class: 'tk-bar' }), bt = el('button', { class: 'tk-export', type: 'button' }, 'PPT 내보내기');
      bt.addEventListener('click', function () { exportPPT(bt); });
      bar.appendChild(bt); document.body.insertBefore(bar, document.body.firstChild);
    }
    Array.prototype.forEach.call(slides, function (s, i) {
      if (s.classList.contains('tk-cover')) cover(s);
      else frame(s, i + 1);
    });
    document.querySelectorAll('.tk-gantt').forEach(gantt);
    document.querySelectorAll('.tk-lanes').forEach(lanes);
    drawAll(document);
    document.querySelectorAll('.tk-slide').forEach(layout);
    splitOver();
    document.querySelectorAll('.tk-slide').forEach(oneDark);
    zoom();
    window.addEventListener('resize', zoom);
    setTimeout(function () {
      document.querySelectorAll('.tk-slide').forEach(layout);
      splitOver();
      document.querySelectorAll('.tk-slide').forEach(oneDark);
      window.TK_SLIDES_READY = true;
    }, 350);
  }
  var done = false;
  function go() { if (done) return; done = true; run(); }
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
})();
