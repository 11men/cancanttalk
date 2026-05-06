const ITEMS = [
  "★ 다들 생각만 한 거",
  "♥ 가능? 불가능?",
  "✦ 1020 도파민",
  "♪ 미친 상황 모음",
  "✺ 방금 결과 뒤집힘",
  "⚡ 익명이라 솔직",
];

export default function Marquee() {
  const REPEAT = 3;
  return (
    <div className="bg-(--acid-pink) border-b-[3px] border-(--ink) overflow-hidden py-2 relative z-20 w-full">
      <div className="marquee-track">
        {Array.from({ length: REPEAT }).flatMap((_, r) =>
          ITEMS.map((t, i) => (
            <span
              key={`${r}-${i}-${t}`}
              className="font-(family-name:--font-accent) text-[13px] text-(--paper) whitespace-nowrap"
            >
              {t}
            </span>
          )),
        )}
      </div>
    </div>
  );
}
