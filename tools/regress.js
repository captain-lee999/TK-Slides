// 회귀 채점: tests/regress/*.md 원고를 make.html로 변환 → 그려서 평가표 자동 항목으로 채점
// usage: node tools/regress.js [--save 이름] [--cmp 이름] [--shot] [--only 이름]
// 결과: out/<원고>.html, out/<원고>.json, out/png/<원고>-<쪽>.png(--shot), out/_<이름>.json(--save)
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { measure, report } = require('./score');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'out');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
(async () => {
  fs.mkdirSync(path.join(OUT, 'png'), { recursive: true });
  const srv = http.createServer((q, r) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0, '127.0.0.1');
  await new Promise(ok => srv.on('listening', ok));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const b = await chromium.launch();
  const files = fs.readdirSync(path.join(ROOT, 'tests/regress')).filter(f => /\.md$/.test(f) && (!arg('--only') || f.indexOf(arg('--only')) >= 0)).sort();
  const all = {};
  for (const f of files) {
    const name = f.replace(/\.md$/, ''), md = fs.readFileSync(path.join(ROOT, 'tests/regress', f), 'utf8');
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
    p.on('pageerror', e => console.log('  [make 오류]', name, e.message));
    await p.goto(base + 'make_v5.4.html'); await p.fill('#src', md); await p.click('#go');
    await p.waitForFunction(() => document.getElementById('view').srcdoc.length > 100);
    const html = await p.$eval('#view', v => v.srcdoc), alts = await p.$eval('#forms', x => x.innerText);
    await p.close();
    fs.writeFileSync(path.join(OUT, name + '.html'), html);
    const q = await b.newPage({ viewport: { width: 900, height: 700 } });
    q.on('pageerror', e => console.log('  [그리기 오류]', name, e.message));
    await q.goto(base + 'out/' + encodeURIComponent(name) + '.html');
    await q.waitForFunction(() => window.TK_SLIDES_READY === true, null, { timeout: 30000 });
    const m = await measure(q, md); m.alts = alts; all[name] = m;
    report(name, m);
    if (process.argv.includes('--shot')) {
      const els = await q.$$('.tk-cover, .tk-toc, .tk-slide');
      for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(OUT, 'png', `${name}-${i + 1}.png`) });
    }
    fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(m, null, 1));
    await q.close();
  }
  const tot = k => Object.values(all).reduce((a, m) => a + m.sum[k], 0);
  console.log(`\n합계 — 치명 장 ${tot('crit')} · 중대 ${tot('major')} · 경미 ${tot('minor')} · 벌점 ${tot('pen')} · 누락 ${tot('miss')}줄 · 본문 ${tot('chars')}자`);
  if (arg('--save')) fs.writeFileSync(path.join(OUT, '_' + arg('--save') + '.json'), JSON.stringify(all));
  if (arg('--cmp')) {
    const old = JSON.parse(fs.readFileSync(path.join(OUT, '_' + arg('--cmp') + '.json'), 'utf8'));
    console.log('\n전후 비교 (' + arg('--cmp') + ' → 지금): 치명 장 / 중대 / 경미 / 벌점 / 누락 / 본문 글자');
    Object.keys(all).forEach(n => { const a = old[n] && old[n].sum, c = all[n].sum; if (!a) return; console.log(`  ${n}: ${a.crit}→${c.crit} / ${a.major}→${c.major} / ${a.minor}→${c.minor} / ${a.pen}→${c.pen} / ${a.miss}→${c.miss} / ${a.chars}→${c.chars}`); });
  }
  await b.close(); srv.close();
})();
