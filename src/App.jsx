import { useCallback, useEffect, useState } from 'react';
import { createGame, movePiece, remaining, isFullButWrong, peekLimit } from './lib/puzzle.js';
import { usePuzzleImage } from './hooks/usePuzzleImage.js';
import { usePieceGesture } from './hooks/usePieceGesture.js';
import { useFitSizes } from './hooks/useFitSizes.js';
import { useElapsed } from './hooks/useElapsed.js';
import Toolbar from './components/Toolbar.jsx';
import Stats from './components/Stats.jsx';
import Board from './components/Board.jsx';
import Tray from './components/Tray.jsx';
import Piece from './components/Piece.jsx';
import WinOverlay from './components/WinOverlay.jsx';
import WrongOverlay from './components/WrongOverlay.jsx';

export default function App() {
  const [game, setGame] = useState(() => createGame(3));
  const [round, setRound] = useState(0);          // 새 판마다 올라갑니다 (타이머 초기화용)
  const [peeking, setPeeking] = useState(false);
  const [peeksUsed, setPeeksUsed] = useState(0);
  const [wrongAt, setWrongAt] = useState(null);   // 오답 팝업을 띄운 시점의 이동 횟수
  const [image, loadFile] = usePuzzleImage();

  const { boardPiece, trayPiece } = useFitSizes(game.size);

  // 조각 옮기기는 순수 함수에 맡깁니다. 옮길 수 없으면 같은 상태가 돌아와 다시 그리지 않습니다.
  const move = useCallback((src, dst) => setGame(g => movePiece(g, src, dst)), []);
  const { selected, ghost, hoverCell, clearSelection } = usePieceGesture(move);

  const startRound = useCallback(gridSize => {
    setGame(g => createGame(gridSize ?? g.size));
    setRound(r => r + 1);
    setPeeksUsed(0);
    setPeeking(false);
    setWrongAt(null);
    clearSelection();
  }, [clearSelection]);

  const elapsed = useElapsed(game.moves > 0 && !game.solved, round);

  /* ---------- 미리보기 횟수 ---------- */
  const peekMax = peekLimit(game.size);
  const peeksLeft = peekMax - peeksUsed;

  const startPeek = () => {
    if (peeksLeft <= 0) return;
    setPeeksUsed(used => used + 1);      // 한 번 누르면 한 번 쓴 것으로 셉니다
    setPeeking(true);
  };
  const endPeek = () => setPeeking(false);

  /* ---------- 오답 팝업 ----------
     조각을 다 놓았는데 틀렸다면 그 이동 시점을 기억해 둡니다.
     닫으면 wrongAt 이 비워지고, 다음 이동으로 또 틀리면 다시 뜹니다. */
  const wrong = isFullButWrong(game);
  useEffect(() => {
    if (wrong) setWrongAt(game.moves);
  }, [wrong, game.moves]);
  const showWrong = wrong && wrongAt === game.moves;

  const selectedPiece = selected ? selected.piece : null;
  const ghostPiece = ghost ? ghost.piece : null;

  return (
    <>
      <header>
        <h1>🐻 곰돌이 직소 퍼즐</h1>
        <p className="sub">
          조각을 <b>드래그</b>하거나, <b>톡 눌러 고른 뒤</b> 놓을 자리를 누르세요
        </p>
      </header>

      <Toolbar
        gridSize={game.size}
        onChangeSize={startRound}
        onShuffle={() => startRound()}
        peeksLeft={peeksLeft}
        peekMax={peekMax}
        onPeekStart={startPeek}
        onPeekEnd={endPeek}
        onPickFile={loadFile}
      />

      <Stats elapsed={elapsed} moves={game.moves} left={remaining(game)} />

      <Board
        game={game}
        pieceSize={boardPiece}
        image={image}
        hoverCell={hoverCell}
        selectedPiece={selectedPiece}
        ghostPiece={ghostPiece}
        peeking={peeking}
      />

      <p className="tray-label">조각 트레이</p>
      <Tray
        pieces={game.tray}
        gridSize={game.size}
        pieceSize={trayPiece}
        image={image}
        selectedPiece={selectedPiece}
        ghostPiece={ghostPiece}
      />

      <p className="hint">
        어려우면 <b>👀 미리보기</b>로 정답 그림을 확인하세요!{' '}
        {peekMax > 0
          ? <>단, {game.size}×{game.size} 는 <b>{peekMax}번</b>만 볼 수 있어요 (남은 {peeksLeft}번).</>
          : <>단, {game.size}×{game.size} 는 미리보기 없이 풀어야 해요.</>}
        <br />
        {image.label
          ? <>지금 <code>{image.label}</code> 로 퍼즐을 만들었어요. </>
          : <><code>public/images/</code> 에 <code>bear.png</code> 를 넣으면 자동으로 그 그림을 씁니다. </>}
        <b>🖼️ 이미지 바꾸기</b> 버튼으로 언제든 바꿀 수 있어요.
      </p>

      {/* 드래그 중에 커서를 따라다니는 복제 조각 */}
      {ghost && (
        <Piece
          index={ghost.piece}
          gridSize={game.size}
          pieceSize={ghost.size}
          image={image}
          ghost
          style={{ left: ghost.x, top: ghost.y }}
        />
      )}

      {showWrong && (
        <WrongOverlay
          wrongCount={remaining(game)}
          peeksLeft={peeksLeft}
          onClose={() => setWrongAt(null)}
        />
      )}

      {game.solved && (
        <WinOverlay elapsed={elapsed} moves={game.moves} onAgain={() => startRound()} />
      )}
    </>
  );
}
