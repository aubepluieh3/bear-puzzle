/* 게임 규칙 테스트 — 브라우저도, 가짜 DOM 도 필요 없습니다.
   로직이 src/lib/puzzle.js 에 순수 함수로 분리되어 있기 때문입니다.

   실행:  npm test        (Node 18+ 내장 테스트 러너) */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, movePiece, isSolved, remaining, fitSizes, formatTime,
} from '../src/lib/puzzle.js';

const fromTray = piece => ({ piece, zone: 'tray' });
const onBoard = (piece, cell) => ({ piece, zone: 'board', cell });
const toCell = cell => ({ zone: 'board', cell });
const TRAY = { zone: 'tray' };

/** 트레이에 있는 조각을 전부 제자리에 놓습니다 (트레이에 담긴 순서 그대로 = 무작위). */
function solveAll(game) {
  let g = game;
  for (const piece of [...g.tray]) g = movePiece(g, fromTray(piece), toCell(piece));
  return g;
}

test('새 판은 조각이 전부 트레이에 있고 판은 비어 있다', () => {
  const g = createGame(3);
  assert.equal(g.size, 3);
  assert.equal(g.tray.length, 9);
  assert.equal(g.board.length, 9);
  assert.ok(g.board.every(cell => cell === null));
  assert.equal(g.moves, 0);
  assert.equal(g.solved, false);
  assert.equal(remaining(g), 9);
});

test('조각 번호는 0부터 빠짐없이 한 번씩 나온다', () => {
  const g = createGame(4);
  assert.deepEqual([...g.tray].sort((a, b) => a - b), [...Array(16).keys()]);
});

test('무작위 순서로 5판을 풀면 모두 완성된다', () => {
  for (const size of [2, 3, 4, 5, 3]) {
    const g = solveAll(createGame(size));
    assert.equal(g.solved, true, `${size}x${size} 가 완성되지 않았다`);
    assert.equal(g.tray.length, 0);
    assert.equal(g.moves, size * size);
    assert.equal(remaining(g), 0);
  }
});

test('마지막 조각을 놓기 전까지는 완성이 아니다', () => {
  let g = createGame(3);
  for (let i = 0; i < 8; i++) g = movePiece(g, fromTray(i), toCell(i));
  assert.equal(g.solved, false);
  assert.equal(remaining(g), 1);

  g = movePiece(g, fromTray(8), toCell(8));
  assert.equal(g.solved, true);
  assert.equal(g.moves, 9);
});

test('판을 다 채웠어도 자리가 틀리면 완성이 아니다', () => {
  let g = createGame(2);
  g = movePiece(g, fromTray(0), toCell(1));
  g = movePiece(g, fromTray(1), toCell(0));
  g = movePiece(g, fromTray(2), toCell(2));
  g = movePiece(g, fromTray(3), toCell(3));

  assert.equal(g.tray.length, 0);
  assert.equal(g.solved, false);
  assert.equal(remaining(g), 2);

  g = movePiece(g, onBoard(0, 1), toCell(0));   // 두 조각을 맞바꾸면
  assert.equal(g.solved, true);
});

test('이미 놓인 자리에 놓으면 밀려난 조각이 트레이로 돌아간다', () => {
  let g = createGame(3);
  g = movePiece(g, fromTray(0), toCell(4));
  g = movePiece(g, fromTray(1), toCell(4));

  assert.equal(g.board[4], 1);
  assert.ok(g.tray.includes(0));
  assert.equal(g.tray.length + g.board.filter(p => p !== null).length, 9, '조각이 사라지거나 늘었다');
});

test('판 위 두 조각은 자리가 맞바뀐다', () => {
  let g = createGame(3);
  g = movePiece(g, fromTray(0), toCell(0));
  g = movePiece(g, fromTray(1), toCell(1));
  g = movePiece(g, onBoard(0, 0), toCell(1));

  assert.equal(g.board[0], 1);
  assert.equal(g.board[1], 0);
});

test('조각을 트레이로 되돌릴 수 있다', () => {
  let g = createGame(3);
  g = movePiece(g, fromTray(3), toCell(0));
  g = movePiece(g, onBoard(3, 0), TRAY);

  assert.equal(g.board[0], null);
  assert.equal(g.tray.length, 9);
  assert.ok(g.tray.includes(3));
});

test('옮길 수 없는 이동은 상태를 그대로 돌려준다 (React 가 헛되게 다시 그리지 않도록)', () => {
  const g = createGame(3);
  const placed = movePiece(g, fromTray(2), toCell(5));

  assert.equal(movePiece(placed, onBoard(2, 5), toCell(5)), placed, '같은 칸으로 이동');
  assert.equal(movePiece(placed, fromTray(2), toCell(0)), placed, '트레이에 없는 조각');
  assert.equal(movePiece(placed, fromTray(4), TRAY), placed, '트레이에서 트레이로');
  assert.equal(placed.moves, 1, '헛된 이동이 횟수에 들어갔다');
});

test('완성한 뒤에는 아무것도 움직이지 않는다', () => {
  const done = solveAll(createGame(2));
  assert.equal(movePiece(done, onBoard(0, 0), toCell(1)), done);
});

test('원본 상태는 변하지 않는다', () => {
  const g = createGame(3);
  const boardBefore = [...g.board];
  const trayBefore = [...g.tray];

  movePiece(g, fromTray(g.tray[0]), toCell(0));

  assert.deepEqual(g.board, boardBefore);
  assert.deepEqual(g.tray, trayBefore);
  assert.equal(g.moves, 0);
});

test('isSolved 는 빈 판을 완성으로 보지 않는다', () => {
  assert.equal(isSolved([]), false);
  assert.equal(isSolved([null, null]), false);
  assert.equal(isSolved([0, 1, 2, 3]), true);
  assert.equal(isSolved([1, 0, 2, 3]), false);
});

test('formatTime 은 분:초로 두 자리씩 맞춘다', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(9_400), '00:09');
  assert.equal(formatTime(65_000), '01:05');
  assert.equal(formatTime(600_000), '10:00');
});

test('fitSizes 는 좁은 창에서도 최소 크기를 지킨다', () => {
  for (const size of [2, 3, 4, 5]) {
    const { boardPiece, trayPiece } = fitSizes(size, 320, 500);
    assert.ok(boardPiece >= 48, `boardPiece ${boardPiece}`);
    assert.ok(trayPiece >= 44, `trayPiece ${trayPiece}`);
    assert.equal(Number.isInteger(boardPiece), true, '조각 크기가 정수가 아니면 그림이 흐려진다');
  }

  const wide = fitSizes(3, 1920, 1080);
  assert.ok(wide.boardPiece * 3 <= 520, '판이 최대 크기를 넘었다');
});
