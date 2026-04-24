import Link from "next/link";
import BackButton from "./BackButton";

export default function Header() {
  return (
    <header className="relative z-20 bg-(--paper) border-b-[3px] border-(--ink)">
      <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <BackButton />
        <Link href="/" className="group flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block w-7 h-7 bg-(--acid-lime) border-[2.5px] border-(--ink) rounded-full flex items-center justify-center text-[14px] group-hover:rotate-12 transition-transform"
          >
            ✦
          </span>
          <h1
            className="font-(family-name:--font-display) text-[22px] leading-none tracking-tight"
            style={{ WebkitTextStroke: "0.5px var(--ink)" }}
          >
            찐력챌린지
          </h1>
        </Link>
        <Link
          href="/ranking"
          className="sticker bg-(--hot-cyan)"
          aria-label="랭킹"
        >
          🏆 RANK
        </Link>
      </div>
    </header>
  );
}
