"use client";

import { useTransition } from "react";
import { moderateQuestion } from "@/actions/moderate";

export type PendingQuestion = {
  id: string;
  content: string;
  difficulty: number;
  created_at: string;
  categories: { name: string; emoji: string } | null;
};

export default function AdminList({ items }: { items: PendingQuestion[] }) {
  const [isPending, startTransition] = useTransition();

  function act(id: string, action: "approve" | "reject") {
    startTransition(async () => {
      const res = await moderateQuestion(id, action);
      if (!res.ok) alert(res.error);
    });
  }

  if (items.length === 0)
    return (
      <div className="brutal bg-[var(--paper)] p-8 text-center">
        <div className="text-5xl mb-2">✨</div>
        <p className="font-[family-name:var(--font-display)] text-[18px]">
          대기 중인 제보 없음
        </p>
      </div>
    );

  return (
    <ul className="space-y-3">
      {items.map((q) => (
        <li key={q.id} className="brutal bg-[var(--paper)] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="sticker bg-[var(--hot-cyan)]">
              {q.categories?.emoji} {q.categories?.name}
            </span>
            <span className="font-mono text-[10px] text-[var(--ink)]/60">
              SPICE {q.difficulty}/5
            </span>
          </div>
          <p className="text-sm font-medium break-keep leading-relaxed mb-4">
            {q.content}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => act(q.id, "approve")}
              className="brutal py-2.5 bg-[var(--yes)] text-[var(--paper)] font-[family-name:var(--font-accent)] text-xs tracking-wider disabled:opacity-50"
            >
              ✓ APPROVE
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => act(q.id, "reject")}
              className="brutal py-2.5 bg-[var(--no)] text-[var(--paper)] font-[family-name:var(--font-accent)] text-xs tracking-wider disabled:opacity-50"
            >
              ✕ REJECT
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
