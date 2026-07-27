const SIZES = [2, 3, 4, 5];

export default function Toolbar({
  gridSize, onChangeSize, onShuffle, onPeekStart, onPeekEnd, onPickFile,
}) {
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

      {/* 누르고 있는 동안만 정답 그림을 보여줍니다 */}
      <button
        className="btn"
        onPointerDown={onPeekStart}
        onPointerUp={onPeekEnd}
        onPointerLeave={onPeekEnd}
        onPointerCancel={onPeekEnd}
      >
        👀 미리보기
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
