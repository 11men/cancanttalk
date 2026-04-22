"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") {
    return (
      <span className="sticker bg-[var(--acid-lime)]" aria-hidden>
        LIVE
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="sticker bg-[var(--paper)] hover:bg-[var(--acid-pink)] hover:text-[var(--paper)] transition-colors"
    >
      ← BACK
    </button>
  );
}
