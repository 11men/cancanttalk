"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

async function isAdmin(): Promise<boolean> {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return false;
  const store = await cookies();
  return store.get("admin_key")?.value === expected;
}

export async function moderateQuestion(
  questionId: string,
  action: "approve" | "reject",
): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "권한이 없습니다" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("questions")
    .update({ status: action === "approve" ? "approved" : "rejected" })
    .eq("id", questionId);

  if (error) {
    console.error("[moderateQuestion] supabase error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}
