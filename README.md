# SEVEN CUSHIONS — compact edition

제출 파일: **seven-cushions.zip (13,307 bytes / 13,312 bytes)** — 여유 5 bytes.
ZIP에는 `index.html` 하나만 들어 있습니다. HTML 원본 크기는 17,469 bytes이며 13KB 제한은 ZIP 기준입니다.

음악, 효과음, 그래픽을 모두 코드에 포함했습니다. 외부 요청이나 음원·폰트 파일이 필요 없습니다.

- 음악: 76 BPM, 8마디 멜로디와 분산화음 반주. 감쇠하는 배음으로 부드러운 현악기 계열 음색을 생성합니다.
- CSS: 오버라이드 레이어를 하나로 병합했습니다. 단 `@container` 안에 등장하는 선택자는 캐스케이드가 뒤집히므로 병합 대상에서 제외합니다.
- 글꼴: 828바이트 내장 5×7 픽셀 글꼴. UI 텍스트는 전부 대문자로 통일했습니다 (`#stage { text-transform: uppercase }`).
- 토스트(`#toast`)는 마크업상 `#overlay` 뒤에 있어 패널 위에 그려지고, 타이머는 일시정지 중 멈춥니다. 그래서 패널을 여는 곳(타이틀·일시정지·보상·게임오버)에서 항상 `opacity=0, C=0`으로 지웁니다.
- 용어: 화면에 보이는 문구는 당구 용어를 쓰지 않습니다. 튕김은 전부 bounce로 통일했고 (bank/ricochet/cushion/foe 제거), 게임 이름 SEVEN CUSHIONS만 그대로 둡니다.
- 잠금 표시: 요구 바운스를 아직 못 채운 적은 흐리게 그리고, 채우는 순간(또는 무지개 발동 시) 밝아집니다. 조준 중에는 HEAD START 증강의 시작 바운스를 기준으로 판정합니다.
- 블랙홀: 사거리 4.3유닛 안에서 궤도를 휘게 하며(속도는 22로 고정되므로 방향만 바뀝니다), 1.3유닛 안으로 스치면 뱅크 1회로 인정합니다. 한 샷에 홀당 한 번만, 조준 미리보기는 이 판정을 소비하지 않습니다.
- 판: 3x3 구역 비트마스크로 구성. 스테이지가 오를수록 5칸에서 8칸까지 넓어지고 크리스탈도 함께 늘어납니다. 보스전은 항상 9칸.
- 증강: 11종. 한 판(보상 57회)에 전부 최대치를 찍을 수 없도록 총 레벨을 66으로 잡았습니다.
- 카메라: 아이소메트릭 투영을 `SX/SY/SZ/CX/CY` 다섯 상수에서만 정의합니다. 정점 셰이더 GLSL도 이 값에서 생성하므로 JS와 셰이더가 어긋날 수 없습니다.
- 스프라이트 원본은 `sprites/` 폴더에 PNG로 보관합니다 (제출 ZIP에는 포함되지 않음). `node sprites/png2art.cjs <파일.png> [프레임수]`로 편집한 PNG를 소스 형식으로 되돌립니다.
- 아이들 애니메이션: 유니콘 3프레임, 슬라임 2프레임. 밑면을 고정하고 위쪽만 눌러 스쿼시를 만듭니다 (변형폭은 스프라이트 높이의 10% 안팎). 프레임은 가로로 이어 붙이고 `la()`에 `l`(프레임 수)과 `r`(인덱스)을 넘깁니다. `t.x`로 위상을 어긋내 개체마다 다르게 움직입니다.
- 스프라이트: 유니콘(24x24 프레임)은 정확히 2배인 48x48 px로 그립니다. 빌보드 원점을 캔버스 픽셀 격자에 스냅해 NEAREST 샘플링이 프레임마다 흔들리지 않게 했습니다.
- 타이틀: 저해상도 캔버스에 그린 뒤 픽셀 확대. 한글 UI와 언어 설정 코드는 제거했습니다.

## 파일

| 파일 | 역할 |
|---|---|
| `seven-cushions.zip` | **제출물.** `index.html` 하나만 포함 |
| `index.html` | 빌드 결과물. roadroller로 자기압축되어 있어 사람이 읽을 수 없음 |
| `game.source.html` | **개발본. 코드를 고칠 때는 이 파일만 수정** |
| `build.cjs` | `game.source.html` → terser(JS) + clean-css(CSS) → `index.html` |
| `pack.cjs` | `index.html`을 roadroller(`optimize(2)`)로 자기압축 |
| `zip.cjs` | `index.html`을 최소 헤더 ZIP으로 압축하고 남은 용량을 출력. DEFLATE의 strategy/memLevel 36조합을 훑어 가장 작은 것을 사용합니다 (memLevel 9는 8보다 ~150바이트 나쁩니다) |
| `game.before-english.html` | 백업: 한글 UI 버전 |
| `index.original.html` | 백업: 압축 전 초기 영문판 |
| `index.before-size-fix.html` | 백업: 용량 절감 전 버전 (외부 `assets/` 참조, 단독 실행 불가) |
| `assets/` | 더 이상 쓰지 않는 음원·폰트의 라이선스 문서만 보관 |

## 빌드

```
npm install
npm run build
```

`build.cjs` → `pack.cjs` → `zip.cjs` 순으로 실행되며 `seven-cushions.zip`이 갱신됩니다.
roadroller의 최적화 탐색은 무작위라 같은 입력에도 결과가 ~50바이트 흔들립니다. `pack.cjs`가 4회 돌려 deflate 후 가장 작은 것을 채택합니다 (`PACK_TRIES` 환경변수로 조절).
빌드 도구(terser, clean-css, roadroller)는 제출 ZIP에 포함되지 않습니다.

## 검증

브라우저에서 타이틀 → 도움말 → 플레이 → 일시정지 흐름을 확인했습니다.
JS 오류 없음, 외부 `script`/`link` 의존성 없음, HUD·도움말·타이틀의 서체 통일 확인.
음소거·볼륨 조절은 타이틀 화면과 일시정지 화면에서만 제공하며, 토글 동작을 확인했습니다.

- 추가 idle: 일반 적과 보스는 발 위치를 유지하며 1px 높이 변화로 숨쉬는 동작을 합니다. 기존 유니콘·슬라임 애니메이션은 유지합니다. 새 이미지 자산은 추가하지 않았습니다.

## Pixel font update
UI and canvas labels use an embedded, original 5x7 uppercase pixel font (828 bytes WOFF2). Letters, digits and required punctuation only; no font requests. make-pixel.py regenerates it with fontTools. The title canvas text generator was removed. CSS decoration and help copy were simplified to fit the entire game in 13,299 bytes ZIP. Music, idle animation and gameplay are preserved.

Volume slider uses a square pixel-style thumb and flat track (WebKit and Firefox CSS). Final ZIP: 13,299 bytes.

Map progression: non-boss stages 1–6 use 5 regions, 8–13 use 6, 15–20 use 7, and 22+ use 8. Random layouts within a tier have the same area. Every seventh stage remains a full 9-region boss arena.
