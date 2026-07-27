import Piece from './Piece.jsx';

/** 아직 판에 올리지 않은 조각들이 모여 있는 곳. */
export default function Tray({
  pieces, gridSize, pieceSize, image, selectedPiece, ghostPiece,
}) {
  return (
    <div className="tray" data-tray="">
      {pieces.length === 0
        ? <span className="tray-empty">조각을 여기로 되돌릴 수 있어요</span>
        : pieces.map(piece => (
            <Piece
              key={piece}
              index={piece}
              gridSize={gridSize}
              pieceSize={pieceSize}
              image={image}
              selected={selectedPiece === piece}
              dimmed={ghostPiece === piece}
            />
          ))}
    </div>
  );
}
