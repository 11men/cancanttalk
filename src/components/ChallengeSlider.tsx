"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { castVote } from "@/actions/vote";
import CommentSheet from "./CommentSheet";
import ResultGauge from "./ResultGauge";

export type QuestionWithMeta = {
  id: string;
  content: string;
  vote_count: number;
  yes_count: number;
  difficulty: number;
  myChoice: boolean | null;
};

type Props = {
  category: { name: string; emoji: string };
  items: QuestionWithMeta[];
  isAuthed: boolean;
};

const DIFFICULTY_LABEL = ["", "순한맛", "미지근", "보통맛", "매운맛", "심연"];

export default function ChallengeSlider({ category, items, isAuthed }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-5 text-[var(--ink)]/60">
        <p className="font-mono text-sm">NO QUESTIONS YET</p>
      </div>
    );
  }

  const current = items[index];
  const myChoice =
    optimistic[current.id] !== undefined
      ? optimistic[current.id]
      : current.myChoice;
  const voted = myChoice !== null;

  const yesPct =
    current.vote_count > 0
      ? Math.round((current.yes_count / current.vote_count) * 100)
      : 50;
  const noPct = 100 - yesPct;

  function change(dir: number) {
    setIndex((i) => (i + dir + items.length) % items.length);
  }

  function handleVote(choice: boolean) {
    if (!isAuthed) {
      if (confirm("로그인 후 투표 가능. 로그인할래?")) router.push("/login");
      return;
    }
    setOptimistic((m) => ({ ...m, [current.id]: choice }));
    startTransition(async () => {
      const res = await castVote(current.id, choice);
      if (!res.ok) {
        setOptimistic((m) => {
          const { [current.id]: _omit, ...rest } = m;
          return rest;
        });
        alert(res.error ?? "투표 실패");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex-1 px-5 pt-5 pb-6 flex flex-col">
        {/* 상단 카테고리 배지 + 페이징 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="sticker bg-[var(--acid-pink)] text-[var(--paper)]">
              {category.emoji} {category.name}
            </span>
          </div>
          <div className="font-mono text-[11px] tracking-wider text-[var(--ink)]/70">
            [{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}]
          </div>
        </div>

        {/* 난이도 표시 */}
        <div className="flex items-center gap-1.5 mb-3">
          {[1, 2, 3, 4, 5].map((d) => (
            <span
              key={d}
              className={`h-2 flex-1 border-2 border-[var(--ink)] ${
                d <= current.difficulty ? "bg-[var(--acid-pink)]" : "bg-[var(--paper)]"
              }`}
            />
          ))}
          <span className="font-mono text-[10px] font-bold ml-2 text-[var(--ink)]/70 whitespace-nowrap">
            {DIFFICULTY_LABEL[current.difficulty]}
          </span>
        </div>

        {/* 질문 카드 */}
        <div
          key={current.id}
          className="brutal brutal-lg flex-1 bg-[var(--paper)] p-6 flex flex-col relative overflow-hidden animate-slide-up"
          style={{ minHeight: 380 }}
        >
          {/* 배경 데코 */}
          <div
            aria-hidden
            className="absolute -top-6 -right-6 w-32 h-32 bg-[var(--acid-lime)] rounded-full opacity-50 blur-sm"
          />
          <div
            aria-hidden
            className="absolute bottom-16 -left-10 w-20 h-20 bg-[var(--hot-cyan)] rounded-full opacity-40 blur-sm"
          />

          <div className="relative z-10 flex-1 flex flex-col">
            <div className="font-[family-name:var(--font-accent)] text-[11px] text-[var(--acid-pink)] tracking-[0.2em] mb-4">
              CHALLENGE #{String(index + 1).padStart(3, "0")}
            </div>
            <p
              className="font-[family-name:var(--font-display)] text-[26px] leading-[1.25] tracking-tight flex-1 break-keep"
              style={{ WebkitTextStroke: "0.3px var(--ink)" }}
            >
              {current.content}
            </p>
          </div>

          <div className="relative z-10 mt-6">
            {voted ? (
              <div className="animate-bounce-in">
                <ResultGauge yesPct={yesPct} noPct={noPct} myChoice={myChoice} />
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="brutal w-full mt-3 py-3 bg-[var(--ink)] text-[var(--paper)] font-[family-name:var(--font-accent)] text-[13px] tracking-wider"
                >
                  💬 실시간 반응 보기 →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleVote(true)}
                  className="brutal py-5 bg-[var(--yes)] text-[var(--paper)] font-[family-name:var(--font-display)] text-[22px] tracking-tight hover:-translate-y-1 hover:translate-x-[-2px] disabled:opacity-50"
                >
                  가능!
                  <div className="text-[10px] font-mono font-bold opacity-80 mt-0.5">
                    YES / 찐력 인증
                  </div>
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleVote(false)}
                  className="brutal py-5 bg-[var(--no)] text-[var(--paper)] font-[family-name:var(--font-display)] text-[22px] tracking-tight hover:-translate-y-1 hover:translate-x-[2px] disabled:opacity-50"
                >
                  불가능
                  <div className="text-[10px] font-mono font-bold opacity-80 mt-0.5">
                    NO / 인간은 이성적
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 하단 네비 */}
        {items.length > 1 && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => change(-1)}
              className="brutal py-3 bg-[var(--paper)] font-[family-name:var(--font-accent)] text-[13px] tracking-wider"
            >
              ← PREV
            </button>
            <button
              type="button"
              onClick={() => change(1)}
              className="brutal py-3 bg-[var(--acid-lime)] font-[family-name:var(--font-accent)] text-[13px] tracking-wider"
            >
              NEXT →
            </button>
          </div>
        )}
      </div>

      <CommentSheet
        questionId={current.id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        isAuthed={isAuthed}
      />
    </>
  );
}
