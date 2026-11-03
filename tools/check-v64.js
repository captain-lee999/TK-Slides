// v6.4 점검 — make.html(v6.4 단일 파일)에 회귀 원고·프리셋을 넣어 그리고 잰다.
// 재는 것: 장 수 · 슬라이드 밖으로 나간 요소 · 빈 칸(「-」만 있는 칸) · 하단 실증 띠 장 수 · 원고 조각 보존율 · 「다른 안」 수 · PPTX 쪽 크기
// 사용: node tools/check-v64.js [--shot] [--pptx] [--only 08]
// 비교 기준(v5.4)은 make_v5.4.html + tools/regress.js (out/*.html)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'out', 'v64'); fs.mkdirSync(OUT, { recursive: true });
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const LOCAL_PPTX = ['/opt/npm-tools/node_modules/pptxgenjs/dist/pptxgen.bundle.js', path.join(ROOT, 'node_modules/pptxgenjs/dist/pptxgen.bundle.js')].find(f => fs.existsSync(f));
const norm = s => s.replace(/[\s·•\-*|/:,.()「」'"✓→]/g, '');
function frags(md) {
  const out = [];
  const body = md.split(/\n/).filter(l => !/^\s*\*?\s*(물음|연결|비중|주 도식|근거 도식|디자인|도식)\s*:/.test(l) && !/^#|^---/.test(l));
  for (const l of body) for (const seg of l.split(/[|/;]/)) { const t = norm(seg.replace(/^.*?:\s*/, '')); if (t.length >= 8) out.push(t.slice(0, 8)); }
  return [...new Set(out)];
}
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
  p.on('pageerror', e => console.log('  [오류]', e.message));
  await p.route(/^https?:\/\/.*/, r => (LOCAL_PPTX && /pptxgen/.test(r.request().url())) ? r.fulfill({ path: LOCAL_PPTX, contentType: 'text/javascript' }) : r.abort());
  await p.goto('file://' + path.join(ROOT, 'make.html')); await p.waitForTimeout(600);
  const runs = [];
  if (!arg('--only')) for (const v of await p.$$eval('#deckPreset option', o => o.map(x => x.value).filter(Boolean))) runs.push({ name: 'preset-' + v, preset: v });
  for (const f of fs.readdirSync(path.join(ROOT, 'tests/regress')).filter(f => /\.md$/.test(f) && (!arg('--only') || f.includes(arg('--only')))).sort())
    runs.push({ name: f.replace(/\.md$/, ''), md: fs.readFileSync(path.join(ROOT, 'tests/regress', f), 'utf8') });
  const tot = { slides: 0, outside: 0, dash: 0, band: 0, fr: 0, kept: 0 };
  for (const r of runs) {
    if (r.preset) { await p.selectOption('#deckPreset', r.preset); await p.waitForTimeout(300); } else await p.fill('#input', r.md);
    await p.click('#btnMake'); await p.waitForTimeout(1500);
    const m = await p.evaluate(() => {
      const arts = [...document.querySelectorAll('#out article.tk-slide')];
      return {
        n: arts.length,
        outside: arts.map(a => { const R = a.getBoundingClientRect(); return [...a.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > R.right + 1 || q.bottom > R.bottom + 1); }).length; }),
        dash: arts.map(a => [...a.querySelectorAll('*')].filter(e => !e.children.length && (e.textContent || '').trim() === '-').length),
        band: arts.filter(a => a.querySelector('.sl-fact-band')).length,
        alts: arts.map(a => { const s = a.querySelector('select'); return s ? s.options.length : 0; }),
        text: arts.map(a => a.innerText).join('\n'),
      };
    });
    let kept = '';
    if (r.md) { const fr = frags(r.md), t = norm(m.text), k = fr.filter(x => t.includes(x)).length; kept = ` · 원고 조각 ${k}/${fr.length}`; tot.fr += fr.length; tot.kept += k; }
    const sum = a => a.reduce((x, y) => x + y, 0);
    tot.slides += m.n; tot.outside += sum(m.outside); tot.dash += sum(m.dash); tot.band += m.band;
    console.log(`${r.name}: ${m.n}장 · 밖 ${sum(m.outside)} · 빈 칸 ${sum(m.dash)}(${m.dash.join(',')}) · 실증 띠 ${m.band}장 · 다른 안 ${m.alts.join(',')}${kept}`);
    if (process.argv.includes('--shot')) {
      const arts = await p.$$('#out article.tk-slide');
      for (let i = 0; i < arts.length; i++) await arts[i].screenshot({ path: path.join(OUT, `${r.name}-${String(i + 1).padStart(2, '0')}.png`) });
    }
    if (process.argv.includes('--pptx') && LOCAL_PPTX) {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('#btnExportPptx')]);
      const f = path.join(OUT, r.name + '.pptx'); await dl.saveAs(f);
      const xml = execSync(`unzip -p "${f}" ppt/presentation.xml`).toString(); const s = xml.match(/sldSz cx="(\d+)" cy="(\d+)"/);
      console.log(`  PPTX ${(+s[1] / 360000).toFixed(1)}×${(+s[2] / 360000).toFixed(1)}cm · 장 ${(execSync(`unzip -l "${f}"`).toString().match(/ppt\/slides\/slide\d+\.xml/g) || []).length}`);
    }
  }
  console.log(`\n합계 — ${tot.slides}장 · 밖 ${tot.outside} · 빈 칸 ${tot.dash} · 실증 띠 ${tot.band}장 · 원고 조각 ${tot.kept}/${tot.fr} (${(100 * tot.kept / Math.max(1, tot.fr)).toFixed(1)}%)`);
  await b.close();
})();
