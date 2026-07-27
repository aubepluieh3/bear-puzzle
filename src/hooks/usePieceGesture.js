import { useCallback, useEffect, useRef, useState } from 'react';

/* 좌표 아래에 있는 "놓을 자리"를 찾습니다.
   칸에는 data-cell, 트레이에는 data-tray 를 달아뒀습니다. */
function targetAt(x, y) {
  const node = document.elementFromPoint(x, y);
  if (!node) return null;
  const cell = node.closest('[data-cell]');
  if (cell) return { zone: 'board', cell: Number(cell.dataset.cell) };
  if (node.closest('[data-tray]')) return { zone: 'tray' };
  return null;
}

/* 조각 엘리먼트가 어디에 있던 조각인지 알아냅니다. */
function sourceOf(pieceEl) {
  const piece = Number(pieceEl.dataset.piece);
  const cell = pieceEl.closest('[data-cell]');
  return cell
    ? { piece, zone: 'board', cell: Number(cell.dataset.cell) }
    : { piece, zone: 'tray' };
}

const DRAG_THRESHOLD = 6;   // 이만큼 움직여야 드래그로 봅니다 (손떨림 무시)

/**
 * 조각을 옮기는 두 가지 조작을 한 곳에서 처리합니다.
 *   1) 드래그해서 놓기
 *   2) 톡 눌러 고른 뒤, 놓을 자리를 누르기
 *
 * onMove(src, dst) 로 결과만 알려주고, 상태 변경은 바깥에 맡깁니다.
 */
export function usePieceGesture(onMove) {
  const [selected, setSelected] = useState(null);   // 골라둔 조각
  const [ghost, setGhost] = useState(null);         // 커서를 따라다니는 복제 조각
  const [hoverCell, setHoverCell] = useState(null); // 지금 올라가 있는 칸

  // 이벤트 핸들러 안에서 최신 값을 읽어야 해서 ref 로도 들고 있습니다.
  const selectedRef = useRef(null);
  const dragRef = useRef(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  function select(next) {
    selectedRef.current = next;
    setSelected(next);
  }

  useEffect(() => {
    function handleDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const pieceEl = e.target instanceof Element ? e.target.closest('[data-piece]') : null;

      if (pieceEl) {
        // 조각을 눌렀다 → 드래그인지 탭인지는 손을 뗄 때 결정합니다
        const rect = pieceEl.getBoundingClientRect();
        dragRef.current = {
          src: sourceOf(pieceEl),
          x0: e.clientX,
          y0: e.clientY,
          offX: e.clientX - rect.left,
          offY: e.clientY - rect.top,
          size: rect.width,
          moved: false,
        };
        e.preventDefault();
        return;
      }

      // 빈 칸이나 트레이를 눌렀다 → 골라둔 조각이 있으면 거기로 옮깁니다
      const target = targetAt(e.clientX, e.clientY);
      if (target && selectedRef.current) onMoveRef.current(selectedRef.current, target);
      select(null);
    }

    function handleMove(e) {
      const drag = dragRef.current;
      if (!drag) return;

      if (!drag.moved) {
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) <= DRAG_THRESHOLD) return;
        drag.moved = true;
      }

      setGhost({
        piece: drag.src.piece,
        size: drag.size,
        x: e.clientX - drag.offX,
        y: e.clientY - drag.offY,
      });

      const target = targetAt(e.clientX, e.clientY);
      setHoverCell(target && target.zone === 'board' ? target.cell : null);
    }

    function handleUp(e) {
      const drag = dragRef.current;
      dragRef.current = null;
      setGhost(null);
      setHoverCell(null);
      if (!drag) return;

      if (drag.moved) {
        const target = targetAt(e.clientX, e.clientY);
        if (target) onMoveRef.current(drag.src, target);
        select(null);
        return;
      }

      // 움직이지 않았으면 탭으로 봅니다
      const current = selectedRef.current;
      if (!current) {
        select(drag.src);                       // 고르기
      } else if (current.piece === drag.src.piece) {
        select(null);                           // 같은 조각 다시 누르면 선택 해제
      } else {
        const dst = drag.src.zone === 'board'
          ? { zone: 'board', cell: drag.src.cell }
          : { zone: 'tray' };
        onMoveRef.current(current, dst);        // 고른 조각을 여기로
        select(null);
      }
    }

    window.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, []);

  const clearSelection = useCallback(() => {
    selectedRef.current = null;
    setSelected(null);
  }, []);

  return { selected, ghost, hoverCell, clearSelection };
}
