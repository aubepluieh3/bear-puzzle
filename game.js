'use strict';

/* ===========================================================
   곰돌이 직소 퍼즐 — 게임 로직

   구조 한눈에:
     board[i]  퍼즐판 i번 칸에 놓인 조각 번호 (없으면 null)
     tray[]    아직 판에 올리지 않은 조각 번호들
     조각 번호 = 그 조각이 들어가야 할 정답 칸 번호
     → 그래서 board[i] === i 가 전부 참이면 완성!
   =========================================================== */

/* ---------- 1. 이미지 ---------- */

// images/ 폴더에서 아래 순서로 찾아봅니다. 하나라도 있으면 그걸 씁니다.
const IMAGE_CANDIDATES = [
  'images/bear.png',
  'images/bear.jpg',
  'images/bear.jpeg',
  'images/bear.webp',
];

// 아무것도 없을 때 쓰는 기본 곰 그림 (외부 파일 없이 코드로 그립니다)
const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#F7DCAE"/>
  <circle cx="128" cy="126" r="43" fill="#C08E5E"/>
  <circle cx="272" cy="126" r="43" fill="#C08E5E"/>
  <circle cx="128" cy="126" r="22" fill="#E8C9A4"/>
  <circle cx="272" cy="126" r="22" fill="#E8C9A4"/>
  <ellipse cx="200" cy="336" rx="122" ry="92" fill="#C08E5E"/>
  <ellipse cx="200" cy="352" rx="80" ry="66" fill="#E8C9A4"/>
  <circle cx="200" cy="202" r="106" fill="#C08E5E"/>
  <ellipse cx="200" cy="238" rx="61" ry="46" fill="#F2E0C6"/>
  <circle cx="128" cy="218" r="17" fill="#E9A29B" opacity=".55"/>
  <circle cx="272" cy="218" r="17" fill="#E9A29B" opacity=".55"/>
  <circle cx="166" cy="186" r="11" fill="#3B2A1C"/>
  <circle cx="234" cy="186" r="11" fill="#3B2A1C"/>
  <ellipse cx="200" cy="222" rx="16" ry="12" fill="#3B2A1C"/>
  <path d="M200 234 v13 M200 247 q-15 12 -29 1 M200 247 q15 12 29 1"
        stroke="#3B2A1C" stroke-width="5" fill="none" stroke-linecap="round"/>
