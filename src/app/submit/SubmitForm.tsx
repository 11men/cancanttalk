"use client";

import { useActionState } from "react";
import {
  submitQuestion,
  type SubmitState,
} from "@/actions/submit-question";

type Category = { id: number; slug: string; name: string; emoji: string };
type Props = { categories: Category[] };

const initial: SubmitState = { ok: false };

export default function SubmitForm({ categories }: Props) {
  const [state, formAction, isPending] = useActionState(
    submitQuestion,
    initial,
  );

  return (
    <form action={formAction} className="brutal brutal-lg bg-(--paper) p-5 space-y-5">
      <label className="block">
        <span className="sticker bg-(--acid-lime) mb-2 inline-block">
          01 / CATEGORY
        </span>
        <select
          name="categoryId"
          required
          className="brutal w-full bg-(--paper) px-4 py-3 font-(family-name:--font-display) text-[18px] outline-none"
          defaultValue={categories[0]?.id}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.categoryId && (
          <p className="text-xs font-mono text-(--no) mt-1">
            ! {state.fieldErrors.categoryId}
          </p>
        )}
      </label>

      <label className="block">
        <span className="sticker bg-(--hot-cyan) mb-2 inline-block">
          02 / QUESTION
        </span>
        <textarea
          name="content"
          required
          minLength={5}
          maxLength={300}
          rows={5}
          placeholder="예) 지하철에서 최애 주제가 크게 틀고 리듬타기 가능?"
          className="brutal w-full bg-(--paper) px-4 py-3 text-sm resize-none outline-none font-medium leading-relaxed"
        />
        <p className="text-[10px] font-mono text-(--ink)/60 mt-1.5">
          ★ 질문은 &quot;~ 가능?&quot; 으로 끝내야 함 (국룰)
        </p>
        {state.fieldErrors?.content && (
          <p className="text-xs font-mono text-(--no) mt-1">
            ! {state.fieldErrors.content}
          </p>
        )}
      </label>

      <label className="block">
        <span className="sticker bg-(--acid-pink) text-(--paper) mb-2 inline-block">
          03 / SPICE LEVEL
        </span>
        <input
          type="number"
          name="difficulty"
          min={1}
          max={5}
          defaultValue={3}
          className="brutal w-full bg-(--paper) px-4 py-3 font-(family-name:--font-display) text-[18px] outline-none"
        />
        <p className="text-[10px] font-mono text-(--ink)/60 mt-1.5">
          1 순한맛 · 5 심연
        </p>
      </label>

      {state.error && !state.fieldErrors && (
        <div className="brutal bg-(--no) text-(--paper) p-3 font-mono text-xs">
          ! {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="brutal brutal-lg w-full py-5 bg-(--ink) text-(--paper) font-(family-name:--font-display) text-[22px] tracking-tight hover-glitch disabled:opacity-50"
      >
        {isPending ? "전송 중..." : "제보 발사 →"}
      </button>
    </form>
  );
}
