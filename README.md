# tk-slides — TK 디자인시스템 HTML 장표 키트 v1

농심태경 TK 디자인시스템 v4.2(A4 가로 842×595, 색 역할·리드메시지·제목선·엠블럼)를 HTML 장표로 옮긴 키트.
제미나이 장표생성 스킬(ppt-slide-builder)이 이 키트의 부품 클래스로 HTML을 쓰고, 화면에서는 키트가 모양을 그린다.

## 파일
| 파일 | 하는 일 |
| --- | --- |
| make.html | **원고 변환기** — 장표기획 원고(또는 장표생성 HTML)를 붙여 넣으면 TK 덱을 그리고 PPT로 내보냄. 주소: https://captain-lee999.github.io/TK-Slides/make.html (GitHub Pages 켠 뒤) |
| tk-slides.css | 토큰(색·글꼴·간격) + 부품 15종 디자인 |
| tk-slides.js | 엠블럼·쪽번호·표지 이미지, 막대·워터폴·일정표 그리기, 넘치면 글자 자동 축소(12→9.5px), 화면 배율, **PPT 내보내기 단추**(편집 가능한 .pptx, A4 가로) |
| img/ | 베지가든·Qtaste·BORN TASTE 엠블럼, 농심태경 워드마크, 표지 나무 |
| examples/components.html | 부품 견본 |
| examples/sample-deck.html | 시험 덱(통찰력 영업 7장) |
| tests/canvas-test-1.html | Canvas가 외부 CSS·JS·이미지를 읽는지 시험 |
| tests/canvas-test-2-kit.html | 이 키트가 링크로 읽히는지 시험 |
| tests/regress/*.md | 회귀 원고 4개(통찰력 판매 · 팀 AI · 전략 의사결정 · 가상 수치 시험) |
| tools/score.js | 채점기 v2 — 평가표 자동 항목(치명·중대·경미): 내용 누락(원고 대조)·넘침·겹침·화면 밖·속 빈 상자·세로 채움·글자 크기·덱 안 크기 통일·형식 반복·사실 띠 비중 등 |
| tools/regress.js | 회귀 채점 — `node tools/regress.js --save base` 뒤 고치고 `--cmp base --shot`으로 전후 비교·장별 그림(out/) |
| docs/실행덱-분석-1102.md | 실행 덱 분석(평가표 7장 절차)과 개선 목록 |

## v5.1 표현 풀 추가 (원고 재료로 자동 선택, 화면·PPT 모두)
- 차트: 덤벨 · 슬로프(같은 지표 두 시점, 순위가 바뀌면 슬로프) · 100% 누적 막대(시점마다 합 100) · 스몰 멀티플(단위·크기가 다른 여러 지표)
- 컨설팅 도식: 갭 분석(칸 현재·목표) · 가치 사슬(`지원:`) · 성숙도 사다리(`현재:`·`목표:`) · 우선순위 매트릭스(기준 효과×실행 용이성) · 의사결정 트리(칸 줄 `조건 → 결과`)
- 덱당 2장 제한으로 빠진 사실 띠 · 안 쓴 예비 사실 · 생략된 큰 숫자는 빈 면이 생긴 장에서만 「참고 사실」로 꺼냄

## 저장소와 키트 주소
- 저장소: https://github.com/captain-lee999/TK-Slides (공개 — jsDelivr는 공개 저장소만 내줌)
- 키트 주소: `https://cdn.jsdelivr.net/gh/captain-lee999/TK-Slides@main/tk-slides.css`, `…/tk-slides.js`

## 고친 뒤 반영
- jsDelivr는 main 브랜치 파일을 최대 12시간 캐시한다. 고친 뒤 바로 쓰려면 아래 주소를 브라우저에서 한 번 연다.
  - https://purge.jsdelivr.net/gh/captain-lee999/TK-Slides@main/tk-slides.css
  - https://purge.jsdelivr.net/gh/captain-lee999/TK-Slides@main/tk-slides.js

## PPT·구글 슬라이드로 받기
1. 덱 화면 오른쪽 위 「PPT 내보내기」를 누르면 .pptx가 내려받아진다(PptxGenJS 3.12.0을 jsDelivr에서 불러옴).
2. 구글 슬라이드가 필요하면 그 .pptx를 구글 드라이브에 올리고 「Google 프레젠테이션으로 열기」.
3. 상자·글자·도식은 편집 가능한 도형과 글상자로, 막대·워터폴은 도형으로 옮긴다. 글꼴은 Noto Sans KR(구글 슬라이드 기본 제공, PC에 없으면 대체 글꼴).

## 출처
- 디자인 기준: TK 디자인시스템(Claude Design) README v4.2, tokens.json, components/bundle.css
- 구조 참고: html-slides(MIT) 외부 assets 방식, frontend-slides(MIT) 화면 고정 방식 — 코드는 새로 작성
