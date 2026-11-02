// 장표 자동 채점기 v2 — 평가표(치명·중대·경미) 자동 항목 + 기존 100점 점수
// usage: node tools/score.js <rendered html url> [manuscript.md]
// module: const { measure, report } = require('./score'); await measure(page, manuscriptText)
const fs = require('fs');

/* 원고에서 장마다 「옮겨져야 할 줄」을 뽑음 (A1 내용 누락 · A4 원문 수치 확인용) */
function expected(md) {
  if (!md) return null;
  const out = []; let cur = null, mode = '';
  md.replace(/\r/g, '').split('\n').forEach(raw => {
    const h = /^\s*#{2,4}\s*(.+)$/.exec(raw);
    if (h) { cur = /표지|목차/.test(h[1]) ? null : { title: h[1], lines: [] }; if (cur) out.push(cur); mode = ''; return; }
    if (!cur) return;
    const t = raw.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').replace(/\*\*/g, '').trim(); if (!t) return;
    const kv = /^(예비|리드|서브메시지|주 ?도식|근거 ?도식|본문|강조|받침|출처|물음|연결|비중|사실 ?띠|근거|실행)\s*[:：]\s*(.*)$/.exec(t);
    const ind = (/^(\s*)/.exec(raw)[1] || '').length;
    if (kv && !(mode === 'body' && ind >= 4 && /^(근거|실행)$/.test(kv[1]))) {
      mode = kv[1].replace(/\s/g, '');
      if (mode === '사실띠' && !/^없음/.test(kv[2])) { const p = kv[2].split('|'); (p.length > 1 ? p.slice(1).join('|') : p[0]).split(/\s*\/\s*/).forEach(x => x.trim() && cur.lines.push({ t: x.trim(), k: 'fact' })); }
      if (/도식/.test(mode)) { const v = /(?:값|계열)\s*[:：]\s*([^|]+)/.exec(kv[2]); if (v) v[1].split(/\s*\/\s*/).forEach(x => x.trim() && cur.lines.push({ t: x.trim(), k: 'data' })); }
      if (mode === '본문') mode = 'body';
      return;
    }
    if (mode === 'body') { if (/^\[근거\]/.test(t) || /^[^:：]{1,10}$/.test(t)) return; cur.lines.push({ t, k: 'body' }); }
  });
  return out;
}
const norm = s => String(s || '').replace(/^\s*(결론|요약)\s*[:：]\s*/, '').replace(/[↑↓✓✗●◐○!☞※'’"“”「」『』()\[\]:：·,.\-–—=|~∼/]/g, '').replace(/\s+/g, '');
const NUM = /[+\-]?\d[\d,]*(?:\.\d+)?/g;

async function measure(page, md) {
  const res = await page.evaluate(() => {
    const slides = [...document.querySelectorAll('.tk-cover, .tk-toc, .tk-slide')];
    const out = [];
    const BOXES = '.tk-vf, .tk-sp, .tk-tr > span, .tk-scr, .tk-g2, .tk-rad, .tk-vc, .tk-cz, .tk-effect, .tk-dc, .tk-q, .tk-node, td, .tk-cnode, .tk-spoke, .tk-from, .tk-to, .tk-lc, .tk-sr > span, .tk-ccols > div, .tk-rfrom, .tk-rto, .tk-chvb > div, .tk-acr, .tk-udc, .tk-card, .tk-pillars > div, .tk-vc2, .tk-gapr > div, .tk-mlv, .tk-vcp, .tk-dtl';
    const own = e => [...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim());
    slides.forEach((s, idx) => {
      const sr = s.getBoundingClientRect();
      const r0 = { n: idx + 1, kind: s.classList.contains('tk-cover') ? 'cover' : s.classList.contains('tk-toc') ? 'toc' : 'slide', w: Math.round(sr.width), h: Math.round(sr.height), cont: s.classList.contains('tk-cont') ? 1 : 0 };
      r0.title = ((s.querySelector('.tk-title, h1') || {}).textContent || '').slice(0, 24);
      r0.text = s.innerText;
      /* 글 겹침 · 화면 밖 · 잘림 */
      const texts = []; const rg = document.createRange();
      s.querySelectorAll('*').forEach(e => {
        if (e.closest('.tk-emblem')) return;
        if (e.tagName === 'text') { const r = e.getBoundingClientRect(); if (r.width > 1 && e.textContent.trim()) texts.push({ e, r }); return; }
        if (e.closest('svg') || !own(e)) return;
        const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return;
        rg.selectNodeContents(e); [...rg.getClientRects()].forEach(r => { if (r.width > 1 && r.height > 1) texts.push({ e, r }); });
      });
      let overlap = 0, outside = 0, clip = 0;
      for (let i = 0; i < texts.length; i++) {
        const a = texts[i].r;
        if (a.left < sr.left - 2 || a.right > sr.right + 2 || a.top < sr.top - 2 || a.bottom > sr.bottom + 2) outside++;
        for (let j = i + 1; j < texts.length; j++) {
          const b = texts[j].r, A = texts[i].e, B = texts[j].e;
          if (A === B || A.contains(B) || B.contains(A)) continue;
          const ih = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top), iw = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          if (ih >= 4 && iw >= 4) overlap++;
        }
      }
      s.querySelectorAll('*').forEach(e => { const cs = getComputedStyle(e); if (/hidden|clip/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 3 && e.clientHeight > 0 && e.innerText && e.innerText.trim() && !e.classList.contains('tk-title')) clip++; });
      Object.assign(r0, { overlap, outside, clip });
      const body = s.querySelector('.tk-body');
      if (!body || r0.kind !== 'slide') { out.push(r0); return; }
      const br = body.getBoundingClientRect(), area = br.width * br.height;
      /* 속 빈 상자(M3) · 상자 아래 빈 띠(M4) */
      let hollow = 0, bottomGap = 0, empty = 0;
      body.querySelectorAll(BOXES).forEach(bx => {
        const r = bx.getBoundingClientRect(); if (r.width < 8 || r.height < 18) return;
        if (bx.closest('.tk-evidence') || bx.matches('.tk-ev')) return;
        const cs = getComputedStyle(bx);
        let top = 1e9, bot = -1e9;
        rg.selectNodeContents(bx); [...rg.getClientRects()].forEach(q => { if (q.height > 1) { top = Math.min(top, q.top); bot = Math.max(bot, q.bottom); } });
        if (bot < 0) return;
        const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        const used = Math.min(1, (bot - top + pad) / r.height);
        if (!bx.closest('.tk-list') || bx.classList.contains('tk-list')) empty += (1 - used) * r.width * r.height / area;
        if (used < 0.4 && r.width * r.height > area * 0.015) hollow++;
        if ((r.bottom - bot - parseFloat(cs.paddingBottom)) / r.height > 0.35 && r.height > 50 && used >= 0.4) bottomGap++;
      });
      /* 본문 세로 채움(M5): 보이는 요소가 덮는 세로 구간 합 */
      const iv = [];
      body.querySelectorAll('*').forEach(e => {
        if (e.closest('svg') && e.tagName !== 'svg') return;
        const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (r.height < 2 || r.width < 2) return;
        const vis = e.tagName === 'svg' || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'rgb(255, 255, 255)') || parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0 || own(e);
        if (vis) iv.push([Math.max(br.top, r.top), Math.min(br.bottom, r.bottom)]);
      });
      iv.sort((a, b) => a[0] - b[0]); let cov = 0, ce = -1e9, cs0 = 0;
      iv.forEach(([a, b]) => { if (b <= a) return; if (a > ce) { if (ce > -1e9) cov += ce - cs0; cs0 = a; ce = b; } else ce = Math.max(ce, b); });
      if (ce > -1e9) cov += ce - cs0;
      /* 시각 면적 · 글자 크기 */
      let vis = 0;
      body.querySelectorAll('*').forEach(e => {
        const cs = getComputedStyle(e), bg = cs.backgroundColor;
        if (e.tagName === 'svg') { const r = e.getBoundingClientRect(); vis += r.width * r.height * 0.5; return; }
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)' && !e.closest('svg')) {
          if (![...e.children].some(k => getComputedStyle(k).backgroundColor !== 'rgba(0, 0, 0, 0)')) { const r = e.getBoundingClientRect(); vis += r.width * r.height; }
        }
      });
      let small = 0, allc = 0, minFs = 99; const sizes = {};
      body.querySelectorAll('*').forEach(e => {
        const t = e.tagName === 'text' ? e.textContent : (own(e) ? [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join('') : '');
        const len = t.replace(/\s/g, '').length; if (!len) return;
        const f = parseFloat(e.tagName === 'text' ? (e.getAttribute('font-size') || 11) : getComputedStyle(e).fontSize);
        allc += len; if (f < 11) small += len; minFs = Math.min(minFs, f); sizes[Math.round(f * 2) / 2] = (sizes[Math.round(f * 2) / 2] || 0) + len;
      });
      const nSizes = Object.keys(sizes).filter(k => sizes[k] >= 6).length;
      let dk = 0; body.querySelectorAll('*').forEach(e => { const bg = getComputedStyle(e).backgroundColor; if ((bg === 'rgb(30, 90, 50)' || bg === 'rgb(31, 73, 125)') && e.getBoundingClientRect().width > 30) dk++; });
      const lis = body.querySelectorAll('.tk-list > li');
      const rich = [...lis].filter(l => l.querySelector('.tk-kw, .tk-mk, .tk-n') || l.classList.contains('tk-stat') || l.classList.contains('tk-meter')).length;
      const kinds = ['tk-shift', 'tk-steps', 'tk-chain', 'tk-tree', 'tk-matrix', 'tk-house', 'tk-pyramid', 'tk-layers', 'tk-cycle', 'tk-hub', 'tk-lanes', 'tk-cases', 'tk-table', 'tk-roles', 'tk-cards', 'tk-evidence', 'tk-bars', 'tk-wf', 'tk-funnel', 'tk-plot', 'tk-gantt'];
      const kd = el => el ? (kinds.find(k => el.querySelector('.' + k)) || '-').replace('tk-', '') : '-';
      Object.assign(r0, {
        form: s.dataset.form || '-', main: kd(s.querySelector('.tk-main')), aux: kd(s.querySelector('.tk-aux')),
        fs: +s.dataset.fs, ov: s.dataset.overflow === 'yes' ? 1 : 0, empty: +(empty * 100).toFixed(0), fill: +(cov / br.height * 100).toFixed(0),
        visual: +Math.min(100, vis / area * 100).toFixed(0), rich: lis.length ? Math.round(rich / lis.length * 100) : 100, minFs, small: allc ? Math.round(small / allc * 100) : 0, nSizes,
        dark: dk, hollow, bottomGap, chars: body.innerText.replace(/\s/g, '').length,
        heroes: s.querySelectorAll('.tk-hero .tk-big').length, bigs: s.querySelectorAll('.tk-big').length,
        facts: s.querySelectorAll('.tk-facts, .tk-factcol, .tk-fchips').length, bottomBlk: s.querySelectorAll('.tk-body > .tk-facts, .tk-body > .tk-road, .tk-body > .tk-fchips, .tk-body > .tk-spare.tk-on:not(.tk-sp-side)').length ? 1 : 0, band: s.querySelectorAll('.tk-band').length, slack: s.classList.contains('tk-slack') ? 1 : 0,
        doLine: s.querySelectorAll('.tk-do').length + (/☞/.test(s.innerText) ? 1 : 0)
      });
      out.push(r0);
    });
    return out;
  });

  /* ── 판정 ── */
  const F = []; const add = (n, item, grade, msg) => F.push({ n, item, grade, msg });
  const body = res.filter(r => r.kind === 'slide');
  res.forEach(r => {
    if (r.w !== 842 || r.h !== 595) add(r.n, 'P8', '치명', `규격 ${r.w}×${r.h}`);
    if (r.ov) add(r.n, 'L1', '치명', '넘침');
    if (r.clip) add(r.n, 'L1', '치명', `잘린 글 상자 ${r.clip}`);
    if (r.overlap) add(r.n, 'L2', '치명', `글 겹침 ${r.overlap}쌍`);
    if (r.outside) add(r.n, 'L3', '치명', `화면 밖 글 ${r.outside}`);
    if (/\[수치 필요|칸 글|<제목>/.test(r.text)) add(r.n, 'A7', '치명', '자리표시');
    if (/패러다임|시너지|극대화/.test(r.text)) add(r.n, 'F7', '경미', '바꿀 말');
    if (r.kind !== 'slide') return;
    if (r.small > 20) add(r.n, 'F1', '중대', `11pt 미만 글 ${r.small}%`);
    else if (r.fs < 12) add(r.n, 'F1', '경미', `본문 ${r.fs}pt`);
    if (r.nSizes > 5) add(r.n, 'F2', '경미', `글자 크기 ${r.nSizes}종`);
    if (r.hollow) add(r.n, 'M3', '중대', `속 빈 상자 ${r.hollow}`);
    if (r.bottomGap) add(r.n, 'M4', '경미', `상자 아래 빈 띠 ${r.bottomGap}`);
    if (r.fill < 62) add(r.n, 'M5', '중대', `세로 채움 ${r.fill}%`); else if (r.fill < 80) add(r.n, 'M5', '경미', `세로 채움 ${r.fill}%`);
    if (r.dark > 1) add(r.n, 'K3', '경미', `진한 면 ${r.dark}`);
    if (r.visual < 10 && r.main !== 'plot' && r.main !== 'bars') add(r.n, 'D1', '중대', `시각 면적 ${r.visual}%`);
    if (r.band) add(r.n, 'G2', '경미', '하단 띠');
    if (r.cont) add(r.n, 'P5', '경미', '(계속) 장');
    if (r.bigs > 1 && r.heroes) add(r.n, 'N3', '경미', `큰 숫자 ${r.bigs}`);
    if (r.doLine) add(r.n, 'B6', '중대', '실행·시사 줄');
  });
  /* 덱 전체 */
  const forms = body.filter(r => !r.cont).map(r => r.form !== '-' ? r.form : r.main);
  const cnt = {}; forms.forEach((f, i) => { cnt[f] = (cnt[f] || 0) + 1; if (i && f === forms[i - 1]) add(body[i].n, 'D3', '중대', `같은 형식 연속(${f})`); });
  Object.keys(cnt).forEach(f => { if (cnt[f] > 2) add(0, 'D3', '중대', `${f} ${cnt[f]}회`); });
  const texty = forms.filter(f => /카드 묶음|역할 라벨|^cards$|^roles$/.test(f)).length; if (texty > 2) add(0, 'D5', '경미', `글 묶음 형식 ${texty}장`);
  const fsv = body.filter(r => !r.cont).map(r => r.fs); if (fsv.length && Math.max(...fsv) - Math.min(...fsv) > 2) add(0, 'F4', '경미', `본문 크기 ${Math.min(...fsv)}~${Math.max(...fsv)}pt`);
  const heroN = body.filter(r => r.heroes).length; if (heroN > 2) add(0, 'N3', '경미', `큰 숫자 기둥 ${heroN}장`);
  body.forEach((r, i) => { if (i && r.heroes && body[i - 1].heroes) add(r.n, 'N3', '경미', '큰 숫자 연속'); });
  const bb = body.filter(r => r.bottomBlk && !r.cont).length; if (bb > 2) add(0, 'P9', '경미', `하단 블록 반복 ${bb}장(캡틴 지시: 반복 지양)`);
  const factN = body.filter(r => r.facts).length, nb = body.filter(r => !r.cont).length; if (factN > Math.max(2, Math.floor(nb / 2))) add(0, 'P6', '경미', `사실 띠 ${factN}/${nb}장`);
  /* A1 · A4: 원고 대조 */
  const exp = expected(md); let miss = [];
  if (exp) {
    const groups = []; body.forEach(r => { if (r.cont && groups.length) groups[groups.length - 1].text += ' ' + r.text; else groups.push({ n: r.n, text: r.text }); });
    exp.forEach((e, i) => {
      const g = groups[i]; if (!g) { add(0, 'A1', '치명', `장 없음: ${e.title}`); return; }
      const T = norm(g.text), T2 = String(g.text).replace(/[\s,]/g, '');
      e.lines.forEach(L => {
        const toks = L.t.split(/\s+/).map(norm).filter(x => x.length >= 2);
        const hit = toks.filter(x => T.indexOf(x) >= 0).length;
        const nums = (L.t.match(NUM) || []).map(x => x.replace(/[+,]/g, '')).filter(x => x.length >= 1 && !/^0$/.test(x));
        const numMiss = nums.filter(x => T2.indexOf(x) < 0);
        if (!toks.length) return;
        if (hit / toks.length < 0.7 || numMiss.length) miss.push({ n: g.n, k: L.k, t: L.t, nm: numMiss });
      });
    });
    const byN = {}; miss.forEach(m => { (byN[m.n] = byN[m.n] || []).push(m); });
    Object.keys(byN).forEach(n => add(+n, 'A1', '치명', `원고 내용 누락 ${byN[n].length}줄: ` + byN[n].slice(0, 3).map(m => m.t.slice(0, 18)).join(' / ')));
  }
  /* 기존 100점 */
  let tot = 0;
  body.forEach(r => {
    let sc = 100;
    sc -= r.ov * 40; sc -= Math.max(0, 12 - r.fs) * 6; sc -= Math.max(0, r.empty - 15) * 1.2;
    sc -= Math.max(0, 35 - r.visual) * 0.8; sc -= Math.max(0, 70 - r.rich) * 0.3; sc -= Math.max(0, r.dark - 1) * 5;
    sc -= Math.max(0, 9 - r.minFs) * 5; sc -= (r.main === 'cards' || r.main === 'roles') ? 8 : 0;
    r.score = Math.round(Math.max(0, sc)); tot += r.score;
  });
  const W = { 치명: 3, 중대: 2, 경미: 1 };
  const sum = {
    crit: new Set(F.filter(f => f.grade === '치명').map(f => f.n)).size, major: F.filter(f => f.grade === '중대').length,
    minor: F.filter(f => f.grade === '경미').length, pen: F.reduce((a, f) => a + W[f.grade], 0),
    avg: body.length ? Math.round(tot / body.length) : 0, kinds: new Set(forms).size + '/' + forms.length, chars: body.reduce((a, r) => a + r.chars, 0), miss: miss.length
  };
  res.forEach(r => { delete r.text; });
  return { slides: res, findings: F, sum, forms, miss };
}
function report(name, m) {
  const s = m.sum;
  console.log(`\n■ ${name} — 치명 장 ${s.crit} · 중대 ${s.major} · 경미 ${s.minor} · 벌점 ${s.pen} · 평균 ${s.avg} · 형식 ${s.kinds} · 본문 ${s.chars}자 · 누락 ${s.miss}줄`);
  console.log('  ' + m.forms.join(' / '));
  m.findings.sort((a, b) => ({ 치명: 0, 중대: 1, 경미: 2 }[a.grade] - { 치명: 0, 중대: 1, 경미: 2 }[b.grade]) || a.n - b.n).forEach(f => console.log(`  ${f.grade} ${f.item} p${f.n} ${f.msg}`));
}
module.exports = { measure, report, expected };

if (require.main === module) {
  const { chromium } = require('playwright');
  (async () => {
    const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 700 } });
    await p.goto(process.argv[2]); await p.waitForFunction(() => window.TK_SLIDES_READY === true, null, { timeout: 20000 });
    const md = process.argv[3] ? fs.readFileSync(process.argv[3], 'utf8') : '';
    const m = await measure(p, md); report(process.argv[2], m);
    console.table(m.slides.filter(r => r.kind === 'slide').map(r => ({ n: r.n, form: r.form, fs: r.fs, fill: r.fill, empty: r.empty, vis: r.visual, hollow: r.hollow, ov: r.ov, score: r.score })));
    await b.close();
  })();
}
