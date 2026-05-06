"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAnonId, normalizeNickname, setStoredNickname } from "@/lib/anon";

type Result = { ok: true } | { ok: false; error: string };

const commentSchema = z.object({
  questionId: z.string().uuid(),
  content: z.string().min(1).max(500),
  nickname: z.string().min(1).max(20),
  parentId: z.string().uuid().nullable().optional(),
});

export async function createComment(
  questionId: string,
  content: string,
  nickname: string,
  parentId: string | null = null,
): Promise<Result> {
  const normalized = normalizeNickname(nickname);
  const parsed = commentSchema.safeParse({
    questionId,
    content,
    nickname: normalized,
    parentId,
  });
  if (!parsed.success) return { ok: false, error: "입력이 올바르지 않습니다" };

  const anonId = await getAnonId();
  const supabase = await createClient();

  const { error } = await supabase.from("comments").insert({
    question_id: parsed.data.questionId,
    parent_id: parsed.data.parentId ?? null,
    anon_id: anonId,
    nickname: parsed.data.nickname,
    content: parsed.data.content,
  });

  if (error) {
    console.error("[createComment] supabase error:", error);
    return { ok: false, error: error.message };
  }

  await setStoredNickname(parsed.data.nickname);
  revalidatePath("/categories/[slug]", "page");
  return { ok: true };
}

export async function reactToComment(
  commentId: string,
  reaction: "like" | "dislike",
): Promise<Result> {
  const anonId = await getAnonId();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("reaction")
    .eq("comment_id", commentId)
    .eq("anon_id", anonId)
    .maybeSingle();

  if (existing?.reaction === reaction) {
    const { error } = await supabase
      .from("comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("anon_id", anonId);
    if (error) {
      console.error("[reactToComment delete] supabase error:", error);
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase.from("comment_reactions").upsert(
      { comment_id: commentId, anon_id: anonId, reaction },
      { onConflict: "comment_id,anon_id" },
    );
    if (error) {
      console.error("[reactToComment upsert] supabase error:", error);
      return { ok: false, error: error.message };
    }
  }

  revalidatePath("/categories/[slug]", "page");
  return { ok: true };
}
