// 장표 자동 채점기 — usage: node score.js <rendered html url>
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 700 } });
  await p.goto(process.argv[2]); await p.waitForFunction(() => window.TK_SLIDES_READY === true, null, { timeout: 15000 });
  const res = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.tk-slide').forEach((s, idx) => {
      const body = s.querySelector('.tk-body'); if (!body) return;
      const br = body.getBoundingClientRect(), area = br.width * br.height;
      // 빈 면: 글 상자 안에서 글이 차지하지 않은 비율
      let empty = 0; const rg = document.createRange();
      body.querySelectorAll('.tk-list, .tk-ev, .tk-q, .tk-node, td, .tk-lc, .tk-from, .tk-to').forEach(bx => {
        const r = bx.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return;
        rg.selectNodeContents(bx); const c = rg.getBoundingClientRect();
        if (!bx.closest('.tk-list') || bx.classList.contains('tk-list')) empty += Math.max(0, 1 - (c.height || 0) / r.height) * r.width * r.height / area;
      });
      // 시각 요소 면적: 색 면·도형·차트가 차지한 비율 (흰 바탕·회색 아닌 면)
      let vis = 0;
      body.querySelectorAll('*').forEach(e => {
        const cs = getComputedStyle(e), bg = cs.backgroundColor;
        if (e.tagName === 'svg') { const r = e.getBoundingClientRect(); vis += r.width * r.height * 0.5; return; }
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)' && !e.closest('svg')) {
          const kids = [...e.children].some(k => getComputedStyle(k).backgroundColor !== 'rgba(0, 0, 0, 0)');
          if (!kids) { const r = e.getBoundingClientRect(); vis += r.width * r.height; }
        }
      });
      const lis = body.querySelectorAll('.tk-list > li');
      const rich = [...lis].filter(l => l.querySelector('.tk-kw, .tk-mk, .tk-n') || l.classList.contains('tk-stat') || l.classList.contains('tk-meter')).length;
      let minFs = 99; body.querySelectorAll('*').forEach(e => { if (e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())) minFs = Math.min(minFs, parseFloat(getComputedStyle(e).fontSize)); });
      const dark = body.querySelectorAll('*'); let dk = 0;
      dark.forEach(e => { const bg = getComputedStyle(e).backgroundColor; if ((bg === 'rgb(30, 90, 50)' || bg === 'rgb(31, 73, 125)') && e.getBoundingClientRect().width > 30) dk++; });
      const kinds = ['tk-shift', 'tk-steps', 'tk-chain', 'tk-tree', 'tk-matrix', 'tk-house', 'tk-pyramid', 'tk-layers', 'tk-cycle', 'tk-hub', 'tk-lanes', 'tk-cases', 'tk-table', 'tk-roles', 'tk-cards', 'tk-evidence', 'tk-bars', 'tk-wf', 'tk-funnel', 'tk-plot', 'tk-gantt'];
      const main = s.querySelector('.tk-main'), aux = s.querySelector('.tk-aux');
      const kd = el => el ? (kinds.find(k => el.querySelector('.' + k)) || '-').replace('tk-', '') : '-';
      out.push({ n: idx + 1, title: (s.querySelector('.tk-title') || {}).textContent.slice(0, 16), main: kd(main), aux: kd(aux),
        fs: +s.dataset.fs, ov: s.dataset.overflow === 'yes' ? 1 : 0, cont: s.classList.contains('tk-cont') ? 1 : 0,
        empty: +(empty * 100).toFixed(0), visual: +Math.min(100, vis / area * 100).toFixed(0), rich: lis.length ? Math.round(rich / lis.length * 100) : 100,
        minFs, dark: dk, chars: body.innerText.replace(/\s/g, '').length });
    });
    return out;
  });
  // 점수: 100점 만점
  let tot = 0;
  res.forEach(r => {
    let sc = 100;
    sc -= r.ov * 40; sc -= Math.max(0, 12 - r.fs) * 6; sc -= Math.max(0, r.empty - 15) * 1.2;
    sc -= Math.max(0, 35 - r.visual) * 0.8; sc -= Math.max(0, 70 - r.rich) * 0.3; sc -= Math.max(0, r.dark - 1) * 5;
    sc -= Math.max(0, 9 - r.minFs) * 5; sc -= (r.main === 'cards' || r.main === 'roles') ? 8 : 0;
    r.score = Math.round(Math.max(0, sc)); tot += r.score;
  });
  const mains = res.map(r => r.main); const uniq = new Set(mains).size;
  console.table(res);
  console.log('평균', Math.round(tot / res.length), '· 주 도식 종류', uniq + '/' + res.length);
  await b.close();
})();
