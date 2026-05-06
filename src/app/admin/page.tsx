import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminList, { type PendingQuestion } from "./AdminList";

export const dynamic = "force-dynamic";

async function setAdminKey(formData: FormData) {
  "use server";
  const key = String(formData.get("key") ?? "");
  const store = await cookies();
  store.set("admin_key", key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export default async function AdminPage() {
  const expected = process.env.ADMIN_KEY;
  const store = await cookies();
  const given = store.get("admin_key")?.value;

  if (!expected || given !== expected) {
    return (
      <section className="flex-1 flex items-center justify-center px-6 py-10">
        <form
          action={setAdminKey}
          className="brutal bg-(--paper) p-6 w-full max-w-sm space-y-3"
        >
          <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/70">
            ADMIN GATE
          </p>
          <h2 className="font-(family-name:--font-display) text-[28px] leading-none tracking-tight text-(--ink)">
            🔒 검수 진입
          </h2>
          <input
            type="password"
            name="key"
            placeholder="ADMIN KEY"
            required
            className="brutal w-full bg-(--paper) px-4 py-3 font-mono text-sm outline-none"
          />
          <button
            type="submit"
            className="brutal w-full py-3 bg-(--ink) text-(--paper) font-(family-name:--font-accent) text-xs tracking-wider"
          >
            ENTER
          </button>
          {!expected && (
            <div className="brutal bg-(--no) text-(--paper) p-3 font-mono text-[11px] leading-5">
              ! 서버에 <b>ADMIN_KEY</b> 환경변수가 없습니다. .env.local / Vercel env에 추가하고 재시작하세요.
            </div>
          )}
        </form>
      </section>
    );
  }

  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("questions")
    .select("id, content, difficulty, created_at, author_nickname, categories(name, emoji)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <section className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 py-6 sm:py-10">
      <div className="mb-5">
        <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/70">
          MODERATION QUEUE
        </p>
        <h2 className="font-(family-name:--font-display) text-[32px] leading-[0.95] tracking-tight mt-1 text-(--ink)">
          검수 대기 질문
        </h2>
      </div>
      <AdminList items={(pending as PendingQuestion[] | null) ?? []} />
    </section>
  );
}
