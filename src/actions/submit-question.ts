"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ensureAnonSession } from "@/actions/auth";
import { moderate } from "@/lib/moderation/badwords";

const schema = z.object({
  categoryId: z.coerce.number().int().positive(),
  content: z
    .string()
    .min(5, "최소 5자 이상")
    .max(300, "최대 300자")
    .refine((s) => s.trim().endsWith("가능?"), {
      message: "질문은 '~ 가능?' 으로 끝나야 합니다",
    }),
  difficulty: z.coerce.number().int().min(1).max(5).default(3),
});

export type SubmitState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitQuestion(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const parsed = schema.safeParse({
    categoryId: formData.get("categoryId"),
    content: formData.get("content"),
    difficulty: formData.get("difficulty"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { ok: false, error: "입력값을 확인해주세요", fieldErrors };
  }

  const user = await ensureAnonSession();
  if (!user) return { ok: false, error: "세션을 만들 수 없습니다" };

  const supabase = await createClient();

  const check = moderate(parsed.data.content);
  if (!check.ok) {
    await supabase.from("moderation_blocks").insert({
      user_id: user.id,
      kind: "question",
      content: parsed.data.content,
      reason: check.reason,
      matched: check.matched,
    });
    return {
      ok: false,
      error: `등록 차단: ${check.reason} 감지 — 표현을 다시 써주세요`,
    };
  }

  const { error } = await supabase.from("questions").insert({
    category_id: parsed.data.categoryId,
    content: parsed.data.content,
    author_id: user.id,
    difficulty: parsed.data.difficulty,
    status: "pending",
  });

  if (error) return { ok: false, error: error.message };

  redirect("/submit/success");
}
