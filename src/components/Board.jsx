import Piece from './Piece.jsx';

/** 퍼즐판. 각 칸에 data-cell 을 달아 놓을 자리를 알려줍니다. */
export default function Board({
  game, pieceSize, image, hoverCell, selectedPiece, ghostPiece, peeking,
}) {
  return (
    <div className="board-wrap">
      <div
        className={game.solved ? 'board solved' : 'board'}
        style={{ '--n': game.size, '--piece': `${pieceSize}px` }}
      >
        {game.board.map((piece, i) => (
          <div key={i} data-cell={i} className={hoverCell === i ? 'cell over' : 'cell'}>
            {piece !== null && (
              <Piece
                index={piece}
                gridSize={game.size}
                pieceSize={pieceSize}
                image={image}
                selected={selectedPiece === piece}
                dimmed={ghostPiece === piece}
              />
            )}
          </div>
        ))}
      </div>

      {/* 미리보기는 필요할 때만 그립니다 — hidden 속성을 쓰지 않으니
          CSS 우선순위 때문에 안 숨겨지는 일이 아예 생기지 않습니다. */}
      {peeking && (
        <div className="preview" style={{ backgroundImage: `url("${image.url}")` }} />
      )}
    </div>
  );
}
