/* ===========================================================
   퍼즐 게임 규칙 — 순수 함수만 모아둔 곳

   여기에는 React 도, DOM 도 등장하지 않습니다.
   그래서 브라우저 없이 그냥 테스트할 수 있어요 (test/puzzle.test.js).

   핵심 규칙 하나만 기억하면 나머지가 다 읽힙니다.

     조각 번호 = 그 조각이 들어가야 할 칸 번호

   그래서 완성 판정이 board[i] === i 한 줄입니다.
   =========================================================== */

/** 게임 상태의 모양
 *  {
 *    size:   한 변의 조각 수 (3 이면 3x3)
 *    board:  길이 size*size 배열. 각 칸에 놓인 조각 번호, 비어 있으면 null
 *    tray:   아직 판에 올리지 않은 조각 번호들
 *    moves:  이동 횟수
 *    solved: 완성했는지
 *  }
 *  위치를 가리키는 값은 { zone: 'tray' } 또는 { zone: 'board', cell: n } 형태이고,
 *  출발지에는 어떤 조각인지 알려주는 piece 가 함께 붙습니다.
 */

export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(size) {
  const count = size * size;
  return {
    size,
    board: Array(count).fill(null),
    tray: shuffle([...Array(count).keys()]),
    moves: 0,
    solved: false,
  };
}

export function isSolved(board) {
  return board.length > 0 && board.every((piece, i) => piece === i);
}

/** 아직 제자리를 찾지 못한 조각 수 */
export function remaining({ board, tray }) {
  return tray.length + board.filter((piece, i) => piece !== null && piece !== i).length;
}

/**
 * 조각을 옮긴 새 상태를 돌려줍니다. 원본은 건드리지 않습니다.
 * 옮길 수 없는 경우에는 받은 상태를 그대로 돌려주므로,
 * React 는 참조가 같은 걸 보고 다시 그리지 않습니다.
 */
export function movePiece(state, src, dst) {
  if (state.solved || !src || !dst) return state;

  const board = state.board.slice();
  const tray = state.tray.slice();

  if (dst.zone === 'tray') {
    // 판에서 트레이로 되돌리기
    if (src.zone === 'tray') return state;
    board[src.cell] = null;
    tray.push(src.piece);

  } else if (src.zone === 'board') {
    // 판 안에서 이동 — 놓을 칸에 조각이 있으면 서로 자리를 바꿉니다
    if (src.cell === dst.cell) return state;
    const occupant = board[dst.cell];
    board[dst.cell] = src.piece;
    board[src.cell] = occupant;

  } else {
    // 트레이에서 판으로 — 밀려난 조각은 트레이로 돌아갑니다
    const at = tray.indexOf(src.piece);
    if (at < 0) return state;
    const occupant = board[dst.cell];
    tray.splice(at, 1);
    board[dst.cell] = src.piece;
    if (occupant !== null) tray.push(occupant);
  }

  return {
    ...state,
    board,
    tray,
    moves: state.moves + 1,
    solved: tray.length === 0 && isSolved(board),
  };
}

/* ---------- 화면에 쓰는 계산 (역시 순수 함수) ---------- */

/**
 * 조각 하나가 그림의 어느 부분을 보여줄지 계산합니다.
 * 정사각형이 아닌 그림은 가운데를 정사각형으로 잘라 씁니다 (비율 안 찌그러짐).
 */
export function pieceStyle({ index, gridSize, pieceSize, url, imgW, imgH }) {
  const full = pieceSize * gridSize;                 // 그림 전체를 펼쳤을 때 한 변
  const scale = full / Math.min(imgW, imgH);         // 짧은 변을 full 에 맞춤
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const cropX = (drawW - full) / 2;                  // 넘치는 만큼 양쪽에서 균등하게
  const cropY = (drawH - full) / 2;

  const row = Math.floor(index / gridSize);
  const col = index % gridSize;

  return {
    width: pieceSize,
    height: pieceSize,
    backgroundImage: `url("${url}")`,
    backgroundSize: `${drawW}px ${drawH}px`,
    backgroundPosition: `${-(col * pieceSize + cropX)}px ${-(row * pieceSize + cropY)}px`,
  };
}

/** 화면 크기에 맞는 조각 크기를 정합니다. */
export function fitSizes(gridSize, viewportW, viewportH) {
  const avail = Math.min(520, viewportW - 44, viewportH * 0.52);
  const boardPiece = Math.max(48, Math.floor(avail / gridSize));
  const trayPiece = Math.max(44, Math.round(boardPiece * (gridSize >= 5 ? 0.48 : 0.64)));
  return { boardPiece, trayPiece };
}

export function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
