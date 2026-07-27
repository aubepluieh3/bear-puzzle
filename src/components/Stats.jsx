import { formatTime } from '../lib/puzzle.js';

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="k">{label}</span>
      <span className="v">{value}</span>
    </div>
  );
}

export default function Stats({ elapsed, moves, left }) {
  return (
    <div className="stats">
      <Stat label="시간" value={formatTime(elapsed)} />
      <Stat label="이동" value={moves} />
      <Stat label="남은 조각" value={left} />
    </div>
  );
}
