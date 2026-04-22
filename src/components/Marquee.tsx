const ITEMS = [
  "★ 찐력 테스트",
  "♥ 가능? 불가능?",
  "✦ 1020 도파민",
  "♪ 킹받는 상황 모음",
  "✺ 오늘의 핫토픽",
  "⚡ 실시간 투표",
];

export default function Marquee() {
  const track = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="bg-[var(--acid-pink)] border-b-[3px] border-[var(--ink)] overflow-hidden py-2 relative z-20">
      <div className="marquee-track">
        {track.map((t, i) => (
          <span
            key={i}
            className="font-[family-name:var(--font-accent)] text-[13px] text-[var(--paper)] whitespace-nowrap"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
