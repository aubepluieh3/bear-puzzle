import { useEffect, useState } from 'react';
import { fitSizes } from '../lib/puzzle.js';

/** 창 크기와 난이도에 맞는 조각 크기를 알려줍니다. 창 크기가 바뀌면 다시 계산합니다. */
export function useFitSizes(gridSize) {
  const [sizes, setSizes] = useState(() => fitSizes(gridSize, window.innerWidth, window.innerHeight));

  useEffect(() => {
    const recalc = () => setSizes(fitSizes(gridSize, window.innerWidth, window.innerHeight));
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [gridSize]);

  return sizes;
}
