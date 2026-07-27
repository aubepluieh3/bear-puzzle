/* 진짜 브라우저로 직접 조작해보는 검증 스크립트.
   이미 깔려 있는 Edge 를 원격 조종하므로 브라우저를 따로 내려받지 않습니다.

   실행:  npm run dev        (다른 터미널에서 켜 두고)
          npm run test:e2e
   결과 화면은 e2e/shots/ 에 저장됩니다.

   주의: 조작한 뒤에는 React 가 다시 그릴 때까지 기다려야 합니다.
        mouse.up() 이 끝난 시점에는 화면이 아직 예전 상태입니다. */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const URL = process.env.PUZZLE_URL ?? 'http://localhost:5173/';
const SHOTS = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(SHOTS, { recursive: true });

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? `   → ${extra}` : ''}`); }
}

/* ---------- 선택자 ---------- */

const trayPiece = n => `.tray [data-piece="${n}"]`;
const cell = n => `[data-cell="${n}"]`;
const pieceInCell = n => `[data-cell="${n}"] [data-piece]`;
const pieceAt = (c, n) => `[data-cell="${c}"] [data-piece="${n}"]`;

/* ---------- 조작 도우미 ---------- */

const center = box => [box.x + box.width / 2, box.y + box.height / 2];

/**
 * 조각을 잡아 끌어서 목표 위에 놓습니다.
 *
 * 주의: page.mouse 는 locator.click() 과 달리 자동으로 스크롤해 주지 않습니다.
 *      화면 밖 좌표로 이동시키면 이벤트가 아무 데도 닿지 않아 조용히 실패합니다.
 *      (트레이 조각은 줄바꿈되어 화면 아래로 밀려나기 쉽습니다)
 */
async function drag(page, fromSel, toSel) {
  await page.locator(fromSel).first().scrollIntoViewIfNeeded();
  await page.locator(toSel).first().scrollIntoViewIfNeeded();

  const from = await page.locator(fromSel).first().boundingBox();
  const to = await page.locator(toSel).first().boundingBox();
  if (!from || !to) throw new Error(`드래그 대상을 못 찾음: ${fromSel} → ${toSel}`);

  const vh = page.viewportSize().height;
  for (const [name, box] of [['출발', from], ['도착', to]]) {
    const [, y] = center(box);
    if (y < 0 || y > vh) {
      throw new Error(`${name} 지점이 화면 밖입니다 (y=${Math.round(y)}, 화면높이=${vh}) — 뷰포트를 키우세요`);
    }
  }

  await page.mouse.move(...center(from));
  await page.mouse.down();
  // 여러 단계로 움직여야 드래그로 인식됩니다 (6px 넘어야 시작)
  await page.mouse.move(...center(to), { steps: 12 });
  await page.mouse.up();
}

/** 조각 n 을 트레이에서 칸 c 로. 실제로 들어갈 때까지 기다립니다. */
async function place(page, n, c) {
  await drag(page, trayPiece(n), cell(c));
  await page.waitForSelector(pieceAt(c, n), { timeout: 4000 });
}

/** 판에 놓인 조각을 다른 칸으로. 자리를 바꿀 때까지 기다립니다. */
async function moveOnBoard(page, fromCell, toCell) {
  const piece = await page.locator(pieceInCell(fromCell)).getAttribute('data-piece');
  await drag(page, pieceInCell(fromCell), cell(toCell));
  await page.waitForSelector(pieceAt(toCell, piece), { timeout: 4000 });
}

const count = (page, sel) => page.locator(sel).count();
const text = (page, sel) => page.locator(sel).first().innerText();

/** 조건이 참이 될 때까지 기다립니다 (React 렌더를 기다리는 용도). */
async function until(fn, timeout = 4000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await fn()) return true;
    if (Date.now() > deadline) return false;
    await new Promise(r => setTimeout(r, 50));
  }
}

/* ---------- 검증 시작 ---------- */

const browser = await chromium.launch({ channel: 'msedge' });
// 트레이가 여러 줄로 늘어나도 스크롤 없이 다 보이도록 넉넉한 화면을 씁니다.
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });

page.on('pageerror', err => { fail++; console.log(`  ✗ 콘솔 에러: ${err.message}`); });

const peekBtn = page.locator('.toolbar button', { hasText: '미리보기' });
const shuffleBtn = page.locator('.toolbar button', { hasText: '다시 섞기' });
const movesText = () => text(page, '.stat:nth-child(2) .v');
const leftText = () => text(page, '.stat:nth-child(3) .v');

/**
 * 화면을 저장합니다.
 * 팝업의 등장 애니메이션(rise)과 판의 틈이 닫히는 전환이 끝난 뒤에 찍어야
 * 실제로 사용자가 보는 모습이 남습니다. 안 그러면 반투명한 중간 상태가 찍힙니다.
 */
const shot = async name => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SHOTS, name), animations: 'disabled' });
};

/** 미리보기를 한 번 씁니다 (누르고 있다가 뗌). */
async function usePeek() {
  await peekBtn.scrollIntoViewIfNeeded();
  await page.mouse.move(...center(await peekBtn.boundingBox()));
  await page.mouse.down();
  const shown = await until(async () => (await count(page, '.preview')) === 1);
  await page.mouse.up();
  await until(async () => (await count(page, '.preview')) === 0);
  return shown;
}

try {
  await page.goto(URL);
  await page.waitForSelector('.board .cell');

  /* ===== 1. 첫 화면 ===== */
  console.log('\n[1] 페이지를 처음 열었을 때');
  ok('팝업이 하나도 안 떠 있다 (아까 그 버그)', (await count(page, '.overlay')) === 0);
  ok('칸 9개가 그려졌다', (await count(page, '.cell')) === 9);
  ok('트레이에 조각 9개가 있다', (await count(page, '.tray [data-piece]')) === 9);
  ok('판은 비어 있다', (await count(page, '.board [data-piece]')) === 0);
  ok('미리보기 안내 문구가 있다', (await text(page, '.hint')).includes('어려우면'));
  ok('미리보기 남은 횟수가 1/1', (await peekBtn.innerText()).includes('1/1'),
     (await peekBtn.innerText()).replace(/\n/g, ' '));
  await shot('1-처음.png');

  /* ===== 2. 미리보기 ===== */
  console.log('\n[2] 미리보기 (3x3 은 1번)');
  await page.mouse.move(...center(await peekBtn.boundingBox()));
  await page.mouse.down();
  ok('누르고 있는 동안 정답 그림이 보인다',
     await until(async () => (await count(page, '.preview')) === 1));
  await shot('2-미리보기.png');
  await page.mouse.up();
  ok('손을 떼면 사라진다', await until(async () => (await count(page, '.preview')) === 0));
  ok('한 번 쓰면 버튼이 비활성화된다', await until(() => peekBtn.isDisabled()));
  ok('남은 횟수가 0/1 로 바뀐다', (await peekBtn.innerText()).includes('0/1'));

  /* ===== 3. 드래그로 조각 놓기 ===== */
  console.log('\n[3] 드래그해서 조각 놓기');
  await place(page, 4, 4);
  ok('조각 4가 칸 4에 들어갔다', (await count(page, pieceAt(4, 4))) === 1);
  ok('트레이 조각이 8개로 줄었다', (await count(page, '.tray [data-piece]')) === 8);
  ok('이동 횟수가 1', (await movesText()) === '1', await movesText());
  ok('남은 조각이 8', (await leftText()) === '8', await leftText());

  /* ===== 4. 자리 다투기 ===== */
  console.log('\n[4] 이미 놓인 자리에 다른 조각 놓기');
  await place(page, 7, 4);
  ok('새 조각(7)이 그 칸을 차지한다', (await count(page, pieceAt(4, 7))) === 1);
  ok('밀려난 조각(4)이 트레이로 돌아왔다', (await count(page, trayPiece(4))) === 1);
  ok('조각 총 개수가 9개로 유지된다', (await count(page, '[data-piece]')) === 9);

  /* ===== 5. 톡 눌러서 고르고 놓기 ===== */
  console.log('\n[5] 탭으로 고른 뒤 놓기');
  await page.locator(trayPiece(0)).first().click();
  ok('고른 조각에 표시가 생긴다',
     await until(async () => (await count(page, '.piece.selected')) === 1));
  await page.locator(cell(0)).first().click();
  ok('누른 칸으로 옮겨진다', await until(async () => (await count(page, pieceAt(0, 0))) === 1));
  ok('선택 표시가 사라진다', (await count(page, '.piece.selected')) === 0);

  /* ===== 6. 판에서 트레이로 되돌리기 ===== */
  console.log('\n[6] 조각을 트레이로 되돌리기');
  await drag(page, pieceInCell(0), '.tray');
  ok('칸이 비워졌다', await until(async () => (await count(page, pieceInCell(0))) === 0));
  ok('조각이 트레이로 돌아왔다', (await count(page, trayPiece(0))) === 1);

  /* ===== 7. 다 채웠지만 틀렸을 때 ===== */
  console.log('\n[7] 조각을 다 놓았지만 두 자리가 틀렸을 때');
  await shuffleBtn.click();
  await until(async () => (await count(page, '.tray [data-piece]')) === 9);
  ok('새 판에서 미리보기 횟수가 되살아났다', !(await peekBtn.isDisabled()));

  // 1번과 2번만 서로 바꿔 놓고, 나머지는 제자리에
  await place(page, 1, 2);
  await place(page, 2, 1);
  for (const n of [0, 3, 4, 5, 6, 7, 8]) await place(page, n, n);

  ok('트레이가 비었다', (await count(page, '.tray [data-piece]')) === 0);
  ok('오답 팝업이 떴다', await until(async () => (await count(page, '.overlay.wrong')) === 1));
  ok('축하 팝업은 안 떴다', (await count(page, '.overlay.win')) === 0);

  const wrongText = (await text(page, '.overlay.wrong')).replace(/\n/g, ' ');
  ok('틀린 조각 수(2조각)를 알려준다', wrongText.includes('2조각'), wrongText);
  ok('미리보기가 남았으면 그걸 권한다', wrongText.includes('남은 1번'), wrongText);
  await shot('3-오답.png');

  await page.locator('.overlay.wrong button').click();
  ok('닫으면 팝업이 사라진다', await until(async () => (await count(page, '.overlay')) === 0));

  /* ===== 7-2. 미리보기를 다 쓰면 조언이 달라진다 ===== */
  console.log('\n[7-2] 미리보기를 다 쓴 뒤 또 틀렸을 때');
  await usePeek();
  ok('미리보기를 다 써서 버튼이 잠겼다', await peekBtn.isDisabled());

  // 이미 놓인 두 조각을 맞바꿔 다시 틀린 상태로 만듭니다
  await moveOnBoard(page, 3, 5);
  ok('다시 오답 팝업이 떴다 (닫았어도 또 알려준다)',
     await until(async () => (await count(page, '.overlay.wrong')) === 1));

  const wrongText2 = (await text(page, '.overlay.wrong')).replace(/\n/g, ' ');
  ok('미리보기를 다 썼으니 다른 조언을 한다', wrongText2.includes('바꿔가며'), wrongText2);
  ok('틀린 조각이 4개로 늘었다', wrongText2.includes('4조각'), wrongText2);
  await shot('3b-오답-미리보기소진.png');

  await page.locator('.overlay.wrong button').click();
  await until(async () => (await count(page, '.overlay')) === 0);

  // 되돌려서 원래의 "2조각 틀림" 상태로
  await moveOnBoard(page, 5, 3);
  await until(async () => (await count(page, '.overlay')) === 1);
  await page.locator('.overlay.wrong button').click();
  await until(async () => (await count(page, '.overlay')) === 0);

  /* ===== 8. 두 조각을 맞바꿔 완성 ===== */
  console.log('\n[8] 틀린 두 조각을 맞바꿔서 완성');
  await moveOnBoard(page, 1, 2);

  ok('축하 팝업이 떴다', await until(async () => (await count(page, '.overlay.win')) === 1));
  const winText = (await text(page, '.overlay.win')).replace(/\n/g, ' ');
  ok('완성 문구가 나온다', winText.includes('완성'), winText);
  ok('판에 틈이 사라졌다 (solved 표시)', (await count(page, '.board.solved')) === 1);
  await shot('4-완성.png');

  /* ===== 9. 한 판 더 ===== */
  console.log('\n[9] 한 판 더');
  await page.locator('.overlay.win button').click();
  ok('팝업이 닫힌다', await until(async () => (await count(page, '.overlay')) === 0));
  ok('조각이 전부 트레이로 돌아간다', (await count(page, '.tray [data-piece]')) === 9);
  ok('이동 횟수가 0으로 초기화된다', (await movesText()) === '0', await movesText());
  ok('미리보기 횟수도 되살아난다', (await peekBtn.innerText()).includes('1/1'));

  /* ===== 10. 난이도별 미리보기 횟수 ===== */
  console.log('\n[10] 난이도별 미리보기 횟수');
  for (const [label, expect, cells] of [
    ['2×2', '0/0', 4], ['3×3', '1/1', 9], ['4×4', '2/2', 16], ['5×5', '3/3', 25],
  ]) {
    await page.locator('.seg button', { hasText: label }).click();
    await until(async () => (await count(page, '.cell')) === cells);

    const shown = (await peekBtn.innerText()).replace(/\n/g, ' ');
    const disabled = await peekBtn.isDisabled();
    const wantDisabled = expect === '0/0';
    ok(`${label} → ${expect}${wantDisabled ? ' (비활성)' : ''}, 칸 ${cells}개`,
       shown.includes(expect) && disabled === wantDisabled, `버튼: ${shown}, 비활성: ${disabled}`);
  }
  await shot('5-5x5.png');

} finally {
  await browser.close();
}

console.log('\n' + '='.repeat(46));
console.log(`  통과 ${pass} / 실패 ${fail}`);
console.log(`  화면: ${SHOTS}`);
console.log('='.repeat(46) + '\n');
process.exit(fail === 0 ? 0 : 1);
