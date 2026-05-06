"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAnonId, normalizeNickname, setStoredNickname } from "@/lib/anon";

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
  nickname: z.string().min(1).max(20),
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
  const nickname = normalizeNickname(formData.get("nickname") as string | null);
  const parsed = schema.safeParse({
    categoryId: formData.get("categoryId"),
    content: formData.get("content"),
    difficulty: formData.get("difficulty"),
    nickname,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { ok: false, error: "입력값을 확인해주세요", fieldErrors };
  }

  const anonId = await getAnonId();
  const supabase = await createClient();

  const { error } = await supabase.from("questions").insert({
    category_id: parsed.data.categoryId,
    content: parsed.data.content,
    anon_id: anonId,
    author_nickname: parsed.data.nickname,
    difficulty: parsed.data.difficulty,
    status: "pending",
  });

  if (error) {
    console.error("[submitQuestion] supabase error:", error);
    return { ok: false, error: error.message };
  }

  await setStoredNickname(parsed.data.nickname);
  redirect("/submit/success");
}
