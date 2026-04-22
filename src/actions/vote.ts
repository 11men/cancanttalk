"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

export async function castVote(
  questionId: string,
  choice: boolean,
): Promise<Result> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  // upsert: 이미 투표했으면 choice만 업데이트
  const { error } = await supabase
    .from("votes")
    .upsert(
      { user_id: user.id, question_id: questionId, choice },
      { onConflict: "user_id,question_id" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/categories/[slug]", "page");
  return { ok: true };
}
