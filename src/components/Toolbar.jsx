const SIZES = [2, 3, 4, 5];

export default function Toolbar({
  gridSize, onChangeSize, onShuffle,
  peeksLeft, peekMax, onPeekStart, onPeekEnd,
  onPickFile,
}) {
  const peekUsedUp = peeksLeft <= 0;

  return (
    <div className="toolbar">
      <div className="seg">
        {SIZES.map(n => (
          <button key={n} className={n === gridSize ? 'on' : undefined} onClick={() => onChangeSize(n)}>
            {n}×{n}
          </button>
        ))}
      </div>

      <button className="btn" onClick={onShuffle}>🔀 다시 섞기</button>

      {/* 누르고 있는 동안만 정답 그림이 보이고, 한 번 누르면 한 번 쓴 것으로 셉니다 */}
      <button
        className="btn"
        disabled={peekUsedUp}
        title={peekUsedUp
          ? (peekMax === 0 ? '이 난이도는 미리보기 없이 풀어요' : '미리보기를 다 썼어요')
          : '누르고 있는 동안 정답 그림이 보입니다'}
        onPointerDown={onPeekStart}
        onPointerUp={onPeekEnd}
        onPointerLeave={onPeekEnd}
        onPointerCancel={onPeekEnd}
      >
        👀 미리보기 <span className="count">{peeksLeft}/{peekMax}</span>
      </button>

      <label className="btn file">
        🖼️ 이미지 바꾸기
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={e => onPickFile(e.target.files[0])}
        />
      </label>
    </div>
  );
}
