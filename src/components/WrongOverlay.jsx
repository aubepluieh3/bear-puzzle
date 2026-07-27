import Overlay from './Overlay.jsx';

/** 조각은 다 놓았지만 자리가 틀렸을 때 띄웁니다. */
export default function WrongOverlay({ wrongCount, peeksLeft, onClose }) {
  return (
    <Overlay tone="wrong" onBackdrop={onClose}>
      <div className="overlay-emoji">🙃</div>
      <h2>아직 아니에요!</h2>
      <p className="overlay-line">
        조각은 다 놓았지만 <span>{wrongCount}조각</span>이 제자리가 아니에요
      </p>
      <p className="overlay-note">
        {peeksLeft > 0
          ? <>어려우면 <b>👀 미리보기</b>로 정답 그림을 확인하세요 (남은 {peeksLeft}번)</>
          : <>조각 두 개를 서로 바꿔가며 맞춰보세요</>}
      </p>
      <button className="btn primary" onClick={onClose}>다시 맞춰보기</button>
    </Overlay>
  );
}
