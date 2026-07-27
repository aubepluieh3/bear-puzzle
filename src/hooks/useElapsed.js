import { useEffect, useRef, useState } from 'react';

/**
 * 경과 시간(ms)을 셉니다.
 *   running   true 인 동안만 흐릅니다 (첫 이동에 시작, 완성하면 멈춤)
 *   resetKey  값이 바뀌면 0 으로 되돌립니다 (새 판)
 */
export function useElapsed(running, resetKey) {
  const [ms, setMs] = useState(0);
  const startedAt = useRef(null);

  useEffect(() => {
    startedAt.current = null;
    setMs(0);
  }, [resetKey]);

  useEffect(() => {
    if (!running) return;
    if (startedAt.current === null) startedAt.current = Date.now();
    const id = setInterval(() => setMs(Date.now() - startedAt.current), 200);
    return () => clearInterval(id);
  }, [running]);

  return ms;
}
