import Link from "next/link";

export default function SubmitSuccessPage() {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="brutal brutal-lg w-full max-w-md bg-(--acid-lime) p-8 text-center relative">
        <span className="sticker absolute -top-4 left-1/2 -translate-x-1/2 bg-(--ink) text-(--acid-lime)">
          ✓ SUCCESS
        </span>
        <div className="text-7xl mb-4 animate-bounce-in">🎉</div>
        <h2
          className="font-(family-name:--font-display) text-[36px] leading-[0.95] tracking-tight"
          style={{ WebkitTextStroke: "0.4px var(--ink)" }}
        >
          접수됨 · 던져짐
        </h2>
        <p className="text-[13px] mt-3 font-mono leading-relaxed">
          채택되면 첫 화면에 박힘.
          <br />
          익명 보장 · 알림은 따로 없음
        </p>
        <Link
          href="/"
          className="brutal inline-block mt-6 px-6 py-3 bg-(--ink) text-(--paper) font-(family-name:--font-display) text-[18px] tracking-tight"
        >
          ← HOME
        </Link>
      </div>
    </section>
  );
}
