"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ensureAnonSession } from "@/actions/auth";
import { moderate } from "@/lib/moderation/badwords";

type Result = { ok: true } | { ok: false; error: string };

const commentSchema = z.object({
  questionId: z.string().uuid(),
  content: z.string().min(1).max(500),
});

export async function createComment(
  questionId: string,
  content: string,
): Promise<Result> {
  const parsed = commentSchema.safeParse({ questionId, content });
  if (!parsed.success) return { ok: false, error: "입력이 올바르지 않습니다" };

  const user = await ensureAnonSession();
  if (!user) return { ok: false, error: "세션을 만들 수 없습니다" };

  const supabase = await createClient();

  const check = moderate(parsed.data.content);
  if (!check.ok) {
    await supabase.from("moderation_blocks").insert({
      user_id: user.id,
      kind: "comment",
      content: parsed.data.content,
      reason: check.reason,
      matched: check.matched,
    });
    return {
      ok: false,
      error: `전송 차단: ${check.reason} 감지 — 표현을 다시 써주세요`,
    };
  }

  const { error } = await supabase.from("comments").insert({
    question_id: parsed.data.questionId,
    user_id: user.id,
    content: parsed.data.content,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/categories/[slug]", "page");
  return { ok: true };
}

export async function toggleBestComment(commentId: string): Promise<Result> {
  const user = await ensureAnonSession();
  if (!user) return { ok: false, error: "세션을 만들 수 없습니다" };

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false, error: "권한이 없습니다" };

  const { data: comment } = await supabase
    .from("comments")
    .select("is_best, question_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment) return { ok: false, error: "댓글을 찾을 수 없습니다" };

  const { error } = await supabase
    .from("comments")
    .update({ is_best: !comment.is_best })
    .eq("id", commentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/categories/[slug]", "page");
  return { ok: true };
}

export async function reactToComment(
  commentId: string,
  reaction: "like" | "dislike",
): Promise<Result> {
  const user = await ensureAnonSession();
  if (!user) return { ok: false, error: "세션을 만들 수 없습니다" };

  const supabase = await createClient();

  // 토글: 같은 반응이면 삭제, 다르면 upsert
  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("reaction")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.reaction === reaction) {
    await supabase
      .from("comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("comment_reactions").upsert(
      { comment_id: commentId, user_id: user.id, reaction },
      { onConflict: "comment_id,user_id" },
    );
  }

  revalidatePath("/categories/[slug]", "page");
  return { ok: true };
}
