const ITEMS = [
  "★ 다들 생각만 한 거",
  "♥ 가능? 불가능?",
  "✦ 1020 도파민",
  "♪ 미친 상황 모음",
  "✺ 방금 결과 뒤집힘",
  "⚡ 익명이라 솔직",
];

// 톤다운: 페이지 진입 첫인상을 깔끔하게 — 높이 축소, paper 배경에 ink 텍스트
export default function Marquee() {
  const REPEAT = 3;
  return (
    <div className="bg-(--paper) border-b-2 border-(--ink) overflow-hidden py-1 relative z-20 w-full">
      <div className="marquee-track">
        {Array.from({ length: REPEAT }).flatMap((_, r) =>
          ITEMS.map((t, i) => (
            <span
              key={`${r}-${i}-${t}`}
              className="font-(family-name:--font-accent) text-[11px] text-(--ink)/60 whitespace-nowrap"
            >
              {t}
            </span>
          )),
        )}
      </div>
    </div>
  );
}
