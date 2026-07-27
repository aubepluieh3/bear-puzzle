import Overlay from './Overlay.jsx';
import { formatTime } from '../lib/puzzle.js';

export default function WinOverlay({ elapsed, moves, onAgain }) {
  return (
    <Overlay tone="win">
      <div className="overlay-emoji">🐻</div>
      <h2>완성!</h2>
      <p className="overlay-line">
        <span>{formatTime(elapsed)}</span> 만에 <span>{moves}</span>번 움직여서 맞췄어요
      </p>
      <button className="btn primary" onClick={onAgain}>한 판 더 🔁</button>
    </Overlay>
  );
}
