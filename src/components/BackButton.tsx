"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") {
    return (
      <span className="sticker bg-(--acid-lime)" aria-hidden>
        LIVE
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="sticker bg-(--paper) hover:bg-(--acid-pink) hover:text-(--paper) transition-colors"
    >
      ← BACK
    </button>
  );
}
