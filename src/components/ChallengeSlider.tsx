"use client";

import { useState, useTransition } from "react";
import { castVote } from "@/actions/vote";
import CommentSheet from "./CommentSheet";
import ResultGauge from "./ResultGauge";
import { getCardTease } from "@/lib/hook-copy";

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
  initialNickname?: string;
};

const DIFFICULTY_LABEL = ["", "순한맛", "미지근", "보통맛", "매운맛", "심연"];

export default function ChallengeSlider({ category, items, initialNickname }: Props) {
  const [index, setIndex] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  // 투표 후 카운트도 옵티미스틱하게 반영 (DB 트리거가 채워주지만 UI는 즉시)
  const [voteBoost, setVoteBoost] = useState<
    Record<string, { yes: number; total: number }>
  >({});

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-5 text-(--ink)/60">
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

  const boost = voteBoost[current.id];
  const yesCount = current.yes_count + (boost?.yes ?? 0);
  const totalCount = current.vote_count + (boost?.total ?? 0);
  const yesPct =
    totalCount > 0 ? Math.round((yesCount / totalCount) * 100) : 50;
  const noPct = 100 - yesPct;

  function change(dir: number) {
    setIndex((i) => (i + dir + items.length) % items.length);
  }

  function handleVote(choice: boolean) {
    setOptimistic((m) => ({ ...m, [current.id]: choice }));
    setVoteBoost((m) => ({
      ...m,
      [current.id]: {
        yes: (m[current.id]?.yes ?? 0) + (choice ? 1 : 0),
        total: (m[current.id]?.total ?? 0) + 1,
      },
    }));
    startTransition(async () => {
      const res = await castVote(current.id, choice);
      if (!res.ok) {
        setOptimistic((m) => {
          const { [current.id]: _omit, ...rest } = m;
          return rest;
        });
        setVoteBoost((m) => {
          const { [current.id]: _omit, ...rest } = m;
          return rest;
        });
        alert(res.error ?? "투표 실패");
      }
    });
  }

  return (
    <>
      <div className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 pt-5 sm:pt-8 pb-6 flex flex-col">
        {/* 상단 카테고리 배지 + 페이징 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="sticker bg-(--acid-pink) text-(--paper)">
              {category.emoji} {category.name}
            </span>
          </div>
          <div className="font-mono text-[11px] tracking-wider text-(--ink)/70">
            [{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}]
          </div>
        </div>

        {/* 난이도 표시 */}
        <div className="flex items-center gap-1.5 mb-3">
          {[1, 2, 3, 4, 5].map((d) => (
            <span
              key={d}
              className={`h-2 flex-1 border-2 border-(--ink) ${
                d <= current.difficulty ? "bg-(--acid-pink)" : "bg-(--paper)"
              }`}
            />
          ))}
          <span className="font-mono text-[10px] font-bold ml-2 text-(--ink)/70 whitespace-nowrap">
            {DIFFICULTY_LABEL[current.difficulty]}
          </span>
        </div>

        {/* 질문 카드 */}
        <div
          key={current.id}
          className="brutal brutal-lg bg-(--paper) p-6 sm:p-8 flex flex-col relative overflow-hidden animate-slide-up"
          style={{ minHeight: 380 }}
          role="article"
          aria-label={`챌린지 ${index + 1}번`}
        >
          {/* 배경 데코 */}
          <div
            aria-hidden
            className="absolute -top-6 -right-6 w-32 h-32 bg-(--acid-lime) rounded-full opacity-50 blur-sm"
          />
          <div
            aria-hidden
            className="absolute bottom-16 -left-10 w-20 h-20 bg-(--hot-cyan) rounded-full opacity-40 blur-sm"
          />

          <div className="relative z-10 flex-1 flex flex-col">
            <div className="font-(family-name:--font-accent) text-[11px] text-(--acid-pink) tracking-[0.2em] mb-4">
              CHALLENGE #{String(index + 1).padStart(3, "0")}
            </div>
            <p className="font-(family-name:--font-display) text-[26px] sm:text-[32px] leading-[1.25] tracking-tight flex-1 break-keep text-(--ink)">
              {current.content}
            </p>
          </div>

          <div className="relative z-10 mt-6">
            {voted ? (
              <div className="animate-bounce-in">
                <ResultGauge
                  yesPct={yesPct}
                  noPct={noPct}
                  myChoice={myChoice}
                  totalCount={totalCount}
                />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => change(1)}
                    className="brutal py-3.5 bg-(--acid-lime) text-(--ink) font-(family-name:--font-accent) text-[13px] tracking-wider"
                  >
                    다음꺼 더 미친 거 →
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="brutal py-3.5 bg-(--ink) text-(--paper) font-(family-name:--font-accent) text-[13px] tracking-wider"
                  >
                    💬 댓글 보러 ↓
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-mono text-[11px] text-(--ink)/70 mb-2.5 text-center">
                  ↳ {getCardTease(totalCount, yesCount)}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleVote(true)}
                    className="brutal py-5 bg-(--yes) text-(--paper) font-(family-name:--font-display) text-[22px] tracking-tight hover:-translate-y-1 hover:translate-x-[-2px] disabled:opacity-50 min-h-[64px]"
                    aria-label="가능 투표"
                  >
                    가능!
                    <div className="text-[10px] font-mono font-bold opacity-80 mt-0.5">
                      ㅇㅇ 가능각
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleVote(false)}
                    className="brutal py-5 bg-(--no) text-(--paper) font-(family-name:--font-display) text-[22px] tracking-tight hover:-translate-y-1 hover:translate-x-[2px] disabled:opacity-50 min-h-[64px]"
                    aria-label="불가능 투표"
                  >
                    불가능
                    <div className="text-[10px] font-mono font-bold opacity-80 mt-0.5">
                      ㄴㄴ 이건 못참
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 하단 네비 */}
        {items.length > 1 && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => change(-1)}
              className="brutal py-3 bg-(--paper) font-(family-name:--font-accent) text-[13px] tracking-wider text-(--ink) min-h-[44px]"
              aria-label="이전 챌린지"
            >
              ← PREV
            </button>
            <button
              type="button"
              onClick={() => change(1)}
              className="brutal py-3 bg-(--acid-lime) font-(family-name:--font-accent) text-[13px] tracking-wider text-(--ink) min-h-[44px]"
              aria-label="다음 챌린지"
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
        initialNickname={initialNickname}
      />
    </>
  );
}
