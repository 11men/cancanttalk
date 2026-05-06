"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAnonId } from "@/lib/anon";

type Result = { ok: true } | { ok: false; error: string };

export async function castVote(
  questionId: string,
  choice: boolean,
): Promise<Result> {
  const anonId = await getAnonId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("votes")
    .upsert(
      { anon_id: anonId, question_id: questionId, choice },
      { onConflict: "anon_id,question_id" },
    );

  if (error) {
    console.error("[castVote] supabase error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/categories/[slug]", "page");
  return { ok: true };
}
