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
      <div className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 pt-8 sm:pt-12 pb-10 flex flex-col">
        {/* 상단 카테고리 배지 + 페이징 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="sticker bg-(--acid-pink) text-(--paper)">
              {category.emoji} {category.name}
            </span>
          </div>
          <div className="font-mono text-[11px] tracking-wider text-(--ink)/60">
            [{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}]
          </div>
        </div>

        {/* 질문 카드 — 호흡감 강화: 빈 공간 줄이고 스파이스는 코너에 chip으로 */}
        <div
          key={current.id}
          className="brutal brutal-lg bg-(--paper) p-7 sm:p-10 flex flex-col relative overflow-hidden animate-slide-up"
          role="article"
          aria-label={`챌린지 ${index + 1}번`}
        >
          {/* 우상단 스파이스 chip */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1 z-10"
            aria-label={`매운맛 ${current.difficulty}/5`}
          >
            {[1, 2, 3, 4, 5].map((d) => (
              <span
                key={d}
                className={`h-1.5 w-3 ${
                  d <= current.difficulty ? "bg-(--acid-pink)" : "bg-(--ink)/15"
                }`}
              />
            ))}
            <span className="font-mono text-[9px] font-bold ml-1 text-(--ink)/60 whitespace-nowrap">
              {DIFFICULTY_LABEL[current.difficulty]}
            </span>
          </div>

          {/* 배경 데코 (한 톤만, 약하게) */}
          <div
            aria-hidden
            className="absolute -bottom-10 -right-8 w-32 h-32 bg-(--acid-lime) rounded-full opacity-30 blur-md"
          />

          <div className="relative z-10 flex flex-col">
            <div className="font-(family-name:--font-accent) text-[11px] text-(--acid-pink) tracking-[0.2em] mb-5 mt-2">
              CHALLENGE #{String(index + 1).padStart(3, "0")}
            </div>
            <p className="font-(family-name:--font-display) text-[26px] sm:text-[34px] leading-[1.3] tracking-tight break-keep text-(--ink) mb-8">
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
                    className="brutal py-4 bg-(--yes) text-(--paper) font-(family-name:--font-display) text-[20px] tracking-tight hover:-translate-y-1 hover:translate-x-[-2px] disabled:opacity-50 min-h-[60px]"
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
                    className="brutal py-4 bg-(--no) text-(--paper) font-(family-name:--font-display) text-[20px] tracking-tight hover:-translate-y-1 hover:translate-x-[2px] disabled:opacity-50 min-h-[60px]"
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

        {/* 하단 네비 — secondary 위계 (보더 2px) */}
        {items.length > 1 && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => change(-1)}
              className="bg-(--paper) border-2 border-(--ink) py-3 font-(family-name:--font-accent) text-[12px] tracking-wider text-(--ink) min-h-[44px] hover:bg-(--paper-tint) transition-colors"
              aria-label="이전 챌린지"
            >
              ← PREV
            </button>
            <button
              type="button"
              onClick={() => change(1)}
              className="bg-(--paper) border-2 border-(--ink) py-3 font-(family-name:--font-accent) text-[12px] tracking-wider text-(--ink) min-h-[44px] hover:bg-(--acid-lime) transition-colors"
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