</svg>`;

const PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PLACEHOLDER_SVG.trim());

/* ---------- 2. 상태 ---------- */

let size = 3;             // 한 변의 조각 수 (3이면 3×3 = 9조각)
let board = [];
let tray = [];
let selected = null;      // 탭으로 고른 조각 {piece, zone, cell}
let drag = null;          // 드래그 중인 정보
let moves = 0;
let solved = false;
let startAt = null;
let timerId = null;

let imgUrl = PLACEHOLDER;   // 현재 쓰는 그림
let imgW = 400, imgH = 400; // 원본 크기 (정사각형이 아니어도 가운데를 잘라 씁니다)

let boardPiece = 100;     // 판 위 조각 한 변 (px)
let trayPiece = 66;       // 트레이 조각 한 변 (px)

/* ---------- 3. DOM ---------- */

const el = {
  board:   document.getElementById('board'),
  tray:    document.getElementById('tray'),
  preview: document.getElementById('preview'),
  time:    document.getElementById('time'),
  moves:   document.getElementById('moves'),
  left:    document.getElementById('left'),
  win:     document.getElementById('win'),
  winTime: document.getElementById('winTime'),
  winMoves:document.getElementById('winMoves'),
  hint:    document.getElementById('hint'),
};

/* ---------- 4. 이미지 불러오기 ---------- */

function loadImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function setImage(url) {
  const img = await loadImage(url);
  if (!img) return false;
  imgUrl = url;
  imgW = img.naturalWidth || 400;
  imgH = img.naturalHeight || 400;
  el.preview.style.backgroundImage = `url("${imgUrl}")`;
  return true;
}

// 후보 파일을 차례로 시도하고, 다 없으면 기본 곰 그림으로.
async function findImage() {
  for (const url of IMAGE_CANDIDATES) {
    if (await setImage(url)) {
      el.hint.innerHTML = `<code>${url}</code> 를 쓰고 있어요. ` +
        `다른 그림으로 바꾸려면 <b>🖼️ 이미지 바꾸기</b>를 누르세요.`;
      return;
    }
  }
  await setImage(PLACEHOLDER);
}

/* ---------- 5. 조각 만들기 ----------
   그림을 정사각형으로 "가운데 잘라내기" 해서 조각마다 필요한 부분만 보여줍니다.
   pieceSize 가 달라도(판/트레이) 같은 그림 조각이 나오도록 매번 계산합니다. */

function makePiece(index, pieceSize) {
  const full = pieceSize * size;              // 그림 전체를 펼쳤을 때의 한 변
  const scale = full / Math.min(imgW, imgH);  // 짧은 변을 full 에 맞춤 = cover
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const cropX = (drawW - full) / 2;           // 넘치는 만큼 좌우/상하 균등하게 잘라냄
  const cropY = (drawH - full) / 2;

  const row = Math.floor(index / size);
  const col = index % size;

  const p = document.createElement('div');
  p.className = 'piece';
  p.dataset.piece = index;
  p.style.width  = pieceSize + 'px';
  p.style.height = pieceSize + 'px';
  p.style.backgroundImage = `url("${imgUrl}")`;
  p.style.backgroundSize = `${drawW}px ${drawH}px`;
  p.style.backgroundPosition = `${-(col * pieceSize + cropX)}px ${-(row * pieceSize + cropY)}px`;

  if (selected && selected.piece === index) p.classList.add('selected');
  return p;
}

/* ---------- 6. 화면 그리기 ---------- */

function layout() {
  const avail = Math.min(520, window.innerWidth - 44, window.innerHeight * 0.52);
  const boardSize = Math.max(232, Math.floor(avail / size) * size);

  boardPiece = boardSize / size;
  trayPiece = Math.max(44, Math.round(boardPiece * (size >= 5 ? 0.48 : 0.64)));

  el.board.style.setProperty('--n', size);
  el.board.style.setProperty('--piece', boardPiece + 'px');
}

function render() {
  el.board.replaceChildren();
  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.cell = i;
    if (board[i] !== null) cell.appendChild(makePiece(board[i], boardPiece));
    el.board.appendChild(cell);
  }

  el.tray.replaceChildren(...tray.map(p => makePiece(p, trayPiece)));

  el.moves.textContent = moves;
  el.left.textContent = tray.length + board.filter((p, i) => p !== null && p !== i).length;
  el.board.classList.toggle('solved', solved);
}

/* ---------- 7. 조각 옮기기 ---------- */

// src, dst 모두 {zone:'board', cell:n} 또는 {zone:'tray'} 형태
function movePiece(src, dst) {
  if (!src || !dst || solved) return;

  if (dst.zone === 'tray') {
    if (src.zone === 'tray') return;          // 트레이 → 트레이는 할 일 없음
    board[src.cell] = null;
    tray.push(src.piece);

  } else if (src.zone === 'board') {
    if (src.cell === dst.cell) return;
    const occupant = board[dst.cell];         // null 이면 그냥 이동, 아니면 자리 교환
    board[dst.cell] = src.piece;
    board[src.cell] = occupant;

  } else {
    const occupant = board[dst.cell];
    tray.splice(tray.indexOf(src.piece), 1);
    board[dst.cell] = src.piece;
    if (occupant !== null) tray.push(occupant);   // 밀려난 조각은 트레이로
  }

  moves++;
  selected = null;
  startTimer();
  checkWin();
  render();
}

function checkWin() {
  if (tray.length > 0) return;
  if (!board.every((p, i) => p === i)) return;

  solved = true;
  stopTimer();
  el.winTime.textContent = el.time.textContent;
  el.winMoves.textContent = moves;
  el.win.hidden = false;
}

/* ---------- 8. 입력 처리 (드래그 + 탭, 마우스·터치 공용) ---------- */

// 화면 좌표 (x, y) 아래에 있는 놓을 자리를 찾습니다.
function targetAt(x, y) {
  const node = document.elementFromPoint(x, y);
  if (!node) return null;
  const cell = node.closest('.cell');
  if (cell) return { zone: 'board', cell: Number(cell.dataset.cell) };
  if (node.closest('#tray')) return { zone: 'tray' };
  return null;
}

// 조각 엘리먼트가 "어디에 있던 조각인지" 알아냅니다.
function sourceOf(pieceEl) {
  const piece = Number(pieceEl.dataset.piece);
  const cell = pieceEl.closest('.cell');
  return cell
    ? { piece, zone: 'board', cell: Number(cell.dataset.cell) }
    : { piece, zone: 'tray' };
}

function onPointerDown(e) {
  if (solved || e.button !== 0 && e.pointerType === 'mouse') return;

  const pieceEl = e.target.closest('.piece');

  if (pieceEl) {
    // 조각을 눌렀다 → 드래그일지 탭일지는 손을 뗄 때 결정
    drag = { src: sourceOf(pieceEl), el: pieceEl, x0: e.clientX, y0: e.clientY, moved: false };
    e.preventDefault();
    return;
  }

  // 빈 칸이나 트레이를 눌렀다 → 골라둔 조각이 있으면 거기에 놓기
  const target = targetAt(e.clientX, e.clientY);
  if (target && selected) {
    movePiece(selected, target);
  } else if (!target && selected) {
    selected = null;                          // 바깥을 누르면 선택 해제
    render();
  }
}

function onPointerMove(e) {
  if (!drag) return;

  if (!drag.moved) {
    const far = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6;
    if (!far) return;                         // 손떨림은 드래그로 보지 않음
    drag.moved = true;

    const rect = drag.el.getBoundingClientRect();
    drag.offX = drag.x0 - rect.left;
    drag.offY = drag.y0 - rect.top;

    drag.ghost = drag.el.cloneNode(true);
    drag.ghost.classList.add('ghost');
    drag.ghost.classList.remove('selected');
    document.body.appendChild(drag.ghost);
    drag.el.classList.add('dragging');
  }

  drag.ghost.style.left = (e.clientX - drag.offX) + 'px';
  drag.ghost.style.top  = (e.clientY - drag.offY) + 'px';

  // 지금 어느 칸 위에 있는지 표시
  const target = targetAt(e.clientX, e.clientY);
  el.board.querySelectorAll('.cell.over').forEach(c => c.classList.remove('over'));
  if (target && target.zone === 'board') {
    el.board.children[target.cell].classList.add('over');
  }
}

function onPointerUp(e) {
  if (!drag) return;
  const d = drag;
  drag = null;

  if (d.ghost) d.ghost.remove();
  d.el.classList.remove('dragging');
  el.board.querySelectorAll('.cell.over').forEach(c => c.classList.remove('over'));

  if (d.moved) {
    // 드래그해서 놓기
    const target = targetAt(e.clientX, e.clientY);
    if (target) movePiece(d.src, target);
    else render();
    return;
  }

  // 그냥 톡 눌렀다 → 선택 / 선택 해제 / 두 조각 맞바꾸기
  if (!selected) {
    selected = d.src;
  } else if (selected.piece === d.src.piece) {
    selected = null;
  } else {
    const dst = d.src.zone === 'board' ? { zone: 'board', cell: d.src.cell } : { zone: 'tray' };
    movePiece(selected, dst);
    return;
  }
  render();
}

/* ---------- 9. 타이머 ---------- */

function fmt(ms) {
  const total = Math.floor(ms / 1000);
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

function startTimer() {
  if (timerId) return;                        // 첫 이동에만 시작
  startAt = Date.now();
  timerId = setInterval(() => { el.time.textContent = fmt(Date.now() - startAt); }, 250);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

/* ---------- 10. 새 판 ---------- */

function shuffled(n) {
  const a = [...Array(n).keys()];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newGame() {
  const n = size * size;
  board = new Array(n).fill(null);
  tray = shuffled(n);
  moves = 0;
  solved = false;
  selected = null;

  stopTimer();
  el.time.textContent = '00:00';
  el.win.hidden = true;
  el.preview.hidden = true;

  layout();
  render();
}

/* ---------- 11. 버튼 연결 ---------- */

document.getElementById('shuffle').addEventListener('click', newGame);
document.getElementById('again').addEventListener('click', newGame);

document.getElementById('sizes').addEventListener('click', e => {
  const btn = e.target.closest('button[data-size]');
  if (!btn) return;
  document.querySelectorAll('#sizes button').forEach(b => b.classList.toggle('on', b === btn));
  size = Number(btn.dataset.size);
  newGame();
});

// 미리보기: 누르고 있는 동안만 보여줍니다
const peek = document.getElementById('peek');
const showPeek = () => { el.preview.hidden = false; };
const hidePeek = () => { el.preview.hidden = true; };
peek.addEventListener('pointerdown', showPeek);
peek.addEventListener('pointerup', hidePeek);
peek.addEventListener('pointerleave', hidePeek);
peek.addEventListener('pointercancel', hidePeek);

// 이미지 바꾸기: 고른 파일을 그대로 읽어서 퍼즐로 만듭니다
document.getElementById('file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    if (await setImage(reader.result)) {
      el.hint.innerHTML = `<b>${file.name}</b> 로 퍼즐을 만들었어요! 🎉`;
      newGame();
    }
  };
  reader.readAsDataURL(file);
});

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('pointercancel', onPointerUp);

window.addEventListener('resize', () => { layout(); render(); });

/* ---------- 12. 시작 ---------- */

(async function start() {
  await findImage();
  newGame();
})();
