import { pieceStyle } from '../lib/puzzle.js';

/**
 * 퍼즐 조각 하나.
 * data-piece 를 달아두면 드래그 처리(usePieceGesture)가 이 조각을 알아봅니다.
 */
export default function Piece({
  index, gridSize, pieceSize, image,
  selected = false, dimmed = false, ghost = false, style,
}) {
  const base = pieceStyle({
    index, gridSize, pieceSize,
    url: image.url, imgW: image.w, imgH: image.h,
  });

  const className = [
    'piece',
    selected && 'selected',
    dimmed && 'dragging',
    ghost && 'ghost',
  ].filter(Boolean).join(' ');

  return <div className={className} data-piece={index} style={{ ...base, ...style }} />;
}
