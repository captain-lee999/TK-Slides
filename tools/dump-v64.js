// v6.4 해석 결과 덤프: node tools/dump-v64.js tests/regress/08-insight3.md [장번호]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.route(/^https?:\/\/.*/,r=>r.abort());
await p.goto('file://'+path.join(__dirname,'..','make.html'));
const md=fs.readFileSync(process.argv[2],'utf8');const only=process.argv[3];
const d=await p.evaluate(md=>{const deck=parseManuscript(md);return deck.slides.map(s=>({num:s.num,title:s.title,main:s.dMain&&s.dMain.raw,aux:s.dAux&&s.dAux.raw,cells:s.mainCells.map(c=>c.name+' ⟨'+c.lines.length+'⟩ '+c.lines.join(' ¦ ').slice(0,140)),aux2:s.auxCells.map(c=>c.name+' ⟨'+c.lines.length+'⟩'),band:s.effectiveFactBand.slice(0,80)}))},md);
for(const s of d){if(only&&String(s.num)!==only)continue;console.log(`\n# ${s.num} ${s.title}\n 주: ${s.main}\n 근: ${s.aux}\n 띠: ${s.band}`);s.cells.forEach(c=>console.log('  · '+c));s.aux2.forEach(c=>console.log('  ◦ '+c));}
await b.close();})();
