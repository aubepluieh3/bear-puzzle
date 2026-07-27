/**
 * 화면을 덮는 팝업 껍데기. 완성 축하와 오답 알림이 같이 씁니다.
 *   tone        'win' | 'wrong' — 이모지 움직임만 달라집니다
 *   onBackdrop  어두운 배경을 누르면 부를 함수 (없으면 닫히지 않음)
 */
export default function Overlay({ tone, onBackdrop, children }) {
  return (
    <div
      className={`overlay ${tone}`}
      onClick={e => {
        if (onBackdrop && e.target === e.currentTarget) onBackdrop();
      }}
    >
      <div className="overlay-card">{children}</div>
    </div>
  );
}
