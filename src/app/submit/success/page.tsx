import Link from "next/link";

export default function SubmitSuccessPage() {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="brutal brutal-lg w-full bg-(--acid-lime) p-8 text-center relative">
        <span className="sticker absolute -top-4 left-1/2 -translate-x-1/2 bg-(--ink) text-(--acid-lime)">
          ✓ SUCCESS
        </span>
        <div className="text-7xl mb-4 animate-bounce-in">🎉</div>
        <h2
          className="font-(family-name:--font-display) text-[36px] leading-[0.95] tracking-tight"
          style={{ WebkitTextStroke: "0.4px var(--ink)" }}
        >
          발사 완료!
        </h2>
        <p className="text-[13px] mt-3 font-mono">
          검수 후 승인되면
          <br />
          모두의 챌린지에 등장 ✦
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
