# 🐻 곰돌이 직소 퍼즐

조각을 드래그해서 그림을 맞추는 퍼즐 게임. 원하는 이미지를 넣으면 그게 퍼즐이 됩니다.

**React + Vite**로 만들었습니다.

## 실행

```powershell
npm install
npm run dev
```

터미널에 나오는 주소(보통 http://localhost:5173)를 브라우저로 엽니다.

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 (파일 고치면 화면이 바로 바뀝니다) |
| `npm test` | 게임 규칙 테스트 |
| `npm run build` | `dist/` 로 빌드 |
| `npm run preview` | 빌드 결과 확인 |

> Node 18 이상이 필요합니다. nvm 을 쓰면 `nvm use 22.12.0`.

## 조작법

| 동작 | 방법 |
|---|---|
| 조각 놓기 | 조각을 **드래그**해서 원하는 칸에 놓기 |
| 조각 놓기 (2) | 조각을 **톡 누르고** → 놓을 칸을 누르기 |
| 자리 바꾸기 | 이미 놓인 조각 위에 다른 조각을 놓으면 교환 |
| 되돌리기 | 조각을 트레이로 다시 끌어다 놓기 |
| 그림 확인 | **👀 미리보기**를 누르고 있는 동안만 보임 |

## 이미지 바꾸기

**방법 1 — 버튼 (제일 빠름)**
`🖼️ 이미지 바꾸기`를 누르고 파일 선택. 새로고침하면 원래대로 돌아갑니다.

**방법 2 — 파일로 고정**
`public/images/` 에 `bear.png` 로 저장하면 열 때마다 자동으로 쓰입니다.
(`bear.jpg`, `bear.jpeg`, `bear.webp` 도 인식)

정사각형이 아닌 이미지는 **가운데를 정사각형으로 잘라서** 씁니다. 늘어나지 않아요.
아무 파일도 없으면 코드로 그린 기본 곰 그림이 나옵니다.

> 남의 그림을 개인적으로 퍼즐에 쓰는 건 자유롭지만, 공개 저장소에 올릴 땐 이미지 저작권을 확인하세요.
> `.gitignore` 가 `public/images/` 안의 그림 파일을 기본으로 제외합니다.

## 구조

```
bear-puzzle/
├── index.html              Vite 진입점
├── vite.config.js
├── public/images/          퍼즐로 쓸 그림을 두는 곳
├── src/
│   ├── main.jsx            React 시작점
│   ├── App.jsx             전체 화면 조립 + 상태 보관
│   ├── styles.css          색·레이아웃 (맨 위 :root 변수만 고치면 테마가 바뀝니다)
│   ├── lib/
│   │   ├── puzzle.js       ★ 게임 규칙 — 순수 함수만, DOM·React 없음
│   │   └── placeholderBear.js
│   ├── hooks/
│   │   ├── usePieceGesture.js   드래그 & 탭 조작
│   │   ├── usePuzzleImage.js    그림 찾기·교체
│   │   ├── useFitSizes.js       창 크기에 맞춘 조각 크기
│   │   └── useElapsed.js        경과 시간
│   └── components/
│       ├── Board.jsx  Tray.jsx  Piece.jsx
│       └── Toolbar.jsx  Stats.jsx  WinOverlay.jsx
└── test/puzzle.test.js     puzzle.js 테스트 (브라우저 없이 돌아감)
```

### 핵심 아이디어

> **조각 번호 = 그 조각이 들어가야 할 칸 번호**

그래서 완성 판정이 `board[i] === i` 한 줄입니다.

그리고 게임 규칙을 [`src/lib/puzzle.js`](src/lib/puzzle.js) 에 **순수 함수**로 몰아놨습니다.
DOM 을 전혀 모르기 때문에 브라우저 없이 그냥 테스트가 됩니다 — `npm test`.
React 는 그 함수들이 돌려준 상태를 화면에 그리는 일만 합니다.

`movePiece` 는 옮길 수 없는 이동일 때 **받은 상태를 그대로** 돌려줍니다.
참조가 같으니 React 가 헛되게 다시 그리지 않습니다.

## 다음에 해볼 것

- [ ] 최고 기록 저장 (`localStorage`)
- [ ] 조각 테두리를 진짜 직소 모양(볼록·오목)으로
- [ ] 조각이 제자리에 들어가면 딸깍 소리 + 살짝 붙는 느낌
- [ ] 조각을 회전시켜야 하는 하드 모드
- [ ] 이미지를 드래그&드롭으로 바로 넣기
- [ ] 완성하면 색종이(confetti) 뿌리기
- [ ] 조작(드래그·탭) 자체를 테스트로 덮기
