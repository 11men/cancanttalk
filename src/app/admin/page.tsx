import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminList, { type PendingQuestion } from "./AdminList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return (
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="brutal bg-(--no) text-(--paper) p-6 text-center">
          <div className="text-4xl mb-2">🚫</div>
          <p className="font-(family-name:--font-display) text-[20px]">
            ADMIN ONLY
          </p>
          <code className="font-mono text-[10px] opacity-80 block mt-2">
            profiles.is_admin = true
          </code>
        </div>
      </section>
    );
  }

  const { data: pending } = await supabase
    .from("questions")
    .select("id, content, difficulty, created_at, categories(name, emoji)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <section className="flex-1 px-5 py-6">
      <div className="mb-5">
        <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/70">
          MODERATION QUEUE
        </p>
        <h2
          className="font-(family-name:--font-display) text-[32px] leading-[0.95] tracking-tight mt-1"
          style={{ WebkitTextStroke: "0.4px var(--ink)" }}
        >
          검수 대기 질문
        </h2>
      </div>
      <AdminList items={(pending as PendingQuestion[] | null) ?? []} />
    </section>
  );
}
